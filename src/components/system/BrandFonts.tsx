/**
 * Loads the brand web fonts (Cinzel, Playfair Display, Inter, Cormorant
 * Garamond for booking, Noto Sans Devanagari for Hindi). Used only by the
 * sections that had them on their own sites — reading, courses, personal
 * reading, support. The main pages use system fonts, like the live site.
 * React hoists these <link>s into <head>.
 */
export default function BrandFonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
      />
    </>
  );
}
