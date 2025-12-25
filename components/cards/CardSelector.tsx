"use client";

import { useState } from "react";
import { Card, ALL_RANKS, ALL_SUITS, RANK_NAMES, SUIT_SYMBOLS, cardsEqual } from "@/lib/poker/types";
import { CardDisplay } from "./CardDisplay";

interface CardSelectorProps {
  onSelect: (cards: Card[]) => void;
  onCancel: () => void;
  maxCards: number;
  excludeCards?: Card[];
  title: string;
}

export function CardSelector({
  onSelect,
  onCancel,
  maxCards,
  excludeCards = [],
  title,
}: CardSelectorProps) {
  const [selected, setSelected] = useState<Card[]>([]);

  const toggleCard = (card: Card) => {
    const isSelected = selected.some((c) => cardsEqual(c, card));

    if (isSelected) {
      setSelected(selected.filter((c) => !cardsEqual(c, card)));
    } else if (selected.length < maxCards) {
      setSelected([...selected, card]);
    }
  };

  const isExcluded = (card: Card) => excludeCards.some((c) => cardsEqual(c, card));
  const isSelected = (card: Card) => selected.some((c) => cardsEqual(c, card));

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <span className="text-gray-400">
            {selected.length} / {maxCards}
          </span>
        </div>

        {/* Selected cards preview */}
        {selected.length > 0 && (
          <div className="flex gap-2 mb-4 p-2 bg-gray-800 rounded-lg">
            {selected.map((card, i) => (
              <CardDisplay
                key={i}
                card={card}
                size="sm"
                onClick={() => toggleCard(card)}
              />
            ))}
          </div>
        )}

        {/* Card grid by suit */}
        <div className="space-y-3">
          {ALL_SUITS.map((suit) => (
            <div key={suit} className="space-y-1">
              <div className={`text-sm font-medium ${
                suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-white"
              }`}>
                {SUIT_SYMBOLS[suit]} {suit.charAt(0).toUpperCase() + suit.slice(1)}
              </div>
              <div className="flex flex-wrap gap-1">
                {ALL_RANKS.map((rank) => {
                  const card: Card = { rank, suit };
                  const excluded = isExcluded(card);
                  const sel = isSelected(card);

                  return (
                    <button
                      key={`${rank}${suit}`}
                      onClick={() => !excluded && toggleCard(card)}
                      disabled={excluded}
                      className={`
                        w-8 h-10 rounded text-sm font-bold
                        flex items-center justify-center
                        transition-all
                        ${excluded
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : sel
                            ? "bg-yellow-500 text-black"
                            : "bg-white hover:bg-gray-200"
                        }
                        ${suit === "hearts" || suit === "diamonds"
                          ? excluded ? "" : "text-red-600"
                          : excluded ? "" : "text-gray-900"
                        }
                      `}
                    >
                      {RANK_NAMES[rank]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => selected.length > 0 && onSelect(selected)}
            disabled={selected.length === 0}
            className={`
              flex-1 py-2 px-4 rounded-lg font-bold
              ${selected.length > 0
                ? "bg-green-600 text-white hover:bg-green-500"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
