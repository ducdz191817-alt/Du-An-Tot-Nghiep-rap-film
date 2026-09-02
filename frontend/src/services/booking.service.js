/**
 * TẦNG GỌI API (FRONTEND SERVICE): booking.service.js
 * Nhiệm vụ: Gom dữ liệu từ các màn hình (Giao diện) và dùng thư viện Axios (biến `api`) 
 * để gửi Request lên Server (Backend).
 */
import api from './api';

// Hàm phụ trợ: Chuẩn hóa dữ liệu trả về từ Backend. 
// Đảm bảo Frontend luôn nhận được đúng phần data thay vì bọc trong nhiều lớp object.
const normalizeResponse = (response) => {
  return response && response.data !== undefined ? response.data : response;
};

// 1. Lấy danh sách suất chiếu của một bộ phim cụ thể (có thể lọc theo ngày)
const getShowtimesByMovie = async (movieId, date = '') => {
  const response = await api.get(`/showtimes/movie/${movieId}`, {
    params: date ? { date } : {},
  });
  return normalizeResponse(response);
};

// 2. Lấy chi tiết của một suất chiếu (dùng để vẽ sơ đồ ghế cho suất chiếu đó)
const getShowtimeById = async (id) => {
  const response = await api.get(`/showtimes/${id}`);
  return normalizeResponse(response);
};

// 3. Lấy toàn bộ danh sách suất chiếu (có thể kèm bộ lọc theo rạp, theo phim)
const getShowtimes = async (filters = {}) => {
  const response = await api.get('/showtimes', { params: filters });
  return normalizeResponse(response);
};

// 4. QUAN TRỌNG: Gửi yêu cầu Tạo Hóa Đơn Đặt Vé lên Server
// (Nhận cục data gồm: showtimeId, seats, concessions, paymentMethod... từ giao diện)
const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return normalizeResponse(response);
};

// 5. Lấy danh sách Lịch Sử Mua Vé của tài khoản đang đăng nhập
const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  return normalizeResponse(response);
};

// 6. Lấy chi tiết của một cái vé cụ thể (Dùng để xem lại mã QR Code)
const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return normalizeResponse(response);
};

// 7. Lấy danh sách Đồ ăn, Bắp Nước (Concessions) để hiển thị ở Tab 2
const getConcessions = async (theaterId = '') => {
  const response = await api.get('/concessions', {
    params: theaterId ? { theaterId } : {},
  });
  return normalizeResponse(response);
};

// 8. Hỏi Server xem trạng thái của hóa đơn này đã được thanh toán chưa (pending/paid)
const getBookingStatus = async (id) => {
  const response = await api.get(`/bookings/${id}/status`);
  return normalizeResponse(response);
};

// 9. Dành cho Sandbox: Bấm nút giả vờ như đã thanh toán VNPay thành công
const simulatePayment = async (id) => {
  const response = await api.post(`/bookings/${id}/simulate-pay`);
  return normalizeResponse(response);
};

// 10. Hủy hóa đơn đang chờ thanh toán
const cancelBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}/cancel`);
  return normalizeResponse(response);
};

// 11. XÁC MINH VÉ: Dùng cho Nhân viên soát vé cầm điện thoại quét mã QR Code.
// Không yêu cầu đăng nhập (Public) để nhân viên tiện quét mã của khách.
const verifyTicket = async (ticketCode) => {
  const response = await api.get(`/bookings/verify/${ticketCode}`);
  return normalizeResponse(response);
};

const bookingService = {
  getShowtimesByMovie,
  getShowtimeById,
  getShowtimes,
  createBooking,
  getMyBookings,
  getBookingById,
  getConcessions,
  getBookingStatus,
  simulatePayment,
  cancelBooking,
  verifyTicket,
};

export default bookingService;
