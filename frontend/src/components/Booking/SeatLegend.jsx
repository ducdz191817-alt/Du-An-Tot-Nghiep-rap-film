import React from 'react';
import { SEAT_TYPES } from '../../utils/constants';

// CHỨC NĂNG: Thành phần hiển thị chú thích các ký hiệu/màu sắc ghế cho khách hàng dễ phân biệt
export const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 px-6 py-3.5 rounded-2xl max-w-2xl mx-auto text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none">
      {/* 1. Ghế Thường */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 block" />
        <span>Ghế thường</span>
      </div>

      {/* 2. Ghế VIP */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-[#6366f1]/20 dark:bg-indigo-900/50 border border-[#6366f1]/30 dark:border-indigo-700 block" />
        <span>Ghế VIP (+5k)</span>
      </div>

      {/* 3. Ghế Đôi (Sweetbox) */}
      <div className="flex items-center space-x-2">
        <span className="w-9 h-5 rounded bg-[#ec4899]/20 dark:bg-pink-900/50 border border-[#ec4899]/30 dark:border-pink-700 block" />
        <span>Ghế Đôi Sweetbox (+20k)</span>
      </div>

      {/* 4. Ghế Đang Được Chọn */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-brand block shadow-md" />
        <span>Đang chọn</span>
      </div>

      {/* 5. Ghế Đã Có Người Đặt Trước */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-gray-300 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 opacity-80 block" />
        <span>Đã bán / Đã đặt</span>
      </div>

      {/* 6. Ghế Bị Hỏng / Đang Bảo Trì */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-[8px] font-black">
          X
        </span>
        <span>Ghế bảo trì (Khóa)</span>
      </div>

      {/* 7. Ghế Đang Được Người Khác Giữ (Realtime) */}
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 block" />
        <span>Đang giữ (Realtime)</span>
      </div>
    </div>
  );
};

export default SeatLegend;