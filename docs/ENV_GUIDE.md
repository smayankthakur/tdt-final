# Environment variables — where each one comes from

Put these in **Vercel → Project → Settings → Environment Variables** (Production, and Preview if you use it),
and in `.env.local` for local development. `.env.example` has the same list in copy-paste form.

Legend: **Required** = the site or that feature does not work without it. **Optional** = the feature switches off cleanly.

## 1. Site

| Variable | Required | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Required | `https://thedivinetarotonline.com` (used in emails, reset links, unsubscribe links) |
| `NEXT_PUBLIC_APP_URL` | Required | same as above (canonical URLs, sitemap, JSON-LD) |
| `NEXT_PUBLIC_SITE_HOST` | Required | `thedivinetarotonline.com` (old subdomains redirect to this host) |

## 2. Supabase — database + the one login for everything

Use the reading app's project **ginni2** (`https://hnaggjopklxcgzxsyswc.supabase.co`) → **Project Settings → API Keys →
Legacy anon, service_role API keys**.

| Variable | Required | Where |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required | `https://hnaggjopklxcgzxsyswc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | "service_role" key — **secret**, server only, never put in a `NEXT_PUBLIC_` variable |

Optional runtime overrides (same values): `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Useful when the env is set after the build.

Then, once, in **SQL Editor**: run `supabase/01_…`, `02_…`, `03_…`, `04_…`, `10_unified_platform.sql` in that order
(`11_harden_after_cutover.sql` is optional).

The one-time data move (`npm run migrate:legacy`) uses the same URL and service-role key — no database password
needed. Only for the bookings: `FIREBASE_SERVICE_ACCOUNT_JSON` (old booking project's service-account JSON on one
line) in `.env.migration.local`. Not needed in Vercel.

## 3. Secrets you generate yourself

Generate each one separately: `openssl rand -hex 32` (or any 64-character random string). Never reuse one for two variables.

| Variable | Required | Used for |
| --- | --- | --- |
| `READING_TOKEN_SECRET` | Required | signs the 20-minute card "pick" tokens in Ginni Ki Baatein |
| `NEWSLETTER_SECRET` | Required | signs one-click unsubscribe links (changing it breaks links in old emails) |
| `FORM_SECRET` | Required | signs the personal-reading form cookie after payment |
| `CRON_SECRET` | Required | Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; without it every cron returns 401 |
| `BOOKING_ADMIN_TOKEN` | Optional | password for `/personal-reading/admin`. Alternative: Supabase → Authentication → Users → owner's account → set `app_metadata` to `{"role":"admin"}`, then log in on `/reading` and open the admin page — no password needed |

## 4. Razorpay

Razorpay dashboard → **Account & Settings → API Keys** (switch to Live mode for production).

| Variable | Required | Where |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | Required | Key Id (`rzp_live_…`) |
| `RAZORPAY_KEY_SECRET` | Required | Key Secret — **secret** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Required | same Key Id (public, used by the checkout popup) |
| `BOOKING_RAZORPAY_KEY_ID` / `BOOKING_RAZORPAY_KEY_SECRET` | Optional | only if personal readings are paid into a different Razorpay account |

**Webhooks** → Account & Settings → Webhooks → *Add New Webhook*. Create three, each with its own secret:

| Webhook URL | Events | Secret goes in |
| --- | --- | --- |
| `https://thedivinetarotonline.com/api/razorpay/reading-webhook` | `payment.captured`, `order.paid` | `RAZORPAY_READING_WEBHOOK_SECRET` |
| `https://thedivinetarotonline.com/api/booking/razorpay-webhook` | `payment_link.paid` | `BOOKING_RAZORPAY_WEBHOOK_SECRET` |
| `https://thedivinetarotonline.com/api/kundli-report/webhook` | `payment.captured` | `KUNDLI_RAZORPAY_WEBHOOK_SECRET` |

Without the reading webhook, a buyer who closes the tab right after paying is not credited automatically and has to raise a support ticket.

Course "Enrol Now" buttons use Razorpay payment links stored in `src/lib/courses/data.ts` — no env needed.

## 5. Email

**Resend** (resend.com → API Keys; Domains → add and verify `thedivinetarotonline.com` with the DNS records it shows, which also gives you SPF/DKIM):

| Variable | Required | Used for |
| --- | --- | --- |
| `RESEND_API_KEY` | Required | password-reset emails, newsletter, support tickets, Kundli reports |
| `EMAIL_FROM` | Required | e.g. `The Divine Tarot <hello@thedivinetarotonline.com>` (must be on the verified domain) |
| `RESEND_FROM_EMAIL` | Required | same value (used by the daily / YouTube newsletters) |

**Gmail SMTP** for personal-reading confirmations (sent with calendar invite + photos). Google account → Security →
2-Step Verification on → **App passwords** → create one.

| Variable | Required | Value |
| --- | --- | --- |
| `SMTP_HOST` | Required | `smtp.gmail.com` |
| `SMTP_PORT` | Required | `465` |
| `SMTP_SECURE` | Required | `true` |
| `SMTP_USER` | Required | `dev.thedivinetarot111@gmail.com` |
| `SMTP_PASS` | Required | the 16-character app password |
| `SMTP_FROM` | Optional | `"The Divine Tarot" <dev.thedivinetarot111@gmail.com>` |
| `OWNER_EMAIL` | Required | where booking + support notifications go (comma-separated list allowed) |
| `SUPPORT_EMAIL` | Optional | defaults to `OWNER_EMAIL` |

## 6. Personal reading — Google Meet links

Google Cloud Console (same Google account that owns the calendar) → create an OAuth client (type "Web application"),
enable the **Google Calendar API**, then get a refresh token for that account with the
`https://www.googleapis.com/auth/calendar.events` scope (OAuth Playground → settings → "Use your own OAuth credentials").

| Variable | Required | Notes |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Required for Meet links | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Required for Meet links | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Required for Meet links | refresh token for the calendar owner |
| `CALENDAR_GUESTS` | Optional | extra emails added to every event |
| `CALL_MINUTES` | Optional | default `40` |
| `PRICE_INR` / `PRICE_URGENT_INR` | Optional | normal ₹8,500 / urgent ₹17,000. The Diwali ₹5,500 offer and its end date live in `src/lib/booking/offer.ts` |

If Meet creation fails, the booking still succeeds; the admin page shows a "Meet link + email dobara bhejein" button.

## 7. Reading chat — optional AI fallback

Only used when a typed question matches none of the 16 topics. Leave all empty for zero AI cost (a built-in reading is used instead).
Order of preference if several are set: Anthropic → OpenAI → Gemini.

`ANTHROPIC_API_KEY` · `OPENAI_API_KEY` · `GEMINI_API_KEY`

## 8. Newsletter, WhatsApp, YouTube (optional)

| Variable | Notes |
| --- | --- |
| `YOUTUBE_CHANNEL_ID` | `UC93V0T62ER8cvjio8rAIqCQ` — new videos are emailed to subscribers |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | Meta → WhatsApp → API Setup. **Use a new token** — the old one is exposed (see audit) |
| `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | an approved template for the daily message |

## 9. Kundli report log (optional)

`GOOGLE_SHEET_WEBHOOK_URL`, `GOOGLE_SHEET_WEBHOOK_TOKEN` — Apps Script in `docs/newsletter/google-apps-script.gs`, deployed as a web app.

## 10. Monitoring, analytics, rate limiting (optional)

| Variable | Where |
| --- | --- |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | sentry.io → project → Client Keys (DSN) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 → Admin → Data streams → `G-…` |
| `NEXT_PUBLIC_GTM_ID` | Tag Manager container `GTM-…` (if set, used instead of the GA ID) |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | clarity.microsoft.com → Settings |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | upstash.com → Redis database → REST API (extra edge rate limit; the site already has database limits) |

Analytics only load after a visitor clicks **Accept** on the cookie banner. The banner appears only when one of the three analytics IDs is set.

## 11. Account cleanup

| Variable | Notes |
| --- | --- |
| `CLEANUP_PROTECTED_EMAILS` | comma list never auto-deleted (default `dev.sitelytc@gmail.com,demo@ginnikibaatein.com`). Accounts that never buy a pass are deleted 24–48 h after signup; admins are always skipped |
| `APP_STORE_URL`, `PLAY_STORE_URL` | store links for `/app` once the apps are live; until then `/app` opens `/reading` |

## After setting everything

1. Redeploy in Vercel (`NEXT_PUBLIC_*` values are baked in at build time).
2. Open `/personal-reading/admin` — the red "settings missing" warning lists anything still missing for Meet links and booking emails.
3. Make a ₹1 test: temporarily set the pass price in `src/gkb/lib/pricing.js`, or use Razorpay test keys on a Preview deployment first.
