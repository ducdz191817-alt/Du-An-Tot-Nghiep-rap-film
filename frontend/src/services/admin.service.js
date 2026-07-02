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

// Dashboard Stats & Revenue Reports
const getDashboardStats = async (params = {}) => {
  const response = await api.get('/admin/dashboard/stats', { params });
  return response.data;
};

const getRevenueReport = async () => {
  const response = await api.get('/admin/dashboard/revenue');
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

// User Management
const getUsers = async (role = '') => {
  const response = await api.get('/admin/users', {
    params: role ? { role } : {},
  });
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

const adminService = {
  createMovie,
  updateMovie,
  deleteMovie,
  getTheaters,
  createTheater,
  updateTheater,
  deleteTheater,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomSeats,
  updateSeat,
  bulkUpdateSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getConcessions,
  createConcession,
  updateConcession,
  deleteConcession,
  getDashboardStats,
  getRevenueReport,
  getBookings,
  deleteBooking,
  getUsers,
  updateUserRole,
  deleteUser,
  searchTMDB,
  getTMDBMovieDetail,
  getTMDBTrending,
};

export default adminService;
