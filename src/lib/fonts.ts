import { Cinzel, Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';

/**
 * Brand fonts, self-hosted by next/font (no render-blocking Google Fonts
 * stylesheet). They are exposed only as CSS variables on <html>; nothing on
 * the main pages references them, so those pages keep the system fonts the
 * live site shows and the font files are never downloaded there. Reading,
 * courses, personal reading and support switch them on with `.brand-fonts`
 * (globals.css), and booking.css / gkb.css use the variables directly.
 * preload is off so the main pages don't fetch fonts they never use.
 */
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--ff-cinzel', display: 'swap', preload: false });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--ff-cormorant',
  display: 'swap',
  preload: false,
});
const inter = Inter({ subsets: ['latin'], variable: '--ff-inter', display: 'swap', preload: false });
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--ff-playfair',
  display: 'swap',
  preload: false,
});

export const brandFontVariables = [cinzel.variable, cormorant.variable, inter.variable, playfair.variable].join(' ');
