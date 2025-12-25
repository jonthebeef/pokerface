"use client";

import { Card } from "@/lib/poker/types";
import { CardDisplay, EmptyCardSlot } from "./CardDisplay";

interface HoleCardsProps {
  cards: [Card, Card] | null;
  onAddClick?: () => void;
  onRemove?: () => void;
}

export function HoleCards({ cards, onAddClick, onRemove }: HoleCardsProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-300">Your Cards</h3>
        {cards && onRemove && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-2 justify-center">
        {cards ? (
          <>
            <CardDisplay card={cards[0]} size="lg" />
            <CardDisplay card={cards[1]} size="lg" />
          </>
        ) : (
          <>
            <EmptyCardSlot label="?" size="lg" onClick={onAddClick} />
            <EmptyCardSlot label="?" size="lg" onClick={onAddClick} />
          </>
        )}
      </div>
    </div>
  );
}
