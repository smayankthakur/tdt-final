#!/usr/bin/env node
/**
 * One-time move of the old data into the unified site's tables.
 *
 * Works over the Supabase API with the service-role key, so no database
 * password is needed.
 *
 *  1. Ginni Ki Baatein (old Prisma tables "User", "ChatMessage", "Order",
 *     "NewsletterSubscriber" in the same Supabase project) → Supabase Auth
 *     users + profiles, chat_messages (last 30 per reader), reading_orders,
 *     newsletter_subscribers.
 *     Passwords keep working: the old bcrypt hashes are handed to Supabase
 *     Auth as `password_hash`, which it verifies natively.
 *  2. Personal Reading (Firestore orders / bookings / problems / config) →
 *     pr_orders, pr_bookings, pr_problems, pr_config. Only runs when
 *     FIREBASE_SERVICE_ACCOUNT_JSON is set (npm i -D firebase-admin first).
 *
 * Usage (from the project folder; values are read from .env.local and
 * .env.migration.local automatically):
 *   npm run migrate:legacy              # dry run: counts only, writes nothing
 *   npm run migrate:legacy -- --commit  # actually write
 *
 * Needs SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * If the old tables live in a DIFFERENT Supabase project, also set
 * LEGACY_SUPABASE_URL and LEGACY_SUPABASE_SERVICE_ROLE_KEY.
 *
 * Run supabase/10_unified_platform.sql first. Safe to re-run: existing
 * accounts, orders, bookings, subscribers and chat histories are skipped.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ---- env -------------------------------------------------------------------
for (const file of ['.env.local', '.env.migration.local']) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const COMMIT = process.argv.includes('--commit');
const URL_ = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API).');
  process.exit(1);
}
// Every API call gives up after 30 s so a stalled request can't hang the run;
// whatever failed is picked up by simply running the script again.
const timedFetch = (url, init = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(30000) });
const opts = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: timedFetch } };
const db = createClient(URL_, KEY, opts);
const legacyDb = process.env.LEGACY_SUPABASE_URL && process.env.LEGACY_SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.LEGACY_SUPABASE_URL, process.env.LEGACY_SUPABASE_SERVICE_ROLE_KEY, opts)
  : db;

const log = (...a) => console.log(COMMIT ? '[commit]' : '[dry-run]', ...a);
const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

/** All rows of a table (PostgREST pages at 1000). null if the table does not exist. */
async function readAll(client, table, order = 'createdAt') {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select('*').order(order, { ascending: true }).range(from, from + 999);
    if (error) {
      if (/does not exist|schema cache|Could not find the table/i.test(error.message)) return null;
      throw new Error(`read ${table}: ${error.message}`);
    }
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

async function allAuthUsersByEmail() {
  const map = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`list auth users: ${error.message}`);
    for (const u of data.users) if (u.email) map.set(u.email.toLowerCase(), { id: u.id, mobileTwin: !!u.app_metadata?.ginni_user_id });
    if (data.users.length < 1000) return map;
  }
}

async function inBatches(rows, size, fn) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

const latest = (a, b) => (!a ? b || null : !b ? a : new Date(a) > new Date(b) ? a : b);

// ---- 1. reading app ----------------------------------------------------------
async function migrateReadingApp() {
  const users = await readAll(legacyDb, 'User');
  if (!users) {
    log('No legacy "User" table found — skipping reading-app users.');
    return;
  }
  const chats = (await readAll(legacyDb, 'ChatMessage')) || [];
  const orders = (await readAll(legacyDb, 'Order')) || [];
  const subs = (await readAll(legacyDb, 'NewsletterSubscriber')) || [];
  log(`legacy: ${users.length} users, ${chats.length} chat messages, ${orders.length} orders, ${subs.length} newsletter subscribers`);

  const byEmail = await allAuthUsersByEmail();
  const idMap = new Map(); // legacy cuid -> auth uuid
  let created = 0, existing = 0, failed = 0, synced = 0;

  const profiles = new Map(((await readAll(db, 'profiles', 'created_at')) || []).map((p) => [p.id, p]));
  let done = 0;
  const processUser = async (u) => {
    const email = String(u.email || '').trim().toLowerCase();
    if (!email) return;
    const found = byEmail.get(email);

    if (found) {
      // This email already has a login here: carry the reading-app pass and
      // credits over. If that login is the mobile app's twin of this reading
      // account, the website password (the one the reader knows) wins;
      // otherwise the existing password is kept.
      const foundId = found.id;
      idMap.set(u.id, foundId);
      existing++;
      const known = profiles.get(foundId);
      if (!found.mobileTwin && known && known.legacy_id === u.id && known.source !== 'site') {
        // Moved by an earlier run. Only carry over a pass bought on the old site since then.
        const newer = latest(known.subscription_expires, u.subscriptionExpires);
        if (COMMIT && newer && newer !== known.subscription_expires) {
          must(await db.from('profiles').update({ subscription_expires: newer }).eq('id', foundId), 'pass refresh');
        }
        return;
      }
      if (found.mobileTwin && u.passwordHash) {
        synced++;
        if (COMMIT) must(await db.rpc('migrate_set_password_hash', { p_user: foundId, p_hash: u.passwordHash }), 'password sync');
      }
      if (COMMIT) {
        const found = foundId;
        must(await db.from('profiles').upsert(
          { id: found, email, name: u.name || null, referral_code: await newReferralCode(), source: 'legacy-reading' },
          { onConflict: 'id', ignoreDuplicates: true }
        ), 'profile upsert');
        const p = must(await db.from('profiles').select('*').eq('id', found).single(), 'profile read');
        if (p.legacy_id !== u.id || p.source === 'site') {
          // first time this legacy account is merged in (keeps re-runs from adding bonus twice;
          // source 'site' = created by an earlier run that stopped before copying the pass)
          must(await db.from('profiles').update({
            name: p.name || u.name || null,
            readings_used: Math.max(p.readings_used || 0, u.readingsUsed || 0),
            bonus_readings: (p.bonus_readings || 0) + (u.bonusReadings || 0),
            subscription_expires: latest(p.subscription_expires, u.subscriptionExpires),
            legacy_id: u.id,
            source: p.source === 'site' ? 'legacy-reading' : p.source,
          }).eq('id', found), 'profile merge');
        }
      }
      return;
    }

    if (!COMMIT) { idMap.set(u.id, `new:${u.id}`); created++; return; }

    const meta = { name: u.name || null, legacy_id: u.id, referral_code: u.referralCode || null };
    const attrs = { email, email_confirm: true, user_metadata: meta };
    if (u.passwordHash) attrs.password_hash = u.passwordHash;
    let res = await db.auth.admin.createUser(attrs);
    if (res.error && meta.referral_code) {
      // e.g. the old referral code is already taken here — retry with a fresh one
      res = await db.auth.admin.createUser({ ...attrs, user_metadata: { ...meta, referral_code: null } });
    }
    if (res.error) {
      failed++;
      console.error(`  ! ${email}: ${res.error.message}`);
      return;
    }
    const id = res.data.user.id;
    byEmail.set(email, { id, mobileTwin: false });
    idMap.set(u.id, id);
    must(await db.from('profiles').update({
      readings_used: u.readingsUsed || 0,
      bonus_readings: u.bonusReadings || 0,
      subscription_expires: u.subscriptionExpires || null,
      referral_rewarded: !!u.referralRewarded,
      created_at: u.createdAt,
      source: 'legacy-reading',
    }).eq('id', id), 'profile update');
    created++;
  };
  // 6 at a time; each user is independent.
  const queue = [...users];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      await processUser(queue.shift());
      if (++done % 100 === 0) log(`  ${done}/${users.length} users…`);
    }
  }));
  log(`users: ${created} ${COMMIT ? 'created' : 'to create'}, ${existing} already had a login (${synced} mobile-app logins ${COMMIT ? 'given' : 'to get'} the website password)${failed ? `, ${failed} FAILED (see above)` : ''}`);

  if (COMMIT) {
    for (const u of users) {
      const me = idMap.get(u.id), ref = idMap.get(u.referredByUserId);
      if (u.referredByUserId && me && ref) {
        must(await db.from('profiles').update({ referred_by: ref }).eq('id', me).is('referred_by', null), 'referral');
      }
    }
  }

  // Chat: the site keeps the last 30 messages per reader. A reader whose
  // history is already here is skipped, so re-runs don't duplicate it.
  const perUser = new Map();
  for (const m of chats) {
    const uid = idMap.get(m.userId);
    if (!uid) continue;
    if (!perUser.has(uid)) perUser.set(uid, []);
    perUser.get(uid).push(m);
  }
  const haveChat = new Set();
  if (COMMIT) {
    for (let from = 0; ; from += 1000) {
      const rows = must(await db.from('chat_messages').select('user_id').order('id').range(from, from + 999), 'chat read');
      rows.forEach((r) => haveChat.add(r.user_id));
      if (rows.length < 1000) break;
    }
  }
  const chatRows = [];
  for (const [uid, list] of perUser) {
    if (haveChat.has(uid)) continue;
    for (const m of list.slice(-30)) {
      chatRows.push({
        user_id: uid, role: m.role, kind: m.kind, text: m.text ? String(m.text).slice(0, 4000) : null,
        card: m.card ?? null, ai_mode: !!m.aiMode, created_at: m.createdAt,
      });
    }
  }
  const chatN = chatRows.length;
  if (COMMIT) await inBatches(chatRows, 500, async (b) => must(await db.from('chat_messages').insert(b), 'chat insert'));
  log(`chat messages: ${chatN} (last 30 per reader, skipping readers whose history is already here)`);

  const orderRows = orders.filter((o) => idMap.get(o.userId) && o.razorpayOrderId).map((o) => ({
    user_id: idMap.get(o.userId), razorpay_order_id: o.razorpayOrderId, amount: o.amount,
    status: o.status === 'paid' ? 'paid' : 'created', razorpay_payment_id: o.razorpayPaymentId || null,
    paid_at: o.paidAt || null, created_at: o.createdAt,
  }));
  if (COMMIT) {
    await inBatches(orderRows, 500, async (b) =>
      must(await db.from('reading_orders').upsert(b, { onConflict: 'razorpay_order_id', ignoreDuplicates: true }), 'orders'));
  }
  log(`reading orders: ${orderRows.length}`);

  const subRows = [...new Map(subs.filter((s) => s.email).map((s) => [String(s.email).toLowerCase(), {
    email: String(s.email).toLowerCase(), status: s.unsubscribedAt ? 'unsubscribed' : 'subscribed',
    source: s.source || 'reading-app', phone: s.phone || null, unsubscribed_at: s.unsubscribedAt || null, created_at: s.createdAt,
  }])).values()];
  if (COMMIT) {
    await inBatches(subRows, 500, async (b) =>
      must(await db.from('newsletter_subscribers').upsert(b, { onConflict: 'email', ignoreDuplicates: true }), 'subscribers'));
  }
  log(`newsletter subscribers: ${subRows.length}`);
}

async function newReferralCode() {
  const { data } = await db.rpc('gen_referral_code');
  return data || Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ---- 2. personal reading (Firestore) ----------------------------------------
async function migrateFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    log('FIREBASE_SERVICE_ACCOUNT_JSON not set — skipping Personal Reading bookings.');
    return;
  }
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const j = JSON.parse(raw);
  initializeApp({ credential: cert({ projectId: j.project_id, clientEmail: j.client_email, privateKey: j.private_key }) });
  const store = getFirestore();
  const ms = (v) => (v == null ? null : typeof v === 'number' ? v : v.toMillis ? v.toMillis() : Number(v));

  const orders = await store.collection('orders').get();
  const orderRows = orders.docs.map((d) => {
    const o = d.data();
    return {
      bid: d.id, status: o.status === 'paid' ? 'paid' : 'created', tier: o.tier === 'urgent' ? 'urgent' : 'standard',
      amount: o.amount || 0, held_slot: o.heldSlot || null, origin: o.origin || null, plink_id: o.plinkId || null,
      payment_id: o.paymentId || null, email: o.email || null, phone: o.phone || null, name: o.name || null,
      slot: o.slot || null, meet_link: o.meetLink || null, form_done: !!o.formDone,
      created_at_ms: ms(o.createdAt) || Date.now(), paid_at_ms: ms(o.paidAt), form_at_ms: ms(o.formAt),
    };
  });
  log(`firestore orders: ${orderRows.length}`);
  if (COMMIT) {
    await inBatches(orderRows, 500, async (b) =>
      must(await db.from('pr_orders').upsert(b, { onConflict: 'bid', ignoreDuplicates: true }), 'pr_orders'));
  }

  const known = new Set(orderRows.map((o) => o.bid));
  const bookings = await store.collection('bookings').get();
  const bookingRows = bookings.docs
    .filter((d) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(d.id) && known.has(d.data().bid))
    .map((d) => {
      const b = d.data();
      const answers = { ...(b.answers || {}) };
      delete answers.Slot;
      return {
        slot_key: d.id, status: b.status === 'confirmed' ? 'confirmed' : 'held', tier: b.tier || 'standard', bid: b.bid,
        hold_until_ms: ms(b.holdUntil), name: b.name || null, email: b.email || null, phone: b.phone || null,
        payment_id: b.paymentId || null, form_done: !!b.formDone, answers, meet_link: b.meetLink || null,
        event_id: b.eventId || null, calendar_ok: b.calendarOk ?? null, calendar_err: b.calendarErr || null,
        client_mail_ok: b.clientMailOk ?? null, owner_mail_ok: b.ownerMailOk ?? null, mail_err: b.mailErr || null,
        created_at_ms: ms(b.createdAt) || Date.now(),
      };
    });
  log(`firestore bookings: ${bookingRows.length}`);
  if (COMMIT) {
    await inBatches(bookingRows, 500, async (b) =>
      must(await db.from('pr_bookings').upsert(b, { onConflict: 'slot_key', ignoreDuplicates: true }), 'pr_bookings'));
  }

  const problems = await store.collection('problems').get();
  log(`firestore payment problems: ${problems.size}`);
  if (COMMIT && problems.size) {
    const have = must(await db.from('pr_problems').select('plink_id'), 'pr_problems read').map((r) => r.plink_id);
    const rows = problems.docs
      .map((d) => ({ d, p: d.data() }))
      .filter(({ d, p }) => !have.includes(p.paymentLink || d.id))
      .map(({ d, p }) => ({ bid: p.bid || null, plink_id: p.paymentLink || d.id, why: p.why || null, at: new Date(ms(p.at) || Date.now()).toISOString() }));
    if (rows.length) must(await db.from('pr_problems').insert(rows), 'pr_problems');
  }

  const cfg = await store.doc('config/schedule2026').get();
  if (cfg.exists) {
    log('firestore schedule config: found (copied to pr_config)');
    if (COMMIT) must(await db.from('pr_config').upsert({ id: 'schedule2026', cfg: cfg.data() }, { onConflict: 'id' }), 'pr_config');
  }
}

// ---- run ---------------------------------------------------------------------
try {
  const ready = await db.from('profiles').select('id', { head: true, count: 'exact' });
  if (ready.error) {
    throw new Error(`the site's tables are missing (${ready.error.message}). Run supabase/10_unified_platform.sql in the SQL editor first.`);
  }
  log(`target: ${URL_}`);
  await migrateReadingApp();
  await migrateFirestore();
  log(COMMIT ? 'done.' : 'dry run finished — nothing written. Re-run with --commit.');
} catch (err) {
  console.error('Migration stopped:', err.message || err);
  process.exitCode = 1;
}
