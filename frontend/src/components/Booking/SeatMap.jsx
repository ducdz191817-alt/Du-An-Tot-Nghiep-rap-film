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
                  const normalizedSeatCode = String(seatCode).trim().toUpperCase();
                  const normalizedBookedSeats = new Set(
                    (bookedSeats || []).map((seatCodeItem) => String(seatCodeItem).trim().toUpperCase())
                  );
                  // 1. Kiểm tra xem ghế đã được đặt trước đó chưa
                  const isBooked = normalizedBookedSeats.has(normalizedSeatCode);
                  // 2. Kiểm tra xem ghế có đang được chọn trong lượt đặt này không
                  const isSelected = selectedSeats.includes(normalizedSeatCode);
                  // 3. Kiểm tra xem ghế có bị hỏng/vô hiệu hóa không
                  const isDisabledSeat = seat.isDisabled === true;

                  // Lấy cấu hình giao diện từ constants dựa theo loại ghế (standard, vip, couple)
                  const seatStyle = SEAT_TYPES[seat.type] || SEAT_TYPES.standard;
                  
                  // Xác định màu nền và viền của ghế tùy thuộc vào trạng thái
                  let activeBg = seatStyle.color;
                  if (isDisabledSeat) {
                    // Nếu ghế bị hỏng: làm mờ, đổi màu xám đen để nhận biết
                    activeBg = 'bg-[#1f1f23]/40 border border-zinc-800/80 text-zinc-600/40 cursor-not-allowed';
                  } else if (isBooked) {
                    // Nếu ghế đã có người đặt: màu đỏ xám
                    activeBg = seatStyle.bookedColor;
                  } else if (isSelected) {
                    // Nếu đang click chọn: màu thương hiệu (đỏ/tím sáng)
                    activeBg = seatStyle.selectedColor;
                  }

                  // Kiểm tra kích thước (ghế đôi couple có chiều rộng gấp đôi ghế thường)
                  const isCouple = seat.type === 'couple';
                  const displayLabel = isCouple
                    ? `${seat.row}${seat.number}-${seat.row}${seat.number + 1} Đôi`
                    : seatCode;

                  return (
                    <button
                      key={seat._id}
                      // Vô hiệu hóa nút click nếu ghế đã được đặt HOẶC ghế bị hỏng
                      disabled={isBooked || isDisabledSeat}
                      onClick={() => onSeatClick(seatCode)}
                      className={`h-8 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center transform active:scale-90 ${
                        isCouple ? 'w-[72px]' : 'w-8'
                      } ${activeBg}`}
                      title={`${displayLabel} - ${seat.type.toUpperCase()}${isDisabledSeat ? ' (Bảo trì)' : ''}${isBooked ? ' (Đã đặt)' : ''}`}
                    >
                      {isDisabledSeat ? 'X' : displayLabel}
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