/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';

const req = (url: string, host: string, method = 'GET') =>
  new NextRequest(url, { method, headers: { host } });

describe('legacy subdomains', () => {
  it('redirects old site roots to their new paths', async () => {
    const cases: Array<[string, string, string]> = [
      ['https://reading.thedivinetarotonline.com/?ref=AB12', 'reading.thedivinetarotonline.com', 'https://thedivinetarotonline.com/reading?ref=AB12'],
      ['https://learn.thedivinetarotonline.com/', 'learn.thedivinetarotonline.com', 'https://thedivinetarotonline.com/courses'],
      ['https://booking.thedivinetarotonline.com/', 'booking.thedivinetarotonline.com', 'https://thedivinetarotonline.com/personal-reading'],
      ['https://booking.thedivinetarotonline.com/form', 'booking.thedivinetarotonline.com', 'https://thedivinetarotonline.com/personal-reading/form'],
      ['https://support.thedivinetarotonline.com/', 'support.thedivinetarotonline.com', 'https://thedivinetarotonline.com/support'],
      ['https://support.thedivinetarotonline.com/delete-account', 'support.thedivinetarotonline.com', 'https://thedivinetarotonline.com/delete-account'],
      ['https://www.thedivinetarotonline.com/about', 'www.thedivinetarotonline.com', 'https://thedivinetarotonline.com/about'],
    ];
    for (const [url, host, to] of cases) {
      const res = await middleware(req(url, host));
      expect(res.status).toBe(308);
      expect(res.headers.get('location')).toBe(to);
    }
  });

  it('serves booking API callbacks on the old host without redirecting', async () => {
    const res = await middleware(req('https://booking.thedivinetarotonline.com/api/razorpay-webhook', 'booking.thedivinetarotonline.com', 'POST'));
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://booking.thedivinetarotonline.com/api/booking/razorpay-webhook');
  });

  it('sends old referral links to the reading page', async () => {
    const res = await middleware(req('https://thedivinetarotonline.com/?ref=XY', 'thedivinetarotonline.com'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://thedivinetarotonline.com/reading?ref=XY');
  });
});

describe('security headers', () => {
  it('sends a nonce CSP that forbids framing by other sites', async () => {
    const res = await middleware(req('https://thedivinetarotonline.com/about', 'thedivinetarotonline.com'));
    const csp = res.headers.get('content-security-policy') || '';
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).not.toContain('api.openai.com');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });
});
