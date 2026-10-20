#!/usr/bin/env node
/**
 * One-time move of the old data into the unified Supabase project.
 *
 *  1. Ginni Ki Baatein (old Prisma tables "User", "ChatMessage", "Order",
 *     "NewsletterSubscriber") → auth.users + profiles, chat_messages,
 *     reading_orders, newsletter_subscribers.
 *     Passwords keep working: the old bcrypt hashes are copied into
 *     auth.users.encrypted_password, which Supabase Auth verifies natively.
 *  2. Personal Reading (Firestore orders / bookings / problems / config) →
 *     pr_orders, pr_bookings, pr_problems, pr_config. Only runs when
 *     FIREBASE_SERVICE_ACCOUNT_JSON is set (npm i -D firebase-admin first).
 *
 * Usage (from the project folder):
 *   SUPABASE_DB_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres" \
 *   LEGACY_DATABASE_URL="<old DIRECT_URL of the reading app>" \
 *   node scripts/migrate-legacy-to-supabase.mjs            # dry run: counts only
 *   node scripts/migrate-legacy-to-supabase.mjs --commit   # actually write
 *
 * Run supabase/10_unified_platform.sql first. Safe to re-run: existing emails,
 * orders, bookings and subscribers are skipped.
 */
import pg from 'pg';

const COMMIT = process.argv.includes('--commit');
const TARGET = process.env.SUPABASE_DB_URL;
const LEGACY = process.env.LEGACY_DATABASE_URL;
if (!TARGET) {
  console.error('Set SUPABASE_DB_URL (Supabase → Project Settings → Database → Connection string, "Session" or direct).');
  process.exit(1);
}

const log = (...a) => console.log(COMMIT ? '[commit]' : '[dry-run]', ...a);
const ssl = (url) => (/localhost|127\.0\.0\.1|\/tmp/.test(url) ? false : { rejectUnauthorized: false });

async function tableExists(client, name) {
  const { rows } = await client.query(`select to_regclass($1) as t`, [`public."${name}"`]);
  return !!rows[0].t;
}

async function migrateReadingApp(target) {
  if (!LEGACY) {
    log('LEGACY_DATABASE_URL not set — skipping reading-app users.');
    return;
  }
  const legacy = LEGACY === TARGET ? target : new pg.Client({ connectionString: LEGACY, ssl: ssl(LEGACY) });
  if (legacy !== target) await legacy.connect();
  try {
    if (!(await tableExists(legacy, 'User'))) {
      log('No legacy "User" table found — nothing to migrate.');
      return;
    }
    const users = (await legacy.query(`select * from "User" order by "createdAt"`)).rows;
    const chats = (await tableExists(legacy, 'ChatMessage'))
      ? (await legacy.query(`select * from "ChatMessage" order by "createdAt"`)).rows : [];
    const orders = (await tableExists(legacy, 'Order')) ? (await legacy.query(`select * from "Order"`)).rows : [];
    const subs = (await tableExists(legacy, 'NewsletterSubscriber'))
      ? (await legacy.query(`select * from "NewsletterSubscriber"`)).rows : [];
    log(`legacy: ${users.length} users, ${chats.length} chat messages, ${orders.length} orders, ${subs.length} newsletter subscribers`);

    const idMap = new Map(); // legacy cuid -> new uuid
    let created = 0, existing = 0;
    for (const u of users) {
      const email = String(u.email).trim().toLowerCase();
      const found = await target.query(`select id from auth.users where lower(email) = $1`, [email]);
      if (found.rows[0]) {
        idMap.set(u.id, found.rows[0].id);
        existing++;
        continue;
      }
      if (!COMMIT) { idMap.set(u.id, `new:${u.id}`); created++; continue; }
      const meta = { name: u.name || null, legacy_id: u.id, referral_code: u.referralCode || null };
      const { rows } = await target.query(
        `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change, email_change_token_new)
         values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1, $2, now(),
            '{"provider":"email","providers":["email"]}', $3, $4, now(), '', '', '', '')
         returning id`,
        [email, u.passwordHash, JSON.stringify(meta), u.createdAt]
      );
      const id = rows[0].id;
      await target.query(
        `insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
         values (gen_random_uuid(), $1, $3, $2, 'email', now(), now(), now())`,
        [id, JSON.stringify({ sub: id, email, email_verified: true }), String(id)]
      );
      await target.query(
        `update public.profiles set readings_used = $2, bonus_readings = $3, subscription_expires = $4,
             referral_rewarded = $5, created_at = $6 where id = $1`,
        [id, u.readingsUsed || 0, u.bonusReadings || 0, u.subscriptionExpires, !!u.referralRewarded, u.createdAt]
      );
      idMap.set(u.id, id);
      created++;
    }
    log(`users: ${created} to create, ${existing} already in Supabase Auth`);

    if (COMMIT) {
      for (const u of users) {
        if (u.referredByUserId && idMap.get(u.referredByUserId) && idMap.get(u.id)) {
          await target.query(`update public.profiles set referred_by = $2 where id = $1 and referred_by is null`,
            [idMap.get(u.id), idMap.get(u.referredByUserId)]);
        }
      }
    }

    let chatN = 0;
    for (const m of chats) {
      const uid = idMap.get(m.userId);
      if (!uid) continue;
      chatN++;
      if (COMMIT) {
        await target.query(
          `insert into public.chat_messages (user_id, role, kind, text, card, ai_mode, created_at)
           select $1, $2, $3, $4, $5, $6, $7
           where not exists (select 1 from public.chat_messages where user_id = $1 and created_at = $7 and role = $2)`,
          [uid, m.role, m.kind, m.text ? String(m.text).slice(0, 4000) : null, m.card, !!m.aiMode, m.createdAt]
        );
      }
    }
    log(`chat messages: ${chatN}`);

    let orderN = 0;
    for (const o of orders) {
      const uid = idMap.get(o.userId);
      if (!uid) continue;
      orderN++;
      if (COMMIT) {
        await target.query(
          `insert into public.reading_orders (user_id, razorpay_order_id, amount, status, razorpay_payment_id, paid_at, created_at)
           values ($1, $2, $3, $4, $5, $6, $7) on conflict (razorpay_order_id) do nothing`,
          [uid, o.razorpayOrderId, o.amount, o.status === 'paid' ? 'paid' : 'created', o.razorpayPaymentId, o.paidAt, o.createdAt]
        );
      }
    }
    log(`reading orders: ${orderN}`);

    if (COMMIT) {
      for (const s of subs) {
        await target.query(
          `insert into public.newsletter_subscribers (email, status, source, phone, unsubscribed_at, created_at)
           values (lower($1), $2, $3, $4, $5, $6) on conflict (email) do nothing`,
          [s.email, s.unsubscribedAt ? 'unsubscribed' : 'subscribed', s.source || 'reading-app', s.phone, s.unsubscribedAt, s.createdAt]
        );
      }
    }
    log(`newsletter subscribers: ${subs.length}`);
  } finally {
    if (legacy !== target) await legacy.end();
  }
}

async function migrateFirestore(target) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    log('FIREBASE_SERVICE_ACCOUNT_JSON not set — skipping Personal Reading bookings.');
    return;
  }
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const j = JSON.parse(raw);
  initializeApp({ credential: cert({ projectId: j.project_id, clientEmail: j.client_email, privateKey: j.private_key }) });
  const fs = getFirestore();
  const ms = (v) => (v == null ? null : typeof v === 'number' ? v : v.toMillis ? v.toMillis() : Number(v));

  const orders = await fs.collection('orders').get();
  log(`firestore orders: ${orders.size}`);
  if (COMMIT) {
    for (const d of orders.docs) {
      const o = d.data();
      await target.query(
        `insert into public.pr_orders (bid, status, tier, amount, held_slot, origin, plink_id, payment_id, email, phone, name, slot, meet_link, form_done, created_at_ms, paid_at_ms, form_at_ms)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) on conflict (bid) do nothing`,
        [d.id, o.status === 'paid' ? 'paid' : 'created', o.tier === 'urgent' ? 'urgent' : 'standard', o.amount || 0, o.heldSlot || null,
         o.origin || null, o.plinkId || null, o.paymentId || null, o.email || null, o.phone || null, o.name || null, o.slot || null,
         o.meetLink || null, !!o.formDone, ms(o.createdAt) || Date.now(), ms(o.paidAt), ms(o.formAt)]
      );
    }
  }
  const bookings = await fs.collection('bookings').get();
  log(`firestore bookings: ${bookings.size}`);
  if (COMMIT) {
    for (const d of bookings.docs) {
      const b = d.data();
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(d.id)) continue;
      const exists = await target.query(`select 1 from public.pr_orders where bid = $1`, [b.bid]);
      if (!exists.rows[0]) continue;
      const answers = { ...(b.answers || {}) };
      delete answers.Slot;
      await target.query(
        `insert into public.pr_bookings (slot_key, status, tier, bid, hold_until_ms, name, email, phone, payment_id, form_done, answers,
            meet_link, event_id, calendar_ok, calendar_err, client_mail_ok, owner_mail_ok, mail_err, created_at_ms)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) on conflict (slot_key) do nothing`,
        [d.id, b.status === 'confirmed' ? 'confirmed' : 'held', b.tier || 'standard', b.bid, ms(b.holdUntil), b.name || null, b.email || null,
         b.phone || null, b.paymentId || null, !!b.formDone, JSON.stringify(answers), b.meetLink || null, b.eventId || null,
         b.calendarOk ?? null, b.calendarErr || null, b.clientMailOk ?? null, b.ownerMailOk ?? null, b.mailErr || null, ms(b.createdAt) || Date.now()]
      );
    }
  }
  const problems = await fs.collection('problems').get();
  log(`firestore payment problems: ${problems.size}`);
  if (COMMIT) {
    for (const d of problems.docs) {
      const p = d.data();
      await target.query(`insert into public.pr_problems (bid, plink_id, why, at) values ($1,$2,$3,to_timestamp($4/1000.0))`,
        [p.bid || null, p.paymentLink || d.id, p.why || null, ms(p.at) || Date.now()]);
    }
  }
  const cfg = await fs.doc('config/schedule2026').get();
  if (cfg.exists) {
    log('firestore schedule config: found (copied to pr_config)');
    if (COMMIT) {
      await target.query(`insert into public.pr_config (id, cfg) values ('schedule2026', $1) on conflict (id) do update set cfg = excluded.cfg`,
        [JSON.stringify(cfg.data())]);
    }
  }
}

const target = new pg.Client({ connectionString: TARGET, ssl: ssl(TARGET) });
await target.connect();
try {
  await target.query('begin');
  await migrateReadingApp(target);
  await migrateFirestore(target);
  if (COMMIT) {
    await target.query('commit');
    log('done — committed.');
  } else {
    await target.query('rollback');
    log('dry run finished — nothing written. Re-run with --commit.');
  }
} catch (err) {
  await target.query('rollback').catch(() => {});
  console.error('Migration failed, nothing was written:', err);
  process.exitCode = 1;
} finally {
  await target.end();
}
