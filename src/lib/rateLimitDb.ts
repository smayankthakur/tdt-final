import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * Database-backed fixed-window limiter for low-volume, abuse-prone actions
 * (password-reset emails, support tickets, booking holds). Returns true when
 * the key is OVER its limit. Fails open if the database is unreachable so a
 * hiccup never blocks a real customer.
 */
export async function hitLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { data, error } = await createAdminClient().rpc('rate_hit', {
      p_key: key.slice(0, 200),
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch (err) {
    console.error('[rate-limit] check failed (allowing request)', err);
    return false;
  }
}

/** Best-effort client IP for rate-limit keys (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}
