import { NextResponse } from "next/server";
import { getOrder } from "@/lib/booking/db";
import { COOKIE, cookieOpts, openResume, originOf, sealBid } from "@/lib/booking/session";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

// Opens a link made by the admin for a PAID customer whose form is still pending.
export async function GET(req: Request) {
  const origin = originOf(req), bid = openResume(new URL(req.url).searchParams.get("t") || "");
  const o = bid ? await getOrder(bid).catch(() => null) : null;
  if (!bid || !o || o.status !== "paid") return NextResponse.redirect(`${origin}/personal-reading/form`, 303);
  const res = NextResponse.redirect(`${origin}/personal-reading/form`, 303);
  res.cookies.set(COOKIE, sealBid(bid), cookieOpts(req));
  return res;
}
