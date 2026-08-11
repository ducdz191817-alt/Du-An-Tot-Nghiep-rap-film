const express = require("express");
const router = express.Router();
const {
  createMovie,
  updateMovie,
  deleteMovie,
  checkMovieBookings,
  createTheater,
  updateTheater,
  deleteTheater,
  listTheaters,
  createRoom,
  updateRoom,
  deleteRoom,
  listRooms,
  getRoomSeats,
  checkRoomEditable,
  saveRoomLayout,
  updateSeat,
  bulkUpdateSeats,
  createConcession,
  updateConcession,
  deleteConcession,
  listConcessions,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  autoGenerateShowtimes,
  getPricingConfig,
  updatePricingConfig,
  previewTicketPrice,
  getDashboardStats,
  getRevenueReport,
  listBookings,
  deleteBooking,
  printTicket,
  checkInTicket,
  sendBookingEmail,
  sendBulkEmail,
  listUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} = require("../controllers/admin.controller");
const { protect, admin, staffOrAdmin } = require("../middleware/auth.middleware");

// Apply authentication protection to all routes
router.use(protect);

// Booking Management (Accessible by Staff & Admin)
router.get('/bookings', staffOrAdmin, listBookings);
router.post('/bookings/check-in', staffOrAdmin, checkInTicket);
router.post('/bookings/:id/print', staffOrAdmin, printTicket);
router.post('/bookings/send-email-bulk', staffOrAdmin, sendBulkEmail);
router.post('/bookings/:id/send-email', staffOrAdmin, sendBookingEmail);

// Read-only info for Showtime viewing (Accessible by Staff & Admin)
router.get('/theaters', staffOrAdmin, listTheaters);
router.get('/rooms', staffOrAdmin, listRooms);
router.get('/rooms/:id/seats', staffOrAdmin, getRoomSeats);

// All routes below require full Admin role
router.use(admin);

// Movies
router.post("/movies", createMovie);
router.get("/movies/:id/check-bookings", checkMovieBookings);
router.route("/movies/:id").put(updateMovie).delete(deleteMovie);

// Theaters (Mutation)
router.post("/theaters", createTheater);
router.route("/theaters/:id").put(updateTheater).delete(deleteTheater);

// Rooms (Mutation)
router.post("/rooms", createRoom);
router.route("/rooms/:id").put(updateRoom).delete(deleteRoom);
router.get("/rooms/:id/check-editable", checkRoomEditable);
router.put("/rooms/:id/seats/layout", saveRoomLayout);

// Room Types & Seat Pricing
router.route("/room-types").get(getRoomTypes).post(createRoomType);
router.route("/room-types/:id").put(updateRoomType).delete(deleteRoomType);

// Seats
router.patch("/seats/bulk", bulkUpdateSeats);
router.put("/seats/:id", updateSeat);

// Concessions
router.route("/concessions").get(listConcessions).post(createConcession);
router.route("/concessions/:id").put(updateConcession).delete(deleteConcession);

// Showtimes
router.post("/showtimes/auto-generate", autoGenerateShowtimes);
router.post("/showtimes", createShowtime);
router.route("/showtimes/:id").put(updateShowtime).delete(deleteShowtime);

// Pricing Config
router.route("/pricing").get(getPricingConfig).put(updatePricingConfig);
router.post("/pricing/preview", previewTicketPrice);

// Dashboard & Analytics
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/revenue", getRevenueReport);

// Admin-only Booking operations (e.g., delete booking)
router.delete('/bookings/:id', deleteBooking);

// Coupon Management (Admin)
const { listCoupons, createCoupon, updateCoupon, deleteCoupon } = require("../controllers/coupon.controller");
router.route("/coupons").get(listCoupons).post(createCoupon);
router.route("/coupons/:id").put(updateCoupon).delete(deleteCoupon);

// User Management
router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
