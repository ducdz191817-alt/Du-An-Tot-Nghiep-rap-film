import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, Home, AlertCircle, RefreshCw, Edit2, Trash2, LayoutGrid, Building2, Power, PowerOff, CheckCircle2, XCircle, MapPin, Phone } from 'lucide-react';
import adminService from '../../services/admin.service';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import SeatMapModal from './SeatMapModal';

export const RoomManager = () => {
  const [theaters, setTheaters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' hoặc 'theaters'
  
  // Trạng thái của các Modal
  const [isThOpen, setIsThOpen] = useState(false);
  const [isRmOpen, setIsRmOpen] = useState(false);
  const [seatMapRoom, setSeatMapRoom] = useState(null);

  // Editing state trackers
  const [editingTheater, setEditingTheater] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  // Forms states
  const [thForm, setThForm] = useState({ name: '', address: '', city: 'Hà Nội', phone: '', isActive: true });
  const [rmForm, setRmForm] = useState({
    name: '',
    theaterId: '',
    type: '2D',
    capacity: 90,
    standardRows: 5,
    vipRows: 3,
    coupleRows: 1,
    seatsPerRow: 10,
  });
  
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [thRes, rmRes, rtRes] = await Promise.all([
        adminService.getTheaters(),
        adminService.getRooms(),
        adminService.getRoomTypes().catch(() => ({ data: [] })),
      ]);
      setTheaters(Array.isArray(thRes) ? thRes : thRes?.data || []);
      setRooms(Array.isArray(rmRes) ? rmRes : rmRes?.data || []);
      
      const rtList = Array.isArray(rtRes) ? rtRes : rtRes?.data || [];
      setRoomTypes(rtList);

      const validTheaters = Array.isArray(thRes) ? thRes : thRes?.data || [];
      if (validTheaters.length > 0 && !rmForm.theaterId) {
        setRmForm((prev) => ({ ...prev, theaterId: validTheaters[0]._id }));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu phòng & rạp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleThChange = (e) => {
    const { name, value } = e.target;
    if (name === 'isActive') {
      setThForm({ ...thForm, isActive: value === 'true' });
    } else {
      setThForm({ ...thForm, [name]: value });
    }
  };

  const handleRmChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      const selectedRt = roomTypes.find((r) => r.code === value);
      const allowed = selectedRt?.allowedSeatTypes || ['standard', 'vip', 'couple'];
      setRmForm((prev) => ({
        ...prev,
        type: value,
        standardRows: allowed.includes('standard') ? prev.standardRows : 0,
        vipRows: allowed.includes('vip') ? prev.vipRows : 0,
        coupleRows: allowed.includes('couple') ? prev.coupleRows : 0,
      }));
    } else {
      setRmForm({ ...rmForm, [name]: value });
    }
  };

  // Open Handlers
  const handleOpenAddTheater = () => {
    setEditingTheater(null);
    setThForm({ name: '', address: '', city: 'Hà Nội', phone: '', isActive: true });
    setError('');
    setIsThOpen(true);
  };

  const handleOpenEditTheater = (th) => {
    setEditingTheater(th);
    setThForm({
      name: th.name,
      address: th.address,
      city: th.city,
      phone: th.phone,
      isActive: th.isActive !== false,
    });
    setError('');
    setIsThOpen(true);
  };

  const handleToggleTheaterStatus = async (th) => {
    const actionStr = th.isActive !== false ? 'VÔ HIỆU HÓA' : 'KÍCH HOẠT';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionStr} cụm rạp "${th.name}" không?\n${th.isActive !== false ? '⚠️ Khách hàng sẽ KHÔNG THỂ đặt vé tại rạp này nữa!' : '✅ Khách hàng có thể tiếp tục đặt vé tại rạp này.'}`)) return;
    try {
      await adminService.toggleTheaterStatus(th._id);
      loadData();
    } catch (err) {
      alert(err.message || 'Lỗi khi thay đổi trạng thái rạp');
    }
  };

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRmForm({
      name: '',
      theaterId: theaters[0]?._id || '',
      type: '2D',
      capacity: 90,
      standardRows: 5,
      vipRows: 3,
      coupleRows: 1,
      seatsPerRow: 10,
    });
    setError('');
    setIsRmOpen(true);
  };

  const handleOpenEditRoom = (rm) => {
    setEditingRoom(rm);
    setRmForm({
      name: rm.name,
      theaterId: rm.theater?._id || rm.theater,
      type: rm.type,
      capacity: rm.capacity,
      standardRows: 0,
      vipRows: 0,
      coupleRows: 0,
      seatsPerRow: 0,
    });
    setError('');
    setIsRmOpen(true);
  };

  // Submit Handlers
  const handleTheaterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTheater) {
        await adminService.updateTheater(editingTheater._id, thForm);
      } else {
        await adminService.createTheater(thForm);
      }
      setIsThOpen(false);
      setThForm({ name: '', address: '', city: 'Hà Nội', phone: '', isActive: true });
      setEditingTheater(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (editingRoom) {
        await adminService.updateRoom(editingRoom._id, {
          name: rmForm.name,
          type: rmForm.type,
          theaterId: rmForm.theaterId,
        });
      } else {
        const capacitySum =
          (parseInt(rmForm.standardRows) + parseInt(rmForm.vipRows)) * parseInt(rmForm.seatsPerRow) +
          parseInt(rmForm.coupleRows) * Math.floor(parseInt(rmForm.seatsPerRow) / 2);

        const payload = {
          ...rmForm,
          capacity: capacitySum,
          standardRows: parseInt(rmForm.standardRows),
          vipRows: parseInt(rmForm.vipRows),
          coupleRows: parseInt(rmForm.coupleRows),
          seatsPerRow: parseInt(rmForm.seatsPerRow),
        };
        await adminService.createRoom(payload);
      }
      setIsRmOpen(false);
      setRmForm({
        name: '',
        theaterId: theaters[0]?._id || '',
        type: '2D',
        capacity: 90,
        standardRows: 5,
        vipRows: 3,
        coupleRows: 1,
        seatsPerRow: 10,
      });
      setEditingRoom(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete Handlers
  const handleDeleteTheater = async (id) => {
    if (!window.confirm('CẢNH BÁO: Xóa cụm rạp này sẽ đồng thời xóa toàn bộ các phòng chiếu, danh sách ghế, lịch chiếu và các giao dịch đặt vé liên quan! Bạn có chắc chắn muốn xóa không?')) return;
    try {
      await adminService.deleteTheater(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('CẢNH BÁO: Xóa phòng chiếu này sẽ đồng thời xóa toàn bộ danh sách ghế, lịch chiếu và các giao dịch đặt vé liên quan! Bạn có chắc chắn muốn xóa không?')) return;
    try {
      await adminService.deleteRoom(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800">Quản Lý Rạp & Phòng Chiếu</h3>
          <p className="text-xs text-gray-500 mt-1">Cấu hình các rạp chiếu, trạng thái hoạt động, phòng chiếu và sơ đồ ghế.</p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'rooms'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <DoorOpen size={14} />
              <span>Phòng Chiếu ({rooms.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('theaters')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'theaters'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Building2 size={14} />
              <span>Cụm Rạp Chiếu ({theaters.length})</span>
            </button>
          </div>

          {activeTab === 'rooms' ? (
            <Button onClick={handleOpenAddRoom} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
              Thêm Phòng Chiếu
            </Button>
          ) : (
            <Button onClick={handleOpenAddTheater} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
              Thêm Cụm Rạp
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: Danh sách Phòng chiếu */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {rooms.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 italic border border-dashed border-gray-200 rounded-3xl bg-white">
              Chưa có phòng chiếu nào được đăng ký. Hãy thêm phòng chiếu ở trên!
            </div>
          ) : (
            rooms.map((rm) => {
              const belongsToTheater = theaters.find((t) => (t._id === rm.theater?._id || t._id === rm.theater));
              const isThInactive = belongsToTheater?.isActive === false;

              return (
                <div key={rm._id} className={`bg-white border p-5 rounded-3xl space-y-3 shadow-sm transition-colors relative group ${isThInactive ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start justify-between pr-12">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <DoorOpen size={16} className="text-brand" /> {rm.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">{rm.theater?.name || belongsToTheater?.name || 'Không xác định'}</span>
                        {isThInactive && (
                          <span className="px-1.5 py-0.2 bg-red-50 text-red-600 border border-red-200 rounded text-[9px] font-bold">Rạp vô hiệu hóa</span>
                        )}
                      </div>
                    </div>
                    <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-gray-500 shrink-0">
                      {rm.type}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 border-t border-gray-200/80 pt-2 flex justify-between items-center">
                    <span>Sơ đồ sức chứa</span>
                    <span className="text-gray-700">{rm.capacity} Ghế đã tạo</span>
                  </div>

                  <button
                    onClick={() => setSeatMapRoom(rm)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-brand/30 text-brand bg-brand/5 hover:bg-brand/10 hover:border-brand/50 transition-all"
                  >
                    <LayoutGrid size={13} />
                    Quản lý sơ đồ ghế
                  </button>

                  {/* Floating Action Controls */}
                  <div className="absolute top-2 right-4 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditRoom(rm)}
                      className="p-1.5 bg-gray-50 border border-gray-200 hover:border-brand/40 text-gray-500 hover:text-gray-700 rounded-lg transition-all"
                      title="Sửa phòng chiếu"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(rm._id)}
                      className="p-1.5 bg-gray-50 border border-gray-200 hover:border-red-500/40 text-gray-500 hover:text-red-500 rounded-lg transition-all"
                      title="Xóa phòng chiếu"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Danh sách Cụm rạp chiếu */}
      {activeTab === 'theaters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {theaters.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 italic border border-dashed border-gray-200 rounded-3xl bg-white">
              Chưa có cụm rạp nào được đăng ký. Hãy bấm "Thêm Cụm Rạp" ở trên!
            </div>
          ) : (
            theaters.map((th) => {
              const isActive = th.isActive !== false;
              const roomCount = rooms.filter((r) => (r.theater?._id || r.theater) === th._id).length;

              return (
                <div key={th._id} className={`bg-white border rounded-3xl p-5 space-y-4 shadow-sm transition-all relative group ${isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/10'}`}>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                        <Building2 size={18} className={isActive ? 'text-brand' : 'text-gray-400'} />
                        <span>{th.name}</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Đang hoạt động (Active)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={12} /> Vô hiệu hóa (Inactive)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTheater(th)}
                        className="p-1.5 text-gray-500 hover:text-brand hover:bg-gray-100 rounded-lg transition-colors"
                        title="Chỉnh sửa rạp"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteTheater(th._id)}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa cụm rạp"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Address & Info */}
                  <div className="space-y-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>{th.address}, {th.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400 shrink-0" />
                      <span>{th.phone || 'Chưa cập nhật SĐT'}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60 font-semibold text-gray-700">
                      <DoorOpen size={14} className="text-brand shrink-0" />
                      <span>{roomCount} Phòng chiếu trực thuộc</span>
                    </div>
                  </div>

                  {/* Bottom Toggle Button */}
                  <div>
                    {isActive ? (
                      <button
                        onClick={() => handleToggleTheaterStatus(th)}
                        className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-xs"
                      >
                        <PowerOff size={14} />
                        <span>Vô hiệu hóa rạp (Không cho đặt vé)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleTheaterStatus(th)}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Power size={14} />
                        <span>Kích hoạt rạp hoạt động trở lại</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Thêm / Sửa Cụm Rạp */}
      <Modal isOpen={isThOpen} onClose={() => setIsThOpen(false)} title={editingTheater ? "Chỉnh Sửa Cụm Rạp" : "Thêm Cụm Rạp Mới"}>
        <form onSubmit={handleTheaterSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Input name="name" label="Tên Cụm Rạp" placeholder="Nova Cinema Hà Nội" value={thForm.name} onChange={handleThChange} required />
          <Input name="address" label="Địa Chỉ Rạp" placeholder="123 Đường Láng, Q. Đống Đa" value={thForm.address} onChange={handleThChange} required />
          
          <div className="grid grid-cols-2 gap-4">
            <Input name="city" label="Thành Phố" placeholder="Hà Nội" value={thForm.city} onChange={handleThChange} required />
            <Input name="phone" label="Số Điện Thoại Liên Hệ" placeholder="0988776655" value={thForm.phone} onChange={handleThChange} required />
          </div>

          {/* Trạng thái hoạt động của rạp */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Trạng Thái Hoạt Động</label>
            <select
              name="isActive"
              value={thForm.isActive ? 'true' : 'false'}
              onChange={handleThChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer font-bold"
            >
              <option value="true">🟢 Đang Hoạt Động (Active)</option>
              <option value="false">🔴 Vô Hiệu Hóa (Inactive - Tạm ngưng đặt vé)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button onClick={() => setIsThOpen(false)} variant="secondary" className="px-5 py-2">
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="px-6 py-2">
              {editingTheater ? "Lưu thay đổi" : "Tạo Cụm Rạp"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Hall Modal */}
      <Modal isOpen={isRmOpen} onClose={() => setIsRmOpen(false)} title={editingRoom ? "Chỉnh Sửa Phòng Chiếu" : "Đăng Ký Phòng Chiếu & Tạo Sơ Đồ Ghế"} size="lg">
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input name="name" label="Tên Phòng Chiếu" placeholder="Phòng 1 (IMAX)" value={rmForm.name} onChange={handleRmChange} required />
            
            {/* Lựa chọn Cụm rạp */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Cụm Rạp</label>
              <select
                name="theaterId"
                value={rmForm.theaterId}
                onChange={handleRmChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
                required
                disabled={!!editingRoom}
              >
                {theaters.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} {t.isActive === false ? '(Tạm ngưng)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Định dạng chiếu */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Định Dạng Chiếu</label>
              <select
                name="type"
                value={rmForm.type}
                onChange={handleRmChange}
                disabled={!!editingRoom}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {roomTypes.length > 0 ? (
                  roomTypes.map((rt) => (
                    <option key={rt._id} value={rt.code}>
                      {rt.name} ({rt.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="2D">Phòng 2D Tiêu Chuẩn</option>
                    <option value="3D">Phòng 3D Digital</option>
                    <option value="IMAX">Phòng IMAX Laser</option>
                    <option value="GOLDCLASS">Phòng Gold Class</option>
                  </>
                )}
              </select>
            </div>

            {!editingRoom && (
              <Input name="seatsPerRow" type="number" label="Số ghế mỗi hàng" placeholder="10" value={rmForm.seatsPerRow} onChange={handleRmChange} required />
            )}
          </div>

          {/* Seat price preview for selected room type */}
          {(() => {
            const selectedRt = roomTypes.find((r) => r.code === rmForm.type);
            const allowed = selectedRt?.allowedSeatTypes || ['standard', 'vip', 'couple'];
            if (selectedRt?.seatPrices) {
              const fmtVnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';
              return (
                <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 text-xs flex items-center justify-between text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-brand">Giá ghế theo loại phòng:</span>
                  <div className="flex items-center gap-3 font-semibold text-[11px]">
                    {allowed.includes('standard') && <span>Thường: <strong className="text-gray-900 dark:text-white">{fmtVnd(selectedRt.seatPrices.standard)}</strong></span>}
                    {allowed.includes('vip') && <span>VIP: <strong className="text-amber-600 dark:text-amber-400">{fmtVnd(selectedRt.seatPrices.vip)}</strong></span>}
                    {allowed.includes('couple') && <span>Đôi: <strong className="text-pink-600 dark:text-pink-400">{fmtVnd(selectedRt.seatPrices.couple)}</strong></span>}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {!editingRoom ? (
            <>
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                {(() => {
                  const selectedRt = roomTypes.find((r) => r.code === rmForm.type);
                  const allowed = selectedRt?.allowedSeatTypes || ['standard', 'vip', 'couple'];
                  return (
                    <>
                      {allowed.includes('standard') && (
                        <Input name="standardRows" type="number" label="Hàng ghế thường" placeholder="5" value={rmForm.standardRows} onChange={handleRmChange} required />
                      )}
                      {allowed.includes('vip') && (
                        <Input name="vipRows" type="number" label="Hàng ghế VIP" placeholder="3" value={rmForm.vipRows} onChange={handleRmChange} required />
                      )}
                      {allowed.includes('couple') && (
                        <Input name="coupleRows" type="number" label="Hàng ghế đôi" placeholder="1" value={rmForm.coupleRows} onChange={handleRmChange} required />
                      )}
                    </>
                  );
                })()}
              </div>

              <p className="text-[10px] text-gray-500 font-bold bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin text-brand shrink-0" />
                <span>Sơ đồ ghế sẽ được tạo tự động trong cơ sở dữ liệu dựa theo các chữ cái hàng (A-Z) và cấu hình giá tương ứng.</span>
              </p>
            </>
          ) : (
            <p className="text-[11px] text-amber-600 font-bold bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>Cấu hình sơ đồ và sức chứa ghế bị khóa trong chế độ chỉnh sửa. Để thay đổi cấu trúc sơ đồ ghế, vui lòng tạo mới phòng chiếu.</span>
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button onClick={() => setIsRmOpen(false)} variant="secondary" className="px-5 py-2">
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="px-6 py-2">
              {editingRoom ? "Lưu" : "Lưu & Tạo sơ đồ ghế"}
            </Button>
          </div>
        </form>
      </Modal>

      <SeatMapModal
        isOpen={!!seatMapRoom}
        onClose={() => {
          setSeatMapRoom(null);
          loadData();
        }}
        room={seatMapRoom}
        roomTypes={roomTypes}
      />
    </div>
  );
};

export default RoomManager;