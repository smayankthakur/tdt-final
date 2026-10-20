import ReadingApp from '@/gkb/ReadingApp';
import { TOPICS } from '@/gkb/lib/topics';
import { PASS_PRICE_INR, PASS_DAYS } from '@/gkb/lib/pricing';

// Server-rendered intro shown until the session check finishes. It is real
// content (heading, what you can ask, the price) so the page is indexable and
// never a blank screen on a slow connection.
function ReadingIntro() {
  return (
    <div id="onboard">
      <div className="onboard-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="The Divine Tarot" className="onboard-glyph" width={64} height={64} />
        <h1>Ginni Ki Baatein</h1>
        <p className="onboard-sub">
          Apna sawaal poocho, ek card draw karo aur turant reading paao — Hinglish, Hindi ya English mein.
        </p>
        <p className="onboard-sub">
          Full access: ₹{PASS_PRICE_INR} for {PASS_DAYS} days, all {TOPICS.length} questions, unlimited readings.
        </p>
        <ul className="reading-intro-topics" aria-label="Questions you can ask">
          {TOPICS.map((t) => (
            <li key={t.id}>{t.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ReadingPage() {
  return (
    <div className="gkb">
      <div className="stars" />
      <div className="aurora" />
      <ReadingApp fallback={<div className="site-page"><ReadingIntro /></div>} />
    </div>
  );
}
