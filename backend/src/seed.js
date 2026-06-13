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
        posterUrl: 'https://i.redd.it/mcu-avengers-secret-wars-concept-posters-x-21xfour-v0-h8ru2ec7x6df1.jpg?width=2323&format=pjpg&auto=webp&s=e9aeec53aae60f218a537adf81a3af5ab36d81f7',
        trailerUrl: 'https://www.youtube.com/watch?v=CenysnhhWPM',
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
        posterUrl: 'https://i.ebayimg.com/images/g/KRYAAeSwrd1obILF/s-l1600.webp',
        trailerUrl: 'https://www.youtube.com/watch?v=wJO_vIDZn-I',
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
        posterUrl: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcT-YRpO2-8C8dW7lVJT_lv1n_bkG4EMNzYZgUKP74ztYA6_hQ6KH0dJxerlEKw7bUy3HpN0As-ODPDaGhmQHXQEUHrMXsRJ5tQpgJokI3ZtUeaK7h39BKvm&usqp=CAc',
        trailerUrl: 'https://www.youtube.com/watch?v=l76lpYqei7s',
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
        posterUrl: 'https://image.tmdb.org/t/p/original/az7ODFlVDWawpnsTttpKDxU8aBv.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=VWqJifMMgZE&t=5s',
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
        posterUrl: 'https://kenh14cdn.com/thumb_w/600/27fc8f4935/2015/09/09/TTHVTCX%20-%20Official%20poster-cd46e.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=kvf-LAtW-Ls',
        rating: 'P',
        director: 'Victor Vũ',
        cast: ['Thái Hòa', 'Trấn Thành', 'Hồng Ánh'],
        status: 'now-showing',
      },
      {
        title: 'Inside Out 2',
        titleEN: 'Inside Out 2',
        description: 'Riley bước vào tuổi thiếu niên và một loạt cảm xúc mới xuất hiện trong tâm trí cô bé, tạo ra sự hỗn loạn chưa từng có giữa Joy và những người bạn cũ.',
        descriptionEN: 'Riley enters her teenage years and a new set of Emotions show up just in time to cause havoc over a very important weekend.',
        duration: 96,
        genre: ['Animation', 'Comedy', 'Family', 'Fantasy'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(12),
        posterUrl: 'https://image.tmdb.org/t/p/original/vpnVM9B6Vm6FJv6OTZ4xYiTyLh2.jpg',
        trailerUrl: 'https://www.youtube.com/embed/LEjhY2iUqLw',
        rating: 'P',
        director: 'Kelsey Mann',
        cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman', 'Liza Lapira'],
        status: 'now-showing',
      },
      {
        title: 'Deadpool & Wolverine',
        titleEN: 'Deadpool & Wolverine',
        description: 'Deadpool được tuyển vào TVA và cùng Wolverine thực hiện sứ mệnh quan trọng có thể thay đổi lịch sử Marvel mãi mãi.',
        descriptionEN: 'Deadpool is recruited by the TVA and teams up with Wolverine on a mission that could change the history of the Marvel Cinematic Universe forever.',
        duration: 128,
        genre: ['Action', 'Comedy', 'Sci-Fi'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(10),
        posterUrl: 'https://image.tmdb.org/t/p/original/8cdWjvZVDmXZlhJ7Urw8dpmrjf5.jpg',
        trailerUrl: 'https://www.youtube.com/embed/8-_Z19c0jXg',
        rating: 'T18',
        director: 'Shawn Levy',
        cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Morena Baccarin'],
        status: 'now-showing',
      },
      {
        title: 'Moana 2',
        titleEN: 'Moana 2',
        description: 'Moana lên đường chinh phục vùng biển chưa được khám phá khi nhận được lời kêu gọi từ tổ tiên. Cô tập hợp thủy thủ đoàn và cùng nhau đối mặt với vùng biển đầy bí ẩn và nguy hiểm.',
        descriptionEN: 'Moana sets sail on a daring mission to a mysterious and magical region of the ocean, responding to an ancestral call. She crews an unlikely group of seafarers on an impossible journey.',
        duration: 100,
        genre: ['Animation', 'Adventure', 'Family'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(8),
        posterUrl: 'https://image.tmdb.org/t/p/original/4t095crC5IS0AgF5Hj5ql55thOI.jpg',
        trailerUrl: 'https://www.youtube.com/embed/h7KuOpGPv90',
        rating: 'P',
        director: 'David G. Derrick Jr.',
        cast: ['Auli\'i Cravalho', 'Dwayne Johnson', 'Alan Tudyk', 'Temuera Morrison'],
        status: 'now-showing',
      },
      {
        title: 'Wicked',
        titleEN: 'Wicked',
        description: 'Câu chuyện về tình bạn bất ngờ giữa Elphaba - cô gái da xanh bị xa lánh - và Glinda - cô gái nổi tiếng và quyến rũ - tại trường phù thủy Shiz trước khi trở thành hai phù thủy huyền thoại của Oz.',
        descriptionEN: 'The story of the unlikely friendship between Elphaba — a misunderstood young woman with emerald-green skin — and Glinda, a popular and ambitious girl, long before they became the Wicked Witch and Glinda the Good.',
        duration: 160,
        genre: ['Fantasy', 'Musical', 'Romance'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(6),
        posterUrl: 'https://image.tmdb.org/t/p/original/2EE4uT8xGgH12V3f2wU2rZk3V3e.jpg',
        trailerUrl: 'https://www.youtube.com/embed/6COmYeLsz4c',
        rating: 'P',
        director: 'Jon M. Chu',
        cast: ['Cynthia Erivo', 'Ariana Grande', 'Jonathan Bailey', 'Michelle Yeoh'],
        status: 'now-showing',
      },
      {
        title: 'Alien: Romulus',
        titleEN: 'Alien: Romulus',
        description: 'Một nhóm thanh niên trên thuộc địa không gian đối mặt với dạng sống nguy hiểm nhất trong vũ trụ khi khám phá một trạm không gian bị bỏ hoang giữa các vì sao.',
        descriptionEN: 'A group of young people on a deep space colony planet come face to face with the most terrifying life form in the universe while searching an abandoned space station.',
        duration: 119,
        genre: ['Sci-Fi', 'Horror', 'Thriller'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(5),
        posterUrl: 'https://image.tmdb.org/t/p/original/b33r3nN5r19Z14tMKJ7Rx46Nnle.jpg',
        trailerUrl: 'https://www.youtube.com/embed/x0XDEJCWDhs',
        rating: 'T18',
        director: 'Fede Álvarez',
        cast: ['Cailee Spaeny', 'David Jonsson', 'Archie Renaux', 'Isabela Merced'],
        status: 'now-showing',
      },
      {
        title: 'Joker: Folie à Deux',
        titleEN: 'Joker: Folie à Deux',
        description: 'Arthur Fleck đang bị giam giữ tại Arkham trong khi đối mặt với phiên tòa về những tội ác của mình. Tại đây anh gặp Harley Quinn và cả hai cùng nhau bước vào câu chuyện tình yêu điên loạn.',
        descriptionEN: 'Arthur Fleck is incarcerated at Arkham while awaiting trial for his crimes. He comes across Harley Quinn and together they embark on a musical love story.',
        duration: 138,
        genre: ['Drama', 'Crime', 'Musical'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(4),
        posterUrl: 'https://image.tmdb.org/t/p/original/aciKV1S5eN5hQY5Q49k0sXzG09H.jpg',
        trailerUrl: 'https://www.youtube.com/embed/xy8aJw1vYTo',
        rating: 'T18',
        director: 'Todd Phillips',
        cast: ['Joaquin Phoenix', 'Lady Gaga', 'Brendan Gleeson', 'Catherine Keener'],
        status: 'now-showing',
      },
      {
        title: 'Twisters',
        titleEN: 'Twisters',
        description: 'Các chuyên gia theo dõi cơn lốc xoáy phải đối mặt với mùa bão khốc liệt nhất từ trước đến nay khi những cơn lốc siêu mạnh tấn công vùng đồng bằng Mỹ.',
        descriptionEN: 'Storm trackers confront the most extreme tornado season in recorded history when terrifying tornadoes tear across the American plains.',
        duration: 122,
        genre: ['Action', 'Adventure', 'Thriller'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(3),
        posterUrl: 'https://image.tmdb.org/t/p/original/pjnD086zXWTzbb777n1ic6wQd25.jpg',
        trailerUrl: 'https://www.youtube.com/embed/J7iDs5s3Baw',
        rating: 'T13',
        director: 'Lee Isaac Chung',
        cast: ['Daisy Edgar-Jones', 'Glen Powell', 'Anthony Ramos', 'Brandon Perea'],
        status: 'now-showing',
      },
      {
        title: 'A Quiet Place: Day One',
        titleEN: 'A Quiet Place: Day One',
        description: 'Câu chuyện về những ngày đầu tiên khi thế giới bị chiếm đóng bởi những sinh vật săn mồi theo âm thanh, theo dõi hành trình sinh tồn của người phụ nữ tên Sam tại New York.',
        descriptionEN: 'A story about the earliest days of the invasion of the sound-hunting creatures, following a woman named Sam through New York City on Day One of the apocalypse.',
        duration: 99,
        genre: ['Sci-Fi', 'Horror', 'Thriller'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(2),
        posterUrl: 'https://image.tmdb.org/t/p/original/yrp1wNBB161J51krAhwq03bhcnF.jpg',
        trailerUrl: 'https://www.youtube.com/embed/YPY7J-flzE8',
        rating: 'T16',
        director: 'Michael Sarnoski',
        cast: ['Lupita Nyong\'o', 'Joseph Quinn', 'Alex Wolff', 'Djimon Hounsou'],
        status: 'now-showing',
      },
      {
        title: 'Transformers One',
        titleEN: 'Transformers One',
        description: 'Nguồn gốc chưa từng được kể về Optimus Prime và Megatron - từ những người bạn tốt nhất trên Cybertron đến kẻ thù không đội trời chung đã thay đổi lịch sử vũ trụ mãi mãi.',
        descriptionEN: 'The untold origin story of Optimus Prime and Megatron — better known as sworn enemies, they were once close friends on Cybertron before a fateful choice changed their destinies forever.',
        duration: 104,
        genre: ['Animation', 'Action', 'Sci-Fi', 'Adventure'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(1),
        posterUrl: 'https://image.tmdb.org/t/p/original/qhb1qwc7SEFD55zo0t151z45nsG.jpg',
        trailerUrl: 'https://www.youtube.com/embed/u1K4gG5pXis',
        rating: 'P',
        director: 'Josh Cooley',
        cast: ['Chris Hemsworth', 'Brian Tyree Henry', 'Scarlett Johansson', 'Keegan-Michael Key'],
        status: 'now-showing',
      },
      {
        title: 'The Wild Robot',
        titleEN: 'The Wild Robot',
        description: 'Robot ROZZUM đơn vị 7134 bị mắc kẹt trên một hòn đảo hoang và phải học cách thích nghi với thiên nhiên. Cô nhận nuôi một chú ngỗng mồ côi và dần khám phá ý nghĩa của tình mẫu tử.',
        descriptionEN: 'A robot named ROZZUM unit 7134 (Roz) is stranded on a wild island and must learn to adapt. She adopts an orphaned gosling and begins to discover what it means to be a mother.',
        duration: 102,
        genre: ['Animation', 'Family', 'Sci-Fi'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(7),
        posterUrl: 'https://image.tmdb.org/t/p/original/w1nZ265gLTz83VJ441qnuVgo0Rx.jpg',
        trailerUrl: 'https://www.youtube.com/embed/67t8Wy4x16c',
        rating: 'P',
        director: 'Chris Sanders',
        cast: ['Lupita Nyong\'o', 'Pedro Pascal', 'Kit Connor', 'Bill Nighy'],
        status: 'now-showing',
      },
      {
        title: 'Venom: The Last Dance',
        titleEN: 'Venom: The Last Dance',
        description: 'Eddie Brock và Venom bị truy đuổi bởi cả hai thế giới con người và cộng sinh. Họ phải đưa ra quyết định tối thượng đặt dấu chấm hết cho câu chuyện của cả hai.',
        descriptionEN: 'Eddie Brock and Venom are on the run, pursued by both worlds — human and symbiote. They must make a devastating decision that will bring their story to its end.',
        duration: 109,
        genre: ['Action', 'Sci-Fi', 'Adventure'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(6),
        posterUrl: 'https://image.tmdb.org/t/p/original/aosm8LM2j35536tdg7FzoLE8CjV.jpg',
        trailerUrl: 'https://www.youtube.com/embed/__2bjWbetsA',
        rating: 'T13',
        director: 'Kelly Marcel',
        cast: ['Tom Hardy', 'Chiwetel Ejiofor', 'Juno Temple', 'Rhys Ifans'],
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
        posterUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAQo2vKkr9WPXhChMIhbtT5XANb0UvRNE_Fg&s',
        trailerUrl: 'https://www.youtube.com/watch?v=ul221o1ThcE',
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
        posterUrl: 'https://i.ebayimg.com/thumbs/images/g/Jf4AAeSwh7do6imI/s-l500.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=Do0iqxOXyos',
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
        posterUrl: 'https://upload.wikimedia.org/wikipedia/vi/thumb/5/5b/C%C3%A1m_2024_poster.jpg/250px-C%C3%A1m_2024_poster.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=puHjyVLpMT4',
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
        posterUrl: 'https://i.ebayimg.com/images/g/YxIAAOSwYQ5l5ZSl/s-l1600.webp',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
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
        posterUrl: 'https://image.tmdb.org/t/p/original/7quq3UOaaB0qNM7TMGMEqqghLck.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=_inKs4eeHiI',
        rating: 'P',
        director: 'Mike Mitchell',
        cast: ['Jack Black', 'Awkwafina', 'Viola Davis', 'Bryan Cranston'],
        status: 'ended',
      },
      {
        title: 'Spider-Man: No Way Home',
        titleEN: 'Spider-Man: No Way Home',
        description: 'Peter Parker nhờ Bác Sĩ Strange thực hiện phép thuật để thế giới quên đi danh tính người Nhện của anh, nhưng phép thuật mở ra đa vũ trụ, triệu hồi những kẻ phản diện nguy hiểm nhất.',
        descriptionEN: 'Peter Parker seeks help from Doctor Strange to make the world forget he is Spider-Man, but the spell opens the multiverse, summoning the most dangerous villains from alternate realities.',
        duration: 148,
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 4),
        posterUrl: 'https://image.tmdb.org/t/p/original/1g01tZ55ehgcLIZk0Z7neJt7ZtY.jpg',
        trailerUrl: 'https://www.youtube.com/embed/JfVOs4VSpmA',
        rating: 'T13',
        director: 'Jon Watts',
        cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch', 'Jacob Batalon'],
        status: 'ended',
      },
      {
        title: 'Black Panther: Wakanda Forever',
        titleEN: 'Black Panther: Wakanda Forever',
        description: "Sau khi mất đi vị vua T'Challa, người dân Wakanda phải bảo vệ đất nước khỏi sự xâm lược của Namor và vương quốc Talokan dưới lòng đại dương.",
        descriptionEN: "After losing King T'Challa, the people of Wakanda must protect their nation from the invasion of Namor and the underwater kingdom of Talokan.",
        duration: 161,
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 3),
        posterUrl: 'https://image.tmdb.org/t/p/original/sv1Alw5gTGlR3I3xo68efrYrD4j.jpg',
        trailerUrl: 'https://www.youtube.com/embed/_Z3QKkl1WyM',
        rating: 'T13',
        director: 'Ryan Coogler',
        cast: ['Letitia Wright', 'Lupita Nyong\'o', 'Danai Gurira', 'Winston Duke'],
        status: 'ended',
      },
      {
        title: 'Thor: Love and Thunder',
        titleEN: 'Thor: Love and Thunder',
        description: 'Thor bắt đầu hành trình tìm kiếm sự bình yên, nhưng phải đối mặt với Gorr kẻ giết thần linh đang tìm cách tiêu diệt tất cả các vị thần. Jane Foster trở thành Nữ Thor huyền thoại.',
        descriptionEN: 'Thor embarks on a journey of self-discovery but must interrupt it to face Gorr the God Butcher, who seeks to make the gods extinct. Along the way, Jane Foster wields Mjolnir as the Mighty Thor.',
        duration: 119,
        genre: ['Action', 'Adventure', 'Fantasy'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 3),
        posterUrl: 'https://image.tmdb.org/t/p/original/pIk4GJeLHubuEVIIFYxaCgIS1dC.jpg',
        trailerUrl: 'https://www.youtube.com/embed/Go8nTmfrQd8',
        rating: 'T13',
        director: 'Taika Waititi',
        cast: ['Chris Hemsworth', 'Christian Bale', 'Tessa Thompson', 'Jaimie Alexander'],
        status: 'ended',
      },
      {
        title: 'Shang-Chi and the Legend of the Ten Rings',
        titleEN: 'Shang-Chi and the Legend of the Ten Rings',
        description: 'Shang-Chi bị kéo vào thế giới bí ẩn của tổ chức Thập Nhẫn và phải đối đầu với chính người cha quyền năng của mình, đồng thời khám phá bí mật về quá khứ của gia đình.',
        descriptionEN: "Shang-Chi is drawn into the world of the Ten Rings and must confront his powerful father while uncovering secrets about his family's past.",
        duration: 132,
        genre: ['Action', 'Adventure', 'Fantasy'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 4),
        posterUrl: 'https://image.tmdb.org/t/p/original/xeMwZ12574e4XGvj4E3g0B0G6F8.jpg',
        trailerUrl: 'https://www.youtube.com/embed/8YjFMR4jWZO',
        rating: 'T13',
        director: 'Destin Daniel Cretton',
        cast: ['Simu Liu', 'Awkwafina', 'Tony Leung', 'Michelle Yeoh'],
        status: 'ended',
      },
      {
        title: 'Eternals',
        titleEN: 'Eternals',
        description: 'Nhóm anh hùng bất tử Eternals tái hợp sau hàng nghìn năm để bảo vệ Trái Đất khỏi kẻ thù cổ xưa nhất của họ - các Deviant đột biến nguy hiểm.',
        descriptionEN: 'The immortal Eternals reunite after thousands of years to protect Earth from their ancient enemies — the mutated and dangerous Deviants.',
        duration: 156,
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 4),
        posterUrl: 'https://image.tmdb.org/t/p/original/bcCBq5N3YvKd09oY27NL354B55q.jpg',
        trailerUrl: 'https://www.youtube.com/embed/x_me3xsvDgk',
        rating: 'T13',
        director: 'Chloé Zhao',
        cast: ['Gemma Chan', 'Richard Madden', 'Kumail Nanjiani', 'Lia McHugh'],
        status: 'ended',
      },
      {
        title: 'Encanto',
        titleEN: 'Encanto',
        description: 'Gia đình Madrigal sống trong một ngôi nhà thần kỳ ở vùng núi Colombia, nơi mỗi người đều có một phép năng đặc biệt - trừ Mirabel. Khi phép màu của ngôi nhà bắt đầu biến mất, chỉ có cô mới có thể cứu gia đình.',
        descriptionEN: "The Madrigal family lives in a magical house in the mountains of Colombia, where every family member has a unique gift—except Mirabel. When the house's magic starts fading, only she can save the family.",
        duration: 102,
        genre: ['Animation', 'Comedy', 'Family', 'Fantasy'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 4),
        posterUrl: 'https://image.tmdb.org/t/p/original/4j0HT4mryX0mgo2r7Qz4AhpCmje.jpg',
        trailerUrl: 'https://www.youtube.com/embed/CaimKeNp45k',
        rating: 'P',
        director: 'Jared Bush, Byron Howard',
        cast: ['Stephanie Beatriz', 'María Cecilia Botero', 'John Leguizamo', 'Mauro Castillo'],
        status: 'ended',
      },
      {
        title: 'The Batman',
        titleEN: 'The Batman',
        description: 'Batman bước vào năm thứ hai làm người bảo vệ Gotham, buộc phải điều tra tội ác gây ra bởi kẻ giết người hàng loạt tên Riddler, dần khám phá sự thối nát ăn sâu vào thành phố.',
        descriptionEN: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City while investigating a series of sadistic killings orchestrated by a mysterious murderer known as the Riddler.',
        duration: 176,
        genre: ['Action', 'Crime', 'Drama', 'Mystery'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 3),
        posterUrl: 'https://image.tmdb.org/t/p/original/74xTEgt7R36FwEU567uBsNAVXGc.jpg',
        trailerUrl: 'https://www.youtube.com/embed/mqqft2x_Aa4',
        rating: 'T16',
        director: 'Matt Reeves',
        cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Jeffrey Wright'],
        status: 'ended',
      },
      {
        title: 'Top Gun: Maverick',
        titleEN: 'Top Gun: Maverick',
        description: 'Sau hơn 30 năm phục vụ, Pete "Maverick" Mitchell trở lại huấn luyện thế hệ phi công trẻ của Top Gun cho một nhiệm vụ đặc biệt đòi hỏi sự hy sinh cực đại.',
        descriptionEN: 'After more than 30 years of service, Pete "Maverick" Mitchell returns to train a group of Top Gun graduates for a specialized mission requiring the ultimate sacrifice.',
        duration: 130,
        genre: ['Action', 'Drama'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 3),
        posterUrl: 'https://image.tmdb.org/t/p/original/62HCnUTziyWcpDaHu21alCXz2nQ.jpg',
        trailerUrl: 'https://www.youtube.com/embed/giXcoYkqwYY',
        rating: 'T13',
        director: 'Joseph Kosinski',
        cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm'],
        status: 'ended',
      },
      {
        title: 'Avatar: The Way of Water',
        titleEN: 'Avatar: The Way of Water',
        description: 'Jake Sully và Neytiri cùng gia đình phải rời bỏ ngôi nhà và khám phá các vùng đất của Pandora. Khi mối nguy hiểm cổ đại tái xuất, họ phải chiến đấu để bảo vệ nhau.',
        descriptionEN: 'Jake Sully and Neytiri form a family and do what it takes to stay together. When trouble resurfaces, they must leave their home and explore the regions of Pandora.',
        duration: 192,
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 3),
        posterUrl: 'https://image.tmdb.org/t/p/original/t6HI7mg1jZ100W236BzZJ5mIyOH.jpg',
        trailerUrl: 'https://www.youtube.com/embed/d9MyW72ELq0',
        rating: 'T13',
        director: 'James Cameron',
        cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
        status: 'ended',
      },
      {
        title: 'Fast X',
        titleEN: 'Fast X',
        description: 'Dominic Toretto và gia đình phải đối mặt với Dante - kẻ thù nguy hiểm và lâu đời nhất từ trước đến nay, người đã lên kế hoạch trả thù suốt nhiều thập kỷ.',
        descriptionEN: "Dom Toretto and his family face Dante, the most ruthless villain they've ever encountered, a man who has been plotting revenge for decades.",
        duration: 141,
        genre: ['Action', 'Adventure', 'Thriller'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 2),
        posterUrl: 'https://image.tmdb.org/t/p/original/fiVW06Jm7p4nE415mh5J5yH0Z4q.jpg',
        trailerUrl: 'https://www.youtube.com/embed/32RAq6JzY-w',
        rating: 'T16',
        director: 'Louis Leterrier',
        cast: ['Vin Diesel', 'Michelle Rodriguez', 'Tyrese Gibson', 'Ludacris'],
        status: 'ended',
      },
      {
        title: 'Mission: Impossible – Dead Reckoning Part One',
        titleEN: 'Mission: Impossible – Dead Reckoning Part One',
        description: 'Ethan Hunt và đội IMF phải truy đuổi một vũ khí có thể đe dọa toàn nhân loại trước khi nó rơi vào tay kẻ xấu.',
        descriptionEN: 'Ethan Hunt and the IMF team race against time to track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.',
        duration: 163,
        genre: ['Action', 'Adventure', 'Thriller'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 2),
        posterUrl: 'https://image.tmdb.org/t/p/original/NNxYBM4tr84nRAhXWwIT5v6xV2.jpg',
        trailerUrl: 'https://www.youtube.com/embed/2m1drlTOsdY',
        rating: 'T13',
        director: 'Christopher McQuarrie',
        cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames', 'Simon Pegg'],
        status: 'ended',
      },
      {
        title: 'Guardians of the Galaxy Vol. 3',
        titleEN: 'Guardians of the Galaxy Vol. 3',
        description: 'Peter Quill và nhóm Guardians lên đường bảo vệ Rocket trước quá khứ bí ẩn của anh. Hành trình sẽ thách thức nhóm đến giới hạn và có thể dẫn đến sự tan rã của họ.',
        descriptionEN: "Peter Quill rallies his team to defend Rocket from his past. The journey will challenge the Guardians to their limits and may lead to the team's disbandment.",
        duration: 150,
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 2),
        posterUrl: 'https://image.tmdb.org/t/p/original/r2J021crVeeHR6gC7M2gBwArw87.jpg',
        trailerUrl: 'https://www.youtube.com/embed/u3V5KDHRQVk',
        rating: 'T13',
        director: 'James Gunn',
        cast: ['Chris Pratt', 'Zoe Saldana', 'Dave Bautista', 'Karen Gillan'],
        status: 'ended',
      },
      {
        title: 'Oppenheimer',
        titleEN: 'Oppenheimer',
        description: 'Câu chuyện về J. Robert Oppenheimer - nhà vật lý người Mỹ đã đóng vai trò then chốt trong việc phát triển bom nguyên tử đầu tiên trong Dự án Manhattan.',
        descriptionEN: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II and the Manhattan Project.",
        duration: 180,
        genre: ['Biography', 'Drama', 'History'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 2),
        posterUrl: 'https://image.tmdb.org/t/p/original/8Gxv2wSbs20L26d16qQ6t8i9yOh.jpg',
        trailerUrl: 'https://www.youtube.com/embed/uYPbbEG8y0g',
        rating: 'T18',
        director: 'Christopher Nolan',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
        status: 'ended',
      },
      {
        title: 'Barbie',
        titleEN: 'Barbie',
        description: 'Barbie sống trong thế giới hoàn hảo Barbieland bỗng dưng phải đối mặt với những khủng hoảng hiện sinh và bắt đầu một hành trình vào thế giới thực.',
        descriptionEN: 'Barbie suffers a crisis that leads her to question her world, and she sets off on a journey into the real world.',
        duration: 114,
        genre: ['Comedy', 'Family', 'Fantasy'],
        language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: pastDays(365 * 2),
        posterUrl: 'https://image.tmdb.org/t/p/original/iuFNMS8U5X6g0wqjV3hzbUjBEth.jpg',
        trailerUrl: 'https://www.youtube.com/embed/pBk4NYhWNMM',
        rating: 'T13',
        director: 'Greta Gerwig',
        cast: ['Margot Robbie', 'Ryan Gosling', 'America Ferrera', 'Kate McKinnon'],
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
    const concessionTemplates = [
      // Food
      {
        name: 'Bắp rang bơ size L',
        description: 'Bắp rang bơ thơm ngon, giòn rụm, size lớn 130g. Thích hợp cho 1 người.',
        price: 65000,
        imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=400',
        type: 'food',
        active: true,
      },
      {
        name: 'Bắp rang bơ size M',
        description: 'Bắp rang bơ thơm ngon size vừa 90g. Nhẹ nhàng và tiện lợi.',
        price: 50000,
        imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=400',
        type: 'food',
        active: true,
      },
      {
        name: 'Hotdog Xúc Xích Đức',
        description: 'Xúc xích Đức nướng thơm kèm sốt mù tạt và tương cà, trong bánh mì mềm.',
        price: 55000,
        imageUrl: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&q=80&w=400',
        type: 'food',
        active: true,
      },
      {
        name: 'Nachos Phô Mai',
        description: 'Bánh Nachos giòn tan ăn kèm sốt phô mai nóng, jalapeño và guacamole.',
        price: 70000,
        imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=400',
        type: 'food',
        active: true,
      },
      {
        name: 'Gà Cay Nova',
        description: 'Cánh gà chiên giòn tẩm gia vị cay đặc biệt, đến 6 miếng, là món ăn vặt hoàn hảo.',
        price: 89000,
        imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=400',
        type: 'food',
        active: true,
      },
      // Drink
      {
        name: 'Coca-Cola size L',
        description: 'Nước ngọt có ga Coca-Cola lạnh sảng khoái, ly 500ml.',
        price: 35000,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
        type: 'drink',
        active: true,
      },
      {
        name: 'Pepsi size L',
        description: 'Nước ngọt có ga Pepsi lạnh, ly 500ml.',
        price: 35000,
        imageUrl: 'https://images.unsplash.com/photo-1629203851020-904c04e5bc19?auto=format&fit=crop&q=80&w=400',
        type: 'drink',
        active: true,
      },
      {
        name: 'Nước suối Lavie',
        description: 'Nước khoáng thiên nhiên Lavie 500ml, thanh mát và tinh khiết.',
        price: 20000,
        imageUrl: 'https://images.unsplash.com/photo-1616118132261-edb26e47e58a?auto=format&fit=crop&q=80&w=400',
        type: 'drink',
        active: true,
      },
      {
        name: 'Trà sữa trân châu',
        description: 'Trà sữa đài loan với trân châu đen dai mềm, ly 500ml.',
        price: 45000,
        imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400',
        type: 'drink',
        active: true,
      },
      // Combo
      {
        name: 'Combo Đôi Classic',
        description: '2 ly Coca-Cola size L + 1 bắp rang bơ size L. Tiết kiệm 20% so với mua lẻ.',
        price: 120000,
        imageUrl: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=400',
        type: 'combo',
        active: true,
      },
      {
        name: 'Combo Gia Đình',
        description: '2 bắp rang bơ size L + 4 ly nước ngọt + 1 phần Nachos. Dành cho cả gia đình.',
        price: 280000,
        imageUrl: 'https://images.unsplash.com/photo-1536098579074-406eacab074e?auto=format&fit=crop&q=80&w=400',
        type: 'combo',
        active: true,
      },
      {
        name: 'Combo Cặp Đôi VIP',
        description: '1 bắp rang bơ size L + 2 ly trà sữa trân châu + 1 phần Hotdog. Hoàn hảo cho 2 người.',
        price: 220000,
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400',
        type: 'combo',
        active: true,
      },
    ];

    const concessionsData = [];
    for (const theater of theaters) {
      for (const item of concessionTemplates) {
        concessionsData.push({
          ...item,
          theater: theater._id,
        });
      }
    }

    const concessions = await Concession.insertMany(concessionsData);
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

      // Lấy danh sách concession thuộc rạp của showtime này
      const theaterConcessions = concessions.filter(
        (c) => c.theater.toString() === showtime.theater.toString()
      );

      const concessionItems = hasConcession && theaterConcessions.length > 0
        ? [
            {
              concession: theaterConcessions[i % theaterConcessions.length]._id,
              quantity: randomBetween(1, 2),
            },
          ]
        : [];

      const concessionTotal = hasConcession && theaterConcessions.length > 0
        ? theaterConcessions[i % theaterConcessions.length].price *
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