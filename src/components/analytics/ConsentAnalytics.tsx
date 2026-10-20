'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Analytics load ONLY after the visitor accepts (DPDP / GDPR consent).
 * No inline scripts: everything is injected from this bundle, so the CSP
 * nonce policy is unaffected. Renders nothing when no analytics ID is set.
 */
type Props = { gaId?: string; gtmId?: string; clarityId?: string };
const KEY = 'tdt-consent';
type Choice = 'granted' | 'denied' | null;

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function addScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function load({ gaId, gtmId, clarityId }: Props) {
  const w = window as unknown as Record<string, any>;
  if (gtmId) {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
  } else if (gaId) {
    w.dataLayer = w.dataLayer || [];
    // gtag needs the real Arguments object, not an array
    // eslint-disable-next-line prefer-rest-params
    w.gtag = function gtag() { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', gaId, { anonymize_ip: true });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
  }
  if (clarityId && !w.clarity) {
    // eslint-disable-next-line prefer-rest-params
    w.clarity = function clarity() { (w.clarity.q = w.clarity.q || []).push(arguments); };
    addScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`);
  }
}

export default function ConsentAnalytics(props: Props) {
  const enabled = !!(props.gaId || props.gtmId || props.clarityId);
  const [choice, setChoice] = useState<Choice | 'unknown'>('unknown');

  useEffect(() => {
    if (!enabled) return;
    const c = read();
    setChoice(c);
    if (c === 'granted') load(props);
    const reopen = () => setChoice(null);
    window.addEventListener('tdt:cookie-settings', reopen);
    return () => window.removeEventListener('tdt:cookie-settings', reopen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled || choice !== null) return null;

  const decide = (c: 'granted' | 'denied') => {
    try { localStorage.setItem(KEY, c); } catch {}
    setChoice(c);
    if (c === 'granted') load(props);
  };

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-white/15 bg-[#0d0b16]/95 p-4 text-sm text-white/85 shadow-2xl backdrop-blur md:inset-x-auto md:right-4">
      <p>
        We use optional analytics cookies to understand how the site is used. Essential cookies (login, payments,
        booking) always stay on. <Link href="/privacy#cookies" className="underline text-[#FFD700]">Privacy &amp; cookies</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => decide('denied')}
          className="flex-1 rounded-full border border-white/30 px-4 py-2 font-medium hover:bg-white/10">Reject</button>
        <button type="button" onClick={() => decide('granted')}
          className="flex-1 rounded-full border border-white/30 px-4 py-2 font-medium hover:bg-white/10">Accept</button>
      </div>
    </div>
  );
}
