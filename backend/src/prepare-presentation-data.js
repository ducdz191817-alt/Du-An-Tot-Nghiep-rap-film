/**
 * prepare-presentation-data.js
 *
 * Script tổng hợp toàn diện chuẩn bị dữ liệu cho buổi thuyết trình 01/09:
 * 1. Không có phim "ended" - Tất cả phim có thể chiếu đều được set là `now-showing` (Đang chiếu),
 *    cùng với `coming-soon` (Sắp chiếu) và `pre-release` (Sắp ra mắt).
 * 2. Cài đặt ghế bảo trì (isDisabled: true) theo CẶP ở góc (A1, A2) để KHÔNG TẠO GHẾ MỒ CÔI.
 * 3. Tạo lịch chiếu dày đặc cho TẤT CẢ 25+ phim đang chiếu trong 7-8 ngày tới.
 * 4. Gắn ghế đã đặt (bookedSeats) TUÂN THỦ 100% NGUYÊN TẮC CHỐNG GHẾ MỒ CÔI:
 *    - Không bao giờ để lại đúng 1 ghế trống lẻ loi ở cạnh tường, lối đi hoặc giữa các ghế đã đặt.
 *    - Đặt theo cụm cân xứng chuẩn rạp: 2 ghế giữa (3,4 / 5,6) hoặc từ vị trí chẵn đến hết hàng.
 * 5. Thêm review / đánh giá kèm phản hồi của Admin.
 * 6. Tạo các đơn đặt vé đã thanh toán (paid bookings & payments) cho tất cả phim để tổng hợp doanh thu.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Movie = require('./models/Movie.model');
const Theater = require('./models/Theater.model');
const Room = require('./models/Room.model');
const Seat = require('./models/Seat.model');
const Showtime = require('./models/Showtime.model');
const Booking = require('./models/Booking.model');
const Payment = require('./models/Payment.model');
const Review = require('./models/Review.model');
const User = require('./models/User.model');
const Concession = require('./models/Concession.model');

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const TIME_SLOTS = [
  { hour: 8, minute: 30 },
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

const PAYMENT_METHODS = ['vietqr', 'vnpay', 'momo', 'card', 'cash'];

/**
 * Sinh danh sách ghế đã đặt hợp lệ cho một phòng chiếu (KHÔNG TẠO GHẾ MỒ CÔI)
 * @param {Array} roomSeats - Danh sách ghế của phòng
 * @param {number} patternType - Biến thể mẫu (0..4)
 */
const generateValidBookedSeats = (roomSeats, patternType = 0) => {
  // Gom nhóm ghế theo hàng
  const rows = {};
  roomSeats.forEach((s) => {
    if (!rows[s.row]) rows[s.row] = [];
    rows[s.row].push(s);
  });

  const booked = [];

  // Duyệt qua các hàng ghế chính (C, D, E, F)
  const targetRows = ['C', 'D', 'E', 'F'].filter((r) => rows[r] && rows[r].length > 0);

  targetRows.forEach((rowKey, idx) => {
    const rowList = rows[rowKey]
      .filter((s) => !s.isDisabled && s.type !== 'couple')
      .sort((a, b) => a.number - b.number);

    const len = rowList.length;
    if (len < 4) return;

    const variant = (patternType + idx) % 4;

    if (len === 6) {
      // Hàng 6 ghế: [1, 2, 3, 4, 5, 6]
      if (variant === 0) {
        // Đặt [3, 4] -> Còn [1, 2] (2 ghế) và [5, 6] (2 ghế) -> HỢP LỆ
        booked.push(`${rowKey}3`, `${rowKey}4`);
      } else if (variant === 1) {
        // Đặt [4, 5, 6] -> Còn [1, 2, 3] (3 ghế) -> HỢP LỆ
        booked.push(`${rowKey}4`, `${rowKey}5`, `${rowKey}6`);
      } else if (variant === 2) {
        // Đặt [3, 4, 5, 6] -> Còn [1, 2] (2 ghế) -> HỢP LỆ
        booked.push(`${rowKey}3`, `${rowKey}4`, `${rowKey}5`, `${rowKey}6`);
      } else {
        // Đặt [1, 2, 3] -> Còn [4, 5, 6] (3 ghế) -> HỢP LỆ
        booked.push(`${rowKey}1`, `${rowKey}2`, `${rowKey}3`);
      }
    } else if (len === 10) {
      // Hàng 10 ghế: [1..10]
      if (variant === 0) {
        // Đặt [4, 5, 6, 7] -> Còn [1, 2, 3] (3) và [8, 9, 10] (3) -> HỢP LỆ
        booked.push(`${rowKey}4`, `${rowKey}5`, `${rowKey}6`, `${rowKey}7`);
      } else if (variant === 1) {
        // Đặt [5, 6] -> Còn [1..4] (4) và [7..10] (4) -> HỢP LỆ
        booked.push(`${rowKey}5`, `${rowKey}6`);
      } else if (variant === 2) {
        // Đặt [3, 4, 5, 6, 7, 8] -> Còn [1, 2] (2) và [9, 10] (2) -> HỢP LỆ
        booked.push(`${rowKey}3`, `${rowKey}4`, `${rowKey}5`, `${rowKey}6`, `${rowKey}7`, `${rowKey}8`);
      } else {
        // Đặt [7, 8, 9, 10] -> Còn [1..6] (6) -> HỢP LỆ
        booked.push(`${rowKey}7`, `${rowKey}8`, `${rowKey}9`, `${rowKey}10`);
      }
    } else if (len === 12) {
      // Hàng 12 ghế: [1..12]
      if (variant === 0) {
        // Đặt [5, 6, 7, 8] -> Còn [1..4] (4) và [9..12] (4) -> HỢP LỆ
        booked.push(`${rowKey}5`, `${rowKey}6`, `${rowKey}7`, `${rowKey}8`);
      } else if (variant === 1) {
        // Đặt [4, 5, 6, 7, 8, 9] -> Còn [1..3] (3) và [10..12] (3) -> HỢP LỆ
        booked.push(`${rowKey}4`, `${rowKey}5`, `${rowKey}6`, `${rowKey}7`, `${rowKey}8`, `${rowKey}9`);
      } else if (variant === 2) {
        // Đặt [6, 7] -> Còn [1..5] (5) và [8..12] (5) -> HỢP LỆ
        booked.push(`${rowKey}6`, `${rowKey}7`);
      } else {
        // Đặt [3, 4, 5, 6] -> Còn [1, 2] (2) và [7..12] (6) -> HỢP LỆ
        booked.push(`${rowKey}3`, `${rowKey}4`, `${rowKey}5`, `${rowKey}6`);
      }
    }
  });

  return booked;
};

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected to MongoDB!\n');

    // ──────────────────────────────────────────────────────────────────────────
    // 1. CẬP NHẬT TRẠNG THÁI PHIM (CHỈ CÓ NOW-SHOWING, COMING-SOON, PRE-RELEASE)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🎬 1. Đang cập nhật trạng thái phim (Không có ended)...');

    const allMovies = await Movie.find();
    if (allMovies.length === 0) {
      console.log('❌ Không tìm thấy phim nào trong database!');
      process.exit(1);
    }

    const comingSoonTitles = [
      'Lilo & Stitch',
      'Minecraft: The Movie',
      'Thunderbolts',
      'Wicked',
      'Moana 2',
      'Alien: Romulus',
      'Twisters'
    ];

    const preReleaseTitles = [
      'Superman: Legacy',
      'Jurassic World: Rebirth',
      'Cám',
      'Joker: Folie à Deux',
      'Transformers One',
      'A Quiet Place: Day One'
    ];

    const now = new Date();

    for (const movie of allMovies) {
      const title = movie.title;
      let status = 'now-showing';
      let releaseDate = new Date(now);

      if (comingSoonTitles.some((t) => title.toLowerCase().includes(t.toLowerCase()))) {
        status = 'coming-soon';
        releaseDate.setDate(now.getDate() + randInt(4, 14));
      } else if (preReleaseTitles.some((t) => title.toLowerCase().includes(t.toLowerCase()))) {
        status = 'pre-release';
        releaseDate.setDate(now.getDate() + randInt(25, 55));
      } else {
        status = 'now-showing';
        releaseDate.setDate(now.getDate() - randInt(5, 25));
      }

      await Movie.findByIdAndUpdate(movie._id, {
        status,
        releaseDate,
      });
    }

    const movieCountStats = await Movie.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    console.log('   ✔ Thống kê trạng thái phim sau khi cập nhật:', movieCountStats);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. CÀI ĐẶT GHẾ BẢO TRÌ (isDisabled: true) - LUÔN THEO CẶP ĐỂ KHÔNG TẠO GHẾ MỒ CÔI
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n💺 2. Cài đặt ghế bảo trì theo cặp ở góc phòng (Không tạo ghế mồ côi)...');
    const rooms = await Room.find();

    // Reset tất cả ghế về isDisabled = false trước
    await Seat.updateMany({}, { isDisabled: false });

    let disabledCount = 0;
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      // Luôn khóa 2 ghế đầu hàng A: A1, A2 (hoặc ghế đôi B1 ở phòng couple) để đảm bảo không để lại 1 ghế mồ côi
      const targetSeats = room.type === 'GOLDCLASS'
        ? [{ row: 'B', number: 1 }]
        : [{ row: 'A', number: 1 }, { row: 'A', number: 2 }];

      for (const ts of targetSeats) {
        const res = await Seat.updateOne({ room: room._id, row: ts.row, number: ts.number }, { isDisabled: true });
        if (res.modifiedCount > 0) disabledCount++;
      }
    }
    console.log(`   ✔ Đã thiết lập ${disabledCount} ghế ở trạng thái Bảo trì theo cặp chuẩn rạp.`);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. TẠO LỊCH CHIẾU & GHẾ ĐÃ ĐẶT CHUẨN XÁC (KHÔNG GHẾ MỒ CÔI)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n📅 3. Đang tạo lịch chiếu chi tiết và gắn ghế đã đặt hợp lệ...');

    await Showtime.deleteMany({});
    console.log('   ✔ Đã dọn dẹp lịch chiếu cũ.');

    const nowShowingMovies = await Movie.find({ status: 'now-showing' });
    const allRooms = await Room.find().populate('theater');

    // Lấy trước tất cả ghế theo roomId để sinh ghế đặt chính xác
    const seatsByRoom = {};
    for (const r of allRooms) {
      seatsByRoom[r._id.toString()] = await Seat.find({ room: r._id }).lean();
    }

    const showtimesToInsert = [];

    // A. Suất chiếu quá khứ (45 ngày qua)
    for (let d = 45; d >= 1; d--) {
      const baseDate = new Date(now);
      baseDate.setDate(baseDate.getDate() - d);

      for (const room of allRooms) {
        const theaterId = room.theater?._id || room.theater;
        for (const slot of [TIME_SLOTS[1], TIME_SLOTS[3], TIME_SLOTS[5]]) {
          const startTime = new Date(baseDate);
          startTime.setHours(slot.hour, slot.minute, 0, 0);

          const movie = pick(nowShowingMovies);
          const duration = movie.duration || 120;
          const endTime = addMinutes(startTime, duration + 15);
          const format = room.type || '2D';
          const price = PRICES[format] || 90000;

          showtimesToInsert.push({
            movie: movie._id,
            theater: theaterId,
            room: room._id,
            startTime,
            endTime,
            ticketPrice: price,
            format,
            bookedSeats: [],
          });
        }
      }
    }

    // B. Suất chiếu tương lai (Từ hôm nay đến 7 ngày tới)
    const roomSchedule = {};
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
    let patternCounter = 0;

    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const baseDate = new Date(now);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      baseDate.setHours(0, 0, 0, 0);
      const dateStr = baseDate.toISOString().slice(0, 10);

      for (const room of allRooms) {
        const theaterId = room.theater?._id || room.theater;
        const roomSeats = seatsByRoom[room._id.toString()] || [];

        for (const slot of TIME_SLOTS) {
          const startTime = new Date(baseDate);
          startTime.setHours(slot.hour, slot.minute, 0, 0);

          const movie = nowShowingMovies[movieIndex % nowShowingMovies.length];
          movieIndex++;

          const duration = movie.duration || 120;
          const endTime = addMinutes(startTime, duration + 15);

          if (!hasConflict(room._id.toString(), dateStr, startTime, endTime)) {
            markUsed(room._id.toString(), dateStr, startTime, endTime);
            const format = room.type || '2D';
            const price = PRICES[format] || 90000;

            // Sinh ghế đã đặt tuân thủ 100% quy tắc chống ghế mồ côi
            const validBooked = generateValidBookedSeats(roomSeats, patternCounter);
            patternCounter++;

            showtimesToInsert.push({
              movie: movie._id,
              theater: theaterId,
              room: room._id,
              startTime,
              endTime,
              ticketPrice: price,
              format,
              bookedSeats: validBooked,
            });
          }
        }
      }
    }

    const insertedShowtimes = await Showtime.insertMany(showtimesToInsert);
    console.log(`   ✔ Đã tạo thành công ${insertedShowtimes.length} suất chiếu với ghế đặt chuẩn quy tắc rạp.`);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. TẠO CÁC ĐƠN ĐẶT VÉ ĐÃ THANH TOÁN (PAID BOOKINGS) CHO TẤT CẢ PHIM
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n💰 4. Đang tạo các đơn đặt vé đã thanh toán (Paid Bookings) cho tất cả phim...');

    await Booking.deleteMany({});
    await Payment.deleteMany({});

    const regularUsers = await User.find({ role: 'user' });
    const adminUser = await User.findOne({ role: 'admin' });
    const concessions = await Concession.find();

    const populatedShowtimes = await Showtime.find().populate('movie').populate('room').populate('theater');

    const targetRevenueMap = {
      'Avengers: Secret Wars': 55000000,
      'Deadpool & Wolverine': 38000000,
      'Inside Out 2': 32000000,
      'Dune: Part Two': 28000000,
      'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2': 22000000,
      'Kung Fu Panda 4': 16000000,
      'Oppenheimer': 15000000,
      'Avatar: The Way of Water': 14000000,
      'Spider-Man: No Way Home': 13000000,
      'The Wild Robot': 11000000,
      'Venom: The Last Dance': 10500000,
      'Thor: Love and Thunder': 9500000,
      'Top Gun: Maverick': 9000000,
      'The Batman': 8500000,
      'Guardians of the Galaxy Vol. 3': 8000000,
      'Barbie': 7500000,
      'Doctor Strange in the Multiverse of Madness': 7000000,
      'Spirited Away': 6500000,
      'Black Panther: Wakanda Forever': 6000000,
      'Shang-Chi and the Legend of the Ten Rings': 5500000,
      'Fast X': 5000000,
      'Encanto': 4800000,
      'Mission: Impossible – Dead Reckoning Part One': 4500000,
      'Eternals': 4200000,
      'Tàu Buôn Người': 4000000,
    };

    const bookingsToInsert = [];
    const paymentsToInsert = [];

    const showtimesByMovie = {};
    for (const st of populatedShowtimes) {
      if (!st.movie) continue;
      const mId = st.movie._id.toString();
      if (!showtimesByMovie[mId]) showtimesByMovie[mId] = [];
      showtimesByMovie[mId].push(st);
    }

    for (const movie of nowShowingMovies) {
      const mId = movie._id.toString();
      const stList = showtimesByMovie[mId];
      if (!stList || stList.length === 0) continue;

      let targetRev = 4500000;
      for (const [keyTitle, valRev] of Object.entries(targetRevenueMap)) {
        if (movie.title.toLowerCase().includes(keyTitle.toLowerCase())) {
          targetRev = valRev;
          break;
        }
      }

      let currentRev = 0;
      let orderIndex = 0;

      while (currentRev < targetRev && orderIndex < 40) {
        const st = pick(stList);
        const user = pick(regularUsers) || adminUser;

        // Chọn cặp ghế liền kề chuẩn
        const row = pick(['C', 'D', 'E', 'F']);
        const seatStart = pick([3, 5]);
        const seatCount = 2; // Đặt theo cặp 2 ghế
        const seats = [`${row}${seatStart}`, `${row}${seatStart + 1}`];

        const seatPrice = st.ticketPrice || 90000;
        const seatDetails = seats.map((s) => ({
          seatCode: s,
          type: st.room?.type === 'GOLDCLASS' ? 'vip' : 'standard',
          price: seatPrice,
          extraPrice: 0,
        }));

        const orderConcessions = [];
        let concessionCost = 0;
        if (concessions.length > 0 && Math.random() > 0.4) {
          const conc = pick(concessions);
          const qty = randInt(1, 2);
          orderConcessions.push({ concession: conc._id, quantity: qty });
          concessionCost += (conc.price || 50000) * qty;
        }

        const totalPrice = (seatPrice * seatCount) + concessionCost;
        currentRev += totalPrice;
        orderIndex++;

        let bookingDate = new Date(st.startTime);
        bookingDate.setHours(bookingDate.getHours() - randInt(2, 48));
        if (bookingDate > now) {
          bookingDate = new Date(now.getTime() - randInt(10, 300) * 60000);
        }

        const isPastShowtime = new Date(st.endTime) <= now;
        const isCheckedIn = isPastShowtime ? true : Math.random() > 0.6;
        const ticketStatus = isCheckedIn ? 'checked_in' : 'issued';

        const bookingId = new mongoose.Types.ObjectId();
        const yy = String(bookingDate.getFullYear()).slice(-2);
        const mm = String(bookingDate.getMonth() + 1).padStart(2, '0');
        const dd = String(bookingDate.getDate()).padStart(2, '0');
        const suffix = String(bookingId).slice(-4).toUpperCase();
        const ticketCode = `TKT-${yy}${mm}${dd}-${suffix}`;

        const bookingDoc = {
          _id: bookingId,
          user: user._id,
          showtime: st._id,
          seats,
          seatDetails,
          concessions: orderConcessions,
          totalPrice,
          paymentStatus: 'paid',
          paymentMethod: pick(PAYMENT_METHODS),
          bookingDate,
          movieTitle: movie.title,
          moviePosterUrl: movie.posterUrl || '',
          ticketCode,
          ticketStatus,
          isCheckedIn,
          checkedInAt: isCheckedIn ? bookingDate : null,
          checkedInBy: isCheckedIn ? 'Admin Cinema' : null,
          isPrinted: isCheckedIn,
          printCount: isCheckedIn ? 1 : 0,
          printedAt: isCheckedIn ? bookingDate : null,
          createdAt: bookingDate,
          updatedAt: bookingDate,
        };

        bookingsToInsert.push(bookingDoc);

        paymentsToInsert.push({
          booking: bookingId,
          paymentMethod: bookingDoc.paymentMethod,
          amount: totalPrice,
          status: 'completed',
          transactionId: `TXN${bookingDate.getTime()}${orderIndex}`,
          paymentDate: bookingDate,
          createdAt: bookingDate,
          updatedAt: bookingDate,
        });
      }
    }

    const insertedBookings = await Booking.insertMany(bookingsToInsert);
    await Payment.insertMany(paymentsToInsert);

    const totalSystemRevenue = bookingsToInsert.reduce((sum, b) => sum + b.totalPrice, 0);
    console.log(`   ✔ Đã tạo ${insertedBookings.length} đơn đặt vé hoàn tất.`);
    console.log(`   💰 Tổng doanh thu toàn hệ thống: ${totalSystemRevenue.toLocaleString('vi-VN')} đ`);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. THÊM ĐÁNH GIÁ (REVIEWS) VÀ PHẢN HỒI QUẢN TRỊ VIÊN (ADMIN REPLY)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n⭐ 5. Đang thêm các đánh giá và phản hồi Admin...');

    await Review.deleteMany({});

    const reviewSamples = [
      {
        rating: 5,
        comment: 'Phim cực đỉnh! Kỹ xảo và âm thanh phòng chiếu IMAX tại Nova Cinema xem vô cùng mãn nhãn, hiệu ứng rung chuyển chân thực. Sẽ quay lại ủng hộ!',
        adminReply: 'Nova Cinema cảm ơn bạn rất nhiều! Rất vui vì bạn đã có trải nghiệm tuyệt vời với phòng chiếu IMAX của rạp. Hẹn gặp lại bạn ở các suất chiếu tiếp theo nhé! ❤️',
      },
      {
        rating: 5,
        comment: 'Diễn xuất của các nhân vật quá xuất sắc, cốt truyện cảm động và sâu sắc. Bắp phô mai nóng giòn ngon lắm ạ.',
        adminReply: 'Cảm ơn bạn đã yêu thích cả bộ phim lẫn bắp nước của Nova Cinema! Chúc bạn có những phút giây thư giãn tuyệt vời!',
      },
      {
        rating: 5,
        comment: 'Hình ảnh đẹp đến từng khung hình, âm nhạc lôi cuốn từ đầu đến cuối. Ghế VIP ngồi rất êm ái và thoải mái.',
        adminReply: 'Nova Cinema rất trân trọng đánh giá tích cực của bạn. Sự hài lòng của bạn là động lực lớn nhất của đội ngũ nhân viên chúng tôi!',
      },
      {
        rating: 4,
        comment: 'Phim giải trí tốt, hành động dồn dập, hài hước duyên dáng. Nhân viên soát vé thân thiện và nhiệt tình hướng dẫn.',
        adminReply: 'Cảm ơn góp ý quý báu của bạn! Nova Cinema sẽ tiếp tục nâng cao chất lượng dịch vụ để mang tới trải nghiệm 5 sao cho bạn.',
      },
      {
        rating: 5,
        comment: 'Xem suất chiếu muộn nhưng rạp phục vụ rất chu đáo. Không gian sạch sẽ, màn chiếu lớn sáng rõ nét.',
        adminReply: 'Cảm ơn bạn đã đồng hành cùng Nova Cinema ngay cả trong những suất chiếu muộn. Chúc bạn một ngày tràn đầy năng lượng!',
      },
      {
        rating: 4,
        comment: 'Một trong những bộ phim đáng xem nhất năm nay. Đoạn kết rất cảm xúc. Rạp điều hòa mát mẻ, dịch vụ chuyên nghiệp.',
        adminReply: 'Nova Cinema cảm ơn bạn đã ghé thăm và để lại đánh giá tốt cho rạp!',
      },
      {
        rating: 5,
        comment: 'Phim siêu phẩm không có điểm nào để chê! Mọi chi tiết đều được chăm chút tỉ mỉ. 10/10 điểm!',
        adminReply: 'Cảm ơn bạn đã dành tình cảm đặc biệt cho bộ phim và Nova Cinema!',
      }
    ];

    const reviewsToInsert = [];
    const reviewedMovieUsers = new Set();

    for (let i = 0; i < nowShowingMovies.length; i++) {
      const movie = nowShowingMovies[i];
      const numReviews = randInt(2, 3);
      for (let j = 0; j < numReviews; j++) {
        const user = regularUsers[(i + j) % regularUsers.length];
        const key = `${user._id}_${movie._id}`;
        if (reviewedMovieUsers.has(key)) continue;
        reviewedMovieUsers.add(key);

        const sample = pick(reviewSamples);
        const reviewDate = new Date(now);
        reviewDate.setDate(reviewDate.getDate() - randInt(1, 15));

        const reviewDoc = {
          user: user._id,
          movie: movie._id,
          rating: sample.rating,
          comment: sample.comment,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        };

        if (sample.adminReply && adminUser) {
          const replyDate = new Date(reviewDate);
          replyDate.setHours(replyDate.getHours() + randInt(1, 12));
          reviewDoc.adminReply = {
            comment: sample.adminReply,
            repliedBy: adminUser._id,
            repliedAt: replyDate,
          };
        }

        reviewsToInsert.push(reviewDoc);
      }
    }

    const insertedReviews = await Review.insertMany(reviewsToInsert);
    console.log(`   ✔ Đã tạo ${insertedReviews.length} đánh giá kèm phản hồi Admin.`);

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC CẬP NHẬT TUÂN THỦ NGUYÊN TẮC RẠP!');
    console.log('================================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

run();
