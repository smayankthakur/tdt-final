import { NextResponse, type NextRequest } from 'next/server';

// Short link for invites and share images: support.thedivinetarotonline.com/app
// Sends phones to the right store. Set APP_STORE_URL once the iPhone app is live on the App Store.
const PLAY = 'https://play.google.com/store/apps/details?id=com.thedivinetarotonline.app';
const APP_STORE = process.env.APP_STORE_URL || '';
const WEBSITE = 'https://thedivinetarotonline.com/';

export function GET(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  let to = WEBSITE;
  if (/android/i.test(ua)) to = PLAY;
  else if (/iphone|ipad|ipod/i.test(ua)) to = APP_STORE || WEBSITE;
  else to = PLAY; // desktop: show the Play listing (it also offers "install on a device")
  return NextResponse.redirect(to, 302);
}
