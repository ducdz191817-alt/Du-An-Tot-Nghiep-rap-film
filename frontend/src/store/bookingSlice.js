import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedShowtime: null,
  selectedSeats: [], // Array of seat codes, e.g. ['A1', 'A2']
  selectedConcessions: {}, // Mapping of concessionId -> quantity, e.g. { '6648...': 2 }
  bookingDetails: null,
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setSelectShowtime: (state, action) => {
      state.selectedShowtime = action.payload;
      state.selectedSeats = [];
      state.selectedConcessions = {};
    },
    setSelectedSeats: (state, action) => {
      state.selectedSeats = action.payload;
    },
    toggleSeatSelection: (state, action) => {
      const seat = action.payload;
      const index = state.selectedSeats.indexOf(seat);
      if (index > -1) {
        // Seat already selected, remove it
        state.selectedSeats.splice(index, 1);
      } else {
        // Add seat
        state.selectedSeats.push(seat);
      }
    },
    updateConcessionQuantity: (state, action) => {
      const { concessionId, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.selectedConcessions[concessionId];
      } else {
        state.selectedConcessions[concessionId] = quantity;
      }
    },
    clearBookingFlow: (state) => {
      state.selectedShowtime = null;
      state.selectedSeats = [];
      state.selectedConcessions = {};
      state.bookingDetails = null;
      state.error = null;
    },
    setBookingLoading: (state, action) => {
      state.loading = action.payload;
    },
    setBookingSuccess: (state, action) => {
      state.bookingDetails = action.payload;
      state.loading = false;
      state.error = null;
    },
    setBookingFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setSelectShowtime,
  setSelectedSeats,
  toggleSeatSelection,
  updateConcessionQuantity,
  clearBookingFlow,
  setBookingLoading,
  setBookingSuccess,
  setBookingFailure,
} = bookingSlice.actions;

export default bookingSlice.reducer;
