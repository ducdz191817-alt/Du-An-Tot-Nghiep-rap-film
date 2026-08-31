require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');
const Room = require('./models/Room.model');
const User = require('./models/User.model');
const Seat = require('./models/Seat.model');
const Showtime = require('./models/Showtime.model');
const Booking = require('./models/Booking.model');
const Review = require('./models/Review.model');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking');
  
  console.log('=== 1. SAMPLE BOOKED SEATS BY ROOM (Kiểm tra chống ghế mồ côi) ===');
  const sampleShowtimes = await Showtime.find({ bookedSeats: { $exists: true, $ne: [] } })
    .populate('room', 'name')
    .populate('movie', 'title')
    .limit(5);

  sampleShowtimes.forEach(st => {
    console.log(`🎬 Phim: ${st.movie?.title} | Phòng: ${st.room?.name} | Suất: ${st.startTime.toISOString()}`);
    console.log(`   💺 Ghế đã đặt: [${st.bookedSeats.join(', ')}]`);
  });

  console.log('\n=== 2. DISABLED SEATS (Ghế bảo trì theo cặp ở góc) ===');
  const disabledSeats = await Seat.find({ isDisabled: true }).populate('room', 'name');
  disabledSeats.forEach(s => console.log(`   🔧 ${s.room?.name || 'Phòng'}: Hàng ${s.row}, Số ${s.number} (${s.type})`));

  process.exit(0);
})();
