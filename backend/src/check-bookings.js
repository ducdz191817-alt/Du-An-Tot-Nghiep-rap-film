// check-bookings.js
require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking.model');
const Showtime = require('./models/Showtime.model');
const Movie = require('./models/Movie.model');
const Theater = require('./models/Theater.model');
const Room = require('./models/Room.model');

const check = async () => {
  await mongoose.connect(
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/movie-ticket-booking'
  );
  console.log('Connected!');

  const bookingsCount = await Booking.countDocuments({});
  console.log('Bookings Count:', bookingsCount);

  const paidCount = await Booking.countDocuments({ paymentStatus: 'paid' });
  console.log('Paid Bookings Count:', paidCount);

  const sampleBookings = await Booking.find({ paymentStatus: 'paid' })
    .limit(5)
    .populate({
      path: 'showtime',
      populate: [{ path: 'movie', select: 'title genre' }, { path: 'theater', select: 'name' }],
    });

  console.log('Sample Bookings details:');
  sampleBookings.forEach((b, i) => {
    console.log(`Booking ${i + 1}:`);
    console.log('  totalPrice:', b.totalPrice);
    console.log('  bookingDate:', b.bookingDate);
    console.log('  showtime:', b.showtime);
  });

  process.exit(0);
};

check();
