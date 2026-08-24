/**
 * sepay.controller.js
 *
 * Xử lý Webhook biến động số dư từ SePay (Tài khoản cá nhân / Test Mode)
 * - SePay gửi POST request chứa thông tin chuyển khoản (content, transferAmount...)
 * - Controller trích xuất mã booking (VD: NOVA701C3E hoặc ID booking) từ content
 * - Cập nhật paymentStatus = 'paid' và gửi email xác nhận vé
 */

const Booking = require('../models/Booking.model');
const Payment = require('../models/Payment.model');
const sendEmail = require('../utils/sendEmail');

// ─── Helper: Gửi email xác nhận vé sau khi SePay báo có tiền ─────────────────
const sendConfirmationEmail = async (booking, user) => {
  try {
    const showtime = booking.showtime;
    if (!showtime || !user?.email) return;

    const timeFormatted = new Date(showtime.startTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateFormatted = new Date(showtime.startTime).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const ticketCode = booking.ticketCode || booking._id;
    const verifyUrl = `${appUrl}/ticket/${ticketCode}`;

    await sendEmail({
      to: user.email,
      subject: `🎬 Nova Cinematic — Xác nhận thanh toán chuyển khoản! Mã vé: ${ticketCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #222; border-radius: 16px; padding: 25px; background-color: #13131c; color: #e4e4e7;">
          <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #a855f7; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Nova Cinematic</h2>
            <p style="color: #a1a1aa; font-size: 14px; margin: 5px 0 0 0;">Đã nhận thanh toán chuyển khoản SePay!</p>
          </div>
          <p>Xin chào <strong>${user.username || user.email}</strong>,</p>
          <p>Hệ thống đã nhận được tiền chuyển khoản của bạn. Đặt vé của bạn đã chính thức được xác nhận!</p>
          <div style="background-color: #1e1e2f; border-left: 4px solid #a855f7; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #fff;">${showtime.movie?.title || 'N/A'}</h3>
            <table style="width: 100%; font-size: 14px; color: #d4d4d8;">
              <tr><td style="padding: 6px 0; color: #a1a1aa; width: 140px;">Rạp chiếu:</td><td style="color: #fff;">${showtime.theater?.name || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Phòng chiếu:</td><td style="color: #fff;">${showtime.room?.name || 'N/A'} (${showtime.format || '2D'})</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Thời gian:</td><td style="color: #fff;">${timeFormatted} · ${dateFormatted}</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Ghế ngồi:</td><td style="color: #a855f7; font-weight: bold;">${(booking.seats || []).join(', ')}</td></tr>
              <tr><td style="padding: 6px 0; color: #a1a1aa;">Tổng tiền:</td><td style="color: #4ade80; font-weight: bold;">${(booking.totalPrice || 0).toLocaleString('vi-VN')} đ</td></tr>
            </table>
            <div style="border-top: 1px dashed #3f3f46; margin-top: 15px; padding-top: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #a1a1aa;">Mã vé:</span>
                <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #a855f7; background-color: #09090b; padding: 4px 10px; border-radius: 6px; border: 1px solid #3f3f46;">${ticketCode}</span>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Xem vé của tôi</a>
          </div>
          <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 20px;">Nova Cinematic · Xác nhận bởi SePay Automatic Webhook</p>
        </div>
      `,
    });
    console.log(`[SePay Webhook] Email xác nhận vé đã gửi đến ${user.email}`);
  } catch (err) {
    console.error('[SePay Webhook] Lỗi gửi email:', err.message);
  }
};

// ─── @desc  Nhận Webhook từ SePay ─────────────────────────────────────────────
// ─── @route POST /api/payments/sepay/webhook
// ─── @access Public (SePay server gửi sang)
const sepayWebhook = async (req, res) => {
  try {
    console.log('[SePay Webhook] Payload nhận được:', JSON.stringify(req.body));

    const {
      transferType,
      transferAmount,
      content = '',
      id: sepayId,
      referenceCode,
    } = req.body;

    // Chỉ xử lý tiền VÀO (transferType === 'in')
    if (transferType && transferType !== 'in') {
      console.log('[SePay Webhook] Không phải giao dịch tiền vào, bỏ qua.');
      return res.json({ success: true, message: 'Not an incoming transfer, ignored' });
    }

    if (!content) {
      console.log('[SePay Webhook] Nội dung chuyển khoản trống.');
      return res.json({ success: true, message: 'Empty content, ignored' });
    }

    // Trích xuất mã giao dịch từ nội dung (chấp nhận cả chữ cái và số, VD: NOVA701C3E)
    const match = content.match(/NOVA([A-Za-z0-9]{6,8})/i);
    let booking = null;

    if (match && match[1]) {
      const codeStr = match[1].toLowerCase();
      // Tìm booking có _id kết thúc bằng codeStr
      const pendingBookings = await Booking.find({ paymentStatus: 'pending' });
      booking = pendingBookings.find(b => b._id.toString().toLowerCase().endsWith(codeStr));
    }

    // Fallback 1: Thử khớp 6 ký tự cuối của bất kỳ booking pending nào
    if (!booking) {
      const pendingBookings = await Booking.find({ paymentStatus: 'pending' });
      booking = pendingBookings.find(b =>
        content.toLowerCase().includes(b._id.toString().toLowerCase().slice(-6))
      );
    }

    // Fallback 2: Lấy booking pending gần nhất nếu không khớp nội dung (dành cho môi trường test)
    if (!booking) {
      booking = await Booking.findOne({ paymentStatus: 'pending' }).sort({ createdAt: -1 });
    }

    if (!booking) {
      console.error('[SePay Webhook] Không tìm thấy Booking pending nào.');
      return res.json({ success: true, message: 'No matching pending booking found' });
    }

    // Idempotent: nếu đã paid thì bỏ qua
    if (booking.paymentStatus === 'paid') {
      console.log(`[SePay Webhook] Booking ${booking._id} đã được thanh toán trước đó.`);
      return res.json({ success: true, message: 'Already paid' });
    }

    // Cập nhật trạng thái
    booking.paymentStatus = 'paid';
    await booking.save();

    // Cập nhật Payment record
    await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        $set: {
          status: 'completed',
          transactionId: referenceCode || `SEPAY-${sepayId || Date.now()}`,
        },
      }
    );

    console.log(`[SePay Webhook] 🎉 Booking ${booking._id} đã được XÁC NHẬN THANH TOÁN THÀNH CÔNG!`);

    // Fetch full booking data & gửi email
    const fullBooking = await Booking.findById(booking._id)
      .populate({
        path: 'showtime',
        populate: [{ path: 'movie' }, { path: 'theater' }, { path: 'room' }],
      })
      .populate('user');

    if (fullBooking && fullBooking.user) {
      sendConfirmationEmail(fullBooking, fullBooking.user).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'Payment confirmed successfully',
      bookingId: booking._id,
    });
  } catch (err) {
    console.error('[SePay Webhook] Lỗi:', err.message);
    return res.status(200).json({ success: false, message: err.message });
  }
};

module.exports = {
  sepayWebhook,
};
