import { NextResponse, type NextRequest } from 'next/server';

// Short link for invites and share images: /app
// Sends phones to the right store once the apps are listed. Until then (or on
// desktop) visitors land on the website's reading page instead of a store 404.
//   PLAY_STORE_URL  e.g. https://play.google.com/store/apps/details?id=…
//   APP_STORE_URL   e.g. https://apps.apple.com/app/…
export function GET(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  const play = process.env.PLAY_STORE_URL || '';
  const appStore = process.env.APP_STORE_URL || '';
  let to = '';
  if (/android/i.test(ua)) to = play;
  else if (/iphone|ipad|ipod/i.test(ua)) to = appStore;
  return NextResponse.redirect(to || new URL('/reading', req.url), 302);
}
