const Coupon = require('../models/Coupon.model');

// @desc    Validate a discount coupon
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res, next) => {
  try {
    const { code, totalPrice } = req.body;

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

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = totalPrice * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    // Cap the discount amount at the total price
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
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    // Check if code exists
    const codeExists = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (codeExists) {
      res.status(400);
      throw new Error('Mã giảm giá này đã tồn tại');
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      startDate,
      endDate,
      usageLimit,
      isActive,
    });

    res.status(201).json({
      success: true,
      data: coupon,
    });
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
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      startDate,
      endDate,
      usageLimit,
      isActive,
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

    const updatedCoupon = await coupon.save();

    res.json({
      success: true,
      data: updatedCoupon,
    });
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

    res.json({
      success: true,
      message: 'Mã giảm giá đã được xóa thành công',
    });
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
