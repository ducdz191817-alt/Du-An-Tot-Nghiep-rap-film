const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 
      process.env.MONGODB_URI || 
      'mongodb://127.0.0.1:27017/movie-ticket-booking'
    );
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Ensure MongoDB is installed and running locally, or configure MONGODB_URI in your .env file.');
    // Do not exit process in development to let developer see errors
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
