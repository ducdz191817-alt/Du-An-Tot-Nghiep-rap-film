import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectShowtime,
  setSelectedSeats,
  toggleSeatSelection,
  updateConcessionQuantity,
  clearBookingFlow,
  setBookingLoading,
  setBookingSuccess,
  setBookingFailure,
} from '../store/bookingSlice';
import bookingService from '../services/booking.service';

export const useBooking = () => {
  const dispatch = useDispatch();
  const { selectedShowtime, selectedSeats, selectedConcessions, bookingDetails, loading, error } =
    useSelector((state) => state.booking);

  const selectShowtime = (showtime) => {
    dispatch(setSelectShowtime(showtime));
  };

  const setSeats = (seatsArray) => {
    dispatch(setSelectedSeats(seatsArray));
  };

  const selectSeat = (seatCode) => {
    dispatch(toggleSeatSelection(seatCode));
  };

  const changeConcessionQty = (concessionId, quantity) => {
    dispatch(updateConcessionQuantity({ concessionId, quantity }));
  };

  const clearBooking = () => {
    dispatch(clearBookingFlow());
  };

  // Pricing calculations
  const calculateTotal = (concessionsList = [], seatsList = []) => {
    if (!selectedShowtime) return { seatsTotal: 0, concessionsTotal: 0, grandTotal: 0 };

    const basePrice = selectedShowtime.ticketPrice;

    // Build a lookup map seatCode -> seat object for O(1) access
    const seatMap = {};
    seatsList.forEach((s) => {
      const code = `${s.row}${s.number}`;
      seatMap[code] = s;
    });

    // Calculate seats price using actual seat type from DB
    let seatsTotal = 0;
    selectedSeats.forEach((seatCode) => {
      const seat = seatMap[seatCode];
      let addition = 0;
      if (seat) {
        addition = seat.price;
      } else {
        // Fallback: guess from row letter if seat not found in list
        const match = seatCode.match(/^([A-Z]+)(\d+)$/);
        if (match) {
          const row = match[1];
          const room = selectedShowtime?.room || {};
          if (room.type === 'GOLDCLASS') {
            addition = 120000;
          } else {
            const capacity = room.capacity || 0;
            const cols = capacity <= 30 ? 6 : capacity <= 60 ? 10 : 12;
            const rowCount = Math.ceil(capacity / cols);
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lastRowLetter = rowCount > 0 ? alphabet[rowCount - 1] : '';

            if (row === lastRowLetter) {
              addition = 120000;
            } else if (row === 'A' || row === 'B') {
              addition = 0;
            } else {
              addition = 5000;
            }
          }
        }
      }
      seatsTotal += basePrice + addition;
    });

    // Calculate concessions price
    let concessionsTotal = 0;
    Object.keys(selectedConcessions).forEach((concessionId) => {
      const quantity = selectedConcessions[concessionId];
      const concessionDetails = concessionsList.find((c) => c._id === concessionId);
      if (concessionDetails) {
        concessionsTotal += concessionDetails.price * quantity;
      }
    });

    const grandTotal = seatsTotal + concessionsTotal;

    return {
      seatsTotal,
      concessionsTotal,
      grandTotal,
    };
  };

  const submitBooking = async (paymentMethod = 'card') => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      throw new Error('Please select showtime and seats before booking');
    }

    if (selectedShowtime.startTime && new Date(selectedShowtime.startTime).getTime() <= Date.now()) {
      throw new Error('Cannot book tickets for a past showtime');
    }

    // Refresh showtime status before booking to avoid stale availability
    const freshShowtimeData = await bookingService.getShowtimeById(selectedShowtime._id);
    const currentBookedSeats = freshShowtimeData.showtime?.bookedSeats || [];
    const bookedSeatSet = new Set(currentBookedSeats.map((seat) => String(seat).trim().toUpperCase()));
    const normalizedSelectedSeats = selectedSeats.map((seat) => String(seat).trim().toUpperCase());
    const alreadyBooked = normalizedSelectedSeats.some((seat) => bookedSeatSet.has(seat));
    if (alreadyBooked) {
      throw new Error('Một hoặc nhiều ghế bạn chọn đã được đặt trước đó. Vui lòng chọn lại ghế.');
    }

    dispatch(setBookingLoading(true));
    try {
      // Prepare payload
      const concessionsPayload = Object.keys(selectedConcessions).map((id) => ({
        concessionId: id,
        quantity: selectedConcessions[id],
      }));

      const payload = {
        showtimeId: selectedShowtime._id,
        seats: selectedSeats,
        concessions: concessionsPayload,
        paymentMethod,
      };

      const result = await bookingService.createBooking(payload);
      dispatch(setBookingSuccess(result));
      return result;
    } catch (err) {
      dispatch(setBookingFailure(err.message));
      throw err;
    }
  };

  return {
    selectedShowtime,
    selectedSeats,
    selectedConcessions,
    bookingDetails,
    loading,
    error,
    selectShowtime,
    setSeats,
    selectSeat,
    changeConcessionQty,
    clearBooking,
    calculateTotal,
    submitBooking,
  };
};

export default useBooking;
