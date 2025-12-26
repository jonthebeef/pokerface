import { Card, GameStage, HandEvaluation, Recommendation } from "../poker/types";
import { getPreFlopRecommendation } from "./preFlop";
import {
  analyzeBoardTexture,
  getKickerStrength,
  formatKicker,
  countOvercards,
  getPairRank,
  isTopPairOnBoard,
  isOverpair,
  detectDraws,
  getAccurateOdds,
  userHasFlushCard,
  userCompletesTheStraight,
  BoardTexture,
  DrawInfo,
} from "./boardAnalysis";

interface AnalysisInput {
  holeCards: [Card, Card];
  communityCards: Card[];
  stage: GameStage;
  handEvaluation: HandEvaluation;
}

export interface EnhancedRecommendation extends Recommendation {
  handDescription: string;
  boardWarning?: string;
  drawInfo?: string;
  outsOdds?: string;
}

/**
 * Get rules-based recommendation with enhanced analysis
 */
export function getRulesBasedRecommendation(input: AnalysisInput): EnhancedRecommendation {
  const { holeCards, communityCards, stage, handEvaluation } = input;

  // Pre-flop: use Sklansky tiers
  if (stage === "preflop" || communityCards.length === 0) {
    const preFlopRec = getPreFlopRecommendation(holeCards);
    return {
      action: preFlopRec.action,
      confidence: preFlopRec.tier <= 3 ? "HIGH" : preFlopRec.tier <= 6 ? "MEDIUM" : "LOW",
      reasoning: preFlopRec.reasoning,
      handDescription: `Starting hand: ${formatHoleCards(holeCards)}`,
    };
  }

  // Post-flop analysis
  const handRank = handEvaluation.handRank;
  const boardTexture = analyzeBoardTexture(communityCards);
  const draws = detectDraws(holeCards, communityCards);
  const street = communityCards.length === 3 ? "flop" : communityCards.length === 4 ? "turn" : "river";

  // ============================================
  // CRITICAL BOARD CHECKS
  // ============================================

  // Four-flush on board - critical danger
  if (boardTexture.fourFlush && boardTexture.flushSuit) {
    const hasFlushCard = userHasFlushCard(holeCards, boardTexture.flushSuit);
    if (!hasFlushCard) {
      return {
        action: "FOLD",
        confidence: "HIGH",
        reasoning: `Four ${boardTexture.flushSuit} on board - anyone with one ${boardTexture.flushSuit} has a flush. Your hand is likely beaten.`,
        handDescription: handEvaluation.description,
        boardWarning: `DANGER: Four-flush on board!`,
      };
    }
  }

  // Four-straight on board
  if (boardTexture.fourStraight && boardTexture.missingStraightCards.length > 0) {
    const completesIt = userCompletesTheStraight(holeCards, boardTexture.missingStraightCards);
    if (!completesIt) {
      return {
        action: "CHECK",
        confidence: "LOW",
        reasoning: `Four to a straight on board. Anyone with a ${boardTexture.missingStraightCards.join(" or ")} has a straight.`,
        handDescription: handEvaluation.description,
        boardWarning: `DANGER: Four-straight on board!`,
      };
    }
  }

  // ============================================
  // STRONG HANDS (Two Pair or Better)
  // ============================================
  if (handRank >= 3) {
    const contributing = doHoleCardsContribute(holeCards, communityCards, handRank);

    if (contributing) {
      let warning: string | undefined;
      if (boardTexture.wet) {
        warning = "Wet board - draws possible";
      }

      return {
        action: "RAISE",
        confidence: "HIGH",
        reasoning: `${handEvaluation.description}! Strong hand and your cards make it. Build the pot.`,
        handDescription: handEvaluation.description,
        boardWarning: warning,
      };
    } else {
      return {
        action: "CHECK",
        confidence: "LOW",
        reasoning: `The ${handEvaluation.handName} is on the board - everyone has it. Your cards don't improve it.`,
        handDescription: `Board: ${handEvaluation.description}`,
        boardWarning: "Board hand - you don't have an edge",
      };
    }
  }

  // ============================================
  // PAIR
  // ============================================
  if (handRank === 2) {
    const contributing = doHoleCardsContribute(holeCards, communityCards, handRank);

    if (!contributing) {
      // Board pair - check for draws
      if (draws.outs >= 8) {
        const odds = getAccurateOdds(draws.outs, street);
        return {
          action: "CHECK",
          confidence: "LOW",
          reasoning: `The pair is on the board (everyone has it). But you have a ${draws.description}.`,
          handDescription: `Board pair + ${draws.description}`,
          drawInfo: `${draws.outs} outs`,
          outsOdds: `~${odds}% to improve`,
        };
      }
      return {
        action: "FOLD",
        confidence: "HIGH",
        reasoning: `The pair is on the board - everyone has it. Your ${formatHoleCards(holeCards)} don't help.`,
        handDescription: "Board pair only",
        boardWarning: "No edge - fold to any bet",
      };
    }

    // You made the pair - analyze quality
    const pairRank = getPairRank(holeCards, communityCards);
    const { strength: kickerStrength, kicker } = getKickerStrength(holeCards, communityCards);
    const overcards = countOvercards(communityCards, pairRank);
    const topPair = isTopPairOnBoard(holeCards, communityCards);
    const overpair = isOverpair(holeCards, communityCards);

    // Overpair (pocket pair higher than board) - very strong
    if (overpair) {
      let boardWarning: string | undefined;
      if (boardTexture.wet) {
        boardWarning = "Wet board - be cautious of draws";
      }
      return {
        action: "RAISE",
        confidence: "HIGH",
        reasoning: `Overpair! Your ${handEvaluation.description} is higher than any board card. Strong hand.`,
        handDescription: `Overpair: ${handEvaluation.description}`,
        boardWarning,
      };
    }

    // Top pair with strong kicker
    if (topPair && kickerStrength === "strong" && overcards === 0) {
      return {
        action: "RAISE",
        confidence: "HIGH",
        reasoning: `Top pair with ${formatKicker(kicker!)} kicker. Strong hand - build the pot.`,
        handDescription: `Top pair, ${formatKicker(kicker!)} kicker`,
        boardWarning: boardTexture.wet ? "Wet board - watch for draws" : undefined,
      };
    }

    // Top pair but vulnerable
    if (topPair && (kickerStrength === "weak" || overcards >= 1)) {
      const issues: string[] = [];
      if (kickerStrength === "weak") issues.push("weak kicker");
      if (overcards >= 1) issues.push(`${overcards} overcard${overcards > 1 ? "s" : ""}`);

      return {
        action: "CALL",
        confidence: "MEDIUM",
        reasoning: `Top pair but ${issues.join(" and ")}. Good hand but don't overplay it.`,
        handDescription: `Top pair, ${formatKicker(kicker!)} kicker`,
        boardWarning: issues.join(", "),
      };
    }

    // Top pair with medium kicker
    if (topPair) {
      return {
        action: "CALL",
        confidence: "MEDIUM",
        reasoning: `Top pair with ${formatKicker(kicker!)} kicker. Decent hand - call but be cautious of raises.`,
        handDescription: `Top pair, ${formatKicker(kicker!)} kicker`,
      };
    }

    // Middle or bottom pair
    const pairPosition = getPairPosition(holeCards, communityCards);
    if (overcards >= 2) {
      return {
        action: "CHECK",
        confidence: "LOW",
        reasoning: `${pairPosition} pair with ${overcards} overcards on board. Anyone with those cards beats you. Check or fold to bets.`,
        handDescription: `${pairPosition} pair`,
        boardWarning: `${overcards} overcards - vulnerable`,
      };
    }

    return {
      action: "CALL",
      confidence: "LOW",
      reasoning: `${pairPosition} pair. Proceed cautiously - better hands are possible.`,
      handDescription: `${pairPosition} pair`,
    };
  }

  // ============================================
  // HIGH CARD - Check for draws
  // ============================================
  if (handRank === 1) {
    const odds = draws.outs > 0 ? getAccurateOdds(draws.outs, street) : 0;

    // Monster draw (flush + straight)
    if (draws.flushDraw && draws.openEnded) {
      return {
        action: "RAISE",
        confidence: "MEDIUM",
        reasoning: `Monster draw! ${draws.description}. You're actually a favorite to improve.`,
        handDescription: "Monster draw",
        drawInfo: `${draws.outs} outs`,
        outsOdds: `~${odds}% to hit`,
      };
    }

    // Flush draw
    if (draws.flushDraw) {
      return {
        action: "CALL",
        confidence: "MEDIUM",
        reasoning: `Flush draw with 9 outs. Worth calling if the price is right.`,
        handDescription: "Flush draw",
        drawInfo: "9 outs",
        outsOdds: `~${odds}% to hit`,
      };
    }

    // Open-ended straight draw
    if (draws.openEnded) {
      return {
        action: "CALL",
        confidence: "MEDIUM",
        reasoning: `Open-ended straight draw with 8 outs. Good drawing hand.`,
        handDescription: "Open-ended straight draw",
        drawInfo: "8 outs",
        outsOdds: `~${odds}% to hit`,
      };
    }

    // Gutshot
    if (draws.gutshot) {
      return {
        action: "CHECK",
        confidence: "LOW",
        reasoning: `Gutshot straight draw only (4 outs). Don't pay much to chase it.`,
        handDescription: "Gutshot straight draw",
        drawInfo: "4 outs",
        outsOdds: `~${odds}% to hit`,
      };
    }

    // No draws - fold
    return {
      action: "FOLD",
      confidence: "HIGH",
      reasoning: `High card only, no draws. Fold and wait for a better spot.`,
      handDescription: `High card: ${handEvaluation.description}`,
    };
  }

  // Fallback
  return {
    action: "CHECK",
    confidence: "LOW",
    reasoning: handEvaluation.description,
    handDescription: handEvaluation.description,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function doHoleCardsContribute(
  holeCards: [Card, Card],
  communityCards: Card[],
  handRank: number
): boolean {
  const holeRanks = holeCards.map((c) => c.rank);
  const communityRanks = communityCards.map((c) => c.rank);

  const holeCardMatchesCommunity = holeRanks.some((r) => communityRanks.includes(r));
  const holeCardsArePair = holeRanks[0] === holeRanks[1];

  // For flushes, check if hole cards contribute to the flush
  if (handRank === 6) { // Flush
    const holeSuits = holeCards.map((c) => c.suit);
    const suitCounts: Record<string, number> = {};
    for (const card of [...holeCards, ...communityCards]) {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }
    const flushSuit = Object.entries(suitCounts).find(([, count]) => count >= 5)?.[0];
    if (flushSuit) {
      return holeSuits.some((s) => s === flushSuit);
    }
  }

  if (handRank >= 2) {
    return holeCardMatchesCommunity || holeCardsArePair;
  }

  return true;
}

function getPairPosition(holeCards: [Card, Card], communityCards: Card[]): string {
  const RANK_VALUES: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    T: 10, J: 11, Q: 12, K: 13, A: 14,
  };

  const pairRank = getPairRank(holeCards, communityCards);
  if (!pairRank) return "Unknown";

  const boardRanks = communityCards.map((c) => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const pairValue = RANK_VALUES[pairRank];

  if (pairValue === boardRanks[0]) return "Top";
  if (pairValue === boardRanks[1]) return "Second";
  if (pairValue === boardRanks[boardRanks.length - 1]) return "Bottom";
  return "Middle";
}

function formatHoleCards(holeCards: [Card, Card]): string {
  const RANK_NAMES: Record<string, string> = {
    A: "A", K: "K", Q: "Q", J: "J", T: "10",
    "9": "9", "8": "8", "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2",
  };
  const suited = holeCards[0].suit === holeCards[1].suit;
  return `${RANK_NAMES[holeCards[0].rank]}-${RANK_NAMES[holeCards[1].rank]}${suited ? " suited" : ""}`;
}

/**
 * Build Claude prompt for strategic advice
 */
export function buildClaudePrompt(input: AnalysisInput, rulesRec: EnhancedRecommendation): string {
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
Hand: ${rulesRec.handDescription}
${rulesRec.boardWarning ? `Warning: ${rulesRec.boardWarning}` : ""}
${rulesRec.drawInfo ? `Draw: ${rulesRec.drawInfo}` : ""}
Suggested Action: ${rulesRec.action}

Focus on the "why" behind the action. Be encouraging but honest. No jargon.`;
}
