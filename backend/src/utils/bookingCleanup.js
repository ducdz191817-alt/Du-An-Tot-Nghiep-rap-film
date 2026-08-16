const Booking = require('../models/Booking.model');
const Showtime = require('../models/Showtime.model');
const Payment = require('../models/Payment.model');

const checkAndExpirePendingBookings = async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // Find all bookings that are pending and older than 10 minutes
    const expiredBookings = await Booking.find({
      paymentStatus: 'pending',
      $or: [
        { bookingDate: { $lt: tenMinutesAgo } },
        { createdAt: { $lt: tenMinutesAgo } }
      ]
    });

    if (expiredBookings.length > 0) {
      console.log(`[Cleanup] Found ${expiredBookings.length} expired pending bookings. Expiring them now...`);
    }

    for (const booking of expiredBookings) {
      // 1. Release showtime booked seats
      await Showtime.findByIdAndUpdate(booking.showtime, {
        $pull: { bookedSeats: { $in: booking.seats } },
      });

      // 2. Update booking status to failed
      booking.paymentStatus = 'failed';
      await booking.save();

      // 3. Update payment transaction status to failed
      await Payment.findOneAndUpdate(
        { booking: booking._id },
        { status: 'failed' }
      );
      
      console.log(`[Cleanup] Expired booking ${booking._id} and released seats: ${booking.seats.join(', ')}`);
    }
  } catch (error) {
    console.error('[Cleanup] Error in checkAndExpirePendingBookings:', error);
  }
};

module.exports = {
  checkAndExpirePendingBookings
};
