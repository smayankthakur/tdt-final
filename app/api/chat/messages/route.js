import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/gkb/lib/db";
import { getSessionUser } from "@/gkb/lib/auth";

const HISTORY_LIMIT = 30;

// Saves one chat message for the logged-in user, then prunes anything
// beyond the most recent HISTORY_LIMIT for that user — so this table stays
// small by design instead of growing forever, per Mayank's call. Pick
// tokens are never stored here (they expire in 20 minutes); a "reveal"
// message's `text` already has the finished reading baked in by the time
// ChatPanel.jsx saves it, so replaying history later never needs a token.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { role, kind, text, card, aiMode } = await req.json().catch(() => ({}));
  const validRole = role === "user" || role === "ginni";
  const validKind = kind === "text" || kind === "reveal";
  if (!validRole || !validKind) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  try {
    // A reader can only ever store their own words; "ginni" rows are the
    // reading text the server already showed them, so the client may echo
    // it back for history. Length-capped either way.
    const { data: saved, error } = await db()
      .from("chat_messages")
      .insert({
        user_id: user.id,
        role,
        kind,
        text: text ? String(text).slice(0, 4000) : null,
        card: card ? String(card).slice(0, 100) : null,
        ai_mode: !!aiMode,
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: saved.id });
  } catch (err) {
    console.error("Chat message save failed:", err);
    Sentry.captureException(err, { tags: { area: "chat-messages" } });
    // Fail soft — this session's chat keeps working locally either way;
    // one message just doesn't make it into next time's history.
    return NextResponse.json({ id: null });
  }
}
