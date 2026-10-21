/**
 * The newsletter list lives in Resend: the "Newsletter" segment (217+ people
 * on 21 Oct 2026). Resend's automatic Monday / Wednesday / Friday broadcasts go
 * to that segment, and Resend handles their unsubscribe links.
 *
 * The site keeps its own copy in `newsletter_subscribers`, but this segment is
 * the list that actually gets mailed, so every signup is added here, every
 * unsubscribe from a site link is applied here, and the "new YouTube video"
 * email is sent to it as a broadcast.
 *
 * Segment: RESEND_NEWSLETTER_SEGMENT_ID, or else the segment named "Newsletter".
 * Every function is best-effort and never throws.
 */

const API = 'https://api.resend.com';
const SEGMENT_NAME = 'Newsletter';

let cachedSegment: string | null = null;

function key(): string | null {
  return process.env.RESEND_API_KEY || null;
}

async function api(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; json: any }> {
  const k = key();
  if (!k) return { ok: false, status: 0, json: { message: 'RESEND_API_KEY not set' } };
  try {
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    return { ok: false, status: 0, json: { message: String(err) } };
  }
}

/** The Resend segment that gets the newsletter, or null if it can't be found. */
export async function newsletterSegmentId(): Promise<string | null> {
  if (process.env.RESEND_NEWSLETTER_SEGMENT_ID) return process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  if (cachedSegment) return cachedSegment;
  const r = await api('GET', '/segments?limit=100');
  const found = (r.json?.data || []).find(
    (s: { id: string; name: string }) => s.name?.trim().toLowerCase() === SEGMENT_NAME.toLowerCase()
  );
  if (!found) {
    console.error('[newsletter] Resend segment "Newsletter" not found', r.status, r.json?.message);
    return null;
  }
  cachedSegment = found.id;
  return cachedSegment;
}

const enc = encodeURIComponent;

/**
 * Adds the email to the Newsletter segment and marks it subscribed (an explicit
 * signup on the site re-subscribes someone who unsubscribed earlier).
 */
export async function addToNewsletterList(email: string): Promise<boolean> {
  const seg = await newsletterSegmentId();
  if (!seg) return false;
  const add = await api('POST', `/audiences/${seg}/contacts`, { email, unsubscribed: false });
  if (!add.ok) {
    console.error('[newsletter] add contact failed', add.status, add.json?.message);
    return false;
  }
  // An existing contact keeps its old "unsubscribed" flag on create; clear it.
  const upd = await api('PATCH', `/audiences/${seg}/contacts/${enc(email)}`, { unsubscribed: false });
  if (!upd.ok) console.error('[newsletter] resubscribe failed', upd.status, upd.json?.message);
  return true;
}

/** Unsubscribes the email in Resend (it stops getting the broadcasts). */
export async function removeFromNewsletterList(email: string): Promise<boolean> {
  if (!key()) return true; // Resend not configured (local dev): nothing to unsubscribe from
  const seg = await newsletterSegmentId();
  if (!seg) return false;
  const r = await api('PATCH', `/audiences/${seg}/contacts/${enc(email)}`, { unsubscribed: true });
  if (!r.ok && r.status !== 404) {
    console.error('[newsletter] unsubscribe in Resend failed', r.status, r.json?.message);
    return false;
  }
  return true;
}

/**
 * Sends one email to everyone subscribed in the Newsletter segment, as a
 * Resend broadcast. Put {{{RESEND_UNSUBSCRIBE_URL}}} in the HTML for the
 * unsubscribe link — Resend fills it in per person and applies it.
 */
export async function broadcastToNewsletterList(opts: {
  name: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const seg = await newsletterSegmentId();
  if (!seg) return { ok: false, error: 'Newsletter segment not found' };
  const created = await api('POST', '/broadcasts', {
    segment_id: seg,
    name: opts.name,
    from: opts.from,
    subject: opts.subject,
    html: opts.html,
    reply_to: opts.replyTo,
  });
  if (!created.ok || !created.json?.id) {
    return { ok: false, error: `create failed (${created.status}): ${created.json?.message || ''}` };
  }
  const sent = await api('POST', `/broadcasts/${created.json.id}/send`, {});
  if (!sent.ok) return { ok: false, id: created.json.id, error: `send failed (${sent.status}): ${sent.json?.message || ''}` };
  return { ok: true, id: created.json.id };
}
