/**
 * Real testimonials only.
 *
 * Add an entry here ONLY for a review a real customer actually gave (YouTube
 * comment, Google review, WhatsApp message) AND agreed to have shown on the
 * site. Use the name the way they agreed to be shown (e.g. "Neha, Pune").
 * `source` is shown under the name so visitors can see where it came from.
 *
 * The previous home-page quotes (Sarah M., James L., Emily R., Michael K.,
 * Priya S. — "Verified Reader") could not be traced to real customers, so they
 * were removed. Under Indian consumer-protection guidance and ASCI rules,
 * invented or unverifiable reviews are treated as misleading advertising.
 *
 * While this list is empty, the home page shows the community section
 * (YouTube / Instagram) instead of a testimonial carousel.
 */
export interface Testimonial {
  name: string;
  text: string;
  source: 'YouTube' | 'Google' | 'Instagram' | 'WhatsApp' | 'Email';
  rating?: 1 | 2 | 3 | 4 | 5;
  /** Line under the name, e.g. "Verified Reader" (default: "via <source>"). */
  subtitle?: string;
}

export const TESTIMONIALS: Testimonial[] = [];
