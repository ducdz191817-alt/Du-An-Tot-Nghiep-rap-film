require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { notFound, errorHandler } = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const showtimeRoutes = require('./routes/showtime.routes');
const bookingRoutes = require('./routes/booking.routes');
const concessionRoutes = require('./routes/concession.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewRoutes = require('./routes/review.routes');

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/concessions', concessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Base route status check
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Movie Ticket Booking API is fully functional',
    timestamp: new Date(),
  });
});

// Seed Initial Data Helper
const seedDatabase = async () => {
  try {
    const Movie = require('./models/Movie.model');
    const Theater = require('./models/Theater.model');
    const Room = require('./models/Room.model');
    const Seat = require('./models/Seat.model');
    const Showtime = require('./models/Showtime.model');
    const Concession = require('./models/Concession.model');
    const User = require('./models/User.model');
    const { generateSeatsForRoom } = require('./utils/generateSeats');

    const movieCount = await Movie.countDocuments();
    if (movieCount > 0) {
      console.log('Database already seeded with movies. Skipping seeding.');
      // Auto-migrate existing concessions without theater
      const existingConcessions = await Concession.find({ theater: { $exists: false } });
      if (existingConcessions.length > 0) {
        const firstTheater = await Theater.findOne();
        if (firstTheater) {
          await Concession.updateMany({ theater: { $exists: false } }, { theater: firstTheater._id });
          console.log(`Auto-Migration: Associated ${existingConcessions.length} existing concessions to theater ${firstTheater.name}`);
        }
      }
      return;
    }

    console.log('Seeding initial data...');

    // 1. Create Default Admin & User
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@booking.com',
      password: 'adminpassword123',
      role: 'admin',
      phone: '0987654321',
    });
    console.log(`Seed Admin account: email: admin@booking.com, password: adminpassword123`);

    const standardUser = await User.create({
      username: 'johndoe',
      email: 'john@gmail.com',
      password: 'userpassword123',
      role: 'user',
      phone: '0123456789',
    });
    console.log(`Seed User account: email: john@gmail.com, password: userpassword123`);

    // 2. Create Theaters
    const t1 = await Theater.create({
      name: 'Nova Cinema Landmark 81',
      address: 'Landmark 81, B1 Floor, Binh Thanh District',
      city: 'Ho Chi Minh',
      phone: '028 3822 3111',
    });

    const t2 = await Theater.create({
      name: 'Accident Studio Grand Hanoi',
      address: 'Vincom Center Ba Trieu, Hai Ba Trung District',
      city: 'Hanoi',
      phone: '024 3974 3333',
    });

    // 3. Create Rooms & Generate Seats
    const r1 = await Room.create({
      name: 'Hall 1 (IMAX)',
      theater: t1._id,
      type: 'IMAX',
      capacity: 88,
    });
    await generateSeatsForRoom(r1._id, 5, 3, 1, 10); // Standard, VIP, Couple seats

    const r2 = await Room.create({
      name: 'Hall 2 (2D/3D)',
      theater: t1._id,
      type: '2D',
      capacity: 88,
    });
    await generateSeatsForRoom(r2._id, 5, 3, 1, 10);

    const r3 = await Room.create({
      name: 'Room A (GOLDCLASS)',
      theater: t2._id,
      type: 'GOLDCLASS',
      capacity: 34,
    });
    await generateSeatsForRoom(r3._id, 2, 2, 1, 6);

    // 4. Create Movies
    const m1 = await Movie.create({
      title: 'Doctor Strange in the Multiverse of Madness',
      description: 'Doctor Strange teams up with a mysterious teenage girl from his dreams who can travel across multiverses, to battle multiple threats, including alternate-universe versions of himself, which threaten to wipe out millions across the multiverse.',
      duration: 126,
      genre: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi'],
      language: 'English with Vietnamese Subtitles',
      releaseDate: new Date('2024-05-04'),
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60',
      trailerUrl: 'https://www.youtube.com/embed/aWzlQ2N6qqg',
      status: 'now-showing',
      rating: 'T13',
      director: 'Sam Raimi',
      cast: ['Benedict Cumberbatch', 'Elizabeth Olsen', 'Chiwetel Ejiofor'],
    });

    const m2 = await Movie.create({
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
      duration: 166,
      genre: ['Action', 'Adventure', 'Sci-Fi'],
      language: 'English with Vietnamese Subtitles',
      releaseDate: new Date('2024-03-01'),
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop&q=60',
      trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
      status: 'now-showing',
      rating: 'T16',
      director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    });

    const m3 = await Movie.create({
      title: 'Deadpool & Wolverine',
      description: 'Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They team up to defeat a common enemy.',
      duration: 127,
      genre: ['Action', 'Comedy', 'Sci-Fi'],
      language: 'English with Vietnamese Subtitles',
      releaseDate: new Date('2024-07-26'),
      posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500&auto=format&fit=crop&q=60',
      trailerUrl: 'https://www.youtube.com/embed/73_1biulk6g',
      status: 'coming-soon',
      rating: 'T18',
      director: 'Shawn Levy',
      cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin'],
    });

    const m4 = await Movie.create({
      title: 'Spirited Away',
      description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
      duration: 125,
      genre: ['Animation', 'Adventure', 'Family', 'Fantasy'],
      language: 'Japanese with Vietnamese Subtitles',
      releaseDate: new Date('2001-07-20'),
      posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60',
      trailerUrl: 'https://www.youtube.com/embed/ByXuk9QqQkk',
      status: 'now-showing',
      rating: 'P',
      director: 'Hayao Miyazaki',
      cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'],
    });

    // 5. Create Concession Items
    await Concession.create([
      {
        name: 'Single Combo (Landmark 81)',
        description: '1 Large Popcorn + 1 Medium Soft Drink (Pepsi/7Up)',
        price: 79000,
        imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=500&auto=format&fit=crop&q=60',
        type: 'combo',
        theater: t1._id,
      },
      {
        name: 'Couple Combo (Landmark 81)',
        description: '1 Large Popcorn + 2 Medium Soft Drinks (Pepsi/7Up)',
        price: 109000,
        imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500&auto=format&fit=crop&q=60',
        type: 'combo',
        theater: t1._id,
      },
      {
        name: 'Salty Popcorn Large (Landmark 81)',
        description: 'Delicious hot butter salted popcorn',
        price: 55000,
        imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=500&auto=format&fit=crop&q=60',
        type: 'food',
        theater: t1._id,
      },
      {
        name: 'Pepsi Large (Landmark 81)',
        description: 'Cold and refreshing carbonated beverage',
        price: 35000,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
        type: 'drink',
        theater: t1._id,
      },
      // Theater 2 (Accident Studio Grand Hanoi) items
      {
        name: 'Single Combo (Grand Hanoi)',
        description: '1 Large Popcorn + 1 Medium Soft Drink (Pepsi/7Up)',
        price: 85000,
        imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=500&auto=format&fit=crop&q=60',
        type: 'combo',
        theater: t2._id,
      },
      {
        name: 'Couple Combo (Grand Hanoi)',
        description: '1 Large Popcorn + 2 Medium Soft Drinks (Pepsi/7Up)',
        price: 119000,
        imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500&auto=format&fit=crop&q=60',
        type: 'combo',
        theater: t2._id,
      },
      {
        name: 'Salty Popcorn Large (Grand Hanoi)',
        description: 'Delicious hot butter salted popcorn',
        price: 60000,
        imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=500&auto=format&fit=crop&q=60',
        type: 'food',
        theater: t2._id,
      },
      {
        name: 'Pepsi Large (Grand Hanoi)',
        description: 'Cold and refreshing carbonated beverage',
        price: 38000,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
        type: 'drink',
        theater: t2._id,
      },
    ]);

    // 6. Create Showtimes
    // Generate showtimes starting from today, at 2-hour increments
    const baseDate = new Date();
    baseDate.setHours(12, 0, 0, 0); // Start at 12 PM today

    const showtimes = [];

    // Movie 1 (Doctor Strange) Showtimes
    showtimes.push({
      movie: m1._id,
      theater: t1._id,
      room: r1._id,
      startTime: new Date(baseDate.getTime()),
      endTime: new Date(baseDate.getTime() + 126 * 60000 + 20 * 60000),
      ticketPrice: 110000,
      format: 'IMAX',
      bookedSeats: ['A4', 'A5', 'F1', 'F2'],
    });

    showtimes.push({
      movie: m1._id,
      theater: t1._id,
      room: r2._id,
      startTime: new Date(baseDate.getTime() + 3 * 3600000), // 3 hours later
      endTime: new Date(baseDate.getTime() + 3 * 3600000 + 126 * 60000 + 20 * 60000),
      ticketPrice: 85000,
      format: '2D',
      bookedSeats: [],
    });

    // Movie 2 (Dune: Part Two) Showtimes
    showtimes.push({
      movie: m2._id,
      theater: t1._id,
      room: r1._id,
      startTime: new Date(baseDate.getTime() + 4 * 3600000), // 4 hours later
      endTime: new Date(baseDate.getTime() + 4 * 3600000 + 166 * 60000 + 20 * 60000),
      ticketPrice: 130000,
      format: 'IMAX',
      bookedSeats: ['D5', 'D6', 'G8'],
    });

    // Movie 4 (Spirited Away) Showtimes
    showtimes.push({
      movie: m4._id,
      theater: t2._id,
      room: r3._id,
      startTime: new Date(baseDate.getTime() + 1 * 3600000), // 1 hour later
      endTime: new Date(baseDate.getTime() + 1 * 3600000 + 125 * 60000 + 20 * 60000),
      ticketPrice: 150000,
      format: 'GOLDCLASS',
      bookedSeats: ['A1', 'A2'],
    });

    // Seed showtimes tomorrow as well!
    const tomorrowBase = new Date();
    tomorrowBase.setDate(tomorrowBase.getDate() + 1);
    tomorrowBase.setHours(14, 0, 0, 0);

    showtimes.push({
      movie: m1._id,
      theater: t1._id,
      room: r1._id,
      startTime: new Date(tomorrowBase.getTime()),
      endTime: new Date(tomorrowBase.getTime() + 126 * 60000 + 20 * 60000),
      ticketPrice: 110000,
      format: 'IMAX',
      bookedSeats: [],
    });

    showtimes.push({
      movie: m2._id,
      theater: t1._id,
      room: r2._id,
      startTime: new Date(tomorrowBase.getTime() + 2 * 3600000),
      endTime: new Date(tomorrowBase.getTime() + 2 * 3600000 + 166 * 60000 + 20 * 60000),
      ticketPrice: 85000,
      format: '2D',
      bookedSeats: [],
    });

    await Showtime.insertMany(showtimes);
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Execute seeding after connection established
const mongooseConnection = require('mongoose').connection;
mongooseConnection.once('open', seedDatabase);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
