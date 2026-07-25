import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldAlert,
  Sparkles,
  Columns,
  Rows,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import adminService from '../../services/admin.service';

// ─── Seat type config ────────────────────────────────────────────────────────
const SEAT_TYPES = [
  {
    key: 'standard',
    label: 'Thường',
    icon: <Square size={12} />,
    color: 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-xs',
    selectedColor: 'bg-gray-800 border-gray-900 text-white ring-2 ring-gray-400 shadow-md',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  },
  {
    key: 'vip',
    label: 'VIP',
    icon: <Star size={12} />,
    color: 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs',
    selectedColor: 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  {
    key: 'couple',
    label: 'Đôi',
    icon: <Heart size={12} />,
    color: 'bg-pink-50 border-pink-300 text-pink-900 hover:bg-pink-100 shadow-xs',
    selectedColor: 'bg-gradient-to-r from-pink-500 to-rose-600 border-pink-600 text-white ring-2 ring-pink-300 shadow-md',
    badgeColor: 'bg-pink-50 text-pink-800 border-pink-200',
    dot: 'bg-pink-500',
  },
];

const getTypeConfig = (key) => SEAT_TYPES.find((t) => t.key === key) || SEAT_TYPES[0];

// ─── Row & Column Label Helpers ───────────────────────────────────────────────
const getRowLabel = (index) => {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
};

const getRowIndex = (label) => {
  let index = 0;
  for (let i = 0; i < label.length; i++) {
    index = index * 26 + (label.charCodeAt(i) - 64);
  }
  return index - 1;
};

// ─── Seat Button Component ────────────────────────────────────────────────────
const SeatButton = ({ seat, isSelected, isEditable, onClick }) => {
  const cfg = getTypeConfig(seat.type);
  const isDisabled = seat.isDisabled;

  const baseClass =
    'relative flex flex-col items-center justify-center border rounded-lg transition-all duration-150 cursor-pointer select-none text-[10px] font-bold';

  const sizeClass = seat.type === 'couple' ? 'w-12 h-7 text-[9px]' : 'w-7 h-7';

  let colorClass;
  if (isDisabled) {
    colorClass = 'bg-red-50 border-red-200 text-red-400 opacity-60 hover:opacity-90';
  } else if (isSelected) {
    colorClass = cfg.selectedColor;
  } else {
    colorClass = cfg.color;
  }

  return (
    <button
      onClick={() => onClick(seat)}
      className={`${baseClass} ${sizeClass} ${colorClass} ${!isEditable ? 'cursor-default' : ''}`}
      title={`${seat.row}${seat.number} · ${cfg.label}${isDisabled ? ' (Đang khóa/Lối đi)' : ''}`}
    >
      {isDisabled && (
        <Ban size={9} className="absolute top-0.5 right-0.5 text-red-500 opacity-80" />
      )}
      <span>{seat.row}{seat.number}</span>
    </button>
  );
};

// ─── Main Modal (Trình biên tập Sơ đồ ghế Ma trận $M \times N$) ───────────────
const SeatMapModal = ({ isOpen, onClose, room }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [toast, setToast] = useState(null);
  
  // Trạng thái kiểm tra ràng buộc bảo vệ dữ liệu vé
  const [isEditable, setIsEditable] = useState(true);
  const [lockReason, setLockReason] = useState('');

  // Giá trị trong Edit Panel
  const [editPanel, setEditPanel] = useState({ type: 'standard', price: 0, isDisabled: false });

  // ── Helper lấy key duy nhất cho 1 ghế ──
  const getSeatKey = useCallback((seat) => {
    return seat._id && !String(seat._id).startsWith('temp_') ? String(seat._id) : `${seat.row}_${seat.number}`;
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── 1. Tải danh sách ghế và kiểm tra trạng thái khóa ──
  const loadSeatsAndStatus = useCallback(async () => {
    if (!room) return;
    setLoading(true);
    try {
      const statusRes = await adminService.checkRoomEditable(room._id);
      const isEdit = statusRes?.editable ?? statusRes?.data?.editable ?? true;
      const reasonMsg = statusRes?.reason || statusRes?.data?.reason || '';
      setIsEditable(isEdit);
      setLockReason(reasonMsg);

      // Tải danh sách ghế
      const res = await adminService.getRoomSeats(room._id);
      const rawSeats = Array.isArray(res) ? res : res?.data ?? [];
      setSeats(rawSeats);
    } catch (err) {
      showToast('Không thể tải sơ đồ ghế: ' + (err.message || 'Lỗi mạng'), 'error');
    } finally {
      setLoading(false);
    }
  }, [room]);

  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(new Set());
      loadSeatsAndStatus();
    }
  }, [isOpen, loadSeatsAndStatus]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // ── 2. Xử lý Ma trận Hàng & Cột ──
  const matrixData = useMemo(() => {
    const seatsByRow = {};
    let maxColNum = 0;
    const rowIndexesSet = new Set();

    seats.forEach((seat) => {
      if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
      seatsByRow[seat.row].push(seat);
      if (seat.number > maxColNum) maxColNum = seat.number;
      rowIndexesSet.add(getRowIndex(seat.row));
    });

    const sortedRowLabels = Object.keys(seatsByRow).sort((a, b) => getRowIndex(a) - getRowIndex(b));

    // Mảng chứa các cột (1 -> maxColNum)
    const cols = Array.from({ length: maxColNum }, (_, i) => i + 1);

    return {
      seatsByRow,
      rows: sortedRowLabels,
      maxColNum,
      cols,
    };
  }, [seats]);

  if (!isOpen) return null;

  // ── 3. Thao tác Chọn Ghế / Chọn Hàng / Chọn Cột ──
  const handleSeatClick = (seat) => {
    const key = getSeatKey(seat);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setEditPanel({ type: seat.type, price: seat.price || 0, isDisabled: seat.isDisabled ?? false });
  };

  const handleSelectAll = () => {
    if (selectedKeys.size === seats.length && seats.length > 0) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(seats.map(getSeatKey)));
    }
  };

  const handleSelectRow = (rowLabel) => {
    const rowSeats = matrixData.seatsByRow[rowLabel] || [];
    const rowKeys = rowSeats.map(getSeatKey);
    const allSelected = rowKeys.every((k) => selectedKeys.has(k));

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      rowKeys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const handleSelectCol = (colNum) => {
    const colSeats = seats.filter((s) => s.number === colNum);
    const colKeys = colSeats.map(getSeatKey);
    const allSelected = colKeys.every((k) => selectedKeys.has(k));

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      colKeys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  // ── 4. Thao tác hàng loạt (Bulk Updates) ──
  const handleBulkChangeType = (newType) => {
    if (selectedKeys.size === 0) return;

    // RÀNG BUỘC NGHIỆP VỤ: Ghế Đôi CHỈ ĐƯỢC PHÉP ở hàng cuối cùng của phòng chiếu
    if (newType === 'couple') {
      const lastRowLabel = matrixData.rows[matrixData.rows.length - 1];
      const hasUpperRowSeat = seats.some(
        (s) => selectedKeys.has(getSeatKey(s)) && s.row !== lastRowLabel
      );
      if (hasUpperRowSeat) {
        showToast(`Ghế Đôi chỉ được áp dụng ở Hàng cuối cùng (${lastRowLabel}) của phòng chiếu!`, 'error');
        return;
      }
    }

    setSeats((prev) =>
      prev.map((s) => (selectedKeys.has(getSeatKey(s)) ? { ...s, type: newType } : s))
    );
    showToast(`Đã đổi loại ghế ${getTypeConfig(newType).label} cho ${selectedKeys.size} ghế`);
  };

  const handleBulkToggleDisabled = () => {
    if (selectedKeys.size === 0) return;
    setSeats((prev) =>
      prev.map((s) => {
        if (selectedKeys.has(getSeatKey(s))) {
          return { ...s, isDisabled: !s.isDisabled };
        }
        return s;
      })
    );
    showToast(`Đã chuyển đổi trạng thái Khóa/Lối đi cho ${selectedKeys.size} ghế`);
  };

  const handleBulkDeleteSeats = () => {
    if (selectedKeys.size === 0) return;
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedKeys.size} ghế đang chọn khỏi sơ đồ?`)) return;

    setSeats((prev) => prev.filter((s) => !selectedKeys.has(getSeatKey(s))));
    setSelectedKeys(new Set());
    showToast('Đã xóa các ghế được chọn');
  };

  const handleApplySidePanel = () => {
    if (selectedKeys.size === 0) {
      showToast('Chưa chọn ghế nào để chỉnh sửa', 'error');
      return;
    }

    // RÀNG BUỘC NGHIỆP VỤ: Ghế Đôi CHỈ ĐƯỢC PHÉP ở hàng cuối cùng
    if (editPanel.type === 'couple') {
      const lastRowLabel = matrixData.rows[matrixData.rows.length - 1];
      const hasUpperRowSeat = seats.some(
        (s) => selectedKeys.has(getSeatKey(s)) && s.row !== lastRowLabel
      );
      if (hasUpperRowSeat) {
        showToast(`Ghế Đôi chỉ được áp dụng ở Hàng cuối cùng (${lastRowLabel}) của phòng chiếu!`, 'error');
        return;
      }
    }

    setSeats((prev) =>
      prev.map((s) => {
        if (selectedKeys.has(getSeatKey(s))) {
          return {
            ...s,
            type: editPanel.type,
            price: editPanel.price,
            isDisabled: editPanel.isDisabled,
          };
        }
        return s;
      })
    );
    showToast(`Đã áp dụng thay đổi cho ${selectedKeys.size} ghế`);
  };

  // ── 5. Thao tác Thêm / Chèn Hàng & Cột ──

  // Thêm hàng mới ở vị trí rowIdx (0-indexed)
  const handleInsertRowAt = (targetRowIdx) => {
    const isVeryBottom = targetRowIdx >= matrixData.rows.length;

    let refColNumbers = [];
    let defaultType = 'standard';
    let defaultPrice = 0;

    if (isVeryBottom) {
      // Hàng cuối cùng của phòng chiếu -> Mặc định là GHẾ ĐÔI (Couple)
      defaultType = 'couple';
      defaultPrice = 120000;

      // Lấy danh sách số ghế từ hàng đôi cuối cùng nếu có
      const lastRowLabel = matrixData.rows[matrixData.rows.length - 1];
      const lastRowSeats = matrixData.seatsByRow[lastRowLabel] || [];
      const isLastCouple = lastRowSeats.some((s) => s.type === 'couple');

      if (isLastCouple && lastRowSeats.length > 0) {
        refColNumbers = lastRowSeats.map((s) => s.number).sort((a, b) => a - b);
      } else {
        // Tự động sinh các số ghế lẻ 1, 3, 5, 7... cho ghế đôi
        const maxCol = Math.max(matrixData.maxColNum, 6);
        for (let c = 1; c <= maxCol; c += 2) {
          refColNumbers.push(c);
        }
      }
    } else {
      // Chèn ở giữa hoặc đầu -> Mặc định là Ghế Thường hoặc VIP
      if (matrixData.rows.length > 0) {
        const refIdx = Math.min(Math.max(0, targetRowIdx - 1), matrixData.rows.length - 1);
        const refLabel = matrixData.rows[refIdx] || matrixData.rows[0];
        const refSeats = matrixData.seatsByRow[refLabel] || [];
        refColNumbers = refSeats.map((s) => s.number).sort((a, b) => a - b);

        const refType = refSeats[0]?.type || 'standard';
        defaultType = refType === 'vip' ? 'vip' : 'standard';
        defaultPrice = defaultType === 'vip' ? 5000 : 0;
      }

      if (refColNumbers.length === 0) {
        refColNumbers = [1, 2, 3, 4, 5, 6];
      }
    }

    setSeats((prevSeats) => {
      const shiftedSeats = prevSeats.map((seat) => {
        const currentIdx = getRowIndex(seat.row);
        if (currentIdx >= targetRowIdx) {
          return { ...seat, row: getRowLabel(currentIdx + 1) };
        }
        return seat;
      });

      const targetLabel = getRowLabel(targetRowIdx);
      const newRowSeats = refColNumbers.map((c) => ({
        _id: `temp_row_${targetRowIdx}_col_${c}_${Date.now()}_${Math.random()}`,
        row: targetLabel,
        number: c,
        type: defaultType,
        price: defaultPrice,
        isDisabled: false,
      }));

      return [...shiftedSeats, ...newRowSeats];
    });

    const typeLabel = defaultType === 'couple' ? 'Ghế Đôi' : defaultType === 'vip' ? 'VIP' : 'Thường';
    showToast(`Đã thêm Hàng ${getRowLabel(targetRowIdx)} mới (${typeLabel})`);
  };

  // Tạo thêm 1 ghế lẻ trực tiếp tại ô khoảng trống
  const handleEmptySlotClick = (rowLabel, colNum) => {
    if (!isEditable) return;
    const newSeat = {
      _id: `temp_slot_${rowLabel}_${colNum}_${Date.now()}`,
      row: rowLabel,
      number: colNum,
      type: editPanel.type || 'standard',
      price: editPanel.price || 0,
      isDisabled: editPanel.isDisabled || false,
    };
    setSeats((prev) => [...prev, newSeat]);
    showToast(`Đã tạo ghế ${rowLabel}${colNum}`);
  };

  // Thêm cột mới ở vị trí targetCol (1-indexed)
  const handleInsertColAt = (targetColNum) => {
    setSeats((prevSeats) => {
      const shiftedSeats = prevSeats.map((seat) => {
        if (seat.number >= targetColNum) {
          return { ...seat, number: seat.number + 1 };
        }
        return seat;
      });

      const currentRows = matrixData.rows.length > 0 ? matrixData.rows : ['A', 'B', 'C', 'D', 'E'];
      const newColSeats = [];

      currentRows.forEach((rLabel) => {
        newColSeats.push({
          _id: `temp_col_${targetColNum}_row_${rLabel}_${Date.now()}`,
          row: rLabel,
          number: targetColNum,
          type: 'standard',
          price: 0,
          isDisabled: false,
        });
      });

      return [...shiftedSeats, ...newColSeats];
    });

    showToast(`Đã chèn Cột ${targetColNum} mới`);
  };

  const handleDeleteRow = (rowLabel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ Hàng ${rowLabel}?`)) return;

    const delIdx = getRowIndex(rowLabel);
    setSeats((prevSeats) => {
      const filtered = prevSeats.filter((s) => s.row !== rowLabel);
      return filtered.map((seat) => {
        const idx = getRowIndex(seat.row);
        if (idx > delIdx) {
          return { ...seat, row: getRowLabel(idx - 1) };
        }
        return seat;
      });
    });

    showToast(`Đã xóa Hàng ${rowLabel}`);
  };

  // ── 6. Lưu toàn bộ sơ đồ ghế xuống DB ──
  const handleSaveAll = async () => {
    if (!isEditable) {
      showToast('Phòng chiếu đang bị khóa sửa sơ đồ', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await adminService.saveRoomLayout(room._id, seats);
      setSeats(res.data || []);
      setSelectedKeys(new Set());
      showToast('Đã lưu cấu trúc sơ đồ ghế thành công! ✓');
    } catch (err) {
      showToast('Lỗi khi lưu sơ đồ ghế: ' + (err.message || 'Lỗi không xác định'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const stats = seats.reduce(
    (acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      if (s.isDisabled) acc.disabled = (acc.disabled || 0) + 1;
      return acc;
    },
    {}
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-6xl bg-white border border-gray-200 rounded-3xl shadow-2xl z-10 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80">
          <div>
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-brand/10 text-brand flex items-center justify-center shadow-xs">
                <Layers size={16} />
              </div>
              Cấu hình Ma trận Ghế Hàng & Cột —&nbsp;
              <span className="text-brand">{room?.name}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {room?.theater?.name || 'Cụm rạp'} · {room?.type} · Tổng số lượng: <span className="font-extrabold text-gray-800">{seats.length} ghế</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-2xl hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Warning Banner if Not Editable ── */}
        {!isEditable && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-3 text-xs shrink-0 shadow-xs">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-amber-900 mb-0.5">⚠️ Chế độ xem (Đã khóa chỉnh sửa cấu trúc):</span>
              <p className="text-amber-800/90">{lockReason}</p>
            </div>
          </div>
        )}

        {/* ── Toast Alert ── */}
        {toast && (
          <div
            className={`mx-6 mt-3 shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckSquare size={15} />}
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 size={32} className="animate-spin text-brand" />
            <span className="text-xs font-bold text-gray-400">Đang tải ma trận sơ đồ ghế...</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            
            {/* ── SEAT MAP MATRIX WORKSPACE ── */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 bg-gray-50/40">

              {/* ── FLOATING GLASS TOOLBAR KHI CHỌN GHẾ ── */}
              {selectedKeys.size > 0 && isEditable && (
                <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-400 pr-3 border-r border-gray-700 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      Đang chọn ({selectedKeys.size}):
                    </span>

                    <button
                      onClick={() => handleBulkChangeType('standard')}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center gap-1.5 transition-all"
                    >
                      <Square size={12} /> Ghế Thường
                    </button>

                    <button
                      onClick={() => handleBulkChangeType('vip')}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all"
                    >
                      <Star size={12} /> Ghế VIP
                    </button>

                    <button
                      onClick={() => handleBulkChangeType('couple')}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 flex items-center gap-1.5 transition-all"
                    >
                      <Heart size={12} /> Ghế Đôi
                    </button>

                    <button
                      onClick={handleBulkToggleDisabled}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 flex items-center gap-1.5 transition-all"
                    >
                      <Ban size={12} /> Khóa / Lối đi
                    </button>
                  </div>

                  <button
                    onClick={handleBulkDeleteSeats}
                    className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Trash2 size={13} /> Xóa ghế
                  </button>
                </div>
              )}

              {/* ── Screen Representation ── */}
              <div className="flex flex-col items-center my-3">
                <div className="w-2/3 h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-full shadow-xs mb-1" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MÀN HÌNH CHIẾU</span>
              </div>

              {/* ── MATRIX DISPLAY ── */}
              <div className="overflow-x-auto p-5 bg-white border border-gray-200/80 rounded-3xl shadow-sm space-y-1">
                
                {/* Column Headers (1, 2, 3...) */}
                <div className="flex items-center gap-1.5 pl-8">
                  {matrixData.cols.map((colNum, cIdx) => (
                    <React.Fragment key={`col_hdr_${colNum}`}>
                      <button
                        onClick={() => handleSelectCol(colNum)}
                        className="w-7 text-center text-[10px] font-black text-gray-400 hover:text-brand hover:bg-brand/10 py-1 rounded-md transition-colors"
                        title={`Click để chọn tất cả Cột ${colNum}`}
                      >
                        {colNum}
                      </button>
                      {/* Interstitial Col Insert Button */}
                      {isEditable && cIdx < matrixData.cols.length - 1 && (
                        <div className="relative mx-0.5 group/colinsert inline-flex items-center">
                          <button
                            onClick={() => handleInsertColAt(colNum + 1)}
                            className="w-4 h-6 opacity-0 group-hover/colinsert:opacity-100 bg-blue-500/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-md flex items-center justify-center transition-all shadow-xs border border-blue-300/50"
                            title={`Chèn cột mới giữa Cột ${colNum} và Cột ${colNum + 1}`}
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Rows & Seats Grid */}
                {matrixData.rows.map((rowLabel, rIdx) => {
                  const rowSeats = matrixData.seatsByRow[rowLabel] || [];
                  const seatByColNum = {};
                  rowSeats.forEach((s) => {
                    seatByColNum[s.number] = s;
                  });

                  return (
                    <React.Fragment key={`row_wrap_${rowLabel}`}>
                      <div className="flex items-center gap-1.5 py-0.5">
                        
                        {/* Row Header Label Button */}
                        <div className="flex items-center gap-1 w-7 shrink-0">
                          <button
                            onClick={() => handleSelectRow(rowLabel)}
                            className="w-6 text-center text-[11px] font-black text-gray-700 hover:text-brand hover:bg-brand/10 py-1 rounded-md transition-colors"
                            title={`Click để chọn tất cả Hàng ${rowLabel}`}
                          >
                            {rowLabel}
                          </button>
                          {isEditable && (
                            <button
                              onClick={() => handleDeleteRow(rowLabel)}
                              className="text-gray-300 hover:text-red-500 p-0.5 opacity-0 hover:opacity-100 transition-opacity"
                              title={`Xóa toàn bộ Hàng ${rowLabel}`}
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>

                        {/* Seat Cells in this row */}
                        <div className="flex items-center gap-1.5 flex-1">
                          {matrixData.cols.map((colNum, cIdx) => {
                            const seat = seatByColNum[colNum];
                            if (!seat) {
                              return (
                                <React.Fragment key={`empty_${rowLabel}_${colNum}`}>
                                  <button
                                    disabled={!isEditable}
                                    onClick={() => handleEmptySlotClick(rowLabel, colNum)}
                                    className={`w-7 h-7 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-[9px] font-extrabold transition-all ${
                                      isEditable
                                        ? 'hover:border-brand hover:bg-brand/10 text-gray-300 hover:text-brand cursor-pointer'
                                        : 'text-gray-200 cursor-default opacity-40'
                                    }`}
                                    title={isEditable ? `Click để tạo ghế ${rowLabel}${colNum}` : `Khoảng trống (${rowLabel}${colNum})`}
                                  >
                                    +
                                  </button>
                                  {isEditable && cIdx < matrixData.cols.length - 1 && (
                                    <div className="w-4" />
                                  )}
                                </React.Fragment>
                              );
                            }

                            const isSelected = selectedKeys.has(getSeatKey(seat));
                            return (
                              <React.Fragment key={getSeatKey(seat)}>
                                <SeatButton
                                  seat={seat}
                                  isSelected={isSelected}
                                  isEditable={isEditable}
                                  onClick={handleSeatClick}
                                />
                                {isEditable && cIdx < matrixData.cols.length - 1 && (
                                  <div className="w-4" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sleek Interstitial Row Insert (+) Handle */}
                      {isEditable && rIdx < matrixData.rows.length - 1 && (
                        <div className="relative my-1 group/rowinsert">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-emerald-300 opacity-0 group-hover/rowinsert:opacity-100 transition-opacity" />
                          </div>
                          <div className="relative flex justify-center opacity-0 group-hover/rowinsert:opacity-100 transition-all transform scale-95 group-hover/rowinsert:scale-100">
                            <button
                              onClick={() => handleInsertRowAt(rIdx + 1)}
                              className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-md hover:bg-emerald-500 flex items-center gap-1 transition-all"
                            >
                              <Plus size={11} /> Chèn hàng giữa Hàng {rowLabel} và {matrixData.rows[rIdx + 1]}
                            </button>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* ── Legend Bar & Select All ── */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex flex-wrap gap-4 items-center">
                  {SEAT_TYPES.map((t) => (
                    <div key={t.key} className="flex items-center gap-1.5 font-semibold text-gray-600">
                      <span className={`w-3.5 h-3.5 rounded-sm ${t.dot}`} />
                      {t.label} ({stats[t.key] || 0})
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 font-semibold text-gray-600">
                    <span className="w-3.5 h-3.5 rounded-sm bg-red-500" />
                    Vô hiệu / Lối đi ({stats.disabled || 0})
                  </div>
                </div>

                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all bg-white shadow-2xs"
                >
                  {selectedKeys.size === seats.length && seats.length > 0 ? (
                    <CheckSquare size={12} className="text-brand" />
                  ) : (
                    <Square size={12} />
                  )}
                  {selectedKeys.size === seats.length && seats.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
            </div>

            {/* ── RIGHT CONTROL PANEL ── */}
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-200/80 shrink-0 flex flex-col bg-white">
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-1">
                    Bảng Thuộc Tính Ghế
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Click vào ghế/hàng/cột để tùy chỉnh thuộc tính bên dưới.
                  </p>
                </div>

                {/* Seat Type Options */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Loại ghế
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SEAT_TYPES.map((t) => (
                      <button
                        key={t.key}
                        disabled={!isEditable}
                        onClick={() => setEditPanel((p) => ({ ...p, type: t.key }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                          editPanel.type === t.key
                            ? 'border-brand bg-brand/10 text-brand shadow-xs'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Surcharge */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Phụ thu (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    disabled={!isEditable}
                    value={editPanel.price}
                    onChange={(e) => setEditPanel((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 text-sm focus:border-brand outline-none transition-colors"
                  />
                </div>

                {/* Disabled toggle */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Trạng thái hoạt động
                  </label>
                  <button
                    disabled={!isEditable}
                    onClick={() => setEditPanel((p) => ({ ...p, isDisabled: !p.isDisabled }))}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-xs font-bold ${
                      editPanel.isDisabled
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <span>{editPanel.isDisabled ? 'Vô hiệu / Lối đi' : 'Cho phép đặt vé'}</span>
                    {editPanel.isDisabled ? <Ban size={15} /> : <CheckSquare size={15} />}
                  </button>
                </div>

                {/* Apply Panel Button */}
                <button
                  onClick={handleApplySidePanel}
                  disabled={!isEditable || selectedKeys.size === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedKeys.size > 0 && isEditable
                      ? 'bg-brand hover:bg-brand/90 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  <CheckSquare size={14} />
                  Áp dụng cho ({selectedKeys.size}) ghế
                </button>

                {/* Stats */}
                <div className="pt-3 border-t border-gray-200/80 space-y-1.5">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tổng quan ma trận</h4>
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>Số hàng:</span>
                    <span className="font-bold">{matrixData.rows.length} hàng ({matrixData.rows[0] || 'A'} - {matrixData.rows[matrixData.rows.length - 1] || 'A'})</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>Số cột tối đa:</span>
                    <span className="font-bold">{matrixData.maxColNum} cột</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>Tổng số ghế:</span>
                    <span className="font-bold text-brand">{seats.length} ghế</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-gray-200/80 space-y-2 shrink-0 bg-white">
                <button
                  onClick={handleSaveAll}
                  disabled={saving || !isEditable}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all ${
                    isEditable && !saving
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Đang lưu sơ đồ...</>
                  ) : (
                    <><Save size={16} /> Lưu Ma Trận Sơ Đồ Ghế</>
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
