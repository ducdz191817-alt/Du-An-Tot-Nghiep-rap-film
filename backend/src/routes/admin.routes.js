const express = require("express");
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
  listUsers,
  updateUserRole,
  deleteUser,
} = require("../controllers/admin.controller");
const { protect, admin } = require("../middleware/auth.middleware");

// Apply protection & admin role validation to all administrative routes
router.use(protect);
router.use(admin);

// Movies
router.post("/movies", createMovie);
router.route("/movies/:id").put(updateMovie).delete(deleteMovie);

// Theaters
router.route("/theaters").get(listTheaters).post(createTheater);
router.route("/theaters/:id").put(updateTheater).delete(deleteTheater);

// Rooms
router.route("/rooms").get(listRooms).post(createRoom);
router.route("/rooms/:id").put(updateRoom).delete(deleteRoom);
router.get("/rooms/:id/seats", getRoomSeats);
router.get("/rooms/:id/check-editable", checkRoomEditable);
router.put("/rooms/:id/seats/layout", saveRoomLayout);

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

// Booking Management
router.get('/bookings', listBookings);
router.delete('/bookings/:id', deleteBooking);
router.post('/bookings/:id/print', printTicket);
router.post('/bookings/check-in', checkInTicket);

// Coupon Management (Admin)
const { listCoupons, createCoupon, updateCoupon, deleteCoupon } = require("../controllers/coupon.controller");
router.route("/coupons").get(listCoupons).post(createCoupon);
router.route("/coupons/:id").put(updateCoupon).delete(deleteCoupon);

// User Management
router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
