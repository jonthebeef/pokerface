"use client";

import { useState, useCallback } from "react";
import {
  Card,
  GameStage,
  GameState,
  HandEvaluation,
  Recommendation,
  cardsEqual,
} from "@/lib/poker/types";
import { evaluateHand } from "@/lib/poker/handEvaluator";

interface UseGameStateResult {
  gameState: GameState;
  handEvaluation: HandEvaluation | null;
  recommendation: Recommendation | null;
  isAnalyzing: boolean;

  // Actions
  setHoleCards: (cards: [Card, Card]) => void;
  addCommunityCards: (cards: Card[]) => void;
  setStage: (stage: GameStage) => void;
  removeCard: (card: Card, from: "hole" | "community") => void;
  reset: () => void;
  analyze: () => Promise<void>;
}

const initialState: GameState = {
  stage: "preflop",
  holeCards: null,
  communityCards: [],
};

export function useGameState(): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [handEvaluation, setHandEvaluation] = useState<HandEvaluation | null>(
    null
  );
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setHoleCards = useCallback((cards: [Card, Card]) => {
    setGameState((prev) => ({ ...prev, holeCards: cards }));
    setHandEvaluation(null);
    setRecommendation(null);
  }, []);

  const addCommunityCards = useCallback((cards: Card[]) => {
    setGameState((prev) => {
      // Filter out duplicates
      const newCards = cards.filter(
        (card) =>
          !prev.communityCards.some((existing) => cardsEqual(existing, card))
      );
      const updated = [...prev.communityCards, ...newCards].slice(0, 5); // Max 5 community cards

      // Auto-advance stage based on community card count
      let stage: GameStage = prev.stage;
      if (updated.length >= 5) stage = "river";
      else if (updated.length >= 4) stage = "turn";
      else if (updated.length >= 3) stage = "flop";

      return { ...prev, communityCards: updated, stage };
    });
    setHandEvaluation(null);
    setRecommendation(null);
  }, []);

  const setStage = useCallback((stage: GameStage) => {
    setGameState((prev) => ({ ...prev, stage }));
  }, []);

  const removeCard = useCallback(
    (card: Card, from: "hole" | "community") => {
      if (from === "hole" && gameState.holeCards) {
        // Remove from hole cards - if it matches either, clear both
        if (
          cardsEqual(card, gameState.holeCards[0]) ||
          cardsEqual(card, gameState.holeCards[1])
        ) {
          setGameState((prev) => ({ ...prev, holeCards: null }));
        }
      } else if (from === "community") {
        setGameState((prev) => ({
          ...prev,
          communityCards: prev.communityCards.filter(
            (c) => !cardsEqual(c, card)
          ),
        }));
      }
      setHandEvaluation(null);
      setRecommendation(null);
    },
    [gameState.holeCards]
  );

  const reset = useCallback(() => {
    setGameState(initialState);
    setHandEvaluation(null);
    setRecommendation(null);
  }, []);

  const analyze = useCallback(async () => {
    if (!gameState.holeCards) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Evaluate hand locally
      const evaluation = evaluateHand(
        gameState.holeCards,
        gameState.communityCards
      );
      setHandEvaluation(evaluation);

      // Get recommendation from API (includes Claude advice)
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holeCards: gameState.holeCards,
          communityCards: gameState.communityCards,
          stage: gameState.stage,
          handEvaluation: evaluation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendation(data.recommendation);
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState]);

  return {
    gameState,
    handEvaluation,
    recommendation,
    isAnalyzing,
    setHoleCards,
    addCommunityCards,
    setStage,
    removeCard,
    reset,
    analyze,
  };
}
