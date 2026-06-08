const Movie = require('../models/Movie.model');
const Theater = require('../models/Theater.model');
const Room = require('../models/Room.model');
const Showtime = require('../models/Showtime.model');
const Booking = require('../models/Booking.model');
const User = require('../models/User.model');
const Concession = require('../models/Concession.model');
const { generateSeatsForRoom } = require('../utils/generateSeats');

// ==========================================
// 1. Movie Management
// ==========================================
const createMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({ success: true, data: movie });
  } catch (error) {
    next(error);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    res.json({ success: true, data: movie });
  } catch (error) {
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    // Set associated showtimes' status / clean up
    await Showtime.deleteMany({ movie: req.params.id });
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. Theater, Room & Concession Management
// ==========================================
const createTheater = async (req, res, next) => {
  try {
    const theater = await Theater.create(req.body);
    res.status(201).json({ success: true, data: theater });
  } catch (error) {
    next(error);
  }
};

const updateTheater = async (req, res, next) => {
  try {
    const theater = await Theater.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!theater) {
      res.status(404);
      throw new Error('Theater not found');
    }
    res.json({ success: true, data: theater });
  } catch (error) {
    next(error);
  }
};

const listTheaters = async (req, res, next) => {
  try {
    const theaters = await Theater.find();
    res.json({ success: true, count: theaters.length, data: theaters });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { name, theaterId, type = '2D', capacity = 80, standardRows = 5, vipRows = 3, coupleRows = 1, seatsPerRow = 10 } = req.body;

    const room = await Room.create({
      name,
      theater: theaterId,
      type,
      capacity,
    });

    // Automatically generate seats for this room
    await generateSeatsForRoom(room._id, standardRows, vipRows, coupleRows, seatsPerRow);

    res.status(201).json({
      success: true,
      data: room,
      message: `Room created successfully and ${capacity} seats pre-generated.`,
    });
  } catch (error) {
    next(error);
  }
};

const listRooms = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.theaterId) {
      query.theater = req.query.theaterId;
    }
    const rooms = await Room.find(query).populate('theater');
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    next(error);
  }
};

const deleteTheater = async (req, res, next) => {
  try {
    const theaterId = req.params.id;
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      res.status(404);
      throw new Error('Theater not found');
    }

    // Cascading delete
    const rooms = await Room.find({ theater: theaterId });
    const roomIds = rooms.map((r) => r._id);

    await Seat.deleteMany({ room: { $in: roomIds } });

    const showtimes = await Showtime.find({ theater: theaterId });
    const showtimeIds = showtimes.map((s) => s._id);

    await Booking.deleteMany({ showtime: { $in: showtimeIds } });
    await Showtime.deleteMany({ theater: theaterId });
    await Room.deleteMany({ theater: theaterId });
    await Theater.findByIdAndDelete(theaterId);

    res.json({ success: true, message: 'Theater and all associated rooms, seats, showtimes, and bookings deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const { name, type } = req.body;

    const room = await Room.findByIdAndUpdate(
      roomId,
      { name, type },
      { new: true, runValidators: true }
    );

    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    await Seat.deleteMany({ room: roomId });

    const showtimes = await Showtime.find({ room: roomId });
    const showtimeIds = showtimes.map((s) => s._id);

    await Booking.deleteMany({ showtime: { $in: showtimeIds } });
    await Showtime.deleteMany({ room: roomId });
    await Room.findByIdAndDelete(roomId);

    res.json({ success: true, message: 'Room and all associated seats, showtimes, and bookings deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const createConcession = async (req, res, next) => {
  try {
    const concession = await Concession.create(req.body);
    res.status(201).json({ success: true, data: concession });
  } catch (error) {
    next(error);
  }
};

const updateConcession = async (req, res, next) => {
  try {
    const concession = await Concession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!concession) {
      res.status(404);
      throw new Error('Concession not found');
    }
    res.json({ success: true, data: concession });
  } catch (error) {
    next(error);
  }
};

const listConcessions = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.theaterId) {
      query.theater = req.query.theaterId;
    }
    const concessions = await Concession.find(query).populate('theater');
    res.json({ success: true, count: concessions.length, data: concessions });
  } catch (error) {
    next(error);
  }
};

const deleteConcession = async (req, res, next) => {
  try {
    const concession = await Concession.findByIdAndDelete(req.params.id);
    if (!concession) {
      res.status(404);
      throw new Error('Concession not found');
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. Showtime Management
// ==========================================
const createShowtime = async (req, res, next) => {
  try {
    const { movieId, theaterId, roomId, startTime, ticketPrice, format } = req.body;

    // Check movie duration
    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + movie.duration * 60000 + 20 * 60000); // add 20 mins break time

    // Prevent showtime overlapping in the same room
    const overlappingShowtime = await Showtime.findOne({
      room: roomId,
      $or: [
        { startTime: { $gte: start, $lt: end } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (overlappingShowtime) {
      res.status(400);
      throw new Error(`Overlapping showtime! This room is occupied from ${overlappingShowtime.startTime.toLocaleTimeString()} to ${overlappingShowtime.endTime.toLocaleTimeString()}.`);
    }

    const showtime = await Showtime.create({
      movie: movieId,
      theater: theaterId,
      room: roomId,
      startTime: start,
      endTime: end,
      ticketPrice,
      format,
    });

    res.status(201).json({ success: true, data: showtime });
  } catch (error) {
    next(error);
  }
};

const updateShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!showtime) {
      res.status(404);
      throw new Error('Showtime not found');
    }
    res.json({ success: true, data: showtime });
  } catch (error) {
    next(error);
  }
};

const deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    if (!showtime) {
      res.status(404);
      throw new Error('Showtime not found');
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. Reports & Analytics
// ==========================================
const getDashboardStats = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalMovies = await Movie.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTheaters = await Theater.countDocuments();

    // Total sales accumulation
    const bookings = await Booking.find({ paymentStatus: 'paid' });
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Get recent bookings listing
    const recentBookings = await Booking.find()
      .populate('user', 'username email')
      .populate({
        path: 'showtime',
        populate: [{ path: 'movie', select: 'title' }, { path: 'theater', select: 'name' }],
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          totalMovies,
          totalUsers,
          totalTheaters,
          totalRevenue,
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueReport = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ paymentStatus: 'paid' })
      .populate({
        path: 'showtime',
        populate: [{ path: 'movie', select: 'title genre' }, { path: 'theater', select: 'name' }],
      });

    // 1. Group revenue by movie
    const movieSales = {};
    // 2. Group revenue by theater
    const theaterSales = {};
    // 3. Group revenue by month
    const monthlySales = {};

    bookings.forEach((booking) => {
      const showtime = booking.showtime;
      if (!showtime) return;

      const movieTitle = showtime.movie ? showtime.movie.title : 'Deleted Movie';
      const theaterName = showtime.theater ? showtime.theater.name : 'Deleted Theater';
      
      const date = new Date(booking.bookingDate);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });

      // Aggregate Movie
      movieSales[movieTitle] = (movieSales[movieTitle] || 0) + booking.totalPrice;

      // Aggregate Theater
      theaterSales[theaterName] = (theaterSales[theaterName] || 0) + booking.totalPrice;

      // Aggregate Month
      monthlySales[monthYear] = (monthlySales[monthYear] || 0) + booking.totalPrice;
    });

    const formatObjectToArray = (obj) => {
      return Object.keys(obj).map((key) => ({ name: key, value: obj[key] }));
    };

    res.json({
      success: true,
      data: {
        movieSales: formatObjectToArray(movieSales),
        theaterSales: formatObjectToArray(theaterSales),
        monthlySales: formatObjectToArray(monthlySales),
        rawBookingsCount: bookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title' },
          { path: 'theater', select: 'name' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate({
        path: 'concessions.concession',
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // 1. Release the booked seats in the Showtime document
    if (booking.seats && booking.seats.length > 0 && booking.showtime) {
      await Showtime.findByIdAndUpdate(booking.showtime, {
        $pull: { bookedSeats: { $in: booking.seats } },
      });
    }

    // 2. Delete related payment transactions
    const Payment = require('../models/Payment.model');
    await Payment.deleteMany({ booking: booking._id });

    // 3. Delete the booking itself
    await booking.deleteOne();

    res.json({
      success: true,
      message: 'Đặt vé đã được xóa và giải phóng ghế thành công',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  deleteConcession,
  listConcessions,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getDashboardStats,
  getRevenueReport,
  listBookings,
  deleteBooking,
};
