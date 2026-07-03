const mongoose = require('mongoose');
const Coupon = require('./models/Coupon.model.js');
require('dotenv').config({path: '../.env'});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1/movie-ticket-booking').then(async () => {
  await Coupon.deleteMany({});
  
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  await Coupon.insertMany([
    { code: 'NOVA20', discountType: 'percentage', discountValue: 20, maxDiscountAmount: 50000, minOrderAmount: 100000, isActive: true, endDate: nextMonth },
    { code: 'NOVA100K', discountType: 'fixed', discountValue: 100000, minOrderAmount: 200000, isActive: true, endDate: nextMonth },
    { code: 'WEDNESDAY30', discountType: 'percentage', discountValue: 30, minOrderAmount: 0, isActive: true, endDate: nextMonth },
    { code: 'COUPLE2024', discountType: 'fixed', discountValue: 50000, minOrderAmount: 200000, isActive: true, endDate: nextMonth },
    { code: 'IMAXFLASH', discountType: 'fixed', discountValue: 50000, minOrderAmount: 0, isActive: true, endDate: nextMonth },
    { code: 'NEWBIE50', discountType: 'fixed', discountValue: 50000, minOrderAmount: 100000, isActive: true, endDate: nextMonth },
    { code: 'BIRTHDAY40', discountType: 'percentage', discountValue: 40, minOrderAmount: 0, isActive: true, endDate: nextMonth },
    { code: 'GROUP20', discountType: 'percentage', discountValue: 20, minOrderAmount: 450000, isActive: true, endDate: nextMonth }
  ]);
  console.log('🎉 Coupons seeded successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
