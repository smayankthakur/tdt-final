import crypto from 'crypto';

// Stateless unsubscribe links: an HMAC of the email, so nothing is stored,
// nobody can forge a link for someone else's address, and links in old
// emails keep working.
const secret = () => process.env.NEWSLETTER_SECRET || process.env.CRON_SECRET || process.env.READING_TOKEN_SECRET || '';
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://thedivinetarotonline.com';

export function unsubscribeToken(email: string): string {
  if (!secret()) throw new Error('NEWSLETTER_SECRET is not set');
  return crypto.createHmac('sha256', secret()).update(String(email).trim().toLowerCase()).digest('hex').slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token || !secret()) return false;
  const a = Buffer.from(String(token)), b = Buffer.from(unsubscribeToken(email));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function unsubscribeUrl(email: string): string {
  const u = new URL('/api/newsletter/unsubscribe', SITE());
  u.searchParams.set('email', email);
  u.searchParams.set('token', unsubscribeToken(email));
  return u.toString();
}

/** Footer HTML + headers for one recipient (Gmail/Apple one-click unsubscribe). */
export function unsubscribeParts(email: string) {
  try {
    const url = unsubscribeUrl(email);
    return {
      html: `<a href="${url}" style="color:#9b8cff;">Unsubscribe</a>`,
      headers: { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    };
  } catch {
    return { html: '', headers: undefined };
  }
}
