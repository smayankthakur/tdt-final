import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { authConfigured, getSessionUser, summarizeAccess } from "@/gkb/lib/auth";

const INVALID = "This reset link is invalid or has expired. Please request a new one.";
const looksValid = (t) => typeof t === "string" && /^[A-Za-z0-9_-]{20,200}$/.test(t);

// GET ?token=... -> { valid } so the page can reject a mangled link up front.
// (Whether it has expired is only known when it's used — Supabase tokens are
// single-use, so checking would consume it.)
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  return NextResponse.json({ valid: looksValid(token) });
}

// POST { token, password } -> exchanges the one-time recovery token for a
// session, sets the new password, and signs out every other device.
export async function POST(req) {
  if (!authConfigured()) return NextResponse.json({ error: "Server isn't configured yet." }, { status: 500 });
  const { token, password } = await req.json().catch(() => ({}));
  if (!looksValid(token)) return NextResponse.json({ error: INVALID }, { status: 400 });
  if (!password || String(password).length < 8 || String(password).length > 72) {
    return NextResponse.json({ error: "Password must be 8 to 72 characters." }, { status: 400 });
  }
  try {
    const supabase = await createAuthClient();
    const { error: otpErr } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: token });
    if (otpErr) return NextResponse.json({ error: INVALID }, { status: 400 });

    const { error: updErr } = await supabase.auth.updateUser({ password: String(password) });
    if (updErr) {
      if (/same|different/i.test(updErr.message)) {
        return NextResponse.json({ error: "Please choose a password different from your old one." }, { status: 400 });
      }
      throw updErr;
    }
    await supabase.auth.signOut({ scope: "others" }).catch(() => {});
    const user = await getSessionUser();
    return NextResponse.json({ ok: true, ...summarizeAccess(user) });
  } catch (err) {
    console.error("reset-password failed:", err);
    Sentry.captureException(err, { tags: { area: "reset-password" } });
    return NextResponse.json({ error: "Couldn't reset your password right now. Please try again." }, { status: 500 });
  }
}
