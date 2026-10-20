import { zoneOffsetMinutes, toUtcInstant } from '@/lib/astrology/moon';
import { computeMatch } from '@/lib/astrology/ashtakoota';

describe('zoneOffsetMinutes', () => {
  it('handles daylight saving and half-hour zones', () => {
    expect(zoneOffsetMinutes('Europe/London', '1995-07-01', '10:00')).toBe(60);
    expect(zoneOffsetMinutes('Europe/London', '1995-01-01', '10:00')).toBe(0);
    expect(zoneOffsetMinutes('America/New_York', '2000-07-04', '12:00')).toBe(-240);
    expect(zoneOffsetMinutes('America/New_York', '2000-01-04', '12:00')).toBe(-300);
    expect(zoneOffsetMinutes('Asia/Kolkata', '1995-03-25', '22:55')).toBe(330);
    expect(zoneOffsetMinutes('Asia/Kathmandu', '2020-01-01', '00:30')).toBe(345);
  });
  it('round-trips with toUtcInstant', () => {
    const off = zoneOffsetMinutes('Asia/Kolkata', '1995-03-25', '22:55')!;
    expect(toUtcInstant('1995-03-25', '22:55', off)!.toISOString()).toBe('1995-03-25T17:25:00.000Z');
  });
});

describe('dosha cancellations', () => {
  it('cancels Nadi dosha for the same Moon sign with different nakshatras', () => {
    // Ashwini (0, Aadi) and Magha... use same rashi Mesha: Ashwini(0) Aadi, Krittika(2) Antya -> different nadi.
    // Same nadi + same rashi: Ashwini (0, Aadi) & ... nakshatra 5 (Ardra, Aadi) is Mithuna, so build directly:
    const boy = { name: 'A', rashi: 3, nakshatra: 7 }; // Pushya (Madhya), Karka
    const girl = { name: 'B', rashi: 3, nakshatra: 8 }; // Ashlesha (Antya), Karka
    const sameNadiBoy = { name: 'A', rashi: 0, nakshatra: 0 }; // Ashwini, Aadi, Mesha
    const sameNadiGirl = { name: 'B', rashi: 0, nakshatra: 5 }; // Aadi nadi, forced same rashi for the test
    const m = computeMatch(sameNadiBoy, sameNadiGirl);
    expect(m.doshas).not.toContain('Nadi Dosha');
    expect(m.cancelledDoshas.join()).toMatch(/Nadi Dosha \(cancelled: same Moon sign/);
    // Nadi points are still 0 — the guna total is not inflated
    expect(m.kootas.find((k) => k.key === 'nadi')!.score).toBe(0);
    // A pair with different nadis has no Nadi dosha at all
    expect(computeMatch(boy, girl).doshas).not.toContain('Nadi Dosha');
  });

  it('keeps Nadi dosha when no exception applies', () => {
    const m = computeMatch({ name: 'A', rashi: 0, nakshatra: 0 }, { name: 'B', rashi: 2, nakshatra: 5 }); // both Aadi
    expect(m.doshas).toContain('Nadi Dosha');
  });

  it('cancels Bhakoot dosha when both signs share a lord (Aries–Scorpio, 6-8)', () => {
    const m = computeMatch({ name: 'A', rashi: 0, nakshatra: 1 }, { name: 'B', rashi: 7, nakshatra: 16 });
    expect(m.kootas.find((k) => k.key === 'bhakoot')!.score).toBe(0);
    expect(m.doshas).not.toContain('Bhakoot Dosha');
    expect(m.cancelledDoshas.join()).toMatch(/Bhakoot Dosha \(cancelled: both Moon signs ruled by Mars\)/);
  });
});
