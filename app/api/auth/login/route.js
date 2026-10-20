import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { authConfigured, getSessionUser, summarizeAccess } from "@/gkb/lib/auth";
import { clientIp, hitLimit } from "@/lib/rateLimitDb";

export async function POST(req) {
  if (!authConfigured()) {
    return NextResponse.json({ error: "Server isn't configured yet. Contact the site owner." }, { status: 500 });
  }
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  // Brute-force guard: at most 10 attempts per email and 30 per IP every 15 minutes.
  const normalized = String(email).trim().toLowerCase();
  if ((await hitLimit(`login:email:${normalized}`, 10, 15 * 60)) || (await hitLimit(`login:ip:${clientIp(req)}`, 30, 15 * 60))) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes or reset your password." }, { status: 429 });
  }

  try {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email).trim().toLowerCase(),
      password: String(password),
    });
    if (error) {
      if (error.status === 400 || /invalid/i.test(error.message)) {
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      }
      if (error.status === 429) {
        return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
      }
      throw error;
    }
    const user = await getSessionUser();
    if (!user) throw new Error("Signed in but no profile row found");
    return NextResponse.json(summarizeAccess(user));
  } catch (err) {
    console.error("Login failed:", err);
    Sentry.captureException(err, { tags: { area: "login" } });
    return NextResponse.json({ error: "Couldn't log you in right now. Please try again in a moment." }, { status: 500 });
  }
}
