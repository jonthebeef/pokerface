"use client";

import { useState, useEffect, useCallback } from "react";
import { HandRecord, HandHistoryStats } from "@/lib/poker/types";

const STORAGE_KEY = "poker-coach-hand-history";
const MAX_HANDS = 50;

export function useHandHistory() {
  const [hands, setHands] = useState<HandRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HandRecord[];
        setHands(parsed);
      }
    } catch (error) {
      console.error("Failed to load hand history:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever hands change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hands));
      } catch (error) {
        console.error("Failed to save hand history:", error);
      }
    }
  }, [hands, isLoaded]);

  // Add a new hand record
  const addHand = useCallback((hand: HandRecord) => {
    setHands((prev) => {
      const updated = [hand, ...prev];
      // Keep only the most recent MAX_HANDS
      if (updated.length > MAX_HANDS) {
        return updated.slice(0, MAX_HANDS);
      }
      return updated;
    });
  }, []);

  // Update notes on an existing hand
  const updateNotes = useCallback((handId: string, notes: string) => {
    setHands((prev) =>
      prev.map((h) => (h.id === handId ? { ...h, notes } : h))
    );
  }, []);

  // Delete a hand
  const deleteHand = useCallback((handId: string) => {
    setHands((prev) => prev.filter((h) => h.id !== handId));
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHands([]);
  }, []);

  // Calculate stats from history
  const getStats = useCallback((): HandHistoryStats => {
    const totalHands = hands.length;
    const wins = hands.filter((h) => h.outcome === "won").length;
    const losses = hands.filter((h) => h.outcome === "lost").length;
    const folds = hands.filter((h) => h.outcome === "folded").length;

    // Count hands where user followed/ignored advice (based on final stage)
    let followedAdviceCount = 0;
    let ignoredAdviceCount = 0;
    let winsWhenFollowed = 0;
    let winsWhenIgnored = 0;

    for (const hand of hands) {
      if (hand.stages.length === 0) continue;

      // Check if they followed advice on all stages
      const allFollowed = hand.stages.every((s) => s.followedAdvice);
      const anyIgnored = hand.stages.some((s) => !s.followedAdvice);

      if (allFollowed) {
        followedAdviceCount++;
        if (hand.outcome === "won") winsWhenFollowed++;
      } else if (anyIgnored) {
        ignoredAdviceCount++;
        if (hand.outcome === "won") winsWhenIgnored++;
      }
    }

    const winRateWhenFollowed =
      followedAdviceCount > 0
        ? Math.round((winsWhenFollowed / followedAdviceCount) * 100)
        : 0;

    const winRateWhenIgnored =
      ignoredAdviceCount > 0
        ? Math.round((winsWhenIgnored / ignoredAdviceCount) * 100)
        : 0;

    return {
      totalHands,
      wins,
      losses,
      folds,
      followedAdviceCount,
      ignoredAdviceCount,
      winRateWhenFollowed,
      winRateWhenIgnored,
    };
  }, [hands]);

  return {
    hands,
    isLoaded,
    addHand,
    updateNotes,
    deleteHand,
    clearHistory,
    getStats,
  };
}

// Generate unique ID for a hand
export function generateHandId(): string {
  return `hand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
