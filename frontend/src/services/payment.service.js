import api from './api';

export async function createMomoPayment({ bookingId, amount, orderInfo }) {
  return api.post('/payments/momo/create', { bookingId, amount, orderInfo });
}

export async function createVnpayPayment({ bookingId, amount, orderInfo }) {
  return api.post('/payments/vnpay/create', { bookingId, amount, orderInfo });
}

export async function verifyVnpayPayment(queryParams) {
  return api.get(`/payments/vnpay/callback${queryParams}`);
}

export default {
  createMomoPayment,
  createVnpayPayment,
  verifyVnpayPayment,
};
