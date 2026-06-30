import React, { useState } from 'react';
import { SEAT_TYPES } from '../../utils/constants';
import Toast from '../common/Toast';

export const SeatMap = ({ seats = [], bookedSeats = [], selectedSeats = [], heldSeatsByOthers = [], onSeatClick }) => {
  const [toastMsg, setToastMsg] = useState('');
  
  // Nhóm ghế theo hàng (chữ cái)
  const groupedSeats = seats.reduce((acc, seat) => {
    const row = seat.row;
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {});

  const normalizedBookedSeats = new Set(
    (bookedSeats || []).map((seatCodeItem) => String(seatCodeItem).trim().toUpperCase())
  );

  // Helper: Trả về state của một ghế
  const getSeatState = (seat) => {
    const seatCode = `${seat.row}${seat.number}`.toUpperCase();
    const isBooked = normalizedBookedSeats.has(seatCode);
    const isHeld = heldSeatsByOthers.includes(seatCode);
    const isDisabled = seat.isDisabled === true;
    const isAvailable = !isBooked && !isHeld && !isDisabled;
    return { ...seat, seatCode, isBooked, isHeld, isDisabled, isAvailable };
  };

  // Helper: Tìm các "khoảng trống" (segment) trong 1 cụm ghế
  const getEmptySegments = (seatStates, currentSelectedSeats) => {
    const segments = [];
    let currentSegmentLength = 0;
    let isStartEdge = false;
    
    for (let i = 0; i < seatStates.length; i++) {
      const s = seatStates[i];
      const isOccupied = !s.isAvailable || currentSelectedSeats.includes(s.seatCode);
      
      if (!isOccupied) {
        if (currentSegmentLength === 0 && i === 0) {
          isStartEdge = true; // Segment chạm rìa trái
        }
        currentSegmentLength++;
      } else {
        if (currentSegmentLength > 0) {
          segments.push({
            length: currentSegmentLength,
            isEdge: isStartEdge // Nếu nó chạm rìa trái thì là edge
          });
          currentSegmentLength = 0;
          isStartEdge = false;
        }
      }
    }
    
    if (currentSegmentLength > 0) {
      segments.push({
        length: currentSegmentLength,
        // Nếu vòng lặp kết thúc mà vẫn còn segment, nghĩa là segment này chạm rìa phải (i = length)
        isEdge: isStartEdge || true 
      });
    }
    return segments;
  };

  const handleSeatClick = (clickedSeatCode, rowLetter) => {
    let newSelected;
    const isAlreadySelected = selectedSeats.includes(clickedSeatCode);

    if (isAlreadySelected) {
      // Bỏ chọn
      newSelected = selectedSeats.filter(code => code !== clickedSeatCode);
    } else {
      // Chọn thêm (không giới hạn số lượng)
      newSelected = [...selectedSeats, clickedSeatCode];
    }

    // --- KIỂM TRA LUẬT CHỐNG GHẾ SO LE (ORPHAN RULE) ---
    // Chỉ cần kiểm tra hàng của ghế vừa click
    const rowSeats = [...groupedSeats[rowLetter]].sort((a, b) => a.number - b.number);
    const rowSeatStates = rowSeats.map(getSeatState);

    // Chia hàng thành 2 block nếu có lối đi ở giữa (theo giao diện, lối đi ở giữa ghế 6 và 7)
    const block1 = rowSeatStates.filter(s => s.number <= 6);
    const block2 = rowSeatStates.filter(s => s.number >= 7);

    // Helper: Xác định xem có ghế so le (orphan) không
    // Ghế so le là khoảng trống có ĐÚNG 1 ghế và KHÔNG nằm ở rìa của block
    const checkHasOrphan = (segments) => {
      return segments.some(seg => seg.length === 1 && !seg.isEdge);
    };

    // Kiểm tra Block 1
    const segments1 = getEmptySegments(block1, newSelected);
    const hasOrphan1 = checkHasOrphan(segments1);
    const oldSegments1 = getEmptySegments(block1, []); // Trạng thái gốc không tính selectedSeats
    const hadOrphan1 = checkHasOrphan(oldSegments1);

    // Kiểm tra Block 2
    const segments2 = getEmptySegments(block2, newSelected);
    const hasOrphan2 = checkHasOrphan(segments2);
    const oldSegments2 = getEmptySegments(block2, []); // Trạng thái gốc
    const hadOrphan2 = checkHasOrphan(oldSegments2);

    // Nếu tạo ra một khoảng trống đúng 1 ghế mới (mà trước đó không có) -> Chặn!
    if ((hasOrphan1 && !hadOrphan1) || (hasOrphan2 && !hadOrphan2)) {
      setToastMsg("Không được để trống đúng 1 ghế (so le) ở giữa 2 ghế khác. Vui lòng chọn ghế liền kề.");
      return;
    }

    // Pass mảng các ghế mới được chọn lên cha
    onSeatClick(newSelected);
  };

  return (
    <div className="space-y-12 overflow-x-auto py-6 relative">
      <Toast message={toastMsg} type="warning" onClose={() => setToastMsg('')} />
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
          const rowSeats = [...groupedSeats[rowLetter]].sort((a, b) => a.number - b.number);
          const rowSeatStates = rowSeats.map(getSeatState);

          return (
            <div key={rowLetter} className="flex items-center space-x-3">
              {/* Nhãn hàng (trái) */}
              <span className="w-6 text-zinc-500 font-black text-sm text-center select-none uppercase">
                {rowLetter}
              </span>

              {/* Các ghế trong hàng */}
              <div className="flex items-center gap-2">
                {rowSeatStates.map((seatInfo) => {
                  const isSelected = selectedSeats.includes(seatInfo.seatCode);
                  const seatStyle = SEAT_TYPES[seatInfo.type] || SEAT_TYPES.standard;
                  
                  let activeBg = seatStyle.color;
                  if (seatInfo.isDisabled) {
                    activeBg = 'bg-[#1f1f23]/40 border border-zinc-800/80 text-zinc-600/40 cursor-not-allowed';
                  } else if (seatInfo.isBooked) {
                    activeBg = seatStyle.bookedColor;
                  } else if (seatInfo.isHeld) {
                    activeBg = 'bg-orange-500/20 border border-orange-500 text-orange-400 cursor-not-allowed';
                  } else if (isSelected) {
                    activeBg = seatStyle.selectedColor + ' shadow-[0_0_12px_rgba(168,85,247,0.6)] border-brand';
                  } else {
                    activeBg = activeBg + ' hover:border-brand/50 hover:bg-brand/20 cursor-pointer';
                  }

                  const isCouple = seatInfo.type === 'couple';

                  return (
                    <React.Fragment key={seatInfo._id}>
                      <button
                        disabled={!seatInfo.isAvailable}
                        onClick={() => handleSeatClick(seatInfo.seatCode, rowLetter)}
                        className={`h-8 rounded-lg font-bold text-[9px] transition-all flex items-center justify-center transform active:scale-90 border ${
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