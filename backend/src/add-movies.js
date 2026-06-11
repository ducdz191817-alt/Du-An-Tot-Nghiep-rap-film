/**
 * add-movies.js
 * Script thêm phim vào database MÀ KHÔNG XÓA dữ liệu cũ.
 * Chỉ chèn phim nếu chưa tồn tại (kiểm tra theo title).
 * Chạy: node src/add-movies.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');

const newMovies = [
  {
    title: 'Doctor Strange in the Multiverse of Madness',
    titleEN: 'Doctor Strange in the Multiverse of Madness',
    description:
      'Bác Sĩ Strange cùng một cô thiếu niên bí ẩn có khả năng di chuyển giữa các vũ trụ song song phải đương đầu với vô số mối nguy hiểm, bao gồm các phiên bản thay thế của chính họ đang đe dọa xóa sổ hàng triệu sinh mạng.',
    descriptionEN:
      'Doctor Strange teams up with a mysterious teenage girl from his dreams who can travel across multiverses, to battle multiple threats, including alternate-universe versions of himself, which threaten to wipe out millions across the multiverse.',
    duration: 126,
    genre: ['Action', 'Adventure', 'Fantasy'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: new Date('2022-05-04'),
    posterUrl: 'https://image.tmdb.org/t/p/original/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg',
    trailerUrl: 'https://www.youtube.com/embed/aWzlQ2N6qqg',
    rating: 'T13',
    director: 'Sam Raimi',
    cast: [
      'Benedict Cumberbatch',
      'Elizabeth Olsen',
      'Chiwetel Ejiofor',
      'Rachel McAdams',
      'Benedict Wong',
    ],
    status: 'now-showing',
  },
  {
    title: 'Spirited Away',
    titleEN: 'Spirited Away',
    description:
      'Cô bé 10 tuổi Chihiro đang trên đường chuyển nhà cùng cha mẹ bỗng lạc vào thế giới thần linh kỳ bí. Để cứu cha mẹ bị biến thành lợn, cô phải làm việc trong nhà tắm thần linh và vượt qua vô số thử thách để tìm đường về nhà.',
    descriptionEN:
      'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
    duration: 125,
    genre: ['Animation', 'Adventure', 'Family', 'Fantasy'],
    language: 'Japanese with Vietnamese Subtitles',
    releaseDate: new Date('2001-07-20'),
    posterUrl: 'https://image.tmdb.org/t/p/original/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    trailerUrl: 'https://www.youtube.com/embed/ByXuk9QqQkk',
    rating: 'P',
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'],
    status: 'now-showing',
  },
  // ─── Thêm phim thứ 3 của bạn vào đây nếu cần ───────────────────────────────
];

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    let added = 0;
    let skipped = 0;

    for (const movieData of newMovies) {
      const exists = await Movie.findOne({ title: movieData.title });
      if (exists) {
        console.log(`⏭️  Skipped (already exists): ${movieData.title}`);
        skipped++;
      } else {
        await Movie.create(movieData);
        console.log(`✅ Added: ${movieData.title}`);
        added++;
      }
    }

    console.log(`\n🎬 Done! Added: ${added} | Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
