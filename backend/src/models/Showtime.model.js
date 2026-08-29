const mongoose = require('mongoose');

const ShowtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
    },
    format: {
      type: String,
      default: '2D',
      uppercase: true,
      trim: true,
    },
    bookedSeats: {
      type: [String], // Array of seat codes that are booked, e.g., 'A1', 'B5'
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Showtime', ShowtimeSchema);
