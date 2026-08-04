import React from 'react';

// CHỨC NĂNG: Thành phần hiển thị chú thích các ký hiệu/màu sắc ghế (Tối ưu nhỏ gọn 1 hàng)
export const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 select-none">
      {/* Ghế Thường */}
      <div className="flex items-center space-x-1.5">
        <span className="w-3.5 h-3.5 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 block shrink-0" />
        <span>Thường</span>
      </div>

      {/* Ghế VIP */}
      <div className="flex items-center space-x-1.5">
        <span className="w-3.5 h-3.5 rounded bg-[#6366f1]/20 dark:bg-indigo-900/50 border border-[#6366f1]/30 dark:border-indigo-700 block shrink-0" />
        <span>VIP (+5k)</span>
      </div>

      {/* Ghế Đôi Sweetbox */}
      <div className="flex items-center space-x-1.5">
        <span className="w-6 h-3.5 rounded bg-[#ec4899]/20 dark:bg-pink-900/50 border border-[#ec4899]/30 dark:border-pink-700 block shrink-0" />
        <span>Đôi (+20k)</span>
      </div>

      <span className="w-px h-3 bg-gray-300 dark:bg-gray-700" />

      {/* Đang chọn */}
      <div className="flex items-center space-x-1.5">
        <span className="w-3.5 h-3.5 rounded bg-brand block shrink-0" />
        <span className="text-brand font-bold">Đang chọn</span>
      </div>

      {/* Đã bán */}
      <div className="flex items-center space-x-1.5">
        <span className="w-3.5 h-3.5 rounded bg-gray-300 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 opacity-80 block shrink-0" />
        <span>Đã bán</span>
      </div>

      {/* Ghế bảo trì */}
      <div className="flex items-center space-x-1.5">
        <span className="w-3.5 h-3.5 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-500 flex items-center justify-center text-[7px] font-black shrink-0">
          X
        </span>
        <span>Bảo trì</span>
      </div>

      {/* Đang giữ */}
      <div className="flex items-center space-x-1.5">
        <span className="w-3.5 h-3.5 rounded bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 block shrink-0" />
        <span>Đang giữ</span>
      </div>
    </div>
  );
};

export default SeatLegend;