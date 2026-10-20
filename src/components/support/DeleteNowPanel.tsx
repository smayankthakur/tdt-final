'use client';

import { useEffect, useState } from 'react';

/** Shown only to a signed-in reader: deletes the account immediately. */
export default function DeleteNowPanel() {
  const [email, setEmail] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [state, setState] = useState<'idle' | 'deleting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => j?.loggedIn && setEmail(j.email))
      .catch(() => {});
  }, []);

  if (!email) return null;
  if (state === 'done') {
    return (
      <section className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-slate-200">
        Your account and its data have been deleted. Thank you for reading with us.
      </section>
    );
  }

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('deleting');
    setError('');
    const r = await fetch('/api/auth/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmEmail: typed }),
    }).catch(() => null);
    const j = await r?.json().catch(() => null);
    if (r?.ok && j?.deleted) setState('done');
    else {
      setState('error');
      setError(j?.error || 'Something went wrong. Please use the request form below.');
    }
  };

  return (
    <section className="rounded-2xl border border-red-400/30 bg-red-500/5 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white">You are signed in — delete now</h2>
      <p className="text-sm text-slate-300">
        This permanently deletes the account <strong>{email}</strong>: your login, name, chat history with Ginni, any
        active pass, newsletter signup and support tickets. It cannot be undone.
      </p>
      <form onSubmit={remove} className="space-y-3">
        <label htmlFor="confirmDelete" className="block text-sm text-slate-300">Type your email to confirm</label>
        <input id="confirmDelete" type="email" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
          className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-slate-200" />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={state === 'deleting' || typed.trim().toLowerCase() !== email.toLowerCase()}
          className="w-full rounded-xl border border-red-400/60 px-6 py-3 font-semibold text-red-200 disabled:opacity-50">
          {state === 'deleting' ? 'Deleting…' : 'Delete my account permanently'}
        </button>
      </form>
    </section>
  );
}
