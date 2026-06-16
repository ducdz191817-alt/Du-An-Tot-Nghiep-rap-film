import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Popcorn, Armchair } from 'lucide-react';
import bookingService from '../services/booking.service';
import useBooking from '../hooks/useBooking';
import useAuth from '../hooks/useAuth';
import SeatMap from '../components/Booking/SeatMap';
import SeatLegend from '../components/Booking/SeatLegend';
import ConcessionList from '../components/Booking/ConcessionList';
import BookingSummary from '../components/Booking/BookingSummary';
import Loading from '../components/common/Loading';

export const BookingPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    selectedShowtime,
    selectedSeats,
    selectedConcessions,
    selectShowtime,
    selectSeat,
    changeConcessionQty,
    calculateTotal,
  } = useBooking();

  const [seatsList, setSeatsList] = useState([]);
  const [concessionsList, setConcessionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1); // Bước 1: Ghế ngồi, Bước 2: Bắp nước

  useEffect(() => {
    // Buộc chuyển hướng đăng nhập nếu người dùng đang đặt vé
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(`/booking/${showtimeId}`));
      return;
    }

    const loadBookingData = async () => {
      setLoading(true);
      try {
        // 1. Lấy thông tin chi tiết ghế của suất chiếu
        const stResult = await bookingService.getShowtimeById(showtimeId);
        selectShowtime(stResult.showtime);
        setSeatsList(stResult.seats || []);

        // 2. Lấy danh sách bắp nước tương ứng với rạp chiếu
        const theaterId = stResult.showtime?.theater?._id || stResult.showtime?.theater;
        const conResult = await bookingService.getConcessions(theaterId);
        setConcessionsList(Array.isArray(conResult) ? conResult : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBookingData();
  }, [showtimeId, isAuthenticated]);

  if (loading) return <Loading fullPage />;

  const pricing = calculateTotal(concessionsList, seatsList);

  const handleProceed = () => {
    if (activeStep === 1) {
      setActiveStep(2);
    } else {
      navigate('/payment');
    }
  };

  const handleBackStep = () => {
    if (activeStep === 2) {
      setActiveStep(1);
    } else {
      navigate(`/movies/${selectedShowtime?.movie?._id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Nút quay lại chi tiết phim */}
      <button
        onClick={handleBackStep}
        className="inline-flex items-center text-zinc-400 hover:text-white text-xs font-extrabold uppercase tracking-wider gap-1.5 transition-colors"
      >
        <ChevronLeft size={16} /> Quay lại chi tiết phim
      </button>

      {/* Thanh chỉ báo tiến trình */}
      <div className="flex items-center justify-center space-x-4 select-none max-w-md mx-auto py-2">
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
          activeStep === 1 ? 'bg-brand text-white border-brand shadow' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
        }`}>1. Sơ đồ ghế</span>
        <span className="h-0.5 w-12 bg-zinc-800" />
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
          activeStep === 2 ? 'bg-brand text-white border-brand shadow' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
        }`}>2. Bắp nước</span>
      </div>

      {/* Lưới bố cục */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Tùy chọn đặt chỗ bên trái */}
        <div className="lg:col-span-2 space-y-8 bg-dark-card border border-dark-border p-6 rounded-3xl shadow-xl">
          {activeStep === 1 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                <Armchair className="text-brand" size={20} />
                <h3 className="text-lg font-black text-zinc-200">Chọn vị trí ghế ngồi</h3>
              </div>

              <SeatMap
                seats={seatsList}
                bookedSeats={selectedShowtime?.bookedSeats || []}
                selectedSeats={selectedSeats}
                onSeatClick={selectSeat}
              />

              <SeatLegend />
            </div>
          ) : (
            <ConcessionList
              concessions={concessionsList}
              selectedConcessions={selectedConcessions}
              onQtyChange={changeConcessionQty}
            />
          )}
        </div>

        {/* Chi tiết hóa đơn nổi bên phải */}
        <div>
          <BookingSummary
            showtime={selectedShowtime}
            selectedSeats={selectedSeats}
            selectedConcessions={selectedConcessions}
            concessionsList={concessionsList}
            pricing={pricing}
            onProceed={handleProceed}
            proceedText={activeStep === 1 ? 'Xác nhận ghế' : 'Tiến hành thanh toán'}
            disabled={selectedSeats.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;