import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, XCircle, ChevronLeft, CreditCard } from 'lucide-react';
import { clearBookingFlow } from '../store/bookingSlice';
import paymentService from '../services/payment.service';
import bookingService from '../services/booking.service';
import BookingSuccessModal from '../components/Booking/BookingSuccessModal';
import Button from '../components/common/Button';

export const VNPayReturnPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'failed'
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // 1. Verify VNPay payment details through our backend callback
        const result = await paymentService.verifyVnpayPayment(location.search);
        
        if (result.success) {
          // 2. Fetch full populated booking details to display in success modal
          const details = await bookingService.getBookingById(result.bookingId);
          setBookingDetails(details);
          
          // 3. Clear frontend Redux booking selections state
          dispatch(clearBookingFlow());
          setStatus('success');
        } else {
          setErrorMsg(result.error || 'Thanh toán qua VNPay thất bại hoặc bị hủy.');
          dispatch(clearBookingFlow());
          setStatus('failed');
        }
      } catch (err) {
        console.error('Lỗi kiểm tra thanh toán VNPay:', err);
        setErrorMsg(err.message || 'Lỗi hệ thống khi xử lý kết quả thanh toán.');
        dispatch(clearBookingFlow());
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [location.search, dispatch]);

  const handleCloseSuccessModal = () => {
    navigate('/history');
  };

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 py-12">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
        <h2 className="text-xl font-black text-white">Đang xác thực thanh toán VNPay...</h2>
        <p className="text-sm text-zinc-500 font-semibold">Vui lòng không tắt trình duyệt hoặc tải lại trang.</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 space-y-6 shadow-2xl text-center relative overflow-hidden">
          {/* Top colored bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
          
          {/* Error icon */}
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <XCircle size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Thanh toán thất bại</h2>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              {errorMsg}
            </p>
          </div>

          <div className="border-t border-dark-border/60 pt-4 text-[11px] text-zinc-500 font-medium">
            Nếu tiền đã bị trừ trong tài khoản, vui lòng liên hệ CSKH của chúng tôi để được giải quyết nhanh nhất.
          </div>

          <Button
            onClick={() => navigate('/')}
            variant="secondary"
            className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
          >
            <ChevronLeft size={16} /> Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading state before success modal is fully mounted */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 py-12">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-400 font-bold">Thanh toán thành công! Đang hiển thị vé...</p>
      </div>

      <BookingSuccessModal
        isOpen={status === 'success' && bookingDetails !== null}
        bookingResult={bookingDetails}
        showtime={bookingDetails?.showtime}
        selectedSeats={bookingDetails?.seats}
        onClose={handleCloseSuccessModal}
      />
    </>
  );
};

export default VNPayReturnPage;
