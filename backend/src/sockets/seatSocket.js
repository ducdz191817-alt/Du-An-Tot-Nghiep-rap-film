const socketIo = require('socket.io');
const Showtime = require('../models/Showtime.model');

// Bộ lưu trữ bộ nhớ RAM tạm thời quản lý các ghế đang giữ chỗ theo thời gian thực (Real-time held seats)
// Cấu trúc: Map<showtimeId, Map<seatCode, { userId, socketId, expiresAt, timeoutId }>>
const heldSeats = new Map();

// Theo dõi danh sách ghế mà mỗi Socket kết nối đang giữ (phục vụ tự động giải phóng khi người dùng mất kết nối)
// Cấu trúc: Map<socketId, { userId, holds: [{showtimeId, seatCode}] }>
const socketHolds = new Map();

// Thời gian giữ ghế tối đa (10 phút = 600.000 ms)
const HOLD_DURATION = 10 * 60 * 1000;

let io;

/**
 * @function initSocket
 * @desc     Khởi tạo và cấu hình các sự kiện WebSocket (Socket.IO) cho tính năng đặt ghế thời gian thực
 * @param    {Server} server - Đối tượng HTTP Server của Node.js
 */
const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*', // Trong môi trường sản xuất nên cấu hình cụ thể địa chỉ Frontend
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket kết nối mới: ${socket.id}`);

    // 1. Sự kiện khi người dùng tham gia vào phòng (Room) của một suất chiếu cụ thể
    socket.on('join_showtime', ({ showtimeId, userId }) => {
      if (!showtimeId) return;
      const sId = String(showtimeId).trim();
      const strUserId = userId ? String(userId) : socket.id;

      socket.join(`showtime_${sId}`);
      console.log(`Người dùng ${strUserId} đã vào phòng showtime_${sId}`);

      // Khởi tạo thông tin theo dõi ghế cho socket này nếu chưa có
      if (!socketHolds.has(socket.id)) {
        socketHolds.set(socket.id, { userId: strUserId, holds: [] });
      }

      // Trả về danh sách các ghế đang bị giữ chỗ hiện tại cho client vừa kết nối
      if (heldSeats.has(sId)) {
        const showtimeHolds = heldSeats.get(sId);
        const holdsArray = Array.from(showtimeHolds.entries()).map(([seatCode, data]) => ({
          seatCode,
          userId: String(data.userId),
          expiresAt: data.expiresAt,
        }));
        socket.emit('initial_held_seats', holdsArray);
      } else {
        socket.emit('initial_held_seats', []);
      }
    });

    // 2. Sự kiện khi người dùng rời khỏi phòng xem suất chiếu
    socket.on('leave_showtime', ({ showtimeId }) => {
      if (showtimeId) {
        socket.leave(`showtime_${String(showtimeId).trim()}`);
      }
    });

    // 3. Sự kiện khi người dùng click chọn 1 ghế để giữ chỗ tạm thời trong 10 phút
    socket.on('hold_seat', async ({ showtimeId, seatCode, userId }) => {
      if (!showtimeId || !seatCode || !userId) return;
      const sId = String(showtimeId).trim();
      const sCode = String(seatCode).trim().toUpperCase();
      const strUserId = String(userId).trim();

      // Kiểm tra trong CSDL xem ghế này đã được mua và thanh toán hoàn tất chưa
      try {
        const showtime = await Showtime.findById(sId).select('bookedSeats');
        if (showtime && showtime.bookedSeats && showtime.bookedSeats.includes(sCode)) {
          socket.emit('hold_seat_failed', { seatCode: sCode, message: 'Ghế này đã được người khác thanh toán thành công!' });
          return;
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra DB trong hold_seat:', err);
      }

      if (!heldSeats.has(sId)) {
        heldSeats.set(sId, new Map());
      }
      const showtimeHolds = heldSeats.get(sId);

      // Kiểm tra xem ghế đã có người giữ chưa
      if (showtimeHolds.has(sCode)) {
        const currentHold = showtimeHolds.get(sCode);
        if (String(currentHold.userId) !== strUserId) {
          // Người khác đang giữ -> Từ chối giữ ghế
          socket.emit('hold_seat_failed', { seatCode: sCode, message: 'Ghế này đang được người khác giữ!' });
          return;
        } else {
          // Cùng người dùng nhưng socketId khác (do làm mới trang hoặc reconnect) -> Cập nhật socketId mới
          if (currentHold.socketId && currentHold.socketId !== socket.id) {
            const oldSocketData = socketHolds.get(currentHold.socketId);
            if (oldSocketData) {
              oldSocketData.holds = oldSocketData.holds.filter(
                (h) => !(h.showtimeId === sId && h.seatCode === sCode)
              );
            }
          }

          clearTimeout(currentHold.timeoutId);
          const remainingMs = Math.max(0, currentHold.expiresAt - Date.now());
          if (remainingMs <= 0) {
            releaseSeat(sId, sCode, socket.id);
            socket.emit('hold_seat_failed', { seatCode: sCode, message: 'Thời gian giữ ghế đã hết hạn' });
            return;
          }

          const timeoutId = setTimeout(() => {
            releaseSeat(sId, sCode);
          }, remainingMs);

          showtimeHolds.set(sCode, {
            ...currentHold,
            userId: strUserId,
            socketId: socket.id,
            timeoutId,
          });

          if (!socketHolds.has(socket.id)) {
            socketHolds.set(socket.id, { userId: strUserId, holds: [] });
          }
          const socketData = socketHolds.get(socket.id);
          if (!socketData.holds.find((h) => h.showtimeId === sId && h.seatCode === sCode)) {
            socketData.holds.push({ showtimeId: sId, seatCode: sCode });
          }

          socket.to(`showtime_${sId}`).emit('seat_held', { seatCode: sCode, userId: strUserId });
          socket.emit('hold_seat_success', { seatCode: sCode });
          return;
        }
      }

      // Tạo thời gian đếm ngược 10 phút tự động hủy giữ ghế
      const timeoutId = setTimeout(() => {
        releaseSeat(sId, sCode);
      }, HOLD_DURATION);

      showtimeHolds.set(sCode, {
        userId: strUserId,
        socketId: socket.id,
        expiresAt: Date.now() + HOLD_DURATION,
        timeoutId,
      });

      if (!socketHolds.has(socket.id)) {
        socketHolds.set(socket.id, { userId: strUserId, holds: [] });
      }
      socketHolds.get(socket.id).holds.push({ showtimeId: sId, seatCode: sCode });

      // Gửi thông báo tới tất cả các client khác trong phòng
      socket.to(`showtime_${sId}`).emit('seat_held', { seatCode: sCode, userId: strUserId });
      socket.emit('hold_seat_success', { seatCode: sCode });
    });

    // 4. Sự kiện khi người dùng chủ động bỏ chọn (hủy giữ) 1 ghế
    socket.on('release_seat', ({ showtimeId, seatCode, userId }) => {
      if (!showtimeId || !seatCode) return;
      const sId = String(showtimeId).trim();
      const sCode = String(seatCode).trim().toUpperCase();
      const showtimeHolds = heldSeats.get(sId);
      if (showtimeHolds && showtimeHolds.has(sCode)) {
        const currentHold = showtimeHolds.get(sCode);
        if (String(currentHold.userId) === String(userId).trim()) {
          releaseSeat(sId, sCode, socket.id);
          const socketData = socketHolds.get(socket.id);
          if (socketData) {
            socketData.holds = socketData.holds.filter(
              (h) => !(h.showtimeId === sId && h.seatCode === sCode)
            );
          }
        }
      }
    });

    // 5. Sự kiện khi người dùng chuyển sang trang thanh toán (Bảo lưu danh sách ghế giữ, không tự động nhả khi chuyển trang)
    socket.on('going_to_payment', ({ showtimeId, userId }) => {
      const socketData = socketHolds.get(socket.id);
      if (socketData) {
        console.log(`Người dùng ${userId} đang tiến hành thanh toán, bảo lưu ${socketData.holds.length} ghế đã giữ.`);
        socketHolds.delete(socket.id);
      }
    });

    // 6. Xử lý khi người dùng mất kết nối Socket (đóng trình duyệt / rớt mạng)
    socket.on('disconnect', () => {
      console.log(`Socket ngắt kết nối: ${socket.id}`);
      const socketData = socketHolds.get(socket.id);
      if (socketData && socketData.holds.length > 0) {
        console.log(`Tự động nhả ${socketData.holds.length} ghế đang giữ của socket ${socket.id} (user: ${socketData.userId})`);
        socketData.holds.forEach(({ showtimeId, seatCode }) => {
          releaseSeat(showtimeId, seatCode, socket.id);
        });
      }
      socketHolds.delete(socket.id);
    });
  });
};

/**
 * @helper   Giải phóng một ghế đã giữ chỗ và phát thông báo qua Socket cho tất cả client
 * @param    {string} showtimeId - ID suất chiếu
 * @param    {string} seatCode - Mã ghế (ví dụ: A5)
 * @param    {string} [requestingSocketId] - ID của Socket yêu cầu giải phóng (nếu có)
 */
const releaseSeat = (showtimeId, seatCode, requestingSocketId = null) => {
  const sId = String(showtimeId).trim();
  const sCode = String(seatCode).trim().toUpperCase();
  const showtimeHolds = heldSeats.get(sId);
  if (showtimeHolds && showtimeHolds.has(sCode)) {
    const holdData = showtimeHolds.get(sCode);

    // Nếu có requestingSocketId, chỉ giải phóng nếu ghế VẪN ĐANG thuộc socket đó
    if (requestingSocketId && holdData.socketId && holdData.socketId !== requestingSocketId) {
      console.log(`[releaseSeat] Bỏ qua yêu cầu giải phóng ${sCode} từ socket cũ ${requestingSocketId}, socket hoạt động là ${holdData.socketId}`);
      return;
    }

    clearTimeout(holdData.timeoutId);
    showtimeHolds.delete(sCode);

    if (showtimeHolds.size === 0) {
      heldSeats.delete(sId);
    }

    // Phát sự kiện seat_released thông báo ghế đã trống
    if (io) {
      io.to(`showtime_${sId}`).emit('seat_released', { seatCode: sCode });
    }
  }
};

/**
 * @function confirmBookingClearHolds
 * @desc     Xóa trạng thái giữ chỗ tạm thời và phát thông báo ghế đã được mua thành công (được gọi từ booking.controller.js)
 * @param    {string} showtimeId - ID suất chiếu
 * @param    {Array<string>} seatCodes - Danh sách mã ghế đã thanh toán
 * @param    {string} userId - ID người dùng vừa thanh toán
 */
const confirmBookingClearHolds = (showtimeId, seatCodes, userId) => {
  const showtimeHolds = heldSeats.get(showtimeId);
  if (showtimeHolds) {
    seatCodes.forEach(seatCode => {
      if (showtimeHolds.has(seatCode)) {
        const holdData = showtimeHolds.get(seatCode);
        clearTimeout(holdData.timeoutId);
        showtimeHolds.delete(seatCode);
      }
    });
    if (showtimeHolds.size === 0) {
      heldSeats.delete(showtimeId);
    }
  }

  // Phát thông báo seat_booked tới tất cả mọi người trong phòng suất chiếu
  if (io) {
    io.to(`showtime_${showtimeId}`).emit('seat_booked', { seatCodes });
  }
};

/**
 * @function getConflictingHeldSeats
 * @desc     CHỐNG CƯỚP GHẾ (RACE CONDITION): Kiểm tra xem các ghế người dùng đang cố gắng thanh toán
 *           có đang bị người dùng KHÁC giữ chỗ hay không. Nếu có, trả về mảng các ghế bị tranh chấp để Controller chặn thanh toán.
 * @param    {string} showtimeId - ID suất chiếu
 * @param    {Array<string>} seatCodes - Danh sách ghế định thanh toán
 * @param    {string} userId - ID người dùng hiện tại
 * @returns  {Array<string>} Danh sách mã ghế đang bị tranh chấp bởi người khác
 */
const getConflictingHeldSeats = (showtimeId, seatCodes, userId) => {
  const showtimeHolds = heldSeats.get(showtimeId);
  if (!showtimeHolds) {
    return [];
  }

  const conflicting = [];
  seatCodes.forEach(seatCode => {
    if (showtimeHolds.has(seatCode)) {
      const holdData = showtimeHolds.get(seatCode);
      // Nếu ghế đang bị giữ bởi một ID người dùng khác
      if (holdData.userId.toString() !== userId.toString()) {
        conflicting.push(seatCode);
        console.log(`[getConflictingHeldSeats] TRANH CHẤP: Ghế ${seatCode} đang bị giữ bởi user ${holdData.userId} (Booking userId: ${userId})`);
      }
    }
  });
  return conflicting;
};

module.exports = {
  initSocket,
  releaseSeat,
  confirmBookingClearHolds,
  getConflictingHeldSeats,
};

