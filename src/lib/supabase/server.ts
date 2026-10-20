/**
 * Supabase clients — SERVER ONLY. Never import this file from a client component.
 *
 * Two clients, never mixed:
 *  - createAdminClient(): service-role key, no cookies. Bypasses RLS, so it is
 *    used only inside API routes AFTER the caller's identity has been checked.
 *  - createAuthClient(): anon key + the request's cookies. Used only for
 *    Supabase Auth (sign in / sign out / read the session user). Row access
 *    through it is limited by RLS to the user's own rows.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// SUPABASE_URL / SUPABASE_ANON_KEY are read at runtime; the NEXT_PUBLIC_ names
// are a fallback (Next inlines those at build time).
const url = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = () => process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = (): boolean =>
  !!url() && !url().includes('placeholder') && !!anonKey() && !!serviceKey();

let admin: SupabaseClient | null = null;

/** Service-role client (singleton). Throws if Supabase isn't configured. */
export function createAdminClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) and SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  admin ??= createClient(url(), serviceKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return admin;
}

/** Cookie-bound auth client for the current request (route handlers / server components). */
export async function createAuthClient(): Promise<SupabaseClient> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return createServerClient(url(), anonKey(), {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !url().startsWith('http://localhost'),
      sameSite: 'lax',
      path: '/',
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never));
        } catch {
          // Called from a server component — cookies are read-only there; the
          // session is refreshed by the next API call instead.
        }
      },
    },
  });
}

/** @deprecated use createAdminClient — kept so older imports keep compiling. */
export async function createServerClientCompat(): Promise<SupabaseClient> {
  return createAdminClient();
}
export { createServerClientCompat as createServerClient };
export default createAdminClient;
