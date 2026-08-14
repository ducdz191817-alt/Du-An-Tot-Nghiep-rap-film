import React, { useState, useEffect, useCallback } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Monitor,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Info,
  Sparkles,
  Layers,
  Square,
  Star,
  Heart,
  Eye,
  Check,
  X,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../common/Button';
import Modal from '../common/Modal';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0) + ' ₫';

// Màu sắc và badge theo mã loại phòng
const getRoomTypeTheme = (code = '') => {
  const c = code.toUpperCase();
  if (c.includes('IMAX')) {
    return {
      gradient: 'from-amber-500/20 via-orange-500/10 to-amber-500/5',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      border: 'border-amber-500/30 dark:border-amber-500/20',
      iconColor: 'text-amber-500',
    };
  }
  if (c.includes('3D')) {
    return {
      gradient: 'from-cyan-500/20 via-blue-500/10 to-cyan-500/5',
      badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      border: 'border-cyan-500/30 dark:border-cyan-500/20',
      iconColor: 'text-cyan-500',
    };
  }
  if (c.includes('4DX') || c.includes('GOLD') || c.includes('VIP')) {
    return {
      gradient: 'from-rose-500/20 via-pink-500/10 to-rose-500/5',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      border: 'border-rose-500/30 dark:border-rose-500/20',
      iconColor: 'text-rose-500',
    };
  }
  // Mặc định cho 2D hoặc khác
  return {
    gradient: 'from-purple-500/20 via-indigo-500/10 to-purple-500/5',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    border: 'border-purple-500/30 dark:border-purple-500/20',
    iconColor: 'text-purple-500',
  };
};

export const RoomTypeManager = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null, loading: false });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    allowedSeatTypes: ['standard', 'vip', 'couple'],
    seatPrices: {
      standard: 100000,
      vip: 150000,
      couple: 300000,
    },
    isActive: true,
  });

  const toggleSeatType = (type) => {
    setFormData((p) => {
      const current = p.allowedSeatTypes || ['standard', 'vip', 'couple'];
      const has = current.includes(type);
      if (has && current.length <= 1) return p; // phải có ít nhất 1
      const next = has ? current.filter((t) => t !== type) : [...current, type];
      return { ...p, allowedSeatTypes: next };
    });
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRoomTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getRoomTypes();
      const list = Array.isArray(res) ? res : res?.data || [];
      setRoomTypes(list);
    } catch (err) {
      console.error('Lỗi khi tải danh sách loại phòng:', err);
      showToast('error', err?.message || 'Không thể tải danh sách loại phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoomTypes();
  }, [loadRoomTypes]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      allowedSeatTypes: ['standard', 'vip', 'couple'],
      seatPrices: {
        standard: 100000,
        vip: 150000,
        couple: 300000,
      },
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      allowedSeatTypes: item.allowedSeatTypes && item.allowedSeatTypes.length > 0
        ? item.allowedSeatTypes
        : ['standard', 'vip', 'couple'],
      seatPrices: {
        standard: item.seatPrices?.standard ?? 100000,
        vip: item.seatPrices?.vip ?? 150000,
        couple: item.seatPrices?.couple ?? 300000,
      },
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('error', 'Vui lòng nhập tên và mã loại phòng chiếu');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await adminService.updateRoomType(editingItem._id, formData);
        showToast('success', `Đã cập nhật loại phòng "${formData.name}" thành công!`);
      } else {
        await adminService.createRoomType(formData);
        showToast('success', `Đã thêm loại phòng "${formData.name}" thành công!`);
      }
      setIsModalOpen(false);
      loadRoomTypes();
    } catch (err) {
      console.error('Lỗi khi lưu loại phòng:', err);
      showToast('error', err?.response?.data?.message || err?.message || 'Lỗi lưu loại phòng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.item) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await adminService.deleteRoomType(deleteConfirm.item._id);
      showToast('success', `Đã xóa loại phòng "${deleteConfirm.item.name}"`);
      setDeleteConfirm({ isOpen: false, item: null, loading: false });
      loadRoomTypes();
    } catch (err) {
      console.error('Lỗi xóa loại phòng:', err);
      showToast('error', err?.response?.data?.message || err?.message || 'Không thể xóa loại phòng');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-sm font-semibold border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121827] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-brand/10 text-brand rounded-2xl">
              <Monitor size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Quản Lý Loại Phòng & Bảng Giá Ghế
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Cấu hình định dạng phòng (2D, 3D, IMAX...) và giá vé chuẩn từng loại ghế (Thường, VIP, Đôi).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-all shadow-md shadow-brand/20 active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>Thêm Loại Phòng Mới</span>
        </button>
      </div>

      {/* Info Guideline */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <p className="font-bold">Cách thức hoạt động của bảng giá ghế theo loại phòng:</p>
          <p>
            • Khi tạo phòng chiếu mới trong <strong>"Rạp & Phòng chiếu"</strong> và chọn loại phòng tương ứng, các ghế sẽ tự động nhận giá chuẩn từ bảng giá này.
          </p>
          <p>
            • Bạn vẫn có thể tùy chỉnh giá riêng lẻ cho từng chiếc ghế cụ thể bất kỳ lúc nào trong mục <strong>"Quản lý giá ghế"</strong>.
          </p>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin text-brand" />
          <span className="text-sm font-semibold">Đang tải danh sách loại phòng chiếu...</span>
        </div>
      ) : roomTypes.length === 0 ? (
        <div className="bg-white dark:bg-[#121827] border border-dashed border-gray-300 dark:border-gray-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Monitor size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">Chưa có loại phòng chiếu nào</h3>
            <p className="text-xs text-gray-400 mt-1">Bấm nút bên dưới để tạo loại phòng chiếu đầu tiên của bạn.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand-hover transition-all"
          >
            + Thêm Loại Phòng
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {roomTypes.map((item) => {
            const theme = getRoomTypeTheme(item.code);
            return (
              <div
                key={item._id}
                className={`bg-white dark:bg-[#121827] border ${theme.border} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Background decorative gradient */}
                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${theme.gradient} rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none`} />

                <div>
                  {/* Top: Code badge & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${theme.badge}`}
                        >
                          {item.code}
                        </span>
                        {!item.isActive && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">
                            Tạm ẩn
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white mt-2.5">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {item.description || 'Chưa có mô tả kỹ thuật cho loại phòng này.'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/10 transition-all"
                        title="Chỉnh sửa loại phòng & giá"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, item, loading: false })}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Xóa loại phòng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Seat Prices Box */}
                  <div className="mt-5 bg-gray-50/80 dark:bg-[#182032] border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 space-y-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                      <DollarSign size={13} className="text-brand" />
                      <span>Bảng giá vé ghế mặc định</span>
                    </div>

                    <div className={`grid gap-2 text-center ${(() => { const a = item.allowedSeatTypes || ['standard','vip','couple']; return a.length === 3 ? 'grid-cols-3' : a.length === 2 ? 'grid-cols-2' : 'grid-cols-1'; })()}`}>
                      {/* Ghế Thường */}
                      {(item.allowedSeatTypes || ['standard','vip','couple']).includes('standard') && (
                      <div className="bg-white dark:bg-[#121827] border border-gray-200/80 dark:border-gray-700/60 rounded-xl p-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                          <Square size={12} className="text-gray-400" />
                          <span>Thường</span>
                        </div>
                        <div className="mt-1.5 text-xs font-black text-gray-800 dark:text-gray-100">
                          {fmt(item.seatPrices?.standard ?? 0)}
                        </div>
                      </div>
                      )}

                      {/* Ghế VIP */}
                      {(item.allowedSeatTypes || ['standard','vip','couple']).includes('vip') && (
                      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                          <Star size={12} className="text-amber-500" />
                          <span>VIP</span>
                        </div>
                        <div className="mt-1.5 text-xs font-black text-amber-700 dark:text-amber-300">
                          {fmt(item.seatPrices?.vip ?? 0)}
                        </div>
                      </div>
                      )}

                      {/* Ghế Đôi */}
                      {(item.allowedSeatTypes || ['standard','vip','couple']).includes('couple') && (
                      <div className="bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-800/40 rounded-xl p-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-pink-700 dark:text-pink-400">
                          <Heart size={12} className="text-pink-500" />
                          <span>Đôi</span>
                        </div>
                        <div className="mt-1.5 text-xs font-black text-pink-700 dark:text-pink-300">
                          {fmt(item.seatPrices?.couple ?? 0)}
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer updated timestamp */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Trạng thái: <strong className={item.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>{item.isActive ? 'Đang kích hoạt' : 'Tắt'}</strong></span>
                  <span>Cập nhật: {new Date(item.updatedAt || item.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm Mới / Sửa Loại Phòng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingItem ? `Chỉnh sửa: ${editingItem.name}` : 'Thêm Loại Phòng Chiếu Mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Tên loại phòng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="VD: Phòng Chiếu 2D Tiêu Chuẩn, 3D Digital..."
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Mã định danh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="VD: 2D, 3D, IMAX, 4DX..."
                className="w-full uppercase bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-black outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Mô tả trải nghiệm kỹ thuật
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="VD: Màn hình kích thước lớn, hệ thống âm thanh Dolby Atmos 7.1 sống động..."
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
          </div>

          {/* Cấu hình giá 3 loại ghế */}
          <div className="bg-gradient-to-br from-brand/5 via-indigo-50/30 to-purple-50/20 dark:from-brand/10 dark:to-transparent border border-brand/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-brand" />
              <h4 className="font-extrabold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
                Cấu Hình Giá Ghế Mặc Định (VNĐ)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Ghế Thường */}
              <div className={`rounded-xl p-3 space-y-1 border transition-all ${formData.allowedSeatTypes.includes('standard') ? 'bg-white dark:bg-[#121827] border-gray-200 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Square size={13} className="text-gray-400" />
                    <span>Ghế Thường</span>
                  </label>
                  <button type="button" onClick={() => toggleSeatType('standard')} className="text-gray-400 hover:text-brand transition-colors" title={formData.allowedSeatTypes.includes('standard') ? 'Bỏ loại ghế này' : 'Bật loại ghế này'}>
                    {formData.allowedSeatTypes.includes('standard') ? <ToggleRight size={20} className="text-brand" /> : <ToggleLeft size={20} />}
                  </button>
                </div>
                {formData.allowedSeatTypes.includes('standard') ? (
                  <>
                    <div className="flex items-center gap-1">
                      <input type="number" step="1000" min="0" value={formData.seatPrices.standard} onChange={(e) => setFormData((p) => ({ ...p, seatPrices: { ...p.seatPrices, standard: Number(e.target.value) } }))} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-black text-right outline-none focus:border-brand" />
                      <span className="text-xs text-gray-400 font-bold">₫</span>
                    </div>
                    <p className="text-[10px] text-gray-400 text-right font-medium">{fmt(formData.seatPrices.standard)}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-400 italic mt-1">Không cho phép</p>
                )}
              </div>

              {/* Ghế VIP */}
              <div className={`rounded-xl p-3 space-y-1 border transition-all ${formData.allowedSeatTypes.includes('vip') ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40' : 'bg-gray-100 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Star size={13} className="text-amber-500" />
                    <span>Ghế VIP</span>
                  </label>
                  <button type="button" onClick={() => toggleSeatType('vip')} className="text-gray-400 hover:text-amber-500 transition-colors" title={formData.allowedSeatTypes.includes('vip') ? 'Bỏ loại ghế này' : 'Bật loại ghế này'}>
                    {formData.allowedSeatTypes.includes('vip') ? <ToggleRight size={20} className="text-amber-500" /> : <ToggleLeft size={20} />}
                  </button>
                </div>
                {formData.allowedSeatTypes.includes('vip') ? (
                  <>
                    <div className="flex items-center gap-1">
                      <input type="number" step="1000" min="0" value={formData.seatPrices.vip} onChange={(e) => setFormData((p) => ({ ...p, seatPrices: { ...p.seatPrices, vip: Number(e.target.value) } }))} className="w-full bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700 rounded-lg px-2.5 py-1.5 text-xs font-black text-right text-amber-700 dark:text-amber-300 outline-none focus:border-amber-500" />
                      <span className="text-xs text-amber-500 font-bold">₫</span>
                    </div>
                    <p className="text-[10px] text-amber-600/80 text-right font-medium">{fmt(formData.seatPrices.vip)}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-400 italic mt-1">Không cho phép</p>
                )}
              </div>

              {/* Ghế Đôi */}
              <div className={`rounded-xl p-3 space-y-1 border transition-all ${formData.allowedSeatTypes.includes('couple') ? 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/40' : 'bg-gray-100 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-pink-700 dark:text-pink-400 flex items-center gap-1.5">
                    <Heart size={13} className="text-pink-500" />
                    <span>Ghế Đôi (Couple)</span>
                  </label>
                  <button type="button" onClick={() => toggleSeatType('couple')} className="text-gray-400 hover:text-pink-500 transition-colors" title={formData.allowedSeatTypes.includes('couple') ? 'Bỏ loại ghế này' : 'Bật loại ghế này'}>
                    {formData.allowedSeatTypes.includes('couple') ? <ToggleRight size={20} className="text-pink-500" /> : <ToggleLeft size={20} />}
                  </button>
                </div>
                {formData.allowedSeatTypes.includes('couple') ? (
                  <>
                    <div className="flex items-center gap-1">
                      <input type="number" step="1000" min="0" value={formData.seatPrices.couple} onChange={(e) => setFormData((p) => ({ ...p, seatPrices: { ...p.seatPrices, couple: Number(e.target.value) } }))} className="w-full bg-white dark:bg-gray-900 border border-pink-300 dark:border-pink-700 rounded-lg px-2.5 py-1.5 text-xs font-black text-right text-pink-700 dark:text-pink-300 outline-none focus:border-pink-500" />
                      <span className="text-xs text-pink-500 font-bold">₫</span>
                    </div>
                    <p className="text-[10px] text-pink-600/80 text-right font-medium">{fmt(formData.seatPrices.couple)}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-400 italic mt-1">Không cho phép</p>
                )}
              </div>
            </div>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Trạng thái hoạt động
            </label>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isActive ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>{editingItem ? 'Lưu Thay Đổi' : 'Tạo Loại Phòng'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác Nhận Xóa */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => !deleteConfirm.loading && setDeleteConfirm({ isOpen: false, item: null, loading: false })}
        title="Xác nhận xóa loại phòng"
        size="sm"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa loại phòng{' '}
            <strong className="text-gray-900 dark:text-white font-bold">"{deleteConfirm.item?.name}"</strong>?
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
            Lưu ý: Nếu đang có phòng chiếu sử dụng loại phòng này, hệ thống sẽ chặn xóa để đảm bảo toàn vẹn dữ liệu.
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm({ isOpen: false, item: null, loading: false })}
              disabled={deleteConfirm.loading}
              className="px-4 py-2 rounded-xl text-xs font-bold"
            >
              Hủy bỏ
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleteConfirm.loading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all inline-flex items-center gap-2"
            >
              {deleteConfirm.loading && <Loader2 size={13} className="animate-spin" />}
              <span>Xác nhận xóa</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomTypeManager;
