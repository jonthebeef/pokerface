"use client";

import { useState, useEffect } from "react";
import { Card } from "@/lib/poker/types";
import { useGameState } from "@/hooks/useGameState";
import { Header } from "@/components/layout/Header";
import { GameStageSelector } from "@/components/layout/GameStageSelector";
import { HoleCards } from "@/components/cards/HoleCards";
import { CommunityCards } from "@/components/cards/CommunityCards";
import { CardSelector } from "@/components/cards/CardSelector";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { HandStrength } from "@/components/recommendations/HandStrength";
import { BettingAdvice } from "@/components/recommendations/BettingAdvice";

type SelectorMode = "hole" | "community" | null;

export default function Home() {
  const {
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
  } = useGameState();

  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Auto-analyze when cards change
  useEffect(() => {
    if (gameState.holeCards) {
      analyze();
    }
  }, [gameState.holeCards, gameState.communityCards, analyze]);

  // Get all currently used cards (for exclusion in selector)
  const usedCards: Card[] = [
    ...(gameState.holeCards || []),
    ...gameState.communityCards,
  ];

  const handleCardsSelected = (cards: Card[]) => {
    if (selectorMode === "hole" && cards.length >= 2) {
      setHoleCards([cards[0], cards[1]]);
    } else if (selectorMode === "community") {
      addCommunityCards(cards);
    }
    setSelectorMode(null);
  };

  const handleCameraDetected = (cards: Card[]) => {
    if (cards.length >= 2 && !gameState.holeCards) {
      // First detection: set as hole cards
      setHoleCards([cards[0], cards[1]]);
      if (cards.length > 2) {
        addCommunityCards(cards.slice(2));
      }
    } else if (gameState.holeCards) {
      // Already have hole cards: add to community
      addCommunityCards(cards);
    }
    setShowCamera(false);
  };

  return (
    <main className="min-h-screen bg-poker-felt flex flex-col">
      <Header onReset={reset} />

      <div className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Game Stage */}
        <GameStageSelector
          currentStage={gameState.stage}
          onStageChange={setStage}
          communityCardCount={gameState.communityCards.length}
        />

        {/* Cards Section */}
        <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
          <HoleCards
            cards={gameState.holeCards}
            onAddClick={() => setSelectorMode("hole")}
            onRemove={() => {
              if (gameState.holeCards) {
                removeCard(gameState.holeCards[0], "hole");
              }
            }}
          />

          <div className="border-t border-gray-700" />

          <CommunityCards
            cards={gameState.communityCards}
            stage={gameState.stage}
            onAddClick={() => setSelectorMode("community")}
            onRemove={(card) => removeCard(card, "community")}
          />
        </div>

        {/* Input Methods */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCamera(true)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-500 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan Cards
          </button>
          <button
            onClick={() => setSelectorMode(gameState.holeCards ? "community" : "hole")}
            className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600"
          >
            Select Manually
          </button>
        </div>

        {/* Results Section */}
        {gameState.holeCards && (
          <div className="space-y-3">
            <HandStrength evaluation={handEvaluation} />
            <BettingAdvice recommendation={recommendation} isLoading={isAnalyzing} />
          </div>
        )}

        {/* Empty state */}
        {!gameState.holeCards && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🃏</div>
            <div>Scan or select your cards to get started</div>
          </div>
        )}
      </div>

      {/* Card Selector Modal */}
      {selectorMode && (
        <CardSelector
          title={selectorMode === "hole" ? "Select Your 2 Cards" : "Select Community Cards"}
          maxCards={selectorMode === "hole" ? 2 : 5 - gameState.communityCards.length}
          excludeCards={usedCards}
          onSelect={handleCardsSelected}
          onCancel={() => setSelectorMode(null)}
        />
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCardsDetected={handleCameraDetected}
          onClose={() => setShowCamera(false)}
        />
      )}
    </main>
  );
}
