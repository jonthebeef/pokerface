import { Card, Rank, Action, Position } from "../poker/types";

/**
 * Sklansky-Chubukov hand rankings for pre-flop play
 * Tier 1 = best hands, Tier 9 = marginal hands
 */

type HandNotation = string; // e.g., "AA", "AKs", "AKo"

const SKLANSKY_TIERS: Record<number, HandNotation[]> = {
  1: ["AA", "KK", "QQ", "JJ", "AKs"],
  2: ["TT", "AQs", "AJs", "KQs", "AKo"],
  3: ["99", "ATs", "KJs", "QJs", "JTs", "AQo"],
  4: ["88", "KTs", "QTs", "J9s", "T9s", "98s", "AJo", "KQo"],
  5: ["77", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "Q9s", "T8s", "97s", "87s", "76s", "KJo", "QJo", "JTo"],
  6: ["66", "55", "K9s", "J8s", "86s", "75s", "54s", "ATo", "KTo", "QTo"],
  7: ["44", "33", "22", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "Q8s", "T7s", "64s", "53s", "43s", "J9o", "T9o", "98o"],
  8: ["J7s", "96s", "85s", "74s", "42s", "32s", "A9o", "K9o", "Q9o", "J8o", "T8o", "87o", "76o", "65o"],
  9: ["Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "J6s", "J5s", "J4s", "J3s", "J2s", "T6s", "95s", "84s", "73s", "63s", "52s"],
};

/**
 * Convert two hole cards to hand notation
 */
export function getHandNotation(card1: Card, card2: Card): HandNotation {
  const ranks = [card1.rank, card2.rank];
  const suited = card1.suit === card2.suit;

  // Sort ranks (A > K > Q > ... > 2)
  const rankOrder: Record<Rank, number> = {
    A: 14, K: 13, Q: 12, J: 11, T: 10,
    "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
  };

  ranks.sort((a, b) => rankOrder[b] - rankOrder[a]);

  // Pairs
  if (ranks[0] === ranks[1]) {
    return `${ranks[0]}${ranks[1]}`;
  }

  // Non-pairs: add 's' for suited, 'o' for offsuit
  return `${ranks[0]}${ranks[1]}${suited ? "s" : "o"}`;
}

/**
 * Get the Sklansky tier for a hand (1-9, or 10 for unplayable)
 */
export function getSklanskyTier(holeCards: [Card, Card]): number {
  const notation = getHandNotation(holeCards[0], holeCards[1]);

  for (const [tier, hands] of Object.entries(SKLANSKY_TIERS)) {
    if (hands.includes(notation)) {
      return parseInt(tier);
    }
  }

  return 10; // Unplayable
}

/**
 * Position adjustments for pre-flop play
 * Early: Play very tight (only premium hands)
 * Middle: Standard ranges
 * Late: Play looser (position advantage)
 * Blinds: Defend selectively
 */
const POSITION_TIER_ADJUSTMENT: Record<Position, number> = {
  early: -2,  // Subtract 2 from playable tier threshold (tighter)
  middle: 0,  // Standard
  late: 2,    // Add 2 to playable tier threshold (looser)
  blinds: 1,  // Slightly looser to defend blinds
};

/**
 * Get pre-flop recommendation based on hand strength and position
 */
export function getPreFlopRecommendation(
  holeCards: [Card, Card],
  position: Position = "middle"
): {
  action: Action;
  reasoning: string;
  tier: number;
  handDescription: string;
} {
  const tier = getSklanskyTier(holeCards);
  const notation = getHandNotation(holeCards[0], holeCards[1]);
  const adjustment = POSITION_TIER_ADJUSTMENT[position];

  // Position labels for messaging
  const positionLabel = position === "early" ? "early position"
    : position === "late" ? "late position"
    : position === "blinds" ? "the blinds"
    : "middle position";

  // Premium hands (Tier 1-2) - always raise
  if (tier <= 2) {
    return {
      action: "RAISE",
      reasoning: `${notation} is a premium hand. Raise from any position to build the pot.`,
      tier,
      handDescription: `Premium: ${notation}`,
    };
  }

  // Strong hands (Tier 3-4) - raise from most positions
  if (tier <= 4) {
    if (position === "early" && tier === 4) {
      return {
        action: "CALL",
        reasoning: `${notation} is strong but in ${positionLabel}, just call. You'll act first post-flop.`,
        tier,
        handDescription: `Strong: ${notation}`,
      };
    }
    return {
      action: "RAISE",
      reasoning: `${notation} is a strong hand. Raise from ${positionLabel}.`,
      tier,
      handDescription: `Strong: ${notation}`,
    };
  }

  // Playable hands (Tier 5-6) - position dependent
  if (tier <= 6) {
    if (position === "early") {
      return {
        action: "FOLD",
        reasoning: `${notation} is too risky in ${positionLabel}. You'll be out of position post-flop.`,
        tier,
        handDescription: `Marginal: ${notation}`,
      };
    }
    if (position === "late") {
      return {
        action: "RAISE",
        reasoning: `${notation} is playable in ${positionLabel}. Raise and use your position advantage.`,
        tier,
        handDescription: `Playable: ${notation}`,
      };
    }
    return {
      action: "CALL",
      reasoning: `${notation} is playable from ${positionLabel}. Call to see the flop.`,
      tier,
      handDescription: `Playable: ${notation}`,
    };
  }

  // Marginal hands (Tier 7-8) - only from late position or blinds
  if (tier <= 8) {
    if (position === "late") {
      return {
        action: "CALL",
        reasoning: `${notation} is marginal but playable in ${positionLabel}. Call if it's cheap.`,
        tier,
        handDescription: `Marginal: ${notation}`,
      };
    }
    if (position === "blinds") {
      return {
        action: "CHECK",
        reasoning: `${notation} is weak but you're in ${positionLabel}. Check if you can, fold to raises.`,
        tier,
        handDescription: `Marginal: ${notation}`,
      };
    }
    return {
      action: "FOLD",
      reasoning: `${notation} is too weak for ${positionLabel}. Wait for a better hand.`,
      tier,
      handDescription: `Marginal: ${notation}`,
    };
  }

  // Trash hands (Tier 9-10) - fold unless free play
  if (position === "blinds") {
    return {
      action: "CHECK",
      reasoning: `${notation} is weak but check from ${positionLabel} if no raise. Fold to any bet.`,
      tier,
      handDescription: `Weak: ${notation}`,
    };
  }

  return {
    action: "FOLD",
    reasoning: `${notation} is a weak hand. Fold and wait for a better spot.`,
    tier,
    handDescription: `Weak: ${notation}`,
  };
}
