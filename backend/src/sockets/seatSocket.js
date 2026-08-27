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
      if (!showtimeId) return;
      const sId = String(showtimeId).trim();
      const strUserId = userId ? String(userId) : socket.id;

      socket.join(`showtime_${sId}`);
      console.log(`User ${strUserId} joined room showtime_${sId}`);

      // Khởi tạo entry tracking cho socket này nếu chưa có
      if (!socketHolds.has(socket.id)) {
        socketHolds.set(socket.id, { userId: strUserId, holds: [] });
      }

      // Send the current held seats for this showtime to the newly connected user
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

    socket.on('leave_showtime', ({ showtimeId }) => {
      if (showtimeId) {
        socket.leave(`showtime_${String(showtimeId).trim()}`);
      }
    });

    // Sự kiện khi người dùng click chọn 1 ghế (cố gắng giữ ghế)
    socket.on('hold_seat', async ({ showtimeId, seatCode, userId }) => {
      if (!showtimeId || !seatCode || !userId) return;
      const sId = String(showtimeId).trim();
      const sCode = String(seatCode).trim().toUpperCase();
      const strUserId = String(userId).trim();

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

      // Check if seat is already held
      if (showtimeHolds.has(sCode)) {
        const currentHold = showtimeHolds.get(sCode);
        if (String(currentHold.userId) !== strUserId) {
          socket.emit('hold_seat_failed', { seatCode: sCode, message: 'Ghế này đang được người khác giữ!' });
          return;
        } else {
          // Cùng user nhưng socketId khác (reconnect / chuyển trang) → cập nhật socketId mới
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

      // Set hold mới
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

      // Broadcast cho tất cả user khác trong phòng
      socket.to(`showtime_${sId}`).emit('seat_held', { seatCode: sCode, userId: strUserId });
      socket.emit('hold_seat_success', { seatCode: sCode });
    });

    // User explicitly releases a seat
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

    socket.on('going_to_payment', ({ showtimeId, userId }) => {
      const socketData = socketHolds.get(socket.id);
      if (socketData) {
        console.log(`User ${userId} going to payment, preserving ${socketData.holds.length} seat hold(s).`);
        socketHolds.delete(socket.id);
      }
    });

    // Khi socket disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const socketData = socketHolds.get(socket.id);
      if (socketData && socketData.holds.length > 0) {
        console.log(`Auto-releasing ${socketData.holds.length} held seat(s) for socket ${socket.id} (user: ${socketData.userId})`);
        socketData.holds.forEach(({ showtimeId, seatCode }) => {
          releaseSeat(showtimeId, seatCode, socket.id);
        });
      }
      socketHolds.delete(socket.id);
    });
  });
};

// Internal function to release a seat and broadcast
const releaseSeat = (showtimeId, seatCode, requestingSocketId = null) => {
  const sId = String(showtimeId).trim();
  const sCode = String(seatCode).trim().toUpperCase();
  const showtimeHolds = heldSeats.get(sId);
  if (showtimeHolds && showtimeHolds.has(sCode)) {
    const holdData = showtimeHolds.get(sCode);

    // Nếu có requestingSocketId (từ socket disconnect/release), chỉ giải phóng nếu ghế VẪN ĐANG giữ bởi socket đó
    if (requestingSocketId && holdData.socketId && holdData.socketId !== requestingSocketId) {
      console.log(`[releaseSeat] Ignored release for ${sCode} (requested by old socket ${requestingSocketId}, active socket is ${holdData.socketId})`);
      return;
    }

    clearTimeout(holdData.timeoutId);
    showtimeHolds.delete(sCode);

    if (showtimeHolds.size === 0) {
      heldSeats.delete(sId);
    }

    if (io) {
      io.to(`showtime_${sId}`).emit('seat_released', { seatCode: sCode });
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
