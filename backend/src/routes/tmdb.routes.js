const express = require('express');
const router = express.Router();
const { searchTMDB, getTMDBMovieDetail } = require('../controllers/tmdb.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Bảo vệ bởi middleware admin
router.use(protect);
router.use(admin);

// GET /api/admin/tmdb/search?query=...&page=1
router.get('/search', searchTMDB);

// GET /api/admin/tmdb/movie/:tmdbId
router.get('/movie/:tmdbId', getTMDBMovieDetail);

module.exports = router;
