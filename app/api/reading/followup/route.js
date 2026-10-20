import { NextResponse } from "next/server";
import { getSessionUser, summarizeAccess, verifyPickToken } from "@/gkb/lib/auth";
import { UNAVAILABLE_MESSAGE, DECK } from "@/gkb/lib/topics";
import { READINGS } from "@/gkb/lib/readings";
import { getReadingFor } from "@/gkb/lib/parseReading";

// Free, unlimited elaboration on a card the seeker has already revealed —
// no credit charged (access or the card's pick token required, see below). They already legitimately know
// this card (they drew it); this just surfaces more of Ginni's own
// existing content for it, not a new reading, so it doesn't need the same
// payment gate as /api/reading/pick. Login is still required only to keep
// the reading data itself server-side, matching every other route that
// touches lib/readings.js.
//
// "universe" (Universe Message) and "spiritual" (spiritual journey) are
// used for this specifically because they're this app's two most broadly
// -applicable topics — genuinely relevant follow-up context regardless of
// what the original reading was actually about, unlike, say, showing
// "baby timing" content as a follow-up to a "third party" reading.
const FOLLOWUP_DATAKEYS = {
  universe: "universeGuidance",
  spiritual: "spiritualJourney",
};

export async function GET(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const card = searchParams.get("card");
  const kind = searchParams.get("kind");
  const lang = searchParams.get("lang") || "hinglish";
  const dataKey = FOLLOWUP_DATAKEYS[kind];

  // Follow-ups are free on a card this reader actually drew: either they
  // currently have access (pass or bonus readings), or they present the pick
  // token issued for this exact card. Without this, any logged-in free
  // account could read these two paid topics for all 78 cards.
  const token = searchParams.get("token");
  const pick = token ? verifyPickToken(token) : null;
  const ownsThisCard = !!pick && pick.userId === user.id && pick.card === card;
  if (!summarizeAccess(user).hasAccess && !ownsThisCard) {
    return NextResponse.json({ error: "limit_reached", ...summarizeAccess(user) }, { status: 403 });
  }

  if (!card || !DECK.includes(card) || !dataKey) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = READINGS[dataKey]?.[card];
  if (!raw) {
    return NextResponse.json({ available: false, text: null });
  }

  const { text, available } = getReadingFor(raw, lang);
  return NextResponse.json({
    available,
    text: available ? text : null,
    fallbackMessage: available ? null : UNAVAILABLE_MESSAGE[lang] || UNAVAILABLE_MESSAGE.hinglish,
  });
}
