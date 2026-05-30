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
  createConcession,
  updateConcession,
  listConcessions,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getDashboardStats,
  getRevenueReport,
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

// Concessions
router.route("/concessions").get(listConcessions).post(createConcession);
router.put("/concessions/:id", updateConcession);

// Showtimes
router.post("/showtimes", createShowtime);
router.route("/showtimes/:id").put(updateShowtime).delete(deleteShowtime);

// Dashboard & Analytics
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/revenue", getRevenueReport);

module.exports = router;
