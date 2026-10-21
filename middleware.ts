import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * One site, one middleware:
 *  1. Old subdomains (reading., learn., booking., support., www.) are folded
 *     into paths on the main domain. Pages get a permanent redirect; API calls
 *     that third parties still make to the old hosts (Razorpay webhooks and
 *     payment-link return URLs on booking.*, unsubscribe links in sent emails)
 *     are served in place so nothing in flight breaks.
 *  2. Per-IP rate limits on /api/* (Upstash). Login, signup, password reset and
 *     public forms get a tight limit. If Upstash is not configured or is
 *     unreachable the request is allowed through (fail open).
 *  3. A per-request nonce CSP. The policy is placed on the *request* too, which
 *     is how Next.js knows to put the nonce on its own inline scripts.
 */

const APEX = process.env.NEXT_PUBLIC_SITE_HOST || 'thedivinetarotonline.com';

// ---------- 1. legacy hosts ----------

type HostRule = (path: string) => { redirect?: string; rewrite?: string } | null;

const HOST_RULES: Record<string, HostRule> = {
  reading: (path) => {
    if (path.startsWith('/api/')) return null; // same routes, served in place
    if (path === '/reset-password' || path.startsWith('/newsletter/')) return { redirect: path };
    return { redirect: '/reading' };
  },
  learn: (path) => {
    if (path.startsWith('/courses/')) return { redirect: path };
    return { redirect: '/courses' };
  },
  booking: (path) => {
    // Razorpay payment-link callbacks/webhooks were registered on this host.
    if (path.startsWith('/api/')) return { rewrite: '/api/booking' + path.slice(4) };
    if (path === '/form') return { redirect: '/personal-reading/form' };
    if (path === '/admin') return { redirect: '/personal-reading/admin' };
    return { redirect: '/personal-reading' };
  },
  support: (path) => {
    if (path.startsWith('/api/')) return null;
    if (path === '/delete-account' || path === '/app' || path === '/privacy') return { redirect: path };
    return { redirect: '/support' };
  },
  chat: () => ({ redirect: '/reading' }), // old Vite chat app
  www: (path) => ({ redirect: path }),
};

function legacyHostResponse(request: NextRequest): NextResponse | null {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  if (!host.endsWith('.' + APEX)) return null;
  const sub = host.slice(0, -(APEX.length + 1));
  const rule = HOST_RULES[sub];
  if (!rule) return null;
  const { pathname, search } = request.nextUrl;
  const action = rule(pathname);
  if (!action) return null;
  if (action.rewrite) {
    const url = request.nextUrl.clone();
    url.pathname = action.rewrite;
    return NextResponse.rewrite(url);
  }
  return NextResponse.redirect(`https://${APEX}${action.redirect}${search}`, 308);
}

// ---------- 2. rate limits ----------

let limiters: { normal: Ratelimit; tight: Ratelimit } | null = null;
let limitersTried = false;

function getLimiters() {
  if (limitersTried) return limiters;
  limitersTried = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes('your-')) return null;
  const redis = new Redis({ url, token });
  limiters = {
    normal: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '60 s'), prefix: 'rl:normal' }),
    tight: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 m'), prefix: 'rl:tight' }),
  };
  return limiters;
}

const TIGHT_ROUTES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/support',
  '/api/subscribe',
  '/api/contact',
  '/api/booking/book',
  '/api/booking/form',
];

// Server-to-server endpoints that must never be throttled.
const UNLIMITED_ROUTES = ['/api/razorpay/', '/api/booking/razorpay-webhook', '/api/kundli-report/webhook', '/api/cron/', '/api/youtube/cron', '/api/newsletter/daily'];

async function rateLimit(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  if (UNLIMITED_ROUTES.some((p) => pathname.startsWith(p))) return null;
  // Only writes are throttled tightly; GETs (e.g. reset-password token check) use the normal bucket.
  const tight = request.method !== 'GET' && TIGHT_ROUTES.some((p) => pathname === p);
  const l = getLimiters();
  if (!l) return null;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous';
  try {
    const result = await (tight ? l.tight : l.normal).limit(`${tight ? pathname : 'api'}:${ip}`);
    if (result.success) return null;
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a little and try again.', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  } catch {
    return null; // Upstash unreachable — fail open
  }
}

// ---------- 3. security headers ----------

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

function buildCsp(nonce: string, isDev: boolean, isHttps: boolean): string {
  const scriptHosts = [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://*.clarity.ms',
    'https://checkout.razorpay.com',
    'https://*.razorpay.com',
    'https://vercel.live',
  ].join(' ');
  return [
    `default-src 'self'`,
    isDev
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${scriptHosts}`
      : `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' ${scriptHosts}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https:`,
    `media-src 'self' blob:`,
    `connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.clarity.ms https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://vercel.live`,
    `frame-src https://www.googletagmanager.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://vercel.live`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://*.razorpay.com`,
    `frame-ancestors 'self'`,
    ...(isHttps ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function applySecurityHeaders(res: NextResponse, csp?: string) {
  if (csp) res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '0');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com"), usb=()'
  );
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const legacy = legacyHostResponse(request);
  if (legacy) return legacy;

  const { pathname, searchParams } = request.nextUrl;

  // Referral links shared before the merge pointed at the reading app's root.
  if (pathname === '/' && searchParams.has('ref')) {
    const url = request.nextUrl.clone();
    url.pathname = '/reading';
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith('/api/')) {
    // CSRF: a browser request that changes state must come from this site.
    // Server-to-server callers (Razorpay webhooks, Vercel Cron) send no Origin.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== 'null') {
        let originHost = '';
        try { originHost = new URL(origin).host.toLowerCase(); } catch { /* malformed */ }
        const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
        const sameSite = originHost === host || originHost === APEX || originHost.endsWith('.' + APEX);
        if (!sameSite) {
          return applySecurityHeaders(NextResponse.json({ error: 'Cross-site request blocked' }, { status: 403 }));
        }
      }
    }
    const limited = await rateLimit(request, pathname);
    if (limited) return applySecurityHeaders(limited);
    return applySecurityHeaders(NextResponse.next());
  }

  const nonce = generateNonce();
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development', proto === 'https');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurityHeaders(res, csp);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
