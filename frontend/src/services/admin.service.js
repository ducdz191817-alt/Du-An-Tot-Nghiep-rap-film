import api from './api';

// Movie Management
const createMovie = async (movieData) => {
  const response = await api.post('/admin/movies', movieData);
  return response.data;
};

const updateMovie = async (id, movieData) => {
  const response = await api.put(`/admin/movies/${id}`, movieData);
  return response.data;
};

const deleteMovie = async (id) => {
  const response = await api.delete(`/admin/movies/${id}`);
  return response.data;
};

const checkMovieBookings = async (id) => {
  const response = await api.get(`/admin/movies/${id}/check-bookings`);
  return response.data;
};

const getTheaters = async () => {
  const response = await api.get('/admin/theaters');
  return response.data;
};

const createTheater = async (theaterData) => {
  const response = await api.post('/admin/theaters', theaterData);
  return response.data;
};

const updateTheater = async (id, theaterData) => {
  const response = await api.put(`/admin/theaters/${id}`, theaterData);
  return response.data;
};

const toggleTheaterStatus = async (id) => {
  const response = await api.patch(`/admin/theaters/${id}/toggle`);
  return response.data;
};

const deleteTheater = async (id) => {
  const response = await api.delete(`/admin/theaters/${id}`);
  return response.data;
};

const getRooms = async (theaterId = '') => {
  const response = await api.get('/admin/rooms', {
    params: theaterId ? { theaterId } : {},
  });
  return response.data;
};

const createRoom = async (roomData) => {
  const response = await api.post('/admin/rooms', roomData);
  return response.data;
};

const updateRoom = async (id, roomData) => {
  const response = await api.put(`/admin/rooms/${id}`, roomData);
  return response.data;
};

const deleteRoom = async (id) => {
  const response = await api.delete(`/admin/rooms/${id}`);
  return response.data;
};

// Seat Management
const getRoomSeats = async (roomId) => {
  const response = await api.get(`/admin/rooms/${roomId}/seats`);
  return response.data;
};

const checkRoomEditable = async (roomId) => {
  const response = await api.get(`/admin/rooms/${roomId}/check-editable`);
  return response?.data || response;
};

const saveRoomLayout = async (roomId, seats) => {
  const response = await api.put(`/admin/rooms/${roomId}/seats/layout`, { seats });
  return response?.data || response;
};

const updateSeat = async (id, seatData) => {
  const response = await api.put(`/admin/seats/${id}`, seatData);
  return response.data;
};

const bulkUpdateSeats = async (updates) => {
  const response = await api.patch('/admin/seats/bulk', { updates });
  return response.data;
};

// Showtime Management
const createShowtime = async (showtimeData) => {
  const response = await api.post('/admin/showtimes', showtimeData);
  return response.data;
};

const updateShowtime = async (id, showtimeData) => {
  const response = await api.put(`/admin/showtimes/${id}`, showtimeData);
  return response.data;
};

const deleteShowtime = async (id) => {
  const response = await api.delete(`/admin/showtimes/${id}`);
  return response.data;
};

const autoGenerateShowtimes = async (data) => {
  const response = await api.post('/admin/showtimes/auto-generate', data);
  return response.data;
};

// Concessions
const getConcessions = async (theaterId = '') => {
  const response = await api.get('/admin/concessions', {
    params: theaterId ? { theaterId } : {},
  });
  return response.data;
};

const createConcession = async (concessionData) => {
  const response = await api.post('/admin/concessions', concessionData);
  return response.data;
};

const updateConcession = async (id, concessionData) => {
  const response = await api.put(`/admin/concessions/${id}`, concessionData);
  return response.data;
};

const deleteConcession = async (id) => {
  const response = await api.delete(`/admin/concessions/${id}`);
  return response.data;
};

const toggleConcessionStatus = async (id) => {
  const response = await api.patch(`/admin/concessions/${id}/toggle`);
  return response.data;
};

// Dashboard Stats & Revenue Reports
const getDashboardStats = async (params = {}) => {
  const response = await api.get('/admin/dashboard/stats', { params });
  return response.data;
};

const getRevenueReport = async (params = {}) => {
  const response = await api.get('/admin/dashboard/revenue', { params });
  return response.data;
};

const getBookings = async () => {
  const response = await api.get('/admin/bookings');
  return response.data;
};

const deleteBooking = async (id) => {
  const response = await api.delete(`/admin/bookings/${id}`);
  return response.data;
};

const printTicket = async (id) => {
  const response = await api.post(`/admin/bookings/${id}/print`);
  return response;
};

const checkInTicket = async (data) => {
  const response = await api.post('/admin/bookings/check-in', data);
  return response;
};

// Email notifications
const sendBookingEmail = async (bookingId) => {
  const response = await api.post(`/admin/bookings/${bookingId}/send-email`);
  return response.data;
};

const sendBulkEmail = async (data) => {
  // data: { showtimeId } or { bookingIds: [...] } + optional { subject, customMessage }
  const response = await api.post('/admin/bookings/send-email-bulk', data);
  return response.data;
};

// User Management
const getUsers = async (role = '') => {
  const response = await api.get('/admin/users', {
    params: role ? { role } : {},
  });
  return response.data;
};

const createUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

const updateUser = async (id, userData) => {
  const response = await api.put(`/admin/users/${id}`, userData);
  return response.data;
};

const updateUserRole = async (id, role) => {
  const response = await api.put(`/admin/users/${id}/role`, { role });
  return response.data;
};

const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

const toggleUserStatus = async (id) => {
  const response = await api.put(`/admin/users/${id}/toggle-status`);
  return response.data;
};

// Pricing Config
const getPricingConfig = async () => {
  const response = await api.get('/admin/pricing');
  return response.data;
};

const updatePricingConfig = async (data) => {
  const response = await api.put('/admin/pricing', data);
  return response.data;
};

const previewTicketPrice = async (params) => {
  const response = await api.post('/admin/pricing/preview', params);
  return response.data;
};

// TMDB Integration
const searchTMDB = async (query, page = 1) => {
  const response = await api.get('/admin/tmdb/search', {
    params: { query, page },
  });
  return response;
};

const getTMDBMovieDetail = async (tmdbId) => {
  const response = await api.get(`/admin/tmdb/movie/${tmdbId}`);
  return response;
};

const getTMDBTrending = async () => {
  const response = await api.get('/admin/tmdb/trending');
  return response;
};

// Upload ảnh poster / ảnh món ăn
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response?.data ?? response;
};

// Room Types & Seat Pricing
const getRoomTypes = async () => {
  const response = await api.get('/admin/room-types');
  return response.data;
};

const createRoomType = async (data) => {
  const response = await api.post('/admin/room-types', data);
  return response.data;
};

const updateRoomType = async (id, data) => {
  const response = await api.put(`/admin/room-types/${id}`, data);
  return response.data;
};

const deleteRoomType = async (id) => {
  const response = await api.delete(`/admin/room-types/${id}`);
  return response.data;
};

const adminService = {
  createMovie,
  updateMovie,
  deleteMovie,
  checkMovieBookings,
  getTheaters,
  createTheater,
  updateTheater,
  toggleTheaterStatus,
  deleteTheater,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomSeats,
  checkRoomEditable,
  saveRoomLayout,
  updateSeat,
  bulkUpdateSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  autoGenerateShowtimes,
  getConcessions,
  createConcession,
  updateConcession,
  deleteConcession,
  toggleConcessionStatus,
  getDashboardStats,
  getRevenueReport,
  getBookings,
  deleteBooking,
  printTicket,
  checkInTicket,
  sendBookingEmail,
  sendBulkEmail,
  getUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  searchTMDB,
  getTMDBMovieDetail,
  getTMDBTrending,
  uploadImage,
  getPricingConfig,
  updatePricingConfig,
  previewTicketPrice,
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
};

export default adminService;
