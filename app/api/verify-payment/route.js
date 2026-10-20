import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getSessionUser, summarizeAccess } from "@/gkb/lib/auth";
import { creditOrder, hmacHex, safeEqual } from "@/gkb/lib/creditOrder";

// The browser's Razorpay checkout handler posts here after payment.
// 1. Re-derive the signature with the key secret (constant-time compare) —
//    the step that proves the payment is real.
// 2. creditOrder() flips the order to "paid" exactly once and grants the pass.
//    /api/razorpay/reading-webhook does the same if the tab was closed first.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }

  const expected = hmacHex(process.env.RAZORPAY_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
  if (!safeEqual(expected, razorpay_signature)) {
    return NextResponse.json({ error: "Signature mismatch — payment could not be verified." }, { status: 400 });
  }

  try {
    const result = await creditOrder({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        expectUserId: user.id,
      });
    if (result.notFound || result.wrongUser) {
      return NextResponse.json({ error: "This order doesn't belong to your account." }, { status: 403 });
    }
    return NextResponse.json({ verified: true, access: summarizeAccess(result.user) });
  } catch (err) {
    console.error("verify-payment failed:", err);
    Sentry.captureException(err, { tags: { area: "verify-payment" } });
    return NextResponse.json(
      { error: "Payment received but we couldn't unlock it yet. It will unlock automatically within a few minutes — or contact support." },
      { status: 500 }
    );
  }
}
