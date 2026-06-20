const socketIo = require('socket.io');

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

    // User attempts to hold a seat
    socket.on('hold_seat', ({ showtimeId, seatCode, userId }) => {
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

module.exports = {
  initSocket,
  releaseSeat,
  confirmBookingClearHolds,
};
