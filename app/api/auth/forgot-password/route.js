import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/gkb/lib/db";
import { authConfigured } from "@/gkb/lib/auth";
import { isEmailConfigured, sendEmail, passwordResetEmail } from "@/gkb/lib/email";
import { hitLimit } from "@/lib/rateLimitDb";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_TTL_MINUTES = 60; // Supabase's default recovery-link lifetime
const MAX_PER_HOUR = 3;

// POST { email } -> always the same 200 whether or not the address has an
// account, so the form can't be used to discover registered emails.
// Supabase generates the one-time recovery token; we email our own branded
// link to /reset-password, which exchanges it for a session.
export async function POST(req) {
  if (!authConfigured() || !isEmailConfigured()) {
    return NextResponse.json(
      { error: "Password reset emails aren't set up on this site yet. Please contact support to reset your password." },
      { status: 503 }
    );
  }
  const { email } = await req.json().catch(() => ({}));
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const generic = {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).",
  };

  try {
    if (await hitLimit(`reset:${normalizedEmail}`, MAX_PER_HOUR, 60 * 60)) return NextResponse.json(generic);

    const { data, error } = await db().auth.admin.generateLink({ type: "recovery", email: normalizedEmail });
    if (error || !data?.properties?.hashed_token) return NextResponse.json(generic); // no such user, etc.

    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://thedivinetarotonline.com";
    const link = `${origin}/reset-password?token=${encodeURIComponent(data.properties.hashed_token)}`;
    const { data: profile } = await db().from("profiles").select("name").eq("id", data.user.id).maybeSingle();
    const mail = passwordResetEmail({ name: profile?.name, link, minutes: LINK_TTL_MINUTES });
    await sendEmail({ to: normalizedEmail, ...mail });
    return NextResponse.json(generic);
  } catch (err) {
    console.error("forgot-password failed:", err);
    Sentry.captureException(err, { tags: { area: "forgot-password" } });
    return NextResponse.json({ error: "Couldn't send the reset email right now. Please try again in a moment." }, { status: 500 });
  }
}
