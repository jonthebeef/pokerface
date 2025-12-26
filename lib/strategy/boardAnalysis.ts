import { Card, Rank } from "../poker/types";

// Rank values for comparison
const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};

const RANK_NAMES: Record<Rank, string> = {
  "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  T: "Ten", J: "Jack", Q: "Queen", K: "King", A: "Ace",
};

// ============================================
// BOARD TEXTURE ANALYSIS
// ============================================

export interface BoardTexture {
  wet: boolean;              // Flush or straight draws possible
  fourFlush: boolean;        // 4+ cards of same suit
  threeFlush: boolean;       // 3 cards of same suit (flush draw possible)
  fourStraight: boolean;     // 4 consecutive cards
  threeStraight: boolean;    // 3 connected cards
  flushSuit: string | null;  // The suit if flush is possible
  missingStraightCards: string[]; // Cards that complete the straight
  isRainbow: boolean;        // All different suits
  isMonotone: boolean;       // All same suit
  highCard: Rank;            // Highest card on board
  isPaired: boolean;         // Board has a pair
}

export function analyzeBoardTexture(communityCards: Card[]): BoardTexture {
  if (communityCards.length === 0) {
    return {
      wet: false,
      fourFlush: false,
      threeFlush: false,
      fourStraight: false,
      threeStraight: false,
      flushSuit: null,
      missingStraightCards: [],
      isRainbow: true,
      isMonotone: false,
      highCard: "2",
      isPaired: false,
    };
  }

  // Count suits
  const suitCounts: Record<string, number> = {};
  for (const card of communityCards) {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }

  const maxSuitCount = Math.max(...Object.values(suitCounts));
  const flushSuit = Object.entries(suitCounts).find(([, count]) => count >= 3)?.[0] || null;

  // Check for connected cards (straight potential)
  const values = communityCards.map((c) => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  const uniqueValues = [...new Set(values)];

  // Check for 3+ consecutive
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  for (let i = 1; i < uniqueValues.length; i++) {
    if (uniqueValues[i] - uniqueValues[i - 1] === 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else if (uniqueValues[i] - uniqueValues[i - 1] > 2) {
      currentConsecutive = 1;
    }
  }

  // Check for A-2-3-4 type connectivity
  if (uniqueValues.includes(14) && uniqueValues.includes(2)) {
    // Ace can be low
    const lowValues = [1, ...uniqueValues.filter((v) => v <= 5)].sort((a, b) => a - b);
    let lowConsec = 1;
    for (let i = 1; i < lowValues.length; i++) {
      if (lowValues[i] - lowValues[i - 1] === 1) lowConsec++;
    }
    maxConsecutive = Math.max(maxConsecutive, lowConsec);
  }

  // Find missing straight cards
  const missingStraightCards = findMissingStraightCards(communityCards);

  // Check for paired board
  const rankCounts: Record<string, number> = {};
  for (const card of communityCards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }
  const isPaired = Object.values(rankCounts).some((count) => count >= 2);

  // Find high card
  const highCard = communityCards.reduce((highest, card) =>
    RANK_VALUES[card.rank] > RANK_VALUES[highest.rank] ? card : highest
  ).rank;

  return {
    wet: maxSuitCount >= 3 || maxConsecutive >= 3,
    fourFlush: maxSuitCount >= 4,
    threeFlush: maxSuitCount === 3,
    fourStraight: maxConsecutive >= 4,
    threeStraight: maxConsecutive >= 3,
    flushSuit,
    missingStraightCards,
    isRainbow: Object.keys(suitCounts).length === communityCards.length,
    isMonotone: maxSuitCount === communityCards.length && communityCards.length >= 3,
    highCard,
    isPaired,
  };
}

function findMissingStraightCards(communityCards: Card[]): string[] {
  const values = communityCards.map((c) => RANK_VALUES[c.rank]);
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  const missing: string[] = [];

  // Check each possible 5-card straight window
  for (let start = 1; start <= 10; start++) {
    const window = [start, start + 1, start + 2, start + 3, start + 4];
    // Handle ace-high: 10-J-Q-K-A
    const windowValues = window.map((v) => (v === 1 ? 14 : v > 14 ? v - 13 : v));

    const inWindow = uniqueValues.filter((v) => windowValues.includes(v) || (v === 14 && windowValues.includes(1)));

    if (inWindow.length >= 4) {
      // 4 of the 5 cards are present, find the missing one
      for (const v of windowValues) {
        const checkValue = v === 1 ? 14 : v;
        if (!uniqueValues.includes(checkValue) && !(v === 1 && uniqueValues.includes(14))) {
          const rankName = Object.entries(RANK_VALUES).find(([, val]) => val === checkValue)?.[0];
          if (rankName && !missing.includes(rankName)) {
            missing.push(rankName);
          }
        }
      }
    }
  }

  return missing;
}

// ============================================
// KICKER STRENGTH
// ============================================

export type KickerStrength = "strong" | "medium" | "weak";

export function getKickerStrength(holeCards: [Card, Card], communityCards: Card[]): {
  strength: KickerStrength;
  kicker: Rank | null;
} {
  const boardRanks = communityCards.map((c) => c.rank);

  // Find which hole card is the kicker (the one NOT making the pair)
  let kicker: Rank | null = null;

  for (const card of holeCards) {
    if (boardRanks.includes(card.rank)) {
      // This card makes the pair, the other is the kicker
      const otherCard = holeCards.find((c) => c !== card);
      if (otherCard) {
        kicker = otherCard.rank;
        break;
      }
    }
  }

  // If both hole cards match board or neither does, use the higher hole card
  if (!kicker) {
    kicker = RANK_VALUES[holeCards[0].rank] > RANK_VALUES[holeCards[1].rank]
      ? holeCards[0].rank
      : holeCards[1].rank;
  }

  const kickerValue = RANK_VALUES[kicker];
  let strength: KickerStrength;

  if (kickerValue >= 11) { // J, Q, K, A
    strength = "strong";
  } else if (kickerValue >= 8) { // 8, 9, 10
    strength = "medium";
  } else {
    strength = "weak";
  }

  return { strength, kicker };
}

export function formatKicker(rank: Rank): string {
  return RANK_NAMES[rank];
}

// ============================================
// OVERCARDS
// ============================================

export function countOvercards(communityCards: Card[], pairRank: Rank | null): number {
  if (!pairRank) return 0;

  const pairValue = RANK_VALUES[pairRank];
  return communityCards.filter((c) => RANK_VALUES[c.rank] > pairValue).length;
}

export function getPairRank(holeCards: [Card, Card], communityCards: Card[]): Rank | null {
  const boardRanks = communityCards.map((c) => c.rank);

  // Check if hole cards form a pocket pair
  if (holeCards[0].rank === holeCards[1].rank) {
    return holeCards[0].rank;
  }

  // Check if hole card pairs with board
  for (const card of holeCards) {
    if (boardRanks.includes(card.rank)) {
      return card.rank;
    }
  }

  return null;
}

export function isTopPairOnBoard(holeCards: [Card, Card], communityCards: Card[]): boolean {
  if (communityCards.length === 0) return false;

  const highestBoardRank = communityCards.reduce((highest, card) =>
    RANK_VALUES[card.rank] > RANK_VALUES[highest.rank] ? card : highest
  ).rank;

  return holeCards.some((c) => c.rank === highestBoardRank);
}

export function isOverpair(holeCards: [Card, Card], communityCards: Card[]): boolean {
  // Pocket pair higher than any board card
  if (holeCards[0].rank !== holeCards[1].rank) return false;

  const pocketValue = RANK_VALUES[holeCards[0].rank];
  return communityCards.every((c) => RANK_VALUES[c.rank] < pocketValue);
}

// ============================================
// DRAWS DETECTION
// ============================================

export interface DrawInfo {
  flushDraw: boolean;
  openEnded: boolean;
  gutshot: boolean;
  outs: number;
  description: string;
}

export function detectDraws(holeCards: [Card, Card], communityCards: Card[]): DrawInfo {
  const allCards = [...holeCards, ...communityCards];
  let outs = 0;
  const draws: string[] = [];

  // Flush draw detection
  const suitCounts: Record<string, number> = {};
  for (const card of allCards) {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }
  const flushDraw = Object.values(suitCounts).some((count) => count === 4);
  if (flushDraw) {
    outs += 9;
    draws.push("flush draw");
  }

  // Straight draw detection
  const values = [...new Set(allCards.map((c) => RANK_VALUES[c.rank]))].sort((a, b) => a - b);

  // Add low ace if ace present
  if (values.includes(14)) {
    values.unshift(1);
  }

  let openEnded = false;
  let gutshot = false;

  // Check for open-ended (4 consecutive)
  for (let i = 0; i <= values.length - 4; i++) {
    if (values[i + 3] - values[i] === 3) {
      // 4 consecutive - check if open-ended (not at edges)
      const low = values[i];
      const high = values[i + 3];
      if (low > 1 && high < 14) {
        openEnded = true;
      } else {
        gutshot = true; // One-sided
      }
    }
  }

  // Check for gutshot (4 cards with one gap)
  if (!openEnded) {
    for (let i = 0; i <= values.length - 4; i++) {
      if (values[i + 3] - values[i] === 4) {
        // Possible gutshot
        const window = [values[i], values[i + 1], values[i + 2], values[i + 3]];
        let gaps = 0;
        for (let j = 1; j < window.length; j++) {
          if (window[j] - window[j - 1] === 2) gaps++;
        }
        if (gaps === 1) {
          gutshot = true;
        }
      }
    }
  }

  if (openEnded) {
    outs += 8;
    draws.push("open-ended straight draw");
  } else if (gutshot) {
    outs += 4;
    draws.push("gutshot straight draw");
  }

  return {
    flushDraw,
    openEnded,
    gutshot,
    outs,
    description: draws.length > 0 ? draws.join(" + ") : "no draws",
  };
}

// ============================================
// OUTS TO ODDS
// ============================================

export function getOdds(outs: number, street: "flop" | "turn" | "river"): number {
  // Rule of 4 and 2:
  // - From flop (2 cards to come): outs * 4
  // - From turn (1 card to come): outs * 2
  if (street === "flop") {
    return Math.min(outs * 4, 100);
  }
  return Math.min(outs * 2, 100);
}

// More accurate odds lookup table
export const OUTS_ODDS: Record<number, { flop: number; turn: number }> = {
  1: { flop: 4, turn: 2 },
  2: { flop: 8, turn: 4 },
  3: { flop: 13, turn: 7 },
  4: { flop: 17, turn: 9 },
  5: { flop: 20, turn: 11 },
  6: { flop: 24, turn: 13 },
  7: { flop: 28, turn: 15 },
  8: { flop: 31, turn: 17 },
  9: { flop: 35, turn: 19 },
  10: { flop: 38, turn: 22 },
  11: { flop: 42, turn: 24 },
  12: { flop: 45, turn: 26 },
  13: { flop: 48, turn: 28 },
  14: { flop: 51, turn: 30 },
  15: { flop: 54, turn: 33 },
};

export function getAccurateOdds(outs: number, street: "flop" | "turn" | "river"): number {
  const entry = OUTS_ODDS[outs];
  if (entry) {
    return street === "flop" ? entry.flop : entry.turn;
  }
  return getOdds(outs, street);
}

// ============================================
// USER HAS FLUSH/STRAIGHT CHECK
// ============================================

export function userHasFlushCard(holeCards: [Card, Card], flushSuit: string | null): boolean {
  if (!flushSuit) return false;
  return holeCards.some((c) => c.suit === flushSuit);
}

export function userCompletesTheStraight(
  holeCards: [Card, Card],
  missingStraightCards: string[]
): boolean {
  return holeCards.some((c) => missingStraightCards.includes(c.rank));
}
