const { PayOS } = require('@payos/node');
const Booking = require('../models/Booking.model');
const Payment = require('../models/Payment.model');

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || 'dummy_id',
  apiKey: process.env.PAYOS_API_KEY || 'dummy_key',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum',
});

const createPayosPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }
    const orderCode = parseInt(String(Date.now()).slice(-7) + String(Math.floor(100 + Math.random() * 900)));
    const paymentData = {
      orderCode,
      amount: booking.totalPrice,
      description: `Booking ${bookingId}`.slice(0, 25),
      items: [{ name: 'Vé xem phim', quantity: 1, price: booking.totalPrice }],
      returnUrl: process.env.PAYOS_RETURN_URL || 'http://localhost:5173/payos-return',
      cancelUrl: process.env.PAYOS_CANCEL_URL || 'http://localhost:5173/payos-return?cancelled=true',
    };
    const payosResponse = await payos.paymentRequests.create(paymentData);
    res.json({ success: true, data: payosResponse });
  } catch (err) {
    next(err);
  }
};

const payosWebhook = async (req, res) => {
  try {
    const webhookData = payos.webhooks.verify(req.body);
    if (webhookData.code === '00') {
      const payment = await Payment.findOne({ payosOrderCode: webhookData.orderCode });
      if (payment) {
        await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'paid' });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false });
  }
};

const handleReturn = async (req, res) => {
  res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/payos-return`);
};

module.exports = {
  createPayosPayment,
  payosWebhook,
  handleReturn,
};
