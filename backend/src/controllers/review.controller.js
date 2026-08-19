const Review = require('../models/Review.model');
const Movie = require('../models/Movie.model');
const Booking = require('../models/Booking.model');
const Showtime = require('../models/Showtime.model');

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

    // RÀNG BUỘC: Kiểm tra tài khoản đã từng đặt vé & thanh toán cho phim này chưa
    const showtimes = await Showtime.find({ movie: movieId }).select('_id endTime');
    const showtimeIds = showtimes.map((st) => st._id);

    const hasPaidBooking = await Booking.findOne({
      user: userId,
      showtime: { $in: showtimeIds },
      paymentStatus: 'paid',
    });

    if (!hasPaidBooking) {
      res.status(403);
      throw new Error('Chỉ tài khoản đã đặt vé xem phim này thành công mới có thể viết đánh giá.');
    }

    // RÀNG BUỘC BỔ SUNG: Kiểm tra suất chiếu đã kết thúc chưa (phải xem xong mới được đánh giá)
    const bookedShowtime = showtimes.find(
      (st) => st._id.toString() === hasPaidBooking.showtime.toString()
    );
    if (bookedShowtime && bookedShowtime.endTime > new Date()) {
      res.status(403);
      throw new Error('Bạn chỉ có thể đánh giá sau khi suất chiếu kết thúc. Vui lòng quay lại sau khi xem phim.');
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

// @desc    Kiểm tra xem người dùng hiện tại có đủ điều kiện đánh giá phim hay không (đã mua vé thành công)
// @route   GET /api/reviews/check-eligibility/:movieId
// @access  Private (chỉ role "user")
const checkEligibility = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    if (req.user.role !== 'user') {
      return res.json({ success: true, canReview: false, reason: 'not_user' });
    }

    // Tìm các suất chiếu của phim này
    const showtimes = await Showtime.find({ movie: movieId }).select('_id endTime');
    const showtimeIds = showtimes.map((st) => st._id);

    // Kiểm tra có đơn đặt vé nào đã thanh toán thành công không
    const hasPaidBooking = await Booking.findOne({
      user: userId,
      showtime: { $in: showtimeIds },
      paymentStatus: 'paid',
    });

    // Kiểm tra suất chiếu đã kết thúc chưa (phải xem xong mới được đánh giá)
    let hasWatched = false;
    if (hasPaidBooking) {
      const bookedShowtime = showtimes.find(
        (st) => st._id.toString() === hasPaidBooking.showtime.toString()
      );
      hasWatched = bookedShowtime ? bookedShowtime.endTime <= new Date() : false;
    }

    res.json({
      success: true,
      canReview: !!hasPaidBooking && hasWatched,
      hasBooked: !!hasPaidBooking,
      hasWatched,
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
  checkEligibility,
};
