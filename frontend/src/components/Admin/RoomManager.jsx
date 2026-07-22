import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, Home, AlertCircle, RefreshCw, Edit2, Trash2, LayoutGrid } from 'lucide-react';
import adminService from '../../services/admin.service';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import SeatMapModal from './SeatMapModal';

export const RoomManager = () => {
  const [theaters, setTheaters] = useState([]);
  const [rooms, setRooms] = useState([]);
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
  const [thForm, setThForm] = useState({ name: '', address: '', city: 'Hà Nội', phone: '' });
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
      const thRes = await adminService.getTheaters();
      setTheaters(thRes);
      
      const rmRes = await adminService.getRooms();
      setRooms(rmRes);

      if (thRes.length > 0 && !rmForm.theaterId) {
        setRmForm((prev) => ({ ...prev, theaterId: thRes[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleThChange = (e) => setThForm({ ...thForm, [e.target.name]: e.target.value });
  const handleRmChange = (e) => setRmForm({ ...rmForm, [e.target.name]: e.target.value });

  // Open Handlers
  const handleOpenAddTheater = () => {
    setEditingTheater(null);
    setThForm({ name: '', address: '', city: 'Hà Nội', phone: '' });
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
    });
    setError('');
    setIsThOpen(true);
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
      setThForm({ name: '', address: '', city: 'Hà Nội', phone: '' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800">Quản Lý Phòng Chiếu</h3>
          <p className="text-xs text-gray-500 mt-1">Cấu hình các phòng chiếu và tạo sơ đồ ghế ngồi vật lý.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleOpenAddRoom} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
            Thêm Phòng Chiếu
          </Button>
        </div>
      </div>

      {/* Danh sách lưới Phòng chiếu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rooms.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 italic border border-dashed border-gray-200 rounded-3xl bg-white">
            Chưa có phòng chiếu nào được đăng ký. Hãy thêm phòng chiếu ở trên!
          </div>
        ) : (
          rooms.map((rm) => (
            <div key={rm._id} className="bg-white border border-gray-200 p-5 rounded-3xl space-y-3 shadow-sm hover:border-gray-300 transition-colors relative group">
              <div className="flex items-start justify-between pr-12">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <DoorOpen size={16} className="text-brand" /> {rm.name}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">{rm.theater?.name || 'Không xác định'}</span>
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
          ))
        )}
      </div>

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
                    {t.name}
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
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer"
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
                <option value="GOLDCLASS">GOLDCLASS</option>
              </select>
            </div>

            {!editingRoom && (
              <Input name="seatsPerRow" type="number" label="Số ghế mỗi hàng" placeholder="10" value={rmForm.seatsPerRow} onChange={handleRmChange} required />
            )}
          </div>

          {!editingRoom ? (
            <>
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                <Input name="standardRows" type="number" label="Hàng ghế thường" placeholder="5" value={rmForm.standardRows} onChange={handleRmChange} required />
                <Input name="vipRows" type="number" label="Hàng ghế VIP" placeholder="3" value={rmForm.vipRows} onChange={handleRmChange} required />
                <Input name="coupleRows" type="number" label="Hàng ghế đôi" placeholder="1" value={rmForm.coupleRows} onChange={handleRmChange} required />
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
      />
    </div>
  );
};

export default RoomManager;