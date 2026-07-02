const Review = require('../models/Review.model');
const Movie = require('../models/Movie.model');

// @desc    Tạo đánh giá mới cho phim
// @route   POST /api/reviews
// @access  Private (chỉ role "user")
const createReview = async (req, res, next) => {
  try {
    const { movieId, rating, comment } = req.body;
    const userId = req.user._id;

    // Chỉ cho phép role "user" đánh giá (admin không được đánh giá)
    if (req.user.role !== 'user') {
      res.status(403);
      throw new Error('Chỉ tài khoản người dùng (user) mới có thể đánh giá phim');
    }

    // Kiểm tra phim có tồn tại không
    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404);
      throw new Error('Phim không tồn tại');
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await Review.findOne({ user: userId, movie: movieId });
    if (existingReview) {
      res.status(400);
      throw new Error('Bạn đã đánh giá phim này rồi. Hãy chỉnh sửa đánh giá hiện tại.');
    }

    // Tạo đánh giá
    const review = await Review.create({
      user: userId,
      movie: movieId,
      rating,
      comment,
    });

    // Populate user info để trả về
    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'username email avatar'
    );

    res.status(201).json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tất cả đánh giá của một phim
// @route   GET /api/reviews/movie/:movieId
// @access  Public
const getReviewsByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    const reviews = await Review.find({ movie: movieId })
      .populate('user', 'username email avatar')
      .populate('adminReply.repliedBy', 'username email avatar')
      .sort({ createdAt: -1 });

    // Tính điểm trung bình
    const totalRatings = reviews.length;
    const averageRating =
      totalRatings > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
        : 0;

    res.json({
      success: true,
      count: totalRatings,
      averageRating: parseFloat(averageRating),
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật đánh giá của mình
// @route   PUT /api/reviews/:id
// @access  Private (chỉ chủ sở hữu)
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    // Chỉ cho phép chủ sở hữu chỉnh sửa
    if (review.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username email avatar')
      .populate('adminReply.repliedBy', 'username email avatar');

    res.json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa đánh giá của mình
// @route   DELETE /api/reviews/:id
// @access  Private (chủ sở hữu hoặc admin)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    // Cho phép chủ sở hữu hoặc admin xóa
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Bạn không có quyền xóa đánh giá này');
    }

    await review.deleteOne();

    res.json({
      success: true,
      message: 'Đã xóa đánh giá thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin phản hồi đánh giá phim
// @route   POST /api/reviews/:id/reply
// @access  Private (chỉ admin)
const replyReview = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const reviewId = req.params.id;

    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Chỉ tài khoản admin mới có thể phản hồi đánh giá');
    }

    if (!comment || !comment.trim()) {
      res.status(400);
      throw new Error('Vui lòng nhập nội dung phản hồi');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    review.adminReply = {
      comment: comment.trim(),
      repliedBy: req.user._id,
      repliedAt: new Date(),
    };

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username email avatar')
      .populate('adminReply.repliedBy', 'username email avatar');

    res.json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin xóa phản hồi đánh giá phim
// @route   DELETE /api/reviews/:id/reply
// @access  Private (chỉ admin)
const deleteReply = async (req, res, next) => {
  try {
    const reviewId = req.params.id;

    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Chỉ tài khoản admin mới có thể xóa phản hồi');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    review.adminReply = undefined;
    await review.save();

    res.json({
      success: true,
      message: 'Đã xóa phản hồi thành công',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviewsByMovie,
  updateReview,
  deleteReview,
  replyReview,
  deleteReply,
};
