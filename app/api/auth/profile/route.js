import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db, toUser } from "@/gkb/lib/db";
import { getSessionUser, summarizeAccess } from "@/gkb/lib/auth";

// Saves the reading name on the account — once. The name is locked after
// that so one subscription stays tied to one person. Changing it later is a
// support/admin job. The "name is null" condition is in the UPDATE itself,
// so two tabs racing can't both set it.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  if (user.name && user.name.trim()) {
    return NextResponse.json(summarizeAccess(user));
  }
  const { name } = await req.json().catch(() => ({}));
  const clean = String(name || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!clean) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  try {
    const { data, error } = await db()
      .from("profiles")
      .update({ name: clean })
      .eq("id", user.id)
      .is("name", null)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(summarizeAccess(data ? { ...toUser(data), email: user.email } : user));
  } catch (err) {
    console.error("Saving profile name failed:", err);
    Sentry.captureException(err, { tags: { area: "profile" } });
    return NextResponse.json({ error: "Couldn't save your name right now." }, { status: 500 });
  }
}
