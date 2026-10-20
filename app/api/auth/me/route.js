import { NextResponse } from "next/server";
import { getSessionUser, summarizeAccess } from "@/gkb/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json(summarizeAccess(user), { headers: { "Cache-Control": "no-store" } });
}
