import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import useBooking from '../hooks/useBooking';
import adminService from '../services/admin.service';
import PaymentForm from '../components/Booking/PaymentForm';
import BookingSummary from '../components/Booking/BookingSummary';
import Loading from '../components/common/Loading';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const { selectedShowtime, selectedSeats, selectedConcessions, calculateTotal, submitBooking } = useBooking();
  const [concessionsList, setConcessionsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Safety redirect: If user directly navigates to payment without choosing seats
    if (!selectedShowtime || selectedSeats.length === 0) {
      navigate('/');
      return;
    }

    const loadConcessions = async () => {
      try {
        const result = await adminService.getConcessions();
        setConcessionsList(result);
      } catch (err) {
        console.error(err);
      }
    };
    loadConcessions();
  }, [selectedShowtime, selectedSeats]);

  const pricing = calculateTotal(concessionsList);

  const handlePaymentSubmit = async (paymentMethod) => {
    setLoading(true);
    try {
      await submitBooking(paymentMethod);
      alert('Chúc mừng! Vé của bạn đã được đặt thành công. Một bản sao hóa đơn đã được gửi đến email của bạn.');
      navigate('/history');
    } catch (err) {
      alert(`Đặt vé thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Return button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-zinc-400 hover:text-white text-xs font-extrabold uppercase tracking-wider gap-1.5 transition-colors"
      >
        <ChevronLeft size={16} /> Chỉnh sửa ghế hoặc bắp nước
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left checkout forms */}
        <div className="lg:col-span-2">
          <PaymentForm onSubmit={handlePaymentSubmit} loading={loading} pricing={pricing} />
        </div>

        {/* Right invoice details drawer */}
        <div>
          <BookingSummary
            showtime={selectedShowtime}
            selectedSeats={selectedSeats}
            selectedConcessions={selectedConcessions}
            concessionsList={concessionsList}
            pricing={pricing}
            onProceed={null} // Read only mode
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
