import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/gkb/lib/db";

// Removes accounts that never paid. Client's rule (Oct 2026): an account
// that has not subscribed within 24 hours of signing up is deleted, so the
// only people in the database are paying readers (plus the grace window).
//
// Who gets deleted: subscriptionExpires IS NULL (never had a subscription —
// a lapsed subscriber keeps their account and can renew) AND createdAt is
// older than GRACE_HOURS AND the email isn't in PROTECTED.
//
// Vercel Cron hits this daily (vercel.json) with
// "Authorization: Bearer <CRON_SECRET>". Hobby crons run once a day, so an
// account is removed between 24 and 48 hours after signup. ?dry=1 lists
// what would go without deleting; ?limit=N caps a run (default 500).
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GRACE_HOURS = 24;
const PROTECTED = new Set(
  (process.env.CLEANUP_PROTECTED_EMAILS || "dev.sitelytc@gmail.com,demo@ginnikibaatein.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") || "") === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 500, 2000);
  const cutoff = new Date(Date.now() - GRACE_HOURS * 60 * 60 * 1000);

  try {
    if (!dbConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    const { data: candidates, error } = await db()
      .from("profiles")
      .select("id, email, created_at")
      .is("subscription_expires", null)
      .lt("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;

    // Never touch protected addresses or admins.
    const doomed = [];
    for (const u of candidates || []) {
      if (PROTECTED.has(String(u.email).toLowerCase())) continue;
      const { data: au } = await db().auth.admin.getUserById(u.id);
      if (au?.user?.app_metadata?.role === "admin") continue;
      doomed.push(u);
    }

    if (dry || doomed.length === 0) {
      return NextResponse.json({ ok: true, dry, cutoff, wouldDelete: doomed.length, emails: doomed.map((u) => u.email) });
    }

    // Deleting the auth user cascades to profiles, chat_messages and
    // reading_orders; referrals pointing at it are set to null.
    let deleted = 0;
    const failed = [];
    for (const u of doomed) {
      const { error: delErr } = await db().auth.admin.deleteUser(u.id);
      if (delErr) failed.push(u.email);
      else deleted++;
    }
    return NextResponse.json({ ok: true, cutoff, deleted, failed, emails: doomed.map((u) => u.email) });
  } catch (err) {
    console.error("Account cleanup failed:", err);
    Sentry.captureException(err, { tags: { area: "cron-cleanup-accounts" } });
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
