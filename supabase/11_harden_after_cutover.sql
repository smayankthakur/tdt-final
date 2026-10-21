-- =============================================================================
-- Optional hardening for the site's Supabase project (ginni2,
-- hnaggjopklxcgzxsyswc). Run after 10_unified_platform.sql. Safe to re-run;
-- every statement is skipped if the object does not exist.
--
-- Security Advisor on 21 Oct 2026: 0 errors, 11 warnings.
--  * rls_auto_enable() is an event-trigger helper. Nobody should call it
--    over the API, so execute is revoked below.
--  * tdt_* functions (tdt_log_events, tdt_use_reading, tdt_reading_status,
--    tdt_my_referral_code, tdt_set_referrer, tdt_is_admin, tdt_funnel_report)
--    belong to the mobile-app backend in this project and are called by
--    the app on purpose. They are NOT changed here; review them with the
--    app's code before revoking anything.
-- =============================================================================

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end $$;

-- In the dashboard (not SQL):
--  * Authentication -> Rate limits: raise sign-in / sign-up / token refresh
--    limits (the site signs users in from Vercel's servers, so visitors share
--    a few IPs).
--  * Authentication -> Passwords -> "Leaked password protection" (Pro plan).
--  * Old chat app (chat.thedivinetarotonline.com) lives in a different project
--    (Tdt-Ginni). Once its last pass expires (20 Nov 2026) and its Razorpay
--    subscriptions are cancelled, that project can be paused.
