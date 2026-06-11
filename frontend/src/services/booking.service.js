import api from './api';

const getShowtimesByMovie = async (movieId, date = '') => {
  const response = await api.get(`/showtimes/movie/${movieId}`, {
    params: date ? { date } : {},
  });
  return response.data;
};

const getShowtimeById = async (id) => {
  const response = await api.get(`/showtimes/${id}`);
  return response.data;
};

const getShowtimes = async (filters = {}) => {
  const response = await api.get('/showtimes', { params: filters });
  return response.data;
};

const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  return response.data;
};

const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

const getConcessions = async (theaterId = '') => {
  const response = await api.get('/concessions', {
    params: theaterId ? { theaterId } : {},
  });
  return response.data;
};

const getBookingStatus = async (id) => {
  const response = await api.get(`/bookings/${id}/status`);
  return response.data;
};

const simulatePayment = async (id) => {
  const response = await api.post(`/bookings/${id}/simulate-pay`);
  return response.data;
};

const cancelBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}/cancel`);
  return response.data;
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
};

export default bookingService;
