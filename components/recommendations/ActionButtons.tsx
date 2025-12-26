"use client";

import { UserAction, GameStage } from "@/lib/poker/types";

interface ActionButtonsProps {
  stage: GameStage;
  onAction: (action: UserAction) => void;
  recommendedAction?: string;
}

export function ActionButtons({ stage, onAction, recommendedAction }: ActionButtonsProps) {
  const actions: { action: UserAction; label: string; color: string }[] = [
    { action: "FOLD", label: "I Folded", color: "bg-red-700 hover:bg-red-600" },
    { action: "CHECK", label: "I Checked", color: "bg-gray-600 hover:bg-gray-500" },
    { action: "CALL", label: "I Called", color: "bg-yellow-700 hover:bg-yellow-600" },
    { action: "RAISE", label: "I Raised", color: "bg-green-700 hover:bg-green-600" },
  ];

  // Map recommended action to match for highlighting
  const normalizedRec = recommendedAction === "ALL_IN" ? "RAISE" : recommendedAction;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        What did you do?
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ action, label, color }) => {
          const isRecommended = normalizedRec === action;
          return (
            <button
              key={action}
              onClick={() => onAction(action)}
              className={`
                ${color}
                p-3 rounded-lg text-white font-medium transition-all
                ${isRecommended ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800" : ""}
              `}
            >
              {label}
              {isRecommended && (
                <span className="block text-xs opacity-75 mt-1">Recommended</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
