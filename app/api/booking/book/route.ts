import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sb, must } from "@/lib/booking/db";
import { razorpayAuth } from "@/lib/booking/payments";
import { clientIp, hitLimit } from "@/lib/rateLimitDb";
import { freeSlots } from "@/lib/booking/freeSlots";
import { HOLD_MS, priceFor, type Tier } from "@/lib/booking/slots";
import { originOf } from "@/lib/booking/session";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

const NO_URGENT = "Agle 48 ghante mein koi urgent slot khaali nahi hai. Normal booking karein ya WhatsApp karein: +91 88281 16545.";
const NO_SLOTS = "Abhi saare slots full hain. WhatsApp karein: +91 88281 16545.";

// Step 1 of the flow: payment FIRST. Nobody can pay unless a slot is actually free.
// Standard: the earliest free slot from day 7 after payment (day 7–10) is assigned when the form is submitted.
// Urgent: an available slot within 48 h is held BEFORE payment, so nobody pays ₹17,000 for a slot that doesn't exist.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const tier: Tier = body?.tier === "urgent" ? "urgent" : "standard";
  const origin = originOf(req); // always return the customer to the domain they are actually on
  // Each attempt can hold an urgent slot for 35 minutes — cap attempts per visitor.
  if (await hitLimit(`book:${clientIp(req)}`, 6, 60 * 60))
    return NextResponse.json({ error: "Bahut saari koshish ho gayi. Thodi der baad try karein ya WhatsApp karein: +91 88281 16545." }, { status: 429 });

  const bid = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  let heldSlot: string | null = null;
  if (tier === "standard" && !(await freeSlots({ tier })).length)
    return NextResponse.json({ error: NO_SLOTS, code: "no_slots" }, { status: 409 });
  if (tier === "urgent") {
    const cands = (await freeSlots({ tier })).slice(0, 15);
    if (!cands.length) return NextResponse.json({ error: NO_URGENT, code: "no_slots" }, { status: 409 });
    // The order row must exist first (pr_bookings.bid references it).
    must(await sb().from("pr_orders").insert({ bid, status: "created", tier, amount: priceFor(tier), held_slot: null, origin, created_at_ms: Date.now() }));
    heldSlot = must(await sb().rpc("pr_hold_slot", { p_bid: bid, p_tier: tier, p_candidates: cands, p_hold_until: Date.now() + HOLD_MS, p_now: Date.now() })) as string | null;
    if (!heldSlot) await sb().from("pr_orders").delete().eq("bid", bid);
    if (!heldSlot) return NextResponse.json({ error: NO_URGENT, code: "no_slots" }, { status: 409 });
  }
  if (tier === "urgent") must(await sb().from("pr_orders").update({ held_slot: heldSlot }).eq("bid", bid));
  else must(await sb().from("pr_orders").insert({ bid, status: "created", tier, amount: priceFor(tier), held_slot: null, origin, created_at_ms: Date.now() }));
  const r = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST", headers: { Authorization: razorpayAuth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: priceFor(tier) * 100, currency: "INR", accept_partial: false,
      reference_id: bid,
      description: tier === "urgent" ? "Urgent Personal Call Reading (within 48 hrs) — The Divine Tarot" : `Personal Call Reading${priceFor(tier) < Number(process.env.PRICE_INR || 8500) ? " (Diwali Offer)" : ""} — The Divine Tarot`,
      expire_by: Math.floor(Date.now() / 1000) + 30 * 60, notes: { bid, tier },
      // No booking ID in our own URL: Razorpay adds its signed parameters and /api/booking/pay-return verifies them.
      callback_url: `${origin}/api/booking/pay-return`, callback_method: "get",
    }),
  });
  const link = await r.json();
  if (!link.short_url) {
    await sb().from("pr_orders").delete().eq("bid", bid); // cascades to the held slot
    return NextResponse.json({ error: "Payment link nahi ban paya. Dobara try karein." }, { status: 502 });
  }
  must(await sb().from("pr_orders").update({ plink_id: link.id }).eq("bid", bid));
  return NextResponse.json({ url: link.short_url });
}
