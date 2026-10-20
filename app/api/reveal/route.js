import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { verifyPickToken } from "@/gkb/lib/auth";
import { TOPICS, UNAVAILABLE_MESSAGE } from "@/gkb/lib/topics";
import { READINGS } from "@/gkb/lib/readings";
import { getReadingFor } from "@/gkb/lib/parseReading";
import { composeAIReading } from "@/gkb/lib/ai";
import { composeLocalReading } from "@/gkb/lib/localFallback";
import { db } from "@/gkb/lib/db";
import crypto from "crypto";

// An AI reading is generated once per pick token and cached, so re-opening
// or replaying the same token (valid 20 minutes) never pays for another AI call.
async function cachedAIReading(token, payload) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  try {
    const { data: hit } = await db().from("ai_readings").select("text").eq("token_hash", tokenHash).maybeSingle();
    if (hit) return hit.text;
  } catch {
    // cache table unavailable — fall through to a live call
  }
  const text = await composeAIReading({ card: payload.card, question: payload.question });
  if (text) {
    await db()
      .from("ai_readings")
      .upsert({ token_hash: tokenHash, user_id: payload.userId || null, card: payload.card, text }, { onConflict: "token_hash", ignoreDuplicates: true })
      .then(() => {}, () => {});
  }
  return text;
}

// This is the only route that ever touches lib/readings.js — that file (and
// everything in /data) is never imported by client components anymore, so
// none of it ships in the JS bundle. A visitor who hasn't picked (and paid
// for, past the free limit) a specific card has no way to see its text.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const lang = searchParams.get("lang") || "hinglish";

  const payload = token && verifyPickToken(token);
  if (!payload) {
    return NextResponse.json({ error: "This reveal link is invalid or expired." }, { status: 401 });
  }

  try {
    // Fallback path: the client's free classifier (lib/classify.js)
    // couldn't map this question to any of the 15 topics. Real AI
    // (lib/ai.js) is tried first, but only if a provider key is actually
    // configured — by default, none is, and composeAIReading() returns
    // null immediately without making any call. Either way, this always
    // ends in a real reading via lib/localFallback.js: "system must
    // respond to every question" holds even on a $0 deployment with no AI
    // key at all. `lang` is only used by the local path (it picks the
    // seeker's session language) — an AI reading already matches whatever
    // language the question was asked in, so re-running it on every
    // sidebar language toggle would just spend another call for nothing.
    if (payload.topicId === "ai") {
      const aiText = await cachedAIReading(token, payload);
      if (aiText) {
        return NextResponse.json({ available: true, text: aiText, aiGenerated: true, singleLanguageSource: null, fallbackMessage: null });
      }

      const localText = composeLocalReading({ card: payload.card, question: payload.question, lang });
      if (localText) {
        return NextResponse.json({ available: true, text: localText, aiGenerated: false, localFallback: true, singleLanguageSource: null, fallbackMessage: null });
      }

      // Only reachable if even the Universe Message file were missing text
      // for this card — verified elsewhere that it never is, but this is
      // the honest last resort rather than a crash.
      return NextResponse.json({ available: false, text: null, fallbackMessage: UNAVAILABLE_MESSAGE[lang] || UNAVAILABLE_MESSAGE.hinglish });
    }

    const topic = TOPICS.find((t) => t.id === payload.topicId);
    if (!topic) {
      return NextResponse.json({ error: "Unknown question." }, { status: 400 });
    }

    const raw = READINGS[topic.dataKey]?.[payload.card];
    if (!raw) {
      return NextResponse.json({ available: false, text: null });
    }

    const { text, available, singleLanguageSource } = getReadingFor(raw, lang);
    return NextResponse.json({
      available,
      text: available ? text : null,
      singleLanguageSource,
      fallbackMessage: available ? null : UNAVAILABLE_MESSAGE[lang],
    });
  } catch (err) {
    console.error("Reveal failed:", err);
    Sentry.captureException(err, { tags: { area: "reveal" } });
    return NextResponse.json({ error: "Couldn't load this reading right now." }, { status: 500 });
  }
}
