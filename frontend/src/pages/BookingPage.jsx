import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Popcorn, Armchair, Ticket } from 'lucide-react';
import bookingService from '../services/booking.service';
import useBooking from '../hooks/useBooking';
import useAuth from '../hooks/useAuth';
import SeatMap from '../components/Booking/SeatMap';
import SeatLegend from '../components/Booking/SeatLegend';
import ConcessionList from '../components/Booking/ConcessionList';
import BookingSummary from '../components/Booking/BookingSummary';
import Loading from '../components/common/Loading';
import { io } from 'socket.io-client';

export const BookingPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    selectedShowtime,
    selectedSeats,
    selectedConcessions,
    selectShowtime,
    setSeats,
    selectSeat,
    changeConcessionQty,
    calculateTotal,
  } = useBooking();

  const [seatsList, setSeatsList] = useState([]);
  const [concessionsList, setConcessionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1); // Bước 1: Ghế ngồi, Bước 2: Bắp nước
  const [heldSeatsByOthers, setHeldSeatsByOthers] = useState([]);
  const [ticketQuantity, setTicketQuantity] = useState(2);
  const socketRef = useRef(null);

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

        // Check age limit here
        const movie = stResult.showtime?.movie;
        if (movie && user) {
          const userAge = user.age || 0;
          const getMovieAgeLimit = (r) => {
            if (!r) return 0;
            if (r === 'P') return 0;
            const match = r.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };
          const requiredAge = getMovieAgeLimit(movie.rating);
          if (userAge < requiredAge) {
            setAgeWarning({
              isOpen: true,
              movieTitle: movie.title,
              requiredAge,
              userAge,
              movieId: movie._id,
            });
            setLoading(false);
            return;
          }
        }

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

  useEffect(() => {
    if (!showtimeId || !user?._id) return;

    // Khởi tạo kết nối Socket.io
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

    // Tham gia vào phòng của suất chiếu
    socketRef.current.emit('join_showtime', { showtimeId, userId: user._id });

    // Lắng nghe danh sách ghế đang được giữ ban đầu
    socketRef.current.on('initial_held_seats', (holds) => {
      const others = holds.filter(h => h.userId !== user._id).map(h => h.seatCode);
      setHeldSeatsByOthers(others);
    });

    // Lắng nghe sự kiện ai đó giữ ghế
    socketRef.current.on('seat_held', ({ seatCode, userId }) => {
      if (userId !== user._id) {
        setHeldSeatsByOthers(prev => {
          if (!prev.includes(seatCode)) return [...prev, seatCode];
          return prev;
        });
      }
    });

    // Lắng nghe sự kiện ai đó nhả ghế
    socketRef.current.on('seat_released', ({ seatCode }) => {
      setHeldSeatsByOthers(prev => prev.filter(s => s !== seatCode));
    });

    // Lắng nghe sự kiện ghế đã được đặt thành công
    socketRef.current.on('seat_booked', ({ seatCodes }) => {
      setHeldSeatsByOthers(prev => prev.filter(s => !seatCodes.includes(s)));
      // Note: Ideally, we could re-fetch showtime data here to get the X marks instantly
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_showtime', { showtimeId });
        socketRef.current.disconnect();
      }
    };
  }, [showtimeId, user]);

  if (loading) return <Loading fullPage />;

  const pricing = calculateTotal(concessionsList, seatsList);

  const handleSeatClick = (block) => {
    // Giải phóng tất cả các ghế đang chọn cũ
    selectedSeats.forEach(seatCode => {
      socketRef.current?.emit('release_seat', { showtimeId, seatCode, userId: user._id });
    });

    // Bắt đầu giữ cụm ghế mới
    block.forEach(seatCode => {
      socketRef.current?.emit('hold_seat', { showtimeId, seatCode, userId: user._id });
    });

    // Cập nhật mảng ghế đã chọn trong Redux
    setSeats(block);
  };

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
      {/* Modal Cảnh Báo Độ Tuổi Cho Booking */}
      <Modal
        isOpen={ageWarning.isOpen}
        onClose={() => navigate(`/movies/${ageWarning.movieId}`)}
        title="Thông báo: Giới hạn độ tuổi"
        size="sm"
      >
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-base">Bạn chưa đủ tuổi xem phim</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              Phim <span className="text-zinc-200 font-bold">"{ageWarning.movieTitle}"</span> yêu cầu độ tuổi tối thiểu từ <span className="text-red-400 font-bold">{ageWarning.requiredAge} tuổi</span> trở lên.
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">
              Số tuổi tài khoản hiện tại của bạn: <span className="text-zinc-300 font-bold">{ageWarning.userAge} tuổi</span>.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/movies/${ageWarning.movieId}`)}
            variant="primary"
            className="w-full py-2.5 rounded-xl font-bold mt-2"
          >
            Quay lại trang chi tiết phim
          </Button>
        </div>
      </Modal>

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
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <div className="flex items-center gap-2">
                  <Armchair className="text-brand" size={20} />
                  <h3 className="text-lg font-black text-zinc-200">Chọn vị trí ghế ngồi</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <Ticket className="text-zinc-400" size={16} />
                  <span className="text-sm font-bold text-zinc-300">Số lượng vé:</span>
                  <select
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Number(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-brand transition-colors"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <SeatMap
                seats={seatsList}
                bookedSeats={selectedShowtime?.bookedSeats || []}
                selectedSeats={selectedSeats}
                heldSeatsByOthers={heldSeatsByOthers}
                ticketQuantity={ticketQuantity}
                onSeatClick={handleSeatClick}
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