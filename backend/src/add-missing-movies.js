/**
 * add-missing-movies.js
 *
 * Thêm các phim còn thiếu vào DB mà không xóa dữ liệu cũ.
 * Dùng upsert để không tạo phim trùng lặp.
 *
 * Chạy: node src/add-missing-movies.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');

const pastDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const missingMovies = [
  {
    title: 'Dune: Part Two',
    titleEN: 'Dune: Part Two',
    description: 'Paul Atreides liên minh với người Fremen và thực hiện hành trình báo thù những kẻ âm mưu hủy diệt gia đình mình.',
    descriptionEN: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    duration: 166,
    genre: ['Sci-Fi', 'Adventure', 'Action'],
    language: 'Tiếng Anh',
    releaseDate: pastDays(37),
    posterUrl: 'https://i.ebayimg.com/images/g/YxIAAOSwYQ5l5ZSl/s-l1600.webp',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    rating: 'T13',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    status: 'now-showing',
  },
  {
    title: 'Kung Fu Panda 4',
    titleEN: 'Kung Fu Panda 4',
    description: 'Po được bổ nhiệm làm Lãnh đạo Tinh thần của Thung lũng Hòa bình, nhưng trước tiên phải tìm và đào tạo một Chiến binh Rồng mới.',
    descriptionEN: 'Po is tapped to become the Spiritual Leader of the Valley of Peace, but must first find and train a new Dragon Warrior.',
    duration: 94,
    genre: ['Animation', 'Action', 'Comedy', 'Family'],
    language: 'Tiếng Anh',
    releaseDate: pastDays(22),
    posterUrl: 'https://image.tmdb.org/t/p/original/7quq3UOaaB0qNM7TMGMEqqghLck.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=_inKs4eeHiI',
    rating: 'P',
    director: 'Mike Mitchell',
    cast: ['Jack Black', 'Awkwafina', 'Viola Davis', 'Bryan Cranston'],
    status: 'now-showing',
  },
  {
    title: 'Fast X',
    titleEN: 'Fast X',
    description: 'Dominic Toretto và gia đình phải đối mặt với Dante - kẻ thù nguy hiểm và lâu đời nhất từ trước đến nay.',
    descriptionEN: "Dom Toretto and his family face Dante, the most ruthless villain they've ever encountered.",
    duration: 141,
    genre: ['Action', 'Adventure', 'Thriller'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(14),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/brZzXXQ8GuzlAdu4TJxjhC8ebBL.jpg',
    trailerUrl: 'https://www.youtube.com/embed/32RAq6JzY-w',
    rating: 'T16',
    director: 'Louis Leterrier',
    cast: ['Vin Diesel', 'Michelle Rodriguez', 'Tyrese Gibson', 'Ludacris'],
    status: 'now-showing',
  },
  {
    title: 'Oppenheimer',
    titleEN: 'Oppenheimer',
    description: 'Câu chuyện về J. Robert Oppenheimer - nhà vật lý người Mỹ đóng vai trò then chốt trong việc phát triển bom nguyên tử đầu tiên.',
    descriptionEN: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during the Manhattan Project.",
    duration: 180,
    genre: ['Biography', 'Drama', 'History'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(28),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/ixLH2iM9at8BbuLr5wQWnCfwhJO.jpg',
    trailerUrl: 'https://www.youtube.com/embed/uYPbbEG8y0g',
    rating: 'T18',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    status: 'now-showing',
  },
  {
    title: 'Barbie',
    titleEN: 'Barbie',
    description: 'Barbie sống trong thế giới hoàn hảo Barbieland bỗng dưng phải đối mặt với những khủng hoảng hiện sinh và bắt đầu hành trình vào thế giới thực.',
    descriptionEN: 'Barbie suffers a crisis that leads her to question her world, and she sets off on a journey into the real world.',
    duration: 114,
    genre: ['Comedy', 'Family', 'Fantasy'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(25),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/sO3V9AgFsdo9jzf8th4HQiOjGJA.jpg',
    trailerUrl: 'https://www.youtube.com/embed/pBk4NYhWNMM',
    rating: 'T13',
    director: 'Greta Gerwig',
    cast: ['Margot Robbie', 'Ryan Gosling', 'America Ferrera', 'Kate McKinnon'],
    status: 'now-showing',
  },
  {
    title: 'Top Gun: Maverick',
    titleEN: 'Top Gun: Maverick',
    description: 'Sau hơn 30 năm phục vụ, Pete "Maverick" Mitchell trở lại huấn luyện thế hệ phi công trẻ của Top Gun cho một nhiệm vụ đặc biệt.',
    descriptionEN: 'After more than 30 years of service, Pete "Maverick" Mitchell returns to train a group of Top Gun graduates for a specialized mission.',
    duration: 130,
    genre: ['Action', 'Drama'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(21),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/yuY9mNG8EgYBwDZKH4RFJHRoAUp.jpg',
    trailerUrl: 'https://www.youtube.com/embed/giXcoYkqwYY',
    rating: 'T13',
    director: 'Joseph Kosinski',
    cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm'],
    status: 'now-showing',
  },
  {
    title: 'The Batman',
    titleEN: 'The Batman',
    description: 'Batman bước vào năm thứ hai làm người bảo vệ Gotham, buộc phải điều tra tội ác gây ra bởi kẻ giết người hàng loạt tên Riddler.',
    descriptionEN: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City while investigating killings by the Riddler.',
    duration: 176,
    genre: ['Action', 'Crime', 'Drama', 'Mystery'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(18),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/nMp4tu8XuVG3CSWdXTFiHLdngnc.jpg',
    trailerUrl: 'https://www.youtube.com/embed/mqqft2x_Aa4',
    rating: 'T16',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Jeffrey Wright'],
    status: 'now-showing',
  },
  {
    title: 'Guardians of the Galaxy Vol. 3',
    titleEN: 'Guardians of the Galaxy Vol. 3',
    description: 'Peter Quill và nhóm Guardians lên đường bảo vệ Rocket trước quá khứ bí ẩn của anh.',
    descriptionEN: "Peter Quill rallies his team to defend Rocket from his past in a journey that challenges the Guardians to their limits.",
    duration: 150,
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(16),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/Ak5hAxorxMpxKoVw5e3kGfxs7sY.jpg',
    trailerUrl: 'https://www.youtube.com/embed/u3V5KDHRQVk',
    rating: 'T13',
    director: 'James Gunn',
    cast: ['Chris Pratt', 'Zoe Saldana', 'Dave Bautista', 'Karen Gillan'],
    status: 'now-showing',
  },
  {
    title: 'Avatar: The Way of Water',
    titleEN: 'Avatar: The Way of Water',
    description: 'Jake Sully và Neytiri cùng gia đình phải rời bỏ ngôi nhà và khám phá các vùng đất của Pandora.',
    descriptionEN: 'Jake Sully and Neytiri form a family and do what it takes to stay together when trouble resurfaces.',
    duration: 192,
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(14),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/1evaZLXsSMJhVFzncZbLzyxUyCx.jpg',
    trailerUrl: 'https://www.youtube.com/embed/d9MyW72ELq0',
    rating: 'T13',
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
    status: 'now-showing',
  },
  {
    title: 'Mission: Impossible – Dead Reckoning Part One',
    titleEN: 'Mission: Impossible – Dead Reckoning Part One',
    description: 'Ethan Hunt và đội IMF phải truy đuổi một vũ khí có thể đe dọa toàn nhân loại.',
    descriptionEN: 'Ethan Hunt and the IMF team race against time to track down a terrifying new weapon that threatens all of humanity.',
    duration: 163,
    genre: ['Action', 'Adventure', 'Thriller'],
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: pastDays(7),
    posterUrl: 'https://image.tmdb.org/t/p/w1280/eoLBADTttXo4HJLLUK9amxE4RRM.jpg',
    trailerUrl: 'https://www.youtube.com/embed/2m1drlTOsdY',
    rating: 'T13',
    director: 'Christopher McQuarrie',
    cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames', 'Simon Pegg'],
    status: 'now-showing',
  },
];

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    let added = 0;
    let skipped = 0;

    for (const movie of missingMovies) {
      const exists = await Movie.findOne({ title: movie.title }).lean();
      if (exists) {
        // Update status to now-showing and releaseDate
        await Movie.findByIdAndUpdate(exists._id, {
          status: 'now-showing',
          releaseDate: movie.releaseDate,
        });
        console.log(`🔄 Cập nhật: "${movie.title}" → now-showing`);
        skipped++;
      } else {
        await Movie.create(movie);
        console.log(`✅ Thêm mới: "${movie.title}"`);
        added++;
      }
    }

    console.log(`\n🎉 Hoàn tất! Thêm mới: ${added} phim | Cập nhật: ${skipped} phim.`);

    // Run refresh-showtimes to create showtimes for the new movies
    console.log('\n⏰ Chạy lại refresh-showtimes để tạo lịch chiếu...');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
};

run();
