# Pre-launch audit: unified thedivinetarotonline.com

Re-audited 21 Oct 2026, 16:10 IST, against the **live deployment** `tdt-final.vercel.app` (env loaded, connected to Supabase **ginni2** `hnaggjopklxcgzxsyswc`). Evidence comes from:

- `curl` against the live site (headers, routes, CSRF, webhooks, cookies, crons);
- a scan of 24 client JS bundles for secrets;
- a direct read-only database inspection (RLS, grants, counts) plus anon-key REST probes;
- the Supabase dashboard (Security Advisor, Auth rate limits, backups);
- the public GitHub page and DNS;
- the earlier local test suite (e2e 82/82, axe on 14 pages).

This is a technical and compliance checklist, not legal advice.

**Launch verdict: NO-GO.** The site itself is working on the live database (logins, passes and bookings verified). After the 21 Oct fixes, open items are B1 (rotate the WhatsApp token), B2 (cancel old subscriptions), B5 (confirm webhooks) and B6 (business details) — none of them is a code change.

## Blockers (must be fixed before the domain is switched)

| # | Status | Blocker | What to do |
| --- | --- | --- | --- |
| B1 | **PARTLY DONE** | Repo made **private** and `_import/` removed (commit e0d07b2, `/_import/` gitignored); github.com/smayankthakur/tdt-final now returns 404 when logged out. Still open: the WhatsApp token from that archive is still valid. | Revoke the WhatsApp token in Meta and issue a new one. Ask a lawyer whether the ~50 exposed subscriber emails need a DPDP breach notice. (Old commits still contain `_import/` but are now private; purge history only if you will ever make the repo public again.) |
| B2 | **OPEN** | **Old subscriptions still running.** The old chat app has 189 active passes (to 20 Nov 2026) and 819 Razorpay subscription IDs. 24 reading accounts are on monthly Razorpay subscriptions that the new site cannot renew. | Cancel those recurring subscriptions in Razorpay. Keep `chat.thedivinetarotonline.com` on the old app until 20 Nov 2026. |
| B3 | DONE | Database set up and data moved. | Live counts: 748 accounts with profiles, 302 active passes, 330 paid orders, 141 booking orders. Re-run `npm run migrate:legacy -- --commit` just before the domain switch. |
| B4 | DONE | Vercel env loaded. | `/api/booking/slots` returns 200 and the demo login works on the live site. |
| B5 | **NEEDS-HUMAN** | **Razorpay webhooks registered?** All 3 endpoints are live and reject unsigned calls (401). Whether Razorpay has them registered can only be confirmed in the Razorpay dashboard. | Add the 3 webhook URLs (README) on the **live-mode** dashboard with the secrets from `.env.vercel`, then send a test event. |
| B6 | **OPEN** | **Business details missing (L16).** `/terms` and `/contact` show no legal entity, address or grievance officer. | Tell me the legal name, address, grievance officer's name and email, and GSTIN (if any), and I'll add them. |
| B7 | DONE | Supabase Auth rate limits raised on ginni2 (21 Oct): sign-ups/sign-ins 30 → 1000 and token refreshes 150 → 3000 per 5 min per IP (re-read after save). | — |

## High (first week)

- **ginni2 is on the Free plan: no backups** (dashboard: "Free Plan does not include project backups"). It now holds 748 paying accounts and payment history. Upgrade to Pro (7 days of daily backups) and test a restore.
- Add a DMARC record (still missing): `_dmarc.thedivinetarotonline.com TXT "v=DMARC1; p=none"`. The domain's DNS is on Vercel DNS in **another Vercel account** (not smayankthakurs-projects), so it must be added there. The domain cutover also happens in that account: either move the `tdt-final` project there or move the domain to this account.
- Make one real ₹1 live payment for each flow: reading pass, personal reading, Kundli report.
- Back up or soften "India's No.1 Psychic Tarot Reader" and "Trusted by 7L+ Seekers" (L12).
- Add an uptime monitor.
- Have a lawyer review the Privacy, Terms and Refund pages.
- Rotate the old `BOOKING_ADMIN_TOKEN` (`thedivinetarot111`) wherever it is still used.
- Review the mobile app's `tdt_log_events()` (callable without login) and the other `tdt_*` functions with the app code.

## Advisory

- Signup says "account already exists" (S5). It is a deliberate UX choice and is capped at 10 signups per IP per hour. Login and password reset do not reveal whether an account exists.
- Six `<img>` tags could use `next/image` for a better LCP.
- The decorative watermark glyphs (`aria-hidden`) on `/premium`, `/support` and `/delete-account` fail the contrast check by design. WCAG exempts decorative text.
- Next 15 `next lint` is deprecated. Move to the ESLint CLI when convenient.

---

## 1. Legal and trust

| ID | Status | Evidence | Fix |
| --- | --- | --- | --- |
| L1 Privacy policy | PASS | `/privacy` lists the data collected, purposes, retention, processors (Supabase, Razorpay, Resend, Google, Sentry, analytics) and withdrawal; it is linked in the footer and the signup form | lawyer review (High) |
| L2 Terms | PASS | `/terms` covers acceptable use, liability, payments and jurisdiction | lawyer review |
| L3 Refund policy | PASS | `/refund-policy`, linked from the footer, course pages and checkout | — |
| L4 Cookie policy | PASS | the cookie table on `/privacy` lists Supabase auth cookies, consent, GA, Clarity and Razorpay | — |
| L5 Consent banner | PASS | `ConsentAnalytics.tsx`: GA, GTM and Clarity load only after Accept; Reject has equal weight; "Cookie settings" is in the footer | — |
| L6 Form consents | PASS | the newsletter is opt-in only; the 18+/Terms checkbox is unticked and separate; `age_confirmed_at` is stored on the user | — |
| L7 Data minimisation | PASS | birth details are asked only for Kundli and personal readings, where the service needs them | — |
| L8 Third-party SDKs | PASS | Razorpay, GA/GTM, Clarity, Sentry and Resend are each named in the privacy policy | — |
| L9 Dark patterns | PASS | no pre-ticked boxes; the Diwali offer has a real end date (`src/lib/booking/offer.ts`); the pass is a one-time 30-day purchase, not auto-renewing | — |
| L10 Hidden fees | PASS | the price shown is the amount charged (set on the server, nothing added at checkout); `/terms` says prices include applicable taxes | confirm GST treatment with your CA |
| L11 Fake reviews | PASS | untraceable testimonials were removed; `src/data/testimonials.ts` is empty on purpose | add only consented ones |
| L12 Claims | NEEDS-HUMAN | "India's No.1", "7L+ seekers"; the astrology disclaimer is on the reading and Kundli pages | substantiate or soften |
| L13 Alt text | PASS | axe `image-alt`: 0 violations on 14 pages | — |
| L14 Contrast | PASS | axe `color-contrast`: 0 real violations after fixes (footer trust row, upload hints); only decorative `aria-hidden` glyphs remain | — |
| L15 Keyboard | PASS | "Skip to content" is the first Tab stop on every page with a visible focus ring; form labels are linked (`FloatingInput` and Kundli fields fixed); the scrollable strip is focusable | real-device check |
| L16 Business details | FAIL | no legal entity, address or grievance officer on any page | Blocker B6 |
| L17 Minors | PASS | an 18+ confirmation is required at signup (`AuthGate.jsx`, server rejects without it); analytics need consent | — |
| L18 Unsubscribe | PASS | the daily and YouTube emails send a one-click `List-Unsubscribe` header; tested end to end | — |
| L19 Licences | NEEDS-HUMAN | card artwork, photos and fonts came from the old repos | keep licence proof |
| L20 Deletion | PASS | `/delete-account` has an instant self-serve delete that removes the auth user, cascades to profile, chat and orders, and removes tickets, uploads and the newsletter row; tested | — |

## 2. Security

| ID | Status | Evidence | Fix |
| --- | --- | --- | --- |
| S1 Headers | PASS | live (after deploy of e0d07b2): HSTS `max-age=63072000; includeSubDomains; preload`, CSP with nonce, nosniff, `X-Frame-Options: SAMEORIGIN`, Referrer-Policy, Permissions-Policy | — |
| S2 CSRF | PASS | `middleware.ts` rejects cross-origin POST, PUT, PATCH and DELETE to `/api` with 403 (tested); cookies are SameSite=Lax | — |
| S3 Sessions on reset | PASS | reset calls `signOut({scope:'others'})`; the e2e test shows the old session is refused | — |
| S4 Reset links | PASS | single-use Supabase recovery token, short expiry, reuse rejected (e2e) | — |
| S5 Enumeration | PASS (accepted) | login and reset return generic messages; signup reveals existing accounts (see Advisory) | — |
| S6 Uploads | PASS | PNG, JPEG and WebP only, checked by MIME and magic bytes (spoofed file refused in e2e); 2.5 MB app cap and 3 MB bucket cap; private bucket; random names; signed links | — |
| S7 Webhooks | PASS | constant-time HMAC on the raw body for all 3 webhooks and on the checkout callback; idempotent `credit_reading_order` (12 parallel → 1 credit) | register them (B5) |
| S8 Server prices | PASS | amounts come from `src/gkb/lib/pricing.js`, `src/lib/booking/slots.ts` and the Kundli route; the client amount is ignored | — |
| S9 Prompt injection | PASS | the AI fallback is off unless a key is set; its output is rendered as text and never triggers actions | — |
| S10 AI caps | PASS | every AI call needs a paid credit; `max_tokens: 500`; question capped at 500 characters | set provider spend alert if enabled |
| S11 Request size | PASS | upload caps, length caps on questions, forms and support text; Vercel 4.5 MB body limit | — |
| S12 Rate limits | PASS | site's own limiter `rate_hit()`: login 10/15 min per email and 30 per IP, signup 10/h, reset 3/h, support 5/h, booking holds 6/h, subscribe 10/h. Supabase Auth raised to 1000 sign-ins / 3000 refreshes per 5 min | — |
| S13 Validation | PASS | server-side checks on every route; supabase-js parameterises queries; no raw HTML rendering of user input | — |
| S14 CORS | PASS | no `Access-Control-Allow-Origin` on the API; same-origin only | — |
| S15 Directory listing | PASS | `support-uploads` bucket: `public=false`, 3 MB, PNG/JPEG/WebP only (DB check); `/.env` and `/.env.vercel` return 404 live | — |
| S16 Admin routes | PASS | live: `/admin` and `/api/debug/x` return 404; crons return 401 without `CRON_SECRET`; the booking admin data needs a Supabase `role=admin` or the token | — |
| S17 Lockout | PASS | per-email login throttle (10/15 min) with no permanent lock, so real users can't be locked out | — |
| S18 Security logs | PASS | Supabase Auth audit log; payment, webhook and admin events go to Sentry/console without secrets | — |
| S19 Cookies | PASS | live login: `sb-hnaggjopklxcgzxsyswc-auth-token …; Secure; HttpOnly; SameSite=lax` | `__Host-` prefix not possible with Supabase's cookie name; acceptable |
| S20 DB permissions | PASS | live DB: RLS on for every `public` table; anon key reads 0 rows from all site and old tables; money RPCs return 404 to anon; anon-callable SECURITY DEFINER functions cut from 4 to 1 today (revoked the 3 trigger functions; triggers re-tested in a rolled-back transaction); Security Advisor 0 errors, 9 warnings | review mobile-app `tdt_log_events` (High) |
| S21 Secrets | FAIL (until token rotated) | 24 live JS bundles: no service-role JWT, Razorpay secret, Resend, Google or Sentry tokens; `.env*` not in the repo. Repo now private and `_import/` removed, but the WhatsApp token that was exposed is still valid | rotate it (B1) |
| S22 Dependencies | PASS | `npm audit --omit=dev`: 0 vulnerabilities; Next 15.5.28 | — |
| S23 Debug leaks | PASS | generic error JSON; live `*.js.map` returns 403 (maps go to Sentry only) | — |

## 3. Scalability and reliability

| ID | Status | Evidence | Fix |
| --- | --- | --- | --- |
| Rate limiting | PASS | see S12; optional Upstash at the edge | — |
| Caching | PASS | static pages are SSG; hashed assets are immutable; authenticated APIs are `no-store` | — |
| Timeouts | PASS | `AbortSignal.timeout(20000)` on every outbound call (Razorpay, Google, Resend, WhatsApp, YouTube, astrology) | — |
| Retries | N/A | no automatic retries on payment calls by design; webhooks are retried by Razorpay | — |
| Idempotency | PASS | the order ID is the key for credits; slot holds and claims are atomic (`pr_hold_slot` / `pr_claim_slot`) | — |
| Indexes | PASS | indexes on `user_id`, `created_at`, `order_id`, `slot` and `email` in `10_unified_platform.sql` | — |
| N+1 | PASS | list endpoints use one query each | — |
| Pooling | PASS | supabase-js goes over HTTP (PostgREST); the migration uses one direct connection | — |
| Race conditions | PASS | 12 parallel consumes with 3 credits → exactly 3 succeed; no double booking | — |
| Memory | PASS | no module-level growing caches; serverless | — |
| Cron | PASS | 3 crons, `CRON_SECRET` required, UTC times, idempotent (daily send dedupes by date) | — |
| CI/CD | PASS | GitHub Actions: lint, typecheck, jest, build; Vercel previews | — |
| Queues / sagas / scale-out | N/A | the traffic and the single service do not justify them | — |

## 4. Launch hygiene

| Item | Status | Evidence |
| --- | --- | --- |
| robots / sitemap / noindex | PASS | `/robots.txt` and `/sitemap.xml` are generated from `NEXT_PUBLIC_APP_URL`; no noindex in production |
| SSL, www and legacy subdomains | NEEDS-HUMAN | the middleware redirects `www`, `reading`, `learn`, `booking` and `support` (tested locally); the domains must be added in Vercel |
| 404 / 500 pages | PASS | custom `app/not-found.tsx` (added) and `global-error.tsx` |
| Titles, meta, OG, favicon | PASS | per-page metadata and OG image |
| SPF / DKIM / DMARC | FAIL (DMARC) | SPF and DKIM are on the Resend `send.` subdomain; `dns.google` still returns no `_dmarc` TXT (21 Oct) |
| Monitoring and backups | FAIL (backups) | Sentry configured; no uptime monitor; ginni2 Free plan has no backups (High) |
| Phone and Lighthouse | PASS (emulated) | 19 routes in mobile and desktop emulation: no overflow, hydration errors or broken images; real phone still to do |
| Tests | PASS | e2e 82/82, the browser reading flow (paywall → pass → draw → reveal → history), jest 18/18, `tsc` clean, `next build` clean |

## Cutover order

1. B1 now: make the repo private, then rotate the WhatsApp token.
2. B5–B7: webhooks, business details, Supabase Auth rate limits. Cancel the old Razorpay subscriptions (B2).
3. Push the latest code, then make a ₹1 live test of each payment flow.
4. Re-run `npm run migrate:legacy -- --commit`.
5. Move `thedivinetarotonline.com`, `www`, `reading`, `learn`, `booking` and `support` to this Vercel project. Leave `chat` on the old app until 20 Nov 2026.
6. After 20 Nov 2026: point `chat` here and pause the old Tdt-Ginni project.
