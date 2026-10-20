'use client';

import { useState } from 'react';

const inputCls =
  'w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all';

/** Sends an account-deletion request to the support desk (same Tickets sheet and email flow as the support form). */
export default function DeleteAccountForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter your name and the email address of your account.');
      return;
    }
    setError('');
    setState('sending');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          issue: 'other',
          description:
            `ACCOUNT DELETION REQUEST — please delete The Divine Tarot / Ginni Ki Baatein account for ${email.trim()}.` +
            (reason.trim() ? `\n\nReason: ${reason.trim()}` : ''),
          paymentScreenshot: null,
          errorScreenshot: null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.status !== 'success') throw new Error('failed');
      setState('sent');
    } catch {
      setState('error');
      setError('Could not send. Please try again, or email thedivinetarot111@gmail.com.');
    }
  };

  if (state === 'sent') {
    return (
      <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-slate-200">
        Request received. We’ll delete the account for <strong>{email.trim()}</strong> within 7 days and confirm by email.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      <input className={inputCls} type="email" placeholder="Email address of your account" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <textarea className={`${inputCls} min-h-[96px]`} placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full rounded-xl bg-gradient-to-r from-gold to-coral px-6 py-3.5 font-semibold text-black disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Request account deletion'}
      </button>
    </form>
  );
}
