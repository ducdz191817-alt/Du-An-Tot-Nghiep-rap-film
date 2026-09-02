/**
 * CONTROLLER: booking.controller.js — Xử lý đặt vé (Backend)
 * - Là chốt chặn bảo mật cuối cùng: Validate số lượng ghế (tối đa 8) và lỗi ghế mồ côi.
 * - API chính: POST /api/bookings -> createBooking
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking.model');
const Showtime = require('../models/Showtime.model');
const Seat = require('../models/Seat.model');
const Concession = require('../models/Concession.model');
const Payment = require('../models/Payment.model');
const sendEmail = require('../utils/sendEmail');
const QRCode = require('qrcode');
const { checkAndExpirePendingBookings } = require('../utils/bookingCleanup');
const { confirmBookingClearHolds, getConflictingHeldSeats } = require('../sockets/seatSocket');

/**
 * @desc    Tạo đơn đặt vé xem phim mới và khởi tạo thanh toán
 * @route   POST /api/bookings
 * @access  Private (Khách hàng đã đăng nhập)
 */
const createBooking = async (req, res, next) => {
  try {
    // 0. Kiểm tra và giải phóng ghế quá hạn trước khi tiến hành tạo đặt vé
    await checkAndExpirePendingBookings();
    const { showtimeId, seats, concessions = [], paymentMethod = 'card', couponCode } = req.body;
    const userId = req.user._id;

    // Kiểm tra đã chọn ít nhất 1 ghế chưa
    if (!seats || seats.length === 0) {
      res.status(400);
      throw new Error('Vui lòng chọn ít nhất một ghế');
    }

    // Giới hạn tối đa 8 ghế mỗi đơn hàng
    const MAX_SEATS_PER_BOOKING = 8;
    if (seats.length > MAX_SEATS_PER_BOOKING) {
      res.status(400);
      throw new Error(`Bạn chỉ được đặt tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi giao dịch. Bạn đang cố đặt ${seats.length} ghế.`);
    }

    // 1. Kiểm tra suất chiếu có tồn tại không
    const showtime = await Showtime.findById(showtimeId)
      .populate('movie')
      .populate('theater')
      .populate('room');

    if (!showtime) {
      res.status(404);
      throw new Error('Không tìm thấy suất chiếu');
    }

    // Kiểm tra xem rạp chiếu có đang tạm dừng hoạt động hay không
    if (showtime.theater && showtime.theater.isActive === false) {
      res.status(400);
      throw new Error(`⚠️ Rạp chiếu "${showtime.theater.name}" hiện đang tạm ngưng hoạt động (Inactive). Không thể thực hiện đặt vé tại rạp này.`);
    }

    // 1.5 KIỂM TRA ĐỘ TUỔI CỦA NGƯỜI DÙNG DỰA TRÊN PHÂN LOẠI PHIM (P, T13, T16, T18)
    const movieRating = showtime.movie.rating;
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

    // ==========================================
    // VALIDATION: KIỂM TRA LUẬT GHẾ MỒ CÔI (ORPHAN SEAT RULE) Ở BACKEND
    // ==========================================
    // Ngăn chặn user bypass client-side validation bằng Postman/DevTools
    const allBookedAndSelected = new Set([
      ...(showtime.bookedSeats || []).map(s => String(s).trim().toUpperCase()),
      ...normalizedSeats,
    ]);

    // Nhóm ghế theo hàng
    const seatsByRow = {};
    roomSeats.forEach(s => {
      if (!seatsByRow[s.row]) seatsByRow[s.row] = [];
      seatsByRow[s.row].push(s);
    });

    // Chỉ kiểm tra các hàng có ghế user đang đặt
    const affectedRows = new Set(normalizedSeats.map(sc => sc.match(/^([A-Z]+)/)?.[1]).filter(Boolean));

    for (const rowLetter of affectedRows) {
      const rowSeatsArr = (seatsByRow[rowLetter] || [])
        .filter(s => !s.isDisabled)
        .sort((a, b) => a.number - b.number);

      if (rowSeatsArr.length <= 2) continue; // Hàng quá ngắn, bỏ qua

      // Chia hàng thành 2 block (lối đi ở giữa)
      const aislePos = Math.floor(rowSeatsArr.length / 2);
      const blocks = rowSeatsArr.length <= 4
        ? [rowSeatsArr]
        : [rowSeatsArr.slice(0, aislePos), rowSeatsArr.slice(aislePos)];

      for (const block of blocks) {
        // Tạo mảng trạng thái: true = occupied (đã đặt/đang chọn), false = trống
        const stateArr = block.map(s => {
          const code = `${s.row}${s.number}`.toUpperCase();
          return allBookedAndSelected.has(code);
        });

        // Tìm khoảng trống liên tiếp
        let gapLen = 0;
        for (let i = 0; i < stateArr.length; i++) {
          if (!stateArr[i]) {
            gapLen++;
          } else {
            if (gapLen === 1) {
              // Có đúng 1 ghế trống giữa 2 ghế occupied -> orphan
              // Kiểm tra xem orphan này có phải do user tạo ra không
              // (so sánh với trạng thái chỉ có bookedSeats, không có selectedSeats)
              const stateWithoutSelection = block.map(s => {
                const code = `${s.row}${s.number}`.toUpperCase();
                return bookedSeatSet.has(code);
              });
              let oldGap = 0;
              let hadOldOrphan = false;
              for (let j = 0; j < stateWithoutSelection.length; j++) {
                if (!stateWithoutSelection[j]) { oldGap++; }
                else {
                  if (oldGap === 1) hadOldOrphan = true;
                  oldGap = 0;
                }
              }
              // Nếu orphan mới mà trước đó không có -> user tạo ra -> chặn
              if (!hadOldOrphan) {
                res.status(400);
                throw new Error(`Vị trí ghế bạn chọn ở hàng ${rowLetter} đang để trống 1 ghế lẻ (ghế mồ côi). Vui lòng chọn lại để không có khoảng trống 1 ghế.`);
              }
            }
            gapLen = 0;
          }
        }
      }
    }


    const seatDetails = [];
    for (const seatCode of seats) {
      // Tách mã ghế ví dụ: "A12" thành hàng "A" và số "12"
      const match = seatCode.match(/^([A-Z]+)(\d+)$/);
      let seatType = showtime.room?.type === 'SWEETBOX' ? 'couple' : 'standard';
      let extraPrice = 0;
      let singleSeatTotal = showtime.ticketPrice;

      if (match) {
        const row = match[1];
        const number = parseInt(match[2], 10);
        
        // Tìm thông tin ghế chi tiết tương ứng trong cơ sở dữ liệu
        const seatDoc = roomSeats.find((s) => s.row === row && s.number === number);
        if (seatDoc) {
          // BẢO MẬT: Kiểm tra xem ghế này có đang bị admin khóa/vô hiệu hóa hay không
          if (seatDoc.isDisabled) {
            res.status(400);
            throw new Error(`Ghế ${seatCode} hiện đang bảo trì và không thể đặt.`);
          }

          seatType = seatDoc.type || seatType;
          extraPrice = seatDoc.price || 0;

          // ==========================================
          // FIX BUG 2: TÍNH TIỀN GHẾ ĐÔI (SWEETBOX) Ở BACKEND
          // ==========================================
          if (seatType === 'couple') {
            singleSeatTotal = (showtime.ticketPrice * 2) + extraPrice;
          } else {
            singleSeatTotal = showtime.ticketPrice + extraPrice;
          }
        } else {
          if (seatType === 'couple') {
            singleSeatTotal = (showtime.ticketPrice * 2);
          }
        }
      }

      seatPriceSum += singleSeatTotal;
      seatDetails.push({
        seatCode,
        type: seatType,
        price: singleSeatTotal,
        extraPrice,
      });
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
    const generatedTicketCode = `TKT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const booking = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats: normalizedSeats,
      seatDetails,
      concessions: concessions.map((c) => ({
        concession: c.concessionId,
        quantity: c.quantity,
      })),
      totalPrice,
      paymentStatus: isPendingPayment ? 'pending' : 'paid',
      paymentMethod,
      coupon: couponId,
      discountAmount,
      movieTitle: showtime.movie?.title || '',
      moviePosterUrl: showtime.movie?.posterUrl || '',
      ticketCode: generatedTicketCode,
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

    if (isPendingPayment) {
      if (isVietQR) {
        // 9. VietQR logic
        const bankId = process.env.VIETQR_BANK_ID || 'MB';
        const accountNo = process.env.VIETQR_ACCOUNT_NO || '5725042006';
        const accountName = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN VAN VIET DUC';
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

      // Đối với MoMo, VNPay hoặc các phương thức chờ thanh toán khác:
      // Trả về kết quả ngay và CHƯA gửi email xác nhận cho đến khi thanh toán hoàn tất (paid)
      return res.status(201).json({
        success: true,
        data: {
          booking,
          payment,
        },
      });
    }

    // 9. Re-fetch booking để lấy ticketCode vừa được sinh ra bởi pre-save hook (cho các trường hợp thanh toán trực tiếp/cash)
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
    const qrBuffer = await QRCode.toBuffer(String(ticketCode), { width: 180, margin: 1 });

    const emailContentHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #222; border-radius: 16px; padding: 25px; background-color: #13131c; color: #e4e4e7;">
        <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #a855f7; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Nova Cinema</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin: 5px 0 0 0;">Vé Xem Phim Của Bạn Đã Sẵn Sàng!</p>
        </div>

        <p>Xin chào <strong>${req.user.username}</strong>,</p>
        <p>Cảm ơn bạn đã lựa chọn Nova Cinema. Đặt vé và thanh toán của bạn đã hoàn tất thành công. Dưới đây là thông tin chi tiết:</p>

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

        <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Mã QR Vé Điện Tử (Check-in Quầy)</p>
          <div style="background-color: #ffffff; padding: 12px; border-radius: 12px; display: inline-block; border: 1px solid #e2e8f0;">
            <img src="cid:ticket_qr_code" alt="Ticket QR Code" width="180" height="180" style="display: block; margin: 0 auto; border: 0;" />
          </div>
        </div>

        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
          * <strong>Lưu ý:</strong> Vui lòng xuất trình mã vé <strong>${ticketCode}</strong> hoặc QR Code này cho nhân viên soát vé khi vào rạp. Mã vé có thể được nhập tay tại quầy nếu không quét được QR.
        </p>

        <div style="text-align: center; border-top: 1px solid #27272a; margin-top: 25px; padding-top: 15px; font-size: 11px; color: #71717a;">
          Email này được gửi tự động bởi hệ thống đặt vé Nova Cinema. Vui lòng không trả lời trực tiếp email này.
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: req.user.email,
        subject: `[Nova Cinema] Xác nhận đặt vé thành công - ${showtime.movie.title}`,
        html: emailContentHtml,
        attachments: [
          {
            filename: 'ticket-qr.png',
            content: qrBuffer,
            cid: 'ticket_qr_code',
          },
        ],
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

/**
 * @desc    Lấy danh sách lịch sử đặt vé của người dùng đang đăng nhập
 * @route   GET /api/bookings/my
 * @access  Private (Yêu cầu Token)
 */
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
      .populate('coupon')
      .sort({ bookingDate: -1 });

    // Tự động bổ sung snapshot movieTitle và seatDetails cho các đơn vé cũ nếu thiếu
    for (const b of bookings) {
      let needsSave = false;
      if (!b.movieTitle && b.showtime?.movie?.title) {
        b.movieTitle = b.showtime.movie.title;
        b.moviePosterUrl = b.showtime.movie.posterUrl || '';
        needsSave = true;
      }
      if (!b.seatDetails || b.seatDetails.length === 0) {
        const showtime = b.showtime;
        const roomId = showtime?.room?._id || showtime?.room;
        const isSweetbox = showtime?.room?.type === 'SWEETBOX';
        const roomSeats = roomId ? await Seat.find({ room: roomId }) : [];
        const basePrice = showtime?.ticketPrice || showtime?.price || 0;

        b.seatDetails = (b.seats || []).map((seatCode) => {
          const match = seatCode.match(/^([A-Z]+)(\d+)$/);
          let type = isSweetbox ? 'couple' : 'standard';
          let extraPrice = 0;
          let multiplier = type === 'couple' ? 2 : 1;

          if (match) {
            const r = match[1];
            const n = parseInt(match[2], 10);
            const found = roomSeats.find((s) => s.row === r && s.number === n);
            if (found) {
              type = found.type || type;
              extraPrice = found.price || 0;
              multiplier = type === 'couple' ? 2 : 1;
            }
          }

          const price = (basePrice * multiplier) + extraPrice;
          return {
            seatCode,
            type,
            price,
            extraPrice,
          };
        });
        needsSave = true;
      }
      if (needsSave) {
        await b.save();
      }
    }

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết một đơn đặt vé theo ID
 * @route   GET /api/bookings/:id
 * @access  Private (Chính chủ đơn vé hoặc Admin)
 */
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
      })
      .populate('coupon');

    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy đơn đặt vé');
    }

    // Tự động điền chi tiết ghế seatDetails nếu chưa có
    if (!booking.seatDetails || booking.seatDetails.length === 0) {
      const showtime = booking.showtime;
      const roomId = showtime?.room?._id || showtime?.room;
      const isSweetbox = showtime?.room?.type === 'SWEETBOX';
      const roomSeats = roomId ? await Seat.find({ room: roomId }) : [];
      const basePrice = showtime?.ticketPrice || showtime?.price || 0;

      booking.seatDetails = (booking.seats || []).map((seatCode) => {
        const match = seatCode.match(/^([A-Z]+)(\d+)$/);
        let type = isSweetbox ? 'couple' : 'standard';
        let extraPrice = 0;
        let multiplier = type === 'couple' ? 2 : 1;

        if (match) {
          const r = match[1];
          const n = parseInt(match[2], 10);
          const found = roomSeats.find((s) => s.row === r && s.number === n);
          if (found) {
            type = found.type || type;
            extraPrice = found.price || 0;
            multiplier = type === 'couple' ? 2 : 1;
          }
        }

        const price = (basePrice * multiplier) + extraPrice;
        return {
          seatCode,
          type,
          price,
          extraPrice,
        };
      });
      await booking.save();
    }

    // Kiểm tra quyền sở hữu đơn đặt vé
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Bạn không có quyền truy cập vào thông tin đơn đặt vé này');
    }

    // Lấy thông tin giao dịch thanh toán kèm theo
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

/**
 * @desc    Lấy trạng thái thanh toán hiện tại của một đơn đặt vé
 * @route   GET /api/bookings/:id/status
 * @access  Private (Chính chủ hoặc Admin)
 */
const getBookingStatus = async (req, res, next) => {
  try {
    await checkAndExpirePendingBookings();
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy đơn đặt vé');
    }
    
    // Kiểm tra quyền sở hữu
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Bạn không có quyền truy cập đơn đặt vé này');
    }

    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mô phỏng thanh toán thành công (Chuyển trạng thái sang paid & Gửi Email vé điện tử)
 * @route   POST /api/bookings/:id/simulate-pay
 * @access  Private (Chính chủ hoặc Admin)
 */
const simulatePayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'showtime',
        populate: [{ path: 'movie' }, { path: 'theater' }, { path: 'room' }]
      });

    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy đơn đặt vé');
    }

    // Kiểm tra quyền truy cập
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Bạn không có quyền thao tác trên đơn đặt vé này');
    }

    if (booking.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Đơn đặt vé này đã được thanh toán trước đó',
        data: booking,
      });
    }

    // 1. Cập nhật trạng thái thanh toán của Booking thành 'paid'
    booking.paymentStatus = 'paid';
    await booking.save();

    // 2. Cập nhật trạng thái giao dịch trong Payment model
    const payment = await Payment.findOne({ booking: booking._id });
    if (payment) {
      payment.status = 'completed';
      await payment.save();
    }

    // 3. Lấy lại vé để trích xuất mã ticketCode
    const savedBooking = await Booking.findById(booking._id);
    const ticketCode = savedBooking.ticketCode;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const verifyUrl = `${appUrl}/ticket/${ticketCode}`;
    const qrBuffer = await QRCode.toBuffer(String(ticketCode), { width: 180, margin: 1 });

    // 4. Xây dựng nội dung Email xác nhận vé xem phim
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
          <h2 style="color: #a855f7; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Nova Cinema</h2>
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

        <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Mã QR Vé Điện Tử (Check-in Quầy)</p>
          <div style="background-color: #ffffff; padding: 12px; border-radius: 12px; display: inline-block; border: 1px solid #e2e8f0;">
            <img src="cid:ticket_qr_code" alt="Ticket QR Code" width="180" height="180" style="display: block; margin: 0 auto; border: 0;" />
          </div>
        </div>

        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
          * <strong>Lưu ý:</strong> Xuất trình mã vé <strong>${ticketCode}</strong> hoặc QR Code khi vào rạp.
        </p>

        <div style="text-align: center; border-top: 1px solid #27272a; margin-top: 25px; padding-top: 15px; font-size: 11px; color: #71717a;">
          Email này được gửi tự động bởi hệ thống đặt vé Nova Cinema.
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: req.user.email,
        subject: `[Nova Cinema] Xác nhận đặt vé thành công - ${booking.showtime.movie.title}`,
        html: emailContentHtml,
        attachments: [
          {
            filename: 'ticket-qr.png',
            content: qrBuffer,
            cid: 'ticket_qr_code',
          },
        ],
      });
    } catch (emailErr) {
      console.error('Lỗi gửi email xác nhận:', emailErr);
    }

    res.json({
      success: true,
      message: 'Đã mô phỏng thanh toán thành công và xác nhận đặt vé',
      data: savedBooking || booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hủy đơn đặt vé ở trạng thái chờ (pending), giải phóng các ghế đã chọn trong suất chiếu
 * @route   DELETE /api/bookings/:id/cancel
 * @access  Private (Chính chủ hoặc Admin)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy đơn đặt vé');
    }

    // Kiểm tra quyền hủy
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Bạn không có quyền thao tác trên đơn này');
    }

    if (booking.paymentStatus !== 'pending') {
      res.status(400);
      throw new Error('Chỉ có thể hủy đơn đặt vé đang ở trạng thái chờ thanh toán (pending)');
    }

    // 1. Trả lại danh sách ghế đã giữ trong suất chiếu
    await Showtime.findByIdAndUpdate(booking.showtime, {
      $pull: { bookedSeats: { $in: booking.seats } },
    });

    // 2. Chuyển trạng thái đơn và giao dịch sang thất bại/hủy
    booking.paymentStatus = 'failed';
    await booking.save();

    await Payment.findOneAndUpdate(
      { booking: booking._id },
      { status: 'failed' }
    );

    res.json({
      success: true,
      message: 'Hủy đơn đặt vé thành công và đã giải phóng ghế',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xác thực thông tin vé qua mã ticketCode (Công khai - Dùng cho tính năng quét mã QR check-in tại rạp)
 * @route   GET /api/bookings/verify/:ticketCode
 * @access  Public
 */
const verifyTicket = async (req, res, next) => {
  try {
    const rawCode = req.params.ticketCode;
    if (!rawCode) {
      return res.status(400).json({ success: false, error: 'Thiếu mã vé' });
    }

    const cleanCode = decodeURIComponent(rawCode).trim().toUpperCase();
    const normalizedCode = cleanCode.replace(/\s+/g, '-');
    const flexPattern = new RegExp('^' + cleanCode.replace(/[\s-]+/g, '[-_\\s]?') + '$', 'i');

    const orConditions = [
      { ticketCode: cleanCode },
      { ticketCode: normalizedCode },
      { ticketCode: flexPattern },
    ];

    // Nếu mã vé là ObjectId MongoDB 24 ký tự
    if (mongoose.Types.ObjectId.isValid(rawCode.trim()) && rawCode.trim().length === 24) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(rawCode.trim()) });
    }

    // 1. Tìm đơn đặt vé theo mã ticketCode hoặc ObjectId
    let booking = await Booking.findOne({ $or: orConditions })
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

    // 2. Nếu chưa thấy, áp dụng thuật toán so khớp mềm (Flexible matching)
    if (!booking) {
      const allBookings = await Booking.find({})
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

      const upperCode = cleanCode;
      const strippedCode = upperCode.replace(/[^A-Z0-9]/g, '');

      booking = allBookings.find((b) => {
        const bIdFull = b._id.toString().toUpperCase();
        const bIdLast10 = bIdFull.slice(-10);
        const bIdCleanLast10 = bIdFull.replace(/[^A-Z0-9]/g, '').slice(-10);
        const bCode = (b.ticketCode || '').toUpperCase();
        const bCodeClean = bCode.replace(/[^A-Z0-9]/g, '');

        return (
          bCode === upperCode ||
          bCodeClean === strippedCode ||
          bIdFull === upperCode ||
          bIdLast10 === upperCode ||
          bIdCleanLast10 === strippedCode ||
          (bCode && bCode.endsWith(upperCode)) ||
          (bCodeClean && bCodeClean.endsWith(strippedCode)) ||
          (upperCode.length >= 4 && bCode.includes(upperCode)) ||
          (upperCode.length >= 4 && bIdFull.endsWith(upperCode))
        );
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy vé với mã này',
      });
    }

    // 3. Chuẩn hóa dữ liệu hiển thị vé, che giấu bớt thông tin nhạy cảm của khách hàng
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
        // Che mờ Email bảo mật (abc@gmail.com -> a**@gmail.com)
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

