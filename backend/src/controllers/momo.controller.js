const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment.model');
const Booking = require('../models/Booking.model');
const Seat = require('../models/Seat.model');
const sendEmail = require('../utils/sendEmail');

const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, orderInfo } = req.body;
    if (!bookingId || !amount) return res.status(400).json({ error: 'Missing bookingId or amount' });

    const partnerCode = process.env.MOMO_PARTNER_CODE?.trim();
    const accessKey = process.env.MOMO_ACCESS_KEY?.trim();
    const secretKey = process.env.MOMO_SECRET_KEY?.trim();
    const redirectUrl = process.env.MOMO_REDIRECT_URL?.trim(); // frontend callback after payment
    const ipnUrl = process.env.MOMO_IPN_URL?.trim(); // backend callback for payment status

    const orderId = `ORDER_${Date.now()}`;
    const requestId = `REQ_${Date.now()}`;
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo || ''}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode,
      accessKey,
      requestId,
      amount: String(amount),
      orderId,
      orderInfo: orderInfo || 'Payment for booking',
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
    };

    const momoEndpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const r = await axios.post(momoEndpoint, body, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });

    if (!r.data || Number(r.data.resultCode) !== 0) {
      console.error('createPayment momo returned failure', r.data);
      return res.status(502).json({ error: 'Momo gateway rejected payment request', detail: r.data });
    }

    // Create Payment record (pending)
    await Payment.create({
      booking: bookingId,
      paymentMethod: 'momo',
      transactionId: orderId,
      amount: Number(amount),
      status: 'pending',
    });

    return res.json({ payUrl: r.data.payUrl, raw: r.data });
  } catch (error) {
    console.error('createPayment error', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to create Momo payment' });
  }
};

const momoCallback = async (req, res) => {
  try {
    const payload = req.body;
    const secretKey = process.env.MOMO_SECRET_KEY;

    const {
      partnerCode,
      accessKey,
      requestId,
      orderId,
      amount,
      orderInfo,
      orderType,
      transId,
      message,
      responseTime,
      resultCode,
      extraData,
      signature: momoSignature,
    } = payload;

    const raw = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message || ''}&orderId=${orderId}&orderInfo=${orderInfo || ''}&orderType=${orderType || ''}&partnerCode=${partnerCode}&payType=${payload.payType || ''}&requestId=${requestId || ''}&responseTime=${responseTime || ''}&resultCode=${resultCode}`;
    const expected = crypto.createHmac('sha256', secretKey).update(raw).digest('hex');

    if (expected !== momoSignature) {
      console.warn('Momo callback invalid signature', { expected, momoSignature });
      return res.status(400).send('Invalid signature');
    }

    // Find payment by orderId (we stored orderId as transactionId)
    const payment = await Payment.findOne({ transactionId: orderId }).populate('booking');
    if (!payment) {
      console.warn('Momo callback: payment not found', orderId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    const numericAmount = Number(amount);
    if (payment.amount !== numericAmount) {
      console.warn('Momo callback amount mismatch', { expected: payment.amount, got: numericAmount });
      // continue but mark failed
      payment.status = 'failed';
      await payment.save();
      return res.json({ status: 'amount_mismatch' });
    }

    if (Number(resultCode) === 0) {
      payment.status = 'completed';
      await payment.save();

      // Update booking payment status
      if (payment.booking) {
        const updatedBooking = await Booking.findByIdAndUpdate(
          payment.booking._id,
          { paymentStatus: 'paid' },
          { new: true }
        )
          .populate('user', 'username email')
          .populate({
            path: 'showtime',
            populate: [
              { path: 'movie', select: 'title posterUrl' },
              { path: 'theater', select: 'name' },
              { path: 'room', select: 'name' },
            ],
          })
          .populate('concessions.concession', 'name price');

        // Gửi email xác nhận tự động sau khi MoMo thanh toán thành công
        if (updatedBooking?.user?.email) {
          try {
            const showtime = updatedBooking.showtime;
            const movie = showtime?.movie;
            const theater = showtime?.theater;
            const room = showtime?.room;
            const userName = updatedBooking.user.username || 'Quý khách';
            const ticketCode = updatedBooking.ticketCode || updatedBooking._id;
            const totalPrice = (updatedBooking.totalPrice || 0).toLocaleString('vi-VN');

            const startTime = showtime?.startTime
              ? new Date(showtime.startTime).toLocaleString('vi-VN', {
                  weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                })
              : 'Không xác định';

            let seatDocs = [];
            if (updatedBooking.seats?.length > 0) {
              seatDocs = await Seat.find({ _id: { $in: updatedBooking.seats } }).select('row number');
            }
            const seatsStr = seatDocs.length > 0
              ? seatDocs.map(s => `${s.row}${s.number}`).join(', ')
              : (updatedBooking.seats || []).join(', ');

            const concessionRows = (updatedBooking.concessions || [])
              .filter(c => c.concession)
              .map(c => {
                const qty = c.quantity || 1;
                const price = ((c.concession.price || 0) * qty).toLocaleString('vi-VN');
                return `<li>${c.concession.name} x${qty} — ${price}đ</li>`;
              }).join('');

            const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><title>Xác nhận vé - Nova Cinema</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#0f0f1a">
<tr><td align="center">
<table width="560" style="max-width:560px;width:100%">
  <tr><td style="background:linear-gradient(135deg,#c0392b,#e74c3c,#ff6b6b);border-radius:14px 14px 0 0;padding:26px 32px;text-align:center">
    <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:2px">🎬 NOVA CINEMA</div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px">THANH TOÁN MOMO THÀNH CÔNG</div>
  </td></tr>
  <tr><td style="background:#1a1a2e;padding:22px 32px">
    <div style="color:#fff;font-size:15px;font-weight:600">Xin chào <span style="color:#e74c3c">${userName}</span>,</div>
    <div style="color:#999;font-size:12px;margin-top:5px;line-height:1.7">Thanh toán MoMo của bạn đã được xác nhận. Dưới đây là thông tin vé.</div>
  </td></tr>
  <tr><td style="background:#16213e;padding:0 32px 22px">
    <div style="background:#0f3460;border-radius:10px;padding:18px 20px;border:1px solid rgba(231,76,60,0.25)">
      <div style="color:#fff;font-size:18px;font-weight:900;margin-bottom:14px">🎬 ${movie?.title || 'Phim'}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
        <tr><td style="color:#666;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">🏢 Rạp chiếu</td><td style="color:#fff;font-weight:700;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">${theater?.name || ''}</td></tr>
        <tr><td style="color:#666;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">🚪 Phòng</td><td style="color:#fff;font-weight:700;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">${room?.name || ''}</td></tr>
        <tr><td style="color:#666;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">📅 Thời gian</td><td style="color:#e74c3c;font-weight:700;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">${startTime}</td></tr>
        <tr><td style="color:#666;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">💺 Ghế</td><td style="color:#fff;font-weight:700;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">${seatsStr}</td></tr>
        <tr><td style="color:#666;padding:7px 0">💰 Tổng tiền</td><td style="color:#f1c40f;font-weight:900;font-size:16px;padding:7px 0">${totalPrice}đ</td></tr>
      </table>
      ${concessionRows ? `<div style="margin-top:12px;color:#aaa;font-size:12px">🍿 Đồ ăn:<ul style="margin:4px 0;padding-left:18px;color:#ccc">${concessionRows}</ul></div>` : ''}
      <div style="margin-top:16px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:8px;padding:13px;text-align:center">
        <div style="color:rgba(255,255,255,0.75);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Mã vé</div>
        <div style="color:#fff;font-size:20px;font-weight:900;letter-spacing:4px">${ticketCode}</div>
        <div style="color:rgba(255,255,255,0.65);font-size:10px;margin-top:4px">Xuất trình khi check-in tại quầy</div>
      </div>
    </div>
  </td></tr>
  <tr><td style="background:#1a1a2e;padding:18px 32px;color:#999;font-size:12px;line-height:1.8">
    📌 Vui lòng có mặt trước <strong style="color:#e74c3c">15 phút</strong> trước giờ chiếu.
  </td></tr>
  <tr><td style="background:#0f0f1a;border-radius:0 0 14px 14px;padding:16px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)">
    <div style="color:#444;font-size:11px">© 2026 Nova Cinema</div>
  </td></tr>
</table></td></tr></table>
</body></html>`;

            await sendEmail({
              to: updatedBooking.user.email,
              subject: `🎬 Xác nhận vé MoMo - "${movie?.title || 'Phim'}" - Mã vé: ${ticketCode}`,
              html,
            });
          } catch (emailErr) {
            console.error('MoMo email send failed (non-fatal):', emailErr.message);
          }
        }
      }
    } else {
      payment.status = 'failed';
      await payment.save();
    }

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('momoCallback error', error.message);
    return res.status(500).json({ error: 'Callback processing failed' });
  }
};

module.exports = { createPayment, momoCallback };
