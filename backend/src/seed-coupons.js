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
    {
      code: 'WEDNESDAY30',
      discountType: 'percentage',
      discountValue: 30,
      minOrderAmount: 120000,
      isActive: true,
      endDate,
      conditions: {
        daysOfWeek: [3], // Chỉ Thứ Tư (0=CN, 1=T2, 2=T3, 3=T4, ...)
      },
    },
    {
      code: 'COUPLE2024',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderAmount: 200000,
      isActive: true,
      endDate,
      conditions: {
        weekendOnly: true, // Chỉ cuối tuần (Thứ 7 + CN)
      },
    },
    {
      code: 'IMAXFLASH',
      discountType: 'fixed',
      discountValue: 99000,
      minOrderAmount: 150000,
      isActive: true,
      endDate,
      conditions: {
        maxShowtimeHour: 12, // Suất chiếu phải bắt đầu trước 12:00 trưa
      },
    },
    {
      code: 'NEWMEMBER',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderAmount: 100000,
      isActive: true,
      endDate,
      conditions: {
        firstBookingOnly: true, // Chỉ áp dụng lần đặt vé đầu tiên
      },
    },
    {
      code: 'BIRTHDAY40',
      discountType: 'percentage',
      discountValue: 40,
      minOrderAmount: 150000,
      isActive: true,
      endDate,
      conditions: {
        birthMonthOnly: true, // Chỉ áp dụng trong tháng sinh nhật
      },
    },
    {
      code: 'GROUP5PLUS',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 450000,
      isActive: true,
      endDate,
      conditions: {
        minSeats: 5, // Yêu cầu ít nhất 5 ghế
      },
    },
  ]);

  console.log('🎉 Coupons seeded successfully with correct conditions!');
  console.log('  WEDNESDAY30  → Chỉ áp dụng vào Thứ Tư');
  console.log('  COUPLE2024   → Chỉ áp dụng vào cuối tuần (Thứ 7, CN)');
  console.log('  IMAXFLASH    → Chỉ áp dụng suất chiếu trước 12:00 trưa');
  console.log('  NEWMEMBER    → Chỉ áp dụng lần đặt vé đầu tiên');
  console.log('  BIRTHDAY40   → Chỉ áp dụng trong tháng sinh nhật');
  console.log('  GROUP5PLUS   → Yêu cầu đặt ít nhất 5 ghế');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
