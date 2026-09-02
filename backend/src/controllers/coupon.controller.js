const Coupon = require('../models/Coupon.model');
const Booking = require('../models/Booking.model');

// ─── Helper: Kiểm tra tất cả các điều kiện đặc biệt của mã giảm giá (Coupon) ───
// Bao gồm: ngày trong tuần, cuối tuần, khung giờ chiếu, số ghế tối thiểu, đặt vé lần đầu, tháng sinh nhật
const checkCouponConditions = async (coupon, context, user) => {
  const cond = coupon.conditions;
  if (!cond) return; // Không có điều kiện đặc biệt → cho phép áp dụng tự do

  const now = new Date();

  // 1. Kiểm tra điều kiện ngày trong tuần (0 = Chủ Nhật, 1 = Thứ 2, ..., 3 = Thứ 4, 6 = Thứ 7)
  if (cond.daysOfWeek && cond.daysOfWeek.length > 0) {
    const todayDow = now.getDay();
    if (!cond.daysOfWeek.includes(todayDow)) {
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const requiredDays = cond.daysOfWeek.map(d => dayNames[d]).join(', ');
      throw new Error(`Mã này chỉ áp dụng vào: ${requiredDays}. Hôm nay là ${dayNames[todayDow]}.`);
    }
  }

  // 2. Kiểm tra điều kiện chỉ áp dụng vào dịp cuối tuần (Thứ 7 & Chủ Nhật)
  if (cond.weekendOnly) {
    const dow = now.getDay();
    if (dow !== 0 && dow !== 6) {
      throw new Error('Mã này chỉ áp dụng vào Thứ Bảy và Chủ Nhật (cuối tuần).');
    }
  }

  // 3. Kiểm tra điều kiện khung giờ của suất chiếu (ví dụ: chỉ áp dụng suất chiếu sáng trước 12h)
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

  // 4. Kiểm tra điều kiện số lượng ghế tối thiểu trong đơn đặt vé
  if (cond.minSeats !== null && cond.minSeats !== undefined) {
    const seatCount = context?.seatCount || 0;
    if (seatCount < cond.minSeats) {
      throw new Error(`Mã này yêu cầu đặt tối thiểu ${cond.minSeats} ghế. Bạn đang chọn ${seatCount} ghế.`);
    }
  }

  // 5. Kiểm tra điều kiện chỉ áp dụng cho lần đầu tiên khách hàng đặt vé trên hệ thống
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

  // 6. Kiểm tra điều kiện áp dụng trong tháng sinh nhật của khách hàng
  if (cond.birthMonthOnly) {
    if (!user) throw new Error('Không xác định được thông tin người dùng.');
    const dob = user.dob;
    if (!dob) {
      throw new Error('Bạn chưa cập nhật ngày sinh trong hồ sơ tài khoản. Vui lòng cập nhật để sử dụng mã sinh nhật.');
    }
    const userBirthMonth = new Date(dob).getMonth(); // 0-indexed (0: tháng 1, ..., 11: tháng 12)
    const currentMonth = now.getMonth();
    if (userBirthMonth !== currentMonth) {
      const monthNames = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
        'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
      throw new Error(`Mã sinh nhật chỉ áp dụng trong tháng sinh nhật của bạn (${monthNames[userBirthMonth]}). Hiện là ${monthNames[currentMonth]}.`);
    }
  }
};

/**
 * @desc    Kiểm tra và áp dụng mã giảm giá khi khách hàng đặt vé
 * @route   POST /api/coupons/validate
 * @access  Private (Khách hàng đã đăng nhập)
 * @body    { code, totalPrice, seatCount, showtimeStartTime }
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, totalPrice, seatCount, showtimeStartTime } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào cơ bản
    if (!code) {
      res.status(400);
      throw new Error('Vui lòng cung cấp mã giảm giá');
    }

    if (totalPrice === undefined || totalPrice === null) {
      res.status(400);
      throw new Error('Vui lòng cung cấp tổng tiền trước giảm giá');
    }

    // 2. Tìm mã giảm giá trong Database
    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      res.status(404);
      throw new Error('Mã giảm giá không tồn tại');
    }

    // 3. Kiểm tra trạng thái hoạt động của mã
    if (!coupon.isActive) {
      res.status(400);
      throw new Error('Mã giảm giá đã bị vô hiệu hóa');
    }

    const now = new Date();
    // 4. Kiểm tra thời hạn bắt đầu áp dụng mã
    if (coupon.startDate && now < coupon.startDate) {
      res.status(400);
      throw new Error('Mã giảm giá chưa đến thời gian áp dụng');
    }

    // 5. Kiểm tra thời hạn kết thúc của mã
    if (coupon.endDate && now > coupon.endDate) {
      res.status(400);
      throw new Error('Mã giảm giá đã hết hạn sử dụng');
    }

    // 6. Kiểm tra giới hạn tổng số lượt sử dụng
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      res.status(400);
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    // 7. Kiểm tra giá trị đơn hàng tối thiểu
    if (totalPrice < coupon.minOrderAmount) {
      res.status(400);
      throw new Error(
        `Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')} đ để áp dụng mã này`
      );
    }

    // 8. Kiểm tra các điều kiện mở rộng (ngày trong tuần, giờ chiếu, số ghế, sinh nhật, lần đầu đặt)
    try {
      const user = await require('../models/User.model').findById(req.user._id).lean();
      await checkCouponConditions(coupon, { seatCount, showtimeStartTime }, user);
    } catch (condErr) {
      res.status(400);
      throw condErr;
    }

    // 9. Tính toán số tiền được giảm theo loại giảm giá (% hoặc số tiền cố định)
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = totalPrice * (coupon.discountValue / 100);
      // Giới hạn số tiền giảm tối đa nếu có thiết lập
      if (coupon.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    // Đảm bảo số tiền giảm không vượt quá tổng giá trị đơn hàng
    discountAmount = Math.min(discountAmount, totalPrice);
    const finalPrice = totalPrice - discountAmount;

    // 10. Trả về kết quả sau khi áp dụng mã giảm giá thành công
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

/**
 * @desc    Lấy danh sách tất cả mã giảm giá (Dành cho Quản trị viên)
 * @route   GET /api/admin/coupons
 * @access  Private/Admin
 */
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

/**
 * @desc    Tạo mã giảm giá mới (Dành cho Quản trị viên)
 * @route   POST /api/admin/coupons
 * @access  Private/Admin
 */
const createCoupon = async (req, res, next) => {
  try {
    const {
      code, discountType, discountValue, maxDiscountAmount,
      minOrderAmount, startDate, endDate, usageLimit, isActive, conditions,
    } = req.body;

    // Kiểm tra xem mã giảm giá đã tồn tại hay chưa
    const codeExists = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (codeExists) {
      res.status(400);
      throw new Error('Mã giảm giá này đã tồn tại');
    }

    // Tạo bản ghi mã giảm giá mới trong Database
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

/**
 * @desc    Cập nhật thông tin mã giảm giá (Dành cho Quản trị viên)
 * @route   PUT /api/admin/coupons/:id
 * @access  Private/Admin
 */
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

    // Nếu có đổi code, kiểm tra xem code mới có trùng với mã nào khác không
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

    // Cập nhật các trường thông tin nếu có gửi lên
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

/**
 * @desc    Xóa mã giảm giá (Dành cho Quản trị viên)
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private/Admin
 */
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
