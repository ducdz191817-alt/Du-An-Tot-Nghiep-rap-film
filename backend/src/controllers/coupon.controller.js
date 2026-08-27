const Coupon = require('../models/Coupon.model');
const Booking = require('../models/Booking.model');

// ─── Helper: Kiểm tra tất cả điều kiện đặc biệt của coupon ──────────────────
const checkCouponConditions = async (coupon, context, user) => {
  const cond = coupon.conditions;
  if (!cond) return; // Không có điều kiện → áp dụng tự do

  const now = new Date();

  // 1. Điều kiện ngày trong tuần (0=CN, 3=T4, 6=T7...)
  if (cond.daysOfWeek && cond.daysOfWeek.length > 0) {
    const todayDow = now.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed
    if (!cond.daysOfWeek.includes(todayDow)) {
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const requiredDays = cond.daysOfWeek.map(d => dayNames[d]).join(', ');
      throw new Error(`Mã này chỉ áp dụng vào: ${requiredDays}. Hôm nay là ${dayNames[todayDow]}.`);
    }
  }

  // 2. Điều kiện cuối tuần
  if (cond.weekendOnly) {
    const dow = now.getDay();
    if (dow !== 0 && dow !== 6) {
      throw new Error('Mã này chỉ áp dụng vào Thứ Bảy và Chủ Nhật (cuối tuần).');
    }
  }

  // 3. Điều kiện giờ suất chiếu (ví dụ: chỉ áp dụng suất trước 12h trưa)
  if (cond.maxShowtimeHour !== null && cond.maxShowtimeHour !== undefined) {
    const showtimeStr = context?.showtimeStartTime;
    if (!showtimeStr) {
      throw new Error('Cần cung cấp thông tin suất chiếu để kiểm tra điều kiện mã.');
    }
    const showtimeDate = new Date(showtimeStr);
    const showtimeHour = showtimeDate.getHours();
    if (showtimeHour >= cond.maxShowtimeHour) {
      throw new Error(`Mã này chỉ áp dụng cho suất chiếu bắt đầu trước ${cond.maxShowtimeHour}:00 (suất sáng).`);
    }
  }

  // 4. Điều kiện số ghế tối thiểu
  if (cond.minSeats !== null && cond.minSeats !== undefined) {
    const seatCount = context?.seatCount || 0;
    if (seatCount < cond.minSeats) {
      throw new Error(`Mã này yêu cầu đặt tối thiểu ${cond.minSeats} ghế. Bạn đang chọn ${seatCount} ghế.`);
    }
  }

  // 5. Điều kiện đặt vé lần đầu tiên
  if (cond.firstBookingOnly) {
    if (!user) throw new Error('Không xác định được thông tin người dùng.');
    const paidCount = await Booking.countDocuments({
      user: user._id,
      paymentStatus: 'paid',
    });
    if (paidCount > 0) {
      throw new Error('Mã này chỉ áp dụng cho lần đặt vé đầu tiên của tài khoản.');
    }
  }

  // 6. Điều kiện tháng sinh nhật
  if (cond.birthMonthOnly) {
    if (!user) throw new Error('Không xác định được thông tin người dùng.');
    const dob = user.dob;
    if (!dob) {
      throw new Error('Bạn chưa cập nhật ngày sinh trong hồ sơ tài khoản. Vui lòng cập nhật để sử dụng mã sinh nhật.');
    }
    const userBirthMonth = new Date(dob).getMonth(); // 0-indexed
    const currentMonth = now.getMonth();
    if (userBirthMonth !== currentMonth) {
      const monthNames = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
        'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
      throw new Error(`Mã sinh nhật chỉ áp dụng trong tháng sinh nhật của bạn (${monthNames[userBirthMonth]}). Hiện là ${monthNames[currentMonth]}.`);
    }
  }
};

// @desc    Validate a discount coupon
// @route   POST /api/coupons/validate
// @access  Private
// body: { code, totalPrice, seatCount?, showtimeStartTime? }
const validateCoupon = async (req, res, next) => {
  try {
    const { code, totalPrice, seatCount, showtimeStartTime } = req.body;

    if (!code) {
      res.status(400);
      throw new Error('Vui lòng cung cấp mã giảm giá');
    }

    if (totalPrice === undefined || totalPrice === null) {
      res.status(400);
      throw new Error('Vui lòng cung cấp tổng tiền trước giảm giá');
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      res.status(404);
      throw new Error('Mã giảm giá không tồn tại');
    }

    if (!coupon.isActive) {
      res.status(400);
      throw new Error('Mã giảm giá đã bị vô hiệu hóa');
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      res.status(400);
      throw new Error('Mã giảm giá chưa đến thời gian áp dụng');
    }

    if (coupon.endDate && now > coupon.endDate) {
      res.status(400);
      throw new Error('Mã giảm giá đã hết hạn sử dụng');
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      res.status(400);
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    if (totalPrice < coupon.minOrderAmount) {
      res.status(400);
      throw new Error(
        `Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')} đ để áp dụng mã này`
      );
    }

    // ── Kiểm tra điều kiện đặc biệt ─────────────────────────────────────────
    try {
      const user = await require('../models/User.model').findById(req.user._id).lean();
      await checkCouponConditions(coupon, { seatCount, showtimeStartTime }, user);
    } catch (condErr) {
      res.status(400);
      throw condErr;
    }

    // ── Tính tiền giảm ───────────────────────────────────────────────────────
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = totalPrice * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, totalPrice);
    const finalPrice = totalPrice - discountAmount;

    res.json({
      success: true,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all coupons (Admin)
// @route   GET /api/admin/coupons
// @access  Private/Admin
const listCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coupon (Admin)
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const {
      code, discountType, discountValue, maxDiscountAmount,
      minOrderAmount, startDate, endDate, usageLimit, isActive, conditions,
    } = req.body;

    const codeExists = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (codeExists) {
      res.status(400);
      throw new Error('Mã giảm giá này đã tồn tại');
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType, discountValue, maxDiscountAmount,
      minOrderAmount, startDate, endDate, usageLimit, isActive,
      conditions: conditions || {},
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a coupon (Admin)
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error('Không tìm thấy mã giảm giá');
    }

    const {
      code, discountType, discountValue, maxDiscountAmount,
      minOrderAmount, startDate, endDate, usageLimit, isActive, conditions,
    } = req.body;

    if (code) {
      const codeExists = await Coupon.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: coupon._id },
      });
      if (codeExists) {
        res.status(400);
        throw new Error('Mã giảm giá này đã tồn tại');
      }
      coupon.code = code.trim().toUpperCase();
    }

    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (startDate !== undefined) coupon.startDate = startDate;
    if (endDate !== undefined) coupon.endDate = endDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (conditions !== undefined) coupon.conditions = conditions;

    const updatedCoupon = await coupon.save();
    res.json({ success: true, data: updatedCoupon });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a coupon (Admin)
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error('Không tìm thấy mã giảm giá');
    }
    await coupon.deleteOne();
    res.json({ success: true, message: 'Mã giảm giá đã được xóa thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
