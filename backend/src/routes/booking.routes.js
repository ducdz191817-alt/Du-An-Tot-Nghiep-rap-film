const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingStatus,
  simulatePayment,
  cancelBooking,
} = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // All booking routes require authentication

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.get('/:id/status', getBookingStatus);
router.post('/:id/simulate-pay', simulatePayment);
router.delete('/:id/cancel', cancelBooking);

module.exports = router;
