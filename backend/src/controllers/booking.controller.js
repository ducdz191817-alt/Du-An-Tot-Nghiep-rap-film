const Booking = require('../models/Booking.model');
const Showtime = require('../models/Showtime.model');
const Seat = require('../models/Seat.model');
const Concession = require('../models/Concession.model');
const Payment = require('../models/Payment.model');
const sendEmail = require('../utils/sendEmail');
const { checkAndExpirePendingBookings } = require('../utils/bookingCleanup');
const { confirmBookingClearHolds, getConflictingHeldSeats } = require('../sockets/seatSocket');

// @desc    Create a new booking and process payment
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  try {
    await checkAndExpirePendingBookings();
    const { showtimeId, seats, concessions = [], paymentMethod = 'card', couponCode } = req.body;
    const userId = req.user._id;

    if (!seats || seats.length === 0) {
      res.status(400);
      throw new Error('Please select at least one seat');
    }

    // 1. Verify showtime exists
    const showtime = await Showtime.findById(showtimeId)
      .populate('movie')
      .populate('theater')
      .populate('room');

    if (!showtime) {
      res.status(404);
      throw new Error('Showtime not found');
    }

    // 1.5 KIỂM TRA ĐỘ TUỔI CỦA NGƯỜI DÙNG DỰA TRÊN PHÂN LOẠI PHIM
    const movieRating = showtime.movie.rating; // Ví dụ: 'P', 'T13', 'T16', 'T18'
    const userAge = req.user.age;
    
    if (movieRating && movieRating !== 'P') {
      let requiredAge = 0;
      if (movieRating === 'T13') requiredAge = 13;
      else if (movieRating === 'T16') requiredAge = 16;
      else if (movieRating === 'T18') requiredAge = 18;

      if (userAge < requiredAge) {
        res.status(400);
        throw new Error(`Bạn chưa đủ tuổi để xem phim này. Phim yêu cầu độ tuổi từ ${requiredAge} trở lên (bạn hiện ${userAge} tuổi).`);
      }
    }

    // 2. Check if showtime has already passed
    const currentTime = Date.now();
    const showtimeTimestamp = showtime.startTime instanceof Date
      ? showtime.startTime.getTime()
      : new Date(showtime.startTime).getTime();

    if (showtimeTimestamp <= currentTime) {
      res.status(400);
      throw new Error('Cannot book tickets for a past showtime');
    }

    // 3. KIỂM TRA: Xem ghế khách hàng chọn đã được đặt trước đó chưa
    const bookedSeatSet = new Set(
      (showtime.bookedSeats || []).map((seatCode) => String(seatCode).trim().toUpperCase())
    );

    const normalizedSeats = seats
      .map((seatCode) => String(seatCode).trim().toUpperCase())
      .filter((seatCode) => seatCode);

    const conflictingSeats = normalizedSeats.filter((seatCode) => bookedSeatSet.has(seatCode));
    if (conflictingSeats.length > 0) {
      res.status(400);
      throw new Error(
        `Một hoặc nhiều ghế bạn chọn đã được đặt trước đó: ${conflictingSeats.join(', ')}. Vui lòng chọn ghế khác.`
      );
    }

    // ==========================================
    // FIX BUG 1: KIỂM TRA RACE CONDITION (TRÁNH CƯỚP GHẾ)
    // ==========================================
    // Mặc dù ghế chưa ai mua (chưa nằm trong bookedSeatSet), nhưng có thể ĐANG ĐƯỢC GIỮ bởi người khác.
    // Gọi hàm getConflictingHeldSeats để check chéo với Socket.
    const heldConflicts = getConflictingHeldSeats(showtimeId, normalizedSeats, userId);
    // Nếu mảng trả về có chứa ghế -> Có người khác đang giữ ghế này -> Chặn thanh toán ngay lập tức
    if (heldConflicts.length > 0) {
      res.status(400);
      throw new Error(
        `Ghế bạn chọn đang được người khác giữ: ${heldConflicts.join(', ')}. Vui lòng chọn lại ghế khác.`
      );
    }

    // 4. TÍNH TOÁN GIÁ VÉ & KIỂM TRA TRẠNG THÁI GHẾ (CÓ BỊ HỎNG/KHOÁ KHÔNG)
    // Truy vấn tất cả cấu hình ghế thực tế của phòng chiếu này từ database
    let seatPriceSum = 0;
    const roomSeats = await Seat.find({ room: showtime.room._id });

    for (const seatCode of seats) {
      // Tách mã ghế ví dụ: "A12" thành hàng "A" và số "12"
      const match = seatCode.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const row = match[1];
        const number = parseInt(match[2], 10);
        
        // Tìm thông tin ghế chi tiết tương ứng trong cơ sở dữ liệu
        const seatDetail = roomSeats.find((s) => s.row === row && s.number === number);
        if (seatDetail) {
          // BẢO MẬT: Kiểm tra xem ghế này có đang bị admin khóa/vô hiệu hóa hay không
          if (seatDetail.isDisabled) {
            res.status(400);
            throw new Error(`Ghế ${seatCode} hiện đang bảo trì và không thể đặt.`);
          }

          // ==========================================
          // FIX BUG 2: TÍNH TIỀN GHẾ ĐÔI (SWEETBOX) Ở BACKEND
          // ==========================================
          // Ghế đôi (couple) là ghế dành cho 2 người ngồi.
          // Do đó, giá của 1 ghế đôi phải bằng: (Giá vé gốc x 2) + Tiền phụ thu ghế đôi
          // Nếu không nhân 2 giá gốc, rạp sẽ bị lỗ vì 2 người xem nhưng chỉ thu tiền vé của 1 người.
          if (seatDetail.type === 'couple') {
            seatPriceSum += (showtime.ticketPrice * 2) + seatDetail.price;
          } else {
            // Đối với ghế thường hoặc VIP (chỉ 1 người ngồi): Giá vé gốc + Phụ thu
            seatPriceSum += showtime.ticketPrice + seatDetail.price;
          }
        } else {
          // Nếu không tìm thấy thông tin ghế trong DB, mặc định lấy giá vé gốc của lịch chiếu
          seatPriceSum += showtime.ticketPrice;
        }
      } else {
        seatPriceSum += showtime.ticketPrice;
      }
    }

    // 5. Calculate Concession Prices
    let concessionPriceSum = 0;
    const concessionItems = [];

    for (const item of concessions) {
      if (item.quantity > 0) {
        const concessionDoc = await Concession.findById(item.concessionId);
        if (concessionDoc) {
          concessionPriceSum += concessionDoc.price * item.quantity;
          concessionItems.push({
            concession: concessionDoc._id,
            quantity: item.quantity,
            name: concessionDoc.name, // Temporary usage for email construction
            price: concessionDoc.price,
          });
        }
      }
    }

    let totalPrice = seatPriceSum + concessionPriceSum;

    // 5.5 Process Coupon if provided
    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
      const Coupon = require('../models/Coupon.model');
      const couponDoc = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (!couponDoc) {
        res.status(404);
        throw new Error('Mã giảm giá không tồn tại');
      }
      if (!couponDoc.isActive) {
        res.status(400);
        throw new Error('Mã giảm giá đã bị vô hiệu hóa');
      }
      const now = new Date();
      if (couponDoc.startDate && now < couponDoc.startDate) {
        res.status(400);
        throw new Error('Mã giảm giá chưa đến thời gian áp dụng');
      }
      if (couponDoc.endDate && now > couponDoc.endDate) {
        res.status(400);
        throw new Error('Mã giảm giá đã hết hạn sử dụng');
      }
      if (couponDoc.usageLimit !== null && couponDoc.usageCount >= couponDoc.usageLimit) {
        res.status(400);
        throw new Error('Mã giảm giá đã hết lượt sử dụng');
      }
      if (totalPrice < couponDoc.minOrderAmount) {
        res.status(400);
        throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu ${couponDoc.minOrderAmount.toLocaleString('vi-VN')} đ để áp dụng mã này`);
      }

      if (couponDoc.discountType === 'percentage') {
        discountAmount = totalPrice * (couponDoc.discountValue / 100);
        if (couponDoc.maxDiscountAmount !== null) {
          discountAmount = Math.min(discountAmount, couponDoc.maxDiscountAmount);
        }
      } else if (couponDoc.discountType === 'fixed') {
        discountAmount = couponDoc.discountValue;
      }

      discountAmount = Math.min(discountAmount, totalPrice);
      totalPrice = totalPrice - discountAmount;
      couponId = couponDoc._id;

      // Update coupon usage count
      await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usageCount: 1 } });
    }

    // 6. Register/Book the seats in the Showtime document atomically to avoid race conditions
    const updatedShowtime = await Showtime.findOneAndUpdate(
      {
        _id: showtime._id,
        bookedSeats: { $nin: normalizedSeats },
      },
      {
        $addToSet: { bookedSeats: { $each: normalizedSeats } },
      },
      {
        new: true,
      }
    );

    if (!updatedShowtime) {
      res.status(400);
      throw new Error('Một hoặc nhiều ghế bạn chọn đã được đặt trước đó. Vui lòng chọn lại ghế.');
    }

    // Release real-time holds and broadcast seat_booked to all clients
    confirmBookingClearHolds(showtimeId, normalizedSeats, userId);

    // 7. Create the Booking
    const isVietQR = paymentMethod === 'vietqr';
    const isPendingPayment = ['vietqr', 'momo', 'vnpay'].includes(paymentMethod);
    const booking = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats: normalizedSeats,
      concessions: concessions.map((c) => ({
        concession: c.concessionId,
        quantity: c.quantity,
      })),
      totalPrice,
      paymentStatus: isPendingPayment ? 'pending' : 'paid',
      paymentMethod,
      coupon: couponId,
      discountAmount,
    });

    // 8. Create Payment Transaction
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await Payment.create({
      booking: booking._id,
      paymentMethod,
      transactionId,
      amount: totalPrice,
      status: isPendingPayment ? 'pending' : 'completed',
    });

    if (isVietQR) {
      // 9. VietQR logic
      const bankId = process.env.VIETQR_BANK_ID || 'MB';
      const accountNo = process.env.VIETQR_ACCOUNT_NO || '0903123456';
      const accountName = process.env.VIETQR_ACCOUNT_NAME || 'TRAN TIEN DUC';
      const addInfo = `NOVA${booking._id.toString().slice(-6).toUpperCase()}`;
      
      const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalPrice}&addInfo=${addInfo}&accountName=${encodeURIComponent(accountName)}`;
      
      return res.status(201).json({
        success: true,
        data: {
          booking,
          payment,
          vietqr: {
            bankId,
            accountNo,
            accountName,
            addInfo,
            qrUrl,
          },
        },
      });
    }

    // 9. Re-fetch booking để lấy ticketCode vừa được sinh ra bởi pre-save hook
    const savedBooking = await Booking.findById(booking._id);

    // 10. Send Confirmation Email
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
    const ticketCode = savedBooking?.ticketCode || transactionId;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const verifyUrl = `${appUrl}/ticket/${ticketCode}`;

    const emailContentHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #222; border-radius: 16px; padding: 25px; background-color: #13131c; color: #e4e4e7;">
        <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #a855f7; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Nova Cinematic</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin: 5px 0 0 0;">Vé Xem Phim Của Bạn Đã Sẵn Sàng!</p>
        </div>

        <p>Xin chào <strong>${req.user.username}</strong>,</p>
        <p>Cảm ơn bạn đã lựa chọn Nova Cinematic. Đặt vé và thanh toán của bạn đã hoàn tất thành công. Dưới đây là thông tin chi tiết:</p>

        <div style="background-color: #1e1e2f; border-left: 4px solid #a855f7; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #fff; font-size: 20px; font-weight: 800;">${showtime.movie.title}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d4d4d8; margin-top: 15px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa; width: 140px;">Rạp chiếu:</td>
              <td style="padding: 6px 0; color: #fff;">${showtime.theater.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Phòng chiếu:</td>
              <td style="padding: 6px 0; color: #fff;">${showtime.room.name} (${showtime.format})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Thời gian:</td>
              <td style="padding: 6px 0; color: #fff;">${timeFormatted} &bull; ${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Ghế ngồi:</td>
              <td style="padding: 6px 0; color: #a855f7; font-weight: bold; font-size: 16px;">${seats.join(', ')}</td>
            </tr>
            ${concessionItems.length > 0 ? `
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa; vertical-align: top;">Đồ ăn uống:</td>
              <td style="padding: 6px 0; color: #fff;">
                <ul style="margin: 0; padding-left: 18px;">
                  ${concessionItems.map(item => `<li>${item.name} x${item.quantity} (${(item.price * item.quantity).toLocaleString()} đ)</li>`).join('')}
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
              <span style="font-weight: bold; color: #a1a1aa;">Mã giao dịch:</span>
              <span style="font-family: monospace; font-size: 12px; color: #a1a1aa;">${transactionId}</span>
            </div>
          </div>

          <div style="margin-top: 15px; padding-top: 10px; font-size: 16px; font-weight: bold; text-align: right; color: #fff;">
            Tổng thanh toán: <span style="color: #a855f7; font-size: 18px;">${totalPrice.toLocaleString('vi-VN')} VND</span>
          </div>
        </div>

        <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">Quét mã QR hoặc nhấn nút để xem &amp; xác minh vé:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; font-weight: bold; font-size: 14px; text-decoration: none; padding: 10px 24px; border-radius: 8px;">Xem Vé Điện Tử</a>
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

    try {
      await sendEmail({
        to: req.user.email,
        subject: `[Nova Cinematic] Xác nhận đặt vé thành công - ${showtime.movie.title}`,
        html: emailContentHtml,
      });
    } catch (emailErr) {
      console.error('Email sending failed (non-fatal):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      data: {
        booking,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's booking history
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    await checkAndExpirePendingBookings();
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'theater' },
          { path: 'room' },
        ],
      })
      .populate({
        path: 'concessions.concession',
      })
      .sort({ bookingDate: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    await checkAndExpirePendingBookings();
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'theater' },
          { path: 'room' },
        ],
      })
      .populate({
        path: 'concessions.concession',
      });

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Check if the booking belongs to the current user (or user is admin)
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this booking record');
    }

    // Get transaction details
    const payment = await Payment.findOne({ booking: booking._id });

    res.json({
      success: true,
      data: {
        booking,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking payment status
// @route   GET /api/bookings/:id/status
// @access  Private
const getBookingStatus = async (req, res, next) => {
  try {
    await checkAndExpirePendingBookings();
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }
    
    // Check ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this booking record');
    }

    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate payment success (updates status to paid and sends email)
// @route   POST /api/bookings/:id/simulate-pay
// @access  Private
const simulatePayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'showtime',
        populate: [{ path: 'movie' }, { path: 'theater' }, { path: 'room' }]
      });

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Check ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (booking.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Booking is already paid',
        data: booking,
      });
    }

    // 1. Update Booking payment status
    booking.paymentStatus = 'paid';
    await booking.save();

    // 2. Update Payment Transaction
    const payment = await Payment.findOne({ booking: booking._id });
    if (payment) {
      payment.status = 'completed';
      await payment.save();
    }

    // 3. Re-fetch to get ticketCode
    const savedBooking = await Booking.findById(booking._id);
    const ticketCode = savedBooking?.ticketCode || booking._id.toString().slice(-10).toUpperCase();
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const verifyUrl = `${appUrl}/ticket/${ticketCode}`;

    // 4. Build email data
    const timeFormatted = new Date(booking.showtime.startTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateFormatted = new Date(booking.showtime.startTime).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const concessionItems = [];
    for (const item of booking.concessions) {
      const concessionDoc = await Concession.findById(item.concession);
      if (concessionDoc) {
        concessionItems.push({
          name: concessionDoc.name,
          quantity: item.quantity,
          price: concessionDoc.price,
        });
      }
    }

    const emailContentHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #222; border-radius: 16px; padding: 25px; background-color: #13131c; color: #e4e4e7;">
        <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #a855f7; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Nova Cinematic</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin: 5px 0 0 0;">Vé Xem Phim Của Bạn Đã Sẵn Sàng!</p>
        </div>

        <p>Xin chào <strong>${req.user.username}</strong>,</p>
        <p>Thanh toán của bạn đã được xác nhận thành công. Dưới đây là thông tin vé:</p>

        <div style="background-color: #1e1e2f; border-left: 4px solid #a855f7; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #fff; font-size: 20px; font-weight: 800;">${booking.showtime.movie.title}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d4d4d8; margin-top: 15px;">
            <tr><td style="padding: 6px 0; font-weight: bold; color: #a1a1aa; width: 140px;">Rạp chiếu:</td><td style="padding: 6px 0; color: #fff;">${booking.showtime.theater.name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Phòng chiếu:</td><td style="padding: 6px 0; color: #fff;">${booking.showtime.room.name} (${booking.showtime.format})</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Thời gian:</td><td style="padding: 6px 0; color: #fff;">${timeFormatted} &bull; ${dateFormatted}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Ghế ngồi:</td><td style="padding: 6px 0; color: #a855f7; font-weight: bold; font-size: 16px;">${booking.seats.join(', ')}</td></tr>
            ${concessionItems.length > 0 ? `<tr><td style="padding: 6px 0; font-weight: bold; color: #a1a1aa; vertical-align: top;">Đồ ăn uống:</td><td style="padding: 6px 0; color: #fff;"><ul style="margin: 0; padding-left: 18px;">${concessionItems.map(i => `<li>${i.name} x${i.quantity} (${(i.price * i.quantity).toLocaleString()} đ)</li>`).join('')}</ul></td></tr>` : ''}
          </table>

          <div style="border-top: 1px dashed #3f3f46; margin-top: 15px; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: bold; color: #a1a1aa;">Mã vé:</span>
              <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #a855f7; background-color: #09090b; padding: 4px 10px; border-radius: 6px; border: 1px solid #3f3f46; letter-spacing: 1px;">${ticketCode}</span>
            </div>
          </div>

          <div style="margin-top: 15px; font-size: 16px; font-weight: bold; text-align: right; color: #fff;">
            Tổng thanh toán: <span style="color: #a855f7; font-size: 18px;">${booking.totalPrice.toLocaleString('vi-VN')} VND</span>
          </div>
        </div>

        <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">Quét mã QR hoặc nhấn nút để xem &amp; xác minh vé:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; font-weight: bold; font-size: 14px; text-decoration: none; padding: 10px 24px; border-radius: 8px;">Xem Vé Điện Tử</a>
          <p style="color: #64748b; font-size: 11px; margin: 10px 0 0 0; word-break: break-all;">${verifyUrl}</p>
        </div>

        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
          * <strong>Lưu ý:</strong> Xuất trình mã vé <strong>${ticketCode}</strong> hoặc QR Code khi vào rạp.
        </p>

        <div style="text-align: center; border-top: 1px solid #27272a; margin-top: 25px; padding-top: 15px; font-size: 11px; color: #71717a;">
          Email này được gửi tự động bởi hệ thống đặt vé Nova Cinematic.
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: req.user.email,
        subject: `[Nova Cinematic] Xác nhận đặt vé thành công - ${booking.showtime.movie.title}`,
        html: emailContentHtml,
      });
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    res.json({
      success: true,
      message: 'Payment simulated and booking confirmed',
      data: savedBooking || booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending booking (releases seats and deletes booking record)
// @route   DELETE /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Check ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (booking.paymentStatus !== 'pending') {
      res.status(400);
      throw new Error('Only pending bookings can be cancelled');
    }

    // Release showtime booked seats
    await Showtime.findByIdAndUpdate(booking.showtime, {
      $pull: { bookedSeats: { $in: booking.seats } },
    });

    // Update payment and booking to failed instead of deleting
    booking.paymentStatus = 'failed';
    await booking.save();

    await Payment.findOneAndUpdate(
      { booking: booking._id },
      { status: 'failed' }
    );

    res.json({
      success: true,
      message: 'Booking cancelled (marked failed) and seats released successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify ticket info by ticketCode (public — no auth required, for QR scan)
// @route   GET /api/bookings/verify/:ticketCode
// @access  Public
const verifyTicket = async (req, res, next) => {
  try {
    const { ticketCode } = req.params;
    const cleanCode = ticketCode.trim().toUpperCase();

    // Tìm theo ticketCode hoặc bookingId nếu code là ObjectId
    let booking = await Booking.findOne({ ticketCode: cleanCode })
      .populate('user', 'username email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl duration rating' },
          { path: 'theater', select: 'name address' },
          { path: 'room', select: 'name type' },
        ],
      })
      .populate('concessions.concession', 'name price');

    if (!booking && cleanCode.length === 24) {
      booking = await Booking.findById(cleanCode)
        .populate('user', 'username email phone')
        .populate({
          path: 'showtime',
          populate: [
            { path: 'movie', select: 'title posterUrl duration rating' },
            { path: 'theater', select: 'name address' },
            { path: 'room', select: 'name type' },
          ],
        })
        .populate('concessions.concession', 'name price');
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy vé với mã này',
      });
    }

    // Chỉ trả về thông tin cần thiết để hiển thị, không lộ data nhạy cảm
    const ticketInfo = {
      ticketCode: booking.ticketCode,
      ticketStatus: booking.ticketStatus,
      paymentStatus: booking.paymentStatus,
      isCheckedIn: booking.isCheckedIn,
      checkedInAt: booking.checkedInAt,
      bookingDate: booking.bookingDate,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      paymentMethod: booking.paymentMethod,
      customer: {
        username: booking.user?.username,
        // Email ẩn 1 phần để bảo mật (abc@gmail.com → a**@gmail.com)
        email: booking.user?.email
          ? booking.user.email.replace(/(.{1}).+(@.+)/, '$1**$2')
          : null,
      },
      movie: {
        title: booking.showtime?.movie?.title,
        posterUrl: booking.showtime?.movie?.posterUrl,
        duration: booking.showtime?.movie?.duration,
        rating: booking.showtime?.movie?.rating,
      },
      showtime: {
        startTime: booking.showtime?.startTime,
        format: booking.showtime?.format,
        theater: booking.showtime?.theater?.name,
        room: booking.showtime?.room?.name,
        roomType: booking.showtime?.room?.type,
      },
      concessions: (booking.concessions || []).map(c => ({
        name: c.concession?.name,
        quantity: c.quantity,
      })).filter(c => c.name),
    };

    res.json({ success: true, data: ticketInfo });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingStatus,
  simulatePayment,
  cancelBooking,
  verifyTicket,
};
