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

const bookingService = {
  getShowtimesByMovie,
  getShowtimeById,
  getShowtimes,
  createBooking,
  getMyBookings,
  getBookingById,
};

export default bookingService;
