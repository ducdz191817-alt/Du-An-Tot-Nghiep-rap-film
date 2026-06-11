import React, { useState, useEffect } from 'react';
import { Search, Trash2, Ticket, Calendar, MapPin, User, RefreshCw, AlertCircle, ShoppingBag, Info, X } from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';
import Button from '../common/Button';

export const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

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

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await adminService.deleteBooking(id);
      setMessage({ text: 'Xóa vé đặt và giải phóng ghế thành công!', type: 'success' });
      setConfirmDeleteId(null);
      fetchBookings();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'Lỗi khi xóa vé đặt.', type: 'error' });
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Đã thanh toán
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Chờ thanh toán
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Đã hoàn tiền
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
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
          <h3 className="text-lg font-black text-zinc-200 flex items-center gap-2">
            <Ticket className="text-brand" size={20} /> Quản lý Đặt Vé của Khách hàng
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Tra cứu thông tin chi tiết các vé đặt, giải phóng ghế trống hoặc hủy/xóa giao dịch khi cần thiết.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-dark-border hover:border-zinc-700 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Toast Message */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-brand/10 border-brand/20 text-brand'
            }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={18} />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-zinc-500 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters & search panel */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Tìm theo Phim, Email, Tên hoặc Mã vé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-dark-border rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand/40 transition-colors"
          />
        </div>
        {/* Dropdown status */}
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-44 bg-[#0a0a0c] border border-dark-border rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-400 focus:outline-none focus:border-brand/40 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading && bookings.length === 0 ? (
        <Loading />
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-dark-card border border-dashed border-dark-border rounded-3xl space-y-4">
          <Ticket size={48} className="text-zinc-800 mx-auto" />
          <p className="text-zinc-500 font-semibold text-xs">Không tìm thấy vé đặt nào trùng khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-dark-border text-zinc-500 text-xs font-bold uppercase tracking-wider bg-[#0a0a0c]/60">
                  <th className="py-4 pl-6">Khách hàng</th>
                  <th className="py-4">Chi tiết Suất chiếu</th>
                  <th className="py-4">Ghế & Bắp nước</th>
                  <th className="py-4">Tổng tiền & Phương thức</th>
                  <th className="py-4">Trạng thái</th>
                  <th className="py-4 pr-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs font-semibold text-zinc-300">
                {filteredBookings.map((b) => {
                  const showtime = b.showtime || {};
                  const movie = showtime.movie || {};
                  const theater = showtime.theater || {};
                  const room = showtime.room || {};
                  const user = b.user || {};

                  const dateFormatted = showtime.startTime
                    ? new Date(showtime.startTime).toLocaleDateString('vi-VN', {
                      month: 'short',
                      day: 'numeric',
                    })
                    : 'N/A';
                  const timeFormatted = showtime.startTime
                    ? new Date(showtime.startTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : '--:--';

                  return (
                    <tr key={b._id} className="hover:bg-zinc-800/10 transition-colors">
                      {/* Customer info */}
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200">{user.username || 'Khách vãng lai'}</div>
                            <div className="text-[10px] text-zinc-500">{user.email || 'N/A'}</div>
                            {user.phone && <div className="text-[9px] text-zinc-600 mt-0.5">{user.phone}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Showtime details */}
                      <td className="py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-zinc-200 max-w-[200px] truncate" title={movie.title}>
                            {movie.title || 'Phim đã bị xóa'}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <MapPin size={11} className="text-brand shrink-0" />
                            <span>{theater.name || 'N/A'} &bull; {room.name || 'N/A'}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Calendar size={11} />
                            <span>{dateFormatted} &bull; {timeFormatted} ({showtime.format || 'N/A'})</span>
                          </div>
                        </div>
                      </td>

                      {/* Seats & concessions */}
                      <td className="py-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {(b.seats || []).map((s) => (
                              <span
                                key={s}
                                className="bg-zinc-900 border border-dark-border px-1.5 py-0.5 rounded font-black text-brand text-[9px]"
                              >
                                {s}
                              </span>
                            ))}
                            {(b.seats || []).length === 0 && (
                              <span className="text-[10px] text-zinc-500 italic">Không có ghế</span>
                            )}
                          </div>

                          {/* Concessions list */}
                          {(b.concessions || []).length > 0 && (
                            <div className="flex items-start gap-1 text-[10px] text-zinc-400">
                              <ShoppingBag size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                              <div className="max-w-[200px] truncate" title={b.concessions.map(c => `${c.concession?.name || 'Đồ ăn'} x${c.quantity}`).join(', ')}>
                                {b.concessions.map((c, idx) => (
                                  <span key={idx}>
                                    {c.concession?.name || 'Bắp nước'} (x{c.quantity})
                                    {idx < b.concessions.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total price & payment method */}
                      <td className="py-4">
                        <div className="space-y-0.5">
                          <div className="font-black text-zinc-200">{(b.totalPrice || 0).toLocaleString()} VND</div>
                          <div className="text-[10px] text-zinc-500 capitalize">
                            Mã: {b._id?.slice(-8).toUpperCase()} &bull; {b.paymentMethod || 'card'}
                          </div>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-4">{getStatusBadge(b.paymentStatus)}</td>

                      {/* Actions */}
                      <td className="py-4 pr-6 text-center">
                        <button
                          onClick={() => setConfirmDeleteId(b._id)}
                          className="p-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/40 text-brand rounded-xl transition-all duration-300 transform active:scale-95 inline-flex items-center justify-center"
                          title="Xóa vé này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6 transform scale-100 transition-transform">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-white text-base">Xác nhận xóa đặt vé?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Hành động này sẽ xóa vĩnh viễn giao dịch đặt vé mã <span className="font-mono text-brand font-bold">{confirmDeleteId.slice(-8).toUpperCase()}</span>.
                </p>
                <div className="bg-zinc-900 border border-dark-border p-2.5 rounded-xl flex items-start gap-2 mt-2">
                  <Info size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Các ghế tương ứng trong Suất chiếu sẽ được giải phóng lập tức và các bản ghi Thanh toán liên quan cũng sẽ bị gỡ bỏ.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={deleting}
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                disabled={deleting}
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(229,9,20,0.3)] disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Đang xóa...
                  </>
                ) : (
                  'Đồng ý xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;
