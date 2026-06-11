const mongoose = require('mongoose');

// SCHEMA: Định nghĩa cấu trúc của bảng Ghế (Seat) trong Database MongoDB
const SeatSchema = new mongoose.Schema(
  {
    // Phòng chiếu chứa chiếc ghế này
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    // Hàng ghế (Ví dụ: 'A', 'B', 'C')
    row: {
      type: String, 
      required: true,
      trim: true,
    },
    // Số thứ tự của ghế trong hàng (Ví dụ: 1, 2, 3)
    number: {
      type: Number, 
      required: true,
    },
    // Loại ghế:standard (thường), vip, couple (ghế đôi)
    type: {
      type: String,
      enum: ['standard', 'vip', 'couple'],
      default: 'standard',
    },
    // Giá phụ thu của ghế (Ví dụ: VIP +20k, Couple +40k, thường +0k)
    price: {
      type: Number, 
      default: 0,
    },
    // Trạng thái ghế: true nếu ghế bị hỏng / khóa không cho khách đặt
    isDisabled: {
      type: Boolean, 
      default: false,
    },
  },
  {
    timestamps: true, // Tự động tạo trường createdAt và updatedAt lưu thời gian tạo/sửa bản ghi
  }
);

// CHỈ MỤC (Index): Đảm bảo tính duy nhất, không cho phép trùng lặp cùng một ghế (hàng + số) trong một phòng
SeatSchema.index({ room: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Seat', SeatSchema);
