import api from './api';

const validateCoupon = async (code, totalPrice) => {
  const response = await api.post('/coupons/validate', { code, totalPrice });
  return response;
};

export const couponService = {
  validateCoupon,
};

export default couponService;
