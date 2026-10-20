import { NextResponse } from "next/server";
import { getOrder } from "@/lib/booking/db";
import { verifyWithRazorpay } from "@/lib/booking/payments";
import { bidFrom } from "@/lib/booking/session";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

// Polled by /form (and the landing page banner). The booking comes ONLY from the signed cookie set after payment.
export async function GET(req: Request) {
  const bid = bidFrom(req);
  if (!bid) return NextResponse.json({ status: "unknown" });
  let d = await getOrder(bid);
  if (!d) return NextResponse.json({ status: "unknown" });
  if (d.status === "created" && d.plinkId) { // don't wait for the webhook: ask Razorpay directly
    if (await verifyWithRazorpay(bid, d.plinkId).catch(() => false)) d = (await getOrder(bid))!;
  }
  const done = !!d.formDone;
  let date = null, time = null, meetLink = null;
  if (done && d.slot) { [date, time] = d.slot.split("T"); meetLink = d.meetLink || null; }
  return NextResponse.json({ bid, tier: d.tier || "standard", status: d.status, formDone: done, email: d.email || "", phone: d.phone || "", date, time, meetLink });
}
