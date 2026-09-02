/**
 * TẦNG DỮ LIỆU (MODEL): Booking.model.js
 * Nhiệm vụ: Định nghĩa cấu trúc bản ghi "Vé xem phim" (Hóa đơn) lưu trong Database (MongoDB).
 * Bản ghi này chứa mọi thông tin: Ai đặt, phim gì, ghế nào, tổng tiền, mã vé QR code.
 */
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    // Liên kết (Tham chiếu) tới bảng User: Ai là người mua cái vé này?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Liên kết tới bảng Suất Chiếu: Khách mua vé suất nào?
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
    },
    // Mảng chứa các mã ghế đã mua (Ví dụ: ["A1", "A2", "A3"])
    seats: {
      type: [String], // Array of seat codes, e.g., ['A1', 'A2']
      required: true,
    },
    seatDetails: [
      {
        seatCode: { type: String, required: true },
        type: {
          type: String,
          enum: ['standard', 'vip', 'couple'],
          default: 'standard',
        },
        price: { type: Number, default: 0 },
        extraPrice: { type: Number, default: 0 },
      },
    ],
    concessions: [
      {
        concession: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Concession',
        },
        quantity: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Tổng số tiền khách hàng phải trả (Đã cộng dồn ghế, bắp nước và trừ khuyến mãi)
    totalPrice: {
      type: Number,
      required: true,
    },
    // Trạng thái hóa đơn (pending = đang chờ thanh toán, paid = thanh toán thành công)
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    // Khách hàng chọn trả bằng cổng nào? (Ví dụ: vnpay, vietqr)
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'vnpay', 'momo', 'vietqr'],
      default: 'card',
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    // ── BẢO TOÀN LỊCH SỬ DỮ LIỆU (SNAPSHOT) ─────────────────────────
    // Dù sau này Admin có xóa bộ phim khỏi Rạp, thì trong lịch sử vé của khách 
    // vẫn còn lưu giữ lại cái tên phim này (Bảo toàn dữ liệu vĩnh viễn).
    movieTitle: {
      type: String,
      default: '',
    },
    moviePosterUrl: {
      type: String,
      default: '',
    },
    // ── QUẢN LÝ MÃ QR & TRẠNG THÁI CHECK-IN TẠI RẠP ──────────────────────
    ticketCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    ticketStatus: {
      type: String,
      enum: ['issued', 'checked_in', 'cancelled', 'pending'],
      default: 'issued',
    },
    isPrinted: {
      type: Boolean,
      default: false,
    },
    printCount: {
      type: Number,
      default: 0,
    },
    printedAt: {
      type: Date,
    },
    printLogs: [
      {
        printedAt: { type: Date, default: Date.now },
        staffName: { type: String, default: 'Admin Cinema' },
        device: { type: String, default: 'PC-01' },
      },
    ],
    isCheckedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: String,
      default: 'Admin Cinema',
    },
    channel: {
      type: String,
      default: 'Website',
    },
  },
  {
    timestamps: true,
  }
);

// HOOK TỰ ĐỘNG (Pre-save hook): 
// Mỗi khi chuẩn bị lưu cái vé này vào Database, hệ thống sẽ tự động gọi hàm này
// để sinh ra một mã vé ngẫu nhiên (dùng để quét mã QR) ví dụ như: TKT-240902-8F9D.
BookingSchema.pre('save', function (next) {
  if (!this.ticketCode) {
    const d = this.bookingDate || new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const suffix = this._id ? String(this._id).slice(-4).toUpperCase() : String(rand);
    this.ticketCode = `TKT-${yy}${mm}${dd}-${suffix}`;
  }
  // Đồng bộ ticketStatus theo paymentStatus nếu là 'pending'
  if (this.paymentStatus === 'pending') {
    this.ticketStatus = 'pending';
  } else if (this.paymentStatus === 'paid' && this.ticketStatus === 'pending') {
    this.ticketStatus = 'issued';
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
