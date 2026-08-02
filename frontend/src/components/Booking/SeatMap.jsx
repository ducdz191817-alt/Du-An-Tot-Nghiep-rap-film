import React, { useState } from 'react';
import { SEAT_TYPES } from '../../utils/constants';
import Toast from '../common/Toast';

export const SeatMap = ({ seats = [], bookedSeats = [], selectedSeats = [], heldSeatsByOthers = [], onSeatClick, onOrphanError }) => {
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
    let isLeftEdge = false;
    
    for (let i = 0; i < seatStates.length; i++) {
      const s = seatStates[i];
      const isOccupied = !s.isAvailable || currentSelectedSeats.includes(s.seatCode);
      const seatCapacity = s.type === 'couple' ? 2 : 1;
      
      if (!isOccupied) {
        if (currentSegmentLength === 0) {
          isLeftEdge = (i === 0); // Bắt đầu ở mép trái của khán phòng / cụm ghế
        }
        currentSegmentLength += seatCapacity;
      } else {
        if (currentSegmentLength > 0) {
          segments.push({
            length: currentSegmentLength,
            isEdge: isLeftEdge // Chỉ chạm mép nếu bắt đầu ở i = 0
          });
          currentSegmentLength = 0;
          isLeftEdge = false;
        }
      }
    }
    
    if (currentSegmentLength > 0) {
      segments.push({
        length: currentSegmentLength,
        isEdge: true // Kéo dài đến cuối cụm ghế -> Chạm mép phải / lối đi
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
      // QUY TẮC: Giới hạn tối đa 8 ghế cho 1 lần đặt
      if (selectedSeats.length >= 8) {
        setToastMsg("🚫 Bạn chỉ được chọn tối đa 8 ghế cho mỗi lần đặt vé.");
        return;
      }
      // Chọn thêm
      newSelected = [...selectedSeats, clickedSeatCode];
    }

    // --- 1. KIỂM TRA QUY TẮC CẢNH BÁO HÀNG GẦN MÀN HÌNH (Hàng A, B) ---
    const isFrontRow = rowLetter === 'A' || rowLetter === 'B';
    let currentToast = '';

    if (!isAlreadySelected && isFrontRow) {
      currentToast = "⚠️ Hàng ghế A/B nằm sát màn chiếu, góc nhìn có thể hơi dốc.";
    }

    // --- 2. KIỂM TRA QUY TẮC ĐẶT GHẾ PHÂN TÁN NHIỀU DÃY (≥ 3 dãy) ---
    const uniqueRows = new Set(newSelected.map(code => code.match(/^([A-Za-z]+)/)?.[1]));
    if (uniqueRows.size >= 3) {
      currentToast = "⚠️ Bạn đang chọn ghế ở 3 dãy khác nhau. Vui lòng kiểm tra vị trí xem phim của nhóm.";
    }

    // --- 3. KIỂM TRA QUY TẮC CHỐNG GHẾ SO LEỞ GIỮA (ORPHAN SEAT IN THE MIDDLE) ---
    const rowSeats = [...groupedSeats[rowLetter]].sort((a, b) => a.number - b.number);
    const rowSeatStates = rowSeats.map(getSeatState);

    // Chia hàng thành 2 block nếu có lối đi ở giữa (lối đi ở giữa ghế 6 và 7)
    const block1 = rowSeatStates.filter(s => s.number <= 6);
    const block2 = rowSeatStates.filter(s => s.number >= 7);

    // Ghế mồ côi (so le) là khoảng trống đúng 1 ghế VÀ bị kẹp ở giữa (không chạm mép ngoài/lối đi)
    const getOrphanCount = (segments) => {
      return segments.filter(seg => seg.length === 1 && !seg.isEdge).length;
    };

    const orphanCount1 = getOrphanCount(getEmptySegments(block1, newSelected));
    const oldOrphanCount1 = getOrphanCount(getEmptySegments(block1, []));

    const orphanCount2 = getOrphanCount(getEmptySegments(block2, newSelected));
    const oldOrphanCount2 = getOrphanCount(getEmptySegments(block2, []));

    if (orphanCount1 > oldOrphanCount1 || orphanCount2 > oldOrphanCount2) {
      currentToast = "❌ Đang để trống 1 ghế (so le). Vui lòng chọn lấp chỗ trống hoặc bỏ chọn.";
      if (onOrphanError) onOrphanError(true);
    } else {
      if (onOrphanError) onOrphanError(false);
    }

    setToastMsg(currentToast);

    // Cập nhật mảng ghế đã chọn
    onSeatClick(newSelected);
  };

  return (
    <div className="space-y-4 overflow-x-auto py-2 relative">
      <Toast message={toastMsg} type="warning" onClose={() => setToastMsg('')} />
      {/* 1. Chỉ báo màn hình cong */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
        <div className="h-1.5 w-full bg-brand rounded-full shadow-[0_0_15px_rgba(229,9,20,0.8)]" />
        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
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
                    activeBg = 'bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed';
                  } else if (seatInfo.isBooked) {
                    activeBg = seatStyle.bookedColor;
                  } else if (seatInfo.isHeld) {
                    activeBg = 'bg-orange-100 border border-orange-300 text-orange-600 cursor-not-allowed';
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