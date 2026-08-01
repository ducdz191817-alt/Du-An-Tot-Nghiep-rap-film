require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie.model');

const fixPreviewStatus = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking');
    console.log('Connected!');

    const result = await Movie.updateMany(
      { status: 'preview' },
      { $set: { status: 'coming-soon' } }
    );

    console.log(`Đã chuyển ${result.modifiedCount} phim từ 'preview' (chiếu sớm) sang 'coming-soon' (sắp chiếu).`);
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi cập nhật:', err);
    process.exit(1);
  }
};

fixPreviewStatus();
