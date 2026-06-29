/**
 * Script: fix-duplicate-showtimes.js
 * Mục đích: Tìm và xóa các suất chiếu trùng lặp trong cùng một phòng chiếu
 * Chạy: node src/fix-duplicate-showtimes.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/movie_ticket_booking';

const ShowtimeSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  startTime: Date,
  endTime: Date,
  ticketPrice: Number,
  format: String,
  bookedSeats: [String],
}, { timestamps: true });

const Showtime = mongoose.model('Showtime', ShowtimeSchema);

async function fixDuplicates() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Kết nối MongoDB thành công\n');

  // Lấy tất cả suất chiếu, nhóm theo phòng
  const showtimes = await Showtime.find().sort({ room: 1, startTime: 1 });
  console.log(`📋 Tổng số suất chiếu: ${showtimes.length}`);

  const duplicatesToDelete = new Set();
  const byRoom = {};

  // Nhóm theo phòng
  for (const st of showtimes) {
    const roomKey = st.room.toString();
    if (!byRoom[roomKey]) byRoom[roomKey] = [];
    byRoom[roomKey].push(st);
  }

  // Kiểm tra từng phòng
  let conflictCount = 0;
  for (const [roomId, roomSts] of Object.entries(byRoom)) {
    for (let i = 0; i < roomSts.length; i++) {
      for (let j = i + 1; j < roomSts.length; j++) {
        const a = roomSts[i];
        const b = roomSts[j];

        // Kiểm tra overlap: a bắt đầu trước khi b kết thúc VÀ a kết thúc sau khi b bắt đầu
        const aStart = new Date(a.startTime);
        const aEnd = new Date(a.endTime);
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);

        if (aStart < bEnd && aEnd > bStart) {
          conflictCount++;
          console.log(`\n⚠️  XUNG ĐỘT trong phòng ${roomId}:`);
          console.log(`   Suất A: ${aStart.toLocaleString('vi-VN')} → ${aEnd.toLocaleString('vi-VN')} (ID: ${a._id})`);
          console.log(`   Suất B: ${bStart.toLocaleString('vi-VN')} → ${bEnd.toLocaleString('vi-VN')} (ID: ${b._id})`);
          console.log(`   → Giữ lại suất A, XÓA suất B`);
          // Xóa suất chiếu sau (b) - giữ lại suất đầu tiên (a)
          duplicatesToDelete.add(b._id.toString());
        }
      }
    }
  }

  if (duplicatesToDelete.size === 0) {
    console.log('\n✅ Không tìm thấy suất chiếu trùng lặp nào!');
  } else {
    console.log(`\n🗑️  Tìm thấy ${duplicatesToDelete.size} suất chiếu bị trùng cần xóa...`);
    const result = await Showtime.deleteMany({
      _id: { $in: Array.from(duplicatesToDelete).map(id => new mongoose.Types.ObjectId(id)) }
    });
    console.log(`✅ Đã xóa ${result.deletedCount} suất chiếu trùng lặp.`);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Đã ngắt kết nối MongoDB.');
}

fixDuplicates().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
