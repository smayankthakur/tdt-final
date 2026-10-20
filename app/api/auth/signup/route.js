import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { db } from "@/gkb/lib/db";
import { authConfigured, getSessionUser, summarizeAccess } from "@/gkb/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOT_CONFIGURED = { error: "Server isn't configured yet. Contact the site owner." };

// Creates a Supabase Auth user (email already confirmed, so the reader can
// start straight away) and signs them in. The profiles row — name, referral
// code, who referred them — is created by the on_auth_user_created trigger
// from the metadata passed here (supabase/10_accounts_and_readings.sql).
export async function POST(req) {
  if (!authConfigured()) return NextResponse.json(NOT_CONFIGURED, { status: 500 });

  const { email, password, name, referralCode } = await req.json().catch(() => ({}));
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const cleanName = String(name || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!cleanName) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!password || String(password).length < 8 || String(password).length > 72) {
    return NextResponse.json({ error: "Password must be 8 to 72 characters." }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // An unknown or missing referral code is never an error — signup just
    // proceeds without crediting anyone.
    let referredBy = null;
    if (referralCode) {
      const { data } = await db()
        .from("profiles")
        .select("id")
        .eq("referral_code", String(referralCode).trim().toUpperCase())
        .maybeSingle();
      referredBy = data?.id || null;
    }

    const { error: createErr } = await db().auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: { name: cleanName, referred_by: referredBy },
    });
    if (createErr) {
      if (createErr.status === 422 || /already|exists|registered/i.test(createErr.message)) {
        return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
      }
      throw createErr;
    }

    const supabase = await createAuthClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: String(password) });
    if (signErr) throw signErr;

    const user = await getSessionUser();
    return NextResponse.json(summarizeAccess(user));
  } catch (err) {
    console.error("Signup failed:", err);
    Sentry.captureException(err, { tags: { area: "signup" } });
    return NextResponse.json(
      { error: "Couldn't create your account right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
