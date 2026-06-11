import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Apple, GlassWater, Popcorn, RefreshCw } from 'lucide-react';
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

  // Form states
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 50000,
    imageUrl: '',
    type: 'food',
    theaterId: '',
  });

  const [error, setError] = useState('');

  const loadInitialOptions = async () => {
    setLoading(true);
    try {
      // 1. Lấy tất cả cụm rạp
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

  // Tải danh sách đồ ăn mỗi khi rạp được chọn thay đổi
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
    });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đồ ăn/nước uống này khỏi thực đơn của rạp không?')) return;
    try {
      await adminService.deleteConcession(id);
      loadConcessions();
      alert('Xóa thành công!');
    } catch (err) {
      alert(err.message);
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
    };

    try {
      if (editingConcession) {
        await adminService.updateConcession(editingConcession._id, payload);
      } else {
        await adminService.createConcession(payload);
      }
      setIsOpen(false);
      setEditingConcession(null);
      alert(editingConcession ? 'Cập nhật thực đơn thành công!' : 'Thêm thực đơn thành công!');
      loadConcessions();
    } catch (err) {
      setError(err.message);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'food':
        return <Popcorn className="text-amber-500" size={16} />;
      case 'drink':
        return <GlassWater className="text-blue-400" size={16} />;
      default:
        return <Apple className="text-pink-400" size={16} />;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-zinc-200">Quản Lý Bỏng Nước & Đồ Ăn</h3>
          <p className="text-xs text-zinc-500 mt-1">Cấu hình danh mục thực đơn dịch vụ kèm theo của từng rạp chiếu.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Lựa chọn rạp để xem thực đơn */}
          <select
            value={selectedTheater}
            onChange={handleTheaterFilterChange}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-semibold py-2 px-3 rounded-xl focus:border-brand outline-none cursor-pointer"
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
          <div className="col-span-full py-12 text-center text-zinc-500 italic border border-dashed border-dark-border rounded-3xl bg-dark-card/20">
            Chưa có đồ ăn/nước uống nào được đăng ký cho rạp này. Hãy thêm món mới!
          </div>
        ) : (
          concessions.map((item) => (
            <div
              key={item._id}
              className="bg-dark-card border border-dark-border p-4 rounded-3xl space-y-4 shadow-sm hover:border-zinc-800 transition-colors relative group flex gap-4 items-center justify-between"
            >
              {/* Hình ảnh & Chi tiết */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-950 shrink-0 border border-dark-border">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 bg-zinc-900 border border-dark-border/40 text-[9px] uppercase tracking-wide font-black text-zinc-400 px-2 py-0.5 rounded-full mb-1">
                    {getIcon(item.type)}
                    <span>{getTypeLabel(item.type)}</span>
                  </span>
                  <h4 className="font-bold text-zinc-200 text-sm truncate">{item.name}</h4>
                  <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                  <span className="text-xs font-black text-brand block mt-1.5">
                    {item.price.toLocaleString()} VND
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute top-3 right-3 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 bg-zinc-900 border border-dark-border hover:border-brand/40 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all"
                  title="Chỉnh sửa"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1.5 bg-zinc-900 border border-dark-border hover:border-red-500/40 text-zinc-400 hover:text-red-400 rounded-lg transition-all"
                  title="Xóa món"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Concession */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingConcession ? "Cập Nhật Thực Đơn" : "Đăng Ký Đồ Ăn & Nước Uống"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Input name="name" label="Tên Món Ăn / Thức Uống" placeholder="Ví dụ: Bắp Ngọt Cỡ Lớn" value={form.name} onChange={handleChange} required />
          <Input name="imageUrl" label="Đường Dẫn Hình Ảnh (URL)" placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={handleChange} required />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Phân Loại Dịch Vụ</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
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
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Cụm Rạp Áp Dụng</label>
            <select
              name="theaterId"
              value={form.theaterId}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
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

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Mô Tả Chi Tiết / Combo Gồm Những Gì</label>
            <textarea
              name="description"
              rows="3"
              placeholder="Ví dụ: 1 Hộp bắp ngọt lớn + 1 Cốc pepsi mát lạnh..."
              value={form.description}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand focus:ring-1 focus:ring-brand text-zinc-100 placeholder-zinc-500 rounded-lg p-3 outline-none transition-all duration-300 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
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
