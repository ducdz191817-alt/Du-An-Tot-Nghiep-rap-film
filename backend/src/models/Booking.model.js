const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
    },
    seats: {
      type: [String], // Array of seat codes, e.g., ['A1', 'A2']
      required: true,
    },
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
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
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
    // ── QUẢN LÝ TRẠNG THÁI VÉ & IN VÉ ──────────────────────────────────────
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

// Pre-save hook để tự động sinh ticketCode dạng TKT-YYMMDD-XXXX nếu chưa có
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
