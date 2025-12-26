"use client";

interface HeaderProps {
  onReset: () => void;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      {/* Spacer for notch/status bar area - same background color */}
      <div className="h-[env(safe-area-inset-top)]" />
      {/* Actual header content */}
      <div className="flex justify-between items-center px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-white">Poker Coach</h1>
          <p className="text-xs text-gray-400">Texas Hold&apos;em Advisor</p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 hover:border-gray-500"
        >
          New Hand
        </button>
      </div>
    </header>
  );
}
