/**
 * update-poster-urls.js
 * Script cập nhật posterUrl trong database để trỏ đến file ảnh local trong thư mục /posters.
 * Chỉ cập nhật các phim có file ảnh local khớp tên.
 * Chạy: node src/update-poster-urls.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');

// Ánh xạ: title phim trong DB => đường dẫn poster local
const posterMapping = [
  { title: 'A Quiet Place: Day One',            posterUrl: '/posters/A-Quiet-Place-Day-One.jpg' },
  { title: 'Alien: Romulus',                    posterUrl: '/posters/Alien-Romulus.jpg' },
  { title: 'Avatar: The Way of Water',          posterUrl: '/posters/Avatar-The-Way-of-Water.webp' },
  { title: 'Barbie',                            posterUrl: '/posters/Barbie.jpg' },
  { title: 'Deadpool & Wolverine',              posterUrl: '/posters/Deadpool-&-Wolverine.jpg' },
  { title: 'Guardians of the Galaxy Vol. 3',   posterUrl: '/posters/Guardians-of-the-Galaxy-Vol.-3.jpg' },
  { title: 'Joker: Folie à Deux',              posterUrl: '/posters/Joker-Folie-à-Deux.jpg' },
  { title: 'Moana 2',                           posterUrl: '/posters/Moana-2.jpg' },
  { title: 'Oppenheimer',                       posterUrl: '/posters/Oppenheimer.jpg' },
  { title: 'The Batman',                        posterUrl: '/posters/The-Batman.jpg' },
  { title: 'The Wild Robot',                    posterUrl: '/posters/The-Wild-Robot.jpg' },
  { title: 'Top Gun: Maverick',                 posterUrl: '/posters/Top-Gun-Maverick.jpg' },
  { title: 'Transformers One',                  posterUrl: '/posters/Transformers-One.jpg' },
  { title: 'Twisters',                          posterUrl: '/posters/Twisters.jpg' },
  { title: 'Venom: The Last Dance',             posterUrl: '/posters/Venom-The-Last-Dance.jpg' },
  { title: 'Wicked',                            posterUrl: '/posters/Wicked.jpg' },
  { title: 'Inside Out 2',                      posterUrl: '/posters/inside-out.webp' },
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

    for (const { title, posterUrl } of posterMapping) {
      const movie = await Movie.findOne({ title });
      if (!movie) {
        console.log(`❌ Không tìm thấy phim: "${title}"`);
        notFound++;
        continue;
      }

      await Movie.updateOne({ title }, { $set: { posterUrl } });
      console.log(`✅ Cập nhật: "${title}" => ${posterUrl}`);
      updated++;
    }

    console.log(`\n🎬 Hoàn tất! Cập nhật: ${updated} | Không tìm thấy: ${notFound}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
};

run();
