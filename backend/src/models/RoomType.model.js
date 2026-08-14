const mongoose = require('mongoose');

// SCHEMA: Quản lý Danh mục Loại phòng chiếu & Bảng giá vé từng loại ghế theo loại phòng
const RoomTypeSchema = new mongoose.Schema(
  {
    // Tên hiển thị của loại phòng (Ví dụ: "Phòng chiếu 2D Tiêu Chuẩn", "Phòng Chiếu 3D Digital", "IMAX Laser")
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên loại phòng chiếu'],
      trim: true,
    },
    // Mã định danh loại phòng (Ví dụ: "2D", "3D", "IMAX", "GOLDCLASS", "4DX", "SCREENX")
    code: {
      type: String,
      required: [true, 'Vui lòng nhập mã loại phòng'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Mô tả chi tiết về công nghệ âm thanh, màn chiếu, trải nghiệm
    description: {
      type: String,
      default: '',
      trim: true,
    },
    // Danh sách các loại ghế được phép tạo trong loại phòng này
    // Ví dụ: Phòng Sweetbox chỉ cho phép ['couple'], phòng 2D cho phép ['standard', 'vip', 'couple']
    allowedSeatTypes: {
      type: [String],
      enum: ['standard', 'vip', 'couple'],
      default: ['standard', 'vip', 'couple'],
    },
    // Bảng giá vé quy định cho từng loại ghế của loại phòng này
    seatPrices: {
      // Giá vé ghế thường (standard)
      standard: {
        type: Number,
        default: 100000,
        min: 0,
      },
      // Giá vé ghế VIP
      vip: {
        type: Number,
        default: 150000,
        min: 0,
      },
      // Giá vé ghế Đôi (Couple / Sweetbox)
      couple: {
        type: Number,
        default: 300000,
        min: 0,
      },
    },
    // Trạng thái hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RoomType', RoomTypeSchema);
