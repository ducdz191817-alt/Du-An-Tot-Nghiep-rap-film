import React, { useState } from 'react';
import { Ticket, Popcorn, ChevronRight, X } from 'lucide-react';
import Button from '../common/Button';

export const BookingSummary = ({
  showtime,
  selectedSeats = [],
  selectedConcessions = {},
  concessionsList = [],
  pricing,
  onProceed,
  proceedText = 'Tiến hành thanh toán',
  disabled = false,
  loading = false,
  onRemoveConcession, // optional callback to clear concession
  appliedCoupon = null, // optional applied coupon info
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!onApplyCoupon) return;
    if (!couponInput.trim()) return;
    setCouponError('');
    setValidatingCoupon(true);
    try {
      await onApplyCoupon(couponInput.trim().toUpperCase());
    } catch (err) {
      setCouponError(err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (!onRemoveCoupon) return;
    onRemoveCoupon();
    setCouponInput('');
    setCouponError('');
  };
  if (!showtime) return null;

  const movie = showtime.movie || {};
  const theater = showtime.theater || {};
  const room = showtime.room || {};

  const timeString = new Date(showtime.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateString = new Date(showtime.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formatSeatCodes = (seats) => {
    return seats.map(seatCode => {
      const match = seatCode.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const row = match[1];
        const num = parseInt(match[2], 10);
        
        const capacity = room.capacity || 0;
        const cols = capacity <= 30 ? 6 : capacity <= 60 ? 10 : 12;
        const rowCount = Math.ceil(capacity / cols);
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lastRowLetter = rowCount > 0 ? alphabet[rowCount - 1] : '';

        if (row === lastRowLetter || room.type === 'GOLDCLASS') {
          return `${row}${num}-${row}${num + 1}`;
        }
      }
      return seatCode;
    });
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, pricing.grandTotal - discountAmount);

  const releaseDateLabel = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  const durationLabel = movie.duration
    ? `${parseInt(movie.duration, 10)} phút`
    : null;

  return (
    <div className="bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 p-6 rounded-3xl space-y-6 shadow-xl sticky top-24">
      {/* Movie Details Invoice Header */}
      <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <span className="text-[10px] font-black bg-brand px-2 py-0.5 rounded text-white tracking-wide uppercase">
          {movie.rating}
        </span>
        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-snug">{movie.title}</h3>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">
          {releaseDateLabel && <span>Khởi chiếu: {releaseDateLabel}</span>}
          {durationLabel && <span>{durationLabel}</span>}
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold uppercase">
          {theater.name} &bull; {room.name} ({showtime.format})
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 font-bold">
          {dateString} &bull; {timeString}
        </p>
      </div>

      {/* Chi tiết đơn giá */}
      <div className="space-y-4 text-xs font-semibold">
        {/* Ticket Seats */}
        {selectedSeats.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <Ticket size={14} className="text-brand" />
              <span>Ghế: {formatSeatCodes(selectedSeats).join(', ')}</span>
            </div>
            <div className="flex justify-between pl-5 text-zinc-600 dark:text-zinc-400">
              <span>{selectedSeats.length} Vé</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-bold">{pricing.seatsTotal.toLocaleString()} VND</span>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-600 italic">Chưa chọn ghế nào.</p>
        )}

        {/* Bắp nước */}
        {Object.keys(selectedConcessions).length > 0 && (
          <div className="space-y-1.5 border-t border-gray-200 dark:border-gray-800 pt-3">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <Popcorn size={14} className="text-brand" />
              <span>Đồ ăn uống đã chọn</span>
            </div>
            <div className="space-y-1 pl-5">
              {Object.keys(selectedConcessions).map((id) => {
                const qty = selectedConcessions[id];
                const item = concessionsList.find((c) => c._id === id);
                if (!item || qty === 0) return null;
                return (
                  <div key={id} className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>
                      {item.name} x {qty}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-500">{(item.price * qty).toLocaleString()} VND</span>
                  </div>
                );
              })}
              <div className="flex justify-between pl-0 pt-1 text-zinc-600 dark:text-zinc-400 border-t border-gray-200 dark:border-gray-800">
                <span>Tổng cộng đồ ăn uống</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-bold">{pricing.concessionsTotal.toLocaleString()} VND</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Coupon input section (Only render if onApplyCoupon is provided so it only appears on PaymentPage) */}
      {onApplyCoupon && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-5 space-y-3">
          <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            🏷️ Mã giảm giá / Voucher
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !appliedCoupon && handleApplyCoupon()}
              disabled={!!appliedCoupon || loading}
              className="flex-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50 transition-all uppercase font-mono tracking-wider shadow-sm min-w-0"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all shrink-0"
              >
                Hủy
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponInput.trim() || loading || validatingCoupon}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-brand/40 text-brand bg-brand/5 hover:bg-brand/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1"
              >
                {validatingCoupon ? (
                  <><span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin inline-block" /> ...</>
                ) : 'Áp dụng'}
              </button>
            )}
          </div>

          {couponError && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-2.5 py-1.5">
              <span>⚠️</span> {couponError}
            </div>
          )}

          {appliedCoupon && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
              <div>
                <span>✅ Đã áp dụng: <strong className="font-mono text-emerald-800 dark:text-emerald-300">{appliedCoupon.code}</strong></span>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 font-medium">
                  {appliedCoupon.discountType === 'percentage'
                    ? `Giảm ${appliedCoupon.discountValue}% (tối đa ${appliedCoupon.maxDiscountAmount?.toLocaleString('vi-VN')} đ)`
                    : `Giảm ${appliedCoupon.discountValue?.toLocaleString('vi-VN')} đ`}
                </p>
              </div>
              <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400 shrink-0 ml-2">
                -{discountAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tổng cộng */}
      <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-800 pt-4 flex items-center justify-between">
        <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">Tổng tiền thanh toán</span>
        <span className="text-xl font-black text-brand tracking-tight">
          {finalTotal.toLocaleString()} VND
        </span>
      </div>

      {/* Nút hành động */}
      {onProceed && (
        <Button
          onClick={onProceed}
          disabled={disabled || selectedSeats.length === 0}
          loading={loading}
          variant="primary"
          className="w-full py-3.5 rounded-2xl font-black text-sm"
          icon={<ChevronRight size={18} />}
        >
          {proceedText}
        </Button>
      )}
    </div>
  );
};

export default BookingSummary;