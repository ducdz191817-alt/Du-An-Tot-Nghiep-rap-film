import React from 'react';
import { SEAT_TYPES } from '../../utils/constants';

export const SeatMap = ({ seats = [], bookedSeats = [], selectedSeats = [], onSeatClick }) => {
  // Nhóm ghế theo hàng (chữ cái)
  const groupedSeats = seats.reduce((acc, seat) => {
    const row = seat.row;
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {});

  return (
    <div className="space-y-12 overflow-x-auto py-6">
      {/* 1. Chỉ báo màn hình cong */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
        <div className="h-2 w-full bg-brand rounded-full shadow-[0_0_20px_rgba(229,9,20,0.8)]" />
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em] mt-3">
          Màn hình chiếu phim
        </span>
      </div>

      {/* 2. Bố cục lưới ghế */}
      <div className="min-w-[600px] flex flex-col items-center justify-center space-y-3">
        {Object.keys(groupedSeats).map((rowLetter) => {
          // Sắp xếp ghế trong hàng theo số thứ tự tăng dần
          const rowSeats = [...groupedSeats[rowLetter]].sort((a, b) => a.number - b.number);

          return (
            <div key={rowLetter} className="flex items-center space-x-3">
              {/* Nhãn hàng (trái) */}
              <span className="w-6 text-zinc-500 font-black text-sm text-center select-none uppercase">
                {rowLetter}
              </span>

              {/* Các ghế trong hàng */}
              <div className="flex items-center gap-2">
                {rowSeats.map((seat) => {
                  const seatCode = `${seat.row}${seat.number}`;
                  const isBooked = bookedSeats.includes(seatCode);
                  const isSelected = selectedSeats.includes(seatCode);

                  const seatStyle = SEAT_TYPES[seat.type] || SEAT_TYPES.standard;
                  
                  let activeBg = seatStyle.color;
                  if (isBooked) {
                    activeBg = seatStyle.bookedColor;
                  } else if (isSelected) {
                    activeBg = seatStyle.selectedColor;
                  }

                  // Chiều rộng hiển thị của ghế đôi (gấp đôi ghế thường)
                  const isCouple = seat.type === 'couple';

                  return (
                    <button
                      key={seat._id}
                      disabled={isBooked}
                      onClick={() => onSeatClick(seatCode)}
                      className={`h-8 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center transform active:scale-90 ${
                        isCouple ? 'w-[72px]' : 'w-8'
                      } ${activeBg}`}
                      title={`${seatCode} - ${seat.type.toUpperCase()}`}
                    >
                      {isCouple ? `${seatCode} Đôi` : seatCode}
                    </button>
                  );
                })}
              </div>

              {/* Nhãn hàng (phải) */}
              <span className="w-6 text-zinc-500 font-black text-sm text-center select-none uppercase">
                {rowLetter}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeatMap;