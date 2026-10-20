import crypto from 'crypto';
import { safeEqual, hmacHex } from '@/gkb/lib/creditOrder';
import { PASS_PRICE_INR, PASS_DAYS, FREE_READING_LIMIT } from '@/gkb/lib/pricing';
import { summarizeAccess } from '@/gkb/lib/auth';

describe('reading pass payments', () => {
  it('computes the Razorpay order signature and compares in constant time', () => {
    const expected = crypto.createHmac('sha256', 's3cret').update('order_1|pay_1').digest('hex');
    expect(hmacHex('s3cret', 'order_1|pay_1')).toBe(expected);
    expect(safeEqual(expected, expected)).toBe(true);
    expect(safeEqual(expected, expected.slice(0, -1) + '0')).toBe(expected.endsWith('0'));
    expect(safeEqual(expected, '')).toBe(false);
    expect(safeEqual('', '')).toBe(false);
  });

  it('matches the advertised offer: ₹199, 30 days, no free readings', () => {
    expect(PASS_PRICE_INR).toBe(199);
    expect(PASS_DAYS).toBe(30);
    expect(FREE_READING_LIMIT).toBe(0);
  });

  it('gives no access without a pass, and access with a running pass or bonus readings', () => {
    const base = { email: 'a@b.c', name: 'A', readingsUsed: 0, bonusReadings: 0, subscriptionExpires: null, referralCode: 'X' };
    expect(summarizeAccess(base).hasAccess).toBe(false);
    expect(summarizeAccess({ ...base, subscriptionExpires: new Date(Date.now() + 86400000) }).hasAccess).toBe(true);
    expect(summarizeAccess({ ...base, bonusReadings: 3, readingsUsed: 2 }).hasAccess).toBe(true);
    expect(summarizeAccess({ ...base, bonusReadings: 3, readingsUsed: 3 }).hasAccess).toBe(false);
  });
});
