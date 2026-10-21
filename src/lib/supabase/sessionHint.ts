import { cookies } from 'next/headers';

/**
 * True when the request carries a Supabase session cookie. A cheap hint for
 * server components (no network call, no token refresh): with no cookie the
 * visitor is certainly logged out, so the page can render the logged-out UI
 * straight away. With a cookie, the client confirms via /api/auth/me.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const all = (await cookies()).getAll();
  return all.some((c) => /^sb-[a-z0-9]+-auth-token(\.\d+)?$/i.test(c.name) && !!c.value);
}
