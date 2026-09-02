const Review = require('../models/Review.model');
const Movie = require('../models/Movie.model');
const Booking = require('../models/Booking.model');
const Showtime = require('../models/Showtime.model');

/**
 * @desc    Tạo đánh giá mới cho phim
 * @route   POST /api/reviews
 * @access  Private (Chỉ dành cho role "user")
 */
const createReview = async (req, res, next) => {
  try {
    const { movieId, rating, comment } = req.body;
    const userId = req.user._id;

    // 1. Kiểm tra phân quyền: Chỉ cho phép tài khoản người dùng (user) đánh giá phim (admin không được phép)
    if (req.user.role !== 'user') {
      res.status(403);
      throw new Error('Chỉ tài khoản người dùng (user) mới có thể đánh giá phim');
    }

    // 2. Kiểm tra bộ phim có tồn tại trong cơ sở dữ liệu hay không
    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404);
      throw new Error('Phim không tồn tại');
    }

    // 3. RÀNG BUỘC 1: Kiểm tra tài khoản đã từng đặt vé & thanh toán thành công cho phim này chưa
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

    // 4. RÀNG BUỘC 2: Kiểm tra suất chiếu đã kết thúc chưa (người dùng phải xem xong phim mới được viết đánh giá)
    const bookedShowtime = showtimes.find(
      (st) => st._id.toString() === hasPaidBooking.showtime.toString()
    );
    if (bookedShowtime && bookedShowtime.endTime > new Date()) {
      res.status(403);
      throw new Error('Bạn chỉ có thể đánh giá sau khi suất chiếu kết thúc. Vui lòng quay lại sau khi xem phim.');
    }

    // 5. RÀNG BUỘC 3: Kiểm tra người dùng đã từng đánh giá phim này chưa (mỗi người chỉ được đánh giá 1 lần)
    const existingReview = await Review.findOne({ user: userId, movie: movieId });
    if (existingReview) {
      res.status(400);
      throw new Error('Bạn đã đánh giá phim này rồi. Hãy chỉnh sửa đánh giá hiện tại.');
    }

    // 6. Lưu đánh giá mới vào cơ sở dữ liệu
    const review = await Review.create({
      user: userId,
      movie: movieId,
      rating,
      comment,
    });

    // 7. Lấy lại đánh giá kèm thông tin chi tiết người dùng (username, email, avatar) để trả về client
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

/**
 * @desc    Lấy danh sách tất cả đánh giá của một bộ phim
 * @route   GET /api/reviews/movie/:movieId
 * @access  Public
 */
const getReviewsByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    // 1. Tìm tất cả đánh giá của phim, kèm thông tin người đánh giá và phản hồi của admin (nếu có)
    const reviews = await Review.find({ movie: movieId })
      .populate('user', 'username email avatar')
      .populate('adminReply.repliedBy', 'username email avatar')
      .sort({ createdAt: -1 }); // Sắp xếp đánh giá mới nhất lên đầu

    // 2. Tính số lượng và điểm đánh giá trung bình
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

/**
 * @desc    Cập nhật đánh giá cá nhân
 * @route   PUT /api/reviews/:id
 * @access  Private (Chỉ chính chủ tạo đánh giá mới có quyền chỉnh sửa)
 */
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    // 1. Kiểm tra quyền sở hữu: Chỉ cho phép người tạo đánh giá chỉnh sửa
    if (review.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    // 2. Cập nhật số sao và nội dung bình luận
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    // 3. Populate thông tin người dùng và phản hồi admin để trả về dữ liệu hoàn chỉnh
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

/**
 * @desc    Xóa đánh giá phim
 * @route   DELETE /api/reviews/:id
 * @access  Private (Chủ sở hữu đánh giá hoặc Quản trị viên Admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    // Kiểm tra quyền xóa: Cho phép người viết đánh giá đó HOẶC tài khoản Admin xóa
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

/**
 * @desc    Quản trị viên (Admin) trả lời/phản hồi một đánh giá của khách hàng
 * @route   POST /api/reviews/:id/reply
 * @access  Private (Chỉ dành cho Admin)
 */
const replyReview = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const reviewId = req.params.id;

    // 1. Kiểm tra xem người dùng có phải là Admin không
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Chỉ tài khoản admin mới có thể phản hồi đánh giá');
    }

    // 2. Kiểm tra nội dung phản hồi không được để trống
    if (!comment || !comment.trim()) {
      res.status(400);
      throw new Error('Vui lòng nhập nội dung phản hồi');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    // 3. Cập nhật thông tin phản hồi của Admin
    review.adminReply = {
      comment: comment.trim(),
      repliedBy: req.user._id,
      repliedAt: new Date(),
    };

    await review.save();

    // 4. Populate trả về thông tin đầy đủ sau khi lưu phản hồi
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

/**
 * @desc    Quản trị viên (Admin) xóa phản hồi của mình trên một đánh giá
 * @route   DELETE /api/reviews/:id/reply
 * @access  Private (Chỉ dành cho Admin)
 */
const deleteReply = async (req, res, next) => {
  try {
    const reviewId = req.params.id;

    // Kiểm tra quyền Admin
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Chỉ tài khoản admin mới có thể xóa phản hồi');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404);
      throw new Error('Đánh giá không tồn tại');
    }

    // Xóa phản hồi bằng cách đặt adminReply thành undefined
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

/**
 * @desc    Kiểm tra người dùng hiện tại có đủ điều kiện đánh giá phim hay không (Đã mua vé thành công & Suất chiếu đã kết thúc)
 * @route   GET /api/reviews/check-eligibility/:movieId
 * @access  Private (Chỉ dành cho role "user")
 */
const checkEligibility = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    if (req.user.role !== 'user') {
      return res.json({ success: true, canReview: false, reason: 'not_user' });
    }

    // 1. Tìm các suất chiếu thuộc về bộ phim này
    const showtimes = await Showtime.find({ movie: movieId }).select('_id endTime');
    const showtimeIds = showtimes.map((st) => st._id);

    // 2. Kiểm tra xem người dùng đã từng có đơn đặt vé nào đã thanh toán cho phim này không
    const hasPaidBooking = await Booking.findOne({
      user: userId,
      showtime: { $in: showtimeIds },
      paymentStatus: 'paid',
    });

    // 3. Kiểm tra xem suất chiếu đã xem đã kết thúc hay chưa
    let hasWatched = false;
    if (hasPaidBooking) {
      const bookedShowtime = showtimes.find(
        (st) => st._id.toString() === hasPaidBooking.showtime.toString()
      );
      hasWatched = bookedShowtime ? bookedShowtime.endTime <= new Date() : false;
    }

    // 4. Trả về kết quả kiểm tra điều kiện đánh giá
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

