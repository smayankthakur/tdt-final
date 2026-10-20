-- =============================================================================
-- The Divine Tarot — unified platform schema (one Supabase project for everything)
-- Run AFTER 01–04 in the Supabase SQL editor. Safe to re-run (idempotent).
--
--   Accounts ............ profiles (1:1 with auth.users) + signup trigger
--   Ginni Ki Baatein .... chat_messages, reading_orders, ai_readings
--                         consume_reading(), credit_reading_order()
--   Personal Reading .... pr_orders, pr_bookings, pr_problems, pr_config
--                         pr_hold_slot(), pr_mark_paid(), pr_claim_slot()
--   Support ............. support_tickets + private storage bucket "support-uploads"
--   Newsletter .......... newsletter_subscribers gets phone/last-sent columns
--   Rate limiting ....... rate_events + rate_hit()
--
-- Security model: RLS is ON for every table. Signed-in users may READ their own
-- profile, chat and orders (nothing else). Every write goes through the
-- server (service-role key) after the API route has checked who is calling,
-- and all money/slot logic runs inside the SECURITY DEFINER functions below,
-- which only the service role may execute.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Accounts
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  name                 text,
  readings_used        integer not null default 0 check (readings_used >= 0),
  bonus_readings       integer not null default 0 check (bonus_readings >= 0),
  subscription_expires timestamptz,
  referral_code        text not null unique,
  referred_by          uuid references public.profiles(id) on delete set null,
  referral_rewarded    boolean not null default false,
  legacy_id            text unique,          -- id from the old Prisma "User" table, if migrated
  source               text not null default 'site', -- 'site' | 'legacy-chat' | 'legacy-reading' (cleanup only touches 'site')
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_profiles_email on public.profiles (lower(email));
alter table public.profiles add column if not exists source text not null default 'site';
create index if not exists idx_profiles_unpaid on public.profiles (created_at) where subscription_expires is null;

-- 8 characters, no 0/O/1/I so it can be read aloud.
create or replace function public.gen_referral_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  return code;
end $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Every new auth user gets a profile. Name / referrer come from the metadata
-- that /api/auth/signup passes to auth.admin.createUser().
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_ref uuid;
begin
  -- Anonymous sign-ins (used by the old chat app) and phone-only users get no
  -- profile: the site's reading account needs an email.
  if coalesce((to_jsonb(new)->>'is_anonymous')::boolean, false) or new.email is null then
    return new;
  end if;
  begin
    v_ref := nullif(new.raw_user_meta_data->>'referred_by', '')::uuid;
  exception when others then
    v_ref := null;
  end;
  if v_ref is not null and not exists (select 1 from public.profiles where id = v_ref) then
    v_ref := null;
  end if;
  insert into public.profiles (id, email, name, referral_code, referred_by, legacy_id)
  values (
    new.id,
    lower(new.email),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    coalesce(nullif(new.raw_user_meta_data->>'referral_code', ''), public.gen_referral_code()),
    v_ref,
    nullif(new.raw_user_meta_data->>'legacy_id', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing email/password users of this project (e.g. the old chat app) get a
-- profile too, so they can log in on /reading with their current password.
-- Any premium they already paid for on the old app carries over.
do $$
begin
  if to_regclass('public.ginni_access') is not null then
    insert into public.profiles (id, email, name, referral_code, source, subscription_expires, created_at)
    select u.id, lower(u.email), nullif(trim(u.raw_user_meta_data->>'name'), ''), public.gen_referral_code(), 'legacy-chat',
           case when g.premium_until > now() then g.premium_until end, u.created_at
      from auth.users u
      left join public.ginni_access g on g.user_id = u.id
     where not coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) and u.email is not null
    on conflict (id) do nothing;
  else
    insert into public.profiles (id, email, name, referral_code, source, created_at)
    select u.id, lower(u.email), nullif(trim(u.raw_user_meta_data->>'name'), ''), public.gen_referral_code(), 'legacy-chat', u.created_at
      from auth.users u
     where not coalesce((to_jsonb(u)->>'is_anonymous')::boolean, false) and u.email is not null
    on conflict (id) do nothing;
  end if;
end $$;

-- Keep profiles.email in step if a user changes their email in Supabase Auth.
create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.profiles set email = lower(new.email) where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Ginni Ki Baatein (reading chat)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('user', 'ginni')),
  kind       text not null check (kind in ('text', 'reveal')),
  text       text check (char_length(text) <= 4000),
  card       text check (char_length(card) <= 100),
  ai_mode    boolean not null default false,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists idx_chat_user_time on public.chat_messages (user_id, created_at desc);

-- Keep only the newest 30 messages per reader.
create or replace function public.prune_chat_messages() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.chat_messages
  where user_id = new.user_id
    and id not in (
      select id from public.chat_messages
      where user_id = new.user_id
      order by created_at desc
      limit 30
    );
  return null;
end $$;
drop trigger if exists trg_prune_chat on public.chat_messages;
create trigger trg_prune_chat after insert on public.chat_messages
  for each row execute function public.prune_chat_messages();

create table if not exists public.reading_orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  razorpay_order_id   text not null unique,
  amount              integer not null,              -- paise
  status              text not null default 'created' check (status in ('created', 'paid')),
  razorpay_payment_id text unique,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists idx_reading_orders_user on public.reading_orders (user_id, created_at desc);

create table if not exists public.ai_readings (
  id         uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id    uuid references public.profiles(id) on delete cascade,
  card       text not null,
  text       text not null,
  created_at timestamptz not null default now()
);

-- Spend one reading credit atomically. Subscribers never call this.
create or replace function public.consume_reading(p_user uuid, p_free_limit integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_ok boolean;
begin
  update public.profiles
     set readings_used = readings_used + 1
   where id = p_user
     and (
       (subscription_expires is not null and subscription_expires > now())
       or readings_used < p_free_limit + bonus_readings
     )
  returning true into v_ok;
  return coalesce(v_ok, false);
end $$;

-- Mark a ₹199 pass order paid and extend the pass — exactly once.
-- Returns {not_found} | {wrong_user} | {already_credited, user_id} | {user_id}.
create or replace function public.credit_reading_order(
  p_razorpay_order_id   text,
  p_razorpay_payment_id text,
  p_expect_user         uuid,
  p_days                integer,
  p_referral_bonus      integer
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o public.reading_orders%rowtype;
  p public.profiles%rowtype;
  v_base timestamptz;
begin
  select * into o from public.reading_orders where razorpay_order_id = p_razorpay_order_id for update;
  if not found then return jsonb_build_object('not_found', true); end if;
  if p_expect_user is not null and o.user_id <> p_expect_user then
    return jsonb_build_object('wrong_user', true);
  end if;
  if o.status = 'paid' then
    return jsonb_build_object('already_credited', true, 'user_id', o.user_id);
  end if;

  update public.reading_orders
     set status = 'paid', razorpay_payment_id = coalesce(p_razorpay_payment_id, razorpay_payment_id), paid_at = now()
   where id = o.id;

  select * into p from public.profiles where id = o.user_id for update;
  v_base := greatest(coalesce(p.subscription_expires, now()), now());

  update public.profiles
     set subscription_expires = v_base + make_interval(days => p_days),
         bonus_readings = bonus_readings + case when p.referred_by is not null and not p.referral_rewarded then p_referral_bonus else 0 end,
         referral_rewarded = referral_rewarded or (p.referred_by is not null)
   where id = p.id;

  if p.referred_by is not null and not p.referral_rewarded then
    update public.profiles set bonus_readings = bonus_readings + p_referral_bonus where id = p.referred_by;
  end if;

  return jsonb_build_object('user_id', o.user_id);
end $$;

-- -----------------------------------------------------------------------------
-- Personal Reading (voice/Meet call bookings) — was Firestore
-- Times are epoch milliseconds to match the booking engine (src/lib/booking/slots.ts).
-- Slot keys are "YYYY-MM-DDTHH:MM" in IST.
-- -----------------------------------------------------------------------------
create table if not exists public.pr_orders (
  bid          text primary key check (bid ~ '^[A-Za-z0-9]{8,20}$'),
  status       text not null default 'created' check (status in ('created', 'paid')),
  tier         text not null check (tier in ('standard', 'urgent')),
  amount       integer not null,                 -- rupees
  held_slot    text,
  origin       text,
  plink_id     text unique,
  payment_id   text,
  email        text,
  phone        text,
  name         text,
  slot         text,
  meet_link    text,
  form_done    boolean not null default false,
  created_at_ms bigint not null,
  paid_at_ms   bigint,
  form_at_ms   bigint
);
create index if not exists idx_pr_orders_created on public.pr_orders (created_at_ms desc);

create table if not exists public.pr_bookings (
  slot_key       text primary key check (slot_key ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  status         text not null check (status in ('held', 'confirmed')),
  tier           text not null,
  bid            text not null references public.pr_orders(bid) on delete cascade,
  hold_until_ms  bigint,
  name           text,
  email          text,
  phone          text,
  payment_id     text,
  form_done      boolean not null default false,
  answers        json,                           -- json (not jsonb) keeps question order
  meet_link      text,
  event_id       text,
  calendar_ok    boolean,
  calendar_err   text,
  client_mail_ok boolean,
  owner_mail_ok  boolean,
  mail_err       text,
  created_at_ms  bigint not null
);
create index if not exists idx_pr_bookings_status on public.pr_bookings (status);
create unique index if not exists idx_pr_bookings_one_confirmed_per_order on public.pr_bookings (bid) where status = 'confirmed';

create table if not exists public.pr_problems (
  id       bigserial primary key,
  bid      text,
  plink_id text,
  why      text,
  at       timestamptz not null default now()
);

create table if not exists public.pr_config (
  id         text primary key,                   -- 'schedule2026'
  cfg        jsonb not null,
  updated_at timestamptz not null default now()
);

-- Hold the first free candidate slot (urgent bookings, before payment).
create or replace function public.pr_hold_slot(
  p_bid text, p_tier text, p_candidates text[], p_hold_until bigint, p_now bigint
) returns text
language plpgsql security definer set search_path = public as $$
declare
  k text;
  v text;
begin
  foreach k in array p_candidates loop
    v := null;
    insert into public.pr_bookings (slot_key, status, tier, bid, hold_until_ms, created_at_ms)
    values (k, 'held', p_tier, p_bid, p_hold_until, p_now)
    on conflict (slot_key) do update
      set status = 'held', tier = excluded.tier, bid = excluded.bid,
          hold_until_ms = excluded.hold_until_ms, created_at_ms = excluded.created_at_ms
      where public.pr_bookings.status = 'held' and coalesce(public.pr_bookings.hold_until_ms, 0) <= p_now
    returning slot_key into v;
    if v is not null then return v; end if;
  end loop;
  return null;
end $$;

-- Mark a booking order paid exactly once; keeps an urgent hold until the slot time.
-- Returns the order's tier when THIS call flipped it, else null.
create or replace function public.pr_mark_paid(
  p_bid text, p_plink_id text, p_payment_id text, p_email text, p_phone text, p_now bigint
) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.pr_orders%rowtype;
begin
  select * into o from public.pr_orders where bid = p_bid for update;
  if not found or o.plink_id is distinct from p_plink_id then
    insert into public.pr_problems (bid, plink_id, why)
    values (p_bid, p_plink_id, 'paid but order missing/mismatch — check & refund manually');
    return null;
  end if;
  if o.status <> 'created' then return null; end if;

  update public.pr_orders
     set status = 'paid', payment_id = p_payment_id, email = p_email, phone = p_phone, paid_at_ms = p_now
   where bid = p_bid;

  if o.held_slot is not null then
    update public.pr_bookings
       set hold_until_ms = (extract(epoch from (o.held_slot || ':00+05:30')::timestamptz) * 1000)::bigint
     where slot_key = o.held_slot and bid = p_bid and status = 'held';
  end if;
  return o.tier;
end $$;

-- Claim the first free candidate for a paid order when the form is submitted.
-- Returns 'done' (form already submitted), 'taken' (no candidate free) or the slot key.
create or replace function public.pr_claim_slot(
  p_bid text, p_candidates text[], p_name text, p_email text, p_phone text, p_answers json, p_now bigint
) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.pr_orders%rowtype;
  k text;
  v text;
begin
  select * into o from public.pr_orders where bid = p_bid for update;
  if not found then return 'taken'; end if;
  if o.form_done then return 'done'; end if;

  foreach k in array p_candidates loop
    v := null;
    insert into public.pr_bookings (slot_key, status, tier, bid, name, email, phone, payment_id, form_done, answers, created_at_ms)
    values (k, 'confirmed', o.tier, p_bid, p_name, p_email, p_phone, o.payment_id, true, p_answers, p_now)
    on conflict (slot_key) do update
      set status = 'confirmed', tier = excluded.tier, bid = excluded.bid, name = excluded.name,
          email = excluded.email, phone = excluded.phone, payment_id = excluded.payment_id,
          form_done = true, answers = excluded.answers, hold_until_ms = null, created_at_ms = excluded.created_at_ms
      where public.pr_bookings.bid = p_bid
         or (public.pr_bookings.status = 'held' and coalesce(public.pr_bookings.hold_until_ms, 0) <= p_now)
    returning slot_key into v;
    if v is not null then
      update public.pr_orders set form_done = true, slot = v, name = p_name, form_at_ms = p_now where bid = p_bid;
      -- free the urgent hold if the customer ended up in a different slot
      if o.held_slot is not null and o.held_slot <> v then
        delete from public.pr_bookings where slot_key = o.held_slot and bid = p_bid and status = 'held';
      end if;
      return v;
    end if;
  end loop;
  return 'taken';
end $$;

-- -----------------------------------------------------------------------------
-- Support tickets (was Google Apps Script + Sheet + public Drive links)
-- -----------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id                       uuid primary key default gen_random_uuid(),
  ticket_no                text not null unique,
  user_id                  uuid references public.profiles(id) on delete set null,
  name                     text not null,
  email                    text not null,
  issue                    text not null,
  description              text not null check (char_length(description) <= 5000),
  payment_screenshot_path  text,
  error_screenshot_path    text,
  status                   text not null default 'open' check (status in ('open', 'resolved')),
  created_at               timestamptz not null default now()
);
create index if not exists idx_support_created on public.support_tickets (created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-uploads', 'support-uploads', false, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false;

-- -----------------------------------------------------------------------------
-- Newsletter — one list for the whole site (01_newsletter_subscribers.sql made the table)
-- -----------------------------------------------------------------------------
alter table public.newsletter_subscribers add column if not exists phone text;
alter table public.newsletter_subscribers add column if not exists unsubscribed_at timestamptz;
alter table public.newsletter_subscribers add column if not exists last_email_at timestamptz;

-- -----------------------------------------------------------------------------
-- Rate limiting (fixed window). Returns TRUE when the caller is OVER the limit.
-- -----------------------------------------------------------------------------
create table if not exists public.rate_events (
  id         bigserial primary key,
  key        text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_rate_events_key_time on public.rate_events (key, created_at desc);

create or replace function public.rate_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.rate_events
   where key = p_key and created_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then return true; end if;
  insert into public.rate_events (key) values (p_key);
  -- opportunistic cleanup
  if random() < 0.01 then
    delete from public.rate_events where created_at < now() - interval '2 days';
  end if;
  return false;
end $$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.reading_orders  enable row level security;
alter table public.ai_readings     enable row level security;
alter table public.pr_orders       enable row level security;
alter table public.pr_bookings     enable row level security;
alter table public.pr_problems     enable row level security;
alter table public.pr_config       enable row level security;
alter table public.support_tickets enable row level security;
alter table public.rate_events     enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "own chat" on public.chat_messages;
create policy "own chat" on public.chat_messages for select to authenticated using (user_id = auth.uid());

drop policy if exists "own reading orders" on public.reading_orders;
create policy "own reading orders" on public.reading_orders for select to authenticated using (user_id = auth.uid());

-- No policies on the other tables: only the service role (server) can touch them.

-- Functions: only the server may call them.
revoke all on function public.consume_reading(uuid, integer) from public, anon, authenticated;
revoke all on function public.credit_reading_order(text, text, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.pr_hold_slot(text, text, text[], bigint, bigint) from public, anon, authenticated;
revoke all on function public.pr_mark_paid(text, text, text, text, text, bigint) from public, anon, authenticated;
revoke all on function public.pr_claim_slot(text, text[], text, text, text, json, bigint) from public, anon, authenticated;
revoke all on function public.rate_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.gen_referral_code() from public, anon, authenticated;
grant execute on function public.consume_reading(uuid, integer) to service_role;
grant execute on function public.credit_reading_order(text, text, uuid, integer, integer) to service_role;
grant execute on function public.pr_hold_slot(text, text, text[], bigint, bigint) to service_role;
grant execute on function public.pr_mark_paid(text, text, text, text, text, bigint) to service_role;
grant execute on function public.pr_claim_slot(text, text[], text, text, text, json, bigint) to service_role;
grant execute on function public.rate_hit(text, integer, integer) to service_role;
grant execute on function public.gen_referral_code() to service_role;
