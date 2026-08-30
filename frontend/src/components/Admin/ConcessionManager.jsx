import React, { useState, useEffect } from 'react';
import { Plus, Edit2, AlertCircle, Apple, GlassWater, Popcorn, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import adminService from '../../services/admin.service';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';

export const ConcessionManager = () => {
  const [theaters, setTheaters] = useState([]);
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheater, setSelectedTheater] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingConcession, setEditingConcession] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 50000,
    imageUrl: '',
    type: 'food',
    theaterId: '',
    active: true,
  });

  const [error, setError] = useState('');

  const loadInitialOptions = async () => {
    setLoading(true);
    try {
      const thRes = await adminService.getTheaters();
      setTheaters(thRes);
      if (thRes.length > 0) {
        setSelectedTheater(thRes[0]._id);
        setForm((prev) => ({ ...prev, theaterId: thRes[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialOptions();
  }, []);

  const loadConcessions = async () => {
    if (!selectedTheater) return;
    try {
      const conRes = await adminService.getConcessions(selectedTheater);
      setConcessions(conRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConcessions();
  }, [selectedTheater]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleTheaterFilterChange = (e) => {
    const thId = e.target.value;
    setSelectedTheater(thId);
    setForm((prev) => ({ ...prev, theaterId: thId }));
  };

  const handleOpenAdd = () => {
    setEditingConcession(null);
    setError('');
    setForm({
      name: '',
      description: '',
      price: 50000,
      imageUrl: '',
      type: 'food',
      theaterId: selectedTheater,
      active: true,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingConcession(item);
    setError('');
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      type: item.type,
      theaterId: item.theater?._id || item.theater,
      active: item.active !== false,
    });
    setIsOpen(true);
  };

  // Xử lý chuyển đổi trạng thái kinh doanh (Bật / Tắt bán)
  const handleToggleStatus = async (item) => {
    setTogglingId(item._id);
    try {
      await adminService.toggleConcessionStatus(item._id);
      await loadConcessions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi chuyển trạng thái món!');
    } finally {
      setTogglingId(null);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const priceNum = parseInt(form.price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Vui lòng nhập giá trị lớn hơn 0');
      return;
    }

    if (!form.theaterId) {
      setError('Vui lòng chọn cụm rạp quản lý đồ ăn này');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: priceNum,
      imageUrl: form.imageUrl,
      type: form.type,
      theater: form.theaterId,
      active: form.active,
    };

    try {
      if (editingConcession) {
        await adminService.updateConcession(editingConcession._id, payload);
      } else {
        await adminService.createConcession(payload);
      }
      setIsOpen(false);
      setEditingConcession(null);
      loadConcessions();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'food':
        return <Popcorn className="text-amber-500" size={15} />;
      case 'drink':
        return <GlassWater className="text-blue-400" size={15} />;
      default:
        return <Apple className="text-pink-400" size={15} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'food':
        return 'Đồ Ăn';
      case 'drink':
        return 'Nước Uống';
      default:
        return 'Combo';
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800">Quản Lý Bỏng Nước & Đồ Ăn</h3>
          <p className="text-xs text-gray-500 mt-1">Cấu hình thực đơn dịch vụ. Bảo toàn toàn vẹn lịch sử đơn hàng & báo cáo tài chính.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Lựa chọn rạp để xem thực đơn */}
          <select
            value={selectedTheater}
            onChange={handleTheaterFilterChange}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold py-2 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
          >
            {theaters.map((th) => (
              <option key={th._id} value={th._id}>
                {th.name}
              </option>
            ))}
          </select>

          <Button onClick={handleOpenAdd} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
            Thêm Bỏng Nước
          </Button>
        </div>
      </div>

      {/* Grid danh sách đồ ăn uống của rạp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {concessions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 italic border border-dashed border-gray-200 rounded-3xl bg-white">
            Chưa có đồ ăn/nước uống nào được đăng ký cho rạp này. Hãy thêm món mới!
          </div>
        ) : (
          concessions.map((item) => {
            const isActive = item.active !== false;
            return (
              <div
                key={item._id}
                className={`bg-white border rounded-3xl p-4 shadow-sm transition-all relative flex flex-col justify-between ${
                  isActive ? 'border-gray-200 hover:border-gray-300' : 'border-red-200 bg-red-50/20 opacity-80'
                }`}
              >
                {/* Header card: Phân loại + Trạng thái */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-[10px] uppercase tracking-wide font-black text-gray-600 px-2 py-0.5 rounded-full">
                    {getIcon(item.type)}
                    <span>{getTypeLabel(item.type)}</span>
                  </span>

                  {/* Badge trạng thái */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {isActive ? 'Đang kinh doanh' : 'Tạm ngừng bán'}
                  </span>
                </div>

                {/* Thông tin món */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover ${!isActive ? 'grayscale' : ''}`}
                    />
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white uppercase tracking-wider bg-red-600 px-1.5 py-0.5 rounded">
                          Tạm Ẩn
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                    <span className="text-xs font-black text-brand block mt-1.5">
                      {item.price.toLocaleString()} VND
                    </span>
                  </div>
                </div>

                {/* Thanh điều khiển */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    disabled={togglingId === item._id}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                    title={isActive ? 'Bấm để Tạm ngừng kinh doanh món này' : 'Bấm để Mở bán lại món này'}
                  >
                    {isActive ? (
                      <>
                        <EyeOff size={13} className="text-gray-500" />
                        <span>Tạm ngừng bán</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} className="text-emerald-600" />
                        <span>Mở bán lại</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:border-brand/40 text-gray-700 hover:text-gray-900 font-bold text-xs rounded-xl transition-all shadow-xs"
                    title="Chỉnh sửa thông tin món"
                  >
                    <Edit2 size={13} />
                    <span>Sửa</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Concession */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingConcession ? "Cập Nhật Thực Đơn" : "Đăng Ký Đồ Ăn & Nước Uống"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2 font-medium">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Input name="name" label="Tên Món Ăn / Thức Uống" placeholder="Ví dụ: Bắp Ngọt Cỡ Lớn" value={form.name} onChange={handleChange} required />
          <Input name="imageUrl" label="Đường Dẫn Hình Ảnh (URL)" placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={handleChange} required />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Phân Loại Dịch Vụ</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer font-medium text-sm"
              >
                <option value="food">Đồ Ăn (Bắp/Kẹo...)</option>
                <option value="drink">Nước Uống (Pepsi/Nước khoáng...)</option>
                <option value="combo">Combo Tiết Kiệm (Bắp kèm Nước)</option>
              </select>
            </div>

            <Input
              name="price"
              type="number"
              label="Giá Bán (VNĐ)"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Cụm Rạp Áp Dụng</label>
            <select
              name="theaterId"
              value={form.theaterId}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer font-medium text-sm"
              required
              disabled={!!editingConcession}
            >
              {theaters.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            name="description"
            type="textarea"
            label="Mô Tả Chi Tiết / Combo Gồm Những Gì"
            rows={3}
            placeholder="Ví dụ: 1 Hộp bắp ngọt lớn + 1 Cốc pepsi mát lạnh..."
            value={form.description}
            onChange={handleChange}
            required
          />

          {/* Switch Trạng thái kinh doanh */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div>
              <div className="text-xs font-bold text-gray-800">Trạng Thái Kinh Doanh</div>
              <div className="text-[11px] text-gray-500">Món sẽ hiển thị cho khách đặt vé khi được bật</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button onClick={() => setIsOpen(false)} variant="secondary" className="px-5 py-2">
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="px-6 py-2">
              {editingConcession ? "Lưu Thay Đổi" : "Thêm Vào Thực Đơn"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ConcessionManager;
