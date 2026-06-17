import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, AlertCircle, Calendar, Edit2, Building2, Loader2 } from 'lucide-react';
import movieService from '../../services/movie.service';
import adminService from '../../services/admin.service';
import bookingService from '../../services/booking.service';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';

export const ShowtimeManager = () => {
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);           // Rooms for grid display (theo selectedTheater)
  const [modalRooms, setModalRooms] = useState([]); // Rooms riêng cho modal (có thể khác)
  const [modalRoomsLoading, setModalRoomsLoading] = useState(false);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);

  const [selectedTheater, setSelectedTheater] = useState('');
  const [form, setForm] = useState({
    movieId: '',
    theaterId: '',
    roomId: '',
    startTime: '',
    ticketPrice: 80000,
    format: '2D',
  });
  const [error, setError] = useState('');

  // ────────────────────────────────────────────────
  // Load danh sách phòng cho modal khi theaterId thay đổi
  // ────────────────────────────────────────────────
  const loadModalRooms = useCallback(async (theaterId) => {
    if (!theaterId) {
      setModalRooms([]);
      return;
    }
    setModalRoomsLoading(true);
    try {
      const rmRes = await adminService.getRooms(theaterId);
      const roomArr = Array.isArray(rmRes) ? rmRes : [];
      setModalRooms(roomArr);
      // Tự động chọn phòng đầu tiên
      if (roomArr.length > 0) {
        setForm((prev) => ({ ...prev, roomId: roomArr[0]._id }));
      } else {
        setForm((prev) => ({ ...prev, roomId: '' }));
      }
    } catch (err) {
      console.error('Lỗi load phòng:', err);
      setModalRooms([]);
    } finally {
      setModalRoomsLoading(false);
    }
  }, []);

  // ────────────────────────────────────────────────
  // Load lịch chiếu + phòng của rạp đang xem
  // ────────────────────────────────────────────────
  const reloadShowtimesAndRooms = useCallback(async (theaterId) => {
    if (!theaterId) return;
    try {
      const [rmRes, stRes] = await Promise.all([
        adminService.getRooms(theaterId),
        bookingService.getShowtimes({ theaterId }),
      ]);
      setRooms(Array.isArray(rmRes) ? rmRes : []);
      setShowtimes(Array.isArray(stRes) ? stRes : []);
    } catch (err) {
      console.error('Lỗi reload lịch chiếu:', err);
    }
  }, []);

  // ────────────────────────────────────────────────
  // Load lần đầu: rạp + phim
  // ────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Lấy tất cả rạp
        const thRes = await adminService.getTheaters();
        const thArr = Array.isArray(thRes) ? thRes : [];
        setTheaters(thArr);

        const firstTheaterId = thArr[0]?._id || '';
        if (firstTheaterId) {
          setSelectedTheater(firstTheaterId);
          setForm((prev) => ({ ...prev, theaterId: firstTheaterId }));
        }

        // Lấy TẤT CẢ phim cho admin (không lọc status)
        const mvRes = await movieService.getMovies();
        const mvArr = Array.isArray(mvRes) ? mvRes : [];
        setMovies(mvArr);

        // Load phòng + lịch chiếu của rạp đầu tiên
        if (firstTheaterId) {
          const [rmRes, stRes] = await Promise.all([
            adminService.getRooms(firstTheaterId),
            bookingService.getShowtimes({ theaterId: firstTheaterId }),
          ]);
          setRooms(Array.isArray(rmRes) ? rmRes : []);
          setShowtimes(Array.isArray(stRes) ? stRes : []);
        }
      } catch (err) {
        console.error('Lỗi khởi tạo ShowtimeManager:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ────────────────────────────────────────────────
  // Khi selectedTheater thay đổi → reload grid
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (selectedTheater) {
      reloadShowtimesAndRooms(selectedTheater);
    }
  }, [selectedTheater, reloadShowtimesAndRooms]);

  // ────────────────────────────────────────────────
  // Khi form.theaterId thay đổi trong modal → reload modal rooms
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && form.theaterId) {
      loadModalRooms(form.theaterId);
    }
  }, [form.theaterId, isOpen, loadModalRooms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'format') {
        if (value === '3D') {
          updated.ticketPrice = 90000;
        } else if (value === '2D') {
          updated.ticketPrice = 80000;
        }
      }
      return updated;
    });
  };

  const handleTheaterChange = async (e) => {
    const thId = e.target.value;
    setSelectedTheater(thId);
    setRooms([]);
    setShowtimes([]);
    reloadShowtimesAndRooms(thId);
  };

  const handleOpenAdd = () => {
    const firstMovieId = movies[0]?._id || '';
    const firstRoomId = rooms[0]?._id || '';

    setEditingShowtime(null);
    setError('');
    setModalRooms([...rooms]); // Dùng rooms hiện tại làm điểm xuất phát
    setForm({
      movieId: firstMovieId,
      theaterId: selectedTheater,
      roomId: firstRoomId,
      startTime: '',
      ticketPrice: 80000,
      format: '2D',
    });
    setIsOpen(true);
  };

  const handleOpenEditShowtime = (st) => {
    setEditingShowtime(st);
    setError('');

    // Convert to local datetime string (YYYY-MM-DDThh:mm)
    const date = new Date(st.startTime);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localTimeFormatted = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);

    const theaterId = st.theater?._id || st.theater || selectedTheater;

    setForm({
      movieId: st.movie?._id || st.movie,
      theaterId,
      roomId: st.room?._id || st.room,
      startTime: localTimeFormatted,
      ticketPrice: st.ticketPrice,
      format: st.format,
    });
    setIsOpen(true);
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch chiếu này không?')) return;
    try {
      await adminService.deleteShowtime(id);
      await reloadShowtimesAndRooms(selectedTheater);
      alert('Xóa lịch chiếu thành công!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.movieId) {
      setError('Vui lòng chọn phim');
      return;
    }
    if (!form.startTime) {
      setError('Vui lòng chọn ngày và giờ chiếu');
      return;
    }
    if (!form.roomId) {
      setError('Vui lòng chọn một phòng chiếu hợp lệ');
      return;
    }

    try {
      if (editingShowtime) {
        await adminService.updateShowtime(editingShowtime._id, form);
      } else {
        await adminService.createShowtime(form);
      }
      setIsOpen(false);
      setEditingShowtime(null);
      alert(editingShowtime ? 'Cập nhật lịch chiếu thành công!' : 'Tạo lịch chiếu thành công!');
      await reloadShowtimesAndRooms(selectedTheater);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-zinc-200">Lịch Chiếu Phim</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Cấu hình thời gian chiếu phim, sức chứa phòng và giá vé cơ bản.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Lựa chọn bộ lọc rạp phim */}
          <select
            value={selectedTheater}
            onChange={handleTheaterChange}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-semibold py-2 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
          >
            {theaters.map((th) => (
              <option key={th._id} value={th._id}>
                {th.name}
              </option>
            ))}
          </select>

          <Button
            onClick={handleOpenAdd}
            variant="primary"
            className="py-2 px-4 text-sm"
            icon={<Plus size={16} />}
          >
            Tạo Lịch Chiếu
          </Button>
        </div>
      </div>

      {/* Danh sách dạng lưới theo các phòng đang hoạt động */}
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Building2 size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Rạp này chưa có phòng chiếu nào. Hãy tạo phòng trong tab "Phòng Chiếu".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <div key={room._id} className="bg-dark-card border border-dark-border p-5 rounded-3xl space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-dark-border pb-2.5">
                <h4 className="font-bold text-zinc-200 text-sm">{room.name}</h4>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 bg-zinc-900 px-2 py-0.5 border border-dark-border rounded">
                  {room.type}
                </span>
              </div>

              {/* Danh sách lịch chiếu của phòng */}
              {(() => {
                const roomShowtimes = showtimes.filter(
                  (s) => s.room?._id === room._id || s.room === room._id
                );
                if (roomShowtimes.length === 0) {
                  return (
                    <p className="text-xs text-zinc-500 italic">
                      Chưa có lịch chiếu. Nhấn "Tạo Lịch Chiếu" để thêm.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2.5">
                    {roomShowtimes.map((st) => {
                      const startFmt = new Date(st.startTime).toLocaleString('vi-VN', {
                        weekday: 'short',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endFmt = new Date(st.endTime).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div
                          key={st._id}
                          className="flex items-center justify-between bg-zinc-900/60 border border-dark-border/40 p-3 rounded-2xl gap-3"
                        >
                          <div className="min-w-0 flex-grow">
                            <div className="font-bold text-zinc-200 text-xs truncate">
                              {st.movie?.title || 'Phim đã bị xóa'}
                            </div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              <Calendar size={10} className="text-brand" />
                              <span>{startFmt}</span>
                              <span>→</span>
                              <span>{endFmt}</span>
                              <span>&bull;</span>
                              <span className="text-zinc-400 font-extrabold">{st.format}</span>
                            </div>
                            <div className="text-[10px] text-brand font-black mt-0.5">
                              {st.ticketPrice.toLocaleString()} VND
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditShowtime(st)}
                              className="p-1.5 bg-zinc-950 border border-dark-border hover:border-brand/40 text-zinc-500 hover:text-brand rounded-lg transition-all"
                              title="Chỉnh sửa lịch chiếu"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteShowtime(st._id)}
                              className="p-1.5 bg-zinc-950 border border-dark-border hover:border-red-500/40 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                              title="Xóa lịch chiếu"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* ───── Modal tạo / chỉnh sửa lịch chiếu ───── */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingShowtime ? 'Chỉnh Sửa Lịch Chiếu' : 'Tạo Suất Chiếu Mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn phim */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">
              Chọn Phim
            </label>
            <select
              name="movieId"
              value={form.movieId}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
              required
            >
              {movies.length === 0 ? (
                <option value="">Chưa có phim trong hệ thống</option>
              ) : (
                movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.status})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Chọn rạp (trong modal) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">
              Rạp Chiếu
            </label>
            <select
              name="theaterId"
              value={form.theaterId}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
              required
            >
              {theaters.map((th) => (
                <option key={th._id} value={th._id}>
                  {th.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn phòng chiếu */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">
              Phòng Chiếu
              {modalRoomsLoading && (
                <Loader2 size={12} className="inline ml-2 animate-spin text-brand" />
              )}
            </label>
            <select
              name="roomId"
              value={form.roomId}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer disabled:opacity-50"
              required
              disabled={modalRoomsLoading}
            >
              {modalRoomsLoading ? (
                <option value="">Đang tải danh sách phòng...</option>
              ) : modalRooms.length === 0 ? (
                <option value="">Rạp này chưa có phòng nào</option>
              ) : (
                modalRooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.type})
                  </option>
                ))
              )}
            </select>
            {!modalRoomsLoading && modalRooms.length === 0 && (
              <p className="text-xs text-amber-400 mt-1.5 pl-0.5">
                ⚠ Rạp này chưa có phòng chiếu. Hãy tạo phòng trong tab "Phòng Chiếu" trước.
              </p>
            )}
          </div>

          {/* Định dạng và giá vé */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">
                Định Dạng Chiếu
              </label>
              <select
                name="format"
                value={form.format}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
                <option value="GOLDCLASS">GOLDCLASS</option>
              </select>
            </div>

            <Input
              name="ticketPrice"
              type="number"
              label="Giá Vé Cơ Bản (VNĐ)"
              value={form.ticketPrice}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            name="startTime"
            type="datetime-local"
            label="Ngày & Giờ Bắt Đầu"
            value={form.startTime}
            onChange={handleChange}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
            <Button onClick={() => setIsOpen(false)} variant="secondary" className="px-5 py-2">
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-6 py-2"
              disabled={modalRoomsLoading || modalRooms.length === 0}
            >
              {editingShowtime ? 'Cập Nhật' : 'Lưu Lịch Chiếu'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShowtimeManager;