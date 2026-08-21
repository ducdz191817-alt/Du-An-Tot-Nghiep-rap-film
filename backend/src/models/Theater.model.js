const mongoose = require('mongoose');

const TheaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a theater name'],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide theater address'],
    },
    city: {
      type: String,
      required: [true, 'Please provide theater city'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide theater contact phone'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Theater', TheaterSchema);
