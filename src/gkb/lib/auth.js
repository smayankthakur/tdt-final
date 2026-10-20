import jwt from "jsonwebtoken";
import * as Sentry from "@sentry/nextjs";
import { createAuthClient } from "@/lib/supabase/server";
import { dbConfigured, getProfile } from "@/gkb/lib/db";
import { FREE_READING_LIMIT, PASS_PRICE_INR, REFERRAL_BONUS_READINGS } from "@/gkb/lib/pricing";

export { FREE_READING_LIMIT, REFERRAL_BONUS_READINGS };
export const MONTHLY_PRICE_INR = PASS_PRICE_INR; // legacy name

// Accounts are Supabase Auth users (one login for the whole site). The
// session lives in Supabase's own httpOnly cookies, refreshed by
// @supabase/ssr; password reset and "log out everywhere" are handled by
// Supabase, so there is no custom session JWT any more.

export const authConfigured = () => dbConfigured();

/**
 * The logged-in reader (profile merged with the auth email) or null.
 * Never throws: a misconfigured or unreachable backend degrades to
 * "logged out" instead of crashing every page load.
 */
export async function getSessionUser() {
  if (!dbConfigured()) return null;
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    const profile = await getProfile(data.user.id);
    if (!profile) return null;
    return { ...profile, email: data.user.email || profile.email };
  } catch (err) {
    console.error("getSessionUser failed", err);
    Sentry.captureException(err, { tags: { area: "getSessionUser" } });
    return null;
  }
}

export function summarizeAccess(user) {
  if (!user) {
    return { loggedIn: false };
  }
  const subscribed = !!(user.subscriptionExpires && new Date(user.subscriptionExpires) > new Date());
  const limit = FREE_READING_LIMIT + (user.bonusReadings || 0);
  const freeLeft = Math.max(0, limit - user.readingsUsed);
  return {
    loggedIn: true,
    email: user.email,
    name: user.name,
    readingsUsed: user.readingsUsed,
    bonusReadings: user.bonusReadings || 0,
    freeLeft,
    subscribed,
    subscriptionExpires: user.subscriptionExpires,
    hasAccess: subscribed || user.readingsUsed < limit,
    referralCode: user.referralCode || null,
  };
}

// ---- Pick tokens ---------------------------------------------------------
// A pick token authorizes exactly one already-charged reveal (a specific
// user + topic + card), so switching languages on an already-picked card
// re-fetches text without spending another credit. It is a short-lived
// signed value, not a login session.
function pickSecret() {
  const secret = process.env.READING_TOKEN_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error("READING_TOKEN_SECRET is not set");
  return secret;
}

export function createPickToken({ userId, topicId, card, question }) {
  const payload = { userId, topicId, card };
  if (question) payload.question = String(question).slice(0, 500);
  return jwt.sign(payload, pickSecret(), { expiresIn: "20m", audience: "pick" });
}

export function verifyPickToken(token) {
  try {
    return jwt.verify(token, pickSecret(), { audience: "pick" });
  } catch {
    return null;
  }
}
