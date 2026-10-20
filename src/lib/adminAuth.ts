import { timingSafeEqual } from 'crypto';
import { createAuthClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { clientIp, hitLimit } from '@/lib/rateLimitDb';

/**
 * Admin access for /personal-reading/admin (and any future admin screen).
 * Allowed when EITHER
 *  - the signed-in Supabase user has app_metadata.role = "admin"
 *    (set it once in Supabase → Authentication → Users → the user → app_metadata), or
 *  - the request carries the BOOKING_ADMIN_TOKEN password in "x-admin-token".
 * Wrong passwords are rate-limited per IP.
 */
export async function isAdmin(req: Request): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAuthClient();
      const { data } = await supabase.auth.getUser();
      if ((data?.user?.app_metadata as { role?: string } | undefined)?.role === 'admin') return true;
    } catch {
      // fall through to the token check
    }
  }
  const want = process.env.BOOKING_ADMIN_TOKEN || process.env.ADMIN_TOKEN || '';
  const got = req.headers.get('x-admin-token') || '';
  if (!want || !got) return false;
  if (await hitLimit(`admin:${clientIp(req)}`, 20, 15 * 60)) return false;
  if (want.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
