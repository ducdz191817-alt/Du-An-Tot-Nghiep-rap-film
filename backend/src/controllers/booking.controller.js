const Booking = require('../models/Booking.model');
const Showtime = require('../models/Showtime.model');
const Seat = require('../models/Seat.model');
const Concession = require('../models/Concession.model');
const Payment = require('../models/Payment.model');
const sendEmail = require('../utils/sendEmail');

// @desc    Create a new booking and process payment
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  try {
    const { showtimeId, seats, concessions = [], paymentMethod = 'card' } = req.body;
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

    // 2. Check if showtime has already passed
    if (new Date(showtime.startTime) < new Date()) {
      res.status(400);
      throw new Error('Cannot book tickets for a past showtime');
    }

    // 3. KIỂM TRA: Xem ghế khách hàng chọn đã được đặt trước đó chưa
    const alreadyBooked = seats.some((seat) => showtime.bookedSeats.includes(seat));
    if (alreadyBooked) {
      res.status(400);
      throw new Error('Một hoặc nhiều ghế bạn chọn đã được đặt trước đó');
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

          // Tổng tiền = Giá vé gốc của lịch chiếu + Phụ thu riêng của loại ghế đó (VIP/Sweetbox)
          seatPriceSum += showtime.ticketPrice + seatDetail.price;
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

    const totalPrice = seatPriceSum + concessionPriceSum;

    // 6. Register/Book the seats in the Showtime document
    showtime.bookedSeats.push(...seats);
    await showtime.save();

    // 7. Create the Booking
    const booking = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats,
      concessions: concessions.map((c) => ({
        concession: c.concessionId,
        quantity: c.quantity,
      })),
      totalPrice,
      paymentStatus: 'paid', // Mark paid immediately for mock checkout flow
      paymentMethod,
    });

    // 8. Create Payment Transaction
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await Payment.create({
      booking: booking._id,
      paymentMethod,
      transactionId,
      amount: totalPrice,
      status: 'completed',
    });

    // 9. Send Confirmation Email
    const dateFormatted = new Date(showtime.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatted = new Date(showtime.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailContentHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #e50914; text-align: center;">Ticket Booking Confirmation</h2>
        <p>Dear ${req.user.username},</p>
        <p>Thank you for booking with us! Your ticket is confirmed. Details below:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #333;">${showtime.movie.title}</h3>
          <p><strong>Theater:</strong> ${showtime.theater.name}</p>
          <p><strong>Hall / Room:</strong> ${showtime.room.name} (${showtime.format})</p>
          <p><strong>Date:</strong> ${dateFormatted}</p>
          <p><strong>Time:</strong> ${timeFormatted}</p>
          <p><strong>Seats Booked:</strong> ${seats.join(', ')}</p>
        </div>

        ${concessionItems.length > 0 ? `
          <div style="margin: 15px 0;">
            <h4 style="margin-bottom: 5px; color: #333;">Concessions Selected:</h4>
            <ul style="padding-left: 20px;">
              ${concessionItems.map((item) => `<li>${item.name} x ${item.quantity} (${(item.price * item.quantity).toLocaleString()} VND)</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="border-top: 2px dashed #e0e0e0; padding-top: 15px; margin-top: 15px;">
          <p style="font-size: 16px;"><strong>Total Price Paid:</strong> <span style="color: #e50914; font-size: 18px; font-weight: bold;">${totalPrice.toLocaleString()} VND</span></p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
        </div>

        <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">Please show this email code at the ticket counter to claim your popcorn or enter the hall. Enjoy your movie!</p>
      </div>
    `;

    await sendEmail({
      to: req.user.email,
      subject: `Movie Ticket Confirmation: ${showtime.movie.title}`,
      html: emailContentHtml,
    });

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

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
};
