import ReadingApp from '@/gkb/ReadingApp';
import { hasSessionCookie } from '@/lib/supabase/sessionHint';

// Shown only to a visitor who has a session cookie, for the moment it takes to
// confirm it — the same card as the login screen, so nothing jumps around.
function ReadingLoading() {
  return (
    <div id="onboard">
      <div className="onboard-card" aria-busy="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="The Divine Tarot" className="onboard-glyph" />
        <h1>Ginni Ki Baatein</h1>
        <p className="onboard-sub reading-loading" role="status">Aapki readings khul rahi hain…</p>
      </div>
    </div>
  );
}

export default async function ReadingPage() {
  // No session cookie = certainly logged out: render the login screen on the
  // server, so a new visitor sees it immediately (no intro or questions first).
  const maybeLoggedIn = await hasSessionCookie();
  return (
    <div className="gkb">
      <div className="stars" />
      <div className="aurora" />
      <ReadingApp
        initialMe={maybeLoggedIn ? null : { loggedIn: false }}
        fallback={<div className="site-page"><ReadingLoading /></div>}
      />
    </div>
  );
}
