import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, Film, CreditCard, Receipt, Compass } from 'lucide-react';
import bookingService from '../services/booking.service';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

export const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await bookingService.getMyBookings();
        setBookings(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <Loading fullPage />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-16">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-2">
          <Receipt className="text-brand" size={28} /> Lịch sử đặt vé
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Xem lại vé đã đặt, đơn bắp nước và mã QR hóa đơn của bạn.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-dark-card border border-dashed border-dark-border rounded-3xl space-y-4">
          <Ticket size={48} className="text-zinc-700 mx-auto" />
          <p className="text-zinc-400 font-semibold text-sm">Bạn chưa đặt vé nào.</p>
          <a href="/" className="inline-block">
            <Button variant="primary" className="py-2.5 px-6 font-bold text-xs" icon={<Compass size={14} />}>
              Tìm phim
            </Button>
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const showtime = booking.showtime || {};
            const movie = showtime.movie || {};
            const theater = showtime.theater || {};
            const room = showtime.room || {};

            const dateString = new Date(showtime.startTime).toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            const timeString = new Date(showtime.startTime).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={booking._id}
                className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-md hover:border-brand/20 transition-all flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative overflow-hidden group"
              >
                {/* Visual Accent Glow */}
                <div className="absolute top-0 left-0 w-2.5 h-full bg-brand" />

                {/* Left: Film description summary */}
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-24 rounded-xl overflow-hidden bg-zinc-950 border border-dark-border shrink-0 hidden sm:block">
                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="space-y-1.5 pl-2 sm:pl-0">
                    <span className="text-[9px] font-black bg-brand px-2 py-0.5 rounded text-white uppercase tracking-wider">
                      {movie.rating}
                    </span>
                    <h3 className="text-lg font-black text-zinc-100 group-hover:text-brand transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
                      <MapPin size={13} className="text-brand shrink-0" />
                      {theater.name} &bull; {room.name} ({showtime.format})
                    </p>
                    <p className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1.5">
                      <Calendar size={13} />
                      {dateString} &bull; {timeString}
                    </p>
                  </div>
                </div>

                {/* Right: Booking codes and invoice sums */}
                <div className="w-full md:w-auto flex md:flex-col justify-between items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-dark-border/40 shrink-0">
                  <div className="text-left md:text-right space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Ghế đã đặt</span>
                    <span className="text-xs font-black text-zinc-200 bg-zinc-900 px-2 py-1 rounded border border-dark-border">
                      {booking.seats.join(', ')}
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Số tiền đã thanh toán</span>
                    <span className="text-sm font-black text-brand">{booking.totalPrice.toLocaleString('vi-VN')} VNĐ</span>
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

export default BookingHistoryPage;