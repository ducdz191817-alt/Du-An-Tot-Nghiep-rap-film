const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a movie title'],
      trim: true,
    },
    // English title (optional, falls back to title if not provided)
    titleEN: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Please provide a movie description'],
    },
    // English description (optional, falls back to description if not provided)
    descriptionEN: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Please provide movie duration in minutes'],
    },
    genre: {
      type: [String],
      required: [true, 'Please provide movie genres'],
    },
    language: {
      type: String,
      required: [true, 'Please provide movie language'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please provide release date'],
    },
    posterUrl: {
      type: String,
      required: [true, 'Please provide a poster URL'],
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'now-showing',    // Đang chiếu
        'coming-soon',    // Sắp chiếu
        'ended',          // Đã kết thúc (theo kế hoạch)
        'suspended',      // Tạm hoãn (hoãn phát hành hoặc tạm ngừng chiếu)
        'stopped',        // Ngừng chiếu (khác với đã kết thúc theo kế hoạch)
        'cancelled',      // Hủy phát hành (không ra rạp nữa)
        'pre-release',    // Sắp ra mắt (tách riêng với Sắp chiếu)
        'preview',        // Chiếu sớm / Preview (suất chiếu đặc biệt)
        'hidden',         // Bảo trì / Ẩn (dùng cho quản trị viên)
      ],
      default: 'now-showing',
    },
    rating: {
      type: String, // e.g. T16, T18, P, C13
      required: [true, 'Please provide content rating label (e.g. PG-13, R)'],
    },
    director: {
      type: String,
      default: '',
    },
    cast: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Movie', MovieSchema);
