import React from 'react';
import { SEAT_TYPES } from '../../utils/constants';

export const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 bg-dark-card border border-dark-border px-6 py-3.5 rounded-2xl max-w-2xl mx-auto text-xs font-semibold text-zinc-400 select-none">
      {/* 1. Standard */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-zinc-700 border border-zinc-600 block" />
        <span>Standard Seat</span>
      </div>

      {/* 2. VIP */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-amber-600 border border-amber-400 block" />
        <span>VIP Accent (+20k)</span>
      </div>

      {/* 3. Couple */}
      <div className="flex items-center space-x-2">
        <span className="w-9 h-5 rounded bg-pink-600 border border-pink-400 block" />
        <span>Sweetbox Couple (+40k)</span>
      </div>

      {/* 4. Selected */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-brand block shadow-md" />
        <span>Selected</span>
      </div>

      {/* 5. Sold / Booked */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 opacity-40 block" />
        <span>Sold / Reserved</span>
      </div>
    </div>
  );
};

export default SeatLegend;