require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');

const seedStatuses = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking');
    console.log('Connected!');

    const movies = await Movie.find();
    console.log(`Tìm thấy tổng cộng ${movies.length} phim trong DB.`);

    if (movies.length === 0) {
      console.log('Không có phim nào trong database!');
      process.exit(0);
    }

    // Chia đều danh sách phim sang các trạng thái:
    // 50% phim -> 'now-showing' (Đang chiếu)
    // 25% phim -> 'coming-soon' (Sắp chiếu)
    // 25% phim -> 'pre-release' (Sắp ra mắt)

    let nowShowingCount = 0;
    let comingSoonCount = 0;
    let preReleaseCount = 0;

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      let newStatus = 'now-showing';
      let releaseDaysOffset = -15; // Quá khứ

      if (i % 4 === 2) {
        newStatus = 'coming-soon';
        releaseDaysOffset = 7 + (i * 2); // Sắp chiếu (ra mắt trong 7 - 20 ngày tới)
        comingSoonCount++;
      } else if (i % 4 === 3) {
        newStatus = 'pre-release';
        releaseDaysOffset = 25 + (i * 3); // Sắp ra mắt (ra mắt trong 25 - 45 ngày tới)
        preReleaseCount++;
      } else {
        nowShowingCount++;
      }

      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + releaseDaysOffset);

      await Movie.findByIdAndUpdate(movie._id, {
        status: newStatus,
        releaseDate,
      });

      console.log(`🎬 [${newStatus.padEnd(12)}] ${movie.title}`);
    }

    console.log('\n====================================');
    console.log(`✅ Cập nhật thành công!`);
    console.log(`- Đang chiếu (now-showing): ${nowShowingCount} phim`);
    console.log(`- Sắp chiếu (coming-soon):   ${comingSoonCount} phim`);
    console.log(`- Sắp ra mắt (pre-release): ${preReleaseCount} phim`);
    console.log('====================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
};

seedStatuses();
