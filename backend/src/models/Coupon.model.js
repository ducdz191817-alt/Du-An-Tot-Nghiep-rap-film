const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ─── Điều kiện đặc biệt ─────────────────────────────────────────────────
    conditions: {
      // Chỉ áp dụng vào các ngày trong tuần nhất định (0=CN, 1=T2, ..., 3=T4, 6=T7)
      daysOfWeek: { type: [Number], default: [] },
      // Chỉ áp dụng cuối tuần (Thứ 7 + Chủ Nhật)
      weekendOnly: { type: Boolean, default: false },
      // Chỉ áp dụng cho suất chiếu bắt đầu trước giờ này (VD: 12 = trước 12:00 trưa)
      maxShowtimeHour: { type: Number, default: null },
      // Số ghế tối thiểu trong đơn
      minSeats: { type: Number, default: null },
      // Chỉ áp dụng cho lần đặt vé đầu tiên của user
      firstBookingOnly: { type: Boolean, default: false },
      // Chỉ áp dụng trong tháng sinh nhật của user
      birthMonthOnly: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coupon', CouponSchema);
