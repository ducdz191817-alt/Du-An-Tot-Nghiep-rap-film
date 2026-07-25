const mongoose = require('mongoose');

/**
 * PricingConfig – Bảng cấu hình giá vé tự động (singleton)
 * Dùng Mixed type để tránh vấn đề với key số và key bắt đầu bằng số.
 */
const PricingConfigSchema = new mongoose.Schema(
  {
    // ── 1. Giá cơ bản theo loại ngày ──────────────────────────────────────
    basePrice: {
      weekday: { type: Number, default: 90000 },   // Thứ 2 – Thứ 5
      weekend: { type: Number, default: 120000 },  // Thứ 6 – Chủ nhật
      holiday: { type: Number, default: 180000 },  // Ngày lễ
    },

    // ── 2. Phụ thu theo thứ trong tuần (key: 'sun','mon',... để tránh key số) ─
    //   sun=0, mon=1, tue=2, wed=3, thu=4, fri=5, sat=6
    weekdaySurcharge: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        sun: 30000,   // Chủ nhật  (getDay() === 0)
        mon: 0,       // Thứ 2
        tue: 0,       // Thứ 3
        wed: 0,       // Thứ 4
        thu: 0,       // Thứ 5
        fri: 10000,   // Thứ 6
        sat: 30000,   // Thứ 7
      },
    },

    // ── 3. Phụ thu theo khung giờ ─────────────────────────────────────────
    timeSlotSurcharge: {
      morning:   { type: Number, default: 0 },       // 00:00 – 16:59
      evening:   { type: Number, default: 20000 },   // 17:00 – 21:59
      latenight: { type: Number, default: 10000 },   // 22:00 – 23:59
    },

    // ── 4. Phụ thu theo định dạng chiếu (Mixed để dùng key '2D','3D') ─────
    formatSurcharge: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        '2D':        0,
        '3D':        40000,
        'IMAX':      90000,
        'GOLDCLASS': 120000,
      },
    },

    // ── 5. Phụ thu theo loại phòng ────────────────────────────────────────
    roomTypeSurcharge: {
      standard: { type: Number, default: 0 },
      premium:  { type: Number, default: 20000 },
      dolby:    { type: Number, default: 50000 },
    },

    // ── 6. Phụ thu theo loại ghế ──────────────────────────────────────────
    seatTypeSurcharge: {
      standard: { type: Number, default: 0 },
      vip:      { type: Number, default: 30000 },
      couple:   { type: Number, default: 100000 },
    },

    // ── Danh sách ngày lễ (YYYY-MM-DD) ────────────────────────────────────
    holidays: {
      type: [String],
      default: [
        '2026-01-01',
        '2026-04-30',
        '2026-05-01',
        '2026-09-02',
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingConfig', PricingConfigSchema);
