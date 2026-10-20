import nodemailer from 'nodemailer';

/**
 * One transactional mail helper for the whole site.
 * Uses Resend when RESEND_API_KEY is set (EMAIL_FROM must be on a verified
 * domain), otherwise the SMTP account the booking emails use (SMTP_*).
 */
export const isMailConfigured = () =>
  !!process.env.RESEND_API_KEY || !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const toText = (h: string) =>
  h.replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();

export async function sendMail(m: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  const to = Array.isArray(m.to) ? m.to : [m.to];
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'The Divine Tarot <onboarding@resend.dev>',
        to, subject: m.subject, html: m.html, text: toText(m.html),
        ...(m.replyTo ? { reply_to: m.replyTo } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
    return;
  }
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error('No mail provider configured (RESEND_API_KEY or SMTP_*)');
  await nodemailer
    .createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 465), secure: SMTP_SECURE !== 'false', auth: { user: SMTP_USER, pass: SMTP_PASS } })
    .sendMail({
      from: process.env.SMTP_FROM || `"The Divine Tarot" <${SMTP_USER}>`,
      to, subject: m.subject, html: m.html, text: toText(m.html), ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    });
}

export const escapeHtml = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
