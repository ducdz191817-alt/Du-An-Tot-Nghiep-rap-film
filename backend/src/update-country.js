require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');

// Dictionary tra cứu quốc gia chính xác theo tiêu đề phim
const COUNTRY_MAP = {
  // Mỹ / Hollywood
  'Joker: Folie à Deux': 'Mỹ',
  'Cám': 'Việt Nam',
  'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2': 'Việt Nam',
  'Tôi Thấy Hoa Vàng Trên Cỏ Xanh': 'Việt Nam',
  'Mai': 'Việt Nam',
  'Lật Mặt 7: Một Điều Ước': 'Việt Nam',
  'Lật Mặt': 'Việt Nam',
  'Đất Rừng Phương Nam': 'Việt Nam',
  'Nhà Bà Nữ': 'Việt Nam',
  'Bố Già': 'Việt Nam',
  'Em Và Trịnh': 'Việt Nam',
  'Siêu Lừa Gặp Siêu Lầy': 'Việt Nam',
  'Quả Tim Máu': 'Việt Nam',

  // Nhật Bản
  'Spirited Away': 'Nhật Bản',
  'Suzume': 'Nhật Bản',
  'Your Name': 'Nhật Bản',
  'Weathering With You': 'Nhật Bản',
  'Doraemon: Nobita và Bản Tình Ca Địa Cầu': 'Nhật Bản',
  'Conan: Ngôi Sao 5 Cánh 1 Triệu Đô': 'Nhật Bản',
  'Godzilla Minus One': 'Nhật Bản',

  // Hàn Quốc
  'Exhuma: Quật Mộ Trùng Phùng': 'Hàn Quốc',
  'Exhuma': 'Hàn Quốc',
  'Parasite': 'Hàn Quốc',
  'Train to Busan': 'Hàn Quốc',
  'Bà Thím Báo Thù': 'Hàn Quốc',
  'Chàng Nữ Phi Công': 'Hàn Quốc',

  // Trung Quốc / Hồng Kông
  'Ip Man': 'Trung Quốc',
  'Thần Thoại': 'Trung Quốc',

  // Anh / Pháp / Quốc gia khác nếu có
  'Paddington': 'Anh',
};

// Hàm đoán quốc gia nếu không có trong từ điển
const detectCountry = (title) => {
  if (COUNTRY_MAP[title]) return COUNTRY_MAP[title];

  // Kiểm tra từ khóa từ điển
  for (const [key, country] of Object.entries(COUNTRY_MAP)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return country;
    }
  }

  // Tiếng Việt -> Việt Nam
  if (/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(title)) {
    return 'Việt Nam';
  }

  // Mặc định cho phim Hollywood (Marvel, DC, Disney, Warner Bros, Universal, Paramount...) -> Mỹ
  return 'Mỹ';
};

const updateCountries = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking');
    console.log('✅ Connected!');

    const movies = await Movie.find();
    console.log(`🎬 Tìm thấy tổng cộng ${movies.length} phim trong DB.`);

    let count = 0;
    for (const movie of movies) {
      const country = detectCountry(movie.title);

      await Movie.findByIdAndUpdate(movie._id, { country });
      console.log(`✅ [${country.padEnd(10)}] ${movie.title}`);
      count++;
    }

    console.log(`\n====================================`);
    console.log(`🎉 Đã cập nhật quốc gia thành công cho ${count} bộ phim!`);
    console.log(`====================================`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
};

updateCountries();
