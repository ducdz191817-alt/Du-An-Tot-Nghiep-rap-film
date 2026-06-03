import React from 'react';
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
}) => {
  if (!showtime) return null;

  const movie = showtime.movie || {};
  const theater = showtime.theater || {};
  const room = showtime.room || {};

  // Formatted date in Vietnamese
  const dateObj = new Date(showtime.startTime);
  const timeString = dateObj.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateString = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  return (
    <div className="bg-dark-card border border-dark-border p-6 rounded-3xl space-y-6 shadow-xl sticky top-24">
      {/* Movie Details Invoice Header */}
      <div className="flex gap-4 border-b border-dark-border pb-4">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-16 h-24 object-cover rounded-xl border border-dark-border shadow-md shrink-0 bg-zinc-950"
          />
        )}
        <div className="space-y-1.5 min-w-0 flex-grow">
          <h3 className="text-lg font-black text-zinc-100 leading-snug truncate" title={movie.title}>
            {movie.title}
          </h3>
          <p className="text-xs text-zinc-400 font-semibold truncate">
            {movie.genre?.join(', ')} &bull; {movie.duration} phút
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black bg-brand px-1.5 py-0.5 rounded text-white tracking-wide uppercase">
              {movie.rating}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase truncate">
              {theater.name} &bull; {room.name} ({showtime.format})
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase">
            {dateString} &bull; {timeString}
          </p>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="space-y-4 text-xs font-semibold">
        {/* Ticket Seats */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-2">
            <span className="text-zinc-200">Ghế đã chọn</span>
            {selectedSeats.length > 0 && (
              <span className="text-zinc-500 text-[10px]">{selectedSeats.length} ghế</span>
            )}
          </div>
          
          {selectedSeats.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 py-1">
                {selectedSeats.map((seat) => (
                  <span key={seat} className="bg-brand/10 border border-brand/20 text-brand px-2.5 py-1 rounded-lg text-[11px] font-black">
                    {seat}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-zinc-500 pt-1">
                <span>Tiền ghế</span>
                <span className="text-zinc-300 font-bold">{pricing.seatsTotal.toLocaleString()}đ</span>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 italic">Chưa có ghế nào được chọn</p>
          )}
        </div>

        {/* Concessions */}
        {Object.keys(selectedConcessions).length > 0 && (
          <div className="space-y-2.5 border-t border-dark-border/50 pt-4">
            <span className="text-zinc-200 font-bold text-xs block">Dịch vụ bổ sung</span>
            <div className="space-y-2">
              {Object.keys(selectedConcessions).map((id) => {
                const qty = selectedConcessions[id];
                const item = concessionsList.find((c) => c._id === id);
                if (!item || qty === 0) return null;
                return (
                  <div key={id} className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/40 text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="text-zinc-200 font-bold truncate">{item.name}</div>
                      <div className="text-zinc-500 text-[10px] mt-0.5">Số lượng: {qty}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-zinc-300 font-extrabold">{(item.price * qty).toLocaleString()}đ</span>
                      {onRemoveConcession && (
                        <button
                          type="button"
                          onClick={() => onRemoveConcession(id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1 bg-zinc-950/60 rounded-full border border-zinc-800"
                          title="Xóa dịch vụ"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between text-zinc-500 pt-1">
                <span>Tiền bắp nước</span>
                <span className="text-zinc-300 font-bold">{pricing.concessionsTotal.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Total */}
      <div className="border-t-2 border-dashed border-dark-border pt-4 flex items-center justify-between">
        <span className="text-sm font-black text-zinc-300">Tổng cộng</span>
        <span className="text-xl font-black text-brand tracking-tight">
          {pricing.grandTotal.toLocaleString()}đ
        </span>
      </div>

      {/* Action Proceed */}
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
  
