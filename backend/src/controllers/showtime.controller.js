const Showtime = require('../models/Showtime.model');
const Seat = require('../models/Seat.model');
const { checkAndExpirePendingBookings } = require('../utils/bookingCleanup');

// @desc    Get showtimes for a movie grouped by theater and date
// @route   GET /api/showtimes/movie/:movieId
// @access  Public
const getShowtimesByMovie = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { movieId } = req.params;

    const query = { movie: movieId };

    // Filter by date if provided (match day range)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Default: showtimes from now onwards
      query.startTime = { $gte: new Date() };
    }

    const showtimes = await Showtime.find(query)
      .populate('theater')
      .populate('room')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get showtime details (including seats structure and availability)
// @route   GET /api/showtimes/:id
// @access  Public
const getShowtimeById = async (req, res, next) => {
  try {
    await checkAndExpirePendingBookings();
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie')
      .populate('theater')
      .populate('room');

    if (!showtime) {
      res.status(404);
      throw new Error('Showtime not found');
    }

    // Get all seats registered for this room
    const seats = await Seat.find({ room: showtime.room._id }).sort({ row: 1, number: 1 });

    res.json({
      success: true,
      data: {
        showtime,
        seats, // These are master seats in the room
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all showtimes (optionally filtered by theater/room)
// @route   GET /api/showtimes
// @access  Public
const getShowtimes = async (req, res, next) => {
  try {
    const { theaterId, roomId } = req.query;
    const query = {};
    if (theaterId) query.theater = theaterId;
    if (roomId) query.room = roomId;

    const showtimes = await Showtime.find(query)
      .populate('movie')
      .populate('theater')
      .populate('room')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowtimesByMovie,
  getShowtimeById,
  getShowtimes,
};
