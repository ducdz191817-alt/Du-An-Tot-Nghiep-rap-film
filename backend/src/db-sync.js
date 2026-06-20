require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('./models/User.model');
const Movie = require('./models/Movie.model');
const Theater = require('./models/Theater.model');
const Room = require('./models/Room.model');
const Seat = require('./models/Seat.model');
const Showtime = require('./models/Showtime.model');
const Concession = require('./models/Concession.model');
const Booking = require('./models/Booking.model');
const Payment = require('./models/Payment.model');

const BACKUP_DIR = path.join(__dirname, '..', 'data', 'db-backup');

const MODELS_MAP = {
  users: User,
  movies: Movie,
  theaters: Theater,
  rooms: Room,
  seats: Seat,
  showtimes: Showtime,
  concessions: Concession,
  bookings: Booking,
  payments: Payment
};

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie-ticket-booking';
  await mongoose.connect(connUri);
};

const exportData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB for export...');
    await connectDB();
    console.log('✅ Connected!');

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    for (const [key, Model] of Object.entries(MODELS_MAP)) {
      console.log(`📦 Exporting collection: ${key}...`);
      let query = Model.find({});
      if (key === 'users') {
        query = query.select('+password');
      }
      const documents = await query;
      const filePath = path.join(BACKUP_DIR, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf-8');
      console.log(`   ✔ Exported ${documents.length} documents to ${key}.json`);
    }

    console.log('\n🎉 DATABASE EXPORTED SUCCESSFULLY to backend/data/db-backup/');
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB for import...');
    await connectDB();
    console.log('✅ Connected!');

    if (!fs.existsSync(BACKUP_DIR)) {
      console.error(`❌ Backup directory not found at ${BACKUP_DIR}`);
      console.log('Please run npm run db:export on your source machine first!');
      process.exit(1);
    }

    console.log('🗑️  Clearing all old collections...');
    for (const [key, Model] of Object.entries(MODELS_MAP)) {
      await Model.deleteMany({});
    }
    console.log('✅ Old data cleared.\n');

    for (const [key, Model] of Object.entries(MODELS_MAP)) {
      const filePath = path.join(BACKUP_DIR, `${key}.json`);
      if (fs.existsSync(filePath)) {
        console.log(`📥 Importing collection: ${key}...`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const documents = JSON.parse(fileContent);
        
        if (documents && documents.length > 0) {
          await Model.insertMany(documents);
          console.log(`   ✔ Imported ${documents.length} documents into ${key}`);
        } else {
          console.log(`   ⚠ ${key}.json is empty, skipping.`);
        }
      } else {
        console.log(`   ⚠ File not found for ${key}, skipping.`);
      }
    }

    console.log('\n🎉 DATABASE RESTORED/IMPORTED SUCCESSFULLY from backend/data/db-backup/');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

// Route command execution
const arg = process.argv[2];
if (arg === '--export') {
  exportData();
} else if (arg === '--import') {
  importData();
} else {
  console.log('Usage: node src/db-sync.js [--export | --import]');
  process.exit(1);
}
