"use client";

import { Position, POSITION_LABELS, POSITION_DESCRIPTIONS } from "@/lib/poker/types";

interface PositionSelectorProps {
  selectedPosition: Position | null;
  onSelect: (position: Position) => void;
}

const POSITIONS: Position[] = ["early", "middle", "late", "blinds"];

export function PositionSelector({ selectedPosition, onSelect }: PositionSelectorProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        Where are you sitting?
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {POSITIONS.map((position) => (
          <button
            key={position}
            onClick={() => onSelect(position)}
            className={`
              p-3 rounded-lg text-left transition-all
              ${
                selectedPosition === position
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }
            `}
          >
            <div className="font-semibold">{POSITION_LABELS[position]}</div>
            <div className="text-xs opacity-75">{POSITION_DESCRIPTIONS[position]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
