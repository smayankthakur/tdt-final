import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/newsletter/unsubscribe";

// GET  ?email=&token=  -> the link in the email footer; redirects to the confirmation page.
// POST ?email=&token=  -> Gmail/Apple one-click unsubscribe (List-Unsubscribe-Post); plain 200.
async function unsubscribe(req) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = url.searchParams.get("token") || "";
  if (!verifyUnsubscribeToken(email, token)) return { ok: false, status: 400 };
  if (!isSupabaseConfigured()) return { ok: false, status: 500 };
  const { error } = await createAdminClient()
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("email", email);
  if (error) {
    console.error("unsubscribe failed:", error);
    return { ok: false, status: 500 };
  }
  return { ok: true, status: 200 };
}

export async function GET(req) {
  const r = await unsubscribe(req);
  const dest = new URL("/newsletter/unsubscribed", req.url);
  if (!r.ok) dest.searchParams.set("error", r.status === 400 ? "invalid" : "failed");
  return NextResponse.redirect(dest, 303);
}

export async function POST(req) {
  const r = await unsubscribe(req);
  return NextResponse.json({ ok: r.ok }, { status: r.status });
}
