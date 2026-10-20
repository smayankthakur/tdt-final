"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguageStore } from "@/store/languageStore";
import AuthGate from "@/gkb/components/AuthGate";
import Onboarding from "@/gkb/components/Onboarding";
import Sidebar from "@/gkb/components/Sidebar";
import ChatPanel from "@/gkb/components/ChatPanel";
import { TOPICS } from "@/gkb/lib/topics";

const LANG_KEY = "ginni:lang";
function loadLang() {
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return v === "hinglish" || v === "english" || v === "hindi" ? v : null;
  } catch {
    return null;
  }
}
function saveLang(lang) {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // private mode etc. — language just falls back to the default next time
  }
}

// Site language (header EN / हिंदी / Hinglish switch) -> reading language.
const SITE_TO_READING = { en: "english", hi: "hindi", hinglish: "hinglish" };

/** @param {{ fallback?: import("react").ReactNode }} props */
export default function ReadingApp({ fallback = null }) {
  const siteLang = useLanguageStore((s) => s.language);
  // /reading?upgrade=1 (from /premium and other "unlock" links) opens checkout.
  const [wantsUpgrade] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("upgrade") === "1"
  );
  const [me, setMe] = useState(null); // null while loading; {loggedIn, ...access} once known
  const [session, setSession] = useState(null); // {name, lang} — onboarding personalization, separate from auth
  const [activeTopic, setActiveTopic] = useState(null); // highlight only — the chat below is the source of truth
  const [pendingAsk, setPendingAsk] = useState(null); // {text, nonce} — a sidebar click waiting to be sent
  // Reading language chosen from the site header's EN / हिंदी / Hinglish
  // toggle. Before a session it seeds onboarding; during one it switches the
  // live session's language (same as the sidebar / settings chips).
  const [uiLang, setUiLang] = useState("hinglish");
  const [chatKey, setChatKey] = useState(0); // bumped by "Start over" to remount the chat
  const currentLang = session?.lang || uiLang;
  function changeLang(next) {
    setUiLang(next);
    saveLang(next);
    setSession((prev) => (prev ? { ...prev, lang: next } : prev));
  }

  // One account = one person. The reading name is the name saved on the
  // account, so a reload (or a new device) goes straight back into the
  // chat instead of asking "Your name" again — and nobody can type a
  // friend's name to stretch one subscription across a whole group.
  // Onboarding only appears once, for an account that has no name yet.
  function applyMe(data) {
    setMe(data);
    if (data?.loggedIn && data.name) {
      const lang = loadLang() || uiLang;
      setUiLang(lang);
      setSession((prev) => prev || { name: data.name, lang });
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(applyMe)
      .catch(() => setMe({ loggedIn: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBegin(name, lang) {
    saveLang(lang);
    setUiLang(lang);
    let savedName = name;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.name) {
        savedName = data.name;
        setMe((prev) => ({ ...prev, name: data.name }));
      }
    } catch {
      // Saving the name is best-effort; the session still starts.
    }
    setSession({ name: savedName, lang });
  }

  // The site-wide language switch in the header drives the reading language,
  // exactly like the old reading-app header toggle did.
  // Only an actual change of the site switch counts — the store's initial
  // value must not override the reader's own saved choice (Hinglish default).
  const prevSiteLang = useRef(siteLang);
  useEffect(() => {
    if (prevSiteLang.current === siteLang) return;
    prevSiteLang.current = siteLang;
    const next = SITE_TO_READING[siteLang];
    if (next && next !== currentLang) changeLang(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteLang]);

  if (me === null) {
    // Server-rendered intro (h1, question list) stays visible while the
    // session check resolves — search engines and slow phones see real content.
    return fallback;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe({ loggedIn: false });
    setSession(null);
    setActiveTopic(null);
  }

  // Clicking a question in the sidebar fills the chat input with its exact
  // title and sends it — it goes through the same classifyQuestion() step
  // as anything typed (see ChatPanel.jsx), it never jumps straight to a
  // known topic id.
  function handleSelectTopic(topic) {
    setActiveTopic(topic);
    setPendingAsk({ text: topic.title, nonce: Date.now() });
  }

  return (
    <div className="site-page">

      {!me.loggedIn ? (
        <AuthGate onAuthed={applyMe} />
      ) : !session ? (
        <Onboarding defaultName={me.name} defaultLang={uiLang} onBegin={handleBegin} />
      ) : (
        <div id="app" className="active">
          <Sidebar
            name={session.name}
            lang={session.lang}
            activeTopicId={activeTopic?.id}
            onSelectTopic={handleSelectTopic}
            onChangeLang={(lang) => {
              saveLang(lang);
              setUiLang(lang);
              setSession((prev) => ({ ...prev, lang }));
            }}
            onRestart={() => {
              // Keeps the account's name — just a fresh look at the chat.
              setActiveTopic(null);
              setPendingAsk(null);
              setChatKey((k) => k + 1);
            }}
            onLogout={handleLogout}
            referralCode={me.referralCode}
          />
          <main className="main chat-mode">
            <div className="main-inner chat-main-inner">
              <ChatPanel
                key={`${session.name}:${chatKey}`}
                name={session.name}
                lang={session.lang}
                access={me}
                onAccessChange={(newAccess) => setMe((prev) => ({ ...prev, ...newAccess }))}
                pendingAsk={pendingAsk}
                onConsumedAsk={() => setPendingAsk(null)}
                onTopicResolved={(topicId) => setActiveTopic(TOPICS.find((t) => t.id === topicId) || null)}
                onPickTopic={handleSelectTopic}
                autoOpenPaywall={wantsUpgrade}
              />
            </div>
          </main>
        </div>
      )}

    </div>
  );
}
