import api from './api';

const normalizeResponse = (response) => {
  return response && response.data !== undefined ? response.data : response;
};

const getShowtimesByMovie = async (movieId, date = '') => {
  const response = await api.get(`/showtimes/movie/${movieId}`, {
    params: date ? { date } : {},
  });
  return normalizeResponse(response);
};

const getShowtimeById = async (id) => {
  const response = await api.get(`/showtimes/${id}`);
  return normalizeResponse(response);
};

const getShowtimes = async (filters = {}) => {
  const response = await api.get('/showtimes', { params: filters });
  return normalizeResponse(response);
};

const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return normalizeResponse(response);
};

const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  return normalizeResponse(response);
};

const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return normalizeResponse(response);
};

const getConcessions = async (theaterId = '') => {
  const response = await api.get('/concessions', {
    params: theaterId ? { theaterId } : {},
  });
  return normalizeResponse(response);
};

const getBookingStatus = async (id) => {
  const response = await api.get(`/bookings/${id}/status`);
  return normalizeResponse(response);
};

const simulatePayment = async (id) => {
  const response = await api.post(`/bookings/${id}/simulate-pay`);
  return normalizeResponse(response);
};

const cancelBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}/cancel`);
  return normalizeResponse(response);
};

// Public: Xác minh vé từ QR code (không cần đăng nhập)
const verifyTicket = async (ticketCode) => {
  const response = await api.get(`/bookings/verify/${ticketCode}`);
  return normalizeResponse(response);
};

const bookingService = {
  getShowtimesByMovie,
  getShowtimeById,
  getShowtimes,
  createBooking,
  getMyBookings,
  getBookingById,
  getConcessions,
  getBookingStatus,
  simulatePayment,
  cancelBooking,
  verifyTicket,
};

export default bookingService;
