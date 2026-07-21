import React, { useState, useEffect } from 'react';
import {
  Search, Ticket, Calendar, MapPin, User, RefreshCw,
  AlertCircle, ShoppingBag, X, Eye, CreditCard, Clock,
  Film, Building2, DoorOpen, Armchair, Popcorn, Receipt, CheckCircle2,
  Hourglass, Undo2, Printer, QrCode, History, Check, XCircle, Download,
  Filter, Smartphone, Trash2, Camera
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';

const fmt = (val) => (val || 0).toLocaleString('vi-VN') + 'đ';

export const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Modals & Active Views
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'checkin'
  const [selectedBooking, setSelectedBooking] = useState(null); // Detail drawer
  const [printHistoryBooking, setPrintHistoryBooking] = useState(null); // Print history modal
  const [ticketToPrint, setTicketToPrint] = useState(null); // Printable ticket modal

  // Check-in state
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInResult, setCheckInResult] = useState(null); // { success: boolean, isAlreadyCheckedIn: boolean, data: object, message: string }
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBookings();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setBookings(list);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Không thể tải danh sách vé.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    const showtime = b.showtime || {};
    const movie = showtime.movie || {};
    const user = b.user || {};
    const code = (b.ticketCode || b._id || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchSearch =
      movie.title?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.phone?.includes(search) ||
      code.includes(search);

    // Status filter matching UI labels
    let matchStatus = true;
    if (filterStatus === 'issued') matchStatus = b.paymentStatus === 'paid' && !b.isCheckedIn;
    else if (filterStatus === 'checked_in') matchStatus = b.isCheckedIn;
    else if (filterStatus === 'pending') matchStatus = b.paymentStatus === 'pending';
    else if (filterStatus === 'cancelled') matchStatus = b.paymentStatus === 'refunded' || b.paymentStatus === 'failed';

    let matchDate = true;
    if (filterDate && b.bookingDate) {
      const bDate = new Date(b.bookingDate).toISOString().slice(0, 10);
      matchDate = bDate === filterDate;
    }

    return matchSearch && matchStatus && matchDate;
  });

  // Action: Print ticket
  const handlePrintTicket = async (booking) => {
    try {
      const res = await adminService.printTicket(booking._id);
      const updated = res.data || res;
      setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      if (selectedBooking?._id === updated._id) setSelectedBooking(updated);
      setTicketToPrint(updated); // Open print modal
      setMessage({ text: `Đã in vé cho ${updated.ticketCode || 'vé đặt'}`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'Lỗi khi in vé', type: 'error' });
    }
  };

  // Action: Check-in ticket
  const handlePerformCheckIn = async (codeOrId) => {
    if (!codeOrId) return;
    setIsCheckingIn(true);
    try {
      const res = await adminService.checkInTicket({ ticketCode: codeOrId, bookingId: codeOrId });
      const bookingObj = res?.data ?? res;
      setCheckInResult({
        success: true,
        isAlreadyCheckedIn: false,
        data: bookingObj,
        message: res?.message || 'CHECK-IN THÀNH CÔNG',
      });
      fetchBookings();
    } catch (err) {
      console.error(err);
      // Backend status 400 for already checked in
      const resData = err.response?.data || {};
      if (resData.isAlreadyCheckedIn) {
        setCheckInResult({
          success: false,
          isAlreadyCheckedIn: true,
          data: resData.data,
          message: 'VÉ ĐÃ ĐƯỢC SỬ DỤNG',
        });
      } else {
        setCheckInResult({
          success: false,
          isAlreadyCheckedIn: false,
          data: null,
          message: err.message || 'Mã vé không hợp lệ hoặc vé chưa được thanh toán',
        });
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Action: Delete booking
  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy / xóa đơn đặt vé này? Ghế sẽ được giải phóng.')) return;
    try {
      await adminService.deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b._id !== id));
      if (selectedBooking?._id === id) setSelectedBooking(null);
      setMessage({ text: 'Đã xóa đơn đặt vé và giải phóng ghế thành công.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message || 'Lỗi khi xóa vé', type: 'error' });
    }
  };

  // Badges rendering
  const renderTicketStatusBadge = (b) => {
    if (b.paymentStatus === 'pending') {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">CHỜ THANH TOÁN</span>;
    }
    if (b.paymentStatus === 'refunded' || b.paymentStatus === 'failed') {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200">ĐÃ HỦY</span>;
    }
    if (b.isCheckedIn) {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">ĐÃ CHECK-IN</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">ĐÃ PHÁT HÀNH</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-gray-200 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <Ticket size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Quản Lý Vé & Check-in</h3>
            <p className="text-xs text-gray-500">Kiểm tra trạng thái in vé, soát vé check-in và lịch sử giao dịch.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Ticket size={15} /> Danh sách vé
          </button>
          <button
            onClick={() => { setActiveTab('checkin'); setCheckInResult(null); setCheckInInput(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'checkin' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <QrCode size={15} /> Kiểm tra vé (Check-in)
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertCircle size={16} />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-gray-400 hover:text-gray-600">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: DANH SÁCH VÉ                                                      */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center shadow-sm">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Nhập mã vé (VD: TKT-250721-0001), tên khách hàng, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-brand"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="issued">Đã phát hành</option>
                <option value="checked_in">Đã check-in</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              <button
                onClick={fetchBookings}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all active:scale-95"
                title="Tải lại"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Main Table */}
          {loading && bookings.length === 0 ? (
            <Loading />
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl space-y-3">
              <Ticket size={40} className="text-gray-300 mx-auto" />
              <p className="text-gray-400 font-bold text-xs">Không tìm thấy vé trùng khớp với điều kiện lọc.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider bg-gray-50">
                      <th className="py-3.5 pl-6">Mã vé</th>
                      <th className="py-3.5">Khách hàng</th>
                      <th className="py-3.5">Phim</th>
                      <th className="py-3.5">Suất chiếu</th>
                      <th className="py-3.5">Ghế</th>
                      <th className="py-3.5">Tổng tiền</th>
                      <th className="py-3.5">Trạng thái vé</th>
                      <th className="py-3.5">Đã in</th>
                      <th className="py-3.5">Check-in</th>
                      <th className="py-3.5 pr-6 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                    {filteredBookings.map((b) => {
                      const showtime = b.showtime || {};
                      const movie = showtime.movie || {};
                      const room = showtime.room || {};
                      const user = b.user || {};
                      const dateFormatted = showtime.startTime
                        ? new Date(showtime.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : 'N/A';
                      const timeFormatted = showtime.startTime
                        ? new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '--:--';

                      const code = b.ticketCode || `TKT-${String(b._id).slice(-8).toUpperCase()}`;

                      return (
                        <tr
                          key={b._id}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                          onClick={() => setSelectedBooking(b)}
                        >
                          {/* Mã vé */}
                          <td className="py-3.5 pl-6 font-mono font-bold text-brand group-hover:underline">
                            {code}
                          </td>

                          {/* Khách hàng */}
                          <td className="py-3.5">
                            <div className="font-bold text-gray-800">{user.username || 'Khách vãng lai'}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{user.phone || user.email || 'N/A'}</div>
                          </td>

                          {/* Phim */}
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-800 line-clamp-1 max-w-[160px]">{movie.title || 'Phim đã xóa'}</span>
                              {showtime.format && (
                                <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shrink-0">{showtime.format}</span>
                              )}
                            </div>
                          </td>

                          {/* Suất chiếu */}
                          <td className="py-3.5 text-gray-600">
                            <div>{dateFormatted}</div>
                            <div className="text-[10px] text-gray-400 font-bold">{timeFormatted} - {room.name || 'Phòng chiếu'}</div>
                          </td>

                          {/* Ghế */}
                          <td className="py-3.5 font-bold text-brand">
                            {(b.seats || []).join(', ')}
                          </td>

                          {/* Tổng tiền */}
                          <td className="py-3.5 font-black text-gray-900">
                            {fmt(b.totalPrice)}
                          </td>

                          {/* Trạng thái vé */}
                          <td className="py-3.5">{renderTicketStatusBadge(b)}</td>

                          {/* Đã in */}
                          <td className="py-3.5">
                            {b.isPrinted ? (
                              <span className="text-emerald-600 font-extrabold flex items-center gap-1"><Printer size={13} /> Đã in</span>
                            ) : (
                              <span className="text-gray-400 font-normal">Chưa in</span>
                            )}
                          </td>

                          {/* Check-in */}
                          <td className="py-3.5">
                            {b.isCheckedIn ? (
                              <span className="text-emerald-600 font-extrabold flex items-center gap-1"><CheckCircle2 size={13} /> Đã quét</span>
                            ) : (
                              <span className="text-red-500 font-normal">Chưa quét</span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 pr-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1"
                            >
                              <Eye size={13} /> Xem
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
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: KIỂM TRA VÉ (CHECK-IN QUÉT QR)                                    */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'checkin' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Khung quét mã / Nhập mã vé */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="space-y-1">
                <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <QrCode size={18} className="text-brand" /> Check-in Vé (Quét QR / Nhập Mã)
                </h4>
                <p className="text-xs text-gray-500">Đưa mã QR của khách hàng vào khung quét hoặc nhập thủ công mã vé bên dưới.</p>
              </div>

              {/* Khung camera mô phỏng */}
              <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-zinc-800 shadow-inner group">
                <div className="absolute inset-6 border-2 border-dashed border-emerald-500/60 rounded-xl flex items-center justify-center pointer-events-none">
                  <div className="w-full h-0.5 bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse" />
                </div>
                <Camera size={32} className="text-zinc-600 mb-2" />
                <span className="text-[11px] font-bold text-zinc-400">Đưa mã QR vào khung để quét</span>
              </div>

              {/* Nhập mã thủ công */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Hoặc nhập mã vé</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã vé (VD: TKT-250721-0001)"
                    value={checkInInput}
                    onChange={(e) => setCheckInInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePerformCheckIn(checkInInput)}
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:border-brand"
                  />
                  <button
                    onClick={() => handlePerformCheckIn(checkInInput)}
                    disabled={isCheckingIn || !checkInInput.trim()}
                    className="px-5 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isCheckingIn ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </button>
                </div>
              </div>
            </div>

            {/* Màn hình kết quả Check-in */}
            <div>
              {checkInResult === null ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center space-y-3">
                  <QrCode size={48} className="text-gray-300 mx-auto" />
                  <p className="text-gray-400 text-xs font-semibold">Kết quả kiểm tra vé sẽ hiển thị tại đây sau khi quét hoặc nhập mã.</p>
                </div>
              ) : checkInResult.success ? (
                /* 🟢 CHECK-IN THÀNH CÔNG */
                <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                      <Check size={36} strokeWidth={3} />
                    </div>
                    <h4 className="text-lg font-black text-emerald-700 uppercase tracking-wider">CHECK-IN THÀNH CÔNG</h4>
                  </div>

                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Mã vé:</span>
                      <span className="font-mono font-black text-gray-900">{checkInResult.data?.ticketCode}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Phim:</span>
                      <span className="font-bold text-gray-900">{checkInResult.data?.showtime?.movie?.title}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Suất chiếu:</span>
                      <span className="font-bold text-gray-900">
                        {checkInResult.data?.showtime?.startTime ? new Date(checkInResult.data.showtime.startTime).toLocaleString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Phòng chiếu:</span>
                      <span className="font-bold text-gray-900">{checkInResult.data?.showtime?.room?.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Ghế:</span>
                      <span className="font-black text-brand text-sm">{(checkInResult.data?.seats || []).join(', ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Khách hàng:</span>
                      <span className="font-bold text-gray-900">{checkInResult.data?.user?.username || 'Khách vãng lai'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Thời gian check-in:</span>
                      <span className="font-bold text-emerald-600">
                        {checkInResult.data?.checkedInAt ? new Date(checkInResult.data.checkedInAt).toLocaleString('vi-VN') : 'Vừa xong'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Nhân viên:</span>
                      <span className="font-bold text-gray-900">{checkInResult.data?.checkedInBy || 'Admin Cinema'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setCheckInResult(null); setCheckInInput(''); }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    Xác nhận (OK)
                  </button>
                </div>
              ) : (
                /* 🔴 VÉ ĐÃ ĐƯỢC SỬ DỤNG / KHÔNG HỢP LỆ */
                <div className="bg-white border-2 border-red-500 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/30">
                      <XCircle size={36} strokeWidth={3} />
                    </div>
                    <h4 className="text-lg font-black text-red-700 uppercase tracking-wider">{checkInResult.message}</h4>
                  </div>

                  {checkInResult.data && (
                    <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Mã vé:</span>
                        <span className="font-mono font-black text-gray-900">{checkInResult.data?.ticketCode}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Phim:</span>
                        <span className="font-bold text-gray-900">{checkInResult.data?.showtime?.movie?.title}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Suất chiếu:</span>
                        <span className="font-bold text-gray-900">
                          {checkInResult.data?.showtime?.startTime ? new Date(checkInResult.data.showtime.startTime).toLocaleString('vi-VN') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Ghế:</span>
                        <span className="font-black text-red-600">{(checkInResult.data?.seats || []).join(', ')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Khách hàng:</span>
                        <span className="font-bold text-gray-900">{checkInResult.data?.user?.username || 'Khách vãng lai'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Thời gian check-in lần đầu:</span>
                        <span className="font-bold text-red-600">
                          {checkInResult.data?.checkedInAt ? new Date(checkInResult.data.checkedInAt).toLocaleString('vi-VN') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">Nhân viên check-in:</span>
                        <span className="font-bold text-gray-900">{checkInResult.data?.checkedInBy || 'Admin Cinema'}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => { setCheckInResult(null); setCheckInInput(''); }}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* DRAWER / MODAL: CHI TIẾT VÉ (GIAO DIỆN THEO MẪU REFERENCE SCREENSHOT)  */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {selectedBooking && (() => {
        const b = selectedBooking;
        const showtime = b.showtime || {};
        const movie = showtime.movie || {};
        const theater = showtime.theater || {};
        const room = showtime.room || {};
        const user = b.user || {};
        const code = b.ticketCode || `TKT-${String(b._id).slice(-8).toUpperCase()}`;

        return (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedBooking(null)}
          >
            <div
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Drawer */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-black text-gray-900 text-base">Chi tiết vé</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Card thông tin Phim & Suất chiếu */}
                <div className="flex gap-4 items-start bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-gray-300 shadow-sm">
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-gray-900 text-sm truncate">{movie.title || 'Phim đã xóa'}</h4>
                      {showtime.format && (
                        <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shrink-0">{showtime.format}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                      <Clock size={12} className="text-gray-400 shrink-0" />
                      <span>{showtime.startTime ? new Date(showtime.startTime).toLocaleString('vi-VN') : 'N/A'}</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                      <DoorOpen size={12} className="text-gray-400 shrink-0" />
                      <span>{room.name || 'Phòng chiếu'}</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                      <Armchair size={12} className="text-brand shrink-0" />
                      <span>Ghế: <strong className="text-brand font-black">{(b.seats || []).join(', ')}</strong></span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                      <Building2 size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">{theater.name || 'CineBook Center'}</span>
                    </div>
                    <div className="text-base font-black text-brand pt-1">
                      {fmt(b.totalPrice)}
                    </div>
                  </div>
                </div>

                {/* Header mã vé & trạng thái */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="font-mono font-black text-lg text-gray-900">{code}</span>
                  {renderTicketStatusBadge(b)}
                </div>

                {/* Thông tin khách hàng */}
                <div className="space-y-2">
                  <h5 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Thông tin khách hàng</h5>
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Họ tên:</span>
                      <span className="font-bold text-gray-900">{user.username || 'Khách vãng lai'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Số điện thoại:</span>
                      <span className="font-bold text-gray-900">{user.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-bold text-gray-900 break-all">{user.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Trạng thái chi tiết */}
                <div className="space-y-2">
                  <h5 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Trạng thái</h5>
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Trạng thái vé:</span>
                      {renderTicketStatusBadge(b)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Đã in vé:</span>
                      <span className={`font-bold ${b.isPrinted ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {b.isPrinted ? 'Đã in' : 'Chưa in'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Số lần in:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{b.printCount || 0} lần</span>
                        {(b.printLogs || []).length > 0 && (
                          <button
                            onClick={() => setPrintHistoryBooking(b)}
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            <History size={10} /> Xem lịch sử
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Check-in:</span>
                      <span className={`font-bold ${b.isCheckedIn ? 'text-emerald-600' : 'text-red-500'}`}>
                        {b.isCheckedIn ? 'Đã quét' : 'Chưa quét'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Thời gian tạo:</span>
                      <span className="font-bold text-gray-900">
                        {b.bookingDate ? new Date(b.bookingDate).toLocaleString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Kênh bán:</span>
                      <span className="font-bold text-gray-900">{b.channel || 'Website'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
                <button
                  onClick={() => handlePrintTicket(b)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} /> In vé
                </button>
                <button
                  onClick={() => {
                    handlePerformCheckIn(b.ticketCode || b._id);
                    setActiveTab('checkin');
                  }}
                  disabled={b.isCheckedIn}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <QrCode size={14} /> Check-in vé
                </button>
                <button
                  onClick={() => handleDeleteBooking(b._id)}
                  className="py-2.5 px-3 bg-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                  title="Hủy vé"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: LỊCH SỬ IN VÉ                                                     */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {printHistoryBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setPrintHistoryBooking(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <History size={16} className="text-brand" /> Lịch sử in vé
              </h4>
              <button
                onClick={() => setPrintHistoryBooking(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Mã vé:</span>
                <span className="font-mono font-bold text-gray-900">{printHistoryBooking.ticketCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-bold text-gray-900">{printHistoryBooking.user?.username || 'Khách vãng lai'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Tổng số lần in:</span>
                <span className="font-black text-brand">{printHistoryBooking.printCount || 0} lần</span>
              </div>

              <div className="pt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
                      <th className="py-2 pl-2">Lần in</th>
                      <th className="py-2">Thời gian</th>
                      <th className="py-2">Nhân viên</th>
                      <th className="py-2 pr-2">Thiết bị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px] font-medium text-gray-700">
                    {(printHistoryBooking.printLogs || []).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-400 italic">Chưa có lịch sử in.</td>
                      </tr>
                    ) : (
                      printHistoryBooking.printLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td className="py-2 pl-2 font-bold">{idx + 1}</td>
                          <td className="py-2">{new Date(log.printedAt).toLocaleString('vi-VN')}</td>
                          <td className="py-2 font-semibold">{log.staffName || 'Admin Cinema'}</td>
                          <td className="py-2 pr-2 font-mono text-gray-500">{log.device || 'PC-01'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setPrintHistoryBooking(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: MẪU VÉ IN VÀO MÁY IN (PRINTABLE CINEMA TICKET)                    */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {ticketToPrint && (() => {
        const b = ticketToPrint;
        const showtime = b.showtime || {};
        const movie = showtime.movie || {};
        const theater = showtime.theater || {};
        const room = showtime.room || {};
        const user = b.user || {};
        const code = b.ticketCode || `TKT-${String(b._id).slice(-8).toUpperCase()}`;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setTicketToPrint(null)}
          >
            <div
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ticket Printable Layout */}
              <div className="border-2 border-dashed border-gray-300 p-5 rounded-2xl space-y-4 font-mono text-xs bg-amber-50/30">
                <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-3">
                  <h3 className="font-black text-base uppercase text-gray-900 tracking-wider">CINEBOOK CINEMA</h3>
                  <p className="text-[10px] text-gray-500">{theater.name || 'Rạp CineBook Center'}</p>
                  <p className="text-[10px] font-bold text-brand">{code}</p>
                </div>

                <div className="space-y-2">
                  <div className="font-black text-sm text-gray-900 uppercase">{movie.title || 'Phim'}</div>
                  <div className="flex justify-between text-gray-700">
                    <span>Định dạng:</span>
                    <span className="font-bold">{showtime.format || '2D'}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Suất chiếu:</span>
                    <span className="font-bold">
                      {showtime.startTime ? new Date(showtime.startTime).toLocaleString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Phòng chiếu:</span>
                    <span className="font-bold">{room.name || 'Phòng 1'}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>VỊ TRÍ GHẾ:</span>
                    <span className="font-black text-brand text-base">{(b.seats || []).join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 border-t border-dashed border-gray-300 pt-2">
                    <span>Khách hàng:</span>
                    <span className="font-bold">{user.username || 'Khách vãng lai'}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Giá vé:</span>
                    <span className="font-black text-gray-900">{fmt(b.totalPrice)}</span>
                  </div>
                </div>

                {/* Simulated Barcode / QR */}
                <div className="text-center pt-2 border-t border-dashed border-gray-300 space-y-1">
                  <div className="font-mono text-[10px] tracking-widest text-gray-400">||| | |||| ||| || ||||| |||</div>
                  <p className="text-[9px] text-gray-400">Vui lòng mang theo vé này khi vào phòng chiếu</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Printer size={14} /> In lệnh ra máy in
                </button>
                <button
                  onClick={() => setTicketToPrint(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
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
