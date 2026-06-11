require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Import existing models ───────────────────────────────────────────────────
const Movie = require('./models/Movie.model');
const Theater = require('./models/Theater.model');
const Room = require('./models/Room.model');
const Seat = require('./models/Seat.model');
const Showtime = require('./models/Showtime.model');
const Concession = require('./models/Concession.model');
const Booking = require('./models/Booking.model');
const Payment = require('./models/Payment.model');
const User = require('./models/User.model');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60000);

const futureDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const pastDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

// ─── Main seed function ───────────────────────────────────────────────────────
const seedData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    // ── 1. Clear all collections ─────────────────────────────────────────────
    console.log('🗑️  Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theater.deleteMany({}),
      Room.deleteMany({}),
      Seat.deleteMany({}),
      Showtime.deleteMany({}),
      Concession.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    console.log('✅ Old data cleared.\n');

    // ── 2. Users ─────────────────────────────────────────────────────────────
    console.log('👤 Creating Users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      {
        username: 'Admin Nova',
        email: 'admin@nova.com',
        password: hashedPassword,
        role: 'admin',
        phone: '0901111111',
      },
      {
        username: 'Staff HCM',
        email: 'staff.hcm@nova.com',
        password: hashedPassword,
        role: 'user',
        phone: '0902222222',
      },
      {
        username: 'Nguyễn Văn An',
        email: 'nguyenvanan@gmail.com',
        password: hashedPassword,
        role: 'user',
        phone: '0903333333',
      },
      {
        username: 'Trần Thị Bình',
        email: 'tranthib@gmail.com',
        password: hashedPassword,
        role: 'user',
        phone: '0904444444',
      },
      {
        username: 'Lê Hoàng Cường',
        email: 'lehoangcuong@gmail.com',
        password: hashedPassword,
        role: 'user',
        phone: '0905555555',
      },
      {
        username: 'Phạm Thị Dung',
        email: 'phamthidung@gmail.com',
        password: hashedPassword,
        role: 'user',
        phone: '0906666666',
      },
      {
        username: 'Võ Minh Đức',
        email: 'vominhduc@gmail.com',
        password: hashedPassword,
        role: 'user',
        phone: '0907777777',
      },
      {
        username: 'Đặng Quỳnh Như',
        email: 'dangquynhnhu@gmail.com',
        password: hashedPassword,
        role: 'user',
        phone: '0908888888',
      },
    ]);
    console.log(`   ✔ Created ${users.length} users`);

    const adminUser = users[0];
    const staffUser = users[1];
    const customerUsers = users.slice(2);

    // ── 3. Movies ─────────────────────────────────────────────────────────────
    console.log('\n🎬 Creating Movies...');
    const movies = await Movie.insertMany([
      // ─ NOW SHOWING ─
      {
        title: 'Avengers: Secret Wars',
        titleEN: 'Avengers: Secret Wars',
        description: 'Sau các sự kiện của Endgame, các anh hùng Marvel đối mặt với mối đe dọa lớn nhất từ trước đến nay khi các thực tại song song va chạm, buộc họ phải liên minh với những phiên bản khác của chính mình.',
        descriptionEN: 'Following the events of Endgame, the Marvel heroes face their greatest threat yet as parallel realities collide, forcing them to ally with alternate versions of themselves.',
        duration: 172,
        genre: ['Action', 'Sci-Fi', 'Adventure'],
        language: 'Tiếng Anh',
        releaseDate: pastDays(20),
        posterUrl: 'https://image.tmdb.org/t/p/original/8mjYkBTKdB0jS9BHxHJ6KYi7WiR.jpg',
        trailerUrl: 'https://www.youtube.com/embed/TcMBFSGVi1c',
        rating: 'T13',
        director: 'Joe Russo',
        cast: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson', 'Benedict Cumberbatch'],
        status: 'now-showing',
      },
      {
        title: 'Minecraft: The Movie',
        titleEN: 'Minecraft: The Movie',
        description: 'Bốn người lạ mặt và một thú mỏ vịt bất ngờ bị hút vào thế giới Minecraft đầy khối vuông và nguy hiểm. Họ phải học cách sinh tồn và tìm đường về nhà.',
        descriptionEN: 'Four misfits and a platypus find themselves pulled into the cubical and perilous world of Minecraft. They must learn to survive and find their way home.',
        duration: 101,
        genre: ['Adventure', 'Comedy', 'Family'],
        language: 'Tiếng Anh',
        releaseDate: pastDays(15),
        posterUrl: 'https://image.tmdb.org/t/p/original/cMgu69fFqxE8faBbFVhMhXDxnYS.jpg',
        trailerUrl: 'https://www.youtube.com/embed/iMqM6EoHOmk',
        rating: 'P',
        director: 'Jared Hess',
        cast: ['Jason Momoa', 'Jack Black', 'Emma Myers'],
        status: 'now-showing',
      },
      {
        title: 'Thunderbolts*',
        titleEN: 'Thunderbolts*',
        description: 'Một nhóm các nhân vật phản diện và anh hùng sa ngã của Marvel được tập hợp lại để thực hiện nhiệm vụ tối mật. Khi mọi thứ sụp đổ, họ phải lựa chọn giữa sứ mệnh và lương tâm.',
        descriptionEN: 'A group of reformed villains and fallen heroes from Marvel are assembled for a top-secret mission. When everything crumbles, they must choose between their directive and their conscience.',
        duration: 126,
        genre: ['Action', 'Adventure'],
        language: 'Tiếng Anh',
        releaseDate: pastDays(10),
        posterUrl: 'https://image.tmdb.org/t/p/original/m9EtP1iGSLzJJLP5sPdnXKWbHBO.jpg',
        trailerUrl: 'https://www.youtube.com/embed/d_R7eMHTBHg',
        rating: 'T13',
        director: 'Jake Schreier',
        cast: ['Florence Pugh', 'Sebastian Stan', 'David Harbour', 'Wyatt Russell'],
        status: 'now-showing',
      },
      {
        title: 'Lilo & Stitch',
        titleEN: 'Lilo & Stitch',
        description: 'Phiên bản live-action của bộ phim hoạt hình kinh điển Disney. Lilo, một cô bé Hawaii cô đơn, kết bạn với một sinh vật ngoài hành tinh tên Stitch và cùng nhau học về ý nghĩa của gia đình.',
        descriptionEN: 'Live-action adaptation of the classic Disney animated film. Lilo, a lonely Hawaiian girl, befriends an alien creature named Stitch, and together they learn the meaning of family.',
        duration: 108,
        genre: ['Family', 'Comedy', 'Sci-Fi'],
        language: 'Tiếng Anh',
        releaseDate: pastDays(5),
        posterUrl: 'https://image.tmdb.org/t/p/original/4YpLnX2JX4pVPhan4IM3nJJETEB.jpg',
        trailerUrl: 'https://www.youtube.com/embed/Q6DFiSI5wgo',
        rating: 'P',
        director: 'Dean Fleischer Camp',
        cast: ['Maia Kealoha', 'Sydney Agudong', 'Zach Galifianakis'],
        status: 'now-showing',
      },
      {
        title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2',
        titleEN: 'Yellow Flowers on the Green Grass 2',
        description: 'Tiếp nối câu chuyện tuổi thơ đong đầy cảm xúc, hai anh em Thiều và Tường trưởng thành hơn trong hành trình tìm kiếm bản thân giữa vùng quê yên bình miền Trung.',
        descriptionEN: 'Continuing the emotional childhood story, brothers Thieu and Tuong grow older in their journey to find themselves amidst the peaceful countryside of Central Vietnam.',
        duration: 118,
        genre: ['Drama', 'Family'],
        language: 'Tiếng Việt',
        releaseDate: pastDays(8),
        posterUrl: 'https://image.tmdb.org/t/p/original/bUFuFAhK6xyU9m5BIX3ECMy5p58.jpg',
        trailerUrl: 'https://www.youtube.com/embed/example1',
        rating: 'P',
        director: 'Victor Vũ',
        cast: ['Thái Hòa', 'Trấn Thành', 'Hồng Ánh'],
        status: 'now-showing',
      },
      // ─ COMING SOON ─
      {
        title: 'Superman: Legacy',
        titleEN: 'Superman: Legacy',
        description: 'James Gunn tái khởi động vũ trụ DC với câu chuyện về Superman trẻ tuổi Clark Kent, người đang cố gắng cân bằng di sản Krypton và cuộc sống con người trên Trái Đất.',
        descriptionEN: 'James Gunn reboots the DC Universe with the story of a young Superman, Clark Kent, as he strives to balance his Kryptonian heritage with his human upbringing on Earth.',
        duration: 135,
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'Tiếng Anh',
        releaseDate: futureDays(14),
        posterUrl: 'https://image.tmdb.org/t/p/original/74oqkKoNhMkJGQDhU0gGLAD7Qjr.jpg',
        trailerUrl: 'https://www.youtube.com/embed/f5a4KSHQJxg',
        rating: 'T13',
        director: 'James Gunn',
        cast: ['David Corenswet', 'Rachel Brosnahan', 'Nicholas Hoult'],
        status: 'coming-soon',
      },
      {
        title: 'Jurassic World: Rebirth',
        titleEN: 'Jurassic World: Rebirth',
        description: 'Năm năm sau thảm họa toàn cầu, ba nhóm người sống sót phải hợp tác để truy tìm mẫu ADN khủng long quý giá có thể cứu nhân loại. Nhưng những loài ăn thịt nguyên thủy nhất đang chờ đợi họ.',
        descriptionEN: 'Five years after a global disaster, three groups of survivors must cooperate to retrieve a precious dinosaur DNA sample that could save humanity. But the most primal carnivores await them.',
        duration: 124,
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'Tiếng Anh',
        releaseDate: futureDays(21),
        posterUrl: 'https://image.tmdb.org/t/p/original/mNhiEOj7WNSrmBScqLGBG7Ztgbv.jpg',
        trailerUrl: 'https://www.youtube.com/embed/YeWxuWRj8H8',
        rating: 'T13',
        director: 'Gareth Edwards',
        cast: ['Scarlett Johansson', 'Mahershala Ali', 'Jonathan Bailey'],
        status: 'coming-soon',
      },
      {
        title: 'Cám',
        titleEN: 'Cam: The Dark Tale',
        description: 'Phiên bản kinh dị Việt Nam của câu chuyện cổ tích Tấm Cám. Cám xinh đẹp nhưng độc ác sẵn sàng làm mọi thứ để giành được cuộc sống mà mình ao ước, kể cả những điều không thể tưởng tượng.',
        descriptionEN: 'A Vietnamese horror adaptation of the classic fairy tale Tam Cam. Cam, beautiful but cruel, is willing to do whatever it takes to win the life she desires, including the unthinkable.',
        duration: 112,
        genre: ['Horror', 'Drama'],
        language: 'Tiếng Việt',
        releaseDate: futureDays(7),
        posterUrl: 'https://image.tmdb.org/t/p/original/example_cam.jpg',
        trailerUrl: 'https://www.youtube.com/embed/exampleCam',
        rating: 'T18',
        director: 'Trần Hữu Tấn',
        cast: ['Lâm Thu Hồng', 'Nghiêm Đình Thụ', 'Hải Anh'],
        status: 'coming-soon',
      },
      // ─ ENDED ─
      {
        title: 'Dune: Part Two',
        titleEN: 'Dune: Part Two',
        description: 'Paul Atreides liên minh với người Fremen và thực hiện hành trình báo thù những kẻ âm mưu hủy diệt gia đình mình. Khi anh phải lựa chọn giữa tình yêu và định mệnh của vũ trụ.',
        descriptionEN: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
        duration: 166,
        genre: ['Sci-Fi', 'Adventure', 'Action'],
        language: 'Tiếng Anh',
        releaseDate: pastDays(90),
        posterUrl: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2JGqqUT1O.jpg',
        trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
        rating: 'T13',
        director: 'Denis Villeneuve',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
        status: 'ended',
      },
      {
        title: 'Kung Fu Panda 4',
        titleEN: 'Kung Fu Panda 4',
        description: 'Po được bổ nhiệm làm Lãnh đạo Tinh thần của Thung lũng Hòa bình, nhưng trước tiên phải tìm và đào tạo một Chiến binh Rồng mới. Hành trình đưa anh đến một thành phố ven biển nguy hiểm.',
        descriptionEN: 'Po is tapped to become the Spiritual Leader of the Valley of Peace, but must first find and train a new Dragon Warrior. The journey takes him to a dangerous coastal city.',
        duration: 94,
        genre: ['Animation', 'Action', 'Comedy', 'Family'],
        language: 'Tiếng Anh',
        releaseDate: pastDays(75),
        posterUrl: 'https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
        trailerUrl: 'https://www.youtube.com/embed/_inKs4eeHiI',
        rating: 'P',
        director: 'Mike Mitchell',
        cast: ['Jack Black', 'Awkwafina', 'Viola Davis', 'Bryan Cranston'],
        status: 'ended',
      },
    ]);
    console.log(`   ✔ Created ${movies.length} movies`);

    const nowShowingMovies = movies.filter((m) => m.status === 'now-showing');

    // ── 4. Theaters ───────────────────────────────────────────────────────────
    console.log('\n🏢 Creating Theaters...');
    const theaters = await Theater.insertMany([
      {
        name: 'Nova Cinema Hồ Chí Minh',
        address: '123 Lê Lợi, Phường Bến Thành, Quận 1',
        city: 'Hồ Chí Minh',
        phone: '19009090',
      },
      {
        name: 'Nova Cinema Hà Nội',
        address: '456 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm',
        city: 'Hà Nội',
        phone: '19009191',
      },
      {
        name: 'Nova Cinema Đà Nẵng',
        address: '789 Nguyễn Văn Linh, Phường Thạc Gián, Quận Thanh Khê',
        city: 'Đà Nẵng',
        phone: '19009292',
      },
    ]);
    console.log(`   ✔ Created ${theaters.length} theaters`);

    const [theaterHCM, theaterHN, theaterDN] = theaters;

    // ── 5. Rooms ──────────────────────────────────────────────────────────────
    console.log('\n🚪 Creating Rooms...');
    const rooms = await Room.insertMany([
      // HCM Rooms
      {
        name: 'Phòng 1 - IMAX',
        theater: theaterHCM._id,
        type: 'IMAX',
        capacity: 120,
      },
      {
        name: 'Phòng 2 - 3D',
        theater: theaterHCM._id,
        type: '3D',
        capacity: 80,
      },
      {
        name: 'Phòng 3 - 2D',
        theater: theaterHCM._id,
        type: '2D',
        capacity: 60,
      },
      {
        name: 'Phòng 4 - GOLDCLASS',
        theater: theaterHCM._id,
        type: 'GOLDCLASS',
        capacity: 30,
      },
      // Hanoi Rooms
      {
        name: 'Phòng 1 - 3D',
        theater: theaterHN._id,
        type: '3D',
        capacity: 100,
      },
      {
        name: 'Phòng 2 - 2D',
        theater: theaterHN._id,
        type: '2D',
        capacity: 70,
      },
      // Da Nang Rooms
      {
        name: 'Phòng 1 - 2D',
        theater: theaterDN._id,
        type: '2D',
        capacity: 60,
      },
      {
        name: 'Phòng 2 - 3D',
        theater: theaterDN._id,
        type: '3D',
        capacity: 80,
      },
    ]);
    console.log(`   ✔ Created ${rooms.length} rooms`);

    // ── 6. Seats ──────────────────────────────────────────────────────────────
    console.log('\n💺 Creating Seats...');
    const seatRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const allSeatsData = [];

    for (const room of rooms) {
      const cols = room.capacity <= 30 ? 6 : room.capacity <= 60 ? 10 : 12;
      const rowCount = Math.ceil(room.capacity / cols);
      const usedRows = seatRows.slice(0, rowCount);

      for (const row of usedRows) {
        for (let num = 1; num <= cols; num++) {
          let type = 'standard';
          const rowIndex = usedRows.indexOf(row);
          if (room.type === 'GOLDCLASS') {
            type = 'couple';
          } else if (rowIndex >= usedRows.length - 2) {
            type = 'vip';
          }

          allSeatsData.push({
            room: room._id,
            row,
            number: num,
            type,
            price:
              type === 'couple' ? 350000 : type === 'vip' ? 120000 : 90000,
          });
        }
      }
    }

    const seats = await Seat.insertMany(allSeatsData);
    console.log(`   ✔ Created ${seats.length} seats across ${rooms.length} rooms`);

    // ── 7. Showtimes ──────────────────────────────────────────────────────────
    console.log('\n⏰ Creating Showtimes...');
    const showtimeSlots = [
      { hour: 8, minute: 30 },
      { hour: 10, minute: 45 },
      { hour: 13, minute: 0 },
      { hour: 15, minute: 30 },
      { hour: 18, minute: 0 },
      { hour: 20, minute: 30 },
    ];

    const showtimesData = [];
    const prices = { IMAX: 180000, '3D': 120000, '2D': 90000, GOLDCLASS: 300000 };

    // Generate showtimes for the next 7 days + past 3 days
    for (let dayOffset = -3; dayOffset <= 7; dayOffset++) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + dayOffset);

      for (const movie of nowShowingMovies) {
        // Pick 2 random rooms per movie per day
        const selectedRooms = rooms
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        for (const room of selectedRooms) {
          const theater = theaters.find(
            (t) => t._id.toString() === room.theater.toString()
          );

          // Pick 3 random time slots
          const selectedSlots = showtimeSlots
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          for (const slot of selectedSlots) {
            const startTime = new Date(baseDate);
            startTime.setHours(slot.hour, slot.minute, 0, 0);
            const endTime = addMinutes(startTime, movie.duration + 15);

            showtimesData.push({
              movie: movie._id,
              theater: theater._id,
              room: room._id,
              startTime,
              endTime,
              ticketPrice: prices[room.type] || 90000,
              format: room.type,
              bookedSeats: [],
            });
          }
        }
      }
    }

    const showtimes = await Showtime.insertMany(showtimesData);
    console.log(`   ✔ Created ${showtimes.length} showtimes`);

    // ── 8. Concessions ────────────────────────────────────────────────────────
    console.log('\n🍿 Creating Concessions...');
    const concessions = await Concession.insertMany([
      // Food
      {
        name: 'Bắp rang bơ size L',
        description: 'Bắp rang bơ thơm ngon, giòn rụm, size lớn 130g. Thích hợp cho 1 người.',
        price: 65000,
        imageUrl: 'https://placehold.co/400x400/ff9f43/white?text=Popcorn+L',
        type: 'food',
        active: true,
      },
      {
        name: 'Bắp rang bơ size M',
        description: 'Bắp rang bơ thơm ngon size vừa 90g. Nhẹ nhàng và tiện lợi.',
        price: 50000,
        imageUrl: 'https://placehold.co/400x400/ff9f43/white?text=Popcorn+M',
        type: 'food',
        active: true,
      },
      {
        name: 'Hotdog Xúc Xích Đức',
        description: 'Xúc xích Đức nướng thơm kèm sốt mù tạt và tương cà, trong bánh mì mềm.',
        price: 55000,
        imageUrl: 'https://placehold.co/400x400/c0392b/white?text=Hotdog',
        type: 'food',
        active: true,
      },
      {
        name: 'Nachos Phô Mai',
        description: 'Bánh Nachos giòn tan ăn kèm sốt phô mai nóng, jalapeño và guacamole.',
        price: 70000,
        imageUrl: 'https://placehold.co/400x400/e67e22/white?text=Nachos',
        type: 'food',
        active: true,
      },
      {
        name: 'Gà Cay Nova',
        description: 'Cánh gà chiên giòn tẩm gia vị cay đặc biệt, đến 6 miếng, là món ăn vặt hoàn hảo.',
        price: 89000,
        imageUrl: 'https://placehold.co/400x400/e74c3c/white?text=Fried+Chicken',
        type: 'food',
        active: true,
      },
      // Drink
      {
        name: 'Coca-Cola size L',
        description: 'Nước ngọt có ga Coca-Cola lạnh sảng khoái, ly 500ml.',
        price: 35000,
        imageUrl: 'https://placehold.co/400x400/c0392b/white?text=Coca-Cola+L',
        type: 'drink',
        active: true,
      },
      {
        name: 'Pepsi size L',
        description: 'Nước ngọt có ga Pepsi lạnh, ly 500ml.',
        price: 35000,
        imageUrl: 'https://placehold.co/400x400/2980b9/white?text=Pepsi+L',
        type: 'drink',
        active: true,
      },
      {
        name: 'Nước suối Lavie',
        description: 'Nước khoáng thiên nhiên Lavie 500ml, thanh mát và tinh khiết.',
        price: 20000,
        imageUrl: 'https://placehold.co/400x400/3498db/white?text=Lavie',
        type: 'drink',
        active: true,
      },
      {
        name: 'Trà sữa trân châu',
        description: 'Trà sữa đài loan với trân châu đen dai mềm, ly 500ml.',
        price: 45000,
        imageUrl: 'https://placehold.co/400x400/8e44ad/white?text=Milk+Tea',
        type: 'drink',
        active: true,
      },
      // Combo
      {
        name: 'Combo Đôi Classic',
        description: '2 ly Coca-Cola size L + 1 bắp rang bơ size L. Tiết kiệm 20% so với mua lẻ.',
        price: 120000,
        imageUrl: 'https://placehold.co/400x400/27ae60/white?text=Combo+Doi',
        type: 'combo',
        active: true,
      },
      {
        name: 'Combo Gia Đình',
        description: '2 bắp rang bơ size L + 4 ly nước ngọt + 1 phần Nachos. Dành cho cả gia đình.',
        price: 280000,
        imageUrl: 'https://placehold.co/400x400/16a085/white?text=Combo+GD',
        type: 'combo',
        active: true,
      },
      {
        name: 'Combo Cặp Đôi VIP',
        description: '1 bắp rang bơ size L + 2 ly trà sữa trân châu + 1 phần Hotdog. Hoàn hảo cho 2 người.',
        price: 220000,
        imageUrl: 'https://placehold.co/400x400/8e44ad/white?text=Combo+VIP',
        type: 'combo',
        active: true,
      },
    ]);
    console.log(`   ✔ Created ${concessions.length} concession items`);

    // ── 9. Bookings, Payments ─────────────────────────────────────────────────
    console.log('\n🎟️  Creating Bookings & Payments...');

    // Take past showtimes for completed bookings
    const pastShowtimes = showtimes.filter(
      (s) => new Date(s.startTime) < new Date()
    );
    const bookingsData = [];
    const paymentsData = [];

    const seatCodesByRoom = {};
    for (const seat of seats) {
      const key = seat.room.toString();
      if (!seatCodesByRoom[key]) seatCodesByRoom[key] = [];
      seatCodesByRoom[key].push(`${seat.row}${seat.number}`);
    }

    const paymentMethods = ['cash', 'card', 'vnpay', 'momo'];
    const bookingStatuses = ['paid', 'paid', 'paid', 'paid', 'pending', 'refunded'];

    // Create 30 sample bookings across past showtimes
    const usedShowtimes = pastShowtimes.slice(0, 30);
    for (let i = 0; i < usedShowtimes.length; i++) {
      const showtime = usedShowtimes[i];
      const customer = customerUsers[i % customerUsers.length];
      const roomKey = showtime.room.toString();
      const availableSeats = seatCodesByRoom[roomKey] || ['A1', 'A2', 'B1'];
      const numSeats = randomBetween(1, 3);
      const selectedSeats = availableSeats.slice(
        (i * numSeats) % Math.max(availableSeats.length - numSeats, 1),
        (i * numSeats) % Math.max(availableSeats.length - numSeats, 1) + numSeats
      );

      const seatTotal = showtime.ticketPrice * numSeats;
      const hasConcession = i % 3 === 0;
      const concessionItems = hasConcession
        ? [
            {
              concession: concessions[i % concessions.length]._id,
              quantity: randomBetween(1, 2),
            },
          ]
        : [];
      const concessionTotal = hasConcession
        ? concessions[i % concessions.length].price *
          concessionItems[0].quantity
        : 0;
      const totalPrice = seatTotal + concessionTotal;

      const status = bookingStatuses[i % bookingStatuses.length];

      const booking = {
        user: customer._id,
        showtime: showtime._id,
        seats: selectedSeats,
        concessions: concessionItems,
        totalPrice,
        paymentStatus: status === 'paid' ? 'paid' : status === 'refunded' ? 'refunded' : 'pending',
        paymentMethod: paymentMethods[i % paymentMethods.length],
        bookingDate: new Date(showtime.startTime.getTime() - randomBetween(1, 120) * 60000),
      };

      bookingsData.push(booking);
    }

    const bookings = await Booking.insertMany(bookingsData);
    console.log(`   ✔ Created ${bookings.length} bookings`);

    // Create corresponding payments for paid bookings
    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') {
        paymentsData.push({
          booking: booking._id,
          paymentMethod: booking.paymentMethod,
          transactionId: `TXN${Date.now()}${i}${randomBetween(1000, 9999)}`,
          amount: booking.totalPrice,
          status: booking.paymentStatus === 'paid' ? 'completed' : 'refunded',
          paymentDate: booking.bookingDate,
        });
      }
    }

    const payments = await Payment.insertMany(paymentsData);
    console.log(`   ✔ Created ${payments.length} payments`);

    // ── 10. Update bookedSeats on Showtimes ────────────────────────────────
    console.log('\n🔄 Updating booked seats on showtimes...');
    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      if (booking.paymentStatus === 'paid') {
        await Showtime.findByIdAndUpdate(booking.showtime, {
          $push: { bookedSeats: { $each: booking.seats } },
        });
      }
    }
    console.log('   ✔ Showtime booked seats updated');

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║      🎉  SEED COMPLETED SUCCESSFULLY!    ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  👤  Users          : ${String(users.length).padEnd(18)}║`);
    console.log(`║  🎬  Movies         : ${String(movies.length).padEnd(18)}║`);
    console.log(`║  🏢  Theaters       : ${String(theaters.length).padEnd(18)}║`);
    console.log(`║  🚪  Rooms          : ${String(rooms.length).padEnd(18)}║`);
    console.log(`║  💺  Seats          : ${String(seats.length).padEnd(18)}║`);
    console.log(`║  ⏰  Showtimes      : ${String(showtimes.length).padEnd(18)}║`);
    console.log(`║  🍿  Concessions    : ${String(concessions.length).padEnd(18)}║`);
    console.log(`║  🎟️   Bookings       : ${String(bookings.length).padEnd(18)}║`);
    console.log(`║  💳  Payments       : ${String(payments.length).padEnd(18)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('\n📌 Default login credentials:');
    console.log('   Admin  → admin@nova.com   / password123');
    console.log('   Staff  → staff.hcm@nova.com / password123');
    console.log('   User   → nguyenvanan@gmail.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach((e) =>
        console.error('  →', e.message)
      );
    }
    process.exit(1);
  }
};

seedData();
