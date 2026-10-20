// Single source of truth for what a reading costs. Every price, day count and
// free allowance shown anywhere on the site (paywall, chat copy, /premium,
// emails, order creation) reads from here.
//
// Client's call (Oct 2026): no free readings — the ₹199 pass unlocks
// everything for 30 days. It is a one-time payment, not an auto-renewing
// subscription, so copy must say "30-day pass", never "per month, cancel anytime".
export const PASS_PRICE_INR = 199;
export const PASS_DAYS = 30;
export const FREE_READING_LIMIT = 0;
export const REFERRAL_BONUS_READINGS = 3; // both sides, on the referred friend's first verified pass
export const PASS_PRODUCT = "gkb_pass_30d";
