import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSessionUser } from '@/gkb/lib/auth';
import { clientIp, hitLimit } from '@/lib/rateLimitDb';
import { escapeHtml, isMailConfigured, sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ISSUES: Record<string, string> = {
  login_after_sub: 'Cannot access premium after subscribing',
  billing: 'Billing / double charge',
  booking: 'Personal reading booking',
  course: 'Course access',
  technical: 'Technical error / bug',
  other: 'Other inquiry',
};
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const BUCKET = 'support-uploads';
const OWNER = () => process.env.SUPPORT_EMAIL || process.env.OWNER_EMAIL || 'dev.thedivinetarot111@gmail.com';

function decodeImage(dataUrl: unknown): { bytes: Buffer; mime: string; ext: string } | null | 'bad' {
  if (!dataUrl) return null;
  if (typeof dataUrl !== 'string') return 'bad';
  const m = dataUrl.match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return 'bad';
  const bytes = Buffer.from(m[3], 'base64');
  if (bytes.length > MAX_IMAGE_BYTES) return 'bad';
  return { bytes, mime: m[1], ext: m[2] === 'jpeg' ? 'jpg' : m[2] };
}

// Support tickets are stored in Supabase (support_tickets) with screenshots in
// the PRIVATE "support-uploads" bucket. The owner gets an email with
// 7-day signed links; the customer gets a short receipt.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ status: 'error', message: 'Invalid request' }, { status: 400 });

  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const issue = String(body.issue || '');
  const description = String(body.description || '').trim().slice(0, 5000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !description || !ISSUES[issue]) {
    return NextResponse.json({ status: 'error', message: 'Please check the form fields' }, { status: 400 });
  }
  const pay = decodeImage(body.paymentScreenshot);
  const err = decodeImage(body.errorScreenshot);
  if (pay === 'bad' || err === 'bad') {
    return NextResponse.json({ status: 'error', message: 'Screenshots must be PNG, JPG or WebP under 2.5 MB' }, { status: 413 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ status: 'error', message: 'Support desk is not configured' }, { status: 503 });
  }
  if ((await hitLimit(`support:ip:${clientIp(req)}`, 5, 60 * 60)) || (await hitLimit(`support:email:${email}`, 5, 24 * 60 * 60))) {
    return NextResponse.json({ status: 'error', message: 'Too many tickets — we already have yours and will reply soon.' }, { status: 429 });
  }

  const supabase = createAdminClient();
  const ticketNo = `TDT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
  try {
    const upload = async (img: { bytes: Buffer; mime: string; ext: string } | null, label: string) => {
      if (!img) return null;
      const path = `${ticketNo}/${label}.${img.ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, img.bytes, { contentType: img.mime, upsert: false });
      if (error) throw error;
      return path;
    };
    const paymentPath = await upload(pay, 'payment');
    const errorPath = await upload(err, 'error');
    const user = await getSessionUser();

    const { error: insErr } = await supabase.from('support_tickets').insert({
      ticket_no: ticketNo, user_id: user?.id || null, name, email, issue, description,
      payment_screenshot_path: paymentPath, error_screenshot_path: errorPath,
    });
    if (insErr) throw insErr;

    if (isMailConfigured()) {
      const link = async (p: string | null) => {
        if (!p) return '';
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p, 7 * 24 * 3600);
        return data?.signedUrl || '';
      };
      const [payUrl, errUrl] = await Promise.all([link(paymentPath), link(errorPath)]);
      const ownerHtml =
        `<h2>New support ticket ${ticketNo}</h2>` +
        `<p><b>Issue:</b> ${escapeHtml(ISSUES[issue])}<br><b>Name:</b> ${escapeHtml(name)}<br><b>Email:</b> ${escapeHtml(email)}` +
        `${user ? `<br><b>Signed-in account:</b> ${escapeHtml(user.email)} (pass ${user.subscriptionExpires ? 'until ' + new Date(user.subscriptionExpires).toDateString() : 'never bought'})` : ''}</p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(description)}</p>` +
        `${payUrl ? `<p><a href="${payUrl}">Payment screenshot</a> (link valid 7 days)</p>` : ''}` +
        `${errUrl ? `<p><a href="${errUrl}">Error screenshot</a> (link valid 7 days)</p>` : ''}`;
      const customerHtml =
        `<p>Namaste ${escapeHtml(name)},</p><p>Thank you for contacting The Divine Tarot. Your ticket <b>${ticketNo}</b> ` +
        `(${escapeHtml(ISSUES[issue])}) has been logged. We usually reply within <b>24 hours</b>.</p>` +
        `<p>If you need to add anything, just reply to this email.</p>`;
      const results = await Promise.allSettled([
        sendMail({ to: OWNER().split(',').map((s) => s.trim()), subject: `[Support] ${ticketNo} — ${ISSUES[issue]}`, html: ownerHtml, replyTo: email }),
        sendMail({ to: email, subject: `Your support ticket ${ticketNo} — The Divine Tarot`, html: customerHtml, replyTo: OWNER().split(',')[0] }),
      ]);
      results.forEach((r) => r.status === 'rejected' && console.error('[support] mail failed', r.reason));
    }
    return NextResponse.json({ status: 'success', ticket: ticketNo });
  } catch (e) {
    console.error('[support] failed', e);
    Sentry.captureException(e, { tags: { area: 'support' } });
    return NextResponse.json({ status: 'error', message: 'Could not save your ticket. Please email thedivinetarot111@gmail.com.' }, { status: 500 });
  }
}
