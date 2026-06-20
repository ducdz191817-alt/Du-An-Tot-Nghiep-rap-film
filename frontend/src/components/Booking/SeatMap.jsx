import React, { useState } from 'react';
import { SEAT_TYPES } from '../../utils/constants';

export const SeatMap = ({ seats = [], bookedSeats = [], selectedSeats = [], heldSeatsByOthers = [], ticketQuantity = 2, onSeatClick }) => {
  const [hoveredSeat, setHoveredSeat] = useState(null);
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

          const normalizedBookedSeats = new Set(
            (bookedSeats || []).map((seatCodeItem) => String(seatCodeItem).trim().toUpperCase())
          );

          // Tiền xử lý trạng thái của từng ghế trong hàng
          const rowSeatStates = rowSeats.map((seat) => {
            const seatCode = `${seat.row}${seat.number}`;
            const normalized = String(seatCode).trim().toUpperCase();
            const isBooked = normalizedBookedSeats.has(normalized);
            const isHeld = heldSeatsByOthers.includes(normalized);
            const isDisabled = seat.isDisabled === true;
            const isAvailable = !isBooked && !isHeld && !isDisabled;
            return { ...seat, seatCode: normalized, isBooked, isHeld, isDisabled, isAvailable };
          });

          // Xác định cụm ghế đang hover và kiểm tra tính hợp lệ
          const hoveredIndex = rowSeatStates.findIndex(s => s.seatCode === hoveredSeat);
          let hoverBlock = [];
          let isHoverValid = false;

          if (hoveredIndex !== -1) {
            hoverBlock = rowSeatStates.slice(hoveredIndex, hoveredIndex + ticketQuantity);
            
            if (hoverBlock.length === ticketQuantity) {
              const allAvailable = hoverBlock.every(s => s.isAvailable);
              // Chặn bắc cầu qua lối đi (giữa ghế 6 và 7). 
              // NHƯNG nếu mua > 6 vé (ví dụ 8 vé) thì bắt buộc phải cho phép qua lối đi vì một bên chỉ có tối đa 6 ghế.
              const isCrossingAisle = ticketQuantity <= 6 && hoverBlock.some(s => s.number <= 6) && hoverBlock.some(s => s.number >= 7);

              if (allAvailable && !isCrossingAisle) {
                isHoverValid = true;

                // Kiểm tra luật chống ghế so le (Orphan rule) bên trái
                const left1 = rowSeatStates[hoveredIndex - 1];
                if (left1?.isAvailable) {
                  const left2 = rowSeatStates[hoveredIndex - 2];
                  if (!left2 || !left2.isAvailable) isHoverValid = false; // Bỏ lại đúng 1 ghế trống
                }

                // Kiểm tra luật chống ghế so le (Orphan rule) bên phải
                const right1 = rowSeatStates[hoveredIndex + ticketQuantity];
                if (right1?.isAvailable) {
                  const right2 = rowSeatStates[hoveredIndex + ticketQuantity + 1];
                  if (!right2 || !right2.isAvailable) isHoverValid = false; // Bỏ lại đúng 1 ghế trống
                }
              }
            }
          }

          return (
            <div key={rowLetter} className="flex items-center space-x-3">
              {/* Nhãn hàng (trái) */}
              <span className="w-6 text-zinc-500 font-black text-sm text-center select-none uppercase">
                {rowLetter}
              </span>

              {/* Các ghế trong hàng */}
              <div className="flex items-center gap-2">
                {rowSeatStates.map((seatInfo, idx) => {
                  const isSelected = selectedSeats.includes(seatInfo.seatCode);
                  const isPartOfHover = hoverBlock.some(s => s.seatCode === seatInfo.seatCode);

                  // Lấy cấu hình giao diện từ constants
                  const seatStyle = SEAT_TYPES[seatInfo.type] || SEAT_TYPES.standard;
                  
                  // Xác định màu nền và viền của ghế
                  let activeBg = seatStyle.color;
                  if (seatInfo.isDisabled) {
                    activeBg = 'bg-[#1f1f23]/40 border border-zinc-800/80 text-zinc-600/40 cursor-not-allowed';
                  } else if (seatInfo.isBooked) {
                    activeBg = seatStyle.bookedColor;
                  } else if (seatInfo.isHeld) {
                    activeBg = 'bg-orange-500/20 border border-orange-500 text-orange-400 cursor-not-allowed';
                  } else if (isPartOfHover) {
                    activeBg = isHoverValid 
                      ? 'bg-brand/80 border border-brand text-white shadow-[0_0_10px_rgba(229,9,20,0.5)] cursor-pointer' 
                      : 'bg-red-500/50 border border-red-500 text-red-200 cursor-not-allowed';
                  } else if (isSelected) {
                    activeBg = seatStyle.selectedColor;
                  }

                  const isCouple = seatInfo.type === 'couple';

                  const handleClick = () => {
                    // Tính toán lại block để đảm bảo hoạt động tốt trên mobile (không phụ thuộc state hover)
                    let block = rowSeatStates.slice(idx, idx + ticketQuantity);
                    if (block.length === ticketQuantity && block.every(s => s.isAvailable)) {
                      // Chặn không cho click nếu cụm bắc cầu qua lối đi (chỉ áp dụng khi mua <= 6 vé)
                      const isCrossingAisle = ticketQuantity <= 6 && block.some(s => s.number <= 6) && block.some(s => s.number >= 7);
                      if (isCrossingAisle) return;

                      let valid = true;
                      const l1 = rowSeatStates[idx - 1];
                      if (l1?.isAvailable) {
                        const l2 = rowSeatStates[idx - 2];
                        if (!l2 || !l2.isAvailable) valid = false;
                      }
                      const r1 = rowSeatStates[idx + ticketQuantity];
                      if (r1?.isAvailable) {
                        const r2 = rowSeatStates[idx + ticketQuantity + 1];
                        if (!r2 || !r2.isAvailable) valid = false;
                      }
                      
                      if (valid) {
                        onSeatClick(block.map(s => s.seatCode));
                      }
                    }
                  };

                  return (
                    <React.Fragment key={seatInfo._id}>
                      <button
                        disabled={seatInfo.isBooked || seatInfo.isDisabled || seatInfo.isHeld}
                        onClick={handleClick}
                        onMouseEnter={() => setHoveredSeat(seatInfo.seatCode)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        className={`h-8 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center transform active:scale-90 ${
                          isCouple ? 'w-[72px]' : 'w-8'
                        } ${activeBg}`}
                        title={`${seatInfo.seatCode} - ${seatInfo.type.toUpperCase()}${seatInfo.isDisabled ? ' (Bảo trì)' : ''}${seatInfo.isBooked ? ' (Đã đặt)' : ''}${seatInfo.isHeld ? ' (Đang giữ)' : ''}`}
                      >
                        {seatInfo.isDisabled ? 'X' : (isCouple ? `${seatInfo.seatCode} Đôi` : seatInfo.seatCode)}
                      </button>

                      {/* Lối đi (Aisle) chia cắt khu vực trái và phải */}
                      {seatInfo.number === 6 && (
                        <div className="w-8 sm:w-12 flex flex-col items-center justify-center mx-1">
                          <div className="h-full w-px bg-zinc-800/50"></div>
                        </div>
                      )}
                    </React.Fragment>
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