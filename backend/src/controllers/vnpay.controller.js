const crypto = require('crypto');
const Payment = require('../models/Payment.model');
const Booking = require('../models/Booking.model');
const Showtime = require('../models/Showtime.model');
const sendEmail = require('../utils/sendEmail');

// Helper to format Date for VNPay (yyyyMMddHHmmss)
const formatVnpayDate = (date) => {
  const pad = (n) => (n < 10 ? '0' + n : n);
  return date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds());
};

const sendBookingConfirmationEmail = async (booking) => {
  try {
    const timeString = new Date(booking.showtime.startTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateString = new Date(booking.showtime.startTime).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const ticketCode = booking.ticketCode || booking._id.toString().slice(-10).toUpperCase();
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const verifyUrl = `${appUrl}/ticket/${ticketCode}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #222; border-radius: 16px; padding: 25px; background-color: #13131c; color: #e4e4e7;">
        <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #a855f7; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Nova Cinematic</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin: 5px 0 0 0;">Vé Xem Phim Của Bạn Đã Sẵn Sàng!</p>
        </div>
        
        <p>Xin chào <strong>${booking.user.username}</strong>,</p>
        <p>Cảm ơn bạn đã lựa chọn Nova Cinematic. Giao dịch thanh toán qua VNPay của bạn đã hoàn tất thành công. Dưới đây là thông tin chi tiết về vé xem phim của bạn:</p>
        
        <div style="background-color: #1e1e2f; border-left: 4px solid #a855f7; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #fff; font-size: 20px; font-weight: 800;">${booking.showtime.movie.title}</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d4d4d8; margin-top: 15px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa; width: 140px;">Rạp chiếu:</td>
              <td style="padding: 6px 0; color: #fff;">${booking.showtime.theater.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Phòng chiếu:</td>
              <td style="padding: 6px 0; color: #fff;">${booking.showtime.room.name} (${booking.showtime.format})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Thời gian:</td>
              <td style="padding: 6px 0; color: #fff;">${timeString} &bull; ${dateString}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Ghế ngồi:</td>
              <td style="padding: 6px 0; color: #a855f7; font-weight: bold; font-size: 16px;">${booking.seats.join(', ')}</td>
            </tr>
            ${booking.concessions && booking.concessions.length > 0 ? `
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa; vertical-align: top;">Đồ ăn uống:</td>
              <td style="padding: 6px 0; color: #fff;">
                <ul style="margin: 0; padding-left: 18px;">
                  ${booking.concessions.map(c => `<li>${c.concession?.name || 'Đồ ăn uống'} (x${c.quantity})</li>`).join('')}
                </ul>
              </td>
            </tr>
            ` : ''}
          </table>
          
          <div style="border-top: 1px dashed #3f3f46; margin-top: 15px; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: bold; color: #a1a1aa;">Mã vé (ticketCode):</span>
              <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #a855f7; background-color: #09090b; padding: 4px 10px; border-radius: 6px; border: 1px solid #3f3f46; letter-spacing: 1px;">${ticketCode}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; color: #a1a1aa;">Mã đặt vé:</span>
              <span style="font-family: monospace; font-size: 12px; color: #a1a1aa;">${booking._id}</span>
            </div>
          </div>
          
          <div style="margin-top: 15px; padding-top: 10px; font-size: 16px; font-weight: bold; text-align: right; color: #fff;">
            Tổng thanh toán: <span style="color: #a855f7; font-size: 18px;">${booking.totalPrice.toLocaleString('vi-VN')} VND</span>
          </div>
        </div>

        <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Mã QR Vé Điện Tử</p>
          <div style="background-color: #ffffff; padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 12px; border: 1px solid #e2e8f0;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&amp;data=${encodeURIComponent(verifyUrl)}" alt="Ticket QR Code" width="180" height="180" style="display: block; border: 0;" />
          </div>
          <div style="margin-top: 4px;">
            <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; font-weight: bold; font-size: 14px; text-decoration: none; padding: 10px 24px; border-radius: 8px;">Xem Vé Điện Tử Trên Web</a>
          </div>
          <p style="color: #64748b; font-size: 11px; margin: 10px 0 0 0; word-break: break-all;">${verifyUrl}</p>
        </div>
        
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
          * <strong>Lưu ý:</strong> Vui lòng xuất trình mã vé <strong>${ticketCode}</strong> hoặc QR Code này cho nhân viên soát vé khi vào rạp. Mã vé có thể được nhập tay tại quầy nếu không quét được QR.
        </p>
        
        <div style="text-align: center; border-top: 1px solid #27272a; margin-top: 25px; padding-top: 15px; font-size: 11px; color: #71717a;">
          Email này được gửi tự động bởi hệ thống đặt vé Nova Cinematic. Vui lòng không trả lời trực tiếp email này.
        </div>
      </div>
    `;

    await sendEmail({
      to: booking.user.email,
      subject: `[Nova Cinematic] Xác nhận đặt vé xem phim thành công - ${booking.showtime.movie.title}`,
      html: emailHtml,
    });
    console.log(`Confirmation email sent successfully to ${booking.user.email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { bookingId, amount, orderInfo } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'Missing bookingId or amount' });
    }

    const tmnCode = process.env.VNP_TMN_CODE || '2QXUI2C7';
    const secretKey = process.env.VNP_HASH_SECRET || 'TS858W9CLXN6HO482G6CGB21H0B00C4D';
    let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5173/vnpay-return';

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const createDate = formatVnpayDate(new Date());
    const txnRef = `${bookingId}_${Date.now()}`; // Unique reference per payment attempt

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = orderInfo || `Thanh toan ve xem phim booking ${bookingId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(vnp_Params).sort();
    let signData = '';
    let urlParams = '';

    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      const value = vnp_Params[key];
      if (i > 0) {
        signData += '&';
        urlParams += '&';
      }
      signData += key + '=' + encodeURIComponent(value).replace(/%20/g, '+');
      urlParams += key + '=' + encodeURIComponent(value).replace(/%20/g, '+');
    }

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpUrl += '?' + urlParams + '&vnp_SecureHash=' + signed;

    // Create Payment record (pending)
    await Payment.create({
      booking: bookingId,
      paymentMethod: 'vnpay',
      transactionId: txnRef,
      amount: Number(amount),
      status: 'pending',
    });

    return res.json({ payUrl: vnpUrl });
  } catch (error) {
    console.error('createPayment VNPay error', error.message);
    next(error);
  }
};

const vnpayCallback = async (req, res, next) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Verify signature
    const secretKey = process.env.VNP_HASH_SECRET || 'TS858W9CLXN6HO482G6CGB21H0B00C4D';
    const sortedKeys = Object.keys(vnp_Params).sort();
    let signData = '';

    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      const value = vnp_Params[key];
      if (i > 0) {
        signData += '&';
      }
      signData += key + '=' + encodeURIComponent(value).replace(/%20/g, '+');
    }

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (signed !== secureHash) {
      return res.status(400).json({ success: false, error: 'Invalid VNPay secure hash' });
    }

    const txnRef = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const amount = Number(vnp_Params['vnp_Amount']) / 100;

    const payment = await Payment.findOne({ transactionId: txnRef }).populate('booking');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (responseCode === '00') {
      payment.status = 'completed';
      await payment.save();

      if (payment.booking) {
        await Booking.findByIdAndUpdate(payment.booking._id, { paymentStatus: 'paid' });

        // Retrieve populated booking to send receipt email
        const populatedBooking = await Booking.findById(payment.booking._id)
          .populate('user')
          .populate({
            path: 'showtime',
            populate: [
              { path: 'movie' },
              { path: 'theater' },
              { path: 'room' },
            ],
          })
          .populate('concessions.concession');

        if (populatedBooking) {
          // Send Gmail ticket receipt confirmation
          await sendBookingConfirmationEmail(populatedBooking);
        }
      }

      return res.json({ success: true, bookingId: payment.booking ? payment.booking._id : null });
    } else {
      payment.status = 'failed';
      await payment.save();
      
      // Xóa booking và giải phóng ghế khi thanh toán thất bại
      if (payment.booking) {
        const bookingId = payment.booking._id || payment.booking;
        // Lấy thông tin booking để biết ghế nào cần giải phóng
        const failedBooking = await Booking.findById(bookingId);
        if (failedBooking) {
          // Giải phóng ghế trong showtime
          await Showtime.findByIdAndUpdate(failedBooking.showtime, {
            $pull: { bookedSeats: { $in: failedBooking.seats } },
          });
          // Xóa booking khỏi database
          await Booking.findByIdAndDelete(bookingId);
        }
        // Xóa payment record
        await Payment.deleteMany({ booking: bookingId });
      }

      return res.json({ success: false, error: `VNPay trả về mã thất bại: ${responseCode}` });
    }
  } catch (error) {
    console.error('vnpayCallback error', error.message);
    next(error);
  }
};

module.exports = { createPayment, vnpayCallback };
