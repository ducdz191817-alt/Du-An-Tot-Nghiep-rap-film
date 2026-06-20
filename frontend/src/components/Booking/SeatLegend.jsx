import React from 'react';
import { SEAT_TYPES } from '../../utils/constants';

// CHỨC NĂNG: Thành phần hiển thị chú thích các ký hiệu/màu sắc ghế cho khách hàng dễ phân biệt
export const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 bg-dark-card border border-dark-border px-6 py-3.5 rounded-2xl max-w-2xl mx-auto text-xs font-semibold text-zinc-400 select-none">
      {/* 1. Ghế Thường */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-[#2a2a35]/60 border border-zinc-700/50 block" />
        <span>Ghế thường</span>
      </div>

      {/* 2. Ghế VIP */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-[#6366f1]/20 border border-[#6366f1]/30 block" />
        <span>Ghế VIP (+5k)</span>
      </div>

      {/* 3. Ghế Đôi (Sweetbox) */}
      <div className="flex items-center space-x-2">
        <span className="w-9 h-5 rounded bg-[#ec4899]/20 border border-[#ec4899]/30 block" />
        <span>Ghế Đôi Sweetbox (+20k)</span>
      </div>

      {/* 4. Ghế Đang Được Chọn */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-brand block shadow-md" />
        <span>Đang chọn</span>
      </div>

      {/* 5. Ghế Đã Có Người Đặt Trước */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 opacity-40 block" />
        <span>Đã bán / Đã đặt</span>
      </div>

      {/* 6. Ghế Bị Hỏng / Đang Bảo Trì */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-[#1f1f23]/40 border border-zinc-800/80 text-zinc-600/40 flex items-center justify-center text-[8px] font-black">
          X
        </span>
        <span>Ghế bảo trì (Khóa)</span>
      </div>

      {/* 7. Ghế Đang Được Người Khác Giữ (Realtime) */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-orange-500/20 border border-orange-500 block" />
        <span>Đang giữ (Realtime)</span>
      </div>
    </div>
  );
};

export default SeatLegend;