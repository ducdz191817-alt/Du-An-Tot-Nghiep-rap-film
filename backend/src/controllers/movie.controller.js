const Movie = require('../models/Movie.model');

// @desc    Get all movies with filters
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res, next) => {
  try {
    const { status, search, genre, rating } = req.query;

    const query = {};

    // Filter by status ('now-showing', 'coming-soon')
    if (status) {
      if (status !== 'all') {
        query.status = status;
      }
    } else {
      query.status = { $ne: 'ended' }; // Default: exclude ended movies
    }

    // Filter by title / description search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by genre
    if (genre) {
      query.genre = { $in: [genre] };
    }

    // Filter by rating
    if (rating) {
      query.rating = rating;
    }

    const movies = await Movie.find(query).sort({ releaseDate: -1 });

    res.json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }

    res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
};
