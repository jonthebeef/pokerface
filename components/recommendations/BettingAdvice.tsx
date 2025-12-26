"use client";

import { Recommendation } from "@/lib/poker/types";

interface BettingAdviceProps {
  recommendation: Recommendation | null;
  isLoading?: boolean;
}

export function BettingAdvice({ recommendation, isLoading }: BettingAdviceProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-gray-800 p-4 animate-pulse">
        <div className="h-12 bg-gray-700 rounded mb-2" />
        <div className="h-4 bg-gray-700 rounded w-3/4" />
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const actionStyles = {
    FOLD: "bg-red-600 hover:bg-red-500",
    CHECK: "bg-gray-600 hover:bg-gray-500",
    CALL: "bg-yellow-600 hover:bg-yellow-500",
    RAISE: "bg-green-600 hover:bg-green-500",
    ALL_IN: "bg-purple-600 hover:bg-purple-500",
  };

  const actionLabels = {
    FOLD: "FOLD",
    CHECK: "CHECK",
    CALL: "CALL",
    RAISE: "RAISE",
    ALL_IN: "ALL IN!",
  };

  const confidenceStyles = {
    HIGH: "text-green-400",
    MEDIUM: "text-yellow-400",
    LOW: "text-red-400",
  };

  return (
    <div className="space-y-3">
      {/* Main action button */}
      <div
        className={`
          ${actionStyles[recommendation.action]}
          rounded-xl p-4 text-center text-white
          transition-colors
        `}
      >
        <div className="text-3xl font-black tracking-wider">
          {actionLabels[recommendation.action]}
        </div>
        <div className={`text-sm mt-1 ${confidenceStyles[recommendation.confidence]}`}>
          {recommendation.confidence} confidence
        </div>
      </div>

      {/* Hand description */}
      {recommendation.handDescription && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-base font-semibold text-white">
            {recommendation.handDescription}
          </div>
        </div>
      )}

      {/* Board warning (danger indicator) */}
      {recommendation.boardWarning && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-3">
          <div className="text-sm text-red-300 font-medium">
            ⚠️ {recommendation.boardWarning}
          </div>
        </div>
      )}

      {/* Draw info with odds */}
      {recommendation.drawInfo && (
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3 flex justify-between items-center">
          <div className="text-sm text-blue-200">
            🎯 {recommendation.drawInfo}
          </div>
          {recommendation.outsOdds && (
            <div className="text-sm text-blue-400 font-medium">
              {recommendation.outsOdds}
            </div>
          )}
        </div>
      )}

      {/* Reasoning */}
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-sm text-gray-300">{recommendation.reasoning}</div>
      </div>

      {/* Claude's advice (if available) */}
      {recommendation.claudeAdvice && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
          <div className="text-xs text-purple-400 font-medium mb-1">Coach Says:</div>
          <div className="text-sm text-purple-200">{recommendation.claudeAdvice}</div>
        </div>
      )}
    </div>
  );
}
