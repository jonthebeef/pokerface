"use client";

import { useState, useEffect } from "react";
import {
  Card,
  UserAction,
  HandOutcome,
  StageRecord,
  HandRecord,
  GameStage,
} from "@/lib/poker/types";
import { useGameState } from "@/hooks/useGameState";
import { useHandHistory, generateHandId } from "@/hooks/useHandHistory";
import { Header } from "@/components/layout/Header";
import { PositionSelector } from "@/components/layout/PositionSelector";
import { HoleCards } from "@/components/cards/HoleCards";
import { CommunityCards } from "@/components/cards/CommunityCards";
import { CardSelector } from "@/components/cards/CardSelector";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { HandStrength } from "@/components/recommendations/HandStrength";
import { BettingAdvice } from "@/components/recommendations/BettingAdvice";
import { ActionButtons } from "@/components/recommendations/ActionButtons";
import { OutcomeRecorder } from "@/components/recommendations/OutcomeRecorder";
import { HandHistory } from "@/components/history/HandHistory";

type SelectorMode = "hole" | "community" | null;

// Flow states
type FlowState =
  | "select_position"
  | "add_hole_cards"
  | "show_recommendation"
  | "add_community"
  | "show_outcome"
  | "hand_complete";

export default function Home() {
  const {
    gameState,
    position,
    handEvaluation,
    recommendation,
    isAnalyzing,
    setPosition,
    setHoleCards,
    addCommunityCards,
    removeCard,
    reset,
    analyze,
  } = useGameState();

  const { hands, addHand, deleteHand, clearHistory, getStats, isLoaded } =
    useHandHistory();

  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [stageRecords, setStageRecords] = useState<StageRecord[]>([]);
  const [awaitingAction, setAwaitingAction] = useState(false);
  const [handId] = useState(() => generateHandId());

  // Determine current flow state
  const getFlowState = (): FlowState => {
    if (!position) return "select_position";
    if (!gameState.holeCards) return "add_hole_cards";

    // Check if we're awaiting user action
    if (awaitingAction && recommendation) return "show_recommendation";

    // Check stage progression
    const currentStage = gameState.stage;
    const hasRecordForStage = stageRecords.some((r) => r.stage === currentStage);

    // If we have a record for the current stage, move to next
    if (hasRecordForStage) {
      if (currentStage === "river") return "show_outcome";
      // Need to add more community cards
      if (currentStage === "preflop" && gameState.communityCards.length < 3) return "add_community";
      if (currentStage === "flop" && gameState.communityCards.length < 4) return "add_community";
      if (currentStage === "turn" && gameState.communityCards.length < 5) return "add_community";
    }

    // Show recommendation if we have one
    if (recommendation && !hasRecordForStage) {
      return "show_recommendation";
    }

    return "add_community";
  };

  const flowState = getFlowState();

  // Auto-analyze when cards change
  useEffect(() => {
    if (gameState.holeCards && position) {
      analyze();
      setAwaitingAction(true);
    }
  }, [gameState.holeCards, gameState.communityCards, position, analyze]);

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
      setHoleCards([cards[0], cards[1]]);
      if (cards.length > 2) {
        addCommunityCards(cards.slice(2));
      }
    } else if (gameState.holeCards) {
      addCommunityCards(cards);
    }
    setShowCamera(false);
  };

  const handleUserAction = (action: UserAction) => {
    if (!recommendation) return;

    // Determine if they followed advice
    const recAction = recommendation.action === "ALL_IN" ? "RAISE" : recommendation.action;
    const followedAdvice = action === recAction ||
      (action === "CHECK" && recAction === "CHECK") ||
      (action === "CALL" && recAction === "CALL");

    // Record this stage
    const stageRecord: StageRecord = {
      stage: gameState.stage,
      communityCards: [...gameState.communityCards],
      recommendation: recommendation,
      userAction: action,
      followedAdvice,
    };

    setStageRecords((prev) => [...prev, stageRecord]);
    setAwaitingAction(false);

    // If they folded, go straight to outcome
    if (action === "FOLD") {
      // Create hand record with folded outcome
      if (gameState.holeCards && position) {
        const handRecord: HandRecord = {
          id: handId,
          timestamp: Date.now(),
          position,
          holeCards: gameState.holeCards,
          stages: [...stageRecords, stageRecord],
          outcome: "folded",
        };
        addHand(handRecord);
      }
      // Reset for new hand
      handleNewHand();
    }
  };

  const handleRecordOutcome = (outcome: HandOutcome, notes?: string) => {
    if (!gameState.holeCards || !position) return;

    const handRecord: HandRecord = {
      id: handId,
      timestamp: Date.now(),
      position,
      holeCards: gameState.holeCards,
      stages: stageRecords,
      outcome,
      notes,
    };

    addHand(handRecord);
    handleNewHand();
  };

  const handleNewHand = () => {
    reset();
    setStageRecords([]);
    setAwaitingAction(false);
  };

  const getStagePrompt = (): string => {
    const cc = gameState.communityCards.length;
    if (cc === 0) return "Add the Flop (3 cards):";
    if (cc === 3) return "Add the Turn (4th card):";
    if (cc === 4) return "Add the River (5th card):";
    return "";
  };

  return (
    <main className="min-h-screen bg-poker-felt flex flex-col">
      <Header onReset={handleNewHand} />

      {/* History Button */}
      <div className="px-4 pt-2">
        <button
          onClick={() => setShowHistory(true)}
          className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History ({hands.length})
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Flow State: Select Position */}
        {flowState === "select_position" && (
          <PositionSelector
            selectedPosition={position}
            onSelect={setPosition}
          />
        )}

        {/* Show cards once we have position */}
        {position && (
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

            {gameState.holeCards && (
              <>
                <div className="border-t border-gray-700" />
                <CommunityCards
                  cards={gameState.communityCards}
                  stage={gameState.stage}
                  onAddClick={() => setSelectorMode("community")}
                  onRemove={(card) => removeCard(card, "community")}
                />
              </>
            )}
          </div>
        )}

        {/* Flow State: Add Hole Cards */}
        {flowState === "add_hole_cards" && (
          <div className="space-y-2">
            <div className="text-center text-gray-300 text-sm">
              Add your 2 private cards:
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCamera(true)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan
              </button>
              <button
                onClick={() => setSelectorMode("hole")}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold"
              >
                Select Manually
              </button>
            </div>
          </div>
        )}

        {/* Flow State: Show Recommendation */}
        {flowState === "show_recommendation" && gameState.holeCards && (
          <div className="space-y-3">
            <HandStrength evaluation={handEvaluation} />
            <BettingAdvice recommendation={recommendation} isLoading={isAnalyzing} />
            {recommendation && !isAnalyzing && (
              <ActionButtons
                stage={gameState.stage}
                onAction={handleUserAction}
                recommendedAction={recommendation.action}
              />
            )}
          </div>
        )}

        {/* Flow State: Add Community Cards */}
        {flowState === "add_community" && (
          <div className="space-y-2">
            <div className="text-center text-gray-300 text-sm">
              {getStagePrompt()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCamera(true)}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan Table
              </button>
              <button
                onClick={() => setSelectorMode("community")}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold"
              >
                Add Manually
              </button>
            </div>
          </div>
        )}

        {/* Flow State: Record Outcome */}
        {flowState === "show_outcome" && (
          <OutcomeRecorder onRecordOutcome={handleRecordOutcome} />
        )}
      </div>

      {/* Card Selector Modal */}
      {selectorMode && (
        <CardSelector
          title={selectorMode === "hole" ? "Select Your 2 Cards" : "Select Community Cards"}
          maxCards={selectorMode === "hole" ? 2 :
            gameState.communityCards.length === 0 ? 3 :
            gameState.communityCards.length === 3 ? 1 :
            gameState.communityCards.length === 4 ? 1 : 1}
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

      {/* History Modal */}
      {showHistory && isLoaded && (
        <HandHistory
          hands={hands}
          stats={getStats()}
          onClose={() => setShowHistory(false)}
          onDeleteHand={deleteHand}
          onClearHistory={clearHistory}
        />
      )}
    </main>
  );
}
