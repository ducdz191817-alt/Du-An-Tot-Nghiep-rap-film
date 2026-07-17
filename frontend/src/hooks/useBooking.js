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
    // Group seats by type for breakdown display
    const typeGroups = {}; // { 'standard': { seatCodes: [], unitPrice: X, count: N, subtotal: Y }, ... }

    selectedSeats.forEach((seatCode) => {
      const seat = seatMap[seatCode];
      let addition = 0;
      let multiplier = 1;
      let seatType = 'standard';
      if (seat) {
        addition = seat.price;
        seatType = seat.type || 'standard';
        // ==========================================
        // FIX BUG 2: TÍNH TIỀN GHẾ ĐÔI (SWEETBOX) Ở FRONTEND
        // ==========================================
        // Hệ số nhân (multiplier) mặc định là 1.
        // Nếu là ghế đôi, hệ số nhân sẽ là 2 (vì vé dành cho 2 người).
        // Công thức ở cuối vòng lặp: (basePrice * multiplier) + addition
        if (seat.type === 'couple') multiplier = 2;
      } else {
        // Fallback: guess from row letter if seat not found in list
        const match = seatCode.match(/^([A-Z]+)(\d+)$/);
        if (match) {
          const row = match[1];
          const room = selectedShowtime?.room || {};
          if (room.type === 'GOLDCLASS') {
            addition = 120000;
            seatType = 'couple';
          } else {
            const capacity = room.capacity || 0;
            const cols = capacity <= 30 ? 6 : capacity <= 60 ? 10 : 12;
            const rowCount = Math.ceil(capacity / cols);
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lastRowLetter = rowCount > 0 ? alphabet[rowCount - 1] : '';

            if (row === lastRowLetter) {
              addition = 120000;
              seatType = 'couple';
            } else if (row === 'A' || row === 'B') {
              addition = 0;
              seatType = 'standard';
            } else {
              addition = 5000;
              seatType = 'vip';
            }
          }
        }
      }
      
      const ticketTotal = (basePrice * multiplier) + addition;
      seatsTotal += ticketTotal;

      // Group by seat type
      if (!typeGroups[seatType]) {
        typeGroups[seatType] = { seatCodes: [], unitPrice: ticketTotal, count: 0, subtotal: 0 };
      }
      typeGroups[seatType].seatCodes.push(seatCode);
      typeGroups[seatType].count += 1;
      typeGroups[seatType].subtotal += ticketTotal;
    });

    // Build seatBreakdown array sorted by type order
    const typeOrder = { standard: 0, vip: 1, couple: 2 };
    const typeLabels = { standard: 'Ghế thường', vip: 'Ghế VIP', couple: 'Ghế Đôi Sweetbox' };
    const seatBreakdown = Object.keys(typeGroups)
      .sort((a, b) => (typeOrder[a] || 0) - (typeOrder[b] || 0))
      .map((type) => ({
        type,
        label: typeLabels[type] || type,
        seatCodes: typeGroups[type].seatCodes,
        unitPrice: typeGroups[type].unitPrice,
        count: typeGroups[type].count,
        subtotal: typeGroups[type].subtotal,
      }));

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
      seatBreakdown,
      concessionsTotal,
      grandTotal,
    };
  };

  const submitBooking = async (paymentMethod = 'card', couponCode = null) => {
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

      if (couponCode) {
        payload.couponCode = couponCode;
      }

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
