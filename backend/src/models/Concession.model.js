const mongoose = require('mongoose');

const ConcessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a concession item name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide concession item description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide concession item price'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide concession image URL'],
    },
    type: {
      type: String,
      enum: ['food', 'drink', 'combo'],
      default: 'food',
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Please provide a theater complex'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Concession', ConcessionSchema);
