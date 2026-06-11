import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Calendar, Edit2 } from 'lucide-react';
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
  const [rooms, setRooms] = useState([]);
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
    ticketPrice: 90000,
    format: '2D',
  });
  const [error, setError] = useState('');

  const loadInitialOptions = async () => {
    setLoading(true);
    try {
      // 1. Lấy tất cả rạp đang hoạt động
      const thRes = await adminService.getTheaters();
      setTheaters(thRes);
      if (thRes.length > 0) {
        setSelectedTheater(thRes[0]._id);
        setForm((prev) => ({ ...prev, theaterId: thRes[0]._id }));
      }

      // 2. Lấy phim đang chiếu
      const mvRes = await movieService.getMovies({ status: 'now-showing' });
      setMovies(mvRes);
      if (mvRes.length > 0) {
        setForm((prev) => ({ ...prev, movieId: mvRes[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách phòng chiếu mỗi khi rạp được chọn thay đổi
  useEffect(() => {
    loadInitialOptions();
  }, []);

  useEffect(() => {
    const loadRoomsAndShowtimes = async () => {
      if (!selectedTheater) return;
      try {
        const rmRes = await adminService.getRooms(selectedTheater);
        setRooms(rmRes);
        if (rmRes.length > 0) {
          setForm((prev) => ({ ...prev, roomId: rmRes[0]._id }));
        }

        // Lấy tất cả lịch chiếu trong rạp này để hiển thị
        const stRes = await bookingService.getShowtimes({ theaterId: selectedTheater });
        setShowtimes(stRes);
      } catch (err) {
        console.error(err);
      }
    };
    loadRoomsAndShowtimes();
  }, [selectedTheater, movies]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTheaterChange = (e) => {
    const thId = e.target.value;
    setSelectedTheater(thId);
    setForm({ ...form, theaterId: thId, roomId: '' });
  };

  const handleOpenAdd = () => {
    setEditingShowtime(null);
    setError('');
    setForm({
      movieId: movies[0]?._id || '',
      theaterId: selectedTheater,
      roomId: rooms[0]?._id || '',
      startTime: '',
      ticketPrice: 90000,
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

    setForm({
      movieId: st.movie?._id || st.movie,
      theaterId: st.theater?._id || st.theater,
      roomId: st.room?._id || st.room,
      startTime: localTimeFormatted,
      ticketPrice: st.ticketPrice,
      format: st.format,
    });
    setIsOpen(true);
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch chiếu này không? Tất cả các vé đã đặt cho lịch chiếu này cũng sẽ bị xóa.')) return;
    try {
      await adminService.deleteShowtime(id);
      if (selectedTheater) {
        const stRes = await bookingService.getShowtimes({ theaterId: selectedTheater });
        setShowtimes(stRes);
      }
      alert('Xóa lịch chiếu thành công!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.startTime) {
      setError('Vui lòng chọn ngày và giờ chiếu');
      return;
    }

    if (!form.roomId) {
      setError('Vui lòng chọn một phòng chiếu hợp lệ để xếp lịch');
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
      // Reload showtimes
      const stRes = await bookingService.getShowtimes({ theaterId: selectedTheater });
      setShowtimes(stRes);
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
          <p className="text-xs text-zinc-500 mt-1">Cấu hình thời gian chiếu phim, sức chứa phòng và giá vé cơ bản.</p>
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

          <Button onClick={handleOpenAdd} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
            Tạo Lịch Chiếu
          </Button>
        </div>
      </div>

      {/* Danh sách dạng lưới theo các phòng đang hoạt động */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map((room) => (
          <div key={room._id} className="bg-dark-card border border-dark-border p-5 rounded-3xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-dark-border pb-2.5">
              <h4 className="font-bold text-zinc-200 text-sm">{room.name}</h4>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 bg-zinc-900 px-2 py-0.5 border border-dark-border rounded">
                Định dạng: {room.type}
              </span>
            </div>
            
            {/* Danh sách lịch chiếu của phòng */}
            {(() => {
              const roomShowtimes = showtimes.filter((s) => s.room?._id === room._id || s.room === room._id);
              if (roomShowtimes.length === 0) {
                return (
                  <p className="text-xs text-zinc-500 italic">
                    Không có lịch chiếu nào được hiển thị ở đây. Sử dụng "Tạo Lịch Chiếu" ở trên để thêm lịch chiếu mới vào phòng này.
                  </p>
                );
              }
              return (
                <div className="space-y-2.5">
                  {roomShowtimes.map((st) => {
                    const startTimeFormatted = new Date(st.startTime).toLocaleString('vi-VN', {
                      weekday: 'short',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div key={st._id} className="flex items-center justify-between bg-zinc-900/60 border border-dark-border/40 p-3 rounded-2xl gap-3">
                        <div className="min-w-0 flex-grow">
                          <div className="font-bold text-zinc-200 text-xs truncate">
                            {st.movie?.title || 'Phim đã bị xóa'}
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar size={10} className="text-brand" />
                            <span>{startTimeFormatted}</span>
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

      {/* Modal tạo / chỉnh sửa lịch chiếu */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingShowtime ? "Chỉnh Sửa Lịch Chiếu" : "Tạo Suất Chiếu Mới"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn phim */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Chọn Phim</label>
            <select
              name="movieId"
              value={form.movieId}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
              required
            >
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn phòng chiếu */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Chọn Rạp / Phòng Chiếu</label>
            <select
              name="roomId"
              value={form.roomId}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
              required
            >
              {rooms.length === 0 ? (
                <option value="">Không có phòng nào được đăng ký trong rạp này</option>
              ) : (
                rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.type})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* định dạng và giá vé */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Định Dạng Chiếu</label>
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
            <Button type="submit" variant="primary" className="px-6 py-2">
              {editingShowtime ? "Cập Nhật" : "Lưu Lịch Chiếu"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShowtimeManager;