/**
 * COMPONENT: SeatMap.jsx — Sơ đồ ghế
 * - Chống ghế mồ côi (Orphan Seat): Không cho phép bỏ trống 1 ghế ở giữa.
 * - Giới hạn tối đa 8 ghế/giao dịch.
 * - Hỗ trợ ghế đôi, tính lối đi tự động.
 */

import React, { useState, useMemo } from 'react';
import { SEAT_TYPES } from '../../utils/constants';
import Toast from '../common/Toast';

// Giới hạn tối đa số ghế mỗi lần đặt (giống CGV/Beta)
const MAX_SEATS_PER_BOOKING = 8;

export const SeatMap = ({ seats = [], bookedSeats = [], selectedSeats = [], heldSeatsByOthers = [], onSeatClick, onOrphanError, ticketPrice = 0 }) => {
  const [toastMsg, setToastMsg] = useState('');
  
  // Nhóm ghế theo hàng (chữ cái)
  const groupedSeats = useMemo(() => seats.reduce((acc, seat) => {
    const row = seat.row;
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {}), [seats]);

  const normalizedBookedSeats = useMemo(() => new Set(
    (bookedSeats || []).map((seatCodeItem) => String(seatCodeItem).trim().toUpperCase())
  ), [bookedSeats]);

  // Tính toán số ghế trống
  const seatStats = useMemo(() => {
    let total = 0;
    let available = 0;
    seats.forEach(seat => {
      total++;
      const seatCode = `${seat.row}${seat.number}`.toUpperCase();
      const isBooked = normalizedBookedSeats.has(seatCode);
      const isHeld = heldSeatsByOthers.includes(seatCode);
      const isDisabled = seat.isDisabled === true;
      if (!isBooked && !isHeld && !isDisabled) {
        available++;
      }
    });
    return { total, available };
  }, [seats, normalizedBookedSeats, heldSeatsByOthers]);

  // Helper: Trả về state của một ghế
  const getSeatState = (seat) => {
    const seatCode = `${seat.row}${seat.number}`.toUpperCase();
    const isBooked = normalizedBookedSeats.has(seatCode);
    const isHeld = heldSeatsByOthers.includes(seatCode);
    const isDisabled = seat.isDisabled === true;
    const isAvailable = !isBooked && !isHeld && !isDisabled;
    return { ...seat, seatCode, isBooked, isHeld, isDisabled, isAvailable };
  };

  // Helper: Tìm vị trí lối đi ĐỘNG dựa trên số ghế trong hàng
  const getAislePosition = (rowSeats) => {
    if (rowSeats.length <= 4) return -1; // Không cần aisle nếu ít ghế (ghế đôi)
    return Math.floor(rowSeats.length / 2); // Lối đi ở chính giữa
  };

  // Helper: Chia hàng ghế thành 2 block dựa trên vị trí lối đi động
  const splitRowIntoBlocks = (rowSeatStates) => {
    const aislePos = getAislePosition(rowSeatStates);
    if (aislePos === -1) {
      // Không có aisle -> toàn bộ hàng là 1 block
      return [rowSeatStates];
    }
    const block1 = rowSeatStates.slice(0, aislePos);
    const block2 = rowSeatStates.slice(aislePos);
    return [block1, block2];
  };

  // Helper: Tìm các "khoảng trống" (segment) trong 1 cụm ghế
  const getEmptySegments = (seatStates, currentSelectedSeats) => {
    const segments = [];
    let currentSegmentLength = 0;
    
    for (let i = 0; i < seatStates.length; i++) {
      const s = seatStates[i];
      const isOccupied = !s.isAvailable || currentSelectedSeats.includes(s.seatCode);
      
      if (!isOccupied) {
        currentSegmentLength++;
      } else {
        if (currentSegmentLength > 0) {
          segments.push({ length: currentSegmentLength });
          currentSegmentLength = 0;
        }
      }
    }
    
    if (currentSegmentLength > 0) {
      segments.push({ length: currentSegmentLength });
    }
    return segments;
  };

  // Helper: Đếm số ghế mồ côi (khoảng trống đúng 1 ghế)
  const getOrphanCount = (segments) => {
    return segments.filter(seg => seg.length === 1).length;
  };

  // ==========================================
  // FIX BUG 1: KIỂM TRA ORPHAN TRÊN TẤT CẢ CÁC HÀNG CÓ GHẾ ĐANG CHỌN
  // ==========================================
  const checkAllRowsForOrphan = (newSelected) => {
    // Tìm tất cả các hàng có ghế đang được chọn
    const affectedRows = new Set();
    newSelected.forEach(seatCode => {
      const match = seatCode.match(/^([A-Z]+)/);
      if (match) affectedRows.add(match[1]);
    });

    // Thêm cả các hàng có ghế đã được đặt (bookedSeats) vì orphan có thể xảy ra ở đó
    // Nhưng ta chỉ cần check các hàng có ghế user đang chọn
    for (const rowLetter of affectedRows) {
      if (!groupedSeats[rowLetter]) continue;

      const rowSeats = [...groupedSeats[rowLetter]].sort((a, b) => a.number - b.number);
      const rowSeatStates = rowSeats.map(getSeatState);

      // FIX BUG 3: Chia block ĐỘNG thay vì fix cứng 6/7
      const blocks = splitRowIntoBlocks(rowSeatStates);

      for (const block of blocks) {
        if (block.length === 0) continue;

        const orphanCountNew = getOrphanCount(getEmptySegments(block, newSelected));
        const orphanCountOld = getOrphanCount(getEmptySegments(block, []));

        // Nếu bất kỳ block nào tạo thêm orphan -> lỗi
        if (orphanCountNew > orphanCountOld) {
          return true; // Có lỗi orphan
        }
      }
    }
    return false; // Không có lỗi
  };

  const handleSeatClick = (clickedSeatCode, rowLetter) => {
    let newSelected;
    const isAlreadySelected = selectedSeats.includes(clickedSeatCode);

    if (isAlreadySelected) {
      // Bỏ chọn
      newSelected = selectedSeats.filter(code => code !== clickedSeatCode);
    } else {
      // ==========================================
      // FIX BUG 2: GIỚI HẠN TỐI ĐA 8 GHẾ
      // ==========================================
      if (selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
        setToastMsg(`Bạn chỉ được chọn tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi lần đặt vé.`);
        return;
      }
      newSelected = [...selectedSeats, clickedSeatCode];
    }

    // --- KIỂM TRA LUẬT CHỐNG GHẾ SO LE (ORPHAN RULE) ---
    // FIX BUG 1: Kiểm tra TẤT CẢ các hàng, không chỉ hàng vừa click
    const hasOrphan = checkAllRowsForOrphan(newSelected);

    if (hasOrphan) {
      setToastMsg("Đang để trống 1 ghế (so le). Vui lòng chọn lấp chỗ trống hoặc bỏ chọn.");
      if (onOrphanError) onOrphanError(true);
    } else {
      setToastMsg("");
      if (onOrphanError) onOrphanError(false);
    }

    // Luôn cho phép cập nhật để user có thể sửa lỗi (chỉ khóa nút thanh toán)
    onSeatClick(newSelected);
  };

  // Helper: Lấy label + giá tiền cho tooltip
  const getSeatTooltip = (seatInfo) => {
    const seatStyle = SEAT_TYPES[seatInfo.type] || SEAT_TYPES.standard;
    const extraPrice = seatInfo.price || seatStyle.extraPrice || 0;
    const multiplier = seatInfo.type === 'couple' ? 2 : 1;
    const totalPrice = (ticketPrice * multiplier) + extraPrice;

    let statusText = '';
    if (seatInfo.isDisabled) statusText = ' • 🔧 Bảo trì';
    else if (seatInfo.isBooked) statusText = ' • ❌ Đã đặt';
    else if (seatInfo.isHeld) statusText = ' • ⏳ Đang giữ';
    else statusText = ` • ${totalPrice.toLocaleString()} VND`;

    return `${seatInfo.seatCode} - ${seatStyle.label}${statusText}`;
  };

  return (
    <div className="space-y-6 overflow-x-auto py-6 relative">
      <Toast message={toastMsg} type="warning" onClose={() => setToastMsg('')} />

      {/* Thông tin ghế trống + Giới hạn */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <div className={`w-2 h-2 rounded-full ${seatStats.available > 10 ? 'bg-emerald-500' : seatStats.available > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
          <span>Còn <span className="text-zinc-700 dark:text-zinc-200 font-bold">{seatStats.available}</span>/{seatStats.total} ghế trống</span>
        </div>
        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Tối đa {MAX_SEATS_PER_BOOKING} ghế/lần
        </div>
      </div>

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
          // FIX BUG 3: Tính vị trí aisle động
          const aisleIndex = getAislePosition(rowSeatStates);

          return (
            <div key={rowLetter} className="flex items-center space-x-3">
              {/* Nhãn hàng (trái) */}
              <span className="w-6 text-zinc-500 font-black text-sm text-center select-none uppercase">
                {rowLetter}
              </span>

              {/* Các ghế trong hàng */}
              <div className="flex items-center gap-2">
                {rowSeatStates.map((seatInfo, index) => {
                  const isSelected = selectedSeats.includes(seatInfo.seatCode);
                  const seatStyle = SEAT_TYPES[seatInfo.type] || SEAT_TYPES.standard;
                  
                  let activeBg = seatStyle.color;
                  if (seatInfo.isDisabled) {
                    activeBg = 'bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400';
                  } else if (seatInfo.isBooked) {
                    activeBg = seatStyle.bookedColor;
                  } else if (seatInfo.isHeld) {
                    activeBg = 'bg-orange-100 border border-orange-300 text-orange-600 cursor-not-allowed dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-400';
                  } else if (isSelected) {
                    activeBg = seatStyle.selectedColor + ' shadow-[0_0_12px_rgba(168,85,247,0.6)] border-brand scale-110';
                  } else {
                    activeBg = activeBg + ' hover:border-brand/50 hover:bg-brand/20 hover:scale-105 cursor-pointer';
                  }

                  const isCouple = seatInfo.type === 'couple';

                  return (
                    <React.Fragment key={seatInfo._id}>
                      <button
                        disabled={!seatInfo.isAvailable}
                        onClick={() => handleSeatClick(seatInfo.seatCode, rowLetter)}
                        className={`h-8 rounded-lg font-bold text-[9px] transition-all duration-200 ease-out flex items-center justify-center transform active:scale-90 border ${
                          isCouple ? 'w-[72px]' : 'w-8'
                        } ${activeBg}`}
                        title={getSeatTooltip(seatInfo)}
                      >
                        {seatInfo.isDisabled ? 'X' : (isCouple ? `${seatInfo.seatCode} Đôi` : seatInfo.seatCode)}
                      </button>

                      {/* FIX BUG 3: Lối đi (Aisle) ĐỘNG - dựa trên vị trí tính toán */}
                      {aisleIndex !== -1 && index === aisleIndex - 1 && (
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