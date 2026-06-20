import React, { useState, useEffect } from 'react';
import {
  Ticket, Calendar, MapPin, Receipt, Compass, ChevronDown, ChevronUp,
  CreditCard, ShoppingBag, Clock, Hash, Film,
} from 'lucide-react';
import bookingService from '../services/booking.service';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { getPosterUrl } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';

export const BookingHistoryPage = () => {
  const { language, t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  useEffect(() => {
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
    fetchHistory();
  }, []);

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
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20">Thất bại</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-16">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-2">
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
              ? (movie.titleEN || movie.title || t('history.movieDeleted'))
              : (movie.title || t('history.movieDeleted'));

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
              getPosterUrl(movie.posterUrl) || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=200';

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
                      <h3 className="text-lg font-black text-zinc-100 group-hover:text-brand transition-colors leading-tight">
                        {displayTitle}
                      </h3>
                      <p className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
                        <MapPin size={13} className="text-brand shrink-0" />
                        {theater.name || t('history.unknownTheater')} &bull; {room.name || t('history.unknownRoom')} (
                        {showtime.format || 'N/A'})
                      </p>
                      <p className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1.5">
                        <Calendar size={13} />
                        {dateString} &bull; {timeString}
                      </p>
                    </div>
                  </div>

                  {/* Right: Price + expand toggle */}
                  <div className="w-full md:w-auto flex md:flex-col justify-between items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-dark-border/40 shrink-0 pl-2">
                    <div className="text-right space-y-0.5">
                      <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">{t('history.totalPayment')}</span>
                      <span className="text-sm font-black text-brand">{priceFormatted} VNĐ</span>
                    </div>

                    <button
                      onClick={() => toggleExpand(booking._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-dark-border hover:border-zinc-600 transition-all active:scale-95"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={12} /> {t('history.collapse')}
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} /> {t('history.viewDetails')}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Expanded Detail Section ── */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-dark-border/50 mx-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 px-2">
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

                              if (row === lastRowLetter || room.type === 'GOLDCLASS') {
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
                              <li key={i} className="text-[11px] text-zinc-400 font-semibold">
                                {language === 'en' && c.concession?.nameEN
                                  ? c.concession.nameEN
                                  : (c.concession?.name || 'Concession')}{' '}
                                <span className="text-zinc-500">x{c.quantity}</span>
                                {c.concession?.price && (
                                  <span className="text-zinc-600 ml-1">
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
                        <p className="text-[11px] text-zinc-300 font-semibold mt-1">
                          {paymentMethodLabel(booking.paymentMethod)}
                        </p>
                      </DetailBlock>

                      {/* Mã đặt vé & ngày đặt */}
                      <DetailBlock
                        icon={<Hash size={14} className="text-zinc-400" />}
                        label={t('history.bookingId')}
                      >
                        <p className="text-[11px] font-mono text-zinc-300 mt-1">
                          {booking._id?.slice(-10).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {t('history.bookedAt')} {bookingDateString}
                        </p>
                      </DetailBlock>
                    </div>

                    {/* Footer tổng tiền */}
                    <div className="flex justify-between items-center mt-5 pt-4 border-t border-t-dark-border/30">
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Film size={13} /> {showtime.format || ''} &bull; {t(movie.language) || ''}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">{t('history.total')}</span>
                        <span className="text-base font-black text-brand">{priceFormatted} VNĐ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper component
const DetailBlock = ({ icon, label, children }) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
      {icon}
      {label}
    </div>
    {children}
  </div>
);

export default BookingHistoryPage;