import React, { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const DEFAULT_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isActive: true,
};

const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 16);
};

const fetchCoupons = () => api.get('/admin/coupons').then((r) => r.data?.data || r.data);
const createCoupon = (data) => api.post('/admin/coupons', data);
const updateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);

export const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Không thể tải danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(DEFAULT_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      maxDiscountAmount: coupon.maxDiscountAmount ?? '',
      minOrderAmount: coupon.minOrderAmount ?? '',
      startDate: toInputDate(coupon.startDate),
      endDate: toInputDate(coupon.endDate),
      usageLimit: coupon.usageLimit ?? '',
      isActive: coupon.isActive ?? true,
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCoupon(null);
    setForm(DEFAULT_FORM);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount !== '' ? Number(form.maxDiscountAmount) : null,
        minOrderAmount: form.minOrderAmount !== '' ? Number(form.minOrderAmount) : 0,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        usageLimit: form.usageLimit !== '' ? Number(form.usageLimit) : null,
        isActive: form.isActive,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, payload);
      } else {
        await createCoupon(payload);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi lưu mã giảm giá.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã ${code} không?`)) return;
    try {
      await deleteCoupon(id);
      load();
    } catch (err) {
      alert('Xóa thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await updateCoupon(coupon._id, { isActive: !coupon.isActive });
      load();
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const statusBadge = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) {
      return <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wide">Vô hiệu</span>;
    }
    if (coupon.endDate && now > new Date(coupon.endDate)) {
      return <span className="px-2 py-0.5 rounded-full bg-red-950/40 text-red-400 text-[10px] font-black uppercase tracking-wide">Hết hạn</span>;
    }
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      return <span className="px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-400 text-[10px] font-black uppercase tracking-wide">Chưa đến ngày</span>;
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return <span className="px-2 py-0.5 rounded-full bg-orange-950/40 text-orange-400 text-[10px] font-black uppercase tracking-wide">Hết lượt</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 text-[10px] font-black uppercase tracking-wide">Hoạt động</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Tag size={20} className="text-brand" />
            Quản lý Mã Giảm Giá
          </h3>
          <p className="text-xs text-gray-500 mt-1">Tạo và quản lý các coupon khuyến mãi cho khách hàng.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-brand hover:border-brand/30 transition-all"
            title="Tải lại"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-2xl text-sm font-black hover:bg-brand/90 transition-all shadow-sm"
          >
            <Plus size={16} /> Tạo mã mới
          </button>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-black text-gray-800 flex items-center gap-2">
                <Tag size={18} className="text-brand" />
                {editingCoupon ? `Chỉnh sửa: ${editingCoupon.code}` : 'Tạo mã giảm giá mới'}
              </h4>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 transition-colors">
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-2xl">
                  {error}
                </div>
              )}

              {/* Code */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">Mã code *</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  placeholder="VD: NOVA20, SUMMER50K"
                  disabled={!!editingCoupon}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-brand disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* Discount type & value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">Loại giảm giá *</label>
                  <select
                    name="discountType"
                    value={form.discountType}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">
                    Giá trị giảm * {form.discountType === 'percentage' ? '(%)' : '(đ)'}
                  </label>
                  <input
                    name="discountValue"
                    type="number"
                    min="0"
                    value={form.discountValue}
                    onChange={handleChange}
                    required
                    placeholder={form.discountType === 'percentage' ? 'VD: 20' : 'VD: 50000'}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Max discount (only for percentage) */}
              {form.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">Giảm tối đa (đ) — để trống nếu không giới hạn</label>
                  <input
                    name="maxDiscountAmount"
                    type="number"
                    min="0"
                    value={form.maxDiscountAmount}
                    onChange={handleChange}
                    placeholder="VD: 50000"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              )}

              {/* Min order amount */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">Giá trị đơn hàng tối thiểu (đ)</label>
                <input
                  name="minOrderAmount"
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  placeholder="VD: 100000"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">Ngày bắt đầu</label>
                  <input
                    name="startDate"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">Ngày hết hạn *</label>
                  <input
                    name="endDate"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Usage limit */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wider">Giới hạn lượt dùng — để trống nếu không giới hạn</label>
                <input
                  name="usageLimit"
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={handleChange}
                  placeholder="VD: 100"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  name="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm font-semibold text-gray-700">Kích hoạt mã ngay khi tạo</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-2xl text-sm font-black hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brand text-white py-2.5 rounded-2xl text-sm font-black hover:bg-brand/90 transition-all disabled:opacity-60"
                >
                  {saving ? 'Đang lưu...' : editingCoupon ? 'Cập nhật' : 'Tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm font-semibold">Đang tải...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Tag size={36} className="text-gray-300" />
            <p className="text-sm font-semibold">Chưa có mã giảm giá nào.</p>
            <button onClick={openCreate} className="text-brand text-xs font-black underline">Tạo mã đầu tiên</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-5 text-xs font-black text-gray-500 uppercase tracking-wider">Mã</th>
                  <th className="text-left py-4 px-4 text-xs font-black text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="text-left py-4 px-4 text-xs font-black text-gray-500 uppercase tracking-wider">Giảm</th>
                  <th className="text-left py-4 px-4 text-xs font-black text-gray-500 uppercase tracking-wider">Đơn tối thiểu</th>
                  <th className="text-left py-4 px-4 text-xs font-black text-gray-500 uppercase tracking-wider">Đã dùng</th>
                  <th className="text-left py-4 px-4 text-xs font-black text-gray-500 uppercase tracking-wider">Hết hạn</th>
                  <th className="text-left py-4 px-4 text-xs font-black text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="bg-gray-100 text-gray-700 font-mono font-black text-xs px-3 py-1.5 rounded-xl tracking-widest">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-xs font-semibold">
                      {coupon.discountType === 'percentage' ? 'Phần trăm' : 'Cố định'}
                    </td>
                    <td className="py-4 px-4 font-black text-brand text-sm">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : `${coupon.discountValue?.toLocaleString('vi-VN')} đ`}
                      {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && (
                        <span className="block text-[10px] font-semibold text-gray-400">
                          tối đa {coupon.maxDiscountAmount.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-500 text-xs font-semibold">
                      {coupon.minOrderAmount ? `${coupon.minOrderAmount.toLocaleString('vi-VN')} đ` : '—'}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold">
                      <span className="text-gray-700">{coupon.usageCount}</span>
                      {coupon.usageLimit !== null && (
                        <span className="text-gray-400"> / {coupon.usageLimit}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-gray-500">
                      {coupon.endDate
                        ? new Date(coupon.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleActive(coupon)}
                        title={coupon.isActive ? 'Nhấp để vô hiệu hóa' : 'Nhấp để kích hoạt'}
                        className="hover:opacity-70 transition-opacity"
                      >
                        {statusBadge(coupon)}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id, coupon.code)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats summary */}
      {!loading && coupons.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng mã', value: coupons.length, color: 'text-gray-700' },
            { label: 'Đang hoạt động', value: coupons.filter(c => c.isActive && (!c.endDate || new Date(c.endDate) > new Date())).length, color: 'text-emerald-600' },
            { label: 'Đã hết hạn', value: coupons.filter(c => c.endDate && new Date(c.endDate) <= new Date()).length, color: 'text-red-500' },
            { label: 'Tổng lượt dùng', value: coupons.reduce((s, c) => s + (c.usageCount || 0), 0), color: 'text-brand' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-semibold">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponManager;
