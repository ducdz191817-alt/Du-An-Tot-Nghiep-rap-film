const Movie = require('../models/Movie.model');
const Theater = require('../models/Theater.model');
const Room = require('../models/Room.model');
const Seat = require('../models/Seat.model');
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
    const movie = await Movie.findByIdAndUpdate(
      req.params.id, 
      { status: 'hidden' }, 
      { new: true }
    );
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    // We do NOT delete showtimes so that existing bookings and showtimes retain the movie reference.
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

// ============================================================================
// CHỨC NĂNG: Tạo phòng chiếu mới và tự động khởi tạo toàn bộ sơ đồ ghế cho phòng đó
// ============================================================================
const createRoom = async (req, res, next) => {
  try {
    // Lấy thông tin cấu hình phòng và sơ đồ ghế từ client gửi lên
    const { name, theaterId, type = '2D', capacity = 80, standardRows = 5, vipRows = 3, coupleRows = 1, seatsPerRow = 10 } = req.body;

    // 1. Tạo bản ghi phòng chiếu trong database
    const room = await Room.create({
      name,
      theater: theaterId,
      type,
      capacity,
    });

    // 2. Tự động sinh ra toàn bộ danh sách ghế (Thường, VIP, Đôi) cho phòng chiếu này
    // Hàm helper generateSeatsForRoom sẽ tạo các bản ghi Seat liên kết với roomId vừa tạo
    await generateSeatsForRoom(room._id, standardRows, vipRows, coupleRows, seatsPerRow);

    res.status(201).json({
      success: true,
      data: room,
      message: `Tạo phòng chiếu thành công và tự động tạo ${capacity} ghế.`,
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
    const showtimeId = req.params.id;
    const existingShowtime = await Showtime.findById(showtimeId);
    if (!existingShowtime) {
      res.status(404);
      throw new Error('Showtime not found');
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
    const { date, month, year } = req.query;
    const isFiltered = date || month || year;

    const totalMovies = await Movie.countDocuments();
    let totalBookings = 0;
    let totalUsers = 0;
    let totalRevenue = 0;
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

    if (isFiltered) {
      // Filter stats by chosen period
      totalBookings = await Booking.countDocuments(periodQuery);

      const paidBookings = await Booking.find({ ...periodQuery, paymentStatus: 'paid' });
      totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

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
      // Default overall stats
      totalBookings = await Booking.countDocuments();
      totalUsers = await User.countDocuments({ role: 'user' });

      const allPaidBookings = await Booking.find({ paymentStatus: 'paid' });
      totalRevenue = allPaidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

      recentBookings = await Booking.find()
        .populate('user', 'username email')
        .populate({
          path: 'showtime',
          populate: [{ path: 'movie', select: 'title' }, { path: 'theater', select: 'name' }],
        })
        .sort({ createdAt: -1 })
        .limit(5);
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          totalMovies,
          totalUsers,
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
        populate: [
          // Lấy thêm posterUrl, thời lượng (duration) và thể loại (genre) để hiển thị giao diện Top Movies
          { path: 'movie', select: 'title genre duration posterUrl' }, 
          { path: 'theater', select: 'name' },
          // Lấy sức chứa (capacity) của phòng chiếu để tính phần trăm ghế đã bán (Occupancy)
          { path: 'room', select: 'capacity' }
        ],
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

      // Aggregate Movie - Tính toán dữ liệu cho từng bộ phim
      if (!movieSales[movieTitle]) {
        movieSales[movieTitle] = {
          name: movieTitle,
          revenue: 0,           // Tổng doanh thu
          tickets: 0,           // Tổng số vé bán ra
          capacity: 0,          // Tổng số ghế có thể bán của các suất chiếu
          posterUrl: showtime.movie ? showtime.movie.posterUrl : null,
          genre: showtime.movie ? showtime.movie.genre : [],
          duration: showtime.movie ? showtime.movie.duration : 0,
          uniqueShowtimes: new Set() // Dùng Set để lưu ID suất chiếu, tránh cộng dồn sức chứa (capacity) nhiều lần nếu 1 suất chiếu có nhiều booking
        };
      }
      
      // Cộng dồn doanh thu và số vé bán được của từng booking
      movieSales[movieTitle].revenue += booking.totalPrice;
      movieSales[movieTitle].tickets += (booking.seats ? booking.seats.length : 0);
      
      // Tính tổng số ghế (capacity) của tất cả suất chiếu của phim này
      // Chỉ cộng capacity nếu suất chiếu này chưa được cộng trước đó
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
          // Xử lý riêng cho đối tượng Movie để tính toán thêm % lấp đầy (Occupancy)
          const item = { ...obj[key] };
          item.value = item.revenue; // Gán value = revenue để code cũ không bị lỗi khi render biểu đồ (nếu có)
          
          // Tính % ghế đã bán (Occupancy = Tickets / Capacity * 100)
          if (item.capacity > 0) {
             item.occupancy = Math.round((item.tickets / item.capacity) * 100);
             if (item.occupancy > 100) item.occupancy = 100; // Đảm bảo tối đa 100%
          } else {
             item.occupancy = 0;
          }
          // Xóa biến tạm uniqueShowtimes trước khi gửi về frontend
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

    // Tìm và cập nhật thông tin ghế trong database
    const seat = await Seat.findByIdAndUpdate(
      id,
      { type, price, isDisabled },
      { new: true, runValidators: true } // Trả về bản ghi mới sau khi cập nhật và chạy validate dữ liệu đầu vào
    );

    if (!seat) {
      res.status(404);
      throw new Error('Không tìm thấy ghế này');
    }

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

// CHỨC NĂNG: Nâng quyền người dùng lên admin (KHÔNG cho phép hạ quyền admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Role không hợp lệ. Chỉ chấp nhận: user, admin');
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

    // Không cho phép hạ quyền admin xuống thành người dùng thường
    if (targetUser.role === 'admin' && role === 'user') {
      res.status(400);
      throw new Error('Không thể hạ quyền Quản trị viên. Hành động này không được phép.');
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({ success: true, data: targetUser });
  } catch (error) {
    next(error);
  }
};

// CHỨC NĂNG: Xóa một người dùng (không cho xóa tài khoản admin)
const deleteUser = async (req, res, next) => {
  try {
    // Không cho phép admin tự xóa chính mình
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error('Không thể tự xóa tài khoản của chính bạn');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }

    // Xóa toàn bộ lịch sử đặt vé của người dùng này
    const userBookings = await Booking.find({ user: user._id });
    for (const booking of userBookings) {
      // Giải phóng ghế trong các suất chiếu
      if (booking.seats && booking.seats.length > 0 && booking.showtime) {
        await Showtime.findByIdAndUpdate(booking.showtime, {
          $pull: { bookedSeats: { $in: booking.seats } },
        });
      }
    }
    await Booking.deleteMany({ user: user._id });

    await user.deleteOne();
    res.json({ success: true, message: `Đã xóa người dùng ${user.username} thành công` });
  } catch (error) {
    next(error);
  }
};

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
      ticketPrice = 80000,
    } = req.body;

    // --- Validation ---
    if (!movieId || !theaterId || !roomIds?.length || !startDate || !endDate || !timeSlots?.length) {
      res.status(400);
      throw new Error('Thiếu thông tin bắt buộc: movieId, theaterId, roomIds, startDate, endDate, timeSlots');
    }

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

          // Tạo suất chiếu mới
          await Showtime.create({
            movie:       movieId,
            theater:     theaterId,
            room:        roomId,
            startTime,
            endTime,
            ticketPrice: Number(ticketPrice),
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
  getRoomSeats,
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
  getDashboardStats,
  getRevenueReport,
  listBookings,
  deleteBooking,
  listUsers,
  updateUserRole,
  deleteUser,
};
