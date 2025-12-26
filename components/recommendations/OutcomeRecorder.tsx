"use client";

import { useState } from "react";
import { HandOutcome } from "@/lib/poker/types";

interface OutcomeRecorderProps {
  onRecordOutcome: (outcome: HandOutcome, notes?: string) => void;
}

export function OutcomeRecorder({ onRecordOutcome }: OutcomeRecorderProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<HandOutcome | null>(null);

  const handleOutcomeSelect = (outcome: HandOutcome) => {
    setSelectedOutcome(outcome);
    setShowNotes(true);
  };

  const handleSubmit = () => {
    if (selectedOutcome) {
      onRecordOutcome(selectedOutcome, notes.trim() || undefined);
    }
  };

  const handleSkipNotes = () => {
    if (selectedOutcome) {
      onRecordOutcome(selectedOutcome);
    }
  };

  if (showNotes && selectedOutcome) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-400">
          Add notes (optional)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Villain was aggressive, bad read on the flop..."
          className="w-full bg-gray-700 text-white rounded-lg p-3 text-sm resize-none h-20 placeholder-gray-500"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSkipNotes}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white p-3 rounded-lg font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white p-3 rounded-lg font-medium"
          >
            Save Hand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        How did the hand end?
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleOutcomeSelect("won")}
          className="bg-green-700 hover:bg-green-600 text-white p-3 rounded-lg font-medium"
        >
          I Won
        </button>
        <button
          onClick={() => handleOutcomeSelect("lost")}
          className="bg-red-700 hover:bg-red-600 text-white p-3 rounded-lg font-medium"
        >
          I Lost
        </button>
        <button
          onClick={() => handleOutcomeSelect("split")}
          className="bg-yellow-700 hover:bg-yellow-600 text-white p-3 rounded-lg font-medium"
        >
          Split Pot
        </button>
      </div>
    </div>
  );
}
