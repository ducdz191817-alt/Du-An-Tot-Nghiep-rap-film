const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/movie-booking';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;

  // Đổi email admin@nova.com thành email thật để nhận mail test
  const result = await db.collection('users').updateOne(
    { email: 'admin@nova.com' },
    { $set: { email: 'vietduc250406@gmail.com' } }
  );
  console.log('✅ Updated admin email:', result.modifiedCount, 'document(s)');

  const admin = await db.collection('users').findOne({ email: 'vietduc250406@gmail.com', role: 'admin' });
  console.log('Admin now:', admin ? `${admin.username} <${admin.email}>` : 'Not found');

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
