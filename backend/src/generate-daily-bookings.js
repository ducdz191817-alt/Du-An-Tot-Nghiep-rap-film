const mongoose = require('mongoose');
const Booking = require('./models/Booking.model');
const Showtime = require('./models/Showtime.model');
const User = require('./models/User.model');
const crypto = require('crypto');

const generateRandomTicketCode = () => {
  return 'TK' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

const seedDailyBookings = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/movie-ticket-booking');
    console.log('MongoDB Connected to seed daily bookings...');

    const users = await User.find();
    const showtimes = await Showtime.find({ movie: { $ne: null } });

    if (!users.length || !showtimes.length) {
      console.log('Không tìm thấy User hoặc Showtime trong DB!');
      process.exit(1);
    }

    const paymentMethods = ['vnpay', 'momo', 'vietqr', 'card', 'cash'];
    const seatRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    
    // Tạo mốc thời gian từ ngày 15/06/2026 đến 04/08/2026 (khoảng 50 ngày)
    const startDate = new Date('2026-06-15T00:00:00.000Z');
    const endDate = new Date('2026-08-04T00:00:00.000Z');
    
    const bookingsToInsert = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Mỗi ngày tạo từ 1 - 4 đơn đặt vé với doanh thu ngẫu nhiên
      const numBookingsToday = Math.floor(Math.random() * 4) + 1;

      for (let i = 0; i < numBookingsToday; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomShowtime = showtimes[Math.floor(Math.random() * showtimes.length)];
        const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        // Random số ghế (1 đến 3 ghế)
        const numSeats = Math.floor(Math.random() * 3) + 1;
        const seats = [];
        for (let s = 0; s < numSeats; s++) {
          const row = seatRows[Math.floor(Math.random() * seatRows.length)];
          const col = Math.floor(Math.random() * 10) + 1;
          seats.push(`${row}${col}`);
        }

        // Giá vé: 70.000đ đến 150.000đ mỗi ghế
        const pricePerSeat = (Math.floor(Math.random() * 9) + 7) * 10000;
        const totalPrice = pricePerSeat * numSeats;

        // Giờ đặt ngẫu nhiên trong ngày
        const bookingDate = new Date(currentDate);
        bookingDate.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60), 0, 0);

        bookingsToInsert.push({
          user: randomUser._id,
          showtime: randomShowtime._id,
          seats: seats,
          totalPrice: totalPrice,
          paymentStatus: 'paid',
          paymentMethod: randomPaymentMethod,
          bookingDate: bookingDate,
          ticketCode: generateRandomTicketCode(),
          checkInStatus: Math.random() > 0.3 ? 'checked_in' : 'not_checked_in',
          checkInTime: Math.random() > 0.3 ? new Date(bookingDate.getTime() + 3600000) : null
        });
      }

      // Tăng thêm 1 ngày
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Đang thêm ${bookingsToInsert.length} đơn đặt vé rải đều qua các ngày...`);
    const inserted = await Booking.insertMany(bookingsToInsert);
    console.log(`✅ Đã tạo thành công ${inserted.length} vé cho biểu đồ doanh thu theo ngày!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi sinh dữ liệu vé:', error);
    process.exit(1);
  }
};

seedDailyBookings();
