import crypto from "crypto";
import { db, getProfile } from "@/gkb/lib/db";
import { PASS_DAYS, REFERRAL_BONUS_READINGS } from "@/gkb/lib/pricing";

/** Constant-time comparison of two hex/utf8 strings. */
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ab.length !== bb.length || ab.length === 0) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** HMAC-SHA256 hex digest. */
export function hmacHex(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Marks a Razorpay order as paid and grants the 30-day pass — exactly once.
 *
 * Called by /api/verify-payment (the checkout handler) and by
 * /api/razorpay/reading-webhook (server-to-server), so a buyer who closes the
 * tab is still credited and two arriving together never credit twice. The
 * whole thing runs inside one Postgres function (credit_reading_order) with
 * the order row locked, so it is atomic.
 *
 * @returns {Promise<{ ok: boolean, alreadyCredited?: boolean, notFound?: boolean, wrongUser?: boolean, user?: object }>}
 */
export async function creditOrder({ razorpayOrderId, razorpayPaymentId, expectUserId }) {
  const { data, error } = await db().rpc("credit_reading_order", {
    p_razorpay_order_id: razorpayOrderId,
    p_razorpay_payment_id: razorpayPaymentId || null,
    p_expect_user: expectUserId || null,
    p_days: PASS_DAYS,
    p_referral_bonus: REFERRAL_BONUS_READINGS,
  });
  if (error) throw error;
  const r = data || {};
  if (r.not_found) return { ok: false, notFound: true };
  if (r.wrong_user) return { ok: false, wrongUser: true };
  const user = r.user_id ? await getProfile(r.user_id) : null;
  return { ok: true, alreadyCredited: !!r.already_credited, user };
}
