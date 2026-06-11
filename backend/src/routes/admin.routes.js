const express = require('express');
const router = express.Router();
const {
  createMovie,
  updateMovie,
  deleteMovie,
  createTheater,
  updateTheater,
  deleteTheater,
  listTheaters,
  createRoom,
  updateRoom,
  deleteRoom,
  listRooms,
  getRoomSeats,
  updateSeat,
  bulkUpdateSeats,
  createConcession,
  updateConcession,
  deleteConcession,
  listConcessions,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getDashboardStats,
  getRevenueReport,
  listBookings,
  deleteBooking,
  listUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Apply protection & admin role validation to all administrative routes
router.use(protect);
router.use(admin);

// Movies
router.post('/movies', createMovie);
router.route('/movies/:id')
  .put(updateMovie)
  .delete(deleteMovie);

// Theaters
router.route('/theaters')
  .get(listTheaters)
  .post(createTheater);
router.route('/theaters/:id')
  .put(updateTheater)
  .delete(deleteTheater);

// Rooms
router.route('/rooms')
  .get(listRooms)
  .post(createRoom);
router.route('/rooms/:id')
  .put(updateRoom)
  .delete(deleteRoom);
router.get('/rooms/:id/seats', getRoomSeats);

// Seats
router.put('/seats/:id', updateSeat);
router.patch('/seats/bulk', bulkUpdateSeats);

// Concessions
router.route('/concessions')
  .get(listConcessions)
  .post(createConcession);
router.route('/concessions/:id')
  .put(updateConcession)
  .delete(deleteConcession);

// Showtimes
router.post('/showtimes', createShowtime);
router.route('/showtimes/:id')
  .put(updateShowtime)
  .delete(deleteShowtime);

// Dashboard & Analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/revenue', getRevenueReport);

// Booking Management
router.get('/bookings', listBookings);
router.delete('/bookings/:id', deleteBooking);

// User Management
router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
