const Movie = require('../models/Movie.model');

// @desc    Get all movies with filters
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res, next) => {
  try {
    const { status, search, genre, rating } = req.query;

    const query = {};

    // Filter by status ('now-showing', 'coming-soon', 'preview', 'pre-release', etc.)
    if (status) {
      if (status !== 'all') {
        query.status = status;
      }
    } else {
      // Default: only show public-facing statuses to customers
      query.status = { $in: ['now-showing', 'coming-soon', 'pre-release', 'preview'] };
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

    const movies = await Movie.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'movie',
          as: 'movieReviews',
        },
      },
      {
        $addFields: {
          reviewsCount: { $size: '$movieReviews' },
          reviewsAverage: {
            $cond: {
              if: { $eq: [{ $size: '$movieReviews' }, 0] },
              then: 0,
              else: { $round: [{ $avg: '$movieReviews.rating' }, 1] },
            },
          },
        },
      },
      {
        $project: {
          movieReviews: 0,
        },
      },
      {
        $sort: { releaseDate: -1 },
      },
    ]);

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
