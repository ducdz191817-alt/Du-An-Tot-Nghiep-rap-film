/**
 * seed-bookings.js
 *
 * Tạo dữ liệu đặt vé mẫu (paymentStatus='paid') cho báo cáo doanh thu.
 * Xóa booking/payment cũ (đã mồ côi), tạo mới dựa trên showtimes hiện tại.
 *
 * Chạy: node src/seed-bookings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Booking  = require('./models/Booking.model');
const Payment  = require('./models/Payment.model');
const Showtime = require('./models/Showtime.model');
const User     = require('./models/User.model');
const Movie    = require('./models/Movie.model');
const Theater  = require('./models/Theater.model');
const Room     = require('./models/Room.model');

const PAYMENT_METHODS = ['cash', 'card', 'vnpay', 'momo', 'vietqr'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Trả về một ngày ngẫu nhiên trong khoảng [daysAgo, 0] (quá khứ) */
const randomPastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgo));
  d.setHours(randInt(8, 22), randInt(0, 59), 0, 0);
  return d;
};

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const pickSeats = (count) => {
  const row = pick(SEAT_ROWS);
  const nums = Array.from({ length: count }, (_, i) => i + randInt(1, 8));
  return [...new Set(nums)].slice(0, count).map(n => `${row}${n}`);
};

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    // ── 1. Xóa booking và payment cũ ────────────────────────────────────────
    const delB = await Booking.deleteMany({});
    const delP = await Payment.deleteMany({});
    console.log(`🗑️  Đã xóa ${delB.deletedCount} bookings & ${delP.deletedCount} payments cũ.\n`);

    // ── 2. Lấy showtimes hiện tại (có thể cả quá khứ và tương lai) ──────────
    const showtimes = await Showtime.find({})
      .populate('movie', 'title')
      .populate('theater', 'name')
      .lean();

    if (!showtimes.length) {
      console.log('❌ Không có showtime nào. Hãy chạy refresh-showtimes.js trước.');
      process.exit(1);
    }
    console.log(`🎬 Tìm thấy ${showtimes.length} showtimes.\n`);

    // ── 3. Lấy users ─────────────────────────────────────────────────────────
    const users = await User.find({ role: 'user' }).lean();
    if (!users.length) {
      console.log('❌ Không có user nào. Kết thúc.');
      process.exit(1);
    }
    console.log(`👤 Tìm thấy ${users.length} users.\n`);

    // ── 4. Tạo ~80 bookings mẫu trải đều 3 tháng qua ─────────────────────────
    const bookingsData = [];
    const paymentsData = [];
    const TARGET_BOOKINGS = 80;

    for (let i = 0; i < TARGET_BOOKINGS; i++) {
      const showtime = pick(showtimes);
      const user = pick(users);
      const seatCount = randInt(1, 3);
      const seats = pickSeats(seatCount);

      // Giá vé từ showtime (có thể null nếu không populate được)
      const ticketPrice = showtime.ticketPrice || 90000;
      const totalPrice = ticketPrice * seatCount;

      // bookingDate trải đều trong 90 ngày qua
      const bookingDate = randomPastDate(90);

      const booking = {
        _id: new mongoose.Types.ObjectId(),
        user: user._id,
        showtime: showtime._id,
        seats,
        concessions: [],
        totalPrice,
        paymentStatus: 'paid',
        paymentMethod: pick(PAYMENT_METHODS),
        bookingDate,
        createdAt: bookingDate,
        updatedAt: bookingDate,
      };

      bookingsData.push(booking);

      // Payment record
      paymentsData.push({
        booking: booking._id,
        paymentMethod: booking.paymentMethod,
        amount: totalPrice,
        status: 'completed',
        transactionId: `TXN${Date.now()}${i}`,
        paymentDate: bookingDate,
        createdAt: bookingDate,
        updatedAt: bookingDate,
      });
    }

    const insertedBookings = await Booking.insertMany(bookingsData);
    console.log(`✅ Đã tạo ${insertedBookings.length} bookings mẫu.`);

    try {
      await Payment.insertMany(paymentsData);
      console.log(`✅ Đã tạo ${paymentsData.length} payment records.`);
    } catch (payErr) {
      console.log(`⚠️  Payment insert: ${payErr.message} (bỏ qua, không ảnh hưởng báo cáo)`);
    }

    // ── 5. Thống kê nhanh ────────────────────────────────────────────────────
    const totalRevenue = bookingsData.reduce((sum, b) => sum + b.totalPrice, 0);
    console.log(`\n💰 Tổng doanh thu mẫu: ${totalRevenue.toLocaleString('vi-VN')} đ`);
    console.log(`\n🎉 Hoàn tất! Báo cáo doanh thu sẽ hiện dữ liệu ngay bây giờ.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
};

run();
