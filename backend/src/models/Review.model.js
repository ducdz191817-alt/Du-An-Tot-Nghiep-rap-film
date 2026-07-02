const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    // Người dùng viết đánh giá
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Phim được đánh giá
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    // Số sao đánh giá (1 đến 5)
    rating: {
      type: Number,
      required: [true, 'Vui lòng chọn số sao đánh giá'],
      min: [1, 'Đánh giá tối thiểu 1 sao'],
      max: [5, 'Đánh giá tối đa 5 sao'],
    },
    // Nội dung bình luận
    comment: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung đánh giá'],
      trim: true,
      maxlength: [500, 'Bình luận không được vượt quá 500 ký tự'],
    },
    // Phản hồi từ admin
    adminReply: {
      comment: { type: String, trim: true, maxlength: 500 },
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      repliedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi người dùng chỉ được đánh giá mỗi phim 1 lần
ReviewSchema.index({ user: 1, movie: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
