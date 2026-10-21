import { PASS_PRICE_INR, PASS_DAYS, FREE_READING_LIMIT } from '@/gkb/lib/pricing';
import { OFFER, REGULAR_PRICE, URGENT_PRICE, offerActive, inr } from '@/lib/booking/offer';
import { COURSES } from '@/lib/courses/data';
import { KUNDLI_PRICE_INR } from '@/lib/pricing/kundli';

/**
 * /llms.txt — a plain-language summary of the business for AI tools
 * (https://llmstxt.org). Built from the same price constants the site
 * charges, so it can't drift from the pages. Re-generated hourly, so the
 * festival offer drops out on its own.
 */
export const revalidate = 3600;

const SITE = 'https://thedivinetarotonline.com';

export function GET() {
  const offer = offerActive();
  const callPrice = offer
    ? `${inr(OFFER.price)} (${OFFER.name}, valid till ${OFFER.untilText}; regular price ${inr(REGULAR_PRICE)})`
    : inr(REGULAR_PRICE);
  const courses = COURSES.map((c) => `- [${c.title}](${SITE}/courses/${c.slug}): ${c.price} — ${c.summary}`).join('\n');

  const body = `# The Divine Tarot

> The Divine Tarot is tarot reader Bharti Singh's online tarot service for people in India and worldwide: AI-assisted tarot reading chat (Ginni Ki Baatein) in Hinglish, Hindi or English, personal voice-call readings with Bharti Singh, recorded divination courses, and a Kundli Milan (Vedic marriage matching) calculator.

Everything is online. Prices are in Indian rupees (INR) and paid through Razorpay.

## Services and prices

### Ginni Ki Baatein — tarot reading chat
- ${PASS_DAYS}-day pass: ₹${PASS_PRICE_INR}, one-time payment, no auto-renewal. Unlimited readings for ${PASS_DAYS} days.
- ${FREE_READING_LIMIT === 0 ? 'There are no free readings; every reading needs an active pass.' : `${FREE_READING_LIMIT} free readings before the pass is needed.`}
- 16 question topics (love, marriage, career, timing and more), answered in Hinglish, Hindi or English. Chat history is saved to the account.
- Start: ${SITE}/reading · Pass details: ${SITE}/premium

### Personal reading with Bharti Singh
- 40-minute voice call on Google Meet: tarot, astrology, numerology, Kundli analysis and psychic guidance, for up to 3 people.
- Price: ${callPrice}. Appointment within 7–10 days of payment, slots 12 PM–9 PM IST.
- Urgent reading within 48 hours: ${inr(URGENT_PRICE)}.
- Book: ${SITE}/personal-reading

### Courses (recorded, self-paced, 1 year of access, certificate on completion)
${courses}
- All courses: ${SITE}/courses

### Kundli Milan
- Ashtakoota Guna Milan from both people's birth details: score out of 36, all 8 kootas, Nadi and Bhakoot dosha analysis.
- Full result and a detailed report by email: ₹${KUNDLI_PRICE_INR}.
- ${SITE}/kundli-milan

## Languages
English, Hindi and Hinglish.

## Contact
- Email: thedivinetarot111@gmail.com
- Support tickets (payments, login, bookings, courses): ${SITE}/support
- Contact form: ${SITE}/contact
- YouTube: https://youtube.com/@TheDivineTarot
- Instagram: https://instagram.com/thedivineetarot
- Facebook: https://facebook.com/profile.php?id=61578567343068

## Policies
- Terms: ${SITE}/terms
- Refund and cancellation: ${SITE}/refund-policy
- Privacy: ${SITE}/privacy
- Delete an account: ${SITE}/delete-account

## About the readings
Tarot here is offered as guidance for reflection — insight and perspective, not fixed predictions — and Kundli Milan is a guide, not a substitute for a professional jyotishi.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' } });
}
