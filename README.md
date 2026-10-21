# The Divine Tarot — one website

Everything that used to be five separate sites now runs as **one Next.js app on
one domain, with one Supabase project and one login**.

| Page | Path | Was |
| --- | --- | --- |
| Home, About, Premium, Contact, Privacy, Terms, Refund policy | `/`, `/about`, `/premium`, `/contact`, `/privacy`, `/terms`, `/refund-policy` | thedivinetarotonline.com |
| Ginni Ki Baatein (reading chat, ₹199 / 30-day pass) | `/reading`, `/reset-password` | reading.thedivinetarotonline.com |
| Courses (5 recorded courses) | `/courses`, `/courses/[slug]` | learn.thedivinetarotonline.com |
| Kundli Milan (free score + ₹99 report) | `/kundli-milan` | thedivinetarotonline.com/kundli-milan |
| Personal Reading (voice/Meet call booking) | `/personal-reading`, `/personal-reading/form`, `/personal-reading/admin` | booking.thedivinetarotonline.com |
| Support, account deletion, app link | `/support`, `/delete-account`, `/app` | support.thedivinetarotonline.com |

Old subdomains redirect permanently to the new paths (see `middleware.ts`), and
their `/api/...` callbacks keep working, so payment links and webhooks that
Razorpay already knows about still land.

## Stack

- Next.js 15 (App Router), React 19, Tailwind
- **Supabase**: Auth (email + password) and Postgres for every feature, private Storage bucket for support screenshots
- Razorpay (Checkout for the reading pass and Kundli report, Payment Links for personal readings)
- Resend (reading/newsletter/support email), Gmail SMTP (booking confirmations with calendar invite), Google Calendar API (Meet links)
- Sentry, Upstash (optional edge rate limit), Vercel Cron

## First-time setup

1. **Supabase project** — the site uses the reading app's project **ginni2** (`hnaggjopklxcgzxsyswc`), so the
   old reading accounts are already in the same database. In its SQL editor run, in order:
   `supabase/01_newsletter_subscribers.sql`, `02_daily_newsletter.sql`, `03_youtube_newsletter.sql`,
   `04_kundli_orders.sql`, `10_unified_platform.sql`, then (optional) `11_harden_after_cutover.sql`.
   All are safe to re-run, and none of them touches the old Prisma tables or the mobile app's `tdt_*` tables.
2. **Supabase Auth settings** — Authentication → Providers → Email: enabled. "Confirm email" can stay on:
   the site creates accounts already confirmed. Authentication → URL configuration → Site URL
   `https://thedivinetarotonline.com`. Authentication → Rate limits: raise the sign-in / sign-up limits — the site signs
   users in from the server, so all visitors share a few Vercel IPs.
3. **Environment** — copy `.env.example` to `.env.local` (and into Vercel). **`docs/ENV_GUIDE.md` explains where
   every value comes from.** Generate each secret with `openssl rand -hex 32`.
4. **Admin access** for `/personal-reading/admin`: either set `BOOKING_ADMIN_TOKEN`, or sign in on `/reading`
   with the owner's account and set that user's `app_metadata` to `{"role":"admin"}` in Supabase.
5. `npm install && npm run dev`.

## Moving the existing data (once)

Uses the Supabase API with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (read from `.env.local`), so no
database password is needed. `FIREBASE_SERVICE_ACCOUNT_JSON` (in `.env.migration.local`) adds the bookings.

```bash
npm run migrate:legacy               # dry run — prints counts, writes nothing
npm run migrate:legacy -- --commit   # then for real
```

- Reading-app users (the old Prisma `"User"` table) keep their passwords (bcrypt hashes move into Supabase Auth), passes, bonus readings,
  referral codes, referrals, last 30 chat messages and orders.
- Personal-reading orders, bookings, payment problems and the slot settings move from Firestore.
  (`npm i -D firebase-admin` first if you migrate bookings.)
- Re-running skips anything already moved.

## Razorpay webhooks

| URL | Events | Secret env |
| --- | --- | --- |
| `/api/razorpay/reading-webhook` | `payment.captured`, `order.paid` | `RAZORPAY_READING_WEBHOOK_SECRET` |
| `/api/booking/razorpay-webhook` | `payment_link.paid` | `BOOKING_RAZORPAY_WEBHOOK_SECRET` |
| `/api/kundli-report/webhook` | `payment.captured` | `KUNDLI_RAZORPAY_WEBHOOK_SECRET` |

## Cron jobs (vercel.json)

| Path | When (UTC) | What |
| --- | --- | --- |
| `/api/newsletter/daily` | 03:00 daily | daily teaser email + WhatsApp |
| `/api/youtube/cron` | 04:00 daily | emails subscribers when a new YouTube video is out |
| `/api/cron/cleanup-accounts` | 21:00 daily | deletes accounts that never bought a pass after 24 h (client rule) |

All require `Authorization: Bearer $CRON_SECRET` (Vercel sends it).

## Domains (Vercel)

Add `thedivinetarotonline.com`, `www.`, `reading.`, `learn.`, `booking.` and `support.` to this one project.
Remove them from the old projects first. The middleware handles the redirects.

**Leave `chat.thedivinetarotonline.com` on the old chat app until 20 Nov 2026.** 189 people still hold a premium
pass there (most are anonymous accounts that cannot log in here), so cancel the old recurring Razorpay
subscriptions now and move `chat.` to this project only after the last pass expires. The old chat app has its
own Supabase project (Tdt-Ginni), which can be paused at that point.

## Security model

- RLS is on for every table. Signed-in users can read only their own profile, chat and orders; nothing
  can be written from the browser.
- Money and slot logic run inside Postgres functions (`credit_reading_order`, `consume_reading`,
  `pr_hold_slot`, `pr_mark_paid`, `pr_claim_slot`) that only the server may call — no double credits,
  no double bookings.
- Payment signatures and webhooks use constant-time HMAC checks. Login, reset, support, booking and
  subscribe are rate-limited.

## Before go-live

See `docs/PRELAUNCH_AUDIT.md` for the launch checklist and remaining blockers.

## Scripts

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run migrate:legacy`
