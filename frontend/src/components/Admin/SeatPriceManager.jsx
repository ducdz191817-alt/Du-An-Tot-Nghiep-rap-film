import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Armchair,
  Building2,
  DoorOpen,
  DollarSign,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Heart,
  Square,
  Ban,
  Sparkles,
  Sliders,
  CheckSquare,
  SquareCheck
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../common/Button';
import Loading from '../common/Loading';

const SEAT_TYPES = [
  {
    key: 'standard',
    label: 'Ghế Thường',
    icon: Square,
    color: 'bg-white border-gray-300 text-gray-800 hover:border-gray-400',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    activeBg: 'bg-gray-800 text-white border-gray-900',
    defaultPrice: 0,
  },
  {
    key: 'vip',
    label: 'Ghế VIP',
    icon: Star,
    color: 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    activeBg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600',
    defaultPrice: 30000,
  },
  {
    key: 'couple',
    label: 'Ghế Đôi (Couple)',
    icon: Heart,
    color: 'bg-pink-50 border-pink-300 text-pink-900 hover:bg-pink-100',
    badge: 'bg-pink-100 text-pink-800 border-pink-300',
    activeBg: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-600',
    defaultPrice: 100000,
  },
];

export const SeatPriceManager = () => {
  const [theaters, setTheaters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [seats, setSeats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Chọn ghế bằng click / multi-select
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set());

  // Form chỉnh sửa nhanh loại ghế & giá cho các ghế được chọn
  const [bulkType, setBulkType] = useState('standard');
  const [bulkPrice, setBulkPrice] = useState(0);

  // Mức giá phụ thu chung áp dụng nhanh cho toàn bộ loại ghế
  const [typePrices, setTypePrices] = useState({
    standard: 0,
    vip: 30000,
    couple: 100000,
  });

  // 1. Tải danh sách rạp khi khởi chạy
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const thRes = await adminService.getTheaters();
        const thList = Array.isArray(thRes) ? thRes : (thRes?.data || []);
        setTheaters(thList);

        if (thList.length > 0) {
          const firstThId = thList[0]._id;
          setSelectedTheater(firstThId);
          await loadRooms(firstThId);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách rạp:', err);
        setMessage({ type: 'error', text: 'Không thể tải danh sách rạp chiếu' });
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 2. Load danh sách phòng chiếu khi chọn rạp
  const loadRooms = async (theaterId) => {
    if (!theaterId) {
      setRooms([]);
      setSelectedRoomId('');
      setSeats([]);
      return;
    }
    try {
      const rmRes = await adminService.getRooms(theaterId);
      const rmList = Array.isArray(rmRes) ? rmRes : (rmRes?.data || []);
      setRooms(rmList);
      if (rmList.length > 0) {
        const firstRoomId = rmList[0]._id;
        setSelectedRoomId(firstRoomId);
        await loadSeats(firstRoomId);
      } else {
        setSelectedRoomId('');
        setSeats([]);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách phòng:', err);
    }
  };

  // 3. Load danh sách ghế của phòng
  const loadSeats = async (roomId) => {
    if (!roomId) {
      setSeats([]);
      return;
    }
    setSeatsLoading(true);
    setSelectedSeatIds(new Set());
    setMessage({ type: '', text: '' });
    try {
      const seatRes = await adminService.getRoomSeats(roomId);
      const seatList = Array.isArray(seatRes) ? seatRes : (seatRes?.data || []);
      setSeats(seatList);
    } catch (err) {
      console.error('Lỗi tải ghế của phòng:', err);
      setMessage({ type: 'error', text: 'Không thể tải sơ đồ ghế của phòng này' });
    } finally {
      setSeatsLoading(false);
    }
  };

  // Thay đổi Rạp chiếu
  const handleTheaterChange = async (e) => {
    const thId = e.target.value;
    setSelectedTheater(thId);
    await loadRooms(thId);
  };

  // Thay đổi Phòng chiếu
  const handleRoomChange = async (e) => {
    const rmId = e.target.value;
    setSelectedRoomId(rmId);
    await loadSeats(rmId);
  };

  // Nhóm ghế theo hàng (Row A, B, C...)
  const seatGridByRow = useMemo(() => {
    const map = {};
    seats.forEach((seat) => {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat);
    });
    // Sort các hàng A->Z và các số ghế 1->9
    const sortedRows = Object.keys(map).sort();
    sortedRows.forEach((rowKey) => {
      map[rowKey].sort((a, b) => a.number - b.number);
    });
    return { sortedRows, map };
  }, [seats]);

  // Thống kê số lượng & giá trung bình theo loại ghế
  const seatStats = useMemo(() => {
    const stats = {
      standard: { count: 0, totalAddonPrice: 0 },
      vip: { count: 0, totalAddonPrice: 0 },
      couple: { count: 0, totalAddonPrice: 0 },
      disabled: 0,
      total: seats.length,
    };
    seats.forEach((s) => {
      if (s.isDisabled) {
        stats.disabled += 1;
      } else if (stats[s.type]) {
        stats[s.type].count += 1;
        stats[s.type].totalAddonPrice += s.price || 0;
      }
    });
    return stats;
  }, [seats]);

  // Chọn / Bỏ chọn 1 ghế
  const toggleSelectSeat = (seatId) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  };

  // Chọn toàn bộ ghế thuộc 1 hàng (Row)
  const toggleSelectRow = (rowKey) => {
    const rowSeats = seatGridByRow.map[rowKey] || [];
    const rowSeatIds = rowSeats.map((s) => s._id);
    const allSelected = rowSeatIds.every((id) => selectedSeatIds.has(id));

    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      rowSeatIds.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  // Chọn tất cả ghế
  const handleSelectAll = () => {
    if (selectedSeatIds.size === seats.length) {
      setSelectedSeatIds(new Set());
    } else {
      setSelectedSeatIds(new Set(seats.map((s) => s._id)));
    }
  };

  // Áp dụng giá phụ thu nhanh cho tất cả ghế của 1 loại (ví dụ: tất cả ghế VIP = +30k)
  const applyTypePriceToAll = (typeKey, priceVal) => {
    const val = Number(priceVal) || 0;
    setSeats((prevSeats) =>
      prevSeats.map((s) => {
        if (s.type === typeKey && !s.isDisabled) {
          return { ...s, price: val };
        }
        return s;
      })
    );
    setMessage({
      type: 'success',
      text: `Đã cập nhật phụ thu +${val.toLocaleString()} VNĐ cho toàn bộ ghế ${SEAT_TYPES.find((t) => t.key === typeKey)?.label}. Hãy nhấn "Lưu Thay Đổi" để lưu vào hệ thống!`,
    });
  };

  // Áp dụng loại ghế & giá cho các ghế ĐANG CHỌN (selectedSeatIds)
  const applyToSelectedSeats = () => {
    if (selectedSeatIds.size === 0) return;
    const priceVal = Number(bulkPrice) || 0;

    setSeats((prevSeats) =>
      prevSeats.map((s) => {
        if (selectedSeatIds.has(s._id)) {
          return { ...s, type: bulkType, price: priceVal };
        }
        return s;
      })
    );

    setMessage({
      type: 'success',
      text: `Đã cập nhật ${selectedSeatIds.size} ghế được chọn thành loại "${SEAT_TYPES.find((t) => t.key === bulkType)?.label}" giá +${priceVal.toLocaleString()} VNĐ.`,
    });
  };

  // Khóa / Mở khóa các ghế được chọn
  const toggleDisableSelectedSeats = (disableStatus) => {
    if (selectedSeatIds.size === 0) return;

    setSeats((prevSeats) =>
      prevSeats.map((s) => {
        if (selectedSeatIds.has(s._id)) {
          return { ...s, isDisabled: disableStatus };
        }
        return s;
      })
    );
  };

  // Lưu toàn bộ sơ đồ & giá ghế lên Server
  const handleSaveSeatPrices = async () => {
    if (!selectedRoomId || seats.length === 0) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updates = seats.map((s) => ({
        seatId: s._id,
        type: s.type,
        price: s.price || 0,
        isDisabled: s.isDisabled || false,
      }));

      await adminService.bulkUpdateSeats(updates);
      setMessage({
        type: 'success',
        text: '🎉 Đã lưu toàn bộ giá ghế và cấu hình sơ đồ phòng thành công!',
      });
    } catch (err) {
      console.error('Lỗi khi lưu giá ghế:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Lỗi khi lưu dữ liệu giá ghế',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const currentRoom = rooms.find((r) => r._id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <Armchair size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">Quản Lý Giá Ghế Phòng Chiếu</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Thiết lập mức phụ thu và quản lý giá cho từng loại ghế hoặc từng ghế trong phòng.
              </p>
            </div>
          </div>
        </div>

        {/* Nút lưu chính */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadSeats(selectedRoomId)}
            variant="secondary"
            className="py-2 px-3 text-sm"
            icon={<RotateCcw size={15} />}
            disabled={seatsLoading || saving || !selectedRoomId}
          >
            Tải Lại
          </Button>

          <Button
            onClick={handleSaveSeatPrices}
            variant="primary"
            className="py-2 px-5 text-sm font-bold shadow-md"
            icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            disabled={seatsLoading || saving || !selectedRoomId || seats.length === 0}
          >
            {saving ? 'Đang Lưu...' : 'Lưu Thay Đổi Giá Ghế'}
          </Button>
        </div>
      </div>

      {/* Thông báo Message */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-bold transition-all shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-500 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-xs opacity-70 hover:opacity-100 underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ── BỘ LỌC CHỌN RẠP & PHÒNG CHIẾU ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4.5 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Building2 size={14} className="text-brand" /> Chọn Rạp Chiếu
          </label>
          <select
            value={selectedTheater}
            onChange={handleTheaterChange}
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-sm py-2.5 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
          >
            {theaters.map((th) => (
              <option key={th._id} value={th._id}>
                {th.name} ({th.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <DoorOpen size={14} className="text-brand" /> Chọn Phòng Chiếu
          </label>
          <select
            value={selectedRoomId}
            onChange={handleRoomChange}
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-sm py-2.5 px-3 rounded-xl focus:border-brand outline-none cursor-pointer disabled:opacity-50"
            disabled={rooms.length === 0}
          >
            {rooms.length === 0 ? (
              <option value="">Rạp này chưa có phòng chiếu</option>
            ) : (
              rooms.map((rm) => (
                <option key={rm._id} value={rm._id}>
                  {rm.name} - ({rm.type || '2D'}) - Sức chứa: {rm.capacity || 0} ghế
                </option>
              ))
            )}
          </select>
        </div>

        {/* Thông tin phòng chọn */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Đang chỉnh sửa giá</p>
            <p className="text-base font-extrabold text-gray-800 mt-0.5">
              {currentRoom ? currentRoom.name : 'Chưa chọn phòng'}
            </p>
          </div>
          {currentRoom && (
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-black uppercase rounded-lg bg-brand/10 text-brand border border-brand/20">
                {currentRoom.type || '2D'}
              </span>
              <p className="text-[11px] text-gray-500 font-bold mt-1">
                Tổng: {seats.length} ghế
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── BẢNG THIẾT LẬP GIÁ THEO LOẠI GHẾ (BULK TYPE PRICING) ── */}
      {selectedRoomId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <Sliders size={16} className="text-brand" /> Mức Phụ Thu / Giá Theo Loại Ghế
            </h4>
            <span className="text-xs text-gray-400 font-medium">
              (Thay đổi phụ thu nhanh cho toàn bộ loại ghế trong phòng)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SEAT_TYPES.map((typeObj) => {
              const IconComp = typeObj.icon;
              const stats = seatStats[typeObj.key] || { count: 0 };
              const currentPrice = typePrices[typeObj.key];

              return (
                <div
                  key={typeObj.key}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${typeObj.badge}`}>
                        <IconComp size={16} />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-gray-800 text-sm">{typeObj.label}</h5>
                        <p className="text-[11px] text-gray-500 font-semibold">
                          Số lượng: <span className="text-brand font-black">{stats.count}</span> ghế
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={currentPrice}
                        onChange={(e) =>
                          setTypePrices((prev) => ({
                            ...prev,
                            [typeObj.key]: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold py-2 pl-7 pr-3 rounded-xl focus:border-brand outline-none"
                        placeholder="Mức phụ thu..."
                      />
                      <span className="absolute left-2.5 top-2.5 text-xs text-gray-400 font-bold">+</span>
                    </div>

                    <button
                      onClick={() => applyTypePriceToAll(typeObj.key, currentPrice)}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-brand text-white hover:bg-brand/90 transition-all shrink-0 shadow-xs cursor-pointer"
                      title="Áp dụng giá này cho tất cả ghế thuộc loại này"
                    >
                      Áp Dụng
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BẢNG ĐIỀU KHIỂN MULTI-SELECT GHẾ ── */}
      {selectedRoomId && seats.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-5">
          {/* Bar Thao Tác Nhanh Ghế Được Chọn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all cursor-pointer"
              >
                <SquareCheck size={14} className="text-brand" />
                {selectedSeatIds.size === seats.length ? 'Bỏ Chọn Tất Cả' : 'Chọn Tất Cả Ghế'}
              </button>

              <span className="text-xs font-bold text-gray-600">
                Đã chọn:{' '}
                <span className="text-brand font-black text-sm">{selectedSeatIds.size}</span> /{' '}
                {seats.length} ghế
              </span>
            </div>

            {/* Thao tác nhóm khi đã chọn ghế */}
            {selectedSeatIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold py-1.5 px-2.5 rounded-xl outline-none"
                >
                  {SEAT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step={5000}
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Giá phụ thu (+VNĐ)"
                  className="w-28 bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold py-1.5 px-2.5 rounded-xl outline-none"
                />

                <button
                  onClick={applyToSelectedSeats}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
                >
                  Gán Loại & Giá
                </button>

                <button
                  onClick={() => toggleDisableSelectedSeats(true)}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-all cursor-pointer"
                  title="Khóa/tạo lối đi cho ghế đang chọn"
                >
                  Khóa Ghế
                </button>

                <button
                  onClick={() => toggleDisableSelectedSeats(false)}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
                >
                  Mở Khóa
                </button>
              </div>
            )}
          </div>

          {/* chú thích sơ đồ */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-gray-600 bg-gray-50/70 py-2.5 px-4 rounded-2xl border border-gray-100">
            {SEAT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.key} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${t.color}`}>
                    <Icon size={10} />
                  </div>
                  <span>{t.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-red-300 bg-red-50 text-red-500 flex items-center justify-center">
                <Ban size={10} />
              </div>
              <span>Khóa / Lối Đi</span>
            </div>
            <div className="flex items-center gap-1.5 text-brand">
              <div className="w-4 h-4 rounded border-2 border-brand bg-brand/20" />
              <span>Đang Chọn</span>
            </div>
          </div>

          {/* ── MA TRẬN GHẾ PHÒNG CHIẾU (SCREEN + SEATS) ── */}
          {seatsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={36} className="animate-spin text-brand mb-2" />
              <p className="text-sm font-semibold">Đang tải sơ đồ ghế phòng chiếu...</p>
            </div>
          ) : (
            <div className="overflow-x-auto py-4">
              <div className="min-w-[600px] flex flex-col items-center">
                {/* Màn hình giả lập (Screen) */}
                <div className="w-3/4 max-w-lg mb-8 text-center">
                  <div className="h-2 bg-gradient-to-r from-gray-300 via-brand to-gray-300 rounded-full shadow-sm mb-1 opacity-70" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                    Màn Hình Chiếu (Screen)
                  </p>
                </div>

                {/* Danh sách các hàng ghế */}
                <div className="space-y-2.5">
                  {seatGridByRow.sortedRows.map((rowKey) => {
                    const rowSeats = seatGridByRow.map[rowKey];
                    const isRowAllSelected = rowSeats.every((s) => selectedSeatIds.has(s._id));

                    return (
                      <div key={rowKey} className="flex items-center gap-3">
                        {/* Nút chọn nguyên hàng ở bên trái */}
                        <button
                          onClick={() => toggleSelectRow(rowKey)}
                          className={`w-7 h-7 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                            isRowAllSelected
                              ? 'bg-brand text-white border-brand shadow-xs'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                          title={`Click để chọn toàn bộ hàng ${rowKey}`}
                        >
                          {rowKey}
                        </button>

                        {/* Hàng chứa các ghế */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {rowSeats.map((seat) => {
                            const isSelected = selectedSeatIds.has(seat._id);
                            const cfg = SEAT_TYPES.find((t) => t.key === seat.type) || SEAT_TYPES[0];
                            const Icon = cfg.icon;

                            let seatStyle = cfg.color;
                            if (seat.isDisabled) {
                              seatStyle = 'bg-red-50 border-red-200 text-red-400 opacity-60';
                            } else if (isSelected) {
                              seatStyle = `${cfg.activeBg} ring-2 ring-brand shadow-md scale-105`;
                            }

                            const isCouple = seat.type === 'couple';

                            return (
                              <button
                                key={seat._id}
                                onClick={() => toggleSelectSeat(seat._id)}
                                className={`relative flex flex-col items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                                  isCouple ? 'w-14 h-10 text-[10px]' : 'w-10 h-10 text-xs'
                                } ${seatStyle}`}
                                title={`${seat.row}${seat.number} - ${cfg.label} (+${(
                                  seat.price || 0
                                ).toLocaleString()}đ)${
                                  seat.isDisabled ? ' [Đang Khóa]' : ''
                                }`}
                              >
                                {seat.isDisabled ? (
                                  <Ban size={12} className="text-red-500" />
                                ) : (
                                  <>
                                    <span className="font-extrabold tracking-tighter">
                                      {seat.row}
                                      {seat.number}
                                    </span>
                                    <span className="text-[9px] font-bold opacity-80 leading-none">
                                      {seat.price > 0
                                        ? `+${seat.price / 1000}k`
                                        : '0k'}
                                    </span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeatPriceManager;
