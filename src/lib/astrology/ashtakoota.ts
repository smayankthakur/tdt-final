/**
 * Ashtakoota Guna Milan — classical Vedic marriage-compatibility scoring.
 *
 * The eight kootas compared from both partners' Moon sign (Rashi) and lunar
 * mansion (Nakshatra), summing to a maximum of 36 gunas:
 *   Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7, Nadi 8.
 *
 * This is an original implementation of the traditional method. Point
 * conventions follow the commonly published tables; minor half-point
 * variations exist between schools of jyotisha.
 */

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

export const RASHIS = [
  'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)',
  'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrischika (Scorpio)',
  'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)',
];

export interface Person {
  name: string;
  rashi: number;     // 0-11
  nakshatra: number; // 0-26
  pada?: number;     // 1-4 (optional; enables the same-nakshatra Nadi exception)
}

export interface KootaResult {
  key: string;
  label: string;
  max: number;
  score: number;
  note: string;
}

export interface MatchResult {
  total: number;
  max: 36;
  percent: number;
  kootas: KootaResult[];
  verdict: string;
  /** Doshas that apply. */
  doshas: string[];
  /** Doshas present by score but cancelled by a classical exception (parihara), with the reason. */
  cancelledDoshas: string[];
}

/* ---------------------------------------------------------------- Varna (1) */
// Rashi -> Varna rank (Brahmin 4, Kshatriya 3, Vaishya 2, Shudra 1)
const VARNA_RANK = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4];
const VARNA_NAME = ['Shudra', 'Vaishya', 'Kshatriya', 'Brahmin'];

function varna(boy: Person, girl: Person): KootaResult {
  const b = VARNA_RANK[boy.rashi];
  const g = VARNA_RANK[girl.rashi];
  const score = b >= g ? 1 : 0;
  return {
    key: 'varna', label: 'Varna', max: 1, score,
    note: `${VARNA_NAME[b - 1]} & ${VARNA_NAME[g - 1]} — spiritual grain and ego balance.`,
  };
}

/* --------------------------------------------------------------- Vashya (2) */
// Vashya groups: 0 Chatushpad, 1 Nara(human), 2 Jalchar, 3 Vanchar, 4 Keet
const VASHYA_GROUP = [0, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2];
const VASHYA_NAME = ['Chatushpad', 'Manav', 'Jalchar', 'Vanchar', 'Keet'];
// symmetric compatibility matrix (points out of 2)
const VASHYA_MATRIX: number[][] = [
  //          Cha  Nara Jal  Van  Keet
  /* Cha  */ [2, 1, 1, 0, 1],
  /* Nara */ [1, 2, 1, 0, 1],
  /* Jal  */ [1, 1, 2, 1, 1],
  /* Van  */ [0, 0, 1, 2, 1],
  /* Keet */ [1, 1, 1, 1, 2],
];

function vashya(boy: Person, girl: Person): KootaResult {
  const gb = VASHYA_GROUP[boy.rashi];
  const gg = VASHYA_GROUP[girl.rashi];
  const score = VASHYA_MATRIX[gb][gg];
  return {
    key: 'vashya', label: 'Vashya', max: 2, score,
    note: `${VASHYA_NAME[gb]} & ${VASHYA_NAME[gg]} — mutual magnetism and influence.`,
  };
}

/* ----------------------------------------------------------------- Tara (3) */
function countStars(from: number, to: number): number {
  return ((to - from + 27) % 27) + 1;
}
function taraGood(count: number): boolean {
  const r = count % 9;
  return ![3, 5, 7].includes(r); // 0(9),1,2,4,6,8 auspicious
}
function tara(boy: Person, girl: Person): KootaResult {
  const g1 = taraGood(countStars(boy.nakshatra, girl.nakshatra));
  const g2 = taraGood(countStars(girl.nakshatra, boy.nakshatra));
  const score = (g1 ? 1.5 : 0) + (g2 ? 1.5 : 0);
  return {
    key: 'tara', label: 'Tara (Dina)', max: 3, score,
    note: 'Birth-star harmony — health, fortune and longevity of the bond.',
  };
}

/* ----------------------------------------------------------------- Yoni (4) */
// Nakshatra -> yoni animal index (0-13)
// 0 Horse 1 Elephant 2 Sheep 3 Serpent 4 Dog 5 Cat 6 Rat 7 Cow
// 8 Buffalo 9 Tiger 10 Deer 11 Monkey 12 Mongoose 13 Lion
const YONI = [
  0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1,
];
const YONI_NAME = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'];
// 14x14 compatibility (4 same, 3 friend, 2 neutral, 1 enemy, 0 bitter enemy)
const YONI_MATRIX: number[][] = [
  /*Hor*/[4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  /*Ele*/[2, 4, 3, 3, 2, 2, 2, 2, 2, 1, 2, 3, 2, 0],
  /*She*/[2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  /*Ser*/[3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  /*Dog*/[2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  /*Cat*/[2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 2, 2, 1],
  /*Rat*/[2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 3, 2],
  /*Cow*/[1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 2, 2, 2, 3],
  /*Buf*/[0, 2, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 2],
  /*Tig*/[1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 2, 2, 2, 1],
  /*Dee*/[3, 2, 2, 2, 0, 3, 2, 2, 2, 2, 4, 2, 2, 1],
  /*Mon*/[3, 3, 0, 2, 2, 2, 2, 2, 2, 2, 2, 4, 3, 2],
  /*Mng*/[2, 2, 3, 0, 1, 2, 3, 2, 2, 2, 2, 3, 4, 2],
  /*Lio*/[1, 0, 1, 2, 1, 1, 2, 3, 2, 1, 1, 2, 2, 4],
];
function yoni(boy: Person, girl: Person): KootaResult {
  const yb = YONI[boy.nakshatra];
  const yg = YONI[girl.nakshatra];
  const score = YONI_MATRIX[yb][yg];
  return {
    key: 'yoni', label: 'Yoni', max: 4, score,
    note: `${YONI_NAME[yb]} & ${YONI_NAME[yg]} — physical and instinctive compatibility.`,
  };
}

/* --------------------------------------------------------- Graha Maitri (5) */
// Rashi -> lord planet index: 0 Sun 1 Moon 2 Mars 3 Mercury 4 Jupiter 5 Venus 6 Saturn
const RASHI_LORD = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];
const PLANET_NAME = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
// relationship: 1 friend, 0 neutral, -1 enemy  [planet][planet]
const FRIENDSHIP: number[][] = [
  //        Sun Moo Mar Mer Jup Ven Sat
  /*Sun*/  [1, 1, 1, 0, 1, -1, -1],
  /*Moo*/  [1, 1, 0, 1, 0, 0, 0],
  /*Mar*/  [1, 1, 1, -1, 1, 0, 0],
  /*Mer*/  [1, -1, 0, 1, 0, 1, 0],
  /*Jup*/  [1, 1, 1, -1, 1, -1, 0],
  /*Ven*/  [-1, -1, 0, 1, 0, 1, 1],
  /*Sat*/  [-1, -1, -1, 1, 0, 1, 1],
];
function grahaMaitri(boy: Person, girl: Person): KootaResult {
  const lb = RASHI_LORD[boy.rashi];
  const lg = RASHI_LORD[girl.rashi];
  let score: number;
  if (lb === lg) {
    score = 5;
  } else {
    const r1 = FRIENDSHIP[lb][lg];
    const r2 = FRIENDSHIP[lg][lb];
    const sum = r1 + r2;
    if (r1 === 1 && r2 === 1) score = 5;
    else if (sum === 1) score = 4; // friend + neutral
    else if (r1 === 0 && r2 === 0) score = 3;
    else if (sum === 0) score = 1; // friend + enemy
    else if (sum === -1) score = 0.5; // neutral + enemy
    else score = 0; // enemy + enemy
  }
  return {
    key: 'graha', label: 'Graha Maitri', max: 5, score,
    note: `${PLANET_NAME[lb]} & ${PLANET_NAME[lg]} — mental affinity and friendship of sign-lords.`,
  };
}

/* ----------------------------------------------------------------- Gana (6) */
// 0 Deva, 1 Manushya, 2 Rakshasa
const GANA = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0,
];
const GANA_NAME = ['Deva', 'Manushya', 'Rakshasa'];
const GANA_MATRIX: number[][] = [
  /*Deva*/ [6, 5, 1],
  /*Manu*/ [5, 6, 0],
  /*Raks*/ [1, 0, 6],
];
function gana(boy: Person, girl: Person): KootaResult {
  const gb = GANA[boy.nakshatra];
  const gg = GANA[girl.nakshatra];
  const score = GANA_MATRIX[gb][gg];
  return {
    key: 'gana', label: 'Gana', max: 6, score,
    note: `${GANA_NAME[gb]} & ${GANA_NAME[gg]} — temperament and shared nature.`,
  };
}

/* -------------------------------------------------------------- Bhakoot (7) */
function bhakoot(boy: Person, girl: Person): { res: KootaResult; dosha: boolean } {
  const d1 = ((girl.rashi - boy.rashi + 12) % 12) + 1;
  const d2 = ((boy.rashi - girl.rashi + 12) % 12) + 1;
  const pair = [d1, d2].sort((a, b) => a - b).join('-');
  const bad = ['2-12', '5-9', '6-8'].includes(pair);
  const score = bad ? 0 : 7;
  return {
    res: {
      key: 'bhakoot', label: 'Bhakoot', max: 7, score,
      note: bad
        ? `Bhakoot dosha (${pair}) — strain on health, finances or family growth.`
        : 'Signs well placed — supports prosperity and family life.',
    },
    dosha: bad,
  };
}

/* ----------------------------------------------------------------- Nadi (8) */
// 0 Aadi (Vata), 1 Madhya (Pitta), 2 Antya (Kapha)
const NADI = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2,
];
const NADI_NAME = ['Aadi', 'Madhya', 'Antya'];
function nadi(boy: Person, girl: Person): { res: KootaResult; dosha: boolean } {
  const nb = NADI[boy.nakshatra];
  const ng = NADI[girl.nakshatra];
  const same = nb === ng;
  const score = same ? 0 : 8;
  return {
    res: {
      key: 'nadi', label: 'Nadi', max: 8, score,
      note: same
        ? `Nadi dosha — both ${NADI_NAME[nb]}. Traditionally the most serious koota; remedies advised.`
        : `${NADI_NAME[nb]} & ${NADI_NAME[ng]} — supports health of the couple and progeny.`,
    },
    dosha: same,
  };
}

/* ------------------------------------------------- Couple-life impact ---- */
export interface KootaImpact {
  area: string;               // life area this koota governs
  level: 'strong' | 'fair' | 'weak';
  weight: number;             // share of the 36 total this koota can add (%)
  impact: string;             // plain-language effect on the relationship
}

const KOOTA_META: Record<
  string,
  { area: string; strong: string; fair: string; weak: string }
> = {
  varna: {
    area: 'Ego & mutual respect',
    strong: 'Egos stay balanced — neither partner dominates, respect flows naturally.',
    fair: 'Mostly respectful, with occasional tussles over who leads.',
    weak: 'Ego clashes and control struggles can surface; conscious humility helps.',
  },
  vashya: {
    area: 'Attraction & influence',
    strong: 'Healthy magnetism — you naturally draw and hold each other’s attention.',
    fair: 'A workable pull; effort to stay interested in each other matters.',
    weak: 'One partner may feel less desired or less heard; keep effort mutual.',
  },
  tara: {
    area: 'Destiny, health & fortune',
    strong: 'Your fortunes support each other — steady health and shared luck over time.',
    fair: 'Ups and downs, but nothing that patience can’t carry you through.',
    weak: 'Rough patches in health or timing are possible; face them as a team.',
  },
  yoni: {
    area: 'Physical & intimate bond',
    strong: 'Strong physical chemistry and instinctive intimacy.',
    fair: 'Decent physical rapport; talking openly keeps it warm.',
    weak: 'Intimate rhythms differ — honest communication about needs is key.',
  },
  graha: {
    area: 'Mental bond & friendship',
    strong: 'Minds meet easily — friendship, trust and shared thinking.',
    fair: 'You think differently at times but can find common ground.',
    weak: 'Different mindsets can breed misunderstanding; build shared rituals.',
  },
  gana: {
    area: 'Temperament & nature',
    strong: 'Compatible temperaments — day-to-day harmony and fewer clashes.',
    fair: 'Two different paces that meet in the middle with give-and-take.',
    weak: 'Contrasting natures may spark friction; respect each other’s style.',
  },
  bhakoot: {
    area: 'Emotional bond, family & money',
    strong: 'Emotionally secure — supports family growth and financial stability.',
    fair: 'A steady emotional base with the usual bumps of shared life.',
    weak: 'Bhakoot dosha can strain emotions, health or finances; remedies advised.',
  },
  nadi: {
    area: 'Health, vitality & children',
    strong: 'Complementary energies — supports the couple’s health and progeny.',
    fair: 'Generally supportive of well-being and family plans.',
    weak: 'Nadi dosha is the most serious koota — affecting health/progeny; remedies strongly advised.',
  },
};

export function kootaImpact(k: KootaResult): KootaImpact {
  const ratio = k.max ? k.score / k.max : 0;
  const level: KootaImpact['level'] = ratio >= 0.66 ? 'strong' : ratio >= 0.34 ? 'fair' : 'weak';
  const meta = KOOTA_META[k.key] ?? { area: '', strong: '', fair: '', weak: '' };
  return {
    area: meta.area,
    level,
    weight: Math.round((k.max / 36) * 100),
    impact: meta[level],
  };
}

/* ------------------------------------------------ Dosha cancellations ---- */
// Natural planetary friendships (Parashara), indices as in RASHI_LORD.
// Two lords count as friends only when each lists the other.
const NATURAL_FRIENDS: Record<number, number[]> = {
  0: [1, 2, 4], // Sun: Moon, Mars, Jupiter
  1: [0, 3],    // Moon: Sun, Mercury
  2: [0, 1, 4], // Mars: Sun, Moon, Jupiter
  3: [0, 5],    // Mercury: Sun, Venus
  4: [0, 1, 2], // Jupiter: Sun, Moon, Mars
  5: [3, 6],    // Venus: Mercury, Saturn
  6: [3, 5],    // Saturn: Mercury, Venus
};
const mutualFriends = (a: number, b: number) => NATURAL_FRIENDS[a]?.includes(b) && NATURAL_FRIENDS[b]?.includes(a);

/** Classical exceptions that cancel Nadi dosha. Returns the reason, or null. */
function nadiCancellation(boy: Person, girl: Person): string | null {
  if (boy.rashi === girl.rashi && boy.nakshatra !== girl.nakshatra) return 'same Moon sign, different nakshatras';
  if (boy.nakshatra === girl.nakshatra && boy.rashi !== girl.rashi) return 'same nakshatra, different Moon signs';
  if (boy.nakshatra === girl.nakshatra && boy.rashi === girl.rashi && boy.pada && girl.pada && boy.pada !== girl.pada)
    return 'same nakshatra, different padas';
  return null;
}

/** Classical exceptions that cancel Bhakoot dosha. Returns the reason, or null. */
function bhakootCancellation(boy: Person, girl: Person): string | null {
  const lb = RASHI_LORD[boy.rashi];
  const lg = RASHI_LORD[girl.rashi];
  if (lb === lg) return `both Moon signs ruled by ${PLANET_NAME[lb]}`;
  if (mutualFriends(lb, lg)) return `sign lords ${PLANET_NAME[lb]} and ${PLANET_NAME[lg]} are natural friends`;
  return null;
}

/* -------------------------------------------------------------- Aggregate */
export function computeMatch(boy: Person, girl: Person): MatchResult {
  const bh = bhakoot(boy, girl);
  const nd = nadi(boy, girl);

  const kootas: KootaResult[] = [
    varna(boy, girl),
    vashya(boy, girl),
    tara(boy, girl),
    yoni(boy, girl),
    grahaMaitri(boy, girl),
    gana(boy, girl),
    bh.res,
    nd.res,
  ];

  const total = kootas.reduce((s, k) => s + k.score, 0);
  const percent = Math.round((total / 36) * 1000) / 10;

  // Guna points stay as scored (the traditional 36-point total); a cancelled
  // dosha is reported as cancelled instead of being shown as a live dosha.
  const doshas: string[] = [];
  const cancelledDoshas: string[] = [];
  if (nd.dosha) {
    const why = nadiCancellation(boy, girl);
    if (why) {
      cancelledDoshas.push(`Nadi Dosha (cancelled: ${why})`);
      nd.res.note += ` Cancelled by classical exception: ${why}.`;
    } else doshas.push('Nadi Dosha');
  }
  if (bh.dosha) {
    const why = bhakootCancellation(boy, girl);
    if (why) {
      cancelledDoshas.push(`Bhakoot Dosha (cancelled: ${why})`);
      bh.res.note += ` Cancelled by classical exception: ${why}.`;
    } else doshas.push('Bhakoot Dosha');
  }

  let verdict: string;
  if (total >= 32) verdict = 'Excellent — a rare and deeply harmonious match.';
  else if (total >= 25) verdict = 'Very good — a strong, promising match.';
  else if (total >= 18) verdict = 'Acceptable — workable, mind the weaker kootas.';
  else verdict = 'Weak — significant friction indicated; proceed only with guidance.';

  return { total, max: 36, percent, kootas, verdict, doshas, cancelledDoshas };
}
