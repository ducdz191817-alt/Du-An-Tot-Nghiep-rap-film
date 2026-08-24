import React, { useState, useEffect } from 'react';
import {
  Ticket, Calendar, MapPin, Receipt, Compass, ChevronDown, ChevronUp,
  CreditCard, ShoppingBag, Clock, Hash, Film, Tag, Printer,
  QrCode, XCircle, Copy, AlertCircle, RefreshCw, CheckCircle2,
} from 'lucide-react';
import bookingService from '../services/booking.service';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { getPosterUrl } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';
import PrintTicketModal from '../components/Booking/PrintTicketModal';
import Toast from '../components/common/Toast';

export const BookingHistoryPage = () => {
  const { language, t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [ticketToPrint, setTicketToPrint] = useState(null);
  const [pendingPaymentBooking, setPendingPaymentBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  const fetchHistory = async () => {
    try {
      const result = await bookingService.getMyBookings();
      const bookingsList = Array.isArray(result) ? result : [];
      setBookings(bookingsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn hủy đơn đặt vé này? Các ghế bạn đang giữ sẽ được giải phóng ngay lập tức để người khác hoặc bạn có thể đặt lại.' : 'Are you sure you want to cancel this booking? Held seats will be released immediately.')) {
      return;
    }
    setCancellingId(bookingId);
    try {
      await bookingService.cancelBooking(bookingId);
      alert(language === 'vi' ? 'Đã hủy đơn đặt vé thành công! Ghế đã được giải phóng.' : 'Booking cancelled successfully! Seats released.');
      if (pendingPaymentBooking?._id === bookingId) {
        setPendingPaymentBooking(null);
      }
      await fetchHistory();
    } catch (err) {
      alert(`Hủy đơn thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <Loading fullPage />;

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const paymentMethodLabel = (method) => ({
    card: t('history.payment.card'),
    momo: t('history.payment.momo'),
    vnpay: t('history.payment.vnpay'),
  }[method] || method || 'N/A');

  const statusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t('history.status.paid')}</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">{t('history.status.pending')}</span>;
      case 'refunded':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">{t('history.status.refunded')}</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20">{t('history.status.failed')}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-16">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-zinc-900 flex items-center gap-2">
          <Receipt className="text-brand" size={28} /> {t('history.title')}
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          {t('history.subtitle')}
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-dark-card border border-dashed border-dark-border rounded-3xl space-y-4">
          <Ticket size={48} className="text-zinc-700 mx-auto" />
          <p className="text-zinc-400 font-semibold text-sm">{t('history.noBookings')}</p>
          <a href="/" className="inline-block">
            <Button variant="primary" className="py-2.5 px-6 font-bold text-xs" icon={<Compass size={14} />}>
              {t('history.findMovies')}
            </Button>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const showtime = booking.showtime || {};
            const movie = showtime.movie || {};
            const theater = showtime.theater || {};
            const room = showtime.room || {};
            const isExpanded = expandedId === booking._id;

            const displayTitle = language === 'en'
              ? (booking.movieTitle || movie.titleEN || movie.title || t('history.movieDeleted'))
              : (booking.movieTitle || movie.title || t('history.movieDeleted'));

            const dateString = showtime.startTime
              ? new Date(showtime.startTime).toLocaleDateString(locale, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : t('history.unknownTime');

            const timeString = showtime.startTime
              ? new Date(showtime.startTime).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--:--';

            const bookingDateString = booking.bookingDate
              ? new Date(booking.bookingDate).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A';

            const seatsList = (booking.seats || []).join(', ') || t('history.noSeats');
            const priceFormatted = (booking.totalPrice || 0).toLocaleString(locale);
            const posterImage =
              getPosterUrl(booking.moviePosterUrl || movie.posterUrl) || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=200';

            const discountAmount = booking.discountAmount || 0;
            const couponCode = booking.coupon?.code || (typeof booking.coupon === 'string' && !/^[0-9a-fA-F]{24}$/.test(booking.coupon) ? booking.coupon : null);
            const totalPrice = booking.totalPrice || 0;
            const originalTotal = totalPrice + discountAmount;

            const concessionSubtotal = (booking.concessions || []).reduce((acc, c) => {
              const price = c.concession?.price || 0;
              return acc + (price * (c.quantity || 0));
            }, 0);

            const ticketSubtotal = Math.max(0, originalTotal - concessionSubtotal);

            return (
              <div
                key={booking._id}
                className="bg-dark-card border border-dark-border rounded-3xl shadow-md hover:border-brand/20 transition-all overflow-hidden group"
              >
                {/* ── Main Row ── */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative p-6">
                  {/* Visual Accent */}
                  <div className="absolute top-0 left-0 w-2.5 h-full bg-brand" />

                  {/* Left: Film info */}
                  <div className="flex gap-4 items-center pl-2">
                    <div className="w-16 h-24 rounded-xl overflow-hidden bg-zinc-950 border border-dark-border shrink-0 hidden sm:block">
                      <img src={posterImage} alt={displayTitle} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black bg-brand px-2 py-0.5 rounded text-white uppercase tracking-wider">
                          {movie.rating || 'N/A'}
                        </span>
                        {statusBadge(booking.paymentStatus)}
                      </div>
                      <h3 className="text-lg font-black text-[#4a2b10] group-hover:text-brand transition-colors leading-tight">
                        {displayTitle}
                      </h3>
                      <p className="text-xs text-[#6b4728] font-bold flex items-center gap-1.5">
                        <MapPin size={13} className="text-brand shrink-0" />
                        {theater.name || t('history.unknownTheater')} &bull; {room.name && showtime.format && room.name.toUpperCase().includes(showtime.format.toUpperCase()) ? room.name : `${room.name || t('history.unknownRoom')}${showtime.format ? ` (${showtime.format})` : ''}`}
                      </p>
                      <p className="text-[11px] text-[#7a5230] font-semibold flex items-center gap-1.5">
                        <Calendar size={13} />
                        {dateString} &bull; {timeString}
                      </p>
                    </div>
                  </div>

                  {/* Right: Price + expand toggle */}
                  <div className="w-full md:w-auto flex md:flex-col justify-between items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-dark-border/40 shrink-0 pl-2">
                    <div className="text-right space-y-0.5">
                      <span className="text-[9px] text-[#7a5230] font-bold block uppercase tracking-wider">{t('history.totalPayment')}</span>
                      {discountAmount > 0 ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[11px] text-zinc-400 line-through font-semibold">{originalTotal.toLocaleString(locale)} đ</span>
                            <span className="text-sm font-black text-brand">{priceFormatted} VNĐ</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                            <Tag size={10} /> {language === 'vi' ? 'Đã giảm' : 'Saved'} {discountAmount.toLocaleString(locale)} đ{couponCode ? ` (${couponCode})` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-brand">{priceFormatted} VNĐ</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(booking._id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#3d2310] hover:bg-[#2a170a] border border-[#5c3a21] transition-all active:scale-95 shadow-sm"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} /> {t('history.collapse')}
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> {t('history.viewDetails')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Expanded Detail Section ── */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-dark-border/50 mx-4 mb-4">
                    {(() => {
                      const isPaid = booking.paymentStatus === 'paid';
                      const isPending = booking.paymentStatus === 'pending';
                      const hasRightCol = isPaid || isPending;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 px-2">
                          {/* Left: Ticket details (span 2 columns if paid/pending, span 3 otherwise) */}
                          <div className={`${hasRightCol ? 'md:col-span-2' : 'md:col-span-3'} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                            {/* Ghế đã đặt */}
                            <DetailBlock
                              icon={<Ticket size={14} className="text-brand" />}
                              label={t('history.selectedSeats')}
                            >
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(booking.seats || []).map((s) => {
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

                                    const seatDetail = (booking.seatDetails || []).find((d) => d.seatCode === s);
                                    const isCouple = seatDetail?.type === 'couple' || room.type === 'SWEETBOX' || room.type === 'GOLDCLASS' || row === lastRowLetter;

                                    if (isCouple) {
                                      displaySeat = `${row}${num}-${row}${num + 1}`;
                                    }
                                  }
                                  return (
                                    <span
                                      key={s}
                                      className="bg-zinc-900 border border-dark-border px-2 py-0.5 rounded font-black text-brand text-[10px]"
                                    >
                                      {displaySeat}
                                    </span>
                                  );
                                })}
                              </div>
                            </DetailBlock>

                            {/* Đồ ăn uống */}
                            {(booking.concessions || []).length > 0 && (
                              <DetailBlock
                                icon={<ShoppingBag size={14} className="text-emerald-500" />}
                                label={t('history.concessions')}
                              >
                                <ul className="mt-1 space-y-0.5">
                                  {booking.concessions.map((c, i) => (
                                    <li key={i} className="text-[11px] text-[#4a2b10] font-semibold">
                                      {language === 'en' && c.concession?.nameEN
                                        ? c.concession.nameEN
                                        : (c.concession?.name || 'Concession')}{' '}
                                      <span className="text-[#7a5230]">x{c.quantity}</span>
                                      {c.concession?.price && (
                                        <span className="text-[#8c5e38] ml-1">
                                          ({(c.concession.price * c.quantity).toLocaleString(locale)} VND)
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </DetailBlock>
                            )}

                            {/* Phương thức thanh toán */}
                            <DetailBlock
                              icon={<CreditCard size={14} className="text-blue-400" />}
                              label={t('history.paymentMethod')}
                            >
                              <p className="text-[11px] text-[#4a2b10] font-semibold mt-1">
                                {paymentMethodLabel(booking.paymentMethod)}
                              </p>
                            </DetailBlock>

                            {/* Mã đặt vé & ngày đặt */}
                            <DetailBlock
                              icon={<Hash size={14} className="text-[#7a5230]" />}
                              label={t('history.bookingId')}
                            >
                              <p className="text-[11px] font-mono text-[#4a2b10] font-bold mt-1">
                                {booking._id?.slice(-10).toUpperCase()}
                              </p>
                              <p className="text-[10px] text-[#7a5230] flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> {t('history.bookedAt')} {bookingDateString}
                              </p>
                            </DetailBlock>

                            {/* Chi tiết giá vé từng ghế & thanh toán */}
                            <div className="sm:col-span-2">
                              <DetailBlock
                                icon={<Receipt size={14} className="text-brand" />}
                                label={language === 'en' ? 'Seat Prices & Breakdown' : 'Chi tiết giá vé từng ghế & Thanh toán'}
                              >
                                <div className="mt-2 p-3 rounded-2xl bg-amber-500/5 border border-amber-900/10 space-y-2 text-[11px]">
                                  {/* Danh sách từng ghế */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-[#7a5230] uppercase tracking-wider block">
                                      Giá vé từng ghế ({(booking.seats || []).length} ghế):
                                    </span>
                                    {(() => {
                                      const basePrice = showtime.ticketPrice || showtime.price || 0;
                                      const roomSeats = room.seats || [];
                                      const seats = booking.seats || [];
                                      const seatDetails = booking.seatDetails || [];
                                      
                                      const seatList = seats.map((seatCode) => {
                                        // 1. Kiểm tra snapshot seatDetails lưu trong database
                                        const detail = seatDetails.find((d) => d.seatCode === seatCode);
                                        if (detail) {
                                          const typeLabel = detail.type === 'couple' ? 'Ghế đôi' : detail.type === 'vip' ? 'Ghế VIP' : 'Ghế thường';
                                          return { seatCode, seatType: detail.type, typeLabel, price: detail.price };
                                        }

                                        // 2. Dự phòng cho các đơn hàng cũ
                                        const match = seatCode.match(/^([A-Z]+)(\d+)$/);
                                        let seatType = room.type === 'SWEETBOX' ? 'couple' : 'standard';
                                        let extraPrice = 0;
                                        let multiplier = seatType === 'couple' ? 2 : 1;

                                        if (match) {
                                          const rName = match[1];
                                          const num = parseInt(match[2], 10);
                                          const found = roomSeats.find((s) => s.row === rName && s.number === num);
                                          if (found) {
                                            seatType = found.type || seatType;
                                            extraPrice = found.price || 0;
                                            multiplier = seatType === 'couple' ? 2 : 1;
                                          }
                                        }

                                        let calculatedPrice = 0;
                                        if (basePrice > 0) {
                                          calculatedPrice = (basePrice * multiplier) + extraPrice;
                                        } else {
                                          calculatedPrice = Math.round(ticketSubtotal / (seats.length || 1));
                                        }

                                        const typeLabel = seatType === 'couple' ? 'Ghế đôi' : seatType === 'vip' ? 'Ghế VIP' : 'Ghế thường';
                                        return { seatCode, seatType, typeLabel, price: calculatedPrice };
                                      });

                                      return seatList.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[#6b4728] pl-1">
                                          <span>
                                            Ghế <strong className="text-[#4a2b10] font-black">{item.seatCode}</strong> ({item.typeLabel})
                                          </span>
                                          <span className="font-bold text-[#4a2b10]">{item.price.toLocaleString(locale)} VNĐ</span>
                                        </div>
                                      ));
                                    })()}
                                  </div>

                                  {/* Tổng kết tiền */}
                                  <div className="pt-2 border-t border-amber-900/10 space-y-1">
                                    <div className="flex justify-between items-center text-[#6b4728]">
                                      <span>Tổng tiền vé</span>
                                      <span className="font-bold text-[#4a2b10]">{ticketSubtotal.toLocaleString(locale)} VNĐ</span>
                                    </div>
                                    {concessionSubtotal > 0 && (
                                      <div className="flex justify-between items-center text-[#6b4728]">
                                        <span>Đồ ăn & Bắp nước</span>
                                        <span className="font-bold text-[#4a2b10]">{concessionSubtotal.toLocaleString(locale)} VNĐ</span>
                                      </div>
                                    )}
                                    {discountAmount > 0 && (
                                      <div className="flex justify-between items-center text-[#6b4728] pt-1 border-t border-amber-900/10">
                                        <span>Tổng tạm tính (trước giảm)</span>
                                        <span className="font-bold text-[#4a2b10]">{originalTotal.toLocaleString(locale)} VNĐ</span>
                                      </div>
                                    )}
                                    {discountAmount > 0 && (
                                      <div className="flex justify-between items-center text-emerald-700 font-bold">
                                        <span className="flex items-center gap-1">
                                          <Tag size={12} />
                                          Mã giảm giá áp dụng {couponCode ? `(${couponCode})` : ''}
                                        </span>
                                        <span>-{discountAmount.toLocaleString(locale)} VNĐ</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center text-xs font-black text-[#4a2b10] pt-1.5 border-t border-amber-900/20">
                                      <span>Thực thanh toán (sau áp mã)</span>
                                      <span className="text-brand text-sm">{priceFormatted} VNĐ</span>
                                    </div>
                                  </div>
                                </div>
                              </DetailBlock>
                            </div>
                          </div>

                          {/* Right: Unique QR Code for paid bookings */}
                          {isPaid && (
                            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dark-border/40 pt-5 md:pt-0 md:pl-6 space-y-2.5">
                              <div className="bg-white p-2 rounded-2xl shadow-lg flex items-center justify-center w-36 h-36 border border-zinc-200">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                    `CINEADMIN TICKET\nMã vé: ${booking.ticketCode || booking._id?.slice(-10).toUpperCase()}\nPhim: ${displayTitle}\nRạp: ${theater.name || 'N/A'} - ${room.name || 'N/A'}\nGhế: ${booking.seats?.join(', ')}\nSuất chiếu: ${timeString} - ${dateString}\nTrạng thái: ĐÃ THANH TOÁN`
                                  )}`}
                                  alt="Ticket QR Code"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <p className="text-[10px] text-[#6b4728] font-bold uppercase tracking-wider text-center max-w-[180px] leading-relaxed">
                                Đưa mã này cho nhân viên soát vé để vào rạp
                              </p>
                            </div>
                          )}

                          {/* Right: Action Box for PENDING bookings */}
                          {isPending && (
                            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-dark-border/40 pt-5 md:pt-0 md:pl-6 space-y-3">
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                                  <Clock size={20} className="animate-pulse" />
                                </div>
                                <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                  {language === 'vi' ? 'Chờ thanh toán' : 'Awaiting Payment'}
                                </h4>
                                <p className="text-[11px] text-[#7a5230] dark:text-zinc-400 leading-relaxed font-medium">
                                  {language === 'vi'
                                    ? 'Ghế của bạn đang được tạm giữ. Vui lòng thanh toán để nhận vé vào rạp.'
                                    : 'Seats are temporarily held. Please complete payment to confirm.'}
                                </p>
                              </div>

                              <div className="space-y-2 pt-1">
                                <button
                                  onClick={() => setPendingPaymentBooking(booking)}
                                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all shadow-md shadow-amber-600/30 flex items-center justify-center gap-2"
                                >
                                  <CreditCard size={15} />
                                  {language === 'vi' ? 'Tiếp tục thanh toán' : 'Pay Now'}
                                </button>
                                
                                <button
                                  onClick={() => handleCancelBooking(booking._id)}
                                  disabled={cancellingId === booking._id}
                                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <XCircle size={14} />
                                  {cancellingId === booking._id
                                    ? (language === 'vi' ? 'Đang hủy đơn...' : 'Cancelling...')
                                    : (language === 'vi' ? 'Hủy đơn & nhả ghế' : 'Cancel & Release Seats')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Footer tổng tiền */}
                    <div className="flex justify-between items-center mt-5 pt-4 border-t border-t-dark-border/30">
                      <span className="text-xs text-[#7a5230] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Film size={13} /> {showtime.format || ''} &bull; {t(movie.language) || ''}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-[#7a5230] block uppercase tracking-wider font-bold">{t('history.total')}</span>
                        {discountAmount > 0 ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-zinc-400 line-through font-bold">{originalTotal.toLocaleString(locale)} đ</span>
                            <span className="text-base font-black text-brand">{priceFormatted} VNĐ</span>
                          </div>
                        ) : (
                          <span className="text-base font-black text-brand">{priceFormatted} VNĐ</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ticketToPrint && (
        <PrintTicketModal
          booking={ticketToPrint}
          onClose={() => setTicketToPrint(null)}
        />
      )}

      {pendingPaymentBooking && (
        <PendingPaymentModal
          booking={pendingPaymentBooking}
          onClose={() => setPendingPaymentBooking(null)}
          onCancel={handleCancelBooking}
          onSuccess={async () => {
            alert(language === 'vi' ? 'Thanh toán thành công! Vé của bạn đã được xác nhận.' : 'Payment successful! Your ticket has been confirmed.');
            setPendingPaymentBooking(null);
            await fetchHistory();
          }}
        />
      )}
    </div>
  );
};

// Pending Payment Modal for VietQR / MoMo in History Page
const PendingPaymentModal = ({ booking, onClose, onCancel, onSuccess }) => {
  const { language } = useLanguage();
  const [copyStatus, setCopyStatus] = useState('');
  const [checking, setChecking] = useState(false);

  const bankId = 'TCB';
  const accountNo = '19073206758013';
  const accountName = 'NGUYEN MINH DUC';
  const addInfo = `NOVA${(booking._id || '').slice(-6).toUpperCase()}`;
  const amount = booking.totalPrice || 0;
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(accountName)}`;

  // Polling check payment status
  useEffect(() => {
    const pollId = setInterval(async () => {
      try {
        const result = await bookingService.getBookingById(booking._id);
        const currentBooking = result.data?.booking || result.booking || result;
        if (currentBooking && currentBooking.paymentStatus === 'paid') {
          clearInterval(pollId);
          onSuccess();
        }
      } catch (err) {
        console.error('Polling check status error:', err);
      }
    }, 3000);

    return () => clearInterval(pollId);
  }, [booking._id, onSuccess]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const result = await bookingService.getBookingById(booking._id);
      const currentBooking = result.data?.booking || result.booking || result;
      if (currentBooking && currentBooking.paymentStatus === 'paid') {
        onSuccess();
      } else {
        setToast({
          show: true,
          message: language === 'vi' ? 'Hệ thống chưa nhận được giao dịch. Vui lòng thử lại sau vài giây hoặc kiểm tra nội dung chuyển khoản.' : 'Payment not detected yet. Please try again shortly.',
          type: 'warning',
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        show: true,
        message: err.message || 'Lỗi kiểm tra thanh toán',
        type: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121622] border border-dark-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="px-6 pt-6 flex justify-between items-center border-b border-dark-border/40 pb-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <QrCode className="text-brand" size={24} /> {language === 'vi' ? 'Thanh toán chuyển khoản VietQR' : 'VietQR Payment'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {language === 'vi' ? 'Mã đơn: ' : 'Booking ID: '}
              <span className="font-mono font-bold text-brand">{booking._id?.slice(-10).toUpperCase()}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <XCircle size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* QR Box */}
          <div className="flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-dashed border-dark-border/70 space-y-2">
            <div className="bg-white p-3 rounded-2xl shadow-md border border-zinc-200">
              <img
                src={qrUrl}
                alt="VietQR Code"
                className="w-56 h-56 object-contain"
              />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium text-center max-w-xs">
              {language === 'vi' ? 'Quét mã bằng App Ngân hàng bất kỳ để tự động điền thông tin' : 'Scan with any banking app'}
            </p>
          </div>

          {/* Transfer Info Breakdown */}
          <div className="bg-zinc-100 dark:bg-zinc-900/80 rounded-2xl p-4 divide-y divide-zinc-200 dark:divide-zinc-800 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2">
              <span className="text-zinc-500 font-semibold">{language === 'vi' ? 'Ngân hàng' : 'Bank'}</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-100">{bankId} (Vietcombank)</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-500 font-semibold">{language === 'vi' ? 'Số tài khoản' : 'Account No'}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-zinc-900 dark:text-white text-sm">{accountNo}</span>
                <button
                  onClick={() => copyToClipboard(accountNo, 'acc')}
                  className="p-1 text-zinc-500 hover:text-brand transition-colors"
                  title="Copy"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-500 font-semibold">{language === 'vi' ? 'Chủ tài khoản' : 'Account Name'}</span>
              <span className="font-bold uppercase text-zinc-900 dark:text-white">{accountName}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-500 font-semibold">{language === 'vi' ? 'Số tiền' : 'Amount'}</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-brand text-sm">{amount.toLocaleString()} VND</span>
                <button
                  onClick={() => copyToClipboard(amount.toString(), 'amount')}
                  className="p-1 text-zinc-500 hover:text-brand transition-colors"
                  title="Copy"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-zinc-500 font-semibold">{language === 'vi' ? 'Nội dung chuyển' : 'Transfer Note'}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {addInfo}
                </span>
                <button
                  onClick={() => copyToClipboard(addInfo, 'note')}
                  className="p-1 text-zinc-500 hover:text-brand transition-colors"
                  title="Copy"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          {copyStatus && (
            <p className="text-center text-xs text-emerald-500 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 size={13} /> {language === 'vi' ? 'Đã sao chép vào bộ nhớ tạm!' : 'Copied to clipboard!'}
            </p>
          )}

          {/* Auto status notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <RefreshCw size={15} className="shrink-0 mt-0.5 animate-spin text-amber-500" />
            <p className="leading-relaxed">
              {language === 'vi'
                ? 'Hệ thống đang tự động kiểm tra giao dịch của bạn. Khi chuyển khoản xong, vé sẽ tự động duyệt ngay lập tức!'
                : 'System is automatically checking your payment. Your booking will be confirmed immediately once received!'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-3 border-t border-dark-border/40 flex items-center justify-between gap-3">
          <button
            onClick={() => onCancel(booking._id)}
            className="text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            {language === 'vi' ? 'Hủy đơn này' : 'Cancel Booking'}
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="text-xs py-2 px-4"
              onClick={handleManualCheck}
              disabled={checking}
            >
              {checking ? (language === 'vi' ? 'Đang kiểm tra...' : 'Checking...') : (language === 'vi' ? 'Tôi đã chuyển khoản' : 'I have paid')}
            </Button>
            <Button
              variant="primary"
              className="text-xs py-2 px-4"
              onClick={onClose}
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </Button>
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast({ show: false, message: '', type: 'warning' })}
        />
      )}
    </div>
  );
};

// Helper component
const DetailBlock = ({ icon, label, children }) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1.5 text-[10px] text-[#6b4728] font-bold uppercase tracking-wider">
      {icon}
      {label}
    </div>
    {children}
  </div>
);

export default BookingHistoryPage;