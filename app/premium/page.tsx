import Link from 'next/link';
import { Check, Crown, Sparkles } from 'lucide-react';
import { PASS_PRICE_INR, PASS_DAYS, REFERRAL_BONUS_READINGS } from '@/gkb/lib/pricing';
import { TOPICS } from '@/gkb/lib/topics';

const FEATURES = [
  `Unlimited readings for ${PASS_DAYS} days`,
  `All ${TOPICS.length} questions — love, marriage, career, timing and more`,
  'Hinglish, Hindi or English — switch any time',
  'Your chat history saved on your account',
  'Free follow-up guidance on every card you draw',
];

const FAQ = [
  {
    q: 'Is this a subscription? Will I be charged again?',
    a: `No. It is a one-time payment of ₹${PASS_PRICE_INR} for ${PASS_DAYS} days of full access. Nothing renews automatically — when the ${PASS_DAYS} days end you can buy another pass if you want to.`,
  },
  {
    q: 'Are there any free readings?',
    a: `No. Every reading in Ginni Ki Baatein needs an active pass. If a friend joins with your invite link and buys a pass, you both get ${REFERRAL_BONUS_READINGS} bonus readings.`,
  },
  {
    q: 'When does access start?',
    a: 'The moment Razorpay confirms your payment. If you closed the window before it finished, access still unlocks automatically within a few minutes.',
  },
  {
    q: 'Can I share my account?',
    a: 'One account is for one person — your name is saved on the account and readings are personal to you.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Passes are non-refundable once readings are unlocked. If you were charged but could not get access, write to us from the Support page and we will fix it within 24 hours.',
  },
];

export default function PremiumPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-gradient-to-r px-4 py-2">
            <Crown className="h-4 w-4 text-[#FFD700]" aria-hidden />
            <span className="text-sm font-medium text-[#FFD700]">Ginni Ki Baatein — Full Access</span>
          </div>
          <h1 className="mb-4 font-heading text-3xl font-bold text-white">Unlock Your Complete Tarot Journey</h1>
          <p className="mx-auto max-w-2xl text-lg text-[#A1A1AA]">
            One pass, every question, as many readings as your heart needs for {PASS_DAYS} days.
          </p>
        </div>

        <div className="relative mx-auto max-w-xl rounded-2xl border border-[#FFD700]/30 bg-gradient-to-br p-6 shadow-2xl md:p-8">
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#FFD700] to-[#FF4D4D] px-4 text-xs font-bold uppercase tracking-wider text-black">
              <Sparkles className="h-3 w-3" aria-hidden />
              {PASS_DAYS}-day pass
            </div>
          </div>
          <div className="mb-6 flex gap-2">
            <span className="text-5xl font-bold text-[#EAEAF0]">₹{PASS_PRICE_INR}</span>
            <span className="text-[#A1A1AA]">one-time · {PASS_DAYS} days · no auto-renewal</span>
          </div>
          <ul className="mb-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-[#D4D4D8]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="h-3 w-3 text-[#FFD700]" aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/reading?upgrade=1"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#FF4D4D] to-[#FFD700] px-6 py-3.5 text-base font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95"
          >
            Unlock {PASS_DAYS} days — ₹{PASS_PRICE_INR}
          </Link>
          <p className="mt-3 text-center text-xs text-[#A1A1AA]">
            Secure payment via Razorpay. Log in or create your account first — it takes 30 seconds.
          </p>
        </div>

        <section className="mx-auto max-w-3xl" aria-labelledby="premium-faq">
          <h2 id="premium-faq" className="mb-6 text-center font-heading text-2xl font-bold text-white md:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-lg border border-white/10 bg-white/5">
                <summary className="cursor-pointer list-none p-4 font-medium text-white">{item.q}</summary>
                <p className="px-4 pb-4 text-[#A1A1AA]">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[#A1A1AA]">
            See our <Link href="/terms" className="text-[#FFD700] hover:underline">Terms</Link> and{' '}
            <Link href="/refund-policy" className="text-[#FFD700] hover:underline">Refund &amp; Cancellation Policy</Link>.
          </p>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
            }),
          }}
        />
      </div>
    </div>
  );
}
