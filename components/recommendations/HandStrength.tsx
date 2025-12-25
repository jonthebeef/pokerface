"use client";

import { HandEvaluation } from "@/lib/poker/types";
import { getStrengthCategory } from "@/lib/poker/handEvaluator";

interface HandStrengthProps {
  evaluation: HandEvaluation | null;
}

export function HandStrength({ evaluation }: HandStrengthProps) {
  if (!evaluation) {
    return null;
  }

  const category = getStrengthCategory(evaluation);

  const categoryStyles = {
    weak: "bg-red-900/50 border-red-700 text-red-200",
    medium: "bg-yellow-900/50 border-yellow-700 text-yellow-200",
    strong: "bg-green-900/50 border-green-700 text-green-200",
    monster: "bg-purple-900/50 border-purple-700 text-purple-200",
  };

  const categoryLabels = {
    weak: "Weak",
    medium: "Decent",
    strong: "Strong",
    monster: "Monster!",
  };

  return (
    <div className={`rounded-lg border p-3 ${categoryStyles[category]}`}>
      <div className="flex justify-between items-center">
        <div>
          <div className="text-lg font-bold">{evaluation.description}</div>
          <div className="text-sm opacity-80">{evaluation.handName}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{evaluation.strength}</div>
          <div className="text-xs uppercase tracking-wide">
            {categoryLabels[category]}
          </div>
        </div>
      </div>

      {/* Strength bar */}
      <div className="mt-2 h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            category === "weak"
              ? "bg-red-500"
              : category === "medium"
                ? "bg-yellow-500"
                : category === "strong"
                  ? "bg-green-500"
                  : "bg-purple-500"
          }`}
          style={{ width: `${evaluation.strength}%` }}
        />
      </div>
    </div>
  );
}
