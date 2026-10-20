import { NextResponse } from "next/server";
import { getOrder } from "@/lib/booking/db";
import { freeSlots } from "@/lib/booking/freeSlots";
import { bidFrom } from "@/lib/booking/session";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

const split = (k?: string) => (k ? { date: k.split("T")[0], time: k.split("T")[1] } : null);

// With the booking cookie: the slot the form will assign to THIS booking.
// With ?tier=standard|urgent: whether a slot of that kind is free right now, and the earliest one — for the landing page.
export async function GET(req: Request) {
  try {
    return await slots(req);
  } catch (err) {
    console.error("[booking/slots] failed", err);
    return NextResponse.json({ available: false, next: null, error: "Slots are unavailable right now." }, { status: 503 });
  }
}

async function slots(req: Request) {
  const bid = bidFrom(req);
  if (bid && !new URL(req.url).searchParams.get("tier")) {
    const o = await getOrder(bid);
    if (!o || o.status !== "paid") return NextResponse.json({ next: null });
    const free = await freeSlots({ tier: o.tier || "standard", paidAt: o.paidAt, bid, prefer: o.heldSlot || undefined });
    return NextResponse.json({ next: split(free[0]) });
  }
  const free = await freeSlots({ tier: new URL(req.url).searchParams.get("tier") === "standard" ? "standard" : "urgent" });
  return NextResponse.json({ available: free.length > 0, next: split(free[0]) });
}
