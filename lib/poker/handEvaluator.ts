import { Card, HandEvaluation, toPokersolverFormat } from "./types";

// We'll use pokersolver for hand evaluation
// @ts-expect-error - pokersolver doesn't have types
import { Hand } from "pokersolver";

// Hand rank mapping (pokersolver uses different names)
const HAND_RANKS: Record<string, { rank: number; display: string }> = {
  "High Card": { rank: 1, display: "High Card" },
  Pair: { rank: 2, display: "Pair" },
  "Two Pair": { rank: 3, display: "Two Pair" },
  "Three of a Kind": { rank: 4, display: "Three of a Kind" },
  Straight: { rank: 5, display: "Straight" },
  Flush: { rank: 6, display: "Flush" },
  "Full House": { rank: 7, display: "Full House" },
  "Four of a Kind": { rank: 8, display: "Four of a Kind" },
  "Straight Flush": { rank: 9, display: "Straight Flush" },
  "Royal Flush": { rank: 10, display: "Royal Flush" },
};

/**
 * Evaluate a poker hand using pokersolver
 */
export function evaluateHand(
  holeCards: [Card, Card],
  communityCards: Card[]
): HandEvaluation {
  // Need at least the hole cards
  if (!holeCards || holeCards.length !== 2) {
    return {
      handName: "Unknown",
      handRank: 0,
      strength: 0,
      description: "Need 2 hole cards",
      bestCards: [],
    };
  }

  // Combine all available cards
  const allCards = [...holeCards, ...communityCards];

  // Convert to pokersolver format
  const pokersolverCards = allCards.map(toPokersolverFormat);

  // Solve the hand
  const solved = Hand.solve(pokersolverCards);

  // Get hand info
  const handInfo = HAND_RANKS[solved.name] || { rank: 1, display: solved.name };

  // Calculate strength score (0-100)
  // Map hand ranks to reasonable strength ranges
  const strengthRanges: Record<number, [number, number]> = {
    1: [5, 20],    // High Card: 5-20
    2: [25, 40],   // Pair: 25-40
    3: [45, 60],   // Two Pair: 45-60
    4: [60, 72],   // Three of a Kind: 60-72
    5: [72, 80],   // Straight: 72-80
    6: [80, 85],   // Flush: 80-85
    7: [85, 92],   // Full House: 85-92
    8: [92, 96],   // Four of a Kind: 92-96
    9: [96, 99],   // Straight Flush: 96-99
    10: [100, 100], // Royal Flush: 100
  };

  const [minStr, maxStr] = strengthRanges[handInfo.rank] || [0, 10];
  // Use pokersolver's internal rank to interpolate within the range
  const internalRank = Math.min(10, solved.rank || 5);
  const strength = Math.round(minStr + (maxStr - minStr) * (internalRank / 10));

  return {
    handName: handInfo.display,
    handRank: handInfo.rank,
    strength,
    description: solved.descr || handInfo.display,
    bestCards: allCards.slice(0, 5), // pokersolver returns best 5
  };
}

/**
 * Compare two hands and determine winner
 * Returns: 1 if hand1 wins, -1 if hand2 wins, 0 if tie
 */
export function compareHands(
  hand1: { holeCards: [Card, Card]; communityCards: Card[] },
  hand2: { holeCards: [Card, Card]; communityCards: Card[] }
): number {
  const cards1 = [...hand1.holeCards, ...hand1.communityCards].map(
    toPokersolverFormat
  );
  const cards2 = [...hand2.holeCards, ...hand2.communityCards].map(
    toPokersolverFormat
  );

  const solved1 = Hand.solve(cards1);
  const solved2 = Hand.solve(cards2);

  const winners = Hand.winners([solved1, solved2]);

  if (winners.length === 2) return 0; // Tie
  if (winners[0] === solved1) return 1;
  return -1;
}

/**
 * Get a simple strength category for UI display
 */
export function getStrengthCategory(
  evaluation: HandEvaluation
): "weak" | "medium" | "strong" | "monster" {
  if (evaluation.strength >= 70) return "monster";
  if (evaluation.strength >= 50) return "strong";
  if (evaluation.strength >= 30) return "medium";
  return "weak";
}
