import { NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { clientIp, hitLimit } from '@/lib/rateLimitDb';
import { isMailConfigured, sendMail } from '@/lib/mail';
import { unsubscribeParts } from '@/lib/newsletter/unsubscribe';
import { addToNewsletterList } from '@/lib/newsletter/resendList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://thedivinetarotonline.com';

// Footer "Get Daily Divine Insights" signups. The list that gets mailed is the
// Resend "Newsletter" segment (Monday / Wednesday / Friday broadcasts + the
// new-video email), so every signup is added there; newsletter_subscribers
// (email) + whatsapp_subscribers (optional number) keep the site's own copy.
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Subscriptions are not set up yet. Please try again soon.' }, { status: 503 });
  }
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email || '').toLowerCase().trim().slice(0, 200);
  const rawPhone = String(body.whatsapp || body.phone || '').replace(/\D/g, '');
  const source = String(body.source || 'footer').slice(0, 40);
  const locale = ['en', 'hi', 'hinglish'].includes(String(body.locale)) ? String(body.locale) : null;
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Sahi email daalo' }, { status: 400 });
  if (await hitLimit(`subscribe:${clientIp(req)}`, 10, 60 * 60)) {
    return NextResponse.json({ error: 'Thodi der baad try karo' }, { status: 429 });
  }
  const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone.length >= 11 && rawPhone.length <= 15 ? rawPhone : '';

  const db = createAdminClient();
  const { data: existing } = await db.from('newsletter_subscribers').select('status').eq('email', email).maybeSingle();
  const now = new Date().toISOString();
  const { error } = await db.from('newsletter_subscribers').upsert(
    { email, status: 'subscribed', source, locale, phone: phone || null, unsubscribed_at: null, updated_at: now },
    { onConflict: 'email' }
  );
  if (error) {
    console.error('[subscribe] insert failed', error);
    return NextResponse.json({ error: 'Kuch gadbad hui, dobara try karo' }, { status: 500 });
  }
  if (phone) {
    await db.from('whatsapp_subscribers')
      .upsert({ phone, status: 'subscribed', source, locale, updated_at: now }, { onConflict: 'phone' })
      .then(({ error: e }) => e && console.error('[subscribe] whatsapp upsert failed', e));
  }

  // Join the Resend list that actually gets the newsletter. A Resend hiccup
  // doesn't fail the signup (the row above is kept); it is logged instead.
  const listed = await addToNewsletterList(email);
  if (!listed) console.error('[subscribe] could not add to the Resend Newsletter list:', email.replace(/^(.).*@/, '$1***@'));

  // Welcome mail only for brand-new (or returning) subscribers.
  if (existing?.status !== 'subscribed' && isMailConfigured()) {
    const unsub = unsubscribeParts(email).html;
    await sendMail({
      to: email,
      subject: 'Welcome to The Divine Tarot ✨',
      html: `<p>Namaste 🙏</p><p>Ab har Monday, Wednesday aur Friday aapko Divine Insight milega — cards ka message, courses aur special offers.</p>
             <p><a href="${SITE()}/reading">Ginni se apna sawaal poocho →</a></p>
             <p style="font-size:12px;color:#888">${unsub}</p>`,
    }).catch((e) => console.error('[subscribe] welcome mail failed', e));
  }
  return NextResponse.json({ ok: true });
}
