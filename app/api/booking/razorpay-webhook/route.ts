import { NextResponse } from "next/server";
import crypto from "crypto";
import { markPaid } from "@/lib/booking/payments";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.BOOKING_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  const good = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)))
    return NextResponse.json({ error: "bad signature" }, { status: 401 });

  let ev: any;
  try { ev = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad payload" }, { status: 400 }); }
  if (ev.event !== "payment_link.paid") return NextResponse.json({ ok: true });
  const pl = ev.payload.payment_link.entity, pay = ev.payload.payment?.entity;
  const bid = String(pl.reference_id || "");
  await markPaid(bid, pl.id, pay?.id || null, pay?.email || pl.customer?.email || "", pay?.contact || pl.customer?.contact || "");
  return NextResponse.json({ ok: true });
}
