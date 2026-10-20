import type { Metadata } from 'next';
import DeleteAccountForm from '@/components/support/DeleteAccountForm';
import DeleteNowPanel from '@/components/support/DeleteNowPanel';

export const metadata: Metadata = {
  title: 'Delete your account',
  description: 'How to delete your The Divine Tarot / Ginni Ki Baatein account and data.',
  alternates: { canonical: '/delete-account' },
};

// Public page required by Google Play ("account deletion URL") for The Divine Tarot app.
export default function DeleteAccountPage() {
  return (
    <div className="relative">
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:py-16">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">Delete your account</h1>
          <p className="text-slate-400 leading-relaxed">
            This applies to your account in <strong className="text-slate-200">The Divine Tarot</strong> app
            (Android / iPhone) and on <strong className="text-slate-200">Ginni Ki Baatein</strong>
            {' '}(thedivinetarotonline.com/reading) — it is one account.
          </p>
        </div>

        <DeleteNowPanel />

        <section className="rounded-2xl border border-white/10 bg-[#121212]/70 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">Option 1 — in the app (instant)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Open The Divine Tarot app and log in.</li>
            <li>Go to <strong>Profile</strong> and tap <strong>Delete account</strong>.</li>
            <li>Confirm. Your account is deleted immediately.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121212]/70 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Option 2 — ask us here</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Can’t open the app? Send this form from the email address of your account. We delete the account within
            7 days and confirm by email.
          </p>
          <DeleteAccountForm />
        </section>

        <section className="space-y-2 text-sm text-slate-400 leading-relaxed">
          <h2 className="text-base font-semibold text-white">What is deleted</h2>
          <p>Your login (email and password), profile details and photo, saved readings, chats with Ginni, any active pass or Premium, your newsletter signup and your support tickets (including screenshots).</p>
          <h2 className="text-base font-semibold text-white pt-2">What is kept</h2>
          <p>
            A record of each payment (order ID, amount, date) is kept without your account for as long as Indian tax and
            accounting law requires. Personal Reading booking records are kept as long as needed to hold and follow up
            the reading. Questions: <a className="text-gold underline" href="mailto:thedivinetarot111@gmail.com">thedivinetarot111@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
