const Movie = require('../models/Movie.model');
const Theater = require('../models/Theater.model');
const Room = require('../models/Room.model');
const RoomType = require('../models/RoomType.model');
const Seat = require('../models/Seat.model');
const Showtime = require('../models/Showtime.model');
const Booking = require('../models/Booking.model');
const User = require('../models/User.model');
const Payment = require('../models/Payment.model');
const Review = require('../models/Review.model');
const Concession = require('../models/Concession.model');
const PricingConfig = require('../models/PricingConfig.model');
const { generateSeatsForRoom } = require('../utils/generateSeats');
const { calculateBaseShowtimePrice } = require('../utils/pricingEngine');
const sendEmail = require('../utils/sendEmail');

// ==========================================
// 1. Movie Management
// ==========================================
const createMovie = async (req, res, next) => {
  try {
    const { title, tmdbId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tên phim không được để trống' });
    }

    const trimmedTitle = title.trim();

    // 1. Kiểm tra theo tmdbId nếu có
    if (tmdbId) {
      const existingTmdbMovie = await Movie.findOne({ tmdbId: Number(tmdbId) });
      if (existingTmdbMovie) {
        return res.status(400).json({
          success: false,
          message: `Phim "${existingTmdbMovie.title}" (TMDB ID: ${tmdbId}) đã tồn tại trên hệ thống.`,
        });
      }
    }

    // 2. Kiểm tra theo tiêu đề (không phân biệt hoa/thường)
    const escapedTitle = trimmedTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const existingMovie = await Movie.findOne({
      title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
    });

    if (existingMovie) {
      return res.status(400).json({
        success: false,
        message: `Phim "${existingMovie.title}" đã tồn tại trên hệ thống! Không thể tạo trùng lặp.`,
      });
    }

    const movie = await Movie.create(req.body);
    res.status(201).json({ success: true, data: movie });
  } catch (error) {
    next(error);
  }
};

// Helper kiểm tra xem một bộ phim đã phát sinh đơn đặt vé nào chưa
const checkMovieHasBookings = async (movieId) => {
  const showtimes = await Showtime.find({ movie: movieId }).select('_id');
  if (!showtimes || showtimes.length === 0) {
    return { hasBookings: false, bookingCount: 0 };
  }
  const showtimeIds = showtimes.map((s) => s._id);
  const bookingCount = await Booking.countDocuments({
    showtime: { $in: showtimeIds },
    paymentStatus: { $ne: 'cancelled' },
  });
  return { hasBookings: bookingCount > 0, bookingCount };
};

const checkMovieBookings = async (req, res, next) => {
  try {
    const movieId = req.params.id;
    const { hasBookings, bookingCount } = await checkMovieHasBookings(movieId);
    res.json({ success: true, hasBookings, bookingCount });
  } catch (error) {
    next(error);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const movieId = req.params.id;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404);
      throw new Error('Không tìm thấy phim');
    }

    // Kiểm tra xem phim đã có vé đặt chưa -> Chặn chỉnh sửa nếu đã phát sinh vé đặt
    const { hasBookings, bookingCount } = await checkMovieHasBookings(movieId);
    if (hasBookings) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể chỉnh sửa phim "${movie.title}" vì đã có ${bookingCount} lượt đặt vé từ khách hàng!`,
      });
    }

    const { title } = req.body;
    if (title && title.trim()) {
      const trimmedTitle = title.trim();
      const escapedTitle = trimmedTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const existing = await Movie.findOne({
        _id: { $ne: movieId },
        title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Tên phim "${existing.title}" trùng với một bộ phim khác đã có trên hệ thống.`,
        });
      }
    }

    const updatedMovie = await Movie.findByIdAndUpdate(movieId, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updatedMovie });
  } catch (error) {
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const movieId = req.params.id;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404);
      throw new Error('Không tìm thấy phim');
    }

    // 1. Kiểm tra xem phim đã có vé đặt chưa -> Chặn xóa nếu đã phát sinh vé
    const { hasBookings, bookingCount } = await checkMovieHasBookings(movieId);
    if (hasBookings) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể xóa phim "${movie.title}" vì đã có ${bookingCount} lượt đặt vé từ khách hàng!`,
      });
    }

    // 2. Kiểm tra xem phim này đã có suất chiếu nào chưa
    const showtimeCount = await Showtime.countDocuments({ movie: movieId });
    if (showtimeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể xóa phim "${movie.title}" vì phim đã có ${showtimeCount} suất chiếu trong hệ thống. Vui lòng xóa tất cả suất chiếu của phim trước!`,
      });
    }

    movie.status = 'hidden';
    await movie.save();

    res.json({ success: true, message: 'Đã xóa phim thành công!' });
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

// ============================================================================
// CHỨC NĂNG: Tạo phòng chiếu mới và tự động khởi tạo toàn bộ sơ đồ ghế cho phòng đó
// ============================================================================
const createRoom = async (req, res, next) => {
  try {
    // Lấy thông tin cấu hình phòng và sơ đồ ghế từ client gửi lên
    const { name, theaterId, type = '2D', capacity = 80, standardRows = 5, vipRows = 3, coupleRows = 1, seatsPerRow = 10 } = req.body;

    // Tìm cấu hình giá theo loại phòng (nếu có trong RoomType)
    let customSeatPrices = null;
    let roomTypeDoc = null;
    if (type) {
      roomTypeDoc = await RoomType.findOne({ code: type.trim().toUpperCase() });
      if (roomTypeDoc && roomTypeDoc.seatPrices) {
        customSeatPrices = roomTypeDoc.seatPrices;
      }
    }

    // Kiểm tra loại ghế được phép tạo theo cấu hình loại phòng (allowedSeatTypes)
    if (roomTypeDoc && roomTypeDoc.allowedSeatTypes && roomTypeDoc.allowedSeatTypes.length > 0) {
      const allowed = roomTypeDoc.allowedSeatTypes;
      if (standardRows > 0 && !allowed.includes('standard')) {
        return res.status(400).json({
          success: false,
          message: `🚫 Loại phòng "${roomTypeDoc.name}" không cho phép tạo ghế Thường! Chỉ được phép: ${allowed.map(t => t === 'standard' ? 'Thường' : t === 'vip' ? 'VIP' : 'Đôi').join(', ')}.`,
        });
      }
      if (vipRows > 0 && !allowed.includes('vip')) {
        return res.status(400).json({
          success: false,
          message: `🚫 Loại phòng "${roomTypeDoc.name}" không cho phép tạo ghế VIP! Chỉ được phép: ${allowed.map(t => t === 'standard' ? 'Thường' : t === 'vip' ? 'VIP' : 'Đôi').join(', ')}.`,
        });
      }
      if (coupleRows > 0 && !allowed.includes('couple')) {
        return res.status(400).json({
          success: false,
          message: `🚫 Loại phòng "${roomTypeDoc.name}" không cho phép tạo ghế Đôi! Chỉ được phép: ${allowed.map(t => t === 'standard' ? 'Thường' : t === 'vip' ? 'VIP' : 'Đôi').join(', ')}.`,
        });
      }
    }

    // 1. Tạo bản ghi phòng chiếu trong database
    const room = await Room.create({
      name,
      theater: theaterId,
      type: type.trim().toUpperCase(),
      roomTypeRef: roomTypeDoc?._id,
      capacity,
    });

    // 2. Tự động sinh ra toàn bộ danh sách ghế (Thường, VIP, Đôi) cho phòng chiếu này kèm giá theo loại phòng
    await generateSeatsForRoom(room._id, standardRows, vipRows, coupleRows, seatsPerRow, customSeatPrices);

    res.status(201).json({
      success: true,
      data: room,
      message: `Tạo phòng chiếu thành công và tự động tạo ${capacity} ghế theo bảng giá loại phòng ${type.toUpperCase()}.`,
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

    // Kiểm tra xem rạp có suất chiếu và vé đã đặt chưa
    const activeShowtimes = await Showtime.find({ theater: theaterId, endTime: { $gte: new Date() } });
    const showtimeIds = activeShowtimes.map((s) => s._id);
    const bookingCount = await Booking.countDocuments({
      showtime: { $in: showtimeIds },
      paymentStatus: { $in: ['paid', 'pending'] },
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể xóa rạp "${theater.name}" vì đang có ${bookingCount} vé đã được khách hàng đặt cho các suất chiếu sắp tới!`,
      });
    }

    // Cascading delete khi không có vé đặt
    const rooms = await Room.find({ theater: theaterId });
    const roomIds = rooms.map((r) => r._id);

    await Seat.deleteMany({ room: { $in: roomIds } });
    await Booking.deleteMany({ showtime: { $in: showtimeIds } });
    await Showtime.deleteMany({ theater: theaterId });
    await Room.deleteMany({ theater: theaterId });
    await Theater.findByIdAndDelete(theaterId);

    res.json({ success: true, message: 'Theater and all associated rooms, seats, and showtimes deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Helper: Kiểm tra phòng chiếu có vé đã được khách đặt trong các suất chiếu sắp tới hay không
const checkRoomHasActiveBookings = async (roomId) => {
  const now = new Date();
  const showtimes = await Showtime.find({ room: roomId, endTime: { $gte: now } });
  if (showtimes.length === 0) return { hasBookings: false, bookingCount: 0, showtimesCount: 0 };
  const showtimeIds = showtimes.map((s) => s._id);
  const bookingCount = await Booking.countDocuments({
    showtime: { $in: showtimeIds },
    paymentStatus: { $in: ['paid', 'pending'] },
  });
  return { hasBookings: bookingCount > 0, bookingCount, showtimesCount: showtimes.length };
};

// Helper: Kiểm tra loại phòng (RoomType) có vé đã được khách đặt tại bất kỳ phòng nào hay không
const checkRoomTypeHasActiveBookings = async (roomType) => {
  const rooms = await Room.find({
    $or: [{ roomTypeRef: roomType._id }, { type: roomType.code }],
  });
  if (rooms.length === 0) return { hasBookings: false, bookingCount: 0 };
  const roomIds = rooms.map((r) => r._id);
  const now = new Date();
  const showtimes = await Showtime.find({ room: { $in: roomIds }, endTime: { $gte: now } });
  if (showtimes.length === 0) return { hasBookings: false, bookingCount: 0 };
  const showtimeIds = showtimes.map((s) => s._id);
  const bookingCount = await Booking.countDocuments({
    showtime: { $in: showtimeIds },
    paymentStatus: { $in: ['paid', 'pending'] },
  });
  return { hasBookings: bookingCount > 0, bookingCount };
};

const updateRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const { name, type } = req.body;

    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      res.status(404);
      throw new Error('Không tìm thấy phòng chiếu');
    }

    // Nếu thay đổi loại phòng chiếu (type), kiểm tra xem phòng đã có khách đặt vé chưa
    if (type && type !== existingRoom.type) {
      const { hasBookings, bookingCount } = await checkRoomHasActiveBookings(roomId);
      if (hasBookings) {
        res.status(400);
        throw new Error(
          `🚫 Không thể đổi loại phòng chiếu vì phòng này đang có ${bookingCount} vé đã được khách hàng đặt cho các suất chiếu sắp tới.`
        );
      }
    }

    if (name) existingRoom.name = name;
    if (type) {
      existingRoom.type = type;
      const rt = await RoomType.findOne({ code: type });
      if (rt) existingRoom.roomTypeRef = rt._id;
    }

    await existingRoom.save();
    res.json({ success: true, data: existingRoom });
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
      throw new Error('Không tìm thấy phòng chiếu');
    }

    const { hasBookings, bookingCount } = await checkRoomHasActiveBookings(roomId);
    if (hasBookings) {
      res.status(400);
      throw new Error(
        `🚫 Không thể xóa phòng "${room.name}" vì đang có ${bookingCount} vé đã được khách đặt cho các suất chiếu sắp tới.`
      );
    }

    await Seat.deleteMany({ room: roomId });

    const showtimes = await Showtime.find({ room: roomId });
    const showtimeIds = showtimes.map((s) => s._id);

    await Booking.deleteMany({ showtime: { $in: showtimeIds } });
    await Showtime.deleteMany({ room: roomId });
    await Room.findByIdAndDelete(roomId);

    res.json({ success: true, message: 'Đã xóa phòng chiếu thành công' });
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
// 3. Showtime Management (Checked for overlap conflicts)
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
    // Sử dụng strict inequality: kự này bắt đầu trước khi kự kia kết thúc AND kự này kết thúc sau khi kự kia bắt đầu
    const overlappingShowtime = await Showtime.findOne({
      room: roomId,
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlappingShowtime) {
      res.status(400);
      const existStart = overlappingShowtime.startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const existEnd = overlappingShowtime.endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      throw new Error(`⚠️ Lịch chiếu bị trùng! Phòng này đã có suất chiếu "${overlappingShowtime.movie ? (await Movie.findById(overlappingShowtime.movie).select('title'))?.title || 'Khác' : 'Khác'}" từ ${existStart} đến ${existEnd}. Vui lòng chọn giờ chiếu khác.`);
    }

    // --- DYNAMIC PRICING: Tự động tính giá vé theo ngày & giờ ---
    const pricingConfig = await PricingConfig.findOne().lean();
    if (!pricingConfig) {
      res.status(400);
      throw new Error('Chưa có bảng giá được cấu hình. Vui lòng thiết lập bảng giá trong mục “Bảng Giá” trước.');
    }

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      throw new Error('Không tìm thấy phòng chiếu');
    }

    // Tính giá tự động từ Pricing Engine
    const autoPrice = calculateBaseShowtimePrice({
      startTime: start,
      format,
      roomType: room.roomType || 'standard',
      config: pricingConfig,
      movieReleaseDate: movie.releaseDate,
    });

    // Lưu suất chiếu vào DB (Giá vé = autoPrice, phớt lờ input tay)
    const showtime = await Showtime.create({
      movie: movieId,
      theater: theaterId,
      room: roomId,
      startTime: start,
      endTime: end,
      ticketPrice: autoPrice, 
      format,
    });

    res.status(201).json({ success: true, data: showtime });
  } catch (error) {
    next(error);
  }
};

const updateShowtime = async (req, res, next) => {
  try {
    const showtimeId = req.params.id;
    const existingShowtime = await Showtime.findById(showtimeId);
    if (!existingShowtime) {
      res.status(404);
      throw new Error('Showtime not found');
    }

    // Kiểm tra xem suất chiếu này đã có đơn đặt vé nào chưa
    const validBookingCount = await Booking.countDocuments({
      showtime: showtimeId,
      status: { $nin: ['cancelled', 'expired'] },
    });

    const hasBookedSeats = existingShowtime.bookedSeats && existingShowtime.bookedSeats.length > 0;

    if (validBookingCount > 0 || hasBookedSeats) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể chỉnh sửa suất chiếu này vì đã có ${validBookingCount || existingShowtime.bookedSeats.length} vé được đặt!`,
      });
    }

    // Merge updates with existing data to calculate new times/room
    const movieId = req.body.movieId || req.body.movie || existingShowtime.movie;
    const roomId = req.body.roomId || req.body.room || existingShowtime.room;
    const startTimeStr = req.body.startTime || existingShowtime.startTime;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }

    const start = new Date(startTimeStr);
    const end = new Date(start.getTime() + movie.duration * 60000 + 20 * 60000); // add 20 mins break time

    // Prevent showtime overlapping in the same room, excluding current showtime
    const overlappingShowtime = await Showtime.findOne({
      _id: { $ne: showtimeId },
      room: roomId,
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlappingShowtime) {
      res.status(400);
      const existStart = overlappingShowtime.startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const existEnd = overlappingShowtime.endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const existMovie = await Movie.findById(overlappingShowtime.movie).select('title');
      throw new Error(`⚠️ Lịch chiếu bị trùng! Phòng này đã có suất chiếu "${existMovie?.title || 'Khác'}" từ ${existStart} đến ${existEnd}. Vui lòng chọn giờ chiếu khác.`);
    }

    const updateData = {
      ...req.body,
      endTime: end,
    };
    if (req.body.movieId) updateData.movie = req.body.movieId;
    if (req.body.roomId) updateData.room = req.body.roomId;

    const showtime = await Showtime.findByIdAndUpdate(showtimeId, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: showtime });
  } catch (error) {
    next(error);
  }
};

const deleteShowtime = async (req, res, next) => {
  try {
    const showtimeId = req.params.id;
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      res.status(404);
      throw new Error('Showtime not found');
    }

    // Kiểm tra xem suất chiếu này đã có đơn đặt vé nào chưa
    const validBookingCount = await Booking.countDocuments({
      showtime: showtimeId,
      status: { $nin: ['cancelled', 'expired'] },
    });

    const hasBookedSeats = showtime.bookedSeats && showtime.bookedSeats.length > 0;

    if (validBookingCount > 0 || hasBookedSeats) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể xóa suất chiếu này vì đã có ${validBookingCount || showtime.bookedSeats.length} vé được đặt trong hệ thống!`,
      });
    }

    await Showtime.findByIdAndDelete(showtimeId);
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
    const { date, month, year, filter = 'ended' } = req.query;
    const isFiltered = date || month || year;
    const now = new Date();

    const totalMovies = await Movie.countDocuments();
    let totalBookings = 0;
    let totalUsers = 0;
    let recentBookings = [];

    const periodQuery = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      periodQuery.bookingDate = { $gte: start, $lte: end };
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      periodQuery.bookingDate = { $gte: start, $lte: end };
    } else if (year) {
      const y = Number(year);
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      periodQuery.bookingDate = { $gte: start, $lte: end };
    }

    // Lấy tất cả đơn đặt vé đã thanh toán
    const paidBookings = await Booking.find({ ...periodQuery, paymentStatus: 'paid' }).populate('showtime');

    let completedRevenue = 0; // Doanh thu từ suất chiếu đã KẾT THÚC
    let upcomingRevenue = 0;  // Doanh thu từ suất chiếu chưa kết thúc
    let allPaidRevenue = 0;    // Tổng doanh thu đã thanh toán

    paidBookings.forEach((b) => {
      const isEnded = b.showtime && b.showtime.endTime ? new Date(b.showtime.endTime) <= now : true;
      if (isEnded) {
        completedRevenue += b.totalPrice;
      } else {
        upcomingRevenue += b.totalPrice;
      }
      allPaidRevenue += b.totalPrice;
    });

    if (isFiltered) {
      totalBookings = await Booking.countDocuments(periodQuery);
      const bookingsInPeriod = await Booking.find(periodQuery);
      const userIds = new Set(bookingsInPeriod.map((b) => b.user?.toString()).filter(Boolean));
      totalUsers = userIds.size;

      recentBookings = await Booking.find(periodQuery)
        .populate('user', 'username email')
        .populate({
          path: 'showtime',
          populate: [{ path: 'movie', select: 'title' }, { path: 'theater', select: 'name' }],
        })
        .sort({ bookingDate: -1 });
    } else {
      totalBookings = await Booking.countDocuments();
      totalUsers = await User.countDocuments({ role: 'user' });

      recentBookings = await Booking.find()
        .populate('user', 'username email')
        .populate({
          path: 'showtime',
          populate: [{ path: 'movie', select: 'title' }, { path: 'theater', select: 'name' }],
        })
        .sort({ createdAt: -1 })
        .limit(5);
    }

    // totalRevenue hiển thị mặc định theo filter ('ended' = chỉ phim chiếu xong, 'all' = tất cả)
    const displayRevenue = filter === 'all' ? allPaidRevenue : completedRevenue;

    res.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          totalMovies,
          totalUsers,
          totalRevenue: displayRevenue,
          completedRevenue,
          upcomingRevenue,
          allPaidRevenue,
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
    const { status = 'ended' } = req.query; // 'ended' (mặc định: chỉ phim chiếu xong), 'all', 'upcoming'
    const now = new Date();

    const bookings = await Booking.find({ paymentStatus: 'paid' })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title genre duration posterUrl' },
          { path: 'theater', select: 'name' },
          { path: 'room', select: 'capacity' }
        ],
      });

    let completedRevenue = 0;
    let upcomingRevenue = 0;
    let totalRevenue = 0;

    const movieSales = {};
    const theaterSales = {};
    const monthlySales = {};

    bookings.forEach((booking) => {
      const showtime = booking.showtime;
      if (!showtime) return;

      const isEnded = showtime.endTime ? new Date(showtime.endTime) <= now : true;

      if (isEnded) {
        completedRevenue += booking.totalPrice;
      } else {
        upcomingRevenue += booking.totalPrice;
      }
      totalRevenue += booking.totalPrice;

      // Lọc theo query status: 'ended' (chỉ phim đã kết thúc), 'upcoming', 'all'
      if (status === 'ended' && !isEnded) return;
      if (status === 'upcoming' && isEnded) return;

      const movieTitle = showtime.movie ? showtime.movie.title : 'Deleted Movie';
      const theaterName = showtime.theater ? showtime.theater.name : 'Deleted Theater';
      
      const date = new Date(booking.bookingDate);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });

      // Aggregate Movie
      if (!movieSales[movieTitle]) {
        movieSales[movieTitle] = {
          name: movieTitle,
          revenue: 0,
          tickets: 0,
          capacity: 0,
          posterUrl: showtime.movie ? showtime.movie.posterUrl : null,
          genre: showtime.movie ? showtime.movie.genre : [],
          duration: showtime.movie ? showtime.movie.duration : 0,
          uniqueShowtimes: new Set()
        };
      }
      
      movieSales[movieTitle].revenue += booking.totalPrice;
      movieSales[movieTitle].tickets += (booking.seats ? booking.seats.length : 0);
      
      const showtimeId = showtime._id.toString();
      if (!movieSales[movieTitle].uniqueShowtimes.has(showtimeId)) {
         movieSales[movieTitle].uniqueShowtimes.add(showtimeId);
         if (showtime.room && showtime.room.capacity) {
            movieSales[movieTitle].capacity += showtime.room.capacity;
         }
      }

      // Aggregate Theater
      theaterSales[theaterName] = (theaterSales[theaterName] || 0) + booking.totalPrice;

      // Aggregate Month
      monthlySales[monthYear] = (monthlySales[monthYear] || 0) + booking.totalPrice;
    });

    const formatObjectToArray = (obj) => {
      return Object.keys(obj).map((key) => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const item = { ...obj[key] };
          item.value = item.revenue;
          if (item.capacity > 0) {
             item.occupancy = Math.round((item.tickets / item.capacity) * 100);
             if (item.occupancy > 100) item.occupancy = 100;
          } else {
             item.occupancy = 0;
          }
          delete item.uniqueShowtimes;
          return item;
        }
        return { name: key, value: obj[key] };
      });
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
          { path: 'movie', select: 'title posterUrl duration' },
          { path: 'theater', select: 'name' },
          { path: 'room', select: 'name type capacity' },
        ],
      })
      .populate({
        path: 'concessions.concession',
      })
      .sort({ createdAt: -1 });

    // Đảm bảo mọi bản ghi vé đều có ticketCode, ticketStatus và seatDetails
    for (const b of bookings) {
      let needsSave = false;
      if (!b.ticketCode) {
        const d = b.bookingDate || b.createdAt || new Date();
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const suffix = String(b._id).slice(-4).toUpperCase();
        b.ticketCode = `TKT-${yy}${mm}${dd}-${suffix}`;
        if (b.paymentStatus === 'paid' && b.ticketStatus === 'pending') {
          b.ticketStatus = b.isCheckedIn ? 'checked_in' : 'issued';
        }
        needsSave = true;
      }
      if (!b.seatDetails || b.seatDetails.length === 0) {
        const showtime = b.showtime;
        const roomId = showtime?.room?._id || showtime?.room;
        const isSweetbox = showtime?.room?.type === 'SWEETBOX';
        const roomSeats = roomId ? await Seat.find({ room: roomId }) : [];
        const basePrice = showtime?.ticketPrice || showtime?.price || 0;

        b.seatDetails = (b.seats || []).map((seatCode) => {
          const match = seatCode.match(/^([A-Z]+)(\d+)$/);
          let type = isSweetbox ? 'couple' : 'standard';
          let extraPrice = 0;
          let multiplier = type === 'couple' ? 2 : 1;

          if (match) {
            const r = match[1];
            const n = parseInt(match[2], 10);
            const found = roomSeats.find((s) => s.row === r && s.number === n);
            if (found) {
              type = found.type || type;
              extraPrice = found.price || 0;
              multiplier = type === 'couple' ? 2 : 1;
            }
          }

          const price = (basePrice * multiplier) + extraPrice;
          return {
            seatCode,
            type,
            price,
            extraPrice,
          };
        });
        needsSave = true;
      }
      if (needsSave) {
        await b.save();
      }
    }

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: In vé (Cập nhật isPrinted = true, tăng printCount, lưu lịch sử in)
const printTicket = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy vé đặt');
    }

    booking.isPrinted = true;
    booking.printCount = (booking.printCount || 0) + 1;
    booking.printedAt = new Date();
    booking.printLogs = booking.printLogs || [];
    booking.printLogs.push({
      printedAt: new Date(),
      staffName: req.user?.username || 'Admin Cinema',
      device: 'PC-01',
    });

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('user', 'username email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl duration' },
          { path: 'theater', select: 'name' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate('concessions.concession');

    res.json({ success: true, message: 'Đã cập nhật trạng thái in vé thành công', data: updated });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Check-in vé (Quét mã vé / QR Code)
const checkInTicket = async (req, res, next) => {
  try {
    const { ticketCode, bookingId } = req.body;
    let booking;

    if (ticketCode) {
      const cleanCode = ticketCode.trim().toUpperCase();
      booking = await Booking.findOne({ ticketCode: cleanCode });
      if (!booking && cleanCode.length === 24) {
        booking = await Booking.findById(cleanCode);
      }
    } else if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy vé phù hợp với mã đã nhập');
    }

    const populated = await Booking.findById(booking._id)
      .populate('user', 'username email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl duration' },
          { path: 'theater', select: 'name' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate('concessions.concession');

    // Trường hợp 1: Vé ĐÃ ĐƯỢC SỬ DỤNG trước đó
    if (booking.isCheckedIn) {
      return res.status(400).json({
        success: false,
        isAlreadyCheckedIn: true,
        message: 'VÉ ĐÃ ĐƯỢC SỬ DỤNG',
        data: populated,
      });
    }

    // Trường hợp 2: Vé chưa thanh toán
    if (booking.paymentStatus !== 'paid') {
      res.status(400);
      throw new Error('Vé này chưa hoàn tất thanh toán, không thể check-in');
    }

    // Trường hợp 3: Check-in thành công
    booking.isCheckedIn = true;
    booking.checkedInAt = new Date();
    booking.checkedInBy = req.user?.username || 'Admin Cinema';
    booking.ticketStatus = 'checked_in';

    await booking.save();

    const finalBooking = await Booking.findById(booking._id)
      .populate('user', 'username email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl duration' },
          { path: 'theater', select: 'name' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate('concessions.concession');

    res.json({
      success: true,
      isCheckInSuccess: true,
      message: 'CHECK-IN THÀNH CÔNG',
      data: finalBooking,
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

// ==========================================
// 5. Quản lý Ghế (Seat Management)
// ==========================================

// CHỨC NĂNG: Lấy danh sách toàn bộ ghế trong một phòng chiếu
const getRoomSeats = async (req, res, next) => {
  try {
    const { id } = req.params; // ID của phòng chiếu
    // 1. Kiểm tra phòng chiếu có tồn tại không
    const room = await Room.findById(id);
    if (!room) {
      res.status(404);
      throw new Error('Không tìm thấy phòng chiếu');
    }
    // 2. Tìm toàn bộ ghế thuộc phòng chiếu này, sắp xếp theo tên hàng (A->Z) và số ghế (1->9) tăng dần
    const seats = await Seat.find({ room: id }).sort({ row: 1, number: 1 });
    res.json({ success: true, count: seats.length, data: seats });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Chỉnh sửa cấu hình của một chiếc ghế cụ thể (loại ghế, giá phụ thu, trạng thái vô hiệu hóa)
const updateSeat = async (req, res, next) => {
  try {
    const { id } = req.params; // ID của chiếc ghế cần sửa
    const { type, price, isDisabled } = req.body; // Các trường thông tin mới

    const seat = await Seat.findById(id);
    if (!seat) {
      res.status(404);
      throw new Error('Không tìm thấy ghế này');
    }

    // Nếu thay đổi loại ghế hoặc giá ghế, kiểm tra xem phòng này có vé đã đặt không
    if (type !== undefined || price !== undefined) {
      const { hasBookings, bookingCount } = await checkRoomHasActiveBookings(seat.room);
      if (hasBookings) {
        res.status(400);
        throw new Error(
          `🚫 Không thể chỉnh sửa giá hoặc loại ghế vì phòng chiếu này đang có ${bookingCount} vé đã được khách hàng đặt.`
        );
      }
    }

    if (type !== undefined) seat.type = type;
    if (price !== undefined) seat.price = price;
    if (isDisabled !== undefined) seat.isDisabled = isDisabled;

    await seat.save();
    res.json({ success: true, data: seat });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Chỉnh sửa hàng loạt ghế cùng lúc (tối ưu hóa hiệu năng bằng bulkWrite)
const bulkUpdateSeats = async (req, res, next) => {
  try {
    const { updates } = req.body; // updates: danh sách chứa các object thay đổi [{ seatId, type, price, isDisabled }]
    
    // Kiểm tra dữ liệu đầu vào
    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400);
      throw new Error('Không có thông tin cập nhật nào được gửi lên');
    }

    // Tìm các phòng chiếu liên quan để kiểm tra ràng buộc vé đã đặt
    const seatIds = updates.map((u) => u.seatId);
    const targetSeats = await Seat.find({ _id: { $in: seatIds } });
    const roomIds = [...new Set(targetSeats.map((s) => s.room.toString()))];

    for (const rId of roomIds) {
      const { hasBookings, bookingCount } = await checkRoomHasActiveBookings(rId);
      if (hasBookings) {
        res.status(400);
        throw new Error(
          `🚫 Không thể chỉnh sửa giá ghế hàng loạt vì phòng chiếu đang có ${bookingCount} vé đã được khách hàng đặt.`
        );
      }
    }

    // Chuyển đổi danh sách updates thành mảng các thao tác updateOne cho MongoDB
    const ops = updates.map(({ seatId, type, price, isDisabled }) => ({
      updateOne: {
        filter: { _id: seatId }, // Điều kiện tìm ghế theo ID
        update: { $set: { type, price, isDisabled } }, // Các trường cần cập nhật
      },
    }));

    // Thực hiện tất cả các thao tác cập nhật trong 1 lượt gửi đến MongoDB
    const result = await Seat.bulkWrite(ops);
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Kiểm tra phòng chiếu có được phép sửa sơ đồ ghế hay không (nếu có suất chiếu hoặc vé đã đặt thì khóa)
const checkRoomEditable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    if (!room) {
      res.status(404);
      throw new Error('Không tìm thấy phòng chiếu');
    }

    const { hasBookings, bookingCount, showtimesCount } = await checkRoomHasActiveBookings(id);

    if (hasBookings || showtimesCount > 0) {
      const reasonMsg = hasBookings
        ? `Phòng chiếu này hiện đang có ${bookingCount} vé đã được khách đặt cho các suất chiếu sắp tới. Đã khóa chỉnh sửa sơ đồ và giá ghế để bảo vệ dữ liệu vé.`
        : `Phòng chiếu này hiện đang có ${showtimesCount} suất chiếu sắp/đang diễn ra. Đã khóa chỉnh sửa cấu trúc sơ đồ ghế.`;

      return res.json({
        success: true,
        editable: false,
        activeShowtimesCount: showtimesCount,
        bookingCount,
        reason: reasonMsg,
        data: {
          editable: false,
          activeShowtimesCount: showtimesCount,
          bookingCount,
          reason: reasonMsg,
        },
      });
    }

    res.json({
      success: true,
      editable: true,
      activeShowtimesCount: 0,
      bookingCount: 0,
      data: {
        editable: true,
        activeShowtimesCount: 0,
        bookingCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Lưu toàn bộ cấu trúc sơ đồ ghế của phòng chiếu (thêm/xóa/sửa hàng và cột)
const saveRoomLayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { seats: incomingSeats } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      res.status(404);
      throw new Error('Không tìm thấy phòng chiếu');
    }

    const { hasBookings, bookingCount, showtimesCount } = await checkRoomHasActiveBookings(id);
    if (hasBookings || showtimesCount > 0) {
      res.status(400);
      throw new Error(
        hasBookings
          ? `🚫 Phòng chiếu này hiện đang có ${bookingCount} vé đã được đặt. Không thể thay đổi cấu trúc sơ đồ ghế.`
          : `🚫 Phòng chiếu này hiện đang có ${showtimesCount} suất chiếu chưa kết thúc. Không thể thay đổi sơ đồ ghế.`
      );
    }

    if (!Array.isArray(incomingSeats)) {
      res.status(400);
      throw new Error('Dữ liệu sơ đồ ghế không hợp lệ');
    }

    // 1. Lấy tất cả các ghế đang có trong DB của phòng này
    const existingSeats = await Seat.find({ room: id });
    const existingMap = new Map(existingSeats.map((s) => [s._id.toString(), s]));

    const incomingIds = new Set(
      incomingSeats
        .filter((s) => s._id && !String(s._id).startsWith('temp_'))
        .map((s) => String(s._id))
    );

    // 2. Kiểm tra các loại ghế gửi lên có hợp lệ với loại phòng (allowedSeatTypes) không
    let allowedSeatTypes = ['standard', 'vip', 'couple'];
    let roomTypeDoc = null;
    if (room.roomTypeRef) {
      roomTypeDoc = await RoomType.findById(room.roomTypeRef);
    } else if (room.type) {
      roomTypeDoc = await RoomType.findOne({ code: room.type });
    }
    if (roomTypeDoc && roomTypeDoc.allowedSeatTypes && roomTypeDoc.allowedSeatTypes.length > 0) {
      allowedSeatTypes = roomTypeDoc.allowedSeatTypes;
    }

    for (const s of incomingSeats) {
      if (s.type && !allowedSeatTypes.includes(s.type)) {
        res.status(400);
        throw new Error(
          `🚫 Loại phòng "${roomTypeDoc?.name || room.type}" không cho phép loại ghế "${
            s.type === 'standard' ? 'Thường' : s.type === 'vip' ? 'VIP' : 'Đôi'
          }"! Chỉ được phép: ${allowedSeatTypes.map((t) => (t === 'standard' ? 'Thường' : t === 'vip' ? 'VIP' : 'Đôi')).join(', ')}.`
        );
      }
    }

    // 3. Xác định các ghế bị xóa khỏi ma trận
    const toDeleteIds = existingSeats
      .filter((s) => !incomingIds.has(s._id.toString()))
      .map((s) => s._id);

    if (toDeleteIds.length > 0) {
      await Seat.deleteMany({ _id: { $in: toDeleteIds } });
    }

    // 4. Phân loại ghế cần update và ghế mới cần insert
    const bulkOps = [];
    const newSeatsToInsert = [];

    for (const seat of incomingSeats) {
      const isExisting = seat._id && !String(seat._id).startsWith('temp_') && existingMap.has(String(seat._id));

      if (isExisting) {
        bulkOps.push({
          updateOne: {
            filter: { _id: seat._id },
            update: {
              $set: {
                row: seat.row,
                number: seat.number,
                type: seat.type || 'standard',
                price: seat.price || 0,
                isDisabled: seat.isDisabled ?? false,
              },
            },
          },
        });
      } else {
        newSeatsToInsert.push({
          room: id,
          row: seat.row,
          number: seat.number,
          type: seat.type || 'standard',
          price: seat.price || 0,
          isDisabled: seat.isDisabled ?? false,
        });
      }
    }

    if (bulkOps.length > 0) {
      await Seat.bulkWrite(bulkOps);
    }
    if (newSeatsToInsert.length > 0) {
      await Seat.insertMany(newSeatsToInsert);
    }

    // 4. Lấy lại danh sách ghế mới và cập nhật sức chứa (capacity) của phòng
    const updatedSeats = await Seat.find({ room: id }).sort({ row: 1, number: 1 });
    await Room.findByIdAndUpdate(id, { capacity: updatedSeats.length });

    res.json({
      success: true,
      message: 'Lưu sơ đồ ghế thành công!',
      count: updatedSeats.length,
      data: updatedSeats,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. Quản lý Người dùng (User Management)
// ==========================================

// CHỨC NĂNG: Lấy danh sách toàn bộ người dùng (ẩn mật khẩu)
const listUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    const users = await User.find(query)
      .select('-password') // Không trả về mật khẩu
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Phân quyền tài khoản (user, staff, admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'staff', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Role không hợp lệ. Chỉ chấp nhận: user, staff, admin');
    }

    // Không cho phép tự thay đổi quyền của chính mình
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error('Không thể tự thay đổi quyền của chính bạn');
    }

    // Tìm user mục tiêu trước để kiểm tra
    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }

    targetUser.role = role;
    await targetUser.save();

    const roleNameMap = {
      admin: 'Quản trị viên',
      staff: 'Nhân viên quản lý vé',
      user: 'Người dùng',
    };

    res.json({
      success: true,
      message: `Đã cập nhật vai trò của "${targetUser.username}" thành ${roleNameMap[role] || role}!`,
      data: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Khóa / Mở khóa tài khoản (Soft Delete / Account Lock)
const toggleUserStatus = async (req, res, next) => {
  try {
    // Không cho phép admin tự khóa chính mình
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error('Không thể tự khóa tài khoản của chính bạn');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }

    // Chuyển đổi trạng thái: active <-> locked
    const newStatus = user.status === 'locked' ? 'active' : 'locked';
    user.status = newStatus;
    await user.save();

    const actionText = newStatus === 'locked' ? 'khóa' : 'mở khóa';
    res.json({
      success: true,
      message: `Đã ${actionText} tài khoản "${user.username}" thành công!`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = toggleUserStatus;

// ==========================================
// 6. Auto-Generate Showtimes
// ==========================================
/**
 * Tự động tạo nhiều suất chiếu dựa trên:
 * - movieId, theaterId, roomIds[], startDate, endDate
 * - timeSlots[]: mảng string giờ chiếu VD: ["08:00", "10:30", "13:00"]
 * - format, ticketPrice
 *
 * Logic:
 * 1. Với mỗi ngày trong [startDate, endDate]
 * 2. Với mỗi phòng trong roomIds
 * 3. Với mỗi time slot
 *    - Tính startTime, endTime (duration phim + 20 phút buffer)
 *    - Kiểm tra trùng lịch trong DB
 *    - Nếu không trùng → tạo mới
 *    - Nếu trùng → bỏ qua, đếm vào skipped
 * 4. Trả về { created, skipped, total }
 */
const autoGenerateShowtimes = async (req, res, next) => {
  try {
    const {
      movieId,
      theaterId,
      roomIds,        // string[] – danh sách _id phòng chiếu
      startDate,      // "YYYY-MM-DD"
      endDate,        // "YYYY-MM-DD"
      timeSlots,      // string[] – VD: ["08:00", "10:30", "13:00"]
      format = '2D',
    } = req.body;

    // --- Validation ---
    if (!movieId || !theaterId || !roomIds?.length || !startDate || !endDate || !timeSlots?.length) {
      res.status(400);
      throw new Error('Thiếu thông tin bắt buộc: movieId, theaterId, roomIds, startDate, endDate, timeSlots');
    }

    // Lấy bảng giá
    const pricingConfig = await PricingConfig.findOne().lean();
    if (!pricingConfig) {
      res.status(400);
      throw new Error('Chưa có bảng giá được cấu hình. Vui lòng thiết lập bảng giá trong mục “Bảng Giá” trước.');
    }

    // Lấy roomType của từng phòng trước
    const roomDocs = await Room.find({ _id: { $in: roomIds } }).select('_id roomType').lean();
    const roomTypeMap = {};
    roomDocs.forEach((r) => { roomTypeMap[r._id.toString()] = r.roomType || 'standard'; });

    // Lấy thông tin phim để biết duration
    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404);
      throw new Error('Không tìm thấy phim');
    }

    const durationMs = movie.duration * 60000;   // phút → ms
    const bufferMs   = 20 * 60000;               // 20 phút buffer

    // Tạo danh sách các ngày trong khoảng [startDate, endDate]
    const days = [];
    const current = new Date(startDate);
    const last    = new Date(endDate);
    current.setHours(0, 0, 0, 0);
    last.setHours(23, 59, 59, 999);

    if (current > last) {
      res.status(400);
      throw new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
    }

    while (current <= last) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    let created = 0;
    let skipped = 0;

    // Duyệt qua từng ngày → từng phòng → từng time slot
    for (const day of days) {
      for (const roomId of roomIds) {
        for (const slot of timeSlots) {
          // Phân tích "HH:mm"
          const [hours, minutes] = slot.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) continue;

          const startTime = new Date(day);
          startTime.setHours(hours, minutes, 0, 0);

          const endTime = new Date(startTime.getTime() + durationMs + bufferMs);

          // Kiểm tra giờ kết thúc không vượt quá 23:59
          const endLimit = new Date(day);
          endLimit.setHours(23, 59, 59, 999);
          if (endTime > endLimit) {
            skipped++;
            continue; // Bỏ qua slot vượt quá thời gian hoạt động
          }

          // Kiểm tra trùng lịch
          const conflict = await Showtime.findOne({
            room: roomId,
            startTime: { $lt: endTime },
            endTime:   { $gt: startTime },
          });

          if (conflict) {
            skipped++;
            continue; // Bỏ qua – trùng lịch
          }

          // Tự động tính giá theo ngày + giờ + format + roomType
          const autoPrice = calculateBaseShowtimePrice({
            startTime,
            format,
            roomType: roomTypeMap[roomId] || 'standard',
            config: pricingConfig,
            movieReleaseDate: movie.releaseDate,
          });

          // Tạo suất chiếu mới
          await Showtime.create({
            movie:       movieId,
            theater:     theaterId,
            room:        roomId,
            startTime,
            endTime,
            ticketPrice: autoPrice,
            format,
          });

          created++;
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        created,
        skipped,
        total: created + skipped,
        movie: movie.title,
        days: days.length,
        rooms: roomIds.length,
        slots: timeSlots.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. Pricing Config Management
// ==========================================

/**
 * GET /api/admin/pricing
 * Lấy bảng giá hiện tại (tự tạo mới với giá mặc định nếu chưa có)
 */
const getPricingConfig = async (req, res, next) => {
  try {
    let config = await PricingConfig.findOne();
    if (!config) {
      config = await PricingConfig.create({});
    }

    const defaultWeekdaySurcharge = { sun: 30000, mon: 0, tue: 0, wed: 0, thu: 0, fri: 10000, sat: 30000 };
    const defaultFormatSurcharge = { '2D': 0, '3D': 40000, 'IMAX': 90000, 'GOLDCLASS': 120000 };
    const defaultTimeSlotSurcharge = { morning: 0, evening: 20000, latenight: 10000 };
    const defaultRoomTypeSurcharge = { standard: 0, premium: 20000, dolby: 50000 };
    const defaultSeatTypeSurcharge = { standard: 0, vip: 30000, couple: 100000 };
    const defaultBasePrice = { weekday: 90000, weekend: 120000, holiday: 180000 };

    const configObj = config.toObject();
    configObj.basePrice = { ...defaultBasePrice, ...(configObj.basePrice || {}) };
    configObj.weekdaySurcharge = { ...defaultWeekdaySurcharge, ...(configObj.weekdaySurcharge || {}) };
    configObj.timeSlotSurcharge = { ...defaultTimeSlotSurcharge, ...(configObj.timeSlotSurcharge || {}) };
    configObj.formatSurcharge = { ...defaultFormatSurcharge, ...(configObj.formatSurcharge || {}) };
    configObj.roomTypeSurcharge = { ...defaultRoomTypeSurcharge, ...(configObj.roomTypeSurcharge || {}) };
    configObj.seatTypeSurcharge = { ...defaultSeatTypeSurcharge, ...(configObj.seatTypeSurcharge || {}) };
    configObj.holidays = configObj.holidays?.length ? configObj.holidays : ['2026-01-01', '2026-04-30', '2026-05-01', '2026-09-02'];

    res.json({ success: true, data: configObj });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/pricing
 * Cập nhật bảng giá (upsert singleton)
 */
const updatePricingConfig = async (req, res, next) => {
  try {
    const config = await PricingConfig.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. Gửi Email thông báo đến khách hàng đặt vé
// ==========================================

/**
 * Tạo nội dung HTML email thông tin vé
 */
function buildTicketEmailHtml({ booking, movie, showtime, theater, room, seats, concessions }) {
  const movieTitle = movie?.title || 'Phim không xác định';
  const moviePoster = movie?.posterUrl || '';
  const theaterName = theater?.name || 'Rạp không xác định';
  const roomName = room?.name || 'Phòng không xác định';
  const ticketCode = booking.ticketCode || booking._id;
  const totalPrice = (booking.totalPrice || 0).toLocaleString('vi-VN');
  const userName = booking.user?.username || 'Quý khách';

  const startTime = showtime?.startTime
    ? new Date(showtime.startTime).toLocaleString('vi-VN', {
        weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Không xác định';

  const endTime = showtime?.endTime
    ? new Date(showtime.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const seatDetails = booking.seatDetails || [];
  const seatsStr = Array.isArray(booking.seats) && booking.seats.length > 0
    ? booking.seats.map((s) => {
        const match = s.match(/^([A-Z]+)(\d+)$/);
        const detail = seatDetails.find((d) => d.seatCode === s);
        const isCouple = detail?.type === 'couple' || room?.type === 'SWEETBOX' || room?.type === 'GOLDCLASS';
        let code = s;
        if (match && isCouple) {
          const row = match[1];
          const num = parseInt(match[2], 10);
          code = `${row}${num}-${row}${num + 1}`;
        }
        const typeLabel = detail?.type === 'couple' || room?.type === 'SWEETBOX' ? 'Ghế đôi' : detail?.type === 'vip' ? 'Ghế VIP' : 'Ghế thường';
        return `${code} (${typeLabel})`;
      }).join(', ')
    : (Array.isArray(seats) && seats.length > 0
        ? seats.map(s => `${s.row || ''}${s.number || ''}`).join(', ')
        : 'Không có thông tin');

  const concessionRows = Array.isArray(concessions) && concessions.length > 0
    ? concessions.map(c => {
        const name = c.concession?.name || 'Sản phẩm';
        const qty = c.quantity || 1;
        const price = ((c.concession?.price || 0) * qty).toLocaleString('vi-VN');
        return `<tr><td style="padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;font-size:13px">${name}</td><td style="padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;font-size:13px">x${qty}</td><td style="padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;color:#e74c3c;font-size:13px;font-weight:700">${price}đ</td></tr>`;
      }).join('')
    : '';

  const posterSection = moviePoster
    ? `<div style="position:relative;overflow:hidden;height:160px"><img src="${moviePoster}" alt="${movieTitle}" style="width:100%;height:100%;object-fit:cover;opacity:0.55;display:block"><div style="position:absolute;bottom:0;left:0;right:0;padding:14px 22px;background:linear-gradient(transparent,#0f3460)"><div style="color:#fff;font-size:20px;font-weight:900">${movieTitle}</div></div></div>`
    : `<div style="padding:18px 22px;background:rgba(231,76,60,0.12);border-bottom:1px solid rgba(231,76,60,0.2)"><div style="color:#fff;font-size:20px;font-weight:900">🎬 ${movieTitle}</div></div>`;

  const concessionSection = concessionRows
    ? `<tr><td style="background:#16213e;padding:0 36px 24px"><div style="color:#fff;font-size:12px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">🍿 Đồ ăn & thức uống</div><table width="100%" style="background:#0f3460;border-radius:8px;overflow:hidden" cellpadding="0" cellspacing="0"><thead><tr style="background:rgba(231,76,60,0.15)"><th style="padding:9px 14px;text-align:left;color:#888;font-size:11px;text-transform:uppercase">Sản phẩm</th><th style="padding:9px 14px;text-align:center;color:#888;font-size:11px;text-transform:uppercase">SL</th><th style="padding:9px 14px;text-align:right;color:#888;font-size:11px;text-transform:uppercase">Thành tiền</th></tr></thead><tbody>${concessionRows}</tbody></table></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Xác nhận vé - Nova Cinematic</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:36px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#c0392b 0%,#e74c3c 60%,#ff6b6b 100%);border-radius:14px 14px 0 0;padding:28px 36px;text-align:center">
          <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:2px">🎬 NOVA CINEMATIC</div>
          <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:5px;letter-spacing:1px">XÁC NHẬN ĐẶT VÉ THÀNH CÔNG</div>
        </td></tr>

        <!-- GREETING -->
        <tr><td style="background:#1a1a2e;padding:24px 36px">
          <div style="color:#fff;font-size:15px;font-weight:600">Xin chào <span style="color:#e74c3c">${userName}</span>,</div>
          <div style="color:#999;font-size:12px;margin-top:6px;line-height:1.7">Cảm ơn bạn đã tin tưởng đặt vé tại Nova Cinematic. Dưới đây là thông tin chi tiết vé của bạn.</div>
        </td></tr>

        <!-- TICKET CARD -->
        <tr><td style="background:#16213e;padding:0 36px 24px">
          <div style="background:#0f3460;border-radius:12px;overflow:hidden;border:1px solid rgba(231,76,60,0.25)">
            ${posterSection}
            <div style="padding:18px 22px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.07);width:48%">
                    <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px">🏢 Rạp chiếu</div>
                    <div style="color:#fff;font-size:13px;font-weight:700;margin-top:4px">${theaterName}</div>
                  </td>
                  <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(255,255,255,0.07)">
                    <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px">🚪 Phòng chiếu</div>
                    <div style="color:#fff;font-size:13px;font-weight:700;margin-top:4px">${roomName}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.07)">
                    <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px">📅 Thời gian chiếu</div>
                    <div style="color:#e74c3c;font-size:13px;font-weight:700;margin-top:4px">${startTime}${endTime ? ' → ' + endTime : ''}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.07)">
                    <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px">💺 Ghế ngồi</div>
                    <div style="color:#fff;font-size:13px;font-weight:700;margin-top:4px;letter-spacing:1px">${seatsStr}</div>
                  </td>
                  <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(255,255,255,0.07)">
                    <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px">💰 Tổng thanh toán</div>
                    <div style="color:#f1c40f;font-size:16px;font-weight:900;margin-top:4px">${totalPrice}đ</div>
                  </td>
                </tr>
              </table>
              <!-- TICKET CODE BOX -->
              <div style="margin-top:18px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:8px;padding:14px 18px;text-align:center">
                <div style="color:rgba(255,255,255,0.75);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px">Mã vé của bạn</div>
                <div style="color:#fff;font-size:22px;font-weight:900;letter-spacing:4px">${ticketCode}</div>
                <div style="color:rgba(255,255,255,0.65);font-size:10px;margin-top:5px">Xuất trình mã này hoặc email này khi check-in tại quầy</div>
              </div>
            </div>
          </div>
        </td></tr>

        ${concessionSection}

        <!-- GUIDE -->
        <tr><td style="background:#1a1a2e;padding:20px 36px">
          <div style="color:#999;font-size:12px;line-height:1.9">
            <strong style="color:#ddd">📌 Lưu ý quan trọng:</strong><br>
            • Vui lòng có mặt trước <strong style="color:#e74c3c">15 phút</strong> trước giờ chiếu để làm thủ tục check-in<br>
            • Xuất trình mã vé hoặc email này tại quầy soát vé<br>
            • Vé đã mua không được hoàn trả
          </div>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#0f0f1a;border-radius:0 0 14px 14px;padding:18px 36px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)">
          <div style="color:#444;font-size:11px">© 2026 Nova Cinematic · Mọi thắc mắc vui lòng liên hệ hotline hoặc email hỗ trợ</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * POST /api/admin/bookings/:id/send-email
 * Gửi email xác nhận vé cho 1 khách hàng
 */
const sendBookingEmail = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'username email')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl duration' },
          { path: 'theater', select: 'name' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate('concessions.concession');

    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy đơn đặt vé');
    }

    const userEmail = booking.user?.email;
    if (!userEmail) {
      res.status(400);
      throw new Error('Khách hàng này không có địa chỉ email');
    }

    const showtime = booking.showtime;
    const movie = showtime?.movie;
    const theater = showtime?.theater;
    const room = showtime?.room;

    let seatDocs = [];
    if (booking.seats && booking.seats.length > 0) {
      seatDocs = await Seat.find({ _id: { $in: booking.seats } }).select('row number type');
    }

    const html = buildTicketEmailHtml({
      booking, movie, showtime, theater, room,
      seats: seatDocs,
      concessions: booking.concessions,
    });

    const movieTitle = movie?.title || 'Phim';
    const subject = `🎬 Xác nhận vé "${movieTitle}" - Mã vé: ${booking.ticketCode || booking._id}`;

    await sendEmail({ to: userEmail, subject, html });

    res.json({
      success: true,
      message: `Đã gửi email xác nhận vé tới ${userEmail} thành công`,
      email: userEmail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/bookings/send-email-bulk
 * Gửi email đến nhiều khách hàng:
 * - body.showtimeId: gửi tất cả booking (paid) của suất chiếu
 * - body.bookingIds[]: gửi danh sách booking cụ thể
 * - body.subject (optional): tiêu đề tùy chỉnh
 * - body.customMessage (optional): thông điệp tùy chỉnh thêm vào email
 */
const sendBulkEmail = async (req, res, next) => {
  try {
    const { showtimeId, bookingIds, subject: customSubject, customMessage } = req.body;

    let bookings = [];

    if (showtimeId) {
      bookings = await Booking.find({ showtime: showtimeId, paymentStatus: 'paid' })
        .populate('user', 'username email')
        .populate({
          path: 'showtime',
          populate: [
            { path: 'movie', select: 'title posterUrl duration' },
            { path: 'theater', select: 'name' },
            { path: 'room', select: 'name' },
          ],
        })
        .populate('concessions.concession');
    } else if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      bookings = await Booking.find({ _id: { $in: bookingIds } })
        .populate('user', 'username email')
        .populate({
          path: 'showtime',
          populate: [
            { path: 'movie', select: 'title posterUrl duration' },
            { path: 'theater', select: 'name' },
            { path: 'room', select: 'name' },
          ],
        })
        .populate('concessions.concession');
    } else {
      res.status(400);
      throw new Error('Vui lòng cung cấp showtimeId hoặc danh sách bookingIds');
    }

    if (bookings.length === 0) {
      return res.json({ success: true, message: 'Không có đơn đặt vé nào phù hợp', sent: 0, failed: 0, total: 0 });
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const booking of bookings) {
      const userEmail = booking.user?.email;
      if (!userEmail) { failed++; continue; }

      try {
        const showtime = booking.showtime;
        const movie = showtime?.movie;
        const theater = showtime?.theater;
        const room = showtime?.room;

        let seatDocs = [];
        if (booking.seats && booking.seats.length > 0) {
          seatDocs = await Seat.find({ _id: { $in: booking.seats } }).select('row number type');
        }

        let html = buildTicketEmailHtml({
          booking, movie, showtime, theater, room,
          seats: seatDocs,
          concessions: booking.concessions,
        });

        // Chèn thêm thông điệp tùy chỉnh của admin nếu có
        if (customMessage) {
          const adminNotice = `
        <!-- CUSTOM MESSAGE -->
        <tr><td style="background:#1a1a2e;padding:16px 36px 0">
          <div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:8px;padding:14px 16px">
            <div style="color:#e74c3c;font-size:11px;font-weight:700;margin-bottom:5px;text-transform:uppercase;letter-spacing:1px">📢 Thông báo từ Nova Cinematic</div>
            <div style="color:#ddd;font-size:13px;line-height:1.7">${customMessage}</div>
          </div>
        </td></tr>`;
          html = html.replace('<!-- GUIDE -->', adminNotice + '<!-- GUIDE -->');
        }

        const movieTitle = movie?.title || 'Phim';
        const subject = customSubject || `🎬 Thông báo vé "${movieTitle}" - Mã vé: ${booking.ticketCode || booking._id}`;

        await sendEmail({ to: userEmail, subject, html });
        sent++;
      } catch (err) {
        failed++;
        errors.push({ bookingId: booking._id, email: userEmail, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Đã gửi ${sent}/${bookings.length} email thành công`,
      sent,
      failed,
      total: bookings.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/pricing/preview
 * Preview giá vé cho một tổ hợp tham số cụ thể
 */
const previewTicketPrice = async (req, res, next) => {
  try {
    const { startTime, format = '2D', roomType = 'standard', seatType = 'standard' } = req.body;
    if (!startTime) {
      res.status(400);
      throw new Error('Thiếu startTime');
    }

    let config = await PricingConfig.findOne().lean();
    if (!config) config = {};

    const { getPriceBreakdown } = require('../utils/pricingEngine');
    const result = getPriceBreakdown({
      startTime: new Date(startTime),
      format,
      roomType,
      seatType,
      config,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. Room Type & Seat Price Management
// ==========================================
const getRoomTypes = async (req, res, next) => {
  try {
    const roomTypes = await RoomType.find().sort({ createdAt: 1 });
    res.json({ success: true, count: roomTypes.length, data: roomTypes });
  } catch (error) {
    next(error);
  }
};

const createRoomType = async (req, res, next) => {
  try {
    const { name, code, description, seatPrices, allowedSeatTypes, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên loại phòng không được để trống' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Mã loại phòng không được để trống' });
    }

    // Validate allowedSeatTypes: phải có ít nhất 1 loại ghế được phép
    const validSeatTypes = ['standard', 'vip', 'couple'];
    const cleanAllowed = Array.isArray(allowedSeatTypes)
      ? allowedSeatTypes.filter((t) => validSeatTypes.includes(t))
      : validSeatTypes;
    if (cleanAllowed.length === 0) {
      return res.status(400).json({ success: false, message: 'Phải cho phép ít nhất 1 loại ghế trong loại phòng này!' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await RoomType.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Mã loại phòng "${cleanCode}" đã tồn tại trên hệ thống! Vui lòng dùng mã khác.`,
      });
    }

    const roomType = await RoomType.create({
      name: name.trim(),
      code: cleanCode,
      description: description?.trim() || '',
      allowedSeatTypes: cleanAllowed,
      seatPrices: {
        standard: cleanAllowed.includes('standard') ? (Number(seatPrices?.standard) || 100000) : 0,
        vip: cleanAllowed.includes('vip') ? (Number(seatPrices?.vip) || 150000) : 0,
        couple: cleanAllowed.includes('couple') ? (Number(seatPrices?.couple) || 300000) : 0,
      },
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: roomType,
      message: 'Tạo loại phòng chiếu mới thành công!',
    });
  } catch (error) {
    next(error);
  }
};

const updateRoomType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, seatPrices, allowedSeatTypes, isActive } = req.body;

    const roomType = await RoomType.findById(id);
    if (!roomType) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại phòng chiếu' });
    }

    // Validate allowedSeatTypes nếu có gửi lên
    const validSeatTypes = ['standard', 'vip', 'couple'];
    let cleanAllowed = null;
    if (allowedSeatTypes !== undefined) {
      cleanAllowed = Array.isArray(allowedSeatTypes)
        ? allowedSeatTypes.filter((t) => validSeatTypes.includes(t))
        : null;
      if (cleanAllowed && cleanAllowed.length === 0) {
        return res.status(400).json({ success: false, message: 'Phải cho phép ít nhất 1 loại ghế trong loại phòng này!' });
      }
    }

    // Kiểm tra nếu có thay đổi về bảng giá ghế hoặc mã loại phòng
    const isPriceChanged =
      seatPrices &&
      ((seatPrices.standard !== undefined && Number(seatPrices.standard) !== roomType.seatPrices?.standard) ||
        (seatPrices.vip !== undefined && Number(seatPrices.vip) !== roomType.seatPrices?.vip) ||
        (seatPrices.couple !== undefined && Number(seatPrices.couple) !== roomType.seatPrices?.couple));

    const isCodeChanged = code && code.trim().toUpperCase() !== roomType.code;

    if (isPriceChanged || isCodeChanged) {
      const { hasBookings, bookingCount } = await checkRoomTypeHasActiveBookings(roomType);
      if (hasBookings) {
        return res.status(400).json({
          success: false,
          message: `🚫 Không thể sửa ${
            isPriceChanged ? 'bảng giá vé ghế' : 'mã loại phòng'
          } của "${roomType.name}" vì đang có ${bookingCount} vé đã được khách hàng đặt tại các phòng chiếu thuộc loại phòng này!`,
        });
      }
    }

    if (code && code.trim().toUpperCase() !== roomType.code) {
      const cleanCode = code.trim().toUpperCase();
      const existing = await RoomType.findOne({ _id: { $ne: id }, code: cleanCode });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Mã loại phòng "${cleanCode}" đã tồn tại trên hệ thống!`,
        });
      }
      roomType.code = cleanCode;
    }

    if (name) roomType.name = name.trim();
    if (description !== undefined) roomType.description = description.trim();
    if (cleanAllowed) {
      roomType.allowedSeatTypes = cleanAllowed;
    }
    const finalAllowed = cleanAllowed || roomType.allowedSeatTypes || validSeatTypes;
    if (seatPrices) {
      roomType.seatPrices.standard = finalAllowed.includes('standard') ? (Number(seatPrices.standard) || roomType.seatPrices.standard) : 0;
      roomType.seatPrices.vip = finalAllowed.includes('vip') ? (Number(seatPrices.vip) || roomType.seatPrices.vip) : 0;
      roomType.seatPrices.couple = finalAllowed.includes('couple') ? (Number(seatPrices.couple) || roomType.seatPrices.couple) : 0;
    }
    if (isActive !== undefined) roomType.isActive = isActive;

    await roomType.save();

    res.json({
      success: true,
      data: roomType,
      message: 'Cập nhật thông tin và bảng giá loại phòng thành công!',
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoomType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roomType = await RoomType.findById(id);
    if (!roomType) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại phòng chiếu' });
    }

    // 1. Kiểm tra xem có phòng chiếu nào đang sử dụng loại phòng này không
    const count = await Room.countDocuments({
      $or: [{ roomTypeRef: roomType._id }, { type: roomType.code }],
    });

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể xóa loại phòng "${roomType.name}" vì đang có ${count} phòng chiếu trong hệ thống đang sử dụng định dạng này!`,
      });
    }

    // 2. Kiểm tra xem có vé nào gắn với loại phòng này không
    const { hasBookings, bookingCount } = await checkRoomTypeHasActiveBookings(roomType);
    if (hasBookings) {
      return res.status(400).json({
        success: false,
        message: `🚫 Không thể xóa loại phòng "${roomType.name}" vì đang có ${bookingCount} vé đã được đặt trong hệ thống!`,
      });
    }

    await RoomType.findByIdAndDelete(id);
    res.json({
      success: true,
      message: `Đã xóa loại phòng chiếu "${roomType.name}" thành công!`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
