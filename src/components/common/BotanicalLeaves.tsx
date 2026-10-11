import React from 'react';

interface BotanicalLeavesProps {
  leaf1Url?: string;
  leaf2Url?: string;
}

export const BotanicalLeaves: React.FC<BotanicalLeavesProps> = ({ leaf1Url, leaf2Url }) => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-40">
      {leaf1Url ? (
        <img
          src={leaf1Url}
          alt=""
          className="absolute top-10 left-8 w-16 h-16 animate-sway object-contain"
        />
      ) : (
        <div className="absolute top-12 left-10 text-[#7eac7f] animate-sway">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
        </div>
      )}

      {leaf2Url ? (
        <img
          src={leaf2Url}
          alt=""
          className="absolute top-32 right-12 w-20 h-20 animate-float-leaf object-contain"
        />
      ) : (
        <div className="absolute top-28 right-16 text-[#a7c8a7] animate-float-leaf">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
      )}

      <div className="absolute bottom-16 left-1/4 text-[#cbdfcb]/60 animate-sway">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.05 8.05a7 7 0 0 0 9.9 9.9l4.95 1.41-1.41-4.95a7 7 0 0 0-9.9-9.9l-3.54 3.54z" />
        </svg>
      </div>
    </div>
  );
};
