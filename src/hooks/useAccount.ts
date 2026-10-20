'use client';

import { useEffect, useState } from 'react';

export interface Account {
  loggedIn: boolean;
  name?: string | null;
  subscribed?: boolean;
  subscriptionExpires?: string | null;
}

// One /api/auth/me request per page load, shared by every component that asks.
let pending: Promise<Account> | null = null;

function loadAccount(): Promise<Account> {
  if (!pending) {
    pending = fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { loggedIn: false }))
      .catch(() => ({ loggedIn: false }));
  }
  return pending;
}

/** The signed-in reader (same account as Ginni Ki Baatein), or null until known. */
export function useAccount(): Account | null {
  const [account, setAccount] = useState<Account | null>(null);
  useEffect(() => {
    let alive = true;
    loadAccount().then((a) => alive && setAccount(a));
    return () => {
      alive = false;
    };
  }, []);
  return account;
}
