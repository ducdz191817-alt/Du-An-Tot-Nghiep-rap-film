import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Copy, AlertTriangle, RefreshCw } from 'lucide-react';
import useBooking from '../hooks/useBooking';
import bookingService from '../services/booking.service';
import paymentService from '../services/payment.service';
import couponService from '../services/coupon.service';
import PaymentForm from '../components/Booking/PaymentForm';
import BookingSummary from '../components/Booking/BookingSummary';
import BookingSuccessModal from '../components/Booking/BookingSuccessModal';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

export const PaymentPage = () => {
  const navigate = useNavigate();
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

  // Trạng thái VietQR
  const [showQRScreen, setShowQRScreen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showMomoScreen, setShowMomoScreen] = useState(false);
  const [momoData, setMomoData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút (300 giây)
  const [bookingId, setBookingId] = useState(null);

  // Trạng thái modal thành công
  const [successModal, setSuccessModal] = useState({
    open: false,
    bookingResult: null,
  });

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
        const theaterId = selectedShowtime.theater?._id || selectedShowtime.theater;
        const result = await bookingService.getConcessions(theaterId);
        setConcessionsList(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Không thể tải danh sách đồ ăn uống:', err);
      }
    };
    loadConcessions();
  }, [selectedShowtime, selectedSeats, showQRScreen, successModal.open]);

  // Bộ đếm ngược và Polling trạng thái cho VietQR
  useEffect(() => {
    let timerId;
    let pollId;

    const isWaitingPayment = (showQRScreen || showMomoScreen) && bookingId;
    if (isWaitingPayment) {
      // 1. Đồng hồ đếm ngược 5 phút
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleCancelBooking(false); // Hủy tự động không hiện confirm
            alert('Đã quá thời hạn thanh toán (5 phút). Lịch đặt vé này đã bị hủy, ghế của bạn đã được giải phóng.');
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
      const result = await couponService.validateCoupon(code, pricing.grandTotal);
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
        setTimeLeft(300);
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
        setTimeLeft(300);
      } else if (paymentMethod === 'vnpay') {
        const vnpayResult = await paymentService.createVnpayPayment({
          bookingId: bookingIdFromResult,
          amount: result.booking.totalPrice,
          orderInfo: `Booking ${bookingIdFromResult}`,
        });
        // Redirect user to VNPay Sandbox portal
        window.location.href = vnpayResult.payUrl;
      } else {
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
    setLoading(true);
    try {
      await bookingService.simulatePayment(bookingId);
      // Xử lý thành công
      handlePaymentSuccess();
    } catch (err) {
      alert(`Lỗi giả lập thanh toán: ${err.message}`);
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
    alert(`Đã sao chép ${field}!`);
  };

  // Render màn hình thanh toán VietQR
  const isMomoScreen = showMomoScreen && momoData;
  if ((showQRScreen && qrData) || isMomoScreen) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const title = isMomoScreen ? 'Thanh Toán MoMo' : 'Thanh Toán Chuyển Khoản VietQR';
    const description = isMomoScreen
      ? 'Quét mã QR này bằng ứng dụng MoMo để hoàn tất giao dịch, hoặc nhấn vào nút mở liên kết MoMo.'
      : 'Hãy mở ứng dụng ngân hàng và quét mã để tiến hành đặt vé tự động.';

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-4 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                {title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {description}
              </p>
            </div>
            
            {/* Đồng hồ đếm ngược */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-extrabold text-sm px-4 py-2 rounded-2xl shrink-0">
              <Clock size={16} className="text-amber-500" />
              <span>Giao dịch hết hạn sau:</span>
              <span className="text-amber-500 font-mono tracking-wider">{timeStr}</span>
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

              {/* Status loader */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                <RefreshCw size={12} className="animate-spin text-emerald-400" />
                <span>Đang kiểm tra giao dịch tự động...</span>
              </div>
            </div>

            {/* Cột phải: Thông tin thanh toán */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider pl-1">
                {isMomoScreen ? 'Thông tin thanh toán MoMo' : 'Thông tin chuyển khoản'}
              </h3>

              {isMomoScreen ? (
                <div className="bg-zinc-950 border border-dark-border rounded-2xl p-4 space-y-4 text-sm">
                  <div className="text-zinc-400 text-sm leading-relaxed">
                    Mở ứng dụng MoMo và quét mã QR bên trái hoặc nhấn nút "Mở liên kết MoMo" phía dưới để hoàn tất thanh toán.
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between gap-2 text-zinc-500">
                      <span className="font-semibold">Liên kết thanh toán</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(momoData.payUrl);
                          alert('Đã sao chép liên kết MoMo!');
                        }}
                        className="text-emerald-400 hover:text-emerald-200 text-xs"
                      >
                        Sao chép
                      </button>
                    </div>
                    <div className="break-all text-zinc-200 text-xs">{momoData.payUrl}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-zinc-950 border border-dark-border rounded-2xl p-4 divide-y divide-zinc-900 text-sm">
                    <div className="flex justify-between py-3">
                      <span className="text-zinc-500 font-semibold">Ngân hàng nhận</span>
                      <span className="text-zinc-200 font-bold">{qrData.bankId}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3">
                      <span className="text-zinc-500 font-semibold">Số tài khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-200 font-bold font-mono text-base">{qrData.accountNo}</span>
                        <button
                          onClick={() => copyToClipboard(qrData.accountNo, 'Số tài khoản')}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="Sao chép"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between py-3">
                      <span className="text-zinc-500 font-semibold">Chủ tài khoản</span>
                      <span className="text-zinc-200 font-bold uppercase">{qrData.accountName}</span>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <span className="text-zinc-500 font-semibold">Số tiền</span>
                      <div className="flex items-center gap-2">
                        <span className="text-brand font-black text-base">
                          {finalTotal.toLocaleString()} VND
                        </span>
                        <button
                          onClick={() => copyToClipboard(pricing.grandTotal, 'Số tiền')}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="Sao chép"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <span className="text-zinc-500 font-semibold">Nội dung chuyển khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 font-black px-3 py-1 rounded-lg font-mono tracking-wider">
                          {qrData.addInfo}
                        </span>
                        <button
                          onClick={() => copyToClipboard(qrData.addInfo, 'Nội dung')}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="Sao chép"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hướng dẫn an toàn */}
                  <div className="bg-amber-500/5 border border-amber-500/20 text-amber-500/90 p-3.5 rounded-2xl text-[11px] leading-relaxed font-semibold flex gap-2">
                    <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
                    <span>
                      <strong>Chú ý quan trọng:</strong> Bạn phải điền chính xác nội dung chuyển khoản <strong>{qrData.addInfo}</strong> để hệ thống tự động nhận diện và xuất vé. Giao dịch sai nội dung sẽ không được phê duyệt tự động.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dưới cùng: Nút thao tác giả lập phát triển */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-dark-border pt-6 gap-4">
            
            {/* Giả lập cho chế độ test */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg">Chế độ test</span>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    if (isMomoScreen && momoData?.payUrl) {
                      window.open(momoData.payUrl, '_blank');
                    }
                  }}
                  variant="secondary"
                  loading={loading}
                  disabled={!isMomoScreen || !momoData?.payUrl}
                  className="py-1.5 px-3.5 text-xs font-bold border border-emerald-800/30 text-emerald-400 hover:bg-emerald-950/20"
                >
                  Mở liên kết MoMo
                </Button>
                <Button
                  onClick={handleSimulatePayment}
                  variant="secondary"
                  loading={loading}
                  className="py-1.5 px-3.5 text-xs font-bold border border-emerald-800/30 text-emerald-400 hover:bg-emerald-950/20"
                >
                  Nhấp để giả lập thanh toán thành công
                </Button>
              </div>
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
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
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
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
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
    </>
  );
};

export default PaymentPage;