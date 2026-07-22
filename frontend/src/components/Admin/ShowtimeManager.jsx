import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, AlertCircle, Calendar, Edit2, Loader2, Zap, Clock, CheckCircle2, X } from 'lucide-react';
import movieService from '../../services/movie.service';
import adminService from '../../services/admin.service';
import bookingService from '../../services/booking.service';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';

const DEFAULT_TIME_SLOTS = ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'];
const DEFAULT_PRICES = { '2D': 80000, '3D': 90000, 'IMAX': 180000, 'GOLDCLASS': 300000 };

export const ShowtimeManager = () => {
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [modalRooms, setModalRooms] = useState([]);
  const [modalRoomsLoading, setModalRoomsLoading] = useState(false);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Manual Modal ──
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);

  // ── Auto Modal ──
  const [isAutoOpen, setIsAutoOpen] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [autoModalRooms, setAutoModalRooms] = useState([]);
  const [autoModalRoomsLoading, setAutoModalRoomsLoading] = useState(false);

  const [selectedTheater, setSelectedTheater] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMovie, setFilterMovie] = useState('');
  const [filterRoom, setFilterRoom] = useState('');

  // Manual form
  const [form, setForm] = useState({ movieId: '', theaterId: '', roomId: '', startTime: '', ticketPrice: 80000, format: '2D' });
  const [error, setError] = useState('');

  // Auto generate form
  const [autoForm, setAutoForm] = useState({
    movieId: '',
    theaterId: '',
    roomIds: [],
    startDate: '',
    endDate: '',
    timeSlots: [...DEFAULT_TIME_SLOTS],
    format: '2D',
    ticketPrice: 80000,
  });
  const [autoError, setAutoError] = useState('');
  const [newSlotInput, setNewSlotInput] = useState('');


  // ────────────────────────────────────────────────
  // Load danh sách phòng cho modal khi theaterId thay đổi
  // ────────────────────────────────────────────────
  const loadModalRooms = useCallback(async (theaterId) => {
    if (!theaterId) { setModalRooms([]); return; }
    setModalRoomsLoading(true);
    try {
      const rmRes = await adminService.getRooms(theaterId);
      const roomArr = Array.isArray(rmRes) ? rmRes : (Array.isArray(rmRes?.data) ? rmRes.data : []);
      setModalRooms(roomArr);
      if (roomArr.length > 0 && !editingShowtime) {
        setForm((prev) => ({ ...prev, roomId: roomArr[0]._id }));
      } else if (roomArr.length === 0) {
        setForm((prev) => ({ ...prev, roomId: '' }));
      }
    } catch (err) {
      console.error('Lỗi load phòng:', err);
      setModalRooms([]);
    } finally {
      setModalRoomsLoading(false);
    }
  }, [editingShowtime]);

  const loadAutoModalRooms = useCallback(async (theaterId) => {
    if (!theaterId) { setAutoModalRooms([]); return; }
    setAutoModalRoomsLoading(true);
    try {
      const rmRes = await adminService.getRooms(theaterId);
      const roomArr = Array.isArray(rmRes) ? rmRes : (Array.isArray(rmRes?.data) ? rmRes.data : []);
      setAutoModalRooms(roomArr);
      setAutoForm((prev) => ({ ...prev, roomIds: roomArr.map((r) => r._id) }));
    } catch (err) {
      console.error('Lỗi load phòng auto:', err);
      setAutoModalRooms([]);
    } finally {
      setAutoModalRoomsLoading(false);
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
      // Unwrap {success, data: [...]} nếu cần
      const roomArr = Array.isArray(rmRes) ? rmRes : (Array.isArray(rmRes?.data) ? rmRes.data : []);
      const stArr = Array.isArray(stRes) ? stRes : (Array.isArray(stRes?.data) ? stRes.data : []);
      setRooms(roomArr);
      setShowtimes(stArr);
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
        // Unwrap {success, data: [...]} nếu cần
        const thArr = Array.isArray(thRes) ? thRes : (Array.isArray(thRes?.data) ? thRes.data : []);
        setTheaters(thArr);

        const firstTheaterId = thArr[0]?._id || '';
        if (firstTheaterId) {
          setSelectedTheater(firstTheaterId);
          setForm((prev) => ({ ...prev, theaterId: firstTheaterId }));
        }

        // Lấy TẤT CẢ phim cho admin (không lọc status)
        const mvRes = await movieService.getMovies();
        // Unwrap {success, data: [...]} nếu cần
        const mvArr = Array.isArray(mvRes) ? mvRes : (Array.isArray(mvRes?.data) ? mvRes.data : []);
        setMovies(mvArr);

        // Load phòng + lịch chiếu của rạp đầu tiên
        if (firstTheaterId) {
          const [rmRes, stRes] = await Promise.all([
            adminService.getRooms(firstTheaterId),
            bookingService.getShowtimes({ theaterId: firstTheaterId }),
          ]);
          const roomArr = Array.isArray(rmRes) ? rmRes : (Array.isArray(rmRes?.data) ? rmRes.data : []);
          const stArr = Array.isArray(stRes) ? stRes : (Array.isArray(stRes?.data) ? stRes.data : []);
          setRooms(roomArr);
          setShowtimes(stArr);
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
    if (isManualOpen && form.theaterId) {
      loadModalRooms(form.theaterId);
    }
  }, [form.theaterId, isManualOpen, loadModalRooms]);

  useEffect(() => {
    if (isAutoOpen && autoForm.theaterId) {
      loadAutoModalRooms(autoForm.theaterId);
    }
  }, [autoForm.theaterId, isAutoOpen, loadAutoModalRooms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'format') updated.ticketPrice = DEFAULT_PRICES[value] || 80000;
      return updated;
    });
  };

  const handleTheaterChange = async (e) => {
    const thId = e.target.value;
    setSelectedTheater(thId);
    setRooms([]);
    setShowtimes([]);
    setFilterDate('');
    setFilterMovie('');
    setFilterRoom('');
    reloadShowtimesAndRooms(thId);
  };

  const handleOpenAdd = () => {
    setEditingShowtime(null);
    setError('');
    setModalRooms([...rooms]);
    setForm({ movieId: movies[0]?._id || '', theaterId: selectedTheater, roomId: rooms[0]?._id || '', startTime: '', ticketPrice: 80000, format: '2D' });
    setIsManualOpen(true);
  };

  const handleOpenEditShowtime = (st) => {
    setEditingShowtime(st);
    setError('');
    let localTimeFormatted = '';
    if (st.startTime) {
      const date = new Date(st.startTime);
      if (!isNaN(date.getTime())) {
        const tzOffset = date.getTimezoneOffset() * 60000;
        localTimeFormatted = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      }
    }
    const theaterId = st.theater?._id || st.theater || selectedTheater;
    const movieId = st.movie?._id || st.movie || '';
    const roomId = st.room?._id || st.room || '';
    setModalRooms(rooms.length > 0 ? [...rooms] : []);
    setForm({
      movieId,
      theaterId,
      roomId,
      startTime: localTimeFormatted,
      ticketPrice: st.ticketPrice || 80000,
      format: (st.format || '2D').toUpperCase(),
    });
    setIsManualOpen(true);
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.movieId) { setError('Vui lòng chọn phim'); return; }
    if (!form.startTime) { setError('Vui lòng chọn ngày và giờ chiếu'); return; }
    if (!form.roomId) { setError('Vui lòng chọn một phòng chiếu hợp lệ'); return; }
    try {
      if (editingShowtime) await adminService.updateShowtime(editingShowtime._id, form);
      else await adminService.createShowtime(form);
      setIsManualOpen(false);
      setEditingShowtime(null);
      alert(editingShowtime ? 'Cập nhật lịch chiếu thành công!' : 'Tạo lịch chiếu thành công!');
      await reloadShowtimesAndRooms(selectedTheater);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenAutoGenerate = () => {
    setAutoError('');
    setAutoResult(null);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setAutoForm({ movieId: movies[0]?._id || '', theaterId: selectedTheater, roomIds: rooms.map((r) => r._id), startDate: today, endDate: nextWeek, timeSlots: [...DEFAULT_TIME_SLOTS], format: '2D', ticketPrice: 80000 });
    setAutoModalRooms([...rooms]);
    setIsAutoOpen(true);
  };

  const handleAutoFormChange = (e) => {
    const { name, value } = e.target;
    setAutoForm((prev) => { const u = { ...prev, [name]: value }; if (name === 'format') u.ticketPrice = DEFAULT_PRICES[value] || 80000; return u; });
  };

  const handleToggleRoom = (roomId) => {
    setAutoForm((prev) => ({ ...prev, roomIds: prev.roomIds.includes(roomId) ? prev.roomIds.filter((id) => id !== roomId) : [...prev.roomIds, roomId] }));
  };

  const handleRemoveSlot = (slot) => {
    setAutoForm((prev) => ({ ...prev, timeSlots: prev.timeSlots.filter((s) => s !== slot) }));
  };

  const handleAddSlot = () => {
    const trimmed = newSlotInput.trim();
    if (!trimmed) return;
    if (!/^\d{2}:\d{2}$/.test(trimmed)) { setAutoError('Dịnh dạng không hợp lệ. Dùng HH:mm (VD: 09:00)'); return; }
    if (autoForm.timeSlots.includes(trimmed)) { setAutoError('Khung giờ này đã tồn tại'); return; }
    setAutoError('');
    setAutoForm((prev) => ({ ...prev, timeSlots: [...prev.timeSlots, trimmed].sort() }));
    setNewSlotInput('');
  };

  const estimatedShowtimes = (() => {
    if (!autoForm.startDate || !autoForm.endDate || !autoForm.roomIds.length || !autoForm.timeSlots.length) return 0;
    const start = new Date(autoForm.startDate); const end = new Date(autoForm.endDate);
    if (start > end) return 0;
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days * autoForm.roomIds.length * autoForm.timeSlots.length;
  })();

  const handleAutoSubmit = async (e) => {
    e.preventDefault(); setAutoError('');
    if (!autoForm.movieId) { setAutoError('Vui lòng chọn phim'); return; }
    if (!autoForm.roomIds.length) { setAutoError('Vui lòng chọn ít nhất một phòng chiếu'); return; }
    if (!autoForm.startDate || !autoForm.endDate) { setAutoError('Vui lòng chọn ngày bắt đầu và kết thúc'); return; }
    if (new Date(autoForm.startDate) > new Date(autoForm.endDate)) { setAutoError('Ngày bắt đầu phải trước ngày kết thúc'); return; }
    if (!autoForm.timeSlots.length) { setAutoError('Vui lòng thêm ít nhất một khung giờ chiếu'); return; }
    setAutoGenerating(true);
    try {
      const res = await adminService.autoGenerateShowtimes(autoForm);
      setAutoResult(res.data || res);
      await reloadShowtimesAndRooms(selectedTheater);
    } catch (err) {
      setAutoError(err.response?.data?.message || err.message);
    } finally {
      setAutoGenerating(false);
    }
  };


  // ── Helper: Sắp xếp danh sách phòng chiếu ưu tiên phòng khớp định dạng (form.format) ──
  const sortedModalRooms = React.useMemo(() => {
    if (!modalRooms || modalRooms.length === 0) return [];
    return [...modalRooms].sort((a, b) => {
      const aType = (a.type || a.roomType || '').toUpperCase();
      const bType = (b.type || b.roomType || '').toUpperCase();
      const fmt = (form.format || '').toUpperCase();
      const aMatches = aType === fmt;
      const bMatches = bType === fmt;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [modalRooms, form.format]);

  // ── Helper: Tính toán các khung giờ còn trống trong ngày của phòng ──
  const availableSlotDetails = React.useMemo(() => {
    if (!form.roomId) return { availableSlots: [], busyIntervals: [], selectedDateStr: '', movieDuration: 120 };

    const selectedMovie = movies.find((m) => m._id === form.movieId);
    const movieDuration = selectedMovie?.duration || 120;
    const buffer = 20; // 20 phút vệ sinh phòng
    const totalNeeded = movieDuration + buffer;

    // Lấy ngày đã chọn (hoặc mặc định hôm nay nếu chưa chọn)
    const selectedDateStr = form.startTime ? form.startTime.split('T')[0] : new Date().toISOString().split('T')[0];

    // Lấy các suất chiếu đã có của phòng trong ngày đó (trừ suất đang edit)
    const existingForRoom = showtimes.filter((st) => {
      const isSameRoom = (st.room?._id || st.room) === form.roomId;
      const isSameDate = new Date(st.startTime).toISOString().split('T')[0] === selectedDateStr;
      const isNotEditing = editingShowtime ? st._id !== editingShowtime._id : true;
      return isSameRoom && isSameDate && isNotEditing;
    });

    const busyIntervals = existingForRoom.map((st) => {
      const s = new Date(st.startTime);
      const e = new Date(st.endTime);
      const startMin = s.getHours() * 60 + s.getMinutes();
      const endMin = e.getHours() * 60 + e.getMinutes() + buffer;
      const title = st.movie?.title || 'Phim khác';
      return {
        startMin,
        endMin,
        startFmt: s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        endFmt: e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        title,
      };
    }).sort((a, b) => a.startMin - b.startMin);

    // Bắt đầu từ 08:00 (480 min) đến 23:00 (1380 min)
    const availableSlots = [];
    const openMin = 8 * 60;
    const closeMin = 23 * 60 + 30;

    let current = openMin;
    while (current + movieDuration <= closeMin) {
      const slotEnd = current + totalNeeded;
      const hasOverlap = busyIntervals.some(
        (b) => !(slotEnd <= b.startMin || current >= b.endMin)
      );

      if (!hasOverlap) {
        const hh = String(Math.floor(current / 60)).padStart(2, '0');
        const mm = String(current % 60).padStart(2, '0');
        availableSlots.push(`${hh}:${mm}`);
        current += 30;
      } else {
        const nextBusy = busyIntervals.find((b) => current < b.endMin && slotEnd > b.startMin);
        if (nextBusy) {
          current = Math.max(current + 30, nextBusy.endMin);
        } else {
          current += 30;
        }
      }
    }

    return { availableSlots: availableSlots.slice(0, 10), busyIntervals, selectedDateStr, movieDuration };
  }, [form.roomId, form.startTime, form.movieId, movies, showtimes, editingShowtime]);

  // ── Helper: Tính toán dữ liệu Biểu đồ Gantt Timeline cho tất cả các phòng ──
  const ganttChartData = React.useMemo(() => {
    if (!isManualOpen || modalRooms.length === 0) return null;

    const selectedMovie = movies.find((m) => m._id === form.movieId);
    const movieDuration = selectedMovie?.duration || 120;
    const buffer = 20; // 20 phút vệ sinh phòng
    const totalNeeded = movieDuration + buffer;

    const selectedDateStr = form.startTime ? form.startTime.split('T')[0] : new Date().toISOString().split('T')[0];

    const startHour = 8;
    const endHour = 24;
    const openMin = startHour * 60; // 480 min
    const closeMin = endHour * 60; // 1440 min
    const totalMinutes = closeMin - openMin; // 960 min

    const roomRows = modalRooms.map((room) => {
      const roomType = (room.type || room.roomType || '2D').toUpperCase();
      const formatReq = (form.format || '2D').toUpperCase();
      // Quy tắc khớp chuẩn 1-1: Định dạng nào CHỈ ĐƯỢC PHÉP chiếu ở đúng loại phòng đó
      const isCompatible = roomType === formatReq || (formatReq === '2D' && roomType === 'STANDARD');

      const roomShowtimes = showtimes.filter((st) => {
        const isSameRoom = (st.room?._id || st.room) === room._id;
        const isSameDate = new Date(st.startTime).toISOString().split('T')[0] === selectedDateStr;
        const isNotEditing = editingShowtime ? st._id !== editingShowtime._id : true;
        return isSameRoom && isSameDate && isNotEditing;
      });

      const busyBlocks = roomShowtimes.map((st) => {
        const s = new Date(st.startTime);
        const e = new Date(st.endTime);
        const startMin = Math.max(openMin, s.getHours() * 60 + s.getMinutes());
        const endMin = Math.min(closeMin, e.getHours() * 60 + e.getMinutes() + buffer);
        return {
          startMin,
          endMin,
          title: st.movie?.title || 'Phim khác',
          startFmt: s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          endFmt: e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          type: 'busy',
        };
      }).sort((a, b) => a.startMin - b.startMin);

      const segments = [];
      let cursor = openMin;

      busyBlocks.forEach((busy) => {
        if (busy.startMin > cursor) {
          const freeLen = busy.startMin - cursor;
          segments.push({
            type: freeLen >= totalNeeded ? 'green' : 'yellow',
            startMin: cursor,
            endMin: busy.startMin,
            duration: freeLen,
            startFmt: `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`,
            endFmt: `${String(Math.floor(busy.startMin / 60)).padStart(2, '0')}:${String(busy.startMin % 60).padStart(2, '0')}`,
          });
        }
        segments.push(busy);
        cursor = Math.max(cursor, busy.endMin);
      });

      if (cursor < closeMin) {
        const freeLen = closeMin - cursor;
        segments.push({
          type: freeLen >= totalNeeded ? 'green' : 'yellow',
          startMin: cursor,
          endMin: closeMin,
          duration: freeLen,
          startFmt: `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`,
          endFmt: '24:00',
        });
      }

      return {
        room,
        roomType,
        isCompatible,
        segments,
      };
    });

    const timeTicks = [8, 10, 12, 14, 16, 18, 20, 22, 24];

    return { roomRows, timeTicks, totalMinutes, openMin, closeMin, selectedDateStr, movieDuration, totalNeeded };
  }, [isManualOpen, modalRooms, movies, form.movieId, form.format, form.startTime, showtimes, editingShowtime]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800">Lịch Chiếu Phim</h3>
          <p className="text-xs text-gray-500 mt-1">
            Cấu hình thời gian chiếu phim, sức chứa phòng và giá vé cơ bản.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTheater}
            onChange={handleTheaterChange}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold py-2 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
          >
            {theaters.map((th) => (
              <option key={th._id} value={th._id}>{th.name}</option>
            ))}
          </select>

          {/* Nút Tạo Tự Động */}
          <button
            onClick={handleOpenAutoGenerate}
            className="flex items-center gap-1.5 py-2 px-4 text-sm font-bold rounded-xl border-2 border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all"
          >
            <Zap size={15} /> Tự Động
          </button>

          {/* Nút Tạo Thủ Công */}
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            className="py-2 px-4 text-sm"
            icon={<Plus size={16} />}
          >
            Tạo Thủ Công
          </Button>
        </div>
      </div>

      {/* BỘ LỌC */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Lọc theo Phim</label>
          <select
            value={filterMovie}
            onChange={(e) => setFilterMovie(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm py-2 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
          >
            <option value="">Tất cả các phim</option>
            {movies.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Lọc theo Phòng</label>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm py-2 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
          >
            <option value="">Tất cả các phòng</option>
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Lọc theo Ngày</label>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm py-2 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
          >
            <option value="">Tất cả các ngày</option>
            {Array.from(new Set(showtimes.map(st => new Date(st.startTime).toLocaleDateString('vi-VN')))).map(dateStr => (
              <option key={dateStr} value={dateStr}>
                {dateStr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh sách lịch chiếu được nhóm theo ngày */}
      {(() => {
        const filteredShowtimes = showtimes.filter(st => {
          const matchMovie = filterMovie ? (st.movie?._id === filterMovie || st.movie === filterMovie) : true;
          const matchRoom = filterRoom ? (st.room?._id === filterRoom || st.room === filterRoom) : true;
          const dateStr = new Date(st.startTime).toLocaleDateString('vi-VN');
          const matchDate = filterDate ? (dateStr === filterDate) : true;
          return matchMovie && matchRoom && matchDate;
        });

        if (filteredShowtimes.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Calendar size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Không tìm thấy lịch chiếu nào phù hợp với bộ lọc.</p>
            </div>
          );
        }

        const groupedShowtimes = filteredShowtimes.reduce((acc, st) => {
          const dateStr = new Date(st.startTime).toLocaleDateString('vi-VN');
          if (!acc[dateStr]) acc[dateStr] = [];
          acc[dateStr].push(st);
          return acc;
        }, {});

        const sortedDates = Object.keys(groupedShowtimes).sort((a, b) => {
          const [d1, m1, y1] = a.split('/');
          const [d2, m2, y2] = b.split('/');
          return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
        });

        return (
          <div className="space-y-6">
            {sortedDates.map((dateStr) => {
              const dailyShowtimes = groupedShowtimes[dateStr].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

              return (
                <div key={dateStr} className="bg-white border border-gray-200 p-5 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
                    <Calendar className="text-brand" size={18} />
                    <h4 className="font-bold text-gray-800 text-md">Ngày {dateStr}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dailyShowtimes.map((st) => {
                      const startFmt = new Date(st.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endFmt = new Date(st.endTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const roomName = st.room?.name || 'Phòng không xác định';

                      return (
                        <div
                          key={st._id}
                          className="flex flex-col bg-gray-50/50 border border-gray-100 p-3.5 rounded-2xl gap-2 hover:border-brand/30 transition-all"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-bold text-gray-800 text-sm leading-tight">
                              {st.movie?.title || 'Phim đã bị xóa'}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditShowtime(st)}
                                className="p-1.5 bg-white border border-gray-200 hover:border-brand/40 text-gray-500 hover:text-brand rounded-lg transition-all"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteShowtime(st._id)}
                                className="p-1.5 bg-white border border-gray-200 hover:border-red-500/40 text-gray-500 hover:text-red-500 rounded-lg transition-all"
                                title="Xóa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 border-dashed">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-600">{startFmt} - {endFmt}</span>
                              <span className="text-[10px] text-gray-400">{roomName}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 bg-white px-2 py-0.5 border border-gray-200 rounded">
                                {st.format}
                              </span>
                              <span className="text-[10px] text-brand font-black mt-1">
                                {st.ticketPrice.toLocaleString()} VNĐ
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ───── Modal Tạo Thủ Công ───── */}
      <Modal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        title={editingShowtime ? 'Chỉnh Sửa Lịch Chiếu' : 'Tạo Suất Chiếu Thủ Công'}
        size="lg"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Chọn Phim</label>
              <select name="movieId" value={form.movieId} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer" required>
                {movies.length === 0 ? <option value="">Chưa có phim trong hệ thống</option> : movies.map((m) => <option key={m._id} value={m._id}>{m.title} ({m.status})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Rạp Chiếu</label>
              <select name="theaterId" value={form.theaterId} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer" required>
                {theaters.map((th) => <option key={th._id} value={th._id}>{th.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Định Dạng Chiếu</label>
              <select name="format" value={form.format} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                <option value="2D">2D</option><option value="3D">3D</option><option value="IMAX">IMAX</option><option value="GOLDCLASS">GOLDCLASS</option>
              </select>
            </div>
            <Input name="ticketPrice" type="number" label="Giá Vé Cơ Bản (VNĐ)" value={form.ticketPrice} onChange={handleChange} required />
          </div>

          {/* ── BIỂU ĐỒ GANTT TIMELINE TRỰC QUAN CỦA CÁC PHÒNG ── */}
          {ganttChartData && (
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 space-y-3 shadow-sm my-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-brand" /> Biểu Đồ Gantt Timeline Trực Quan ({ganttChartData.selectedDateStr})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" /> Bận
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /> Khung giờ trống (Click để chọn)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" /> Không đủ thời lượng
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[660px]">
                  {/* Trục mốc thời gian (08:00 -> 24:00) */}
                  <div className="flex items-center text-[10px] font-extrabold text-gray-400 border-b border-gray-100 pb-1.5 pl-36">
                    <div className="flex-1 flex justify-between relative px-1">
                      {ganttChartData.timeTicks.map((h) => (
                        <span key={h} className="shrink-0">
                          {String(h).padStart(2, '0')}:00
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Danh sách các Hàng Phòng Chiếu */}
                  <div className="space-y-2 pt-2 max-h-60 overflow-y-auto pr-1">
                    {ganttChartData.roomRows.map(({ room, roomType, isCompatible, segments }) => {
                      const isSelectedRoom = form.roomId === room._id;

                      return (
                        <div
                          key={room._id}
                          className={`flex items-center gap-3 p-2 rounded-xl transition-all border ${
                            isSelectedRoom
                              ? 'bg-brand/5 border-brand/50 shadow-2xs'
                              : 'bg-gray-50/70 border-gray-200/80 hover:border-gray-300'
                          } ${!isCompatible ? 'opacity-40' : ''}`}
                        >
                          {/* Cột Tên Phòng bên trái */}
                          <div className="w-32 shrink-0 flex items-center justify-between pr-2">
                            <span className="text-xs font-bold text-gray-800 truncate" title={room.name}>
                              {room.name}
                            </span>
                            {isCompatible ? (
                              <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                {roomType}
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                                🔒 Cần {form.format}
                              </span>
                            )}
                          </div>

                          {/* Thanh Timeline Hàng Ngang */}
                          <div className="flex-1 h-7 bg-white rounded-lg relative overflow-hidden flex items-center border border-gray-200 shadow-inner">
                            {segments.map((seg, idx) => {
                              const leftPct = ((seg.startMin - ganttChartData.openMin) / ganttChartData.totalMinutes) * 100;
                              const widthPct = ((seg.endMin - seg.startMin) / ganttChartData.totalMinutes) * 100;

                              if (seg.type === 'busy') {
                                return (
                                  <div
                                    key={idx}
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                    className="absolute top-0 bottom-0 bg-red-100/90 border-r border-red-300 text-red-800 flex items-center justify-center px-1 text-[9px] font-extrabold truncate cursor-not-allowed"
                                    title={`🔴 Đã bận: ${seg.title} (${seg.startFmt} - ${seg.endFmt})`}
                                  >
                                    <span className="truncate">{seg.startFmt} {seg.title}</span>
                                  </div>
                                );
                              }

                              if (seg.type === 'green') {
                                const clickDateTime = `${ganttChartData.selectedDateStr}T${seg.startFmt}`;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    disabled={!isCompatible}
                                    onClick={() => {
                                      setForm((prev) => ({
                                        ...prev,
                                        roomId: room._id,
                                        startTime: clickDateTime,
                                      }));
                                    }}
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                    className="absolute top-0 bottom-0 bg-emerald-50/90 hover:bg-emerald-600 border border-emerald-300/80 hover:border-emerald-600 text-emerald-700 hover:text-white flex items-center justify-center text-[9px] font-extrabold transition-all cursor-pointer shadow-2xs group"
                                    title={`🟢 Click để chọn suất chiếu lúc ${seg.startFmt} tại ${room.name}`}
                                  >
                                    <span className="truncate group-hover:scale-105 transition-transform">
                                      + {seg.startFmt}
                                    </span>
                                  </button>
                                );
                              }

                              // Yellow (Too short)
                              return (
                                <div
                                  key={idx}
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                  className="absolute top-0 bottom-0 bg-amber-50/80 border border-amber-200/80 text-amber-700 flex items-center justify-center text-[8px] font-extrabold opacity-75 cursor-not-allowed"
                                  title={`🟡 Trống ${seg.duration}m (Không đủ thời lượng ${ganttChartData.movieDuration}m)`}
                                >
                                  <span className="truncate">{seg.duration}m</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5 flex justify-between items-center">
                <span>Phòng Chiếu {modalRoomsLoading && <Loader2 size={12} className="inline ml-2 animate-spin text-brand" />}</span>
                <span className="text-[11px] font-normal text-gray-400">Đề xuất [{form.format}]</span>
              </label>
              <select name="roomId" value={form.roomId} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer disabled:opacity-50 font-medium" required disabled={modalRoomsLoading}>
                {modalRoomsLoading ? (
                  <option value="">Đang tải danh sách phòng...</option>
                ) : sortedModalRooms.length === 0 ? (
                  <option value="">Rạp này chưa có phòng nào</option>
                ) : (
                  sortedModalRooms.map((r) => {
                    const isMatched = (r.type || r.roomType || '').toUpperCase() === (form.format || '').toUpperCase();
                    return (
                      <option key={r._id} value={r._id}>
                        {r.name} ({r.type || 'Standard'}) {isMatched ? '⭐ Đề xuất (Khớp định dạng)' : ''}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <Input name="startTime" type="datetime-local" label="Ngày & Giờ Bắt Đầu" value={form.startTime} onChange={handleChange} required />
          </div>

          {/* ── BẢNG TÍNH & GỢI Ý KHUNG GIỜ CÒN TRỐNG ── */}
          {form.roomId && (
            <div className="bg-gray-50 border border-gray-200/90 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-200/70 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <Clock size={14} className="text-brand" />
                  Khung Giờ Trống Trong Ngày ({availableSlotDetails.selectedDateStr})
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">
                  Phim: {availableSlotDetails.movieDuration}m (+20m vệ sinh)
                </span>
              </div>

              {/* Các nút gợi ý chọn nhanh khung giờ */}
              {availableSlotDetails.availableSlots.length > 0 ? (
                <div>
                  <span className="text-[11px] text-gray-500 font-semibold block mb-1.5">
                    Gợi ý giờ bắt đầu khả thi (Click để tự động chọn):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSlotDetails.availableSlots.map((slot) => {
                      const fullDateTime = `${availableSlotDetails.selectedDateStr}T${slot}`;
                      const isSelected = form.startTime === fullDateTime;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, startTime: fullDateTime }))}
                          className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand text-white border-brand shadow-xs'
                              : 'bg-white border-gray-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          + {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 font-semibold italic">
                  ⚠️ Phòng này đã hết khung giờ trống khả thi trong ngày {availableSlotDetails.selectedDateStr}. Vui lòng chọn ngày hoặc phòng khác!
                </p>
              )}

              {/* Suất chiếu đã có trong ngày */}
              {availableSlotDetails.busyIntervals.length > 0 && (
                <div className="pt-2 border-t border-gray-200/70 text-[11px]">
                  <span className="font-bold text-gray-600 block mb-1">Suất chiếu đã xếp trong phòng:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSlotDetails.busyIntervals.map((b, idx) => (
                      <span key={idx} className="bg-amber-100/70 border border-amber-300/60 text-amber-900 px-2 py-0.5 rounded text-[10px] font-semibold" title={b.title}>
                        {b.startFmt} - {b.endFmt} ({b.title})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button onClick={() => setIsManualOpen(false)} variant="secondary" className="px-5 py-2">Hủy</Button>
            <Button type="submit" variant="primary" className="px-6 py-2" disabled={modalRoomsLoading || modalRooms.length === 0}>
              {editingShowtime ? 'Cập Nhật' : 'Lưu Lịch Chiếu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ───── Modal Tạo Tự Động ───── */}
      <Modal isOpen={isAutoOpen} onClose={() => { setIsAutoOpen(false); setAutoResult(null); }} title="⚡ Tạo Suất Chiếu Tự Động" size="lg">
        {autoResult ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center py-4">
              <CheckCircle2 size={52} className="text-green-500 mb-3" />
              <h3 className="text-lg font-black text-gray-800">Tạo Suất Chiếu Hoàn Tất!</h3>
              <p className="text-sm text-gray-500 mt-1">Phim: <span className="font-semibold text-gray-700">{autoResult.movie}</span></p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-green-600">{autoResult.created}</p>
                <p className="text-xs text-green-700 font-semibold mt-1">Tạo Thành Công</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-amber-600">{autoResult.skipped}</p>
                <p className="text-xs text-amber-700 font-semibold mt-1">Bỏ Qua (Trùng Lịch)</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-gray-700">{autoResult.total}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Tổng Đã Xử Lý</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
              <p>📅 <strong>{autoResult.days}</strong> ngày &nbsp;×&nbsp; 🏠 <strong>{autoResult.rooms}</strong> phòng &nbsp;×&nbsp; 🕐 <strong>{autoResult.slots}</strong> khung giờ</p>
              {autoResult.skipped > 0 && <p className="text-amber-600">⚠ {autoResult.skipped} suất bị bỏ qua do trùng lịch hoặc vượt quá 23:59.</p>}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <Button onClick={() => { setIsAutoOpen(false); setAutoResult(null); }} variant="secondary" className="px-5 py-2">Đóng</Button>
              <Button onClick={() => setAutoResult(null)} variant="primary" className="px-5 py-2" icon={<Zap size={14} />}>Tạo Thêm</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAutoSubmit} className="space-y-4">
            {autoError && (<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} /><span>{autoError}</span></div>)}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Chọn Phim</label>
                <select name="movieId" value={autoForm.movieId} onChange={handleAutoFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer" required>
                  {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Rạp Chiếu</label>
                <select name="theaterId" value={autoForm.theaterId} onChange={handleAutoFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer" required>
                  {theaters.map((th) => <option key={th._id} value={th._id}>{th.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 pl-0.5">
                Phòng Chiếu {autoModalRoomsLoading && <Loader2 size={12} className="inline ml-2 animate-spin text-brand" />}
                <span className="ml-2 text-xs font-normal text-gray-400">({autoForm.roomIds.length}/{autoModalRooms.length} đã chọn)</span>
              </label>
              {autoModalRoomsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-3"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>
              ) : autoModalRooms.length === 0 ? (
                <p className="text-sm text-amber-600">⚠ Rạp này chưa có phòng chiếu.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {autoModalRooms.map((room) => (
                    <label key={room._id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${autoForm.roomIds.includes(room._id) ? 'bg-brand/10 border-brand/30 text-brand font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={autoForm.roomIds.includes(room._id)} onChange={() => handleToggleRoom(room._id)} className="accent-brand w-4 h-4 shrink-0" />
                      <span>{room.name}</span>
                      <span className="ml-auto text-[10px] uppercase font-bold opacity-60">{room.type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Ngày Bắt Đầu</label>
                <input type="date" name="startDate" value={autoForm.startDate} onChange={handleAutoFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Ngày Kết Thúc</label>
                <input type="date" name="endDate" value={autoForm.endDate} onChange={handleAutoFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 pl-0.5">
                Khung Giờ Chiếu <span className="ml-2 text-xs font-normal text-gray-400">({autoForm.timeSlots.length} khung giờ)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {autoForm.timeSlots.map((slot) => (
                  <span key={slot} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Clock size={11} className="text-gray-500" />{slot}
                    <button type="button" onClick={() => handleRemoveSlot(slot)} className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input type="time" value={newSlotInput} onChange={(e) => setNewSlotInput(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg py-2 px-3 focus:border-brand outline-none" />
                <button type="button" onClick={handleAddSlot} className="flex items-center gap-1.5 bg-gray-100 hover:bg-brand/10 border border-gray-200 hover:border-brand/30 text-gray-600 hover:text-brand text-xs font-semibold px-3 py-2 rounded-lg transition-all">
                  <Plus size={13} /> Thêm Giờ
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Định Dạng Chiếu</label>
                <select name="format" value={autoForm.format} onChange={handleAutoFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                  <option value="2D">2D</option><option value="3D">3D</option><option value="IMAX">IMAX</option><option value="GOLDCLASS">GOLDCLASS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Giá Vé Cơ Bản (VNĐ)</label>
                <input type="number" name="ticketPrice" value={autoForm.ticketPrice} onChange={handleAutoFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none" required min={0} />
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
              <Zap size={20} className="text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-amber-700 font-semibold">Dự Kiến Tạo</p>
                <p className="text-sm text-amber-800 font-bold">
                  ~{estimatedShowtimes} suất chiếu
                  {autoForm.startDate && autoForm.endDate && (
                    <span className="text-xs font-normal ml-1 text-amber-600">
                      ({Math.floor((new Date(autoForm.endDate) - new Date(autoForm.startDate)) / (1000*60*60*24)) + 1} ngày × {autoForm.roomIds.length} phòng × {autoForm.timeSlots.length} khung giờ)
                    </span>
                  )}
                </p>
                {estimatedShowtimes > 0 && <p className="text-xs text-amber-600 mt-0.5">Số thực tế có thể ít hơn do bỏ qua các slot trùng lịch hoặc vượt 23:59.</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <Button onClick={() => setIsAutoOpen(false)} variant="secondary" className="px-5 py-2">Hủy</Button>
              <button
                type="submit"
                disabled={autoGenerating || !autoForm.roomIds.length || !autoForm.timeSlots.length}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {autoGenerating ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {autoGenerating ? 'Đang Tạo...' : 'Xác Nhận Tạo Tự Động'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ShowtimeManager;