import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/gkb/lib/db";
import { getSessionUser } from "@/gkb/lib/auth";

export const dynamic = "force-dynamic";
const HISTORY_LIMIT = 30;

// The most recent HISTORY_LIMIT messages for the logged-in user, oldest first.
// Older rows are pruned by a trigger on chat_messages.
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  try {
    const { data, error } = await db()
      .from("chat_messages")
      .select("id, role, kind, text, card, ai_mode, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    if (error) throw error;
    const messages = (data || []).reverse().map((m) => ({
      id: m.id,
      role: m.role,
      kind: m.kind,
      text: m.text,
      card: m.card,
      aiMode: m.ai_mode,
      createdAt: m.created_at,
    }));
    return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Chat history load failed:", err);
    Sentry.captureException(err, { tags: { area: "chat-history" } });
    return NextResponse.json({ messages: [] });
  }
}
