import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckSquare,
  Square,
  Save,
  RotateCcw,
  Info,
  Ban,
  Star,
  Heart,
  Users,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import adminService from '../../services/admin.service';

// ─── Seat type config ────────────────────────────────────────────────────────
const SEAT_TYPES = [
  {
    key: 'standard',
    label: 'Thường',
    icon: <Square size={12} />,
    color: 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600',
    selectedColor: 'bg-zinc-500 border-zinc-400 text-white ring-2 ring-zinc-300',
    badgeColor: 'bg-zinc-700 text-zinc-300',
    dot: 'bg-zinc-400',
  },
  {
    key: 'vip',
    label: 'VIP',
    icon: <Star size={12} />,
    color: 'bg-amber-900/60 border-amber-700/60 text-amber-300 hover:bg-amber-800/60',
    selectedColor: 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300',
    badgeColor: 'bg-amber-900/80 text-amber-300',
    dot: 'bg-amber-400',
  },
  {
    key: 'couple',
    label: 'Đôi',
    icon: <Heart size={12} />,
    color: 'bg-pink-900/60 border-pink-700/60 text-pink-300 hover:bg-pink-800/60',
    selectedColor: 'bg-pink-600 border-pink-400 text-white ring-2 ring-pink-300',
    badgeColor: 'bg-pink-900/80 text-pink-300',
    dot: 'bg-pink-400',
  },
];

const getTypeConfig = (key) => SEAT_TYPES.find((t) => t.key === key) || SEAT_TYPES[0];

// ─── Individual Seat Button ───────────────────────────────────────────────────
const SeatButton = ({ seat, isSelected, onClick }) => {
  const cfg = getTypeConfig(seat.type);
  const isDisabled = seat.isDisabled;

  const baseClass =
    'relative flex flex-col items-center justify-center border rounded-md transition-all duration-150 cursor-pointer select-none text-[10px] font-bold';

  const sizeClass = seat.type === 'couple' ? 'w-12 h-8' : 'w-8 h-8';

  let colorClass;
  if (isDisabled) {
    colorClass = 'bg-red-950/60 border-red-800/40 text-red-500 opacity-60 cursor-not-allowed';
  } else if (isSelected) {
    colorClass = cfg.selectedColor;
  } else {
    colorClass = cfg.color;
  }

  return (
    <button
      onClick={() => onClick(seat)}
      className={`${baseClass} ${sizeClass} ${colorClass}`}
      title={`${seat.row}${seat.number} · ${cfg.label}${isDisabled ? ' · Vô hiệu hoá' : ''}`}
    >
      {isDisabled && (
        <Ban size={10} className="absolute top-0.5 right-0.5 text-red-400 opacity-80" />
      )}
      <span>{seat.row}{seat.number}</span>
    </button>
  );
};

// ─── Main Modal (Giao diện cấu hình sơ đồ ghế dành cho Admin) ────────────────────────────────
const SeatMapModal = ({ isOpen, onClose, room }) => {
  // Các state lưu trữ dữ liệu
  const [seats, setSeats] = useState([]); // Danh sách tất cả các ghế của phòng
  const [loading, setLoading] = useState(false); // Trạng thái đang tải dữ liệu từ server
  const [saving, setSaving] = useState(false); // Trạng thái đang lưu dữ liệu lên server
  const [selectedIds, setSelectedIds] = useState(new Set()); // Tập hợp các ID ghế đang được admin chọn trên giao diện
  const [pendingChanges, setPendingChanges] = useState({}); // Các thay đổi tạm thời chưa lưu xuống DB: { seatId: { type, price, isDisabled } }
  const [editPanel, setEditPanel] = useState({ type: 'standard', price: 0, isDisabled: false }); // Giá trị đang hiển thị trên khung chỉnh sửa bên phải
  const [toast, setToast] = useState(null); // Quản lý thông báo toast hiển thị nhanh
  const [selectMode, setSelectMode] = useState(false);

  // Nhóm các ghế theo hàng (ví dụ: hàng A có [A1, A2, A3...], hàng B có [B1, B2...])
  const seatsByRow = (seats ?? []).reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});
  const rows = Object.keys(seatsByRow).sort(); // Danh sách tên hàng đã sắp xếp thứ tự A->Z

  // Hàm hiển thị thông báo toast
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // CHỨC NĂNG: Tải danh sách ghế của phòng từ backend
  const loadSeats = useCallback(async () => {
    if (!room) return;
    setLoading(true);
    try {
      const res = await adminService.getRoomSeats(room._id);
      setSeats(Array.isArray(res) ? res : res?.data ?? []);
    } catch (err) {
      showToast('Không thể tải danh sách ghế', 'error');
    } finally {
      setLoading(false);
    }
  }, [room]);

  // Tải lại dữ liệu ghế mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setPendingChanges({});
      loadSeats();
    }
  }, [isOpen, loadSeats]);

  // Ngăn cuộn trang phía sau khi modal đang mở
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // CHỨC NĂNG: Xử lý khi admin click chọn/hủy chọn một chiếc ghế
  const handleSeatClick = (seat) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat._id)) {
        next.delete(seat._id);
      } else {
        next.add(seat._id);
      }
      return next;
    });
    // Điền trước thông tin của ghế vừa click vào bảng chỉnh sửa bên phải (bao gồm cả thay đổi tạm thời nếu có)
    const merged = { ...seat, ...(pendingChanges[seat._id] || {}) };
    setEditPanel({ type: merged.type, price: merged.price, isDisabled: merged.isDisabled ?? false });
  };

  // CHỨC NĂNG: Chọn tất cả các ghế trong phòng chiếu hoặc bỏ chọn tất cả
  const handleSelectAll = () => {
    if (selectedIds.size === seats.length) {
      setSelectedIds(new Set()); // Nếu đã chọn hết thì bỏ chọn toàn bộ
    } else {
      setSelectedIds(new Set(seats.map((s) => s._id))); // Chọn tất cả
    }
  };

  // CHỨC NĂNG: Chọn toàn bộ ghế của một hàng cụ thể (ví dụ: click chọn hàng A)
  const handleSelectRow = (row) => {
    const rowIds = seatsByRow[row].map((s) => s._id);
    const allSelected = rowIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      rowIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  // CHỨC NĂNG: Áp dụng thay đổi từ bảng chỉnh sửa bên phải vào tất cả ghế đang chọn (Lưu tạm thời ở máy Client)
  const handleApplyChanges = () => {
    if (selectedIds.size === 0) {
      showToast('Chưa chọn ghế nào để chỉnh sửa', 'error');
      return;
    }
    const updates = {};
    selectedIds.forEach((id) => {
      updates[id] = { ...editPanel }; // Ghi đè cấu hình mới vào danh sách tạm thời
    });
    setPendingChanges((prev) => ({ ...prev, ...updates }));
    showToast(`Đã áp dụng thay đổi cho ${selectedIds.size} ghế (chưa lưu)`);
  };

  // CHỨC NĂNG: Lưu toàn bộ danh sách ghế đã thay đổi tạm thời lên server (Lưu thật vào Database)
  const handleSave = async () => {
    const changedIds = Object.keys(pendingChanges);
    if (changedIds.length === 0) {
      showToast('Không có thay đổi nào để lưu', 'error');
      return;
    }
    setSaving(true);
    try {
      const updates = changedIds.map((seatId) => ({
        seatId,
        ...pendingChanges[seatId],
      }));
      // Gọi API cập nhật hàng loạt (Bulk Update)
      await adminService.bulkUpdateSeats(updates);
      await loadSeats(); // Tải lại danh sách ghế mới nhất từ server
      setPendingChanges({}); // Reset danh sách tạm thời
      setSelectedIds(new Set()); // Reset trạng thái chọn
      showToast(`Đã lưu ${changedIds.length} ghế thành công! ✓`);
    } catch (err) {
      showToast('Lỗi khi lưu dữ liệu: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // CHỨC NĂNG: Hủy bỏ toàn bộ các thay đổi chưa lưu để quay về cấu hình gốc
  const handleDiscard = () => {
    setPendingChanges({});
    setSelectedIds(new Set());
    showToast('Đã huỷ toàn bộ thay đổi chưa lưu');
  };

  // CHỨC NĂNG: Lấy thông tin hiển thị cuối cùng của một chiếc ghế (ưu tiên lấy thay đổi tạm thời trước)
  const getDisplaySeat = (seat) => ({
    ...seat,
    ...(pendingChanges[seat._id] || {}),
  });

  // ── Stats ──
  const stats = (seats ?? []).reduce(
    (acc, s) => {
      const d = getDisplaySeat(s);
      acc[d.type] = (acc[d.type] || 0) + 1;
      if (d.isDisabled) acc.disabled = (acc.disabled || 0) + 1;
      return acc;
    },
    {}
  );

  const pendingCount = Object.keys(pendingChanges).length;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl bg-[#0d0d0f] border border-zinc-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
              <Users size={16} className="text-brand" />
              Sơ đồ ghế —&nbsp;
              <span className="text-brand">{room?.name}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {room?.theater?.name} · {room?.type} · {seats.length} ghế tổng
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div
            className={`mx-6 mt-3 shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              toast.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={14} /> : <CheckSquare size={14} />}
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

            {/* ── Seat Map Area ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Screen */}
              <div className="flex flex-col items-center mb-2">
                <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-brand/60 to-transparent rounded-full mb-1" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">MÀN HÌNH</span>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
                >
                  {selectedIds.size === seats.length && seats.length > 0 ? (
                    <CheckSquare size={12} />
                  ) : (
                    <Square size={12} />
                  )}
                  {selectedIds.size === seats.length && seats.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-lg">
                    Đang chọn {selectedIds.size} ghế
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg animate-pulse">
                    {pendingCount} ghế chờ lưu
                  </span>
                )}
              </div>

              {/* Row-by-row grid */}
              {rows.map((row) => (
                <div key={row} className="flex items-center gap-2">
                  {/* Row label */}
                  <button
                    onClick={() => handleSelectRow(row)}
                    className="w-6 shrink-0 text-center text-[11px] font-black text-zinc-500 hover:text-brand transition-colors"
                    title={`Chọn hàng ${row}`}
                  >
                    {row}
                  </button>

                  {/* Seats */}
                  <div className="flex flex-wrap gap-1.5">
                    {seatsByRow[row].map((seat) => {
                      const display = getDisplaySeat(seat);
                      const isPending = !!pendingChanges[seat._id];
                      return (
                        <div key={seat._id} className="relative">
                          {isPending && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full z-10 ring-1 ring-[#0d0d0f]" />
                          )}
                          <SeatButton
                            seat={display}
                            isSelected={selectedIds.has(seat._id)}
                            onClick={() => handleSeatClick(seat)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-zinc-800/60">
                {SEAT_TYPES.map((t) => (
                  <div key={t.key} className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-semibold">
                    <span className={`w-3 h-3 rounded-sm ${t.dot}`} />
                    {t.label} ({stats[t.key] || 0})
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-semibold">
                  <span className="w-3 h-3 rounded-sm bg-red-700" />
                  Vô hiệu ({stats.disabled || 0})
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-semibold">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 rounded-full" />
                  Chờ lưu ({pendingCount})
                </div>
              </div>
            </div>

            {/* ── Right Panel: Edit Controls ── */}
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-800 shrink-0 flex flex-col">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3">
                    Chỉnh sửa ghế đã chọn
                  </h4>
                  {selectedIds.size === 0 && (
                    <p className="text-[11px] text-zinc-600 italic flex items-center gap-1.5">
                      <Info size={12} /> Click vào ghế để chọn rồi chỉnh sửa
                    </p>
                  )}
                </div>

                {/* Seat Type */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                    Loại ghế
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SEAT_TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setEditPanel((p) => ({ ...p, type: t.key }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-bold transition-all ${
                          editPanel.type === t.key
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                        }`}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                    Giá thêm (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={editPanel.price}
                    onChange={(e) => setEditPanel((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"
                  />
                  <p className="text-[10px] text-zinc-600">0 = Không phụ thu thêm</p>
                </div>

                {/* Disabled toggle */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                    Trạng thái
                  </label>
                  <button
                    onClick={() => setEditPanel((p) => ({ ...p, isDisabled: !p.isDisabled }))}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                      editPanel.isDisabled
                        ? 'bg-red-500/10 border-red-500/40 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    }`}
                  >
                    <span>{editPanel.isDisabled ? 'Vô hiệu hoá' : 'Hoạt động'}</span>
                    {editPanel.isDisabled ? <Ban size={14} /> : <CheckSquare size={14} />}
                  </button>
                </div>

                {/* Apply to selection */}
                <button
                  onClick={handleApplyChanges}
                  disabled={selectedIds.size === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedIds.size > 0
                      ? 'bg-brand hover:bg-brand/90 text-white'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <CheckSquare size={14} />
                  Áp dụng ({selectedIds.size})
                </button>

                {/* Divider */}
                <div className="border-t border-zinc-800" />

                {/* Stats mini */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Thống kê phòng</h4>
                  {SEAT_TYPES.map((t) => (
                    <div key={t.key} className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">{t.label}</span>
                      <span className="font-bold text-zinc-300">{stats[t.key] || 0} ghế</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-red-500">Vô hiệu</span>
                    <span className="font-bold text-red-400">{stats.disabled || 0} ghế</span>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="p-4 border-t border-zinc-800 space-y-2 shrink-0">
                {pendingCount > 0 && (
                  <button
                    onClick={handleDiscard}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition-all"
                  >
                    <RotateCcw size={12} />
                    Huỷ thay đổi ({pendingCount})
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || pendingCount === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                    pendingCount > 0 && !saving
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" /> Đang lưu...</>
                  ) : (
                    <><Save size={14} /> Lưu tất cả ({pendingCount})</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SeatMapModal;
