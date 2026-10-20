// The full course catalogue — one list for the whole site.
//  - "recorded": self-paced video courses (previously learn.thedivinetarotonline.com)
//  - "live":     dated live batches with a booking cutoff (previously the tdt-course repo)
// Prices are display strings exactly as the client gave them; payLink is the Razorpay link for each.

export type CourseKind = 'recorded' | 'live';

export type Course = {
  slug: string;
  kind: CourseKind;
  image: string;
  tag: string;
  price: string;
  title: string;
  summary: string;
  formatNote: string;
  schedule: string[];
  learn: string[];
  need: string[];
  payLink: string;
  /** Live batches only: ISO date (YYYY-MM-DD, India time) the batch begins. */
  startDate?: string;
  /** Manual override — shows "Booking Closed!" regardless of date. */
  bookingClosed?: boolean;
};

export const RECORDED_COURSES: Course[] = [
  {
    "slug": "tarot-for-beginners",
    "kind": "recorded",
    "tag": "Beginner",
    "price": "₹15,000",
    "title": "Tarot Reading Course For Beginners",
    "summary": "Your foundation in tarot. Learn all 78 cards of the Major and Minor Arcana, essential spreads, and the intuitive basics you need to give your very first accurate, confident readings.",
    "learn": [
      "The history of Tarot cards",
      "The meanings of all the Tarot cards",
      "How to read Tarot cards",
      "Basic Tarot spreads used in daily readings"
    ],
    "need": [
      "Rider Waite Tarot Deck (available on Amazon)",
      "Notebook & pen for your notes"
    ],
    "payLink": "https://rzp.io/rzp/g9nbAXD8",
    "image": "/courses/tarot-for-beginners.webp",
    "formatNote": "Recorded video course — study at your own pace, with 1 year of access and a certificate on completion.",
    "schedule": [
      "Self-paced videos",
      "1-year access",
      "Certificate on completion"
    ]
  },
  {
    "slug": "tarot-advanced",
    "kind": "recorded",
    "tag": "Advanced",
    "price": "₹25,000",
    "title": "Tarot Reading Advanced Course",
    "summary": "Deepen your mastery. Explore complex spreads, reversals, timing and predictive techniques, and learn to weave the cards together into rich, professional-level readings for real clients.",
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
    ],
    "payLink": "https://rzp.io/rzp/8Rq6jrV",
    "image": "/courses/tarot-advanced.webp",
    "formatNote": "Recorded video course — study at your own pace, with 1 year of access and a certificate on completion.",
    "schedule": [
      "Self-paced videos",
      "1-year access",
      "Certificate on completion"
    ]
  },
  {
    "slug": "candle-wax-reading",
    "kind": "recorded",
    "tag": "Divination",
    "price": "₹10,000",
    "title": "Candle Wax Reading Course",
    "summary": "The art of ceromancy. Learn to read the shapes, drips, smoke and flame of melting candle wax to uncover hidden messages, energies and spiritual guidance.",
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
    ],
    "payLink": "https://rzp.io/rzp/hfgJEgu",
    "image": "/courses/candle-wax-reading.webp",
    "formatNote": "Recorded video course — study at your own pace, with 1 year of access and a certificate on completion.",
    "schedule": [
      "Self-paced videos",
      "1-year access",
      "Certificate on completion"
    ]
  },
  {
    "slug": "runes-reading",
    "kind": "recorded",
    "tag": "Ancient Craft",
    "price": "₹10,000",
    "title": "Runes Reading Course",
    "summary": "Unlock the wisdom of the ancient Norse Elder Futhark. Master the meaning of every rune, casting methods and powerful spreads for guidance, clarity and divination.",
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
    ],
    "payLink": "https://rzp.io/rzp/mwcZzgiI",
    "image": "/courses/runes-reading.webp",
    "formatNote": "Recorded video course — study at your own pace, with 1 year of access and a certificate on completion.",
    "schedule": [
      "Self-paced videos",
      "1-year access",
      "Certificate on completion"
    ]
  },
  {
    "slug": "dice-reading",
    "kind": "recorded",
    "tag": "Quick Answers",
    "price": "₹10,000",
    "title": "Dice Reading Course",
    "summary": "The powerful practice of astragalomancy. Learn to read dice for fast, precise answers — number meanings, combinations and spreads that deliver guidance in moments.",
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
    ],
    "payLink": "https://rzp.io/rzp/pqA8ayy",
    "image": "/courses/dice-reading.webp",
    "formatNote": "Recorded video course — study at your own pace, with 1 year of access and a certificate on completion.",
    "schedule": [
      "Self-paced videos",
      "1-year access",
      "Certificate on completion"
    ]
  }
];

export const LIVE_COURSES: Course[] = [
  {
    "slug": "heal-within",
    "image": "/courses/heal-within.webp",
    "tag": "Offline · Membership",
    "price": "₹15,000",
    "title": "Heal WITHIN",
    "summary": "A year-long, in-person healing circle — energy work, meditation and inner-child practice, held weekly so old patterns can loosen and you can meet yourself again.",
    "formatNote": "In-person, once a week, for a full year. Venue confirmed closer to the start date.",
    "schedule": [
      "Begins 15 Nov",
      "Sundays, 4:00–7:00 PM",
      "1-year membership",
      "Venue: to be confirmed"
    ],
    "startDate": "2026-11-15",
    "bookingClosed": true,
    "learn": [
      "Energy healing & chakra balancing",
      "Meditation and breathwork for everyday grounding",
      "Inner-child and shadow-work practice",
      "Self-healing rituals you can keep using",
      "Building a sustainable healing routine within a group"
    ],
    "need": [
      "An open mind and willingness to reflect",
      "A journal for weekly notes",
      "Comfortable clothing for floor / seated work",
      "Steady weekly attendance"
    ],
    "payLink": "https://rzp.io/rzp/JdMP80qp",
    "kind": "live"
  },
  {
    "slug": "tarot-workshop",
    "image": "/courses/tarot-workshop.webp",
    "tag": "Workshop",
    "price": "₹5,000",
    "title": "Tarot Workshop",
    "summary": "A single afternoon to meet the deck properly — how the cards are structured, how to shuffle with intention, and how to pull your first honest reading.",
    "formatNote": "A one-time, single-day session — no recordings, no ongoing access.",
    "schedule": [
      "11 Oct (Sun)",
      "12:30–2:30 PM",
      "1 day · 2 hours"
    ],
    "startDate": "2026-10-11",
    "learn": [
      "Deck structure: Major & Minor Arcana",
      "Shuffling, cutting and drawing with intention",
      "Reading your first 3-card spread",
      "Common beginner mistakes to avoid",
      "Where to go next in your practice"
    ],
    "need": [
      "No prior experience needed",
      "A tarot deck (guidance shared beforehand)",
      "Notebook & pen"
    ],
    "payLink": "https://rzp.io/rzp/UsKBd1F",
    "kind": "live"
  },
  {
    "slug": "tarot-beginning-to-advance",
    "image": "/courses/tarot-beginning-to-advance.webp",
    "tag": "Live Batch",
    "price": "₹1,00,000",
    "title": "Tarot: Beginner's to Advance",
    "summary": "A four-month live journey from your first card pull to reading confidently for other people — full arcana, live practice, exams and a year of recordings to fall back on.",
    "formatNote": "Live batch, 4 months. Includes exams, practice sessions, live Q&A and 1-year video access.",
    "schedule": [
      "23 Oct – 7 Feb",
      "Fri & Sat 8–10 PM, Sun 12–2 PM",
      "4 months",
      "Exams, practice, Q&A, 1-year video access"
    ],
    "startDate": "2026-10-23",
    "learn": [
      "Full Major & Minor Arcana meanings",
      "Card combinations, spreads and layouts",
      "Reading reversed cards",
      "Reading for yourself vs. reading for others — ethics",
      "Practice sessions, mock readings & live Q&A",
      "Exam-based assessment"
    ],
    "need": [
      "A tarot deck",
      "Notebook",
      "Reliable internet on Fri/Sat/Sun",
      "Willingness to practice between classes"
    ],
    "payLink": "https://rzp.io/rzp/fWD6L2a",
    "kind": "live"
  },
  {
    "slug": "tarot-pro",
    "image": "/courses/tarot-pro.webp",
    "tag": "Live Batch",
    "price": "₹2,00,000",
    "title": "Tarot Pro",
    "summary": "The advanced continuation for graduates of Beginner's to Advance — sharpening intuition, refining complex spreads and building the confidence to read professionally.",
    "formatNote": "Live batch, 2 months (6 months total when paired with the Beginner's batch).",
    "schedule": [
      "12 Feb – 11 Apr",
      "Fri & Sat 8–10 PM, Sun 12–2 PM",
      "2 months (6 months total with Beginner's batch)",
      "Exams, practice, Q&A, 1-year video access"
    ],
    "startDate": "2027-02-12",
    "learn": [
      "Advanced spreads for career, relationships and life-path",
      "Blending tarot with deeper intuitive technique",
      "Client-consultation skills",
      "Holding sensitive questions with care",
      "Confidence to read for others professionally"
    ],
    "need": [
      "Completion of Beginner's to Advance (or equivalent)",
      "A deck you're comfortable with",
      "Consistent attendance"
    ],
    "payLink": "https://rzp.io/rzp/uNgw2T4",
    "kind": "live"
  },
  {
    "slug": "runes-beginning-to-advance",
    "image": "/courses/runes-beginning-to-advance.webp",
    "tag": "Live Batch",
    "price": "₹1,00,000",
    "title": "Runes: Beginner's to Advance",
    "summary": "The old Nordic practice of rune-casting, taught from your first single-stone draw through to layered, advanced spreads, across a three-month live batch.",
    "formatNote": "Live batch, 3 months. Includes exams, practice sessions, live Q&A and 1-year video access.",
    "schedule": [
      "24 Apr – 11 Jul",
      "Sat 8–10 PM, Sun 12–2 PM",
      "3 months",
      "Exams, practice, Q&A, 1-year video access"
    ],
    "startDate": "2027-04-24",
    "learn": [
      "Elder Futhark rune meanings & history",
      "Casting and interpreting single-rune draws",
      "Multi-rune spreads for love, career and life",
      "Reversed / merkstave interpretation",
      "Practice sessions & live Q&A"
    ],
    "need": [
      "A rune set (guidance shared beforehand)",
      "Notebook",
      "Reliable internet on Sat/Sun"
    ],
    "payLink": "https://rzp.io/rzp/wfh8B9vv",
    "kind": "live"
  },
  {
    "slug": "dice-beginning-to-advance",
    "image": "/courses/dice-beginning-to-advance.webp",
    "tag": "Live Batch",
    "price": "₹1,00,000",
    "title": "Dice: Beginner's to Advance",
    "summary": "A hands-on three-month batch in dice divination — starting with basic throws and number symbolism, building up to advanced, layered interpretation.",
    "formatNote": "Live batch, 3 months. Includes exams, practice sessions, live Q&A and 1-year video access.",
    "schedule": [
      "24 Jul – 10 Oct",
      "Sat 8–10 PM, Sun 12–2 PM",
      "3 months",
      "Exams, practice, Q&A, 1-year video access"
    ],
    "startDate": "2027-07-24",
    "learn": [
      "Dice divination fundamentals & number symbolism",
      "Single, double and triple throw setups",
      "Blending dice with intuitive guidance",
      "Practical, real-life reading exercises",
      "Exams & live practice"
    ],
    "need": [
      "A dice set (details shared beforehand)",
      "Notebook",
      "Reliable internet on Sat/Sun"
    ],
    "payLink": "https://rzp.io/rzp/s7XosLAt",
    "kind": "live"
  },
  {
    "slug": "candle-wax-full-course",
    "image": "/courses/candle-wax-full-course.webp",
    "tag": "Live Batch",
    "price": "₹1,00,000",
    "title": "Candle Wax Reading Course",
    "summary": "Roughly two months live, learning ceromancy — the art of reading the shapes candle wax leaves behind in water, for intuitive, symbolic guidance.",
    "formatNote": "Live batch, ~2 months. Includes exams, practice sessions, live Q&A and 1-year video access.",
    "schedule": [
      "6 Nov – 26 Dec",
      "Sat 8–10 PM, Sun 12–2 PM",
      "~2 months",
      "Exams, practice, Q&A, 1-year video access"
    ],
    "startDate": "2027-11-06",
    "learn": [
      "Ceromancy fundamentals",
      "Reading shapes, patterns & symbols in wax",
      "Setting up a safe wax-reading session",
      "Interpreting readings for different kinds of questions",
      "Practice, exams & live Q&A"
    ],
    "need": [
      "Candles, a heatproof bowl of water, a safe workspace (full list shared beforehand)",
      "Notebook",
      "Reliable internet on Sat/Sun"
    ],
    "payLink": "https://rzp.io/rzp/nmDQu8QA",
    "kind": "live"
  }
];

// Client's call (Oct 2026): the site sells the 5 recorded courses only.
// LIVE_COURSES (cohort batches) are kept here, unpublished, so they can be
// switched back on by adding them to this list.
export const COURSES: Course[] = [...RECORDED_COURSES];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

/** Bookings close this many days before a live batch starts. */
export const BOOKING_CUTOFF_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight at the start of `startDate`, India time (UTC+05:30), whatever the server's timezone. */
export function getStartInstant(course: Course): Date | null {
  if (!course.startDate) return null;
  return new Date(`${course.startDate}T00:00:00+05:30`);
}

/**
 * Last moment a booking is accepted: 11:59:59.999 PM IST on the day that is
 * BOOKING_CUTOFF_DAYS before the start date (e.g. start 23 Oct → closes 21 Oct, 11:59 PM IST).
 */
export function getBookingEnd(course: Course): Date | null {
  const start = getStartInstant(course);
  if (!start) return null;
  return new Date(start.getTime() - (BOOKING_CUTOFF_DAYS - 1) * DAY_MS - 1);
}

export function isBookingClosed(course: Course, now: Date = new Date()): boolean {
  if (course.bookingClosed) return true;
  const end = getBookingEnd(course);
  return !!end && now.getTime() > end.getTime();
}

/** "21 Oct 2026, 11:59 PM IST" */
export function formatBookingEnd(course: Course): string | null {
  const end = getBookingEnd(course);
  if (!end) return null;
  const date = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  return `${date}, 11:59 PM IST`;
}

/** Price string "₹1,00,000" → 100000 (for structured data). */
export function priceNumber(course: Course): number {
  return Number(course.price.replace(/[^0-9]/g, '')) || 0;
}
