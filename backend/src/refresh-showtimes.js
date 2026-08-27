/**
 * refresh-showtimes.js
 *
 * Tạo lịch chiếu phong phú, dày đặc cho TẤT CẢ phim đang chiếu (now-showing, preview)
 * trải đều trên tất cả các cụm rạp và phòng chiếu cho 7 ngày tới (từ hôm nay).
 *
 * Chạy: node src/refresh-showtimes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Movie    = require('./models/Movie.model');
const Room     = require('./models/Room.model');
const Theater  = require('./models/Theater.model');
const Showtime = require('./models/Showtime.model');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const TIME_SLOTS = [
  { hour: 8,  minute: 30 },
  { hour: 10, minute: 45 },
  { hour: 13, minute: 15 },
  { hour: 15, minute: 45 },
  { hour: 18, minute: 15 },
  { hour: 20, minute: 45 },
  { hour: 23, minute: 0 },
];

const PRICES = {
  IMAX: 180000,
  '3D': 110000,
  '2D': 90000,
  GOLDCLASS: 250000,
  SWEETBOX: 140000,
  VIP: 130000,
  STANDARD: 85000,
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Main ─────────────────────────────────────────────────────────────────────
const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    // ── 1. Xóa các suất chiếu tương lai (từ đầu ngày hôm nay trở đi) để tạo mới sạch đẹp ──
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const deleted = await Showtime.deleteMany({ startTime: { $gte: startOfToday } });
    console.log(`🗑️  Đã làm sạch ${deleted.deletedCount} suất chiếu từ hôm nay trở đi để tạo lịch mới.`);

    // ── 2. Lấy danh sách phim Đang Chiếu (now-showing) và Suất Chiếu Sớm (preview) ──
    const activeMovies = await Movie.find({
      status: { $in: ['now-showing', 'preview'] },
      isActive: { $ne: false },
    }).lean();

    if (!activeMovies.length) {
      console.log('⚠️ Không tìm thấy phim now-showing nào. Lấy tất cả phim không bị ẩn...');
      const fallbackMovies = await Movie.find({
        status: { $nin: ['suspended', 'cancelled', 'hidden', 'stopped', 'ended'] },
      }).lean();
      activeMovies.push(...fallbackMovies);
    }

    console.log(`🎬 Tìm thấy ${activeMovies.length} phim sẵn sàng tạo lịch chiếu:`);
    activeMovies.forEach((m, idx) => console.log(`   ${idx + 1}. [${m.status.toUpperCase()}] ${m.title} (${m.duration || 120} phút)`));

    // ── 3. Lấy phòng chiếu và rạp ───────────────────────────────────────────
    const rooms = await Room.find({ isActive: { $ne: false } }).populate('theater').lean();
    if (!rooms.length) {
      console.log('❌ Không có phòng chiếu nào trong DB. Kết thúc.');
      process.exit(1);
    }

    const theaters = await Theater.find({ isActive: { $ne: false } }).lean();
    console.log(`\n🏟️  Tìm thấy ${theaters.length} rạp và ${rooms.length} phòng chiếu hoạt động.\n`);

    // ── 4. Tạo lịch chiếu cho 7 ngày tới (Day 0 -> Day 7) ───────────────────
    const showtimesData = [];
    const roomSchedule = {}; // { "roomId_dateStr": [{start, end}] }

    const hasConflict = (roomId, dateStr, newStart, newEnd) => {
      const key = `${roomId}_${dateStr}`;
      if (!roomSchedule[key]) return false;
      return roomSchedule[key].some(({ start, end }) => newStart < end && newEnd > start);
    };

    const markUsed = (roomId, dateStr, newStart, newEnd) => {
      const key = `${roomId}_${dateStr}`;
      if (!roomSchedule[key]) roomSchedule[key] = [];
      roomSchedule[key].push({ start: newStart, end: newEnd });
    };

    let movieIndex = 0;

    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + dayOffset);
      baseDate.setHours(0, 0, 0, 0);
      const dateStr = baseDate.toISOString().slice(0, 10);
      const dayName = baseDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

      let dayCount = 0;

      // Duyệt qua từng phòng chiếu của từng rạp
      for (const room of rooms) {
        const theaterId = room.theater?._id || room.theater;
        if (!theaterId) continue;

        // Chọn các slot trong ngày cho phòng này
        for (const slot of TIME_SLOTS) {
          const startTime = new Date(baseDate);
          startTime.setHours(slot.hour, slot.minute, 0, 0);

          // Chọn phim xoay vòng để tất cả các phim đều có nhiều suất
          const movie = activeMovies[movieIndex % activeMovies.length];
          movieIndex++;

          const duration = movie.duration || 120;
          const endTime = addMinutes(startTime, duration + 15); // +15 phút dọn phòng

          if (!hasConflict(room._id.toString(), dateStr, startTime, endTime)) {
            markUsed(room._id.toString(), dateStr, startTime, endTime);

            const format = room.type || '2D';
            const price = PRICES[format] || PRICES[room.screenType] || 90000;

            showtimesData.push({
              movie: movie._id,
              theater: theaterId,
              room: room._id,
              startTime,
              endTime,
              ticketPrice: price,
              format: format,
              bookedSeats: [],
            });
            dayCount++;
          }
        }
      }
      console.log(`📅 ${dayName}: Đã lên lịch ${dayCount} suất chiếu.`);
    }

    // ── 5. Lưu vào MongoDB ──────────────────────────────────────────────────
    if (showtimesData.length === 0) {
      console.log('⚠️ Không tạo được suất chiếu nào.');
      process.exit(0);
    }

    console.log(`\n💾 Đang lưu ${showtimesData.length} suất chiếu vào database...`);
    const inserted = await Showtime.insertMany(showtimesData);
    console.log(`✅ Thành công! Đã tạo tổng cộng ${inserted.length} suất chiếu mới cho 7 ngày tới.`);

    // ── 6. Cập nhật trạng thái phim tự động ──────────────────────────────────
    try {
      const { autoUpdateMovieStatus } = require('./utils/autoUpdateMovieStatus');
      if (typeof autoUpdateMovieStatus === 'function') {
        console.log('\n🔄 Cập nhật lại status phim theo lịch mới...');
        await autoUpdateMovieStatus();
      }
    } catch (e) {
      // ignore
    }

    console.log('\n🎉 HOÀN TẤT! Tất cả phim đang chiếu đều đã có nhiều suất chiếu dày đặc trong 7 ngày tới.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
};

run();
