import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { creditOrder, hmacHex, safeEqual } from "@/gkb/lib/creditOrder";

export const dynamic = "force-dynamic";

// Razorpay → server notice for the ₹199 reading pass.
// Dashboard: Settings → Webhooks → URL https://thedivinetarotonline.com/api/razorpay/reading-webhook,
// events: payment.captured and order.paid, secret = RAZORPAY_READING_WEBHOOK_SECRET.
//
// This is what credits a buyer who paid but closed the tab before the
// checkout handler could call /api/verify-payment. creditOrder() is
// idempotent, so receiving both (or a retried webhook) never double-credits.
export async function POST(req) {
  const secret = process.env.RAZORPAY_READING_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[reading-webhook] RAZORPAY_READING_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!safeEqual(hmacHex(secret, raw), signature)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const payment = event?.payload?.payment?.entity;
  const order = event?.payload?.order?.entity;
  const razorpayOrderId = payment?.order_id || order?.id;
  const razorpayPaymentId = payment?.id || null;
  const relevant = event?.event === "payment.captured" || event?.event === "order.paid";

  if (!relevant || !razorpayOrderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const result = await creditOrder({ razorpayOrderId, razorpayPaymentId });
    // Orders that aren't reading passes (courses, bookings, kundli reports)
    // simply aren't in our Order table — acknowledge so Razorpay stops retrying.
    return NextResponse.json({ ok: true, credited: !!(result.ok && !result.alreadyCredited), notFound: !!result.notFound });
  } catch (err) {
    console.error("[reading-webhook] credit failed:", err);
    Sentry.captureException(err, { tags: { area: "reading-webhook" } });
    return NextResponse.json({ error: "Retry later" }, { status: 500 });
  }
}
