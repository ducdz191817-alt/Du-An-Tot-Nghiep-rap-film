/**
 * update-movies-status.js
 * Cập nhật tất cả phim quá khứ sang các status hợp lý với ngày chiếu thực tế.
 * Chạy: node src/update-movies-status.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');

// Ngày hôm nay: 2026-06-23
// ─── Phim sẽ được cập nhật ────────────────────────────────────────────────────
const updates = [
  // ── ĐANG CHIẾU (đã ra mắt trong 1–30 ngày qua) ───────────────────────────
  {
    title: 'Dune: Part Two',
    status: 'now-showing',
    releaseDate: new Date('2026-05-28'),
  },
  {
    title: 'Kung Fu Panda 4',
    status: 'now-showing',
    releaseDate: new Date('2026-06-02'),
  },
  {
    title: 'Oppenheimer',
    status: 'now-showing',
    releaseDate: new Date('2026-06-06'),
  },
  {
    title: 'Barbie',
    status: 'now-showing',
    releaseDate: new Date('2026-06-09'),
  },
  {
    title: 'Top Gun: Maverick',
    status: 'now-showing',
    releaseDate: new Date('2026-06-13'),
  },
  {
    title: 'The Batman',
    status: 'now-showing',
    releaseDate: new Date('2026-06-16'),
  },
  {
    title: 'Guardians of the Galaxy Vol. 3',
    status: 'now-showing',
    releaseDate: new Date('2026-06-18'),
  },
  {
    title: 'Avatar: The Way of Water',
    status: 'now-showing',
    releaseDate: new Date('2026-06-20'),
  },

  // ── SẮP CHIẾU (ra mắt trong 7–21 ngày tới) ───────────────────────────────
  {
    title: 'Spider-Man: No Way Home',
    status: 'coming-soon',
    releaseDate: new Date('2026-06-27'),
  },
  {
    title: 'Fast X',
    status: 'coming-soon',
    releaseDate: new Date('2026-07-04'),
  },
  {
    title: 'Encanto',
    status: 'coming-soon',
    releaseDate: new Date('2026-07-08'),
  },
  {
    title: 'Mission: Impossible – Dead Reckoning Part One',
    status: 'coming-soon',
    releaseDate: new Date('2026-07-11'),
  },

  // ── SẮP RA MẮT (ra mắt trong 3–6 tuần tới) ──────────────────────────────
  {
    title: 'Black Panther: Wakanda Forever',
    status: 'pre-release',
    releaseDate: new Date('2026-07-18'),
  },
  {
    title: 'Thor: Love and Thunder',
    status: 'pre-release',
    releaseDate: new Date('2026-07-25'),
  },
  {
    title: 'Shang-Chi and the Legend of the Ten Rings',
    status: 'pre-release',
    releaseDate: new Date('2026-08-01'),
  },
  {
    title: 'Eternals',
    status: 'pre-release',
    releaseDate: new Date('2026-08-08'),
  },
];

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    let updated = 0;
    let notFound = 0;

    for (const u of updates) {
      const result = await Movie.findOneAndUpdate(
        { title: u.title },
        { status: u.status, releaseDate: u.releaseDate },
        { new: true }
      );

      if (result) {
        const dateStr = u.releaseDate.toISOString().split('T')[0];
        console.log(`✅ [${u.status.padEnd(12)}] ${u.title} → ${dateStr}`);
        updated++;
      } else {
        console.log(`⚠️  Không tìm thấy: ${u.title}`);
        notFound++;
      }
    }

    console.log(`\n🎬 Hoàn tất! Đã cập nhật: ${updated} | Không tìm thấy: ${notFound}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
};

run();
