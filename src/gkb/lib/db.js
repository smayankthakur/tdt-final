// Reading-app data access — everything lives in Supabase now (one login and one
// database for the whole site). Rows are read and written with the service-role
// client, and only after the caller's identity has been checked by
// getSessionUser() in lib/auth.js. See supabase/10_accounts_and_readings.sql.
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dbConfigured = () => isSupabaseConfigured();

export function db() {
  return createAdminClient();
}

/** Throws the Supabase error (so callers' try/catch + Sentry still work). */
export function must({ data, error }) {
  if (error) throw error;
  return data;
}

// profiles row (snake_case) -> the camelCase "user" shape the reading app has
// always used, so components and routes didn't need to change.
export function toUser(p) {
  if (!p) return null;
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    readingsUsed: p.readings_used ?? 0,
    bonusReadings: p.bonus_readings ?? 0,
    subscriptionExpires: p.subscription_expires,
    referralCode: p.referral_code,
    referredByUserId: p.referred_by,
    referralRewarded: !!p.referral_rewarded,
    createdAt: p.created_at,
  };
}

export async function getProfile(id) {
  const { data, error } = await db().from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return toUser(data);
}
