const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a room name'],
      trim: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: true,
    },
    type: {
      type: String,
      default: '2D',
      trim: true,
      uppercase: true,
    },
    // Tham chiếu đến thực thể RoomType chi tiết (nếu có)
    roomTypeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
    },
    // Loại chất lượng phòng – dùng để tính phụ thu giá vé (standard, premium, dolby)
    roomType: {
      type: String,
      enum: ['standard', 'premium', 'dolby'],
      default: 'standard',
    },
    capacity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate room names in the same theater
RoomSchema.index({ name: 1, theater: 1 }, { unique: true });

module.exports = mongoose.model('Room', RoomSchema);
