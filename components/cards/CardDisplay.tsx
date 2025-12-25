"use client";

import { Card, SUIT_SYMBOLS, RANK_NAMES } from "@/lib/poker/types";

interface CardDisplayProps {
  card: Card;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  selected?: boolean;
}

export function CardDisplay({ card, size = "md", onClick, selected }: CardDisplayProps) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";

  const sizeClasses = {
    sm: "w-10 h-14 text-sm",
    md: "w-14 h-20 text-lg",
    lg: "w-20 h-28 text-2xl",
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        ${sizeClasses[size]}
        bg-white rounded-lg shadow-md border-2
        flex flex-col items-center justify-center
        font-bold
        ${isRed ? "text-red-600" : "text-gray-900"}
        ${selected ? "border-yellow-400 ring-2 ring-yellow-400" : "border-gray-300"}
        ${onClick ? "hover:border-blue-400 cursor-pointer active:scale-95" : ""}
        transition-all
      `}
    >
      <span>{RANK_NAMES[card.rank]}</span>
      <span className="text-xl">{SUIT_SYMBOLS[card.suit]}</span>
    </button>
  );
}

interface EmptyCardSlotProps {
  label: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function EmptyCardSlot({ label, size = "md", onClick }: EmptyCardSlotProps) {
  const sizeClasses = {
    sm: "w-10 h-14 text-xs",
    md: "w-14 h-20 text-sm",
    lg: "w-20 h-28 text-base",
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-500
        flex items-center justify-center
        text-gray-400
        ${onClick ? "hover:border-gray-300 hover:text-gray-300 cursor-pointer" : ""}
        transition-colors
      `}
    >
      {label}
    </button>
  );
}
