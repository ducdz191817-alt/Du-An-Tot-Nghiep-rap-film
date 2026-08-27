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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleGoHome();
      }}
    >
      <div
        className={`relative bg-white dark:bg-[#131622] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col
          transition-all duration-300 ease-out
          ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {/* Decorative gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-brand to-emerald-500 shrink-0" />

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Success icon & header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle size={32} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Đặt vé thành công! 🎉</h2>
              <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium mt-0.5">
                Email xác nhận đã được gửi đến hộp thư của bạn.
              </p>
            </div>
          </div>

          {/* Ticket details card */}
          <div className="bg-gray-50 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden text-xs">
            {/* Movie header */}
            <div className="bg-gradient-to-r from-brand/15 to-transparent px-4 py-2.5 border-b border-gray-200 dark:border-zinc-800/60 flex items-center gap-2.5">
              <Ticket size={16} className="text-brand shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider block">Phim</span>
                <p className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight">{movie.title || 'N/A'}</p>
              </div>
            </div>

            {/* Detail rows */}
            <div className="divide-y divide-gray-200 dark:divide-zinc-800/50 text-xs">
              <DetailRow
                icon={<MapPin size={12} className="text-brand" />}
                label="Rạp & Phòng"
                value={`${theater.name || 'N/A'} • ${room.name && showtime?.format && room.name.toUpperCase().includes(showtime.format.toUpperCase()) ? room.name : `${room.name || ''}${showtime?.format ? ` (${showtime.format})` : ''}`}`}
              />
              <DetailRow
                icon={<Calendar size={12} className="text-brand" />}
                label="Thời gian"
                value={`${dateString} — ${timeString}`}
              />
              <DetailRow
                icon={<Ticket size={12} className="text-brand" />}
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
                icon={<CreditCard size={12} className="text-brand" />}
                label="Phương thức"
                value={paymentMethodLabel}
              />
            </div>

            {/* Total price footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-brand/5 border-t border-gray-200 dark:border-zinc-800/60">
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Receipt size={10} /> Mã GD
                </span>
                <span className="text-xs font-black text-gray-800 dark:text-zinc-300 font-mono">{transactionId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider block">Tổng tiền</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{totalPrice.toLocaleString()} VND</span>
              </div>
            </div>
          </div>

          {/* Ticket QR Code */}
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800/60 rounded-2xl p-3.5 space-y-2">
            <span className="text-[10px] text-gray-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-center">
              Mã QR vé điện tử — Quét khi vào rạp
            </span>
            <div className="bg-white p-2 rounded-xl shadow-md flex items-center justify-center w-32 h-32 border border-zinc-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                  `${window.location.origin}/ticket/${booking?.ticketCode || booking?._id}`
                )}`}
                alt="Ticket QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-semibold">Mã vé:</span>
              <span className="font-mono text-sm font-black text-brand tracking-widest bg-gray-200 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 px-2.5 py-0.5 rounded-md select-all">
                {booking?.ticketCode || '---'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all active:scale-95"
            >
              <Home size={14} />
              Về trang chủ
            </button>
            <Button
              onClick={handleGoHistory}
              variant="primary"
              className="flex-1 py-2.5 rounded-xl font-black text-xs"
              icon={<History size={14} />}
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
    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">
      {icon}
      {label}
    </div>
    <div className="text-xs font-semibold text-gray-800 dark:text-zinc-200 text-right">{value}</div>
  </div>
);

export default BookingSuccessModal;
