/**
 * autoUpdateMovieStatus.js
 *
 * Tự động cập nhật status phim dựa theo lịch chiếu thực tế:
 *   - Có lịch chiếu HÔM NAY                 → now-showing  (đang chiếu)
 *   - Chỉ có lịch chiếu TƯƠNG LAI (không hôm nay) → coming-soon  (sắp chiếu)
 *   - Không có lịch chiếu nào cả            → pre-release  (sắp ra mắt)
 *
 * Không đụng đến các status: suspended, cancelled, hidden, stopped, ended
 */

const Movie = require('../models/Movie.model');
const Showtime = require('../models/Showtime.model');

/**
 * Tính toán và trả về status mới cho một movieId dựa vào lịch chiếu.
 * @param {string} movieId
 * @returns {'now-showing'|'coming-soon'|'pre-release'}
 */
const computeMovieStatus = async (movieId) => {
  const now = new Date();

  // Đầu ngày hôm nay (00:00:00)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Cuối ngày hôm nay (23:59:59)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Kiểm tra xem có lịch chiếu nào hôm nay không
  const todayShowtime = await Showtime.findOne({
    movie: movieId,
    startTime: { $gte: startOfToday, $lte: endOfToday },
  }).lean();

  if (todayShowtime) {
    return 'now-showing';
  }

  // 2. Kiểm tra xem có lịch chiếu nào trong tương lai không
  const futureShowtime = await Showtime.findOne({
    movie: movieId,
    startTime: { $gt: endOfToday },
  }).lean();

  if (futureShowtime) {
    return 'coming-soon';
  }

  // 3. Không có lịch chiếu nào
  return 'pre-release';
};

/**
 * Duyệt qua tất cả phim đang hoạt động và cập nhật status theo lịch chiếu.
 * Được gọi tại startup và theo định kỳ (cron).
 */
const autoUpdateMovieStatus = async () => {
  const PROTECTED_STATUSES = ['suspended', 'cancelled', 'hidden', 'stopped', 'ended'];

  try {
    // Lấy tất cả phim không nằm trong danh sách bảo vệ
    const movies = await Movie.find({
      status: { $nin: PROTECTED_STATUSES },
    }).select('_id title status').lean();

    if (!movies.length) return;

    let updated = 0;

    for (const movie of movies) {
      const newStatus = await computeMovieStatus(movie._id);

      if (newStatus !== movie.status) {
        await Movie.findByIdAndUpdate(movie._id, { status: newStatus });
        console.log(
          `[AutoStatus] "${movie.title}": ${movie.status} → ${newStatus}`
        );
        updated++;
      }
    }

    if (updated > 0) {
      console.log(`[AutoStatus] Đã cập nhật ${updated} phim.`);
    } else {
      console.log('[AutoStatus] Tất cả status phim đã đúng, không cần cập nhật.');
    }
  } catch (err) {
    console.error('[AutoStatus] Lỗi khi cập nhật status phim:', err.message);
  }
};

module.exports = { autoUpdateMovieStatus };
