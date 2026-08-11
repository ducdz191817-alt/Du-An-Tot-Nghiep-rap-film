const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const Coupon = require('./models/Coupon.model.js');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1/movie-ticket-booking';

console.log('Connecting to MongoDB:', mongoUri.split('@')[1] || mongoUri);

mongoose.connect(mongoUri).then(async () => {
  await Coupon.deleteMany({});
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 6);
  
  await Coupon.insertMany([
    { code: 'WEDNESDAY30', discountType: 'percentage', discountValue: 30, minOrderAmount: 120000, isActive: true, endDate },
    { code: 'COUPLE2024', discountType: 'fixed', discountValue: 50000, minOrderAmount: 200000, isActive: true, endDate },
    { code: 'IMAXFLASH', discountType: 'fixed', discountValue: 99000, minOrderAmount: 150000, isActive: true, endDate },
    { code: 'NEWMEMBER', discountType: 'fixed', discountValue: 50000, minOrderAmount: 100000, isActive: true, endDate },
    { code: 'BIRTHDAY40', discountType: 'percentage', discountValue: 40, minOrderAmount: 150000, isActive: true, endDate },
    { code: 'GROUP5PLUS', discountType: 'percentage', discountValue: 20, minOrderAmount: 450000, isActive: true, endDate }
  ]);
  console.log('🎉 Coupons seeded successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

