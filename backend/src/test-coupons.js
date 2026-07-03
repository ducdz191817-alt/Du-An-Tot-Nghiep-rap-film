/**
 * test-coupons.js
 *
 * Tạo các coupon mẫu trong DB và chạy thử nghiệm validate.
 *
 * Chạy: node src/test-coupons.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('./models/Coupon.model');

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/movie-ticket-booking'
    );
    console.log('✅ Connected!\n');

    // Clear old test coupons
    await Coupon.deleteMany({ code: { $in: ['NOVA20', 'NOVA100K', 'EXPIREDCODE'] } });

    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);

    const past = new Date();
    past.setDate(past.getDate() - 10);

    console.log('🎟️ Creating test coupons...');
    const coupons = await Coupon.insertMany([
      {
        code: 'NOVA20',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 50000,
        minOrderAmount: 100000,
        startDate: now,
        endDate: future,
        usageLimit: 100,
        isActive: true,
      },
      {
        code: 'NOVA100K',
        discountType: 'fixed',
        discountValue: 100000,
        minOrderAmount: 200000,
        startDate: now,
        endDate: future,
        usageLimit: 5,
        isActive: true,
      },
      {
        code: 'EXPIREDCODE',
        discountType: 'fixed',
        discountValue: 50000,
        startDate: past,
        endDate: past,
        isActive: true,
      }
    ]);

    console.log(`✅ Created ${coupons.length} test coupons.\n`);

    // Let's call the validate logic locally to test it
    const testCases = [
      { code: 'NOVA20', totalPrice: 150000 },  // Expect: 20% of 150k = 30k discount
      { code: 'NOVA20', totalPrice: 400000 },  // Expect: 20% of 400k = 80k, capped at 50k
      { code: 'NOVA20', totalPrice: 50000 },   // Expect: Error (below minOrderAmount)
      { code: 'NOVA100K', totalPrice: 250000 }, // Expect: 100k discount
      { code: 'EXPIREDCODE', totalPrice: 100000 }, // Expect: Error (expired)
      { code: 'INVALID', totalPrice: 100000 }  // Expect: Error (not found)
    ];

    console.log('🧪 Running locally-simulated validation tests:');
    for (const tc of testCases) {
      try {
        const coupon = await Coupon.findOne({ code: tc.code.toUpperCase() });
        if (!coupon) {
          throw new Error('Mã giảm giá không tồn tại');
        }
        if (!coupon.isActive) {
          throw new Error('Mã giảm giá đã bị vô hiệu hóa');
        }
        const today = new Date();
        if (coupon.startDate && today < coupon.startDate) {
          throw new Error('Mã giảm giá chưa đến thời gian áp dụng');
        }
        if (coupon.endDate && today > coupon.endDate) {
          throw new Error('Mã giảm giá đã hết hạn sử dụng');
        }
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
          throw new Error('Mã giảm giá đã hết lượt sử dụng');
        }
        if (tc.totalPrice < coupon.minOrderAmount) {
          throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minOrderAmount} để áp dụng`);
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = tc.totalPrice * (coupon.discountValue / 100);
          if (coupon.maxDiscountAmount !== null) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
          }
        } else if (coupon.discountType === 'fixed') {
          discount = coupon.discountValue;
        }
        discount = Math.min(discount, tc.totalPrice);

        console.log(`  🟢 PASS: Code [${tc.code}] at ${tc.totalPrice} đ -> Discount: ${discount} đ (Final: ${tc.totalPrice - discount} đ)`);
      } catch (err) {
        console.log(`  🔴 FAIL/EXPECTED ERROR: Code [${tc.code}] at ${tc.totalPrice} đ -> Error: ${err.message}`);
      }
    }

    console.log('\n🎉 Test finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
