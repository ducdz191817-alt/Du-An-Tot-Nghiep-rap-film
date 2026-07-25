const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/movie-booking';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('users').updateOne(
    { username: 'Admin Nova' },
    { $set: { email: 'admin@nova.com' } }
  );
  console.log('✅ Admin email in MongoDB set to admin@nova.com');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
