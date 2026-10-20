import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { db } from "@/gkb/lib/db";
import { getSessionUser } from "@/gkb/lib/auth";

export const dynamic = "force-dynamic";

// Self-service account deletion for a signed-in reader (DPDP right to erasure).
// Removes: the login, profile, chat history and reading orders (cascade from
// auth.users), newsletter signup, support tickets and their screenshots.
// Personal-reading booking records are not tied to the login and are kept
// for the booked reading and accounting, as the page explains.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const { confirmEmail } = await req.json().catch(() => ({}));
  if (String(confirmEmail || "").trim().toLowerCase() !== String(user.email).toLowerCase()) {
    return NextResponse.json({ error: "Type your account email exactly to confirm." }, { status: 400 });
  }
  const email = String(user.email).toLowerCase();
  try {
    const sb = db();
    const cols = "id, payment_screenshot_path, error_screenshot_path";
    const [byUser, byEmail] = await Promise.all([
      sb.from("support_tickets").select(cols).eq("user_id", user.id),
      sb.from("support_tickets").select(cols).eq("email", email),
    ]);
    const seen = new Set();
    const tickets = [...(byUser.data || []), ...(byEmail.data || [])].filter((t) => !seen.has(t.id) && seen.add(t.id));
    const files = (tickets || []).flatMap((t) => [t.payment_screenshot_path, t.error_screenshot_path]).filter(Boolean);
    if (files.length) await sb.storage.from("support-uploads").remove(files);
    if (tickets?.length) await sb.from("support_tickets").delete().in("id", tickets.map((t) => t.id));
    await sb.from("newsletter_subscribers").delete().eq("email", email);
    const { error } = await sb.auth.admin.deleteUser(user.id);
    if (error) throw error;
    try {
      const supabase = await createAuthClient();
      await supabase.auth.signOut();
    } catch {
      // session already gone with the user
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("delete-account failed", err);
    Sentry.captureException(err, { tags: { area: "delete-account" } });
    return NextResponse.json({ error: "Couldn't delete your account right now. Please use the request form below." }, { status: 500 });
  }
}
