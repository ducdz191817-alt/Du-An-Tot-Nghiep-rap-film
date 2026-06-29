import React, { useState, useEffect } from 'react';
import {
  Search, Ticket, Calendar, MapPin, User, RefreshCw,
  AlertCircle, ShoppingBag, X, Eye, CreditCard, Clock,
  Film, Building2, DoorOpen, Armchair, Popcorn, Receipt, CheckCircle2,
  Hourglass, Undo2,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';

export const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedBooking, setSelectedBooking] = useState(null); // Chi tiết hóa đơn

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBookings();
      const bookingsList = Array.isArray(data) ? data : (data?.data || []);
      setBookings(bookingsList);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Không thể tải danh sách vé đã đặt.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const showtime = b.showtime || {};
    const movie = showtime.movie || {};
    const user = b.user || {};
    const matchSearch =
      movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b._id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status, large = false) => {
    const base = large ? 'px-3 py-1.5 rounded-xl text-xs' : 'px-2.5 py-1 rounded-full text-[10px]';
    switch (status) {
      case 'paid':
        return (
          <span className={`${base} font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5`}>
            {large && <CheckCircle2 size={13} />} Đã thanh toán
          </span>
        );
      case 'pending':
        return (
          <span className={`${base} font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5`}>
            {large && <Hourglass size={13} />} Chờ thanh toán
          </span>
        );
      case 'refunded':
        return (
          <span className={`${base} font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5`}>
            {large && <Undo2 size={13} />} Đã hoàn tiền
          </span>
        );
      case 'failed':
        return (
          <span className={`${base} font-black uppercase bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1.5`}>
            {large && <X size={13} />} Thanh toán thất bại
          </span>
        );
      default:
        return (
          <span className={`${base} font-black uppercase bg-gray-100 text-gray-500 border border-gray-200`}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Ticket className="text-brand" size={20} /> Quản lý Đặt Vé của Khách hàng
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Click vào hàng để xem chi tiết hóa đơn. Giải phóng ghế hoặc hủy giao dịch khi cần thiết.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-550/500 hover:text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Toast Message */}
      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-brand/10 border-brand/20 text-brand'}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={18} />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters & search */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo Phim, Email, Tên hoặc Mã vé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand/40 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-44 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand/40 cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="paid">Đã thanh toán</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="refunded">Đã hoàn tiền</option>
        </select>
      </div>

      {/* Main Table */}
      {loading && bookings.length === 0 ? (
        <Loading />
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl space-y-4 shadow-sm">
          <Ticket size={48} className="text-gray-300 mx-auto" />
          <p className="text-gray-400 font-semibold text-xs">Không tìm thấy vé đặt nào trùng khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider bg-gray-50">
                  <th className="py-4 pl-6">Khách hàng</th>
                  <th className="py-4">Chi tiết Suất chiếu</th>
                  <th className="py-4">Ghế & Bắp nước</th>
                  <th className="py-4">Tổng tiền & Phương thức</th>
                  <th className="py-4">Trạng thái</th>
                  <th className="py-4 pr-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {filteredBookings.map((b) => {
                  const showtime = b.showtime || {};
                  const movie = showtime.movie || {};
                  const theater = showtime.theater || {};
                  const room = showtime.room || {};
                  const user = b.user || {};
                  const dateFormatted = showtime.startTime
                    ? new Date(showtime.startTime).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
                    : 'N/A';
                  const timeFormatted = showtime.startTime
                    ? new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : '--:--';

                  return (
                    <tr
                      key={b._id}
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      {/* Customer */}
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 group-hover:text-black transition-colors">{user.username || 'Khách vãng lai'}</div>
                            <div className="text-[10px] text-gray-400">{user.email || 'N/A'}</div>
                            {user.phone && <div className="text-[9px] text-gray-400 mt-0.5">{user.phone}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Showtime */}
                      <td className="py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-gray-800 max-w-[200px] truncate" title={movie.title}>
                            {movie.title || 'Phim đã bị xóa'}
                          </div>
                          <div className="text-[10px] text-gray-600 flex items-center gap-1">
                            <MapPin size={11} className="text-brand shrink-0" />
                            <span>{theater.name || 'N/A'} • {room.name || 'N/A'}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar size={11} />
                            <span>{dateFormatted} • {timeFormatted} ({showtime.format || 'N/A'})</span>
                          </div>
                        </div>
                      </td>

                      {/* Seats & concessions */}
                      <td className="py-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {(b.seats || []).map((s) => (
                              <span key={s} className="bg-gray-150 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-black text-brand text-[9px]">{s}</span>
                            ))}
                            {(b.seats || []).length === 0 && <span className="text-[10px] text-gray-450 italic">Không có ghế</span>}
                          </div>
                          {(b.concessions || []).length > 0 && (
                            <div className="flex items-start gap-1 text-[10px] text-gray-500">
                              <ShoppingBag size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                              <div className="max-w-[200px] truncate">
                                {b.concessions.map((c, idx) => (
                                  <span key={idx}>{c.concession?.name || 'Bắp nước'} (x{c.quantity}){idx < b.concessions.length - 1 ? ', ' : ''}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4">
                        <div className="space-y-0.5">
                          <div className="font-black text-gray-800">{(b.totalPrice || 0).toLocaleString()} VND</div>
                          <div className="text-[10px] text-gray-400 capitalize">
                            Mã: {b._id?.slice(-8).toUpperCase()} • {b.paymentMethod || 'card'}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4">{getStatusBadge(b.paymentStatus)}</td>

                      {/* Actions */}
                      <td className="py-4 pr-6 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); }}
                            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ BOOKING DETAIL MODAL ═══ */}
      {selectedBooking && (() => {
        const b = selectedBooking;
        const showtime = b.showtime || {};
        const movie = showtime.movie || {};
        const theater = showtime.theater || {};
        const room = showtime.room || {};
        const user = b.user || {};
        const startTime = showtime.startTime ? new Date(showtime.startTime) : null;
        const endTime = showtime.endTime ? new Date(showtime.endTime) : null;
        const bookingDate = b.bookingDate ? new Date(b.bookingDate) : null;

        const concessionsTotal = (b.concessions || []).reduce((sum, c) => {
          return sum + (c.concession?.price || 0) * c.quantity;
        }, 0);
        const seatsTotal = (b.totalPrice || 0) - concessionsTotal;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          >
            <div
              className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Chi tiết Hóa đơn</h3>
                    <p className="text-[10px] text-gray-500 font-mono">#{b._id?.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(b.paymentStatus, true)}
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Customer Info */}
                <section className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={11} /> Thông tin khách hàng
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-450 mb-0.5">Họ tên</p>
                      <p className="font-bold text-gray-800">{user.username || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-450 mb-0.5">Email</p>
                      <p className="font-bold text-gray-800 break-all">{user.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-450 mb-0.5">Số điện thoại</p>
                      <p className="font-bold text-gray-800">{user.phone || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <p className="text-gray-450 mb-0.5">Ngày đặt vé</p>
                      <p className="font-bold text-gray-800">
                        {bookingDate ? bookingDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Showtime Info */}
                <section className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Film size={11} /> Thông tin Suất chiếu
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <p className="text-gray-450 mb-0.5">Tên phim</p>
                      <p className="font-black text-gray-900 text-sm">{movie.title || 'Phim đã bị xóa'}</p>
                    </div>
                    <div>
                      <p className="text-gray-450 mb-0.5 flex items-center gap-1"><Building2 size={10} /> Rạp chiếu</p>
                      <p className="font-bold text-gray-800">{theater.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-450 mb-0.5 flex items-center gap-1"><DoorOpen size={10} /> Phòng chiếu</p>
                      <p className="font-bold text-gray-800">{room.name || 'N/A'} ({showtime.format || 'N/A'})</p>
                    </div>
                    <div>
                      <p className="text-gray-450 mb-0.5 flex items-center gap-1"><Clock size={10} /> Giờ bắt đầu</p>
                      <p className="font-bold text-gray-800">
                        {startTime ? startTime.toLocaleString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-450 mb-0.5 flex items-center gap-1"><Clock size={10} /> Giờ kết thúc</p>
                      <p className="font-bold text-gray-800">
                        {endTime ? endTime.toLocaleString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Seats */}
                <section className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Armchair size={11} /> Ghế đã đặt ({(b.seats || []).length} ghế)
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(b.seats || []).length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Không có ghế</span>
                    ) : (
                      (b.seats || []).map((s) => (
                        <span key={s} className="bg-brand/10 border border-brand/30 text-brand px-3 py-1 rounded-lg font-black text-xs">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </section>

                {/* Concessions */}
                {(b.concessions || []).length > 0 && (
                  <section className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Popcorn size={11} /> Đồ ăn uống
                    </h4>
                    <div className="space-y-2 pt-1">
                      {b.concessions.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                              <Popcorn size={10} className="text-emerald-600" />
                            </div>
                            <span className="text-gray-700 font-semibold">{c.concession?.name || 'Đồ ăn'}</span>
                            <span className="text-gray-400">x{c.quantity}</span>
                          </div>
                          <span className="font-bold text-gray-800">
                            {((c.concession?.price || 0) * c.quantity).toLocaleString()} VND
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Payment Summary */}
                <section className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard size={11} /> Thanh toán
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Tiền vé ({(b.seats || []).length} ghế)</span>
                      <span className="font-bold text-gray-800">{seatsTotal.toLocaleString()} VND</span>
                    </div>
                    {concessionsTotal > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Đồ ăn uống</span>
                        <span className="font-bold text-gray-800">{concessionsTotal.toLocaleString()} VND</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                      <span className="font-black text-gray-800 text-sm">Tổng cộng</span>
                      <span className="font-black text-brand text-lg">{(b.totalPrice || 0).toLocaleString()} VND</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Phương thức thanh toán</span>
                      <span className="font-bold text-gray-700 uppercase">{b.paymentMethod || 'card'}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default BookingManager;
