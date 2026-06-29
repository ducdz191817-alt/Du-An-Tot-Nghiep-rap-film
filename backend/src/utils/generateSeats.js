const Seat = require('../models/Seat.model');

/**
 * HÀM HỖ TRỢ: Tự động sinh danh sách ghế (Thường, VIP, Đôi) cho một phòng chiếu mới
 * @param {string} roomId - ID của phòng chiếu (ObjectId)
 * @param {number} standardRowsCount - Số lượng hàng ghế Thường (Ví dụ: 5 hàng -> A, B, C, D, E)
 * @param {number} vipRowsCount - Số lượng hàng ghế VIP (Ví dụ: 3 hàng -> F, G, H)
 * @param {number} coupleRowsCount - Số lượng hàng ghế Đôi (Ví dụ: 1 hàng -> I)
 * @param {number} seatsPerRow - Số lượng ghế trên mỗi hàng (Ví dụ: 10 hoặc 12 ghế)
 * @returns {Promise<Array>} Danh sách các bản ghi ghế đã được tạo thành công trong Database
 */
const generateSeatsForRoom = async (
  roomId,
  standardRowsCount = 5,
  vipRowsCount = 3,
  coupleRowsCount = 1,
  seatsPerRow = 10
) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Bảng chữ cái để sinh tên hàng (A, B, C...)
  const seats = []; // Mảng tạm thời dùng để chứa toàn bộ các ghế chuẩn bị tạo

  let rowIdx = 0; // Chỉ số để lấy chữ cái tương ứng trong bảng alphabet

  // 1. TẠO CÁC HÀNG GHẾ THƯỜNG (Standard)
  for (let i = 0; i < standardRowsCount; i++) {
    const rowLetter = alphabet[rowIdx++]; // Lấy chữ cái tên hàng hiện tại (A, B, C...) và tăng chỉ số lên 1
    for (let num = 1; num <= seatsPerRow; num++) {
      // Đẩy object thông tin ghế Thường vào mảng tạm
      seats.push({
        room: roomId,       // Liên kết với phòng chiếu
        row: rowLetter,     // Hàng ghế
        number: num,        // Số ghế (1, 2, 3...)
        type: 'standard',   // Loại ghế: Thường
        price: 0,           // Ghế thường không phụ thu thêm tiền
      });
    }
  }

  // 2. TẠO CÁC HÀNG GHẾ VIP
  for (let i = 0; i < vipRowsCount; i++) {
    const rowLetter = alphabet[rowIdx++]; // Lấy chữ cái tên hàng tiếp theo
    for (let num = 1; num <= seatsPerRow; num++) {
      // Đẩy object thông tin ghế VIP vào mảng tạm
      seats.push({
        room: roomId,
        row: rowLetter,
        number: num,
        type: 'vip',        // Loại ghế: VIP
        price: 5000,        // Ghế VIP phụ thu thêm 5,000 VND
      });
    }
  }

  // 3. TẠO CÁC HÀNG GHẾ ĐÔI (Couple / Sweetbox)
  for (let i = 0; i < coupleRowsCount; i++) {
    const rowLetter = alphabet[rowIdx++]; // Lấy chữ cái tên hàng tiếp theo
    // Ghế đôi to gấp đôi ghế thường, chỉ tạo các số lẻ 1, 3, 5, 7...
    for (let num = 1; num <= seatsPerRow; num += 2) {
      // Đẩy object thông tin ghế Đôi vào mảng tạm
      seats.push({
        room: roomId,
        row: rowLetter,
        number: num,
        type: 'couple',     // Loại ghế: Đôi
        price: 120000,      // Ghế đôi phụ thu thêm 120,000 VND
      });
    }
  }

  // 4. LƯU TOÀN BỘ GHẾ VÀO DATABASE
  // Sử dụng insertMany để lưu đồng thời cả danh sách ghế chỉ bằng 1 câu lệnh, tối ưu hiệu năng
  const createdSeats = await Seat.insertMany(seats);
  return createdSeats;
};

module.exports = { generateSeatsForRoom };
