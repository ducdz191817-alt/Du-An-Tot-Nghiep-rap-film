import React from 'react';
import { SEAT_TYPES } from '../../utils/constants';

export const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 bg-transparent px-6 py-2 max-w-3xl mx-auto text-xs font-semibold text-zinc-400 select-none">
      {/* 1. Trống */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-[#2a2a35]/60 border border-zinc-700/50 block" />
        <span>Trống</span>
      </div>

      {/* 2. Đã bán */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-[#b91c1c]/20 border border-red-800/40 block" />
        <span>Đã bán</span>
      </div>

      {/* 3. Đang chọn */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-brand border border-brand/50 block shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
        <span>Đang chọn</span>
      </div>

      {/* 4. Ghế VIP */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-[#6366f1]/20 border border-[#6366f1]/30 block" />
        <span>Ghế VIP</span>
      </div>

      {/* 5. Sweetbox */}
      <div className="flex items-center space-x-2">
        <span className="w-9 h-5 rounded bg-[#ec4899]/20 border border-[#ec4899]/30 block" />
        <span>Sweetbox</span>
      </div>
    </div>
  );
};

export default SeatLegend;
