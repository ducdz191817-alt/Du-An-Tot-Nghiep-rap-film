import React, { useState, useEffect } from 'react';
import {
  Search, Ticket, Calendar, MapPin, User, RefreshCw,
  AlertCircle, ShoppingBag, X, Eye, CreditCard, Clock,
  Film, Building2, DoorOpen, Armchair, Popcorn, Receipt, CheckCircle2,
  Hourglass, Undo2, Printer, QrCode, History, Check, XCircle, Download,
  Filter, Smartphone, Trash2, Camera, Mail, SendHorizontal, Loader2
} from 'lucide-react';
import adminService from '../../services/admin.service';
import bookingService from '../../services/booking.service';
import useAuth from '../../hooks/useAuth';
import Loading from '../common/Loading';
import PrintTicketModal from '../Booking/PrintTicketModal';
import QRScanner from './QRScanner';

const fmt = (val) => (val || 0).toLocaleString('vi-VN') + 'đ';

export const BookingManager = () => {
  const { isAdmin, isStaff } = useAuth();
  const isStaffOnly = isStaff && !isAdmin;

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
  const [checkInResult, setCheckInResult] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Email state
  const [sendingEmailId, setSendingEmailId] = useState(null); // bookingId đang gửi
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [bulkEmailForm, setBulkEmailForm] = useState({ showtimeId: '', customMessage: '', subject: '' });
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkEmailResult, setBulkEmailResult] = useState(null);

  // Collect unique showtimes from bookings for bulk email selector
  const uniqueShowtimes = React.useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const st = b.showtime;
      if (st && st._id && b.paymentStatus === 'paid') {
        if (!map.has(st._id)) {
          const movieTitle = st.movie?.title || 'Phim không xác định';
          const startStr = st.startTime
            ? new Date(st.startTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';
          map.set(st._id, { id: st._id, label: `${movieTitle} — ${startStr}`, movieTitle, startStr });
        }
      }
    });
    return Array.from(map.values());
  }, [bookings]);

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

  // Action: Send email to one booking
  const handleSendEmail = async (e, booking) => {
    e.stopPropagation();
    if (sendingEmailId) return;
    setSendingEmailId(booking._id);
    try {
      const res = await adminService.sendBookingEmail(booking._id);
      setMessage({ text: `✅ Đã gửi email tới ${res.email || booking.user?.email || 'khách hàng'} thành công!`, type: 'success' });
    } catch (err) {
      setMessage({ text: `❌ Lỗi gửi email: ${err.message || 'Không xác định'}`, type: 'error' });
    } finally {
      setSendingEmailId(null);
    }
  };

  // Action: Send bulk email
  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    if (!bulkEmailForm.showtimeId) {
      setMessage({ text: 'Vui lòng chọn suất chiếu để gửi email', type: 'error' });
      return;
    }
    setIsSendingBulk(true);
    setBulkEmailResult(null);
    try {
      const payload = { showtimeId: bulkEmailForm.showtimeId };
      if (bulkEmailForm.subject.trim()) payload.subject = bulkEmailForm.subject.trim();
      if (bulkEmailForm.customMessage.trim()) payload.customMessage = bulkEmailForm.customMessage.trim();
      const res = await adminService.sendBulkEmail(payload);
      setBulkEmailResult(res);
      setMessage({ text: `✅ ${res.message}`, type: 'success' });
    } catch (err) {
      setMessage({ text: `❌ Lỗi: ${err.message || 'Gửi email thất bại'}`, type: 'error' });
    } finally {
      setIsSendingBulk(false);
    }
  };

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

  // Helper: Extract ticket code from scanned QR text
  const parseTicketCodeFromQR = (rawText) => {
    if (!rawText) return '';
    const text = String(rawText).trim();

    // 1. URL pattern: .../ticket-verify/TKT-xxx
    const urlMatch = text.match(/\/ticket-verify\/([A-Za-z0-9-]+)/);
    if (urlMatch) return urlMatch[1];

    // 2. Multiline pattern with "Mã vé: TKT-xxx"
    const codeMatch = text.match(/Mã vé:\s*([A-Za-z0-9-]+)/i);
    if (codeMatch) return codeMatch[1];

    // 3. Regex TKT- format
    const tktMatch = text.match(/TKT-[A-Za-z0-9-]+/i);
    if (tktMatch) return tktMatch[0];

    // 4. Regex 24-char ObjectId
    const idMatch = text.match(/\b[a-fA-F0-9]{24}\b/);
    if (idMatch) return idMatch[0];

    // 5. Fallback first line
    return text.split('\n')[0].trim();
  };

  // Action: Handle QR Code scanned from camera
  const handleScanQR = (scannedText) => {
    const extractedCode = parseTicketCodeFromQR(scannedText);
    if (extractedCode) {
      setCheckInInput(extractedCode);
      handlePerformCheckIn(extractedCode);
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

  // Action: Confirm pending payment
  const handleConfirmPendingPayment = async (bookingId) => {
    if (!window.confirm('Xác nhận duyệt thanh toán cho đơn đặt vé này và tự động phát hành vé + gửi Email cho khách hàng?')) return;
    try {
      await bookingService.simulatePayment(bookingId);
      setMessage({ text: '✅ Đã duyệt thanh toán thành công, vé và Email đã được gửi tới khách hàng!', type: 'success' });
      fetchBookings();
    } catch (err) {
      setMessage({ text: `❌ Lỗi duyệt thanh toán: ${err.message || 'Không xác định'}`, type: 'error' });
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Ticket size={15} /> Danh sách vé
          </button>
          <button
            onClick={() => { setActiveTab('checkin'); setCheckInResult(null); setCheckInInput(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'checkin' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

              {!isStaffOnly && (
                <button
                  id="btn-bulk-email"
                  onClick={() => { setBulkEmailResult(null); setBulkEmailForm({ showtimeId: uniqueShowtimes[0]?.id || '', customMessage: '', subject: '' }); setIsBulkEmailOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all active:scale-95"
                  title="Gửi email hàng loạt"
                >
                  <Mail size={13} /> Gửi Email Hàng Loạt
                </button>
              )}
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
                          <td className="py-3.5 pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedBooking(b)}
                                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1"
                                title="Xem chi tiết"
                              >
                                <Eye size={13} /> Xem
                              </button>
                              {b.paymentStatus === 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmPendingPayment(b._id);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                  title="Duyệt thanh toán cho vé này"
                                >
                                  <CheckCircle2 size={13} /> Duyệt thanh toán
                                </button>
                              )}
                              {b.paymentStatus === 'paid' && (
                                b.isCheckedIn ? (
                                  <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Đã Check-in
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCheckInInput(b.ticketCode || b._id);
                                      setCheckInResult(null);
                                      setActiveTab('checkin');
                                    }}
                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                    title="Mở màn hình Check-in vé"
                                  >
                                    <QrCode size={13} /> Check-in vé
                                  </button>
                                )
                              )}
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

              {/* Camera quét mã QR thực sự */}
              <QRScanner
                onScanSuccess={handleScanQR}
                isProcessing={isCheckingIn}
                lastScanResult={checkInResult}
              />

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
                      <span className="truncate">{theater.name || 'Nova Cinema'}</span>
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

                {/* Chi tiết từng ghế & giá vé */}
                {(() => {
                  const seats = b.seats || [];
                  if (seats.length === 0) return null;

                  const basePrice = showtime.ticketPrice || showtime.price || 0;
                  const discountAmount = b.discountAmount || 0;
                  const totalPrice = b.totalPrice || 0;
                  const originalTotal = totalPrice + discountAmount;
                  const concessionSubtotal = (b.concessions || []).reduce((acc, c) => {
                    return acc + ((c.concession?.price || 0) * (c.quantity || 0));
                  }, 0);
                  const ticketSubtotal = Math.max(0, originalTotal - concessionSubtotal);
                  const roomSeats = room.seats || [];
                  const seatDetails = b.seatDetails || [];

                  const seatPriceList = seats.map((seatCode) => {
                    // 1. Kiểm tra snapshot seatDetails
                    const detail = seatDetails.find((d) => d.seatCode === seatCode);
                    if (detail) {
                      const typeLabel = detail.type === 'couple' ? 'Ghế đôi' : detail.type === 'vip' ? 'Ghế VIP' : 'Ghế thường';
                      let displayCode = seatCode;
                      const match = seatCode.match(/^([A-Z]+)(\d+)$/);
                      if (match && detail.type === 'couple') {
                        const row = match[1];
                        const num = parseInt(match[2], 10);
                        displayCode = `${row}${num}-${row}${num + 1}`;
                      }
                      return { seatCode, displayCode, seatType: detail.type, typeLabel, price: detail.price };
                    }

                    // 2. Dự phòng đơn hàng cũ
                    const match = seatCode.match(/^([A-Z]+)(\d+)$/);
                    let seatType = room.type === 'SWEETBOX' ? 'couple' : 'standard';
                    let extraPrice = 0;
                    let multiplier = seatType === 'couple' ? 2 : 1;
                    let displayCode = seatCode;

                    if (match) {
                      const rName = match[1];
                      const num = parseInt(match[2], 10);
                      const found = roomSeats.find((s) => s.row === rName && s.number === num);
                      if (found) {
                        seatType = found.type || seatType;
                        extraPrice = found.price || 0;
                        multiplier = seatType === 'couple' ? 2 : 1;
                      }
                      if (seatType === 'couple' || room.type === 'SWEETBOX') {
                        displayCode = `${rName}${num}-${rName}${num + 1}`;
                      }
                    }

                    let calculatedPrice = 0;
                    if (basePrice > 0) {
                      calculatedPrice = (basePrice * multiplier) + extraPrice;
                    } else {
                      calculatedPrice = Math.round(ticketSubtotal / (seats.length || 1));
                    }

                    const typeLabel = seatType === 'couple' ? 'Ghế đôi' : seatType === 'vip' ? 'Ghế VIP' : 'Ghế thường';

                    return { seatCode, displayCode, seatType, typeLabel, price: calculatedPrice };
                  });

                  return (
                    <div className="space-y-2">
                      <h5 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Chi tiết từng ghế & giá vé</span>
                        <span className="text-[10px] text-gray-500 font-bold">{seats.length} ghế</span>
                      </h5>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                        {seatPriceList.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200/50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-brand bg-brand/10 px-2 py-0.5 rounded-lg border border-brand/20 text-[11px]">
                                {item.displayCode || item.seatCode}
                              </span>
                              <span className="text-gray-500 text-[11px]">({item.typeLabel})</span>
                            </div>
                            <span className="font-bold text-gray-900">{fmt(item.price)}</span>
                          </div>
                        ))}

                        <div className="pt-2 border-t border-gray-200/80 space-y-1 text-[11px]">
                          <div className="flex justify-between text-gray-600">
                            <span>Tổng tiền vé:</span>
                            <span className="font-bold text-gray-900">{fmt(ticketSubtotal)}</span>
                          </div>
                          {concessionSubtotal > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Tổng tiền bắp nước:</span>
                              <span className="font-bold text-gray-900">{fmt(concessionSubtotal)}</span>
                            </div>
                          )}
                          {discountAmount > 0 && (() => {
                            const cCode = b.coupon?.code || (typeof b.coupon === 'string' && !/^[0-9a-fA-F]{24}$/.test(b.coupon) ? b.coupon : null);
                            return (
                              <div className="flex justify-between text-emerald-700 font-bold">
                                <span>Giảm giá mã ưu đãi {cCode ? `(${cCode})` : ''}:</span>
                                <span>-{fmt(discountAmount)}</span>
                              </div>
                            );
                          })()}
                          <div className="flex justify-between font-black text-xs text-gray-900 pt-1.5 border-t border-gray-200">
                            <span>Thành tiền:</span>
                            <span className="text-brand text-sm">{fmt(totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} /> In vé
                </button>
                {b.paymentStatus === 'paid' && b.user?.email && (
                  <button
                    onClick={(e) => handleSendEmail(e, b)}
                    disabled={sendingEmailId === b._id}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    title={`Gửi email xác nhận tới ${b.user.email}`}
                  >
                    {sendingEmailId === b._id ? (
                      <><Loader2 size={14} className="animate-spin" /> Đang gửi...</>
                    ) : (
                      <><Mail size={14} /> Gửi Email</>
                    )}
                  </button>
                )}

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
      {/* MODAL: MẪU VÉ IN VÀO MÁY IN (PRINTABLE CINEMA TICKET - CHIA TỪNG GHẾ)   */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {ticketToPrint && (
        <PrintTicketModal
          booking={ticketToPrint}
          onClose={() => setTicketToPrint(null)}
        />
      )}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: GỬI EMAIL HÀNG LOẠT                                               */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {isBulkEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Mail size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm">Gửi Email Hàng Loạt</h3>
                  <p className="text-blue-100 text-[10px]">Gửi email xác nhận vé đến tất cả khách hàng của một suất chiếu</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkEmailOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendBulkEmail} className="p-6 space-y-5">
              {/* Showtime selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  📅 Chọn suất chiếu <span className="text-red-500">*</span>
                </label>
                {uniqueShowtimes.length === 0 ? (
                  <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    Không có suất chiếu nào có khách hàng đặt vé đã thanh toán
                  </div>
                ) : (
                  <select
                    value={bulkEmailForm.showtimeId}
                    onChange={(e) => setBulkEmailForm(prev => ({ ...prev, showtimeId: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 cursor-pointer"
                  >
                    <option value="">-- Chọn suất chiếu --</option>
                    {uniqueShowtimes.map(st => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                )}
                {bulkEmailForm.showtimeId && (
                  <p className="text-[10px] text-blue-600 mt-1 font-semibold">
                    📨 Sẽ gửi email đến tất cả khách hàng đã thanh toán vé của suất chiếu này
                  </p>
                )}
              </div>

              {/* Custom subject (optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  ✏️ Tiêu đề email tùy chỉnh <span className="text-gray-400 font-normal">(để trống dùng mặc định)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Nhắc nhở lịch chiếu phim ngày mai..."
                  value={bulkEmailForm.subject}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Custom message (optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  📢 Thông điệp tùy chỉnh từ admin <span className="text-gray-400 font-normal">(optional, hiển thị nổi bật trong email)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Suất chiếu sẽ bắt đầu muộn 15 phút do sự cố kỹ thuật. Xin quý khách thông cảm..."
                  value={bulkEmailForm.customMessage}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, customMessage: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              {/* Result display */}
              {bulkEmailResult && (
                <div className={`p-4 rounded-2xl border text-xs font-semibold ${bulkEmailResult.sent > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <div className="font-black text-sm mb-2">{bulkEmailResult.message}</div>
                  <div className="flex gap-4">
                    <span>✅ Gửi thành công: <strong>{bulkEmailResult.sent}</strong></span>
                    {bulkEmailResult.failed > 0 && <span>❌ Thất bại: <strong>{bulkEmailResult.failed}</strong></span>}
                    <span>📊 Tổng: <strong>{bulkEmailResult.total}</strong></span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkEmailOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSendingBulk || !bulkEmailForm.showtimeId}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                >
                  {isSendingBulk ? (
                    <><Loader2 size={14} className="animate-spin" /> Đang gửi...</>
                  ) : (
                    <><SendHorizontal size={14} /> Gửi Email Ngay</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;
