import { Card, GameStage, HandEvaluation, Action, Recommendation } from "../poker/types";
import { getPreFlopRecommendation } from "./preFlop";

interface AnalysisInput {
  holeCards: [Card, Card];
  communityCards: Card[];
  stage: GameStage;
  handEvaluation: HandEvaluation;
}

/**
 * Get rules-based recommendation (works offline, instant)
 */
export function getRulesBasedRecommendation(input: AnalysisInput): Recommendation {
  const { holeCards, communityCards, stage, handEvaluation } = input;

  // Pre-flop: use Sklansky tiers
  if (stage === "preflop" || communityCards.length === 0) {
    const preFlopRec = getPreFlopRecommendation(holeCards);
    return {
      action: preFlopRec.action,
      confidence: preFlopRec.tier <= 3 ? "HIGH" : preFlopRec.tier <= 6 ? "MEDIUM" : "LOW",
      reasoning: preFlopRec.reasoning,
    };
  }

  // Post-flop: use hand rank as primary factor
  const handRank = handEvaluation.handRank;

  // Strong hands: Two Pair or better (rank >= 3) → RAISE
  if (handRank >= 3) {
    return {
      action: "RAISE",
      confidence: "HIGH",
      reasoning: `You have ${handEvaluation.description}! This is a strong hand - raise to build the pot.`,
    };
  }

  // Made hand: Pair (rank == 2) → CALL
  if (handRank === 2) {
    return {
      action: "CALL",
      confidence: "MEDIUM",
      reasoning: `You have ${handEvaluation.description}. A decent hand - call to see more cards, but be cautious of heavy betting.`,
    };
  }

  // High card only - check for draws
  const possibleDraw = hasFlushDraw(holeCards, communityCards) || hasStraightDraw(holeCards, communityCards);

  if (possibleDraw) {
    return {
      action: "CALL",
      confidence: "LOW",
      reasoning: `You have ${handEvaluation.description} but a possible draw. Call small bets to see if you hit.`,
    };
  }

  // High card with no draws → FOLD
  return {
    action: "FOLD",
    confidence: "HIGH",
    reasoning: `You have ${handEvaluation.description}. With no pair and no draw, fold and wait for a better hand.`,
  };
}

/**
 * Check for flush draw (4 cards of same suit)
 */
function hasFlushDraw(holeCards: [Card, Card], communityCards: Card[]): boolean {
  const allCards = [...holeCards, ...communityCards];
  const suitCounts: Record<string, number> = {};

  for (const card of allCards) {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  }

  return Object.values(suitCounts).some((count) => count === 4);
}

/**
 * Check for straight draw (4 consecutive ranks)
 */
function hasStraightDraw(holeCards: [Card, Card], communityCards: Card[]): boolean {
  const allCards = [...holeCards, ...communityCards];
  const rankValues: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    T: 10, J: 11, Q: 12, K: 13, A: 14,
  };

  const values = [...new Set(allCards.map((c) => rankValues[c.rank]))].sort(
    (a, b) => a - b
  );

  // Check for 4 consecutive values
  for (let i = 0; i <= values.length - 4; i++) {
    if (values[i + 3] - values[i] === 3) {
      return true;
    }
  }

  // Check for A-2-3-4 (wheel draw)
  if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4)) {
    return true;
  }

  return false;
}

/**
 * Build Claude prompt for strategic advice
 */
export function buildClaudePrompt(input: AnalysisInput, rulesRec: Recommendation): string {
  const { holeCards, communityCards, stage, handEvaluation } = input;

  const formatCard = (c: Card) => `${c.rank}${c.suit[0].toUpperCase()}`;
  const holeStr = holeCards.map(formatCard).join(", ");
  const commStr = communityCards.length > 0
    ? communityCards.map(formatCard).join(", ")
    : "none yet";

  return `You are a poker coach for beginners learning Texas Hold'em. Give ONE short sentence (max 20 words) of strategic advice.

Game Stage: ${stage}
Your Hole Cards: ${holeStr}
Community Cards: ${commStr}
Your Hand: ${handEvaluation.description}
Suggested Action: ${rulesRec.action}

Focus on the "why" behind the action. Be encouraging but honest. No jargon.`;
}
