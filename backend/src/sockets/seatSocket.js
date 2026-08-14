const socketIo = require('socket.io');
const Showtime = require('../models/Showtime.model');

// In-memory store for held seats
// Structure: Map<showtimeId, Map<seatCode, { userId, expiresAt, timeoutId }>>
const heldSeats = new Map();

// Hold duration in milliseconds (5 minutes)
const HOLD_DURATION = 5 * 60 * 1000;

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*', // Adjust this in production to match frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a specific showtime room to receive seat updates
    socket.on('join_showtime', ({ showtimeId, userId }) => {
      socket.join(`showtime_${showtimeId}`);
      console.log(`User ${userId || socket.id} joined room showtime_${showtimeId}`);

      // Send the current held seats for this showtime to the newly connected user
      if (heldSeats.has(showtimeId)) {
        const showtimeHolds = heldSeats.get(showtimeId);
        const holdsArray = Array.from(showtimeHolds.entries()).map(([seatCode, data]) => ({
          seatCode,
          userId: data.userId,
          expiresAt: data.expiresAt,
        }));
        socket.emit('initial_held_seats', holdsArray);
      }
    });

    socket.on('leave_showtime', ({ showtimeId }) => {
      socket.leave(`showtime_${showtimeId}`);
    });

    // Sự kiện khi người dùng click chọn 1 ghế (cố gắng giữ ghế)
    socket.on('hold_seat', async ({ showtimeId, seatCode, userId }) => {
      try {
        // [GHI CHÚ BẢO VỆ ĐỒ ÁN] - FIX BUG RACE CONDITION (CƯỚP GHẾ)
        // Mục đích: Tránh trường hợp ghế đã bị người khác thanh toán xong (lưu vào DB) 
        // nhưng người dùng hiện tại chưa load lại trang nên vẫn thấy ghế trống và click vào.
        
        // Bước 1: Query xuống MongoDB (bảng Showtime) để lấy mảng bookedSeats (những ghế đã bán)
        const showtime = await Showtime.findById(showtimeId).select('bookedSeats');
        
        // Bước 2: Kiểm tra xem ghế user vừa click (seatCode) có nằm trong mảng đã bán không
        if (showtime && showtime.bookedSeats && showtime.bookedSeats.includes(seatCode)) {
          
          // Bước 3: Nếu đã bán, emit sự kiện 'hold_seat_failed' trả về Frontend 
          // để Frontend hiển thị thông báo lỗi cho người dùng và chặn không cho giữ ghế.
          socket.emit('hold_seat_failed', { seatCode, message: 'Ghế này đã được người khác thanh toán thành công!' });
          return; // Dừng luồng chạy, không cho thêm vào bộ nhớ đệm heldSeats ở dưới
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra DB trong hold_seat:', err);
      }
      if (!heldSeats.has(showtimeId)) {
        heldSeats.set(showtimeId, new Map());
      }
      const showtimeHolds = heldSeats.get(showtimeId);

      // Check if seat is already held by someone else
      if (showtimeHolds.has(seatCode)) {
        const currentHold = showtimeHolds.get(seatCode);
        if (currentHold.userId !== userId) {
          // Inform the user that the hold failed
          socket.emit('hold_seat_failed', { seatCode, message: 'Seat is currently held by someone else' });
          return;
        } else {
          // It's already held by the same user, maybe they clicked again or reconnected.
          return;
        }
      }

      // Set the hold
      const timeoutId = setTimeout(() => {
        // Auto-release after 5 minutes
        releaseSeat(showtimeId, seatCode);
      }, HOLD_DURATION);

      showtimeHolds.set(seatCode, {
        userId,
        expiresAt: Date.now() + HOLD_DURATION,
        timeoutId,
      });

      // Broadcast to everyone else in the room that the seat is held
      socket.to(`showtime_${showtimeId}`).emit('seat_held', { seatCode, userId });
      // Send confirmation to the user who held it
      socket.emit('hold_seat_success', { seatCode });
    });

    // User explicitly releases a seat (e.g., clicks to unselect)
    socket.on('release_seat', ({ showtimeId, seatCode, userId }) => {
      const showtimeHolds = heldSeats.get(showtimeId);
      if (showtimeHolds && showtimeHolds.has(seatCode)) {
        const currentHold = showtimeHolds.get(seatCode);
        if (currentHold.userId === userId) {
          releaseSeat(showtimeId, seatCode);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

// Internal function to release a seat and broadcast
const releaseSeat = (showtimeId, seatCode) => {
  const showtimeHolds = heldSeats.get(showtimeId);
  if (showtimeHolds && showtimeHolds.has(seatCode)) {
    const holdData = showtimeHolds.get(seatCode);
    clearTimeout(holdData.timeoutId);
    showtimeHolds.delete(seatCode);

    // Clean up empty maps
    if (showtimeHolds.size === 0) {
      heldSeats.delete(showtimeId);
    }

    if (io) {
      io.to(`showtime_${showtimeId}`).emit('seat_released', { seatCode });
    }
  }
};

// Call this from booking.controller.js when payment succeeds
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

  // Broadcast to all clients that these seats are now fully booked
  if (io) {
    io.to(`showtime_${showtimeId}`).emit('seat_booked', { seatCodes });
  }
};

// ==========================================
// FIX BUG TỐT NGHIỆP: CHỐNG CƯỚP GHẾ (RACE CONDITION)
// ==========================================
// Hàm này dùng để kiểm tra xem trong danh sách các ghế mà khách đang muốn thanh toán,
// có ghế nào ĐANG BỊ GIỮ bởi một người dùng KHÁC hay không.
// Nếu có, trả về danh sách các ghế đang bị tranh chấp để Controller chặn thanh toán.
const getConflictingHeldSeats = (showtimeId, seatCodes, userId) => {
  const showtimeHolds = heldSeats.get(showtimeId);
  if (!showtimeHolds) return []; // Nếu không có ai đang giữ ghế nào ở suất chiếu này -> An toàn
  
  const conflicting = [];
  seatCodes.forEach(seatCode => {
    // Nếu ghế này đang nằm trong danh sách "bị giữ" (màu cam)
    if (showtimeHolds.has(seatCode)) {
      const holdData = showtimeHolds.get(seatCode);
      // Kiểm tra ID của người đang giữ ghế. Nếu KHÁC với ID của người đang cố thanh toán
      // -> Đây là hành vi cướp ghế! Đưa vào danh sách vi phạm.
      if (holdData.userId.toString() !== userId.toString()) {
        conflicting.push(seatCode);
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
