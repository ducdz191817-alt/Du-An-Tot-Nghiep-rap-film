import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Copy, AlertTriangle, RefreshCw, CheckCircle, Zap } from 'lucide-react';
import { io } from 'socket.io-client';
import useBooking from '../hooks/useBooking';
import useAuth from '../hooks/useAuth';
import bookingService from '../services/booking.service';
import paymentService from '../services/payment.service';
import couponService from '../services/coupon.service';
import PaymentForm from '../components/Booking/PaymentForm';
import BookingSummary from '../components/Booking/BookingSummary';
import BookingSuccessModal from '../components/Booking/BookingSuccessModal';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedShowtime,
    selectedSeats,
    selectedConcessions,
    calculateTotal,
    submitBooking,
    clearBooking,
  } = useBooking();

  const [concessionsList, setConcessionsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Socket ref để giữ ghế trong khi ở PaymentPage
  const paymentSocketRef = useRef(null);
  // Flag: payment success → không release ghế khi unmount
  const paymentSucceededRef = useRef(false);

  // Trạng thái VietQR
  const [showQRScreen, setShowQRScreen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showMomoScreen, setShowMomoScreen] = useState(false);
  const [momoData, setMomoData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút (600 giây)
  const [bookingId, setBookingId] = useState(null);

  // Trạng thái modal thành công
  const [successModal, setSuccessModal] = useState({
    open: false,
    bookingResult: null,
  });

  // Trạng thái Toast thông báo
  const [toast, setToast] = useState({ show: false, message: '', type: 'warning' });
  const showToast = (message, type = 'warning') => setToast({ show: true, message, type });

  // Snapshot showtime & seats trước khi clear (để hiển thị trong modal)
  const [snapshotShowtime, setSnapshotShowtime] = useState(null);
  const [snapshotSeats, setSnapshotSeats] = useState([]);

  // Trạng thái mã giảm giá
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    // Nếu đang hiển thị modal thành công thì không chuyển hướng an toàn về trang chủ
    if (successModal.open) return;

    // Chuyển hướng an toàn: Nếu người dùng truy cập trực tiếp vào trang thanh toán mà chưa chọn ghế
    if (!selectedShowtime || selectedSeats.length === 0) {
      if (!showQRScreen) {
        navigate('/');
      }
      return;
    }

    const showtimeStartsAt = selectedShowtime.startTime
      ? new Date(selectedShowtime.startTime).getTime()
      : null;

    if (showtimeStartsAt !== null && showtimeStartsAt <= Date.now() && !showQRScreen) {
      alert('Suất chiếu này đã bắt đầu hoặc đã kết thúc. Vui lòng chọn một suất chiếu khác.');
      navigate('/');
      return;
    }

    const loadConcessions = async () => {
      try {
        // Fix bug: truyền đúng theaterId để lấy đồ ăn của rạp đang đặt vé
        const theaterId = selectedShowtime?.theater?._id || selectedShowtime?.theater;
        const result = await bookingService.getConcessions(theaterId);
        setConcessionsList(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Không thể tải danh sách đồ ăn uống:', err);
      }
    };
    loadConcessions();
  }, [selectedShowtime, selectedSeats, showQRScreen, successModal.open]);

  // Socket: giữ ghế trong khi user ở trang thanh toán
  useEffect(() => {
    if (!selectedShowtime?._id || !selectedSeats?.length || !user?._id) return;

    const showtimeId = selectedShowtime._id;
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    paymentSocketRef.current = socket;

    socket.emit('join_showtime', { showtimeId, userId: user._id });

    // Khi kết nối, re-hold tất cả ghế đã chọn
    socket.on('initial_held_seats', () => {
      selectedSeats.forEach(seatCode => {
        socket.emit('hold_seat', { showtimeId, seatCode, userId: user._id });
      });
    });

    return () => {
      if (paymentSocketRef.current) {
        if (!paymentSucceededRef.current) {
          // Thanh toán chưa xong → disconnect, backend sẽ auto-release qua disconnect handler
          socket.emit('leave_showtime', { showtimeId });
        }
        socket.disconnect();
        paymentSocketRef.current = null;
      }
    };
  }, [selectedShowtime?._id, user?._id]);

  // Bộ đếm ngược và Polling trạng thái cho VietQR
  useEffect(() => {
    let timerId;
    let pollId;

    const isWaitingPayment = (showQRScreen || showMomoScreen) && bookingId;
    if (isWaitingPayment) {
      // 1. Đồng hồ đếm ngược 10 phút
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleCancelBooking(false); // Hủy tự động không hiện confirm
            alert('Đã quá thời hạn thanh toán (10 phút). Lịch đặt vé này đã bị hủy, ghế của bạn đã được giải phóng.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 2. Polling kiểm tra trạng thái thanh toán từ backend mỗi 3 giây
      pollId = setInterval(async () => {
        try {
          const statusRes = await bookingService.getBookingStatus(bookingId);
          if (statusRes.paymentStatus === 'paid') {
            clearInterval(pollId);
            clearInterval(timerId);
            handlePaymentSuccess();
          }
        } catch (err) {
          console.error('Lỗi khi kiểm tra trạng thái thanh toán:', err);
        }
      }, 3000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
      if (pollId) clearInterval(pollId);
    };
  }, [showQRScreen, showMomoScreen, bookingId]);

  const pricing = calculateTotal(concessionsList);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, pricing.grandTotal - discountAmount);

  const handleApplyCoupon = async (code) => {
    try {
      const context = {
        seatCount: selectedSeats.length,
        showtimeStartTime: selectedShowtime?.startTime,
      };
      const result = await couponService.validateCoupon(code, pricing.grandTotal, context);
      if (result.success && result.data) {
        setAppliedCoupon(result.data);
      } else {
        throw new Error('Mã giảm giá không hợp lệ');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
      throw new Error(errorMsg);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handlePaymentSubmit = async (paymentMethod) => {
    setLoading(true);
    try {
      // Lưu snapshot trước khi clear booking state
      setSnapshotShowtime(selectedShowtime);
      setSnapshotSeats([...selectedSeats]);

      const result = await submitBooking(paymentMethod, appliedCoupon?.code);
      const bookingIdFromResult = result.booking._id;
      setBookingId(bookingIdFromResult);

      if (paymentMethod === 'vietqr') {
        setQrData(result.vietqr);
        setShowQRScreen(true);
        setTimeLeft(600);
      } else if (paymentMethod === 'momo') {
        const momoResult = await paymentService.createMomoPayment({
          bookingId: bookingIdFromResult,
          amount: result.booking.totalPrice,
          orderInfo: `Booking ${bookingIdFromResult}`,
        });

        setMomoData({
          payUrl: momoResult.payUrl,
          payload: momoResult.raw,
        });
        setShowMomoScreen(true);
        setTimeLeft(600);
      } else if (paymentMethod === 'vnpay') {
        const vnpayResult = await paymentService.createVnpayPayment({
          bookingId: bookingIdFromResult,
          amount: result.booking.totalPrice,
          orderInfo: `Booking ${bookingIdFromResult}`,
        });
        // Redirect user to VNPay Sandbox portal
        window.location.href = vnpayResult.payUrl;
      } else {
        paymentSucceededRef.current = true;
        // Xóa trạng thái đặt vé trong Redux
        clearBooking();
        // Hiển thị modal thành công
        setSuccessModal({ open: true, bookingResult: result });
      }
    } catch (err) {
      alert(`Đặt vé thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    paymentSucceededRef.current = true;
    try {
      // Tải chi tiết booking đầy đủ để hiển thị trong Success Modal
      const detailRes = await bookingService.getBookingById(bookingId);
      
      // Xóa Redux booking state
      clearBooking();
      
      // Ẩn màn hình QR / Momo
      setShowQRScreen(false);
      setShowMomoScreen(false);
      
      // Mở modal thành công
      setSuccessModal({ open: true, bookingResult: detailRes });
    } catch (err) {
      console.error('Không thể lấy chi tiết vé sau thanh toán:', err);
      // Fallback
      clearBooking();
      setShowQRScreen(false);
      setShowMomoScreen(false);
      setSuccessModal({ open: true, bookingResult: { data: { booking: { _id: bookingId } } } });
    }
  };

  const handleCancelBooking = async (isManual = true) => {
    if (isManual && !window.confirm('Bạn có chắc chắn muốn hủy giao dịch này không? Toàn bộ ghế bạn đang giữ sẽ bị giải phóng.')) {
      return;
    }
    setLoading(true);
    try {
      await bookingService.cancelBooking(bookingId);
      setShowQRScreen(false);
      setShowMomoScreen(false);
      setBookingId(null);
      setQrData(null);
      setMomoData(null);
      
      // If time expires automatically, go to booking history.
      // If user cancels manually, stay on the payment selection page instead of going back to seat selection.
      if (!isManual) {
        navigate('/history');
      }
    } catch (err) {
      console.error('Lỗi khi hủy đặt vé:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      await bookingService.simulatePayment(bookingId);
      showToast('Đã giả lập thanh toán MoMo thành công!', 'success');
      await handlePaymentSuccess();
    } catch (err) {
      alert(`Giả lập thanh toán thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    setLoading(true);
    try {
      const statusRes = await bookingService.getBookingStatus(bookingId);
      if (statusRes.paymentStatus === 'paid') {
        handlePaymentSuccess();
      } else {
        showToast('Hệ thống chưa nhận được giao dịch chuyển khoản của bạn. Vui lòng chờ vài giây hoặc kiểm tra lại nội dung chuyển khoản.', 'warning');
      }
    } catch (err) {
      showToast(`Lỗi khi kiểm tra thanh toán: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModal({ open: false, bookingResult: null });
    navigate('/history');
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${field}!`, 'info');
  };

  // Render màn hình thanh toán VietQR
  const isMomoScreen = showMomoScreen && momoData;
  if ((showQRScreen && qrData) || isMomoScreen) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const title = isMomoScreen ? 'Thanh Toán MoMo' : 'Thanh Toán Chuyển Khoản VietQR';
    const description = isMomoScreen
      ? 'Quét mã QR này bằng ứng dụng MoMo để hoàn tất giao dịch, hoặc nhấn vào nút "Giả lập thanh toán MoMo" bên dưới để kiểm thử ngay.'
      : 'Hãy mở ứng dụng ngân hàng và quét mã để tiến hành đặt vé tự động.';

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                {title}
              </h2>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                {description}
              </p>
            </div>
            
            {/* Đồng hồ đếm ngược */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 text-gray-800 dark:text-zinc-300 font-extrabold text-sm px-4 py-2 rounded-2xl shrink-0">
              <Clock size={16} className="text-amber-600 dark:text-amber-500" />
              <span>Giao dịch hết hạn sau:</span>
              <span className="text-amber-600 dark:text-amber-500 font-mono tracking-wider">{timeStr}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Cột trái: Mã QR Code */}
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-3xl flex justify-center items-center shadow-lg border border-zinc-200 w-64 h-64 relative group">
                {isMomoScreen ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(momoData.payUrl)}`}
                      alt="MoMo QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <img
                    src={qrData.qrUrl}
                    alt="VietQR Code"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Status loader & Confirm / Simulate button */}
              <div className="w-full flex flex-col items-center gap-2 pt-1">
                {isMomoScreen ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={loading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-[#a50064] to-[#d82d8b] hover:from-[#880052] hover:to-[#be2077] text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-pink-950/40 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <Zap size={16} />
                      <span>⚡ Giả lập thanh toán MoMo thành công (Demo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckPayment}
                      disabled={loading}
                      className="w-full py-2 px-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-zinc-300 dark:border-zinc-800"
                    >
                      <CheckCircle size={15} />
                      <span>Kiểm tra trạng thái thanh toán</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400 font-semibold bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-4 py-2 rounded-xl">
                      <RefreshCw size={12} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Đang kiểm tra giao dịch tự động...</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckPayment}
                      disabled={loading}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle size={16} />
                      <span>Tôi đã chuyển khoản xong — Kiểm tra thanh toán</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Cột phải: Thông tin thanh toán */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-zinc-200 uppercase tracking-wider pl-1">
                {isMomoScreen ? 'Thông tin thanh toán MoMo' : 'Thông tin chuyển khoản'}
              </h3>

              {isMomoScreen ? (
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-dark-border rounded-2xl p-4 space-y-4 text-sm">
                  <div className="text-gray-700 dark:text-zinc-400 text-sm leading-relaxed">
                    Mở ứng dụng MoMo và quét mã QR bên trái, hoặc nhấn nút <strong>"⚡ Giả lập thanh toán MoMo thành công"</strong> để hoàn tất đơn hàng ngay lập tức khi thuyết trình hoặc kiểm thử.
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between gap-2 text-gray-500 dark:text-zinc-500">
                      <span className="font-semibold">Liên kết thanh toán</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(momoData.payUrl);
                          alert('Đã sao chép liên kết MoMo!');
                        }}
                        className="text-pink-600 dark:text-pink-400 hover:underline text-xs font-bold"
                      >
                        Sao chép
                      </button>
                    </div>
                    <div className="break-all text-gray-800 dark:text-zinc-200 text-xs">{momoData.payUrl}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-dark-border rounded-2xl p-4 divide-y divide-gray-200 dark:divide-zinc-900 text-sm">
                    <div className="flex justify-between py-3">
                      <span className="text-gray-600 dark:text-zinc-500 font-semibold">Ngân hàng nhận</span>
                      <span className="text-gray-900 dark:text-zinc-200 font-bold">{qrData.bankId}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 dark:text-zinc-500 font-semibold">Số tài khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-zinc-200 font-bold font-mono text-base">{qrData.accountNo}</span>
                        <button
                          onClick={() => copyToClipboard(qrData.accountNo, 'Số tài khoản')}
                          className="p-1 text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300 transition-colors"
                          title="Sao chép"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between py-3">
                      <span className="text-gray-600 dark:text-zinc-500 font-semibold">Chủ tài khoản</span>
                      <span className="text-gray-900 dark:text-zinc-200 font-bold uppercase">{qrData.accountName}</span>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 dark:text-zinc-500 font-semibold">Số tiền</span>
                      <div className="flex items-center gap-2">
                        <span className="text-brand font-black text-base">
                          {qrData.amount ? qrData.amount.toLocaleString('vi-VN') : finalTotal.toLocaleString('vi-VN')} VND
                        </span>
                        <button
                          onClick={() => copyToClipboard(String(qrData.amount || finalTotal), 'Số tiền')}
                          className="p-1 text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300 transition-colors"
                          title="Sao chép"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 dark:text-zinc-500 font-semibold">Nội dung chuyển khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-base bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/30">
                          {qrData.addInfo}
                        </span>
                        <button
                          onClick={() => copyToClipboard(qrData.addInfo, 'Nội dung chuyển khoản')}
                          className="p-1 text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300 transition-colors"
                          title="Sao chép"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hướng dẫn an toàn */}
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 p-3.5 rounded-2xl text-[11px] leading-relaxed font-semibold flex gap-2">
                    <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <span>
                      <strong>Chú ý quan trọng:</strong> Sau khi hoàn tất chuyển khoản trên ứng dụng ngân hàng, hệ thống sẽ tự động xác nhận. Bạn cũng có thể bấm nút <strong>"Kiểm tra thanh toán"</strong> bên dưới để kiểm tra ngay!
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dưới cùng: Nút thao tác */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-dark-border pt-6 gap-4">
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isMomoScreen && momoData?.payUrl && (
                <>
                  <Button
                    onClick={() => window.open(momoData.payUrl, '_blank')}
                    variant="secondary"
                    loading={loading}
                    className="py-2 px-3.5 text-xs font-bold border border-pink-500/30 text-pink-500 hover:bg-pink-500/10"
                  >
                    Mở liên kết MoMo
                  </Button>
                  <Button
                    onClick={handleSimulatePayment}
                    variant="primary"
                    loading={loading}
                    className="py-2 px-3.5 text-xs font-bold bg-gradient-to-r from-[#a50064] to-[#d82d8b] text-white border-0 shadow-md shadow-pink-900/30"
                  >
                    <Zap size={14} className="mr-1 inline" />
                    Giả lập thành công
                  </Button>
                </>
              )}
            </div>

            <Button
              onClick={() => handleCancelBooking(true)}
              variant="secondary"
              loading={loading}
              className="py-2.5 px-6 text-sm font-black w-full sm:w-auto hover:text-red-400 hover:border-red-500/20"
            >
              Hủy giao dịch & Quay lại
            </Button>
          </div>

        </div>

        {/* Toast thông báo đẹp */}
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
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Nút quay lại */}
        <button
          onClick={() => {
            const showtimeId = selectedShowtime?._id;
            if (showtimeId) {
              navigate(`/booking/${showtimeId}`, { state: { step: 2 } });
            } else {
              navigate(-1);
            }
          }}
          className="inline-flex items-center text-zinc-400 hover:text-white text-xs font-extrabold uppercase tracking-wider gap-1.5 transition-colors"
        >
          <ChevronLeft size={16} /> Chỉnh sửa ghế hoặc đồ ăn
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form thanh toán bên trái */}
          <div className="lg:col-span-2">
            <PaymentForm
              onSubmit={handlePaymentSubmit}
              loading={loading}
              pricing={pricing}
              appliedCoupon={appliedCoupon}
            />
          </div>

          {/* Chi tiết hóa đơn bên phải */}
          <div>
            <BookingSummary
              showtime={selectedShowtime}
              selectedSeats={selectedSeats}
              selectedConcessions={selectedConcessions}
              concessionsList={concessionsList}
              pricing={pricing}
              onProceed={null} // Chế độ chỉ đọc
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Modal xác nhận đặt vé thành công */}
      <BookingSuccessModal
        isOpen={successModal.open}
        bookingResult={successModal.bookingResult}
        showtime={snapshotShowtime}
        selectedSeats={snapshotSeats}
        onClose={handleCloseSuccessModal}
      />

      {/* Toast thông báo đẹp */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast({ show: false, message: '', type: 'warning' })}
        />
      )}
    </>
  );
};

export default PaymentPage;