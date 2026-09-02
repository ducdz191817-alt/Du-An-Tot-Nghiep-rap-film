const Movie = require('../models/Movie.model');

/**
 * @desc    Lấy danh sách phim có hỗ trợ các bộ lọc (trạng thái, tìm kiếm, ngày chiếu, thể loại, độ tuổi)
 * @route   GET /api/movies
 * @access  Public
 */
const getMovies = async (req, res, next) => {
  try {
    const { status, search, genre, genres, rating, date } = req.query;

    const query = {};

    // 1. Lọc theo trạng thái phim ('now-showing', 'coming-soon', v.v.)
    if (status) {
      if (status === 'admin_all') {
        // Trạng thái dành cho quản trị viên: Lấy toàn bộ danh sách phim không loại trừ
        delete query.status;
      } else if (status === 'all') {
        // Dành cho khách hàng công khai: "Tất cả phim" chỉ gồm phim đang/sắp chiếu (loại bỏ ended, hidden, stopped, suspended, cancelled)
        query.status = { $nin: ['hidden', 'suspended', 'cancelled', 'stopped', 'ended'] };
      } else {
        query.status = status;
      }
    } else {
      // Mặc định cho người dùng: Không hiển thị các phim bị ẩn, tạm dừng hoặc đã kết thúc
      query.status = { $nin: ['hidden', 'suspended', 'cancelled', 'stopped', 'ended'] };
    }

    // 2. Tìm kiếm theo tên phim hoặc nội dung mô tả (không phân biệt hoa/thường)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // 3. Lọc phim theo ngày chiếu cụ thể
    if (date) {
      try {
        const Showtime = require('../models/Showtime.model');
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Tìm các suất chiếu diễn ra trong ngày được chọn
        const showtimes = await Showtime.find({
          startTime: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).select('movie');

        // Lấy danh sách ID các phim có suất chiếu trong ngày đó
        const movieIds = showtimes.map((s) => s.movie);
        query._id = { $in: movieIds };
      } catch (err) {
        console.error('Lỗi khi lọc phim theo ngày:', err);
      }
    }

    // 4. Lọc phim theo một hoặc nhiều thể loại (genre / genres)
    const genreValues = genres || genre;
    if (genreValues) {
      const genreList = Array.isArray(genreValues)
        ? genreValues
        : String(genreValues)
          .split(',')
          .map((g) => g.trim())
          .filter((g) => g !== '');

      if (genreList.length > 0) {
        query.genre = { $in: genreList };
      }
    }

    // 5. Lọc phim theo phân loại độ tuổi (phù hợp với rating P, K, T13, T16, T18...)
    if (rating) {
      query.rating = rating;
    }

    // 6. Thực hiện Aggregate tính toán số lượt đánh giá và điểm đánh giá trung bình cho mỗi phim
    const movies = await Movie.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'movie',
          as: 'movieReviews',
        },
      },
      {
        $addFields: {
          reviewsCount: { $size: '$movieReviews' },
          reviewsAverage: {
            $cond: {
              if: { $eq: [{ $size: '$movieReviews' }, 0] },
              then: 0,
              else: { $round: [{ $avg: '$movieReviews.rating' }, 1] },
            },
          },
        },
      },
      {
        $project: {
          movieReviews: 0, // Xóa mảng chi tiết reviews để tối ưu dung lượng kết quả trả về
        },
      },
      {
        $sort: { createdAt: -1 }, // Sắp xếp phim mới thêm lên đầu
      },
    ]);

    res.json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết một bộ phim theo ID
 * @route   GET /api/movies/:id
 * @access  Public
 */
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      res.status(404);
      throw new Error('Không tìm thấy phim');
    }

    res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách phim bán chạy nhất (Top vé bán ra)
 * @route   GET /api/movies/best-sellers
 * @access  Public
 */
const getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const Booking = require('../models/Booking.model');

    // 1. Thống kê dữ liệu đặt vé từ database để đếm số vé bán ra theo từng phim
    const bestSellersAgg = await Booking.aggregate([
      // Chỉ lấy các đơn đặt vé đã thanh toán thành công
      { $match: { paymentStatus: 'paid' } },
      // Liên kết với bảng showtimes để lấy ID phim
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime',
          foreignField: '_id',
          as: 'showtimeInfo',
        },
      },
      { $unwind: '$showtimeInfo' },
      // Nhóm theo ID phim và tính tổng số ghế đã đặt (vé bán ra) cùng tổng doanh thu
      {
        $group: {
          _id: '$showtimeInfo.movie',
          ticketsSold: { $sum: { $size: '$seats' } },
          revenue: { $sum: '$totalPrice' },
        },
      },
      // Sắp xếp theo số vé bán ra giảm dần
      { $sort: { ticketsSold: -1 } },
      // Giới hạn số lượng phim thuộc top
      { $limit: limit },
    ]);

    // 2. Lấy thông tin chi tiết của các phim top đầu kèm số đánh giá và điểm trung bình
    const movieIds = bestSellersAgg.map((item) => item._id);

    let movies = [];
    if (movieIds.length > 0) {
      movies = await Movie.aggregate([
        { $match: { _id: { $in: movieIds } } },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movie',
            as: 'movieReviews',
          },
        },
        {
          $addFields: {
            reviewsCount: { $size: '$movieReviews' },
            reviewsAverage: {
              $cond: {
                if: { $eq: [{ $size: '$movieReviews' }, 0] },
                then: 0,
                else: { $round: [{ $avg: '$movieReviews.rating' }, 1] },
              },
            },
          },
        },
        {
          $project: {
            movieReviews: 0,
          },
        },
      ]);

      // Ánh xạ lại ticketsSold và sắp xếp theo đúng thứ tự xếp hạng bán chạy
      const moviesMap = movies.reduce((acc, movie) => {
        acc[movie._id.toString()] = movie;
        return acc;
      }, {});

      movies = bestSellersAgg
        .map((item) => {
          if (!item._id) return null;
          const m = moviesMap[item._id.toString()];
          if (m) {
            return {
              ...m,
              ticketsSold: item.ticketsSold,
              revenue: item.revenue,
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    // 3. Fallback: Nếu hệ thống mới khởi chạy chưa đủ dữ liệu vé bán, bổ sung các phim đang/sắp chiếu vào danh sách
    if (movies.length < 4) {
      const existingIds = movies.map(m => m._id.toString());
      const mongoose = require('mongoose');

      // Chuyển đổi chuỗi ID sang ObjectId
      const existingObjectIds = existingIds.map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      const fallbackMovies = await Movie.aggregate([
        {
          $match: {
            _id: { $nin: existingObjectIds },
            status: { $in: ['now-showing', 'coming-soon'] }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movie',
            as: 'movieReviews',
          },
        },
        {
          $addFields: {
            reviewsCount: { $size: '$movieReviews' },
            reviewsAverage: {
              $cond: {
                if: { $eq: [{ $size: '$movieReviews' }, 0] },
                then: 0,
                else: { $round: [{ $avg: '$movieReviews.rating' }, 1] },
              },
            },
          },
        },
        {
          $project: {
            movieReviews: 0,
          },
        },
        { $limit: 8 - movies.length }
      ]);

      // Gán chỉ số số vé mẫu cho phim bổ sung (giúp hiển thị giao diện đẹp hơn)
      const seededFallbackMovies = fallbackMovies.map((m, idx) => ({
        ...m,
        ticketsSold: Math.max(10 - idx * 2, 2) + Math.floor(Math.random() * 5),
        revenue: 0,
      }));

      movies = [...movies, ...seededFallbackMovies];
    }

    // Sắp xếp lại theo số lượng vé bán ra giảm dần
    movies.sort((a, b) => b.ticketsSold - a.ticketsSold);

    res.json({
      success: true,
      count: movies.length,
      data: movies.slice(0, limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  getBestSellers,
};

