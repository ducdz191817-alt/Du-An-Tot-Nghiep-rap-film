import api from './api';

const validateCoupon = async (code, totalPrice, context = {}) => {
  const response = await api.post('/coupons/validate', {
    code,
    totalPrice,
    seatCount: context.seatCount,
    showtimeStartTime: context.showtimeStartTime,
  });
  return response;
};

export const couponService = {
  validateCoupon,
};

export default couponService;
