"use client";

import { Card, GameStage } from "@/lib/poker/types";
import { CardDisplay, EmptyCardSlot } from "./CardDisplay";

interface CommunityCardsProps {
  cards: Card[];
  stage: GameStage;
  onAddClick?: () => void;
  onRemove?: (card: Card) => void;
}

export function CommunityCards({ cards, stage, onAddClick, onRemove }: CommunityCardsProps) {
  // Determine how many slots to show based on stage
  const getSlotCount = () => {
    switch (stage) {
      case "preflop":
        return 0;
      case "flop":
        return 3;
      case "turn":
        return 4;
      case "river":
        return 5;
      default:
        return Math.max(cards.length, 3);
    }
  };

  const slotCount = getSlotCount();

  if (stage === "preflop" && cards.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-4">
        Community cards will appear after the flop
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-300">Community Cards</h3>
        {cards.length > 0 && onRemove && (
          <button
            onClick={() => cards.length > 0 && onRemove(cards[cards.length - 1])}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove Last
          </button>
        )}
      </div>
      <div className="flex gap-1 justify-center flex-wrap">
        {Array.from({ length: slotCount }).map((_, i) => {
          const card = cards[i];
          if (card) {
            return (
              <CardDisplay
                key={i}
                card={card}
                size="md"
                onClick={onRemove ? () => onRemove(card) : undefined}
              />
            );
          }
          return (
            <EmptyCardSlot
              key={i}
              label={i < 3 ? "Flop" : i === 3 ? "Turn" : "River"}
              size="md"
              onClick={onAddClick}
            />
          );
        })}
      </div>
    </div>
  );
}
