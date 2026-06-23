const express = require('express');
const router = express.Router();
const { getMovies, getMovieById, getBestSellers } = require('../controllers/movie.controller');

router.get('/best-sellers', getBestSellers);
router.get('/', getMovies);
router.get('/:id', getMovieById);

module.exports = router;
