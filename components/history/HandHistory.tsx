"use client";

import { useState } from "react";
import {
  HandRecord,
  HandHistoryStats,
  formatCard,
  POSITION_LABELS,
} from "@/lib/poker/types";

interface HandHistoryProps {
  hands: HandRecord[];
  stats: HandHistoryStats;
  onClose: () => void;
  onDeleteHand: (id: string) => void;
  onClearHistory: () => void;
}

export function HandHistory({
  hands,
  stats,
  onClose,
  onDeleteHand,
  onClearHistory,
}: HandHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const outcomeColors = {
    won: "bg-green-600",
    lost: "bg-red-600",
    folded: "bg-gray-600",
    split: "bg-yellow-600",
  };

  const outcomeLabels = {
    won: "Won",
    lost: "Lost",
    folded: "Folded",
    split: "Split",
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Hand History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Stats Summary */}
        {stats.totalHands > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalHands}</div>
                <div className="text-xs text-gray-400">Hands</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
                <div className="text-xs text-gray-400">Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
                <div className="text-xs text-gray-400">Losses</div>
              </div>
            </div>

            {(stats.followedAdviceCount > 0 || stats.ignoredAdviceCount > 0) && (
              <div className="border-t border-gray-700 pt-4">
                <div className="text-sm text-gray-400 mb-2">Win Rate Comparison:</div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-900/30 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-400">
                      {stats.winRateWhenFollowed}%
                    </div>
                    <div className="text-xs text-gray-400">
                      When followed advice ({stats.followedAdviceCount})
                    </div>
                  </div>
                  <div className="bg-red-900/30 rounded-lg p-2">
                    <div className="text-lg font-bold text-red-400">
                      {stats.winRateWhenIgnored}%
                    </div>
                    <div className="text-xs text-gray-400">
                      When ignored advice ({stats.ignoredAdviceCount})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hand List */}
        {hands.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hands recorded yet. Play some hands to see your history!
          </div>
        ) : (
          <div className="space-y-2">
            {hands.map((hand) => (
              <div key={hand.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {/* Hand Summary Row */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === hand.id ? null : hand.id)
                  }
                  className="w-full p-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    {/* Hole cards */}
                    <div className="flex gap-1">
                      {hand.holeCards.map((card, i) => (
                        <span
                          key={i}
                          className={`text-sm font-mono ${
                            card.suit === "hearts" || card.suit === "diamonds"
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          {formatCard(card)}
                        </span>
                      ))}
                    </div>
                    {/* Position */}
                    <span className="text-xs text-gray-500">
                      {POSITION_LABELS[hand.position]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Followed advice indicator */}
                    {hand.stages.every((s) => s.followedAdvice) ? (
                      <span className="text-xs text-green-400">Followed</span>
                    ) : (
                      <span className="text-xs text-yellow-400">Deviated</span>
                    )}
                    {/* Outcome badge */}
                    <span
                      className={`${outcomeColors[hand.outcome]} px-2 py-1 rounded text-xs text-white`}
                    >
                      {outcomeLabels[hand.outcome]}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedId === hand.id && (
                  <div className="border-t border-gray-700 p-3 space-y-3">
                    <div className="text-xs text-gray-500">
                      {formatDate(hand.timestamp)}
                    </div>

                    {/* Stages */}
                    {hand.stages.map((stage, i) => (
                      <div key={i} className="bg-gray-700/50 rounded p-2 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-400 capitalize">
                            {stage.stage}
                          </span>
                          <span
                            className={
                              stage.followedAdvice
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {stage.followedAdvice ? "Followed" : "Ignored"}
                          </span>
                        </div>
                        <div className="text-gray-300">
                          App: <span className="font-medium">{stage.recommendation.action}</span>
                          {" → "}
                          You: <span className="font-medium">{stage.userAction}</span>
                        </div>
                        {stage.communityCards.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Board: {stage.communityCards.map(formatCard).join(" ")}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Notes */}
                    {hand.notes && (
                      <div className="bg-gray-700/50 rounded p-2">
                        <div className="text-xs text-gray-400 mb-1">Notes:</div>
                        <div className="text-sm text-gray-300">{hand.notes}</div>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteHand(hand.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete this hand
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Clear History */}
        {hands.length > 0 && (
          <div className="mt-6 text-center">
            {showClearConfirm ? (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-200 mb-3">
                  Delete all {hands.length} hands? This cannot be undone.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowClearConfirm(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm text-white"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Clear all history
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
