import React from 'react';

// CHỨC NĂNG: Thành phần hiển thị chú thích các ký hiệu/màu sắc ghế
// Tách thành 2 nhóm: Loại ghế (trái) | Trạng thái (phải)
export const SeatLegend = () => {
  return (
    <div className="flex items-stretch bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl mx-auto text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none overflow-hidden">

      {/* ── NHÓM TRÁI: Loại ghế ── */}
      <div className="flex flex-col items-start gap-2.5 px-5 py-3.5 flex-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-0.5">
          Loại ghế
        </span>

        {/* Ghế Thường */}
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 block flex-shrink-0" />
          <span>Ghế thường</span>
        </div>

        {/* Ghế VIP */}
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded bg-[#6366f1]/20 dark:bg-indigo-900/50 border border-[#6366f1]/30 dark:border-indigo-700 block flex-shrink-0" />
          <span>Ghế VIP <span className="text-zinc-400 dark:text-zinc-500">(+5k)</span></span>
        </div>

        {/* Ghế Đôi Sweetbox */}
        <div className="flex items-center space-x-2">
          <span className="w-9 h-5 rounded bg-[#ec4899]/20 dark:bg-pink-900/50 border border-[#ec4899]/30 dark:border-pink-700 block flex-shrink-0" />
          <span>Ghế Đôi Sweetbox <span className="text-zinc-400 dark:text-zinc-500">(+20k)</span></span>
        </div>
      </div>

      {/* ── ĐƯỜNG KẺ DỌC ── */}
      <div className="w-px bg-gray-200 dark:bg-gray-800 self-stretch" />

      {/* ── NHÓM PHẢI: Trạng thái ghế ── */}
      <div className="flex flex-col items-start gap-2.5 px-5 py-3.5 flex-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-0.5">
          Trạng thái
        </span>

        {/* Đang chọn */}
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded bg-brand block shadow-md flex-shrink-0" />
          <span>Đang chọn</span>
        </div>

        {/* Đã bán / Đã đặt */}
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded bg-gray-300 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 opacity-80 block flex-shrink-0" />
          <span>Đã bán / Đã đặt</span>
        </div>

        {/* Ghế bảo trì (Khóa) */}
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-[8px] font-black flex-shrink-0">
            X
          </span>
          <span>Ghế bảo trì (Khóa)</span>
        </div>

        {/* Đang giữ (Realtime) */}
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 block flex-shrink-0" />
          <span>Đang giữ <span className="text-zinc-400 dark:text-zinc-500">(Realtime)</span></span>
        </div>
      </div>

    </div>
  );
};

export default SeatLegend;