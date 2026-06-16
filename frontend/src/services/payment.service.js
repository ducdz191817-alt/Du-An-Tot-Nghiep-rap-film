import api from './api';

export async function createMomoPayment({ bookingId, amount, orderInfo }) {
  return api.post('/payments/momo/create', { bookingId, amount, orderInfo });
}

export default { createMomoPayment };
