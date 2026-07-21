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
      enum: ['2D', '3D', 'IMAX', 'GOLDCLASS'],
      default: '2D',
    },
    // Loại chất lượng phòng – dùng để tính phụ thu giá vé
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
