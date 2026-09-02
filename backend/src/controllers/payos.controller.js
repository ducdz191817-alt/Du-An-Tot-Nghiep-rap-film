const { PayOS } = require('@payos/node');
const Booking = require('../models/Booking.model');
const Payment = require('../models/Payment.model');

// Khởi tạo đối tượng PayOS với cấu hình từ biến môi trường
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || 'dummy_id',
  apiKey: process.env.PAYOS_API_KEY || 'dummy_key',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum',
});

/**
 * @desc    Tạo link/yêu cầu thanh toán qua cổng PayOS
 * @route   POST /api/payment/payos/create
 * @access  Private
 */
const createPayosPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // 1. Kiểm tra đơn đặt vé có tồn tại hay không
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy đơn đặt vé');
    }

    // 2. Tạo mã đơn hàng duy nhất dạng số integer theo yêu cầu của PayOS
    const orderCode = parseInt(String(Date.now()).slice(-7) + String(Math.floor(100 + Math.random() * 900)));

    // 3. Chuẩn bị dữ liệu yêu cầu thanh toán
    const paymentData = {
      orderCode,
      amount: booking.totalPrice,
      description: `Booking ${bookingId}`.slice(0, 25),
      items: [{ name: 'Vé xem phim', quantity: 1, price: booking.totalPrice }],
      returnUrl: process.env.PAYOS_RETURN_URL || 'http://localhost:5173/payos-return',
      cancelUrl: process.env.PAYOS_CANCEL_URL || 'http://localhost:5173/payos-return?cancelled=true',
    };

    // 4. Gửi yêu cầu tạo liên kết thanh toán tới PayOS API
    const payosResponse = await payos.paymentRequests.create(paymentData);
    res.json({ success: true, data: payosResponse });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Xử lý Webhook gửi tự động từ máy chủ PayOS khi người dùng hoàn tất thanh toán
 * @route   POST /api/payment/payos/webhook
 * @access  Public (PayOS Server gọi)
 */
const payosWebhook = async (req, res) => {
  try {
    // 1. Xác thực chữ ký số webhook để đảm bảo dữ liệu từ PayOS gửi về
    const webhookData = payos.webhooks.verify(req.body);

    // 2. Kiểm tra nếu mã trạng thái là '00' (Thanh toán thành công)
    if (webhookData.code === '00') {
      const payment = await Payment.findOne({ payosOrderCode: webhookData.orderCode });
      if (payment) {
        // Cập nhật trạng thái thanh toán của đơn đặt vé thành 'paid'
        await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'paid' });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false });
  }
};

/**
 * @desc    Điều hướng khách hàng quay trở lại giao diện Frontend sau khi thanh toán trên PayOS
 * @route   GET /api/payment/payos/return
 * @access  Public
 */
const handleReturn = async (req, res) => {
  res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/payos-return`);
};

module.exports = {
  createPayosPayment,
  payosWebhook,
  handleReturn,
};

