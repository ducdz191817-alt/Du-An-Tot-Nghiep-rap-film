/**
 * TẦNG ĐIỀU HƯỚNG (ROUTER): booking.routes.js
 * Nhiệm vụ: Đón nhận các gói tin API từ Frontend (Ví dụ: /api/bookings)
 * và phân luồng (chuyển tiếp) chúng tới các hàm xử lý tương ứng ở Controller.
 */
const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingStatus,
  simulatePayment,
  cancelBooking,
  verifyTicket,
} = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');

// ── Public routes (no auth required) ─────────────────────────────────────────
// Dùng cho nhân viên soát vé quét QR mà không cần đăng nhập hệ thống
router.get('/verify/:ticketCode', verifyTicket);

// ── Protected routes ──────────────────────────────────────────────────────────
router.use(protect);

// Tạo hóa đơn mới (Khi khách hàng bấm nút Thanh Toán)
router.post('/', createBooking);

// Lấy lịch sử các vé đã đặt của tài khoản đang đăng nhập
router.get('/my', getMyBookings);

// Xem chi tiết mã QR của 1 vé cụ thể
router.get('/:id', getBookingById);

// Kiểm tra trạng thái thanh toán xem đã "paid" (đã trả tiền) chưa
router.get('/:id/status', getBookingStatus);

// Sandbox: Nút giả vờ thanh toán thành công
router.post('/:id/simulate-pay', simulatePayment);

// Hủy bỏ vé đang trong trạng thái chờ thanh toán
router.delete('/:id/cancel', cancelBooking);

module.exports = router;
