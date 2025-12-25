"use client";

import { GameStage } from "@/lib/poker/types";

interface GameStageSelectorProps {
  currentStage: GameStage;
  onStageChange: (stage: GameStage) => void;
  communityCardCount: number;
}

const STAGES: { value: GameStage; label: string; minCards: number }[] = [
  { value: "preflop", label: "Pre-Flop", minCards: 0 },
  { value: "flop", label: "Flop", minCards: 3 },
  { value: "turn", label: "Turn", minCards: 4 },
  { value: "river", label: "River", minCards: 5 },
];

export function GameStageSelector({
  currentStage,
  onStageChange,
  communityCardCount,
}: GameStageSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
      {STAGES.map((stage) => {
        const isActive = currentStage === stage.value;
        const isEnabled = communityCardCount >= stage.minCards || stage.value === "preflop";

        return (
          <button
            key={stage.value}
            onClick={() => isEnabled && onStageChange(stage.value)}
            disabled={!isEnabled}
            className={`
              flex-1 py-2 px-2 rounded text-sm font-medium transition-colors
              ${isActive
                ? "bg-green-600 text-white"
                : isEnabled
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 cursor-not-allowed"
              }
            `}
          >
            {stage.label}
          </button>
        );
      })}
    </div>
  );
}
