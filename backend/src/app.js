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
const momoRoutes = require('./routes/momo.routes');
const vnpayRoutes = require('./routes/vnpay.routes');
const tmdbRoutes = require('./routes/tmdb.routes');

// Connect to MongoDB
connectDB();

// Auto-update movie statuses after DB is ready
const { autoUpdateMovieStatus } = require('./utils/autoUpdateMovieStatus');
// Delay slightly to let the DB connection settle, then run immediately and every hour
setTimeout(async () => {
  await autoUpdateMovieStatus();
  setInterval(autoUpdateMovieStatus, 60 * 60 * 1000); // every 1 hour
}, 3000);

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
app.use('/api/payments/momo', momoRoutes);
app.use('/api/payments/vnpay', vnpayRoutes);
app.use('/api/admin/tmdb', tmdbRoutes);

// Base route status check
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Movie Ticket Booking API is fully functional',
    timestamp: new Date(),
  });
});

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const { initSocket } = require('./sockets/seatSocket');
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
