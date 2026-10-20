-- =============================================================================
-- Run ONLY after the old apps (chat.thedivinetarotonline.com / tdt-ginni-1,
-- the old main site) are switched off. Fixes what Supabase's security advisor
-- reports for objects those apps created in this project. Safe to re-run.
-- =============================================================================

-- SECURITY DEFINER functions that anyone (even logged-out visitors) can call
-- through /rest/v1/rpc. The new site never calls them from the browser.
revoke execute on function public.get_user_stats(uuid) from anon, authenticated, public;
revoke execute on function public.increment_message_usage(uuid, text, integer) from anon, authenticated, public;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
revoke execute on function public.app_use_reading() from anon, authenticated, public;
-- has_role() is used inside the old apps' RLS policies; keep it callable by
-- signed-in users but not by anonymous visitors.
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;

-- Functions without a fixed search_path.
alter function public.get_user_stats(uuid) set search_path = public;
alter function public.track_subscription_event(uuid, character varying, jsonb) set search_path = public;
alter function public.increment_reading_count(uuid, character varying) set search_path = public;
alter function public.get_remaining_messages(uuid, character varying) set search_path = public;
alter function public.log_payment(uuid, integer, character varying, character varying, character varying, character varying) set search_path = public;

-- Analytics views ran with their creator's rights (bypassing RLS).
alter view if exists public.user_retention set (security_invoker = true);
alter view if exists public.funnel_summary set (security_invoker = true);
revoke select on public.user_retention from anon, authenticated;
revoke select on public.funnel_summary from anon, authenticated;

-- Also in the dashboard (not SQL):
--  * Authentication -> Sign In / Providers -> turn OFF "Allow anonymous sign-ins"
--    once the old chat app is retired (the new site never uses them).
--  * Authentication -> Passwords -> enable "Leaked password protection" (Pro plan).
