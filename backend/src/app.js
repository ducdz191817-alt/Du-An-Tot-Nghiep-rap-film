// Reloaded environment config
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { notFound, errorHandler } = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const showtimeRoutes = require('./routes/showtime.routes');
const bookingRoutes = require('./routes/booking.routes');
const concessionRoutes = require('./routes/concession.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewRoutes = require('./routes/review.routes');
const momoRoutes = require('./routes/momo.routes');
const vnpayRoutes = require('./routes/vnpay.routes');
const payosRoutes = require('./routes/payos.routes');
const sepayRoutes = require('./routes/sepay.routes');
const tmdbRoutes = require('./routes/tmdb.routes');
const couponRoutes = require('./routes/coupon.routes');
const uploadRoutes = require('./routes/upload.routes');

// Connect to MongoDB
connectDB();

// Auto-update movie statuses after DB is ready
const { autoUpdateMovieStatus } = require('./utils/autoUpdateMovieStatus');
// Delay slightly to let the DB connection settle, then run immediately and every hour
setTimeout(async () => {
  await autoUpdateMovieStatus();
  setInterval(autoUpdateMovieStatus, 60 * 60 * 1000); // every 1 hour

  // Tự động khởi tạo bảng giá mặc định nếu chưa có
  try {
    const PricingConfig = require('./models/PricingConfig.model');
    const existing = await PricingConfig.findOne();
    if (!existing) {
      await PricingConfig.create({});
      console.log('[PricingConfig] Đã khởi tạo bảng giá mặc định.');
    }
  } catch (e) {
    console.error('[PricingConfig] Lỗi khởi tạo bảng giá:', e.message);
  }

  // Tự động khởi tạo danh mục loại phòng chiếu (2D, 3D, IMAX, GOLDCLASS) nếu chưa có
  try {
    const RoomType = require('./models/RoomType.model');
    const count = await RoomType.countDocuments();
    if (count === 0) {
      const defaultRoomTypes = [
        {
          name: 'Phòng Chiếu 2D Tiêu Chuẩn',
          code: '2D',
          description: 'Hình ảnh 2D kỹ thuật số độ nét cao, âm thanh vòm sống động.',
          allowedSeatTypes: ['standard', 'vip', 'couple'],
          seatPrices: {
            standard: 100000,
            vip: 150000,
            couple: 300000,
          },
          isActive: true,
        },
        {
          name: 'Phòng Chiếu 3D Digital',
          code: '3D',
          description: 'Trải nghiệm không gian 3 chiều chân thực với kính 3D thế hệ mới.',
          allowedSeatTypes: ['standard', 'vip', 'couple'],
          seatPrices: {
            standard: 150000,
            vip: 200000,
            couple: 400000,
          },
          isActive: true,
        },
        {
          name: 'Phòng Chiếu IMAX Laser',
          code: 'IMAX',
          description: 'Màn hình cong khổng lồ, công nghệ chiếu Laser sắc nét vượt trội.',
          allowedSeatTypes: ['standard', 'vip', 'couple'],
          seatPrices: {
            standard: 200000,
            vip: 260000,
            couple: 500000,
          },
          isActive: true,
        },
        {
          name: 'Phòng Chiếu 4DX / Gold Class',
          code: 'GOLDCLASS',
          description: 'Ghế bọc da ngả lưng tự động, hiệu ứng chuyển động gió, mùi hương đẳng cấp.',
          allowedSeatTypes: ['vip', 'couple'],
          seatPrices: {
            standard: 0,
            vip: 320000,
            couple: 600000,
          },
          isActive: true,
        },
        {
          name: 'Sweetbox',
          code: 'SWEETBOX',
          description: 'Hệ thống phòng private riêng tư với giường nằm và màn hình chiếu.',
          allowedSeatTypes: ['couple'],
          seatPrices: {
            standard: 0,
            vip: 0,
            couple: 800000,
          },
          isActive: true,
        },
      ];
      await RoomType.insertMany(defaultRoomTypes);
      console.log('[RoomType] Đã khởi tạo danh mục loại phòng chiếu mẫu (2D, 3D, IMAX, GOLDCLASS, SWEETBOX).');
    }
  } catch (e) {
    console.error('[RoomType] Lỗi khởi tạo loại phòng chiếu:', e.message);
  }
}, 3000);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (poster images, etc.)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/concessions', concessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments/momo', momoRoutes);
app.use('/api/payments/vnpay', vnpayRoutes);
app.use('/api/payments/payos', payosRoutes);
app.use('/api/payments/sepay', sepayRoutes);
app.use('/api/admin/tmdb', tmdbRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);

// Base route status check
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Movie Ticket Booking API is fully functional',
    timestamp: new Date(),
  });
});

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const { initSocket } = require('./sockets/seatSocket');
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
