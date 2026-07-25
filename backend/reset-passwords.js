const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/movie-booking';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);
  const result = await db.collection('users').updateMany({}, { $set: { password: hash } });
  console.log('✅ Updated', result.modifiedCount, 'users — new password: password123');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
