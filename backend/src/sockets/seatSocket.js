const socketIo = require('socket.io');
const Showtime = require('../models/Showtime.model');

// In-memory store for held seats
// Structure: Map<showtimeId, Map<seatCode, { userId, socketId, expiresAt, timeoutId }>>
const heldSeats = new Map();

// Track which seats each socket is holding (for auto-release on disconnect)
// Structure: Map<socketId, { userId, holds: [{showtimeId, seatCode}] }>
const socketHolds = new Map();

// Hold duration in milliseconds (10 minutes)
const HOLD_DURATION = 10 * 60 * 1000;

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

      // Khởi tạo entry tracking cho socket này nếu chưa có
      if (!socketHolds.has(socket.id)) {
        socketHolds.set(socket.id, { userId, holds: [] });
      }

      // Send the current held seats for this showtime to the newly connected user
      if (heldSeats.has(showtimeId)) {
        const showtimeHolds = heldSeats.get(showtimeId);
        const holdsArray = Array.from(showtimeHolds.entries()).map(([seatCode, data]) => ({
          seatCode,
          userId: data.userId,
          expiresAt: data.expiresAt,
        }));
        socket.emit('initial_held_seats', holdsArray);
      } else {
        socket.emit('initial_held_seats', []);
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
          // Cùng user nhưng socketId khác (reconnect) → cập nhật socketId mới
          // GIỮ NGUYÊN expiresAt gốc, chỉ tính lại thời gian còn lại
          clearTimeout(currentHold.timeoutId);
          const remainingMs = Math.max(0, currentHold.expiresAt - Date.now());
          if (remainingMs <= 0) {
            // Đã hết hạn trong lúc không có socket → release ngay
            releaseSeat(showtimeId, seatCode);
            socket.emit('hold_seat_failed', { seatCode, message: 'Thời gian giữ ghế đã hết hạn' });
            return;
          }
          const timeoutId = setTimeout(() => {
            releaseSeat(showtimeId, seatCode);
          }, remainingMs); // Dùng thời gian còn lại, KHÔNG reset về HOLD_DURATION
          showtimeHolds.set(seatCode, { ...currentHold, socketId: socket.id, timeoutId });
          // Cập nhật tracking
          const socketData = socketHolds.get(socket.id);
          if (socketData && !socketData.holds.find(h => h.showtimeId === showtimeId && h.seatCode === seatCode)) {
            socketData.holds.push({ showtimeId, seatCode });
          }
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
        socketId: socket.id,
        expiresAt: Date.now() + HOLD_DURATION,
        timeoutId,
      });

      // Lưu tracking cho socket này
      if (!socketHolds.has(socket.id)) {
        socketHolds.set(socket.id, { userId, holds: [] });
      }
      socketHolds.get(socket.id).holds.push({ showtimeId, seatCode });

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
          // Cập nhật socketHolds tracking
          const socketData = socketHolds.get(socket.id);
          if (socketData) {
            socketData.holds = socketData.holds.filter(
              h => !(h.showtimeId === showtimeId && h.seatCode === seatCode)
            );
          }
        }
      }
    });

    // User chỉ rời trang booking sang trang thanh toán (không phải bỏ cuộc)
    // Xóa tracking ra khỏi socketHolds nhưng KHÔNG release ghế
    // Ghế sẽ tiếp tục được giữ bởi backend timeout cho đến khi thanh toán xong hoặc hết hạn
    socket.on('going_to_payment', ({ showtimeId, userId }) => {
      const socketData = socketHolds.get(socket.id);
      if (socketData) {
        console.log(`User ${userId} going to payment, preserving ${socketData.holds.length} seat hold(s).`);
        // Xóa khỏi socketHolds để disconnect handler không release
        socketHolds.delete(socket.id);
      }
    });

    // Khi socket disconnect (user tắt tab, mất mạng, quay lại trang...),
    // tự động release tất cả ghế mà socket này đang giữ
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const socketData = socketHolds.get(socket.id);
      if (socketData && socketData.holds.length > 0) {
        console.log(`Auto-releasing ${socketData.holds.length} held seat(s) for socket ${socket.id} (user: ${socketData.userId})`);
        socketData.holds.forEach(({ showtimeId, seatCode }) => {
          releaseSeat(showtimeId, seatCode);
        });
      }
      socketHolds.delete(socket.id);
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
  if (!showtimeHolds) {
    console.log(`[getConflictingHeldSeats] No holds for showtime ${showtimeId} → safe`);
    return [];
  }
  
  console.log(`[getConflictingHeldSeats] Checking seats ${seatCodes.join(',')} for userId=${userId.toString()}`);
  console.log(`[getConflictingHeldSeats] Current holds:`, Array.from(showtimeHolds.entries()).map(([seat, data]) => ({
    seat, holdUserId: data.userId, matches: data.userId.toString() === userId.toString()
  })));

  const conflicting = [];
  seatCodes.forEach(seatCode => {
    if (showtimeHolds.has(seatCode)) {
      const holdData = showtimeHolds.get(seatCode);
      if (holdData.userId.toString() !== userId.toString()) {
        conflicting.push(seatCode);
        console.log(`[getConflictingHeldSeats] CONFLICT: seat ${seatCode} held by ${holdData.userId} (booking userId: ${userId})`);
      } else {
        console.log(`[getConflictingHeldSeats] OK: seat ${seatCode} held by same user ${userId}`);
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
