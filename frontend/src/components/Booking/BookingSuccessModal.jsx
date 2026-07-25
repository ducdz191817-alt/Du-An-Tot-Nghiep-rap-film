import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Ticket, MapPin, Calendar, CreditCard, Receipt, Home, History } from 'lucide-react';
import Button from '../common/Button';

/**
 * BookingSuccessModal — hiển thị sau khi đặt vé + thanh toán thành công.
 * Props:
 *  - isOpen       : boolean — hiển thị hay không
 *  - bookingResult: object  — kết quả API trả về { booking, payment }
 *  - showtime     : object  — thông tin suất chiếu đang đặt
 *  - selectedSeats: string[] — danh sách mã ghế đã chọn
 *  - onClose      : fn      — callback đóng modal (clear state)
 */
export const BookingSuccessModal = ({ isOpen, bookingResult, showtime, selectedSeats, onClose }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  // Animation mount
  useEffect(() => {
    if (isOpen) {
      // delay nhỏ để trigger animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const booking =
    bookingResult?.booking ||
    (bookingResult?.data?.booking || null) ||
    (bookingResult?._id ? bookingResult : null) ||
    {};
  const payment = bookingResult?.payment || bookingResult?.data?.payment || {};

  const movie = showtime?.movie || {};
  const theater = showtime?.theater || {};
  const room = showtime?.room || {};

  const dateString = showtime?.startTime
    ? new Date(showtime.startTime).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const timeString = showtime?.startTime
    ? new Date(showtime.startTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const totalPrice = booking?.totalPrice || 0;
  const transactionId = payment?.transactionId || booking?._id?.slice(-10).toUpperCase() || 'N/A';
  const paymentMethod = booking?.paymentMethod || 'card';

  const paymentMethodLabel = {
    card: 'Thẻ tín dụng / Ghi nợ',
    momo: 'Ví MoMo',
    vnpay: 'Ví VNPay',
  }[paymentMethod] || paymentMethod;

  const handleGoHistory = () => {
    onClose();
    navigate('/history');
  };

  const handleGoHome = () => {
    onClose();
    navigate('/');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleGoHome();
      }}
    >
      <div
        className={`relative bg-dark-card border border-dark-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden
          transition-all duration-500 ease-out
          ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8'}
        `}
      >
        {/* Decorative gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-brand to-emerald-500" />

        {/* Confetti / glow background */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative p-8 space-y-7">
          {/* Success icon */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                <CheckCircle size={44} className="text-emerald-400" strokeWidth={1.8} />
              </div>
              {/* Ping animation */}
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white">Đặt vé thành công! 🎉</h2>
              <p className="text-xs text-zinc-400 font-semibold">
                Email xác nhận đã được gửi đến hộp thư của bạn.
              </p>
            </div>
          </div>

          {/* Ticket details card */}
          <div className="bg-zinc-900/80 border border-dark-border rounded-2xl overflow-hidden">
            {/* Movie name header */}
            <div className="bg-gradient-to-r from-brand/10 to-transparent p-4 border-b border-dark-border/50">
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-brand shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Phim</p>
                  <p className="text-sm font-black text-zinc-100 leading-tight">{movie.title || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="divide-y divide-dark-border/30">
              <DetailRow
                icon={<MapPin size={13} className="text-brand" />}
                label="Rạp & Phòng"
                value={`${theater.name || 'N/A'} • ${room.name || ''} (${showtime?.format || ''})`}
              />
              <DetailRow
                icon={<Calendar size={13} className="text-brand" />}
                label="Thời gian"
                value={`${dateString} — ${timeString}`}
              />
              <DetailRow
                icon={<Ticket size={13} className="text-brand" />}
                label="Ghế đã chọn"
                value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(selectedSeats || booking?.seats || []).map((s) => {
                      const match = s.match(/^([A-Z]+)(\d+)$/);
                      let displaySeat = s;
                      if (match) {
                        const row = match[1];
                        const num = parseInt(match[2], 10);
                        
                        const capacity = room.capacity || 0;
                        const cols = capacity <= 30 ? 6 : capacity <= 60 ? 10 : 12;
                        const rowCount = Math.ceil(capacity / cols);
                        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                        const lastRowLetter = rowCount > 0 ? alphabet[rowCount - 1] : '';

                        if (row === lastRowLetter || room.type === 'GOLDCLASS') {
                          displaySeat = `${row}${num}-${row}${num + 1}`;
                        }
                      }
                      return (
                        <span
                          key={s}
                          className="bg-zinc-800 border border-zinc-700 text-brand font-black px-1.5 py-0.5 rounded text-[10px]"
                        >
                          {displaySeat}
                        </span>
                      );
                    })}
                  </div>
                }
              />
              <DetailRow
                icon={<CreditCard size={13} className="text-brand" />}
                label="Phương thức"
                value={paymentMethodLabel}
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand/5 to-transparent border-t border-dark-border/50">
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Receipt size={11} /> Mã giao dịch
                </p>
                <p className="text-xs font-black text-zinc-300 font-mono">{transactionId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tổng thanh toán</p>
                <p className="text-xl font-black text-emerald-400">{totalPrice.toLocaleString()} VND</p>
              </div>
            </div>
          </div>

          {/* Ticket QR Code */}
          <div className="flex flex-col items-center justify-center bg-zinc-900/60 border border-dark-border/60 rounded-2xl p-5 space-y-3">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center">
              Mã QR vé điện tử — Cho nhân viên quét khi vào rạp
            </p>
            <div className="bg-white p-3 rounded-2xl shadow-lg flex items-center justify-center w-40 h-40 border border-zinc-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  `${window.location.origin}/ticket/${booking?.ticketCode || booking?._id}`
                )}`}
                alt="Ticket QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Mã vé dạng text để nhân viên nhập tay nếu không quét được QR */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Mã vé</span>
              <span className="font-mono text-base font-black text-brand tracking-widest bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-lg select-all">
                {booking?.ticketCode || '---'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold text-center max-w-[240px] leading-relaxed">
              Hoặc nhập mã vé bên trên tại quầy nếu không quét được QR
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm font-bold transition-all"
            >
              <Home size={16} />
              Về trang chủ
            </button>
            <Button
              onClick={handleGoHistory}
              variant="primary"
              className="flex-1 py-3 rounded-2xl font-black text-sm"
              icon={<History size={16} />}
            >
              Xem lịch sử đặt vé
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper row component
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start justify-between gap-3 px-4 py-3">
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 mt-0.5">
      {icon}
      {label}
    </div>
    <div className="text-xs font-semibold text-zinc-300 text-right">{value}</div>
  </div>
);

export default BookingSuccessModal;
