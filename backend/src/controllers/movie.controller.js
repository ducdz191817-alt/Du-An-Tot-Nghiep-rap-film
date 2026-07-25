const Movie = require('../models/Movie.model');

// @desc    Get all movies with filters
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res, next) => {
  try {
    const { status, search, genre, genres, rating, date } = req.query;

    const query = {};

    // Filter by status ('now-showing', 'coming-soon', 'preview', 'pre-release', etc.)
    if (status) {
      if (status === 'all') {
        query.status = { $nin: ['hidden', 'suspended', 'cancelled', 'stopped'] };
      } else {
        query.status = status;
      }
    } else {
      // Default: do not show admin-only statuses
      query.status = { $nin: ['hidden', 'suspended', 'cancelled', 'stopped'] };
    }

    // Filter by title / description search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by show date
    if (date) {
      try {
        const Showtime = require('../models/Showtime.model');
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const showtimes = await Showtime.find({
          startTime: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).select('movie');

        const movieIds = showtimes.map((s) => s.movie);
        query._id = { $in: movieIds };
      } catch (err) {
        console.error('Error filtering movies by date:', err);
      }
    }

    // Filter by genre or multi-genre selection
    const genreValues = genres || genre;
    if (genreValues) {
      const genreList = Array.isArray(genreValues)
        ? genreValues
        : String(genreValues)
          .split(',')
          .map((g) => g.trim())
          .filter((g) => g !== '');

      if (genreList.length > 0) {
        query.genre = { $in: genreList };
      }
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
        $sort: { createdAt: -1 },
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

// @desc    Get top best selling movies
// @route   GET /api/movies/best-sellers
// @access  Public
const getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const Booking = require('../models/Booking.model');

    // 1. Aggregate bookings to count tickets sold per movie
    const bestSellersAgg = await Booking.aggregate([
      // Only count paid bookings
      { $match: { paymentStatus: 'paid' } },
      // Lookup showtime info to link to Movie
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime',
          foreignField: '_id',
          as: 'showtimeInfo',
        },
      },
      { $unwind: '$showtimeInfo' },
      // Group by movie ID and sum the number of seats booked (tickets sold)
      {
        $group: {
          _id: '$showtimeInfo.movie',
          ticketsSold: { $sum: { $size: '$seats' } },
          revenue: { $sum: '$totalPrice' },
        },
      },
      // Sort by ticketsSold descending
      { $sort: { ticketsSold: -1 } },
      // Limit to get top N
      { $limit: limit },
    ]);

    // 2. Fetch full movie details for these top movies, including reviews count & average
    const movieIds = bestSellersAgg.map((item) => item._id);

    let movies = [];
    if (movieIds.length > 0) {
      movies = await Movie.aggregate([
        { $match: { _id: { $in: movieIds } } },
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
      ]);

      // Map back ticketsSold and sort correctly based on the best sellers rank
      const moviesMap = movies.reduce((acc, movie) => {
        acc[movie._id.toString()] = movie;
        return acc;
      }, {});

      movies = bestSellersAgg
        .map((item) => {
          if (!item._id) return null;
          const m = moviesMap[item._id.toString()];
          if (m) {
            return {
              ...m,
              ticketsSold: item.ticketsSold,
              revenue: item.revenue,
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    // Fallback/Fill up if movies length is less than 4 to make the homepage look beautiful
    if (movies.length < 4) {
      const existingIds = movies.map(m => m._id.toString());
      const mongoose = require('mongoose');

      // Convert existingIds string to ObjectIds
      const existingObjectIds = existingIds.map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      const fallbackMovies = await Movie.aggregate([
        {
          $match: {
            _id: { $nin: existingObjectIds },
            status: { $in: ['now-showing', 'preview'] }
          }
        },
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
        { $limit: 8 - movies.length }
      ]);

      // Assign a simulated ticketsSold for demo/fallback purposes
      const seededFallbackMovies = fallbackMovies.map((m, idx) => ({
        ...m,
        ticketsSold: Math.max(10 - idx * 2, 2) + Math.floor(Math.random() * 5),
        revenue: 0,
      }));

      movies = [...movies, ...seededFallbackMovies];
    }

    // Sort by ticketsSold descending
    movies.sort((a, b) => b.ticketsSold - a.ticketsSold);

    res.json({
      success: true,
      count: movies.length,
      data: movies.slice(0, limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  getBestSellers,
};
