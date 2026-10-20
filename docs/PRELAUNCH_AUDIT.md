# Pre-launch audit — unified thedivinetarotonline.com

Audited 21 Oct 2026 on the production build (Next.js 15.5.28) running against a local Supabase-compatible
stack (Postgres 16 + Supabase Auth v2.170 + PostgREST 12). Not yet deployed.

**Launch verdict: GO WITH FIXES** — no code blockers remain; the blockers below are setup steps and
confirmations only you can do.

## Blockers (before the domain is switched)
1. **Rotate the WhatsApp Business token** found in plain text in `D:\TDT-main-v1\app\api\newsletter\Test number.txt`
   (it is NOT in the new project). Then delete that file.
2. **Create/prepare the Supabase project**: run `supabase/01…04` and `10_unified_platform.sql`, then
   `npm run migrate:legacy` (dry run, then `--commit`).
3. **Set every env var** from `.env.example` in Vercel (new random secrets; live Razorpay keys).
4. **Register the 3 Razorpay webhooks** (URLs and events in README) with their secrets.
5. **Business details (L16)**: add the legal entity / address / grievance contact to Terms and Contact.

## High (first week)
- Substantiate or soften "India's No.1 Psychic Tarot Reader" and "7L+ seekers" (L12).
- Confirm whether displayed prices include GST (L10).
- Add real, consented testimonials to `src/data/testimonials.ts` (currently empty on purpose).
- Configure SPF/DKIM/DMARC for the Resend sending domain; turn on Supabase backups; add an uptime monitor.
- Lawyer review of Privacy, Terms and Refund pages.

## Evidence summary
| Area | Result | Evidence |
| --- | --- | --- |
| End-to-end flows | PASS | 73/73 checks: signup, login, reset, referral, paywall, ₹199 pass verify + webhook, reading, chat history, booking hold/pay/form/claim, admin, support, newsletter, cron |
| No double credit / double booking | PASS | 12 parallel credits → 1 applied; 12 parallel picks with 3 credits → 3 allowed; slot claim atomic (`pr_claim_slot`) |
| S20 RLS | PASS | anon key reads 0 profiles; signed-in user sees only own row; cannot PATCH own pass; cannot call money RPCs (401) |
| S7 / S8 payments | PASS | constant-time HMAC on checkout + raw-body webhooks; amounts set server-side (`src/gkb/lib/pricing.js`, `src/lib/booking/slots.ts`) |
| S3 / S4 sessions & reset | PASS | reset link single-use, other devices signed out after reset (tested) |
| S6 uploads | PASS | PNG/JPG/WebP only, 2.5 MB cap, private bucket, signed 7-day links |
| S12 rate limits | PASS | reset 3/h per email, support 5/h per IP, booking holds 6/h per IP, subscribe 10/h, admin password 20/15 min |
| S16 admin routes | PASS | `/admin`, `/admin/translations`, `/api/debug/*` → 404; booking admin needs token or Supabase admin role |
| S1 headers | PASS | HSTS preload, CSP with nonce, `frame-ancestors 'self'`, nosniff, Referrer-Policy, Permissions-Policy |
| S21 secrets | PASS (new code) | repo + client bundle grep clean; see Blocker 1 for the old folder |
| S22 dependencies | PASS | `npm audit --omit=dev`: 0 vulnerabilities |
| L1–L3 legal pages | PASS | `/privacy` (cookie table, processors), `/terms`, `/refund-policy` linked in every footer |
| L5 cookie consent | PASS | GA/GTM/Clarity load only after "Accept"; Reject equally prominent; "Cookie settings" in footer |
| L11 fake reviews | PASS | untraceable testimonials removed |
| L18 unsubscribe | PASS | one-click List-Unsubscribe on daily + YouTube emails; tested |
| L20 deletion | PASS | `/delete-account` request + Supabase cascade delete (auth user → profile, chat, orders) |
| Pages | PASS | 19 routes × mobile/desktop: no overflow, no hydration errors, no broken images, no raw i18n keys |
| Unit tests / types / build | PASS | jest 18/18, `tsc` clean, `next build` clean |
