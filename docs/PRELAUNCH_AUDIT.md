# Pre-launch audit: unified thedivinetarotonline.com

Audited 21 Oct 2026. I tested the production build (Next.js 15.5.28) against a local Supabase-compatible stack: Postgres 16, Supabase Auth v2.170 and PostgREST 12. I also inspected:

- the live preview at `tdt-final.vercel.app` (no env vars set yet);
- the site's Supabase project **ginni2** (`hnaggjopklxcgzxsyswc`, the reading app's database: Security Advisor and row counts, read-only), and the old chat app's project `Tdt-Ginni`;
- the public GitHub repo `smayankthakur/tdt-final`;
- DNS for the domain.

This is a technical and compliance checklist, not legal advice.

**Launch verdict: NO-GO.** The code is ready. What blocks launch is outside the code: a public repo that exposes a token and customer data, a live database and Vercel project that are not set up yet, and old subscribers who still need to be handled.

## Blockers (must be fixed before the domain is switched)

| # | Blocker | What to do |
| --- | --- | --- |
| B1 | **The GitHub repo `smayankthakur/tdt-final` is public.** Its `_import/*.tgz` archives contain the WhatsApp Business token (`main.tgz` and `fresh/main.tgz` → `Test number.txt`), a SQL file with about 50 subscriber emails (`fresh/support.tgz` → `activate_razorpay_subscribers.sql`) and the paid reading content. | 1. Make the repo private now. 2. Delete `_import/` and purge it from history; deleting and recreating the repo from this clean copy is simplest. 3. Revoke the WhatsApp token in Meta and create a new one. 4. With a lawyer, decide whether the exposure of subscriber emails needs a DPDP breach notice. |
| B2 | **189 people still hold an active premium pass on the old chat app** (latest expiry 20 Nov 2026), and Razorpay has 819 subscription IDs. 182 of them are anonymous accounts that cannot log in to the new site. | Keep `chat.thedivinetarotonline.com` on the old app and its own Supabase project (Tdt-Ginni) until 20 Nov 2026. Cancel the recurring Razorpay subscriptions so nobody is charged again. |
| B3 | **The site's database is not prepared.** No SQL has been applied to ginni2 yet, and its 748 reading accounts (305 with an active pass), 711 orders and 9,161 chat messages have not been moved into the site's tables. | Run `supabase/01…04` and `10_unified_platform.sql` in ginni2's SQL editor. Then run `npm run migrate:legacy` as a dry run, then with `--commit` (uses the service-role key; tested locally: old passwords log in, passes, bonus, referrals and the last 30 chats carry over, and a re-run changes nothing). |
| B4 | **The Vercel project `tdt-final` has no environment variables.** Right now `/api/booking/slots` returns 503. `.env.vercel` is complete (Supabase now points at ginni2; keys verified against its API). | Load all 44 variables into Vercel, then redeploy. |
| B5 | **The Razorpay webhooks are not registered.** | Create the 3 webhooks listed in the README, each with its own secret. |
| B6 | **Business details are missing (L16).** | Add the legal entity name, address, a grievance officer's name and email, and the GSTIN if registered to `/terms` and `/contact`. |
| B7 | **Supabase Auth rate limits are too low.** Sign-ins happen server-side, so every visitor shares a handful of Vercel IPs, and the default per-IP limit would start refusing logins on a busy day. | In Supabase → Authentication → Rate limits, raise the sign-in, sign-up and token-refresh limits. The site already applies its own per-email and per-IP limits. |

## High (first week)

- **24 reading accounts are marked as active monthly Razorpay subscribers** (`subscriptionStatus = active`). Their current expiry carries over, but the new site sells one-time 30-day passes and has no handler for subscription renewals. Cancel those subscriptions in Razorpay (or keep extending their pass by hand) before the next renewal date.
- ginni2 is on the **Free plan**: no downloadable backups and no leaked-password protection. Move it to Pro (daily backups, PITR add-on) before launch traffic, then test a restore.
- Security Advisor on ginni2: 0 errors, 11 warnings. `11_harden_after_cutover.sql` revokes API access to `rls_auto_enable()`. The other warnings are the mobile app's `tdt_*` functions, which the app calls on purpose; review them with the app's code.
- Add a DMARC record for `thedivinetarotonline.com`, for example `_dmarc TXT "v=DMARC1; p=none; rua=mailto:<you>"`. SPF and DKIM are already present.
- The current booking site on Vercel uses `rzp_test_` keys. Confirm that the new project uses the live keys, then make one real ₹1 payment end to end.
- Substantiate or soften "India's No.1 Psychic Tarot Reader" and "Trusted by 7L+ Seekers" (L12).
- Confirm whether the displayed prices include GST, and say so next to each price (L10).
- Add an uptime monitor.
- Have a lawyer review the Privacy, Terms and Refund pages.
- Rotate the old `BOOKING_ADMIN_TOKEN` (`thedivinetarot111`) everywhere it is still used. The new project uses a fresh random token.

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
| L10 Hidden fees | NEEDS-HUMAN | the full price is shown before checkout and set on the server; GST inclusion is not stated | state "incl. GST" or add GST |
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
| S1 Headers | PASS | `curl -sI https://tdt-final.vercel.app`: HSTS `max-age=63072000; includeSubDomains; preload`, CSP with nonce, nosniff, `X-Frame-Options`, Referrer-Policy, Permissions-Policy | — |
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
| S12 Rate limits | PASS | DB limiter `rate_hit()`: login 10/15 min per email and 30 per IP, signup 10/h per IP, reset 3/h, support 5/h, booking holds 6/h, subscribe 10/h | raise Supabase limits (B7) |
| S13 Validation | PASS | server-side checks on every route; supabase-js parameterises queries; no raw HTML rendering of user input | — |
| S14 CORS | PASS | no `Access-Control-Allow-Origin` on the API; same-origin only | — |
| S15 Directory listing | PASS | the support bucket is private; `/.env` and `/.env.vercel` return 404 on the preview | — |
| S16 Admin routes | PASS | `/admin` and `/api/debug/*` return 404; the booking admin needs a Supabase `role=admin` or the token | — |
| S17 Lockout | PASS | per-email login throttle (10/15 min) with no permanent lock, so real users can't be locked out | — |
| S18 Security logs | PASS | Supabase Auth audit log; payment, webhook and admin events go to Sentry/console without secrets | — |
| S19 Cookies | PASS | `sb-…-auth-token` is HttpOnly, Secure in production, SameSite=Lax (verified in the response header) | — |
| S20 DB permissions | PASS | site tables: RLS on, own-row reads only, money RPCs callable only by service_role (e2e 401 for anon). ginni2 today: anon key reads 0 rows from the old Prisma tables; Security Advisor 0 errors, 11 warnings (mobile-app `tdt_*` functions, `rls_auto_enable`) | run `11_harden_after_cutover.sql`; review `tdt_*` with the app |
| S21 Secrets | FAIL | the new code and client bundle are clean, but the public repo's `_import/*.tgz` exposes the WhatsApp token | Blocker B1 |
| S22 Dependencies | PASS | `npm audit --omit=dev`: 0 vulnerabilities; Next 15.5.28 | — |
| S23 Debug leaks | PASS | generic error JSON; production source maps go to Sentry only | — |

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
| SPF / DKIM / DMARC | FAIL (DMARC) | SPF and DKIM are on the Resend `send.` subdomain; there is no `_dmarc` record |
| Monitoring and backups | NEEDS-HUMAN | the Sentry DSN is configured; uptime monitoring and backups are not confirmed |
| Phone and Lighthouse | PASS (emulated) | 19 routes in mobile and desktop emulation: no overflow, hydration errors or broken images; real phone still to do |
| Tests | PASS | e2e 82/82, the browser reading flow (paywall → pass → draw → reveal → history), jest 18/18, `tsc` clean, `next build` clean |

## Cutover order

1. B1: make the repo private, then rotate the WhatsApp token.
2. B3 and B4: apply the SQL, run the migration, then load the env and redeploy.
3. B5–B7: webhooks, business details, Auth rate limits.
4. Make a ₹1 live test: buy the pass, book a personal reading, buy the Kundli report.
5. Move `thedivinetarotonline.com`, `www`, `reading`, `learn`, `booking` and `support` to this project. Leave `chat` on the old app until 20 Nov 2026.
6. After 20 Nov 2026, once the old subscriptions are cancelled: point `chat` here and pause the old Tdt-Ginni project.
