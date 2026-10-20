import * as Sentry from "@sentry/nextjs";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/gkb/lib/auth";
import { db } from "@/gkb/lib/db";
import { PASS_PRICE_INR, PASS_DAYS, PASS_PRODUCT } from "@/gkb/lib/pricing";

// Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set as environment
// variables (server-side only — never expose the key secret to the client).
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
      { status: 500 }
    );
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const amount = PASS_PRICE_INR * 100; // paise
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `gkb_${Date.now()}`.slice(0, 40),
      notes: { product: PASS_PRODUCT, description: `Ginni Ki Baatein — ${PASS_DAYS} day pass`, userId: user.id },
    });

    // Recorded so /api/verify-payment can confirm this order belongs to
    // this user and hasn't already been credited, before it trusts anything
    // the client sends back.
    const { error: insErr } = await db().from("reading_orders").insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount,
      status: "created",
    });
    if (insErr) throw insErr;

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    Sentry.captureException(err, { tags: { area: "create-order" } });
    return NextResponse.json({ error: "Could not create order." }, { status: 500 });
  }
}
