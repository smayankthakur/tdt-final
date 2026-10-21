/* eslint-disable */
// The course page exactly as it was on learn.thedivinetarotonline.com (a
// static page): its markup, with links pointed at this site and images
// served from /public/courses. Styles: learn.css (scoped to .learn-site).
// Behaviour (menu, stars, reveal, course modal, newsletter): LearnScripts.

export type LearnCourse = { slug: string; accent: string; badge: string; price: string; title: string; img: string; pay: string; learn: string[]; need: string[] };

export const LEARN_COURSES: Record<string, LearnCourse> = {
  "beginner": {
    "slug": "tarot-for-beginners",
    "accent": "#8b5cf6",
    "badge": "Beginner",
    "price": "₹15,000",
    "title": "Tarot Reading Course For Beginners",
    "img": "/courses/tarot-for-beginners.webp",
    "pay": "https://rzp.io/rzp/g9nbAXD8",
    "learn": [
      "The history of Tarot cards",
      "The meanings of all the Tarot cards",
      "How to read Tarot cards",
      "Basic Tarot spreads used in daily readings"
    ],
    "need": [
      "Rider Waite Tarot Deck (available on Amazon)",
      "Notebook & pen for your notes"
    ]
  },
  "advance": {
    "slug": "tarot-advanced",
    "accent": "#e6c063",
    "badge": "Advanced",
    "price": "₹25,000",
    "title": "Tarot Reading Advanced Course",
    "img": "/courses/tarot-advanced.webp",
    "pay": "https://rzp.io/rzp/8Rq6jrV",
    "learn": [
      "Key words of the Tarot cards",
      "Deep meanings of cards across every situation",
      "Reading Tarot for yourself and for others",
      "Important spreads for deep reading — including the Celtic Cross method",
      "How to create quotations and give clients accurate readings"
    ],
    "need": [
      "Rider Waite Tarot Deck (available on Amazon)",
      "Notebook & pen for your notes"
    ]
  },
  "candle": {
    "slug": "candle-wax-reading",
    "accent": "#ff9d4d",
    "badge": "Divination",
    "price": "₹10,000",
    "title": "Candle Wax Reading Course",
    "img": "/courses/candle-wax-reading.webp",
    "pay": "https://rzp.io/rzp/hfgJEgu",
    "learn": [
      "How to energise your own energy",
      "How to choose a candle before reading",
      "Cleansing before a reading",
      "What you need to prepare for a reading",
      "How to read wax drops, signs and patterns",
      "How to perform spreads",
      "How to read for yourself and others"
    ],
    "need": [
      "One candle",
      "One bowl of water",
      "Notebook & pen for your notes"
    ]
  },
  "runes": {
    "slug": "runes-reading",
    "accent": "#ff5a3c",
    "badge": "Ancient Craft",
    "price": "₹10,000",
    "title": "Runes Reading Course",
    "img": "/courses/runes-reading.webp",
    "pay": "https://rzp.io/rzp/mwcZzgiI",
    "learn": [
      "How to energise your own energy",
      "How to buy your runes",
      "Cleansing before a reading",
      "Basic keywords & meaning of each rune",
      "How to read a rune",
      "How to perform basic spreads",
      "How to give a reading"
    ],
    "need": [
      "Runes set (available on Amazon)",
      "Notebook & pen for your notes"
    ]
  },
  "dice": {
    "slug": "dice-reading",
    "accent": "#e24b6a",
    "badge": "Quick Answers",
    "price": "₹10,000",
    "title": "Dice Reading Course",
    "img": "/courses/dice-reading.webp",
    "pay": "https://rzp.io/rzp/pqA8ayy",
    "learn": [
      "How to energise your own energy",
      "How to buy your dice",
      "Cleansing before a reading",
      "Basic keywords & meaning of the dice",
      "How to read the dice",
      "How to perform basic spreads",
      "How to give a reading"
    ],
    "need": [
      "Dice set (available on Amazon)",
      "Notebook & pen for your notes"
    ]
  }
};

export const LEARN_PAGE_HTML = "<header class=\"site\">\n    <div class=\"wrap nav\">\n      <a class=\"brand\" href=\"/\">\n        <img src=\"/logo.png\" alt=\"The Divine Tarot Logo\" />\n        <span class=\"brand-txt\">\n          <span class=\"brand-name\">The Divine Tarot</span>\n          <span class=\"brand-sub\">Premium Tarot Guidance</span>\n        </span>\n      </a>\n      <nav class=\"links\">\n        <a href=\"/\">Home</a>\n        <a href=\"/about\">About</a>\n        <a href=\"/reading\">Reading</a>\n        <a href=\"/courses\">Course</a>\n        <a href=\"/kundli-milan\">Kundli Milan</a>\n        <a href=\"/personal-reading\">Personal Reading</a>\n      </nav>\n      <div class=\"nav-actions\">\n        <a class=\"header-cta\" href=\"/reading\">Ask your question here</a>\n      </div>\n      <button class=\"menu-btn\" id=\"menuBtn\" aria-label=\"Open menu\">&#9776;</button>\n    </div>\n    <div class=\"mobile-nav\" id=\"mobileNav\">\n      <a href=\"/\">Home</a>\n      <a href=\"/about\">About</a>\n      <a href=\"/reading\">Reading</a>\n      <a href=\"/courses\">Course</a>\n      <a href=\"/kundli-milan\">Kundli Milan</a>\n      <a href=\"/personal-reading\">Personal Reading</a>\n      <a href=\"/reading\">Ask your question here</a>\n    </div>\n  </header>\n  <section class=\"hero\">\n    <div class=\"hero-bg\" aria-hidden=\"true\"></div>\n    <div class=\"stars\" id=\"stars\" aria-hidden=\"true\"></div>\n    <span class=\"float-glyph\" style=\"top:18%;left:8%\" aria-hidden=\"true\">✨</span>\n    <span class=\"float-glyph\" style=\"top:26%;right:10%;animation-delay:1.5s\" aria-hidden=\"true\">🌙</span>\n    <span class=\"float-glyph\" style=\"bottom:16%;left:14%;animation-delay:2.4s\" aria-hidden=\"true\">🔮</span>\n    <span class=\"float-glyph\" style=\"bottom:22%;right:12%;animation-delay:.8s\" aria-hidden=\"true\">✦</span>\n    <div class=\"hero-inner\">\n      <span class=\"eyebrow reveal\">Learn The Sacred Arts</span>\n      <h1 class=\"reveal\" style=\"animation-delay:.1s\">Our <em>Courses</em></h1>\n      <p class=\"reveal\" style=\"animation-delay:.2s\">Step into the world of divination. From your very first tarot spread\n        to advanced intuitive mastery — learn to read the cards, runes, wax and dice, and give guidance that truly\n        resonates.</p>\n      <div class=\"note reveal\" style=\"animation-delay:.3s\">✦ Click any course to begin your journey ✦</div>\n    </div>\n  </section>\n  <section class=\"courses\">\n    <div class=\"wrap\">\n      <div class=\"section-head reveal\">\n        <h2>Choose Your <span>Path</span></h2>\n        <p>Five carefully crafted courses to awaken your intuition and skill.</p>\n      </div>\n      <div class=\"reveal\" style=\"animation-delay:.2s\">\n        <h2>How to Enroll</h2>\n        <ul>\n          <li>To purchase your preferred course, simply click the \"CLICK TO PAY\" button and pay the course fee.</li>\n          <li>You will immediately receive the payment receipt and invoice via email.</li>\n          <li>Within two days, you will receive another email containing the course link, your login ID, and your\n            password.</li>\n          <li>Once you log in, you will see the videos; you can open them and begin your studies.</li>\n          <li>Please note that access to the videos will be removed after one year. Therefore, keep a notebook and pen\n            handy while watching the videos and take notes for future reference.</li>\n          <li>Upon completion of the course, you will receive your certificate via email.</li>\n        </ul>\n      </div>\n      <div class=\"grid\">\n        <article class=\"card reveal\" data-key=\"beginner\">\n          <div class=\"thumb\">\n            <span class=\"badge\">Beginner</span>\n            <img src=\"/courses/tarot-for-beginners.webp\"\n              alt=\"Hands holding a tarot deck — Tarot Reading Course for Beginners\" loading=\"lazy\" />\n            <span class=\"price-tag\">₹15,000</span>\n          </div>\n          <div class=\"body\">\n            <h3>Tarot Reading Course For Beginners</h3>\n            <p>Your foundation in tarot. Learn all 78 cards of the Major and Minor Arcana, essential spreads, and the\n              intuitive basics you need to give your very first accurate, confident readings.</p>\n            <div class=\"cta-row\">\n              <a class=\"btn btn-primary btn-enrol\" href=\"https://rzp.io/rzp/g9nbAXD8\" target=\"_blank\"\n                rel=\"noopener\">Enrol Now</a>\n              <button type=\"button\" class=\"btn btn-ghost btn-details\">Course Details</button>\n            </div>\n          </div>\n        </article>\n        <article class=\"card reveal\" data-key=\"advance\">\n          <div class=\"thumb\">\n            <span class=\"badge adv\">Advanced</span>\n            <img src=\"/courses/tarot-advanced.webp\"\n              alt=\"Three mystical tarot cards — Tarot Reading Advanced Course\" loading=\"lazy\" />\n            <span class=\"price-tag\">₹25,000</span>\n          </div>\n          <div class=\"body\">\n            <h3>Tarot Reading Advanced Course</h3>\n            <p>Deepen your mastery. Explore complex spreads, reversals, timing and predictive techniques, and learn to\n              weave the cards together into rich, professional-level readings for real clients.</p>\n            <div class=\"cta-row\">\n              <a class=\"btn btn-primary btn-enrol\" href=\"https://rzp.io/rzp/8Rq6jrV\" target=\"_blank\"\n                rel=\"noopener\">Enrol Now</a>\n              <button type=\"button\" class=\"btn btn-ghost btn-details\">Course Details</button>\n            </div>\n          </div>\n        </article>\n        <article class=\"card reveal\" data-key=\"candle\">\n          <div class=\"thumb\">\n            <span class=\"badge\">Divination</span>\n            <img src=\"/courses/candle-wax-reading.webp\" alt=\"Glowing candles — Candle Wax Reading Course\"\n              loading=\"lazy\" />\n            <span class=\"price-tag\">₹10,000</span>\n          </div>\n          <div class=\"body\">\n            <h3>Candle Wax Reading Course</h3>\n            <p>The art of ceromancy. Learn to read the shapes, drips, smoke and flame of melting candle wax to uncover\n              hidden messages, energies and spiritual guidance.</p>\n            <div class=\"cta-row\">\n              <a class=\"btn btn-primary btn-enrol\" href=\"https://rzp.io/rzp/hfgJEgu\" target=\"_blank\"\n                rel=\"noopener\">Enrol Now</a>\n              <button type=\"button\" class=\"btn btn-ghost btn-details\">Course Details</button>\n            </div>\n          </div>\n        </article>\n        <article class=\"card reveal\" data-key=\"runes\">\n          <div class=\"thumb\">\n            <span class=\"badge\">Ancient Craft</span>\n            <img src=\"/courses/runes-reading.webp\" alt=\"Glowing rune stone — Runes Reading Course\"\n              loading=\"lazy\" />\n            <span class=\"price-tag\">₹10,000</span>\n          </div>\n          <div class=\"body\">\n            <h3>Runes Reading Course</h3>\n            <p>Unlock the wisdom of the ancient Norse Elder Futhark. Master the meaning of every rune, casting methods\n              and powerful spreads for guidance, clarity and divination.</p>\n            <div class=\"cta-row\">\n              <a class=\"btn btn-primary btn-enrol\" href=\"https://rzp.io/rzp/mwcZzgiI\" target=\"_blank\"\n                rel=\"noopener\">Enrol Now</a>\n              <button type=\"button\" class=\"btn btn-ghost btn-details\">Course Details</button>\n            </div>\n          </div>\n        </article>\n        <article class=\"card reveal\" data-key=\"dice\">\n          <div class=\"thumb\">\n            <span class=\"badge\">Quick Answers</span>\n            <img src=\"/courses/dice-reading.webp\"\n              alt=\"Red dice in mystical smoke — Dice Reading Course\" loading=\"lazy\" />\n            <span class=\"price-tag\">₹10,000</span>\n          </div>\n          <div class=\"body\">\n            <h3>Dice Reading Course</h3>\n            <p>The powerful practice of astragalomancy. Learn to read dice for fast, precise answers — number meanings,\n              combinations and spreads that deliver guidance in moments.</p>\n            <div class=\"cta-row\">\n              <a class=\"btn btn-primary btn-enrol\" href=\"https://rzp.io/rzp/pqA8ayy\" target=\"_blank\"\n                rel=\"noopener\">Enrol Now</a>\n              <button type=\"button\" class=\"btn btn-ghost btn-details\">Course Details</button>\n            </div>\n          </div>\n        </article>\n      </div>\n    </div>\n  </section>\n  <section class=\"courses\" style=\"padding-top:0\">\n    <div class=\"wrap\">\n      <div class=\"strip reveal\">\n        <h2>Ready to Begin Your Spiritual Journey?</h2>\n        <p>Whether you're picking up your first deck or refining a gift you already have, there's a course here for you.\n          Reserve your seat and start learning today.</p>\n        <a class=\"btn btn-primary\" href=\"/courses\"\n          style=\"font-size:.95rem;padding:14px 30px\">Book Your Course ✨</a>\n      </div>\n    </div>\n  </section>\n  <footer class=\"site\">\n    <div class=\"wrap\">\n      <div class=\"foot-grid\">\n        <div class=\"foot foot-brand\">\n          <div class=\"fb-top\">\n            <img src=\"/logo.png\" alt=\"The Divine Tarot Logo\" />\n            <div>\n              <h4>The Divine Tarot</h4>\n              <div class=\"tag\">Premium Tarot Guidance</div>\n            </div>\n          </div>\n          <p class=\"desc\">Clarity for your path. Guidance for your soul.</p>\n        </div>\n        <div class=\"foot\">\n          <h5>Quick Links</h5>\n          <ul>\n            <li><a href=\"/about\">About</a></li>\n          </ul>\n        </div>\n        <div class=\"foot\">\n          <h5>Connect With Us</h5>\n          <div class=\"socials\">\n            <a href=\"https://instagram.com/thedivineetarot\" aria-label=\"Instagram\" target=\"_blank\" rel=\"noopener\">\n              <svg viewBox=\"0 0 24 24\">\n                <path\n                  d=\"M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.1 0-3.5 0-4.7.1-.9 0-1.4.2-1.7.3-.4.2-.7.4-1 .7-.3.3-.5.6-.7 1-.1.3-.3.8-.3 1.7-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 .9.2 1.4.3 1.7.2.4.4.7.7 1 .3.3.6.5 1 .7.3.1.8.3 1.7.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c.9 0 1.4-.2 1.7-.3.4-.2.7-.4 1-.7.3-.3.5-.6.7-1 .1-.3.3-.8.3-1.7.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-.9-.2-1.4-.3-1.7-.2-.4-.4-.7-.7-1-.3-.3-.6-.5-1-.7-.3-.1-.8-.3-1.7-.3-1.2-.1-1.6-.1-4.7-.1m0 3.1a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8m0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4m6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0\" />\n              </svg>\n            </a>\n            <a href=\"https://facebook.com/profile.php?id=61578567343068\" aria-label=\"Facebook\" target=\"_blank\"\n              rel=\"noopener\">\n              <svg viewBox=\"0 0 24 24\">\n                <path\n                  d=\"M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12\" />\n              </svg>\n            </a>\n            <a href=\"https://youtube.com/@TheDivineTarot\" aria-label=\"YouTube\" target=\"_blank\" rel=\"noopener\">\n              <svg viewBox=\"0 0 24 24\">\n                <path\n                  d=\"M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12 31 31 0 0 0 23 7.5M9.8 15.3V8.7l5.7 3.3-5.7 3.3\" />\n              </svg>\n            </a>\n            <a href=\"https://youtube.com/@thedivineetarot\" aria-label=\"YouTube second channel\" target=\"_blank\"\n              rel=\"noopener\">\n              <svg viewBox=\"0 0 24 24\">\n                <path\n                  d=\"M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12 31 31 0 0 0 23 7.5M9.8 15.3V8.7l5.7 3.3-5.7 3.3\" />\n              </svg>\n            </a>\n          </div>\n          <a class=\"foot-privacy\" href=\"/privacy\">Privacy Policy</a>\n        </div>\n        <div class=\"foot\">\n          <h5>Get Daily Divine Insights</h5>\n          <form class=\"news\">\n            <input type=\"email\" placeholder=\"Your email\" aria-label=\"Email for daily insights\" required />\n            <button type=\"submit\">Subscribe</button>\n          </form>\n        </div>\n      </div>\n      <div class=\"trust\">\n        <span><svg viewBox=\"0 0 24 24\">\n            <rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\" />\n            <path d=\"M8 11V7a4 4 0 0 1 8 0v4\" />\n          </svg>Secure &amp; Private Readings</span>\n        <span><svg viewBox=\"0 0 24 24\">\n            <path d=\"M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z\" />\n          </svg>Trusted by 7L+ Seekers</span>\n        <span><svg viewBox=\"0 0 24 24\">\n            <path d=\"M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9z\" />\n          </svg>Authentic Spiritual Guidance</span>\n      </div>\n      <div class=\"copy\">\n        <span>Designed by <a href=\"https://sitelytc.com\" target=\"_blank\" rel=\"noopener\">Sitelytc</a></span>\n        <a href=\"/privacy\">Privacy</a>\n        <span id=\"yr\">2026</span>\n      </div>\n    </div>\n  </footer>";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const DEFAULT_INFO =
  '<b>Online course</b> — video recordings you can watch anywhere, anytime, with <b>1 year of access</b>. A <b>certificate</b> is issued on completion.';

/** The course-details modal; open and filled in when `key` is given (the /courses/[slug] pages). */
export function learnModalHtml(key?: string): string {
  const c = key ? LEARN_COURSES[key] : undefined;
  const li = (a: string[]) => a.map((x) => '<li>' + esc(x) + '</li>').join('');
  return `<div class="modal-overlay${c ? ' open' : ''}" id="courseModal" aria-hidden="${c ? 'false' : 'true'}">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cmTitle" id="cmDialog"${c ? ` style="--accent:${c.accent}"` : ''}>
      <button class="modal-close" id="modalClose" aria-label="Close course details">&times;</button>
      <div class="modal-media">
        <span class="modal-eyebrow" id="cmBadge">${c ? esc(c.badge) : ''}</span>
        <img id="cmImg" alt="${c ? esc(c.title) : ''}"${c ? ` src="${c.img}"` : ''} />
      </div>
      <div class="modal-body">
        <div class="modal-head">
          <h3 id="cmTitle">${c ? esc(c.title) : ''}</h3>
          <span class="modal-price" id="cmPrice">${c ? esc(c.price) : ''}</span>
        </div>
        <h4>What you'll learn</h4>
        <ul class="modal-list" id="cmLearn">${c ? li(c.learn) : ''}</ul>
        <h4>What you'll need</h4>
        <ul class="modal-list need" id="cmNeed">${c ? li(c.need) : ''}</ul>
        <div class="modal-info">
          ${DEFAULT_INFO}
        </div>
        <div class="modal-cta">
          <a class="btn btn-primary" id="cmPay" href="${c ? c.pay : '#'}" target="_blank" rel="noopener">Enrol Now ✨</a>
          <button type="button" class="btn btn-ghost" id="cmCancel">Close</button>
        </div>
      </div>
    </div>
  </div>`;
}

export const LEARN_KEY_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(LEARN_COURSES).map(([k, c]) => [c.slug, k])
);
