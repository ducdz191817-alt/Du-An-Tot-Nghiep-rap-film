const Showtime = require('../models/Showtime.model');
const Seat = require('../models/Seat.model');
const { checkAndExpirePendingBookings } = require('../utils/bookingCleanup');

/**
 * @desc    Lấy danh sách suất chiếu của một bộ phim (có thể lọc theo ngày chiếu)
 * @route   GET /api/showtimes/movie/:movieId
 * @access  Public
 */
const getShowtimesByMovie = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { movieId } = req.params;

    const query = { movie: movieId };

    // 1. Nếu có truyền ngày, lọc suất chiếu trong khoảng từ 00:00:00 đến 23:59:59 của ngày đó
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Mặc định: Chỉ lấy các suất chiếu từ thời điểm hiện tại trở đi
      query.startTime = { $gte: new Date() };
    }

    // 2. Truy vấn danh sách suất chiếu, populate thông tin rạp và phòng chiếu
    const showtimes = await Showtime.find(query)
      .populate('theater')
      .populate('room')
      .sort({ startTime: 1 }); // Sắp xếp theo giờ chiếu tăng dần

    res.json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết một suất chiếu (bao gồm thông tin phim, phòng chiếu và sơ đồ ghế)
 * @route   GET /api/showtimes/:id
 * @access  Public
 */
const getShowtimeById = async (req, res, next) => {
  try {
    // 1. Tự động kiểm tra và giải phóng các ghế giữ quá hạn (hết thời gian giữ chỗ) trước khi trả về dữ liệu
    await checkAndExpirePendingBookings();

    // 2. Tìm suất chiếu theo ID và populate phim, rạp, phòng chiếu
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie')
      .populate('theater')
      .populate('room');

    if (!showtime) {
      res.status(404);
      throw new Error('Không tìm thấy suất chiếu');
    }

    // 3. Lấy tất cả danh sách ghế sơ đồ của phòng chiếu này (sắp xếp theo hàng và số ghế)
    const seats = await Seat.find({ room: showtime.room._id }).sort({ row: 1, number: 1 });

    res.json({
      success: true,
      data: {
        showtime,
        seats, // Danh sách ghế mẫu của phòng chiếu
        isTheaterInactive: showtime.theater?.isActive === false, // Cờ kiểm tra rạp có bị ngưng hoạt động không
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tất cả danh sách suất chiếu (Hỗ trợ lọc theo rạp hoặc phòng chiếu)
 * @route   GET /api/showtimes
 * @access  Public
 */
const getShowtimes = async (req, res, next) => {
  try {
    const { theaterId, roomId } = req.query;
    const query = {};

    // 1. Thêm bộ lọc theo rạp hoặc phòng chiếu nếu có
    if (theaterId) query.theater = theaterId;
    if (roomId) query.room = roomId;

    // 2. Lấy danh sách suất chiếu, loại bỏ các suất chiếu của phim bị ẩn hoặc đã hủy
    const showtimes = await Showtime.find(query)
      .populate({
        path: 'movie',
        match: { status: { $nin: ['hidden', 'cancelled'] } },
      })
      .populate('theater')
      .populate('room')
      .sort({ startTime: 1 });

    // 3. Lọc bỏ các suất chiếu mà phim bị null (do bị lọc ở bước populate)
    const filteredShowtimes = showtimes.filter((st) => st.movie !== null);

    res.json({
      success: true,
      count: filteredShowtimes.length,
      data: filteredShowtimes,
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

