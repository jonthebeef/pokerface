// Card types
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  rank: Rank;
  suit: Suit;
}

// Game state types
export type GameStage = "preflop" | "flop" | "turn" | "river";

export interface GameState {
  stage: GameStage;
  holeCards: [Card, Card] | null;
  communityCards: Card[];
}

// Hand evaluation types
export interface HandEvaluation {
  handName: string; // "Pair", "Flush", "Full House", etc.
  handRank: number; // 1-10 (high card = 1, royal flush = 10)
  strength: number; // 0-100 normalized strength score
  description: string; // "Pair of Kings"
  bestCards: Card[]; // The 5 cards making up the best hand
}

// Recommendation types
export type Action = "FOLD" | "CHECK" | "CALL" | "RAISE" | "ALL_IN";

export interface Recommendation {
  action: Action;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
  claudeAdvice?: string;
}

// Odds types
export interface OddsResult {
  winProbability: number; // 0-100
  outs: number;
  oddsAgainst: string; // e.g., "3:1"
}

// Card detection types
export interface DetectionResult {
  cards: Card[];
  confidence: number;
  error?: string;
}

// Suit symbols for display
export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

// Rank display names
export const RANK_NAMES: Record<Rank, string> = {
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  T: "10",
  J: "J",
  Q: "Q",
  K: "K",
  A: "A",
};

// All cards in a deck
export const ALL_SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const ALL_RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

// Helper to create card key for lookups
export function cardKey(card: Card): string {
  return `${card.rank}${card.suit[0]}`;
}

// Helper to format card for display
export function formatCard(card: Card): string {
  return `${RANK_NAMES[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

// Helper to check if cards are equal
export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

// Convert to pokersolver format (e.g., "Ah" for Ace of hearts)
export function toPokersolverFormat(card: Card): string {
  const suitChar = card.suit[0]; // h, d, c, s
  return `${card.rank}${suitChar}`;
}
