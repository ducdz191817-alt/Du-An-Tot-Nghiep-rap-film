/**
 * refresh-showtimes.js
 *
 * Xóa tất cả suất chiếu cũ (đã qua ngày hôm nay) và tạo lịch chiếu mới
 * cho các phim đang chiếu (now-showing, preview) từ hôm nay đến 7 ngày tới.
 *
 * Chạy: node src/refresh-showtimes.js
 * KHÔNG xóa movies, users, bookings - chỉ làm mới showtimes.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Movie    = require('./models/Movie.model');
const Room     = require('./models/Room.model');
const Theater  = require('./models/Theater.model');
const Showtime = require('./models/Showtime.model');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const SHOWTIME_SLOTS = [
  { hour: 8,  minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 13, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 30 },
];

const PRICES = { IMAX: 180000, '3D': 90000, '2D': 80000, GOLDCLASS: 300000 };

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Main ─────────────────────────────────────────────────────────────────────
const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    // ── 1. Không xóa suất chiếu cũ để giữ dữ liệu cho Báo cáo Doanh thu ──────
    // ── 1. Xóa các suất chiếu tương lai từ hôm nay để tạo mới sạch đẹp ──────
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const deleted = await Showtime.deleteMany({ startTime: { $gte: startOfToday } });
    console.log(`🗑️  Đã xóa ${deleted.deletedCount} suất chiếu cũ/tương lai (từ ${startOfToday.toDateString()}).`);

    // ── 2. Lấy TẤT CẢ phim đang hoạt động ────────────────────────────────────
    const PROTECTED_STATUSES = ['suspended', 'cancelled', 'hidden', 'stopped', 'ended'];

    const allMovies = await Movie.find({
      status: { $nin: PROTECTED_STATUSES },
    }).lean();

    if (!allMovies.length) {
      console.log('⚠️  Không có phim nào đủ điều kiện. Kết thúc.');
      process.exit(0);
    }

    // Chỉ tạo lịch chiếu cho các phim đang chiếu (now-showing)
    const nowShowingMovies = allMovies.filter(m => m.status === 'now-showing');
    console.log(`\n🎬 Lịch chiếu sẽ được tự động tạo cho ${nowShowingMovies.length} phim Đang chiếu (now-showing).\n`);

    const movies = nowShowingMovies;

    // ── 3. Lấy phòng chiếu ───────────────────────────────────────────────────
    const rooms = await Room.find({}).populate('theater').lean();
    if (!rooms.length) {
      console.log('❌ Không có phòng chiếu nào trong DB. Kết thúc.');
      process.exit(1);
    }
    console.log(`🏟️  Tìm thấy ${rooms.length} phòng chiếu.\n`);

    // ── 4. Tạo lịch chiếu: đảm bảo mỗi phim có ít nhất 1 suất HÔM NAY ────────
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

    const addShowtime = (movie, room, startTime, endTime, dateStr) => {
      const theaterId = room.theater?._id || room.theater;
      markUsed(room._id.toString(), dateStr, startTime, endTime);
      showtimesData.push({
        movie: movie._id,
        theater: theaterId,
        room: room._id,
        startTime,
        endTime,
        ticketPrice: PRICES[room.type] || 90000,
        format: room.type,
        bookedSeats: [],
      });
    };

    // ── PASS 1: Đảm bảo mỗi phim now-showing có ÍT NHẤT 1 suất HÔM NAY ────────
    const todayBase = new Date();
    todayBase.setHours(0, 0, 0, 0);
    const todayStr = todayBase.toISOString().slice(0, 10);

    for (const movie of nowShowingMovies) {
      let assigned = false;
      for (const slot of SHOWTIME_SLOTS) {
        if (assigned) break;
        for (const room of rooms) {
          const startTime = new Date(todayBase);
          startTime.setHours(slot.hour, slot.minute, 0, 0);
          const endTime = addMinutes(startTime, (movie.duration || 120) + 20);

          if (!hasConflict(room._id.toString(), todayStr, startTime, endTime)) {
            addShowtime(movie, room, startTime, endTime, todayStr);
            assigned = true;
            break;
          }
        }
      }
      if (!assigned) {
        console.log(`⚠️  Không thể tạo suất hôm nay cho "${movie.title}" — tất cả slot đều bị xung đột.`);
      }
    }

    // ── PASS 2: Tạo thêm suất chiếu ngẫu nhiên cho ngày 0–7 (CHỈ CHO nowShowingMovies) ────────
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + dayOffset);
      baseDate.setHours(0, 0, 0, 0);
      const dateStr = baseDate.toISOString().slice(0, 10);

      const shuffledMovies = shuffle(nowShowingMovies);

      for (const movie of shuffledMovies) {
        // Mỗi phim chọn 2 phòng chiếu ngẫu nhiên mỗi ngày
        const selectedRooms = shuffle(rooms).slice(0, 2);

        for (const room of selectedRooms) {
          const shuffledSlots = shuffle(SHOWTIME_SLOTS);

          for (const slot of shuffledSlots) {
            const startTime = new Date(baseDate);
            startTime.setHours(slot.hour, slot.minute, 0, 0);
            const endTime = addMinutes(startTime, (movie.duration || 120) + 20);

            if (!hasConflict(room._id.toString(), dateStr, startTime, endTime)) {
              addShowtime(movie, room, startTime, endTime, dateStr);
              break;
            }
          }
        }
      }
    }


    // ── 5. Lưu vào DB ────────────────────────────────────────────────────────
    if (showtimesData.length === 0) {
      console.log('⚠️  Không tạo được suất chiếu nào (có thể tất cả slot bị xung đột).');
      process.exit(0);
    }

    const inserted = await Showtime.insertMany(showtimesData);
    console.log(`✅ Đã tạo ${inserted.length} suất chiếu mới (từ hôm nay đến +7 ngày).`);

    // ── 6. Chạy lại auto-update status ───────────────────────────────────────
    console.log('\n🔄 Cập nhật lại status phim theo lịch mới...');
    const { autoUpdateMovieStatus } = require('./utils/autoUpdateMovieStatus');
    await autoUpdateMovieStatus();

    console.log('\n🎉 Hoàn tất! Lịch chiếu đã được làm mới.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
};

run();
