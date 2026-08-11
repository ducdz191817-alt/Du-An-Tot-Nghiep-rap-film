import React, { useState, useEffect } from 'react';
import {
  Users, Search, RefreshCw, AlertCircle, X,
  ShieldCheck, UserCheck, Calendar, Phone, Mail, Info, Crown,
  Lock, Unlock, CheckCircle2, Ticket, BadgeCheck, UserCog
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';

export const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Confirm modal state: { id, username, currentStatus }
  const [confirmLock, setConfirmLock] = useState(null);
  const [confirmRole, setConfirmRole] = useState(null); // { id, username, newRole }
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const currentUserId = currentUser._id || currentUser.id;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setUsers(list);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Không thể tải danh sách người dùng.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleToggleLockUser = async () => {
    if (!confirmLock) return;
    setActionLoading(true);
    try {
      const isLocking = confirmLock.currentStatus !== 'locked';
      const res = await adminService.toggleUserStatus(confirmLock.id);
      showMessage(
        res.message || `Đã ${isLocking ? 'khóa' : 'mở khóa'} tài khoản "${confirmLock.username}" thành công và lưu vào CSDL!`,
        'success'
      );
      setConfirmLock(null);
      fetchUsers();
    } catch (err) {
      showMessage(err.message || 'Lỗi khi thay đổi trạng thái tài khoản.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!confirmRole) return;
    setActionLoading(true);
    try {
      const res = await adminService.updateUserRole(confirmRole.id, confirmRole.newRole);
      const roleText =
        confirmRole.newRole === 'admin'
          ? 'Quản trị viên'
          : confirmRole.newRole === 'staff'
          ? 'Nhân viên quản lý vé'
          : 'Khách hàng';

      showMessage(
        res.message || `Đã cập nhật vai trò "${confirmRole.username}" thành ${roleText} và đã lưu trạng thái!`,
        'success'
      );
      setConfirmRole(null);
      fetchUsers();
    } catch (err) {
      showMessage(err.message || 'Lỗi khi cập nhật vai trò.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'locked' && u.status === 'locked') ||
      (filterStatus === 'active' && u.status !== 'locked');
    return matchSearch && matchRole && matchStatus;
  });

  const roleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
          <Crown size={10} /> Quản trị viên
        </span>
      );
    }
    if (role === 'staff') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
          <Ticket size={10} /> Nhân viên quản lý vé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
        <UserCheck size={10} /> Khách hàng
      </span>
    );
  };

  const statusBadge = (status) => {
    if (status === 'locked') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-200">
          <Lock size={10} /> Đã khóa
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={10} /> Hoạt động
      </span>
    );
  };

  // Avatar initials
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const avatarColor = (name = '') => {
    const colors = [
      'bg-brand/10 text-brand',
      'bg-emerald-50 text-emerald-700',
      'bg-purple-50 text-purple-700',
      'bg-blue-50 text-blue-700',
      'bg-amber-50 text-amber-700',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <UserCog className="text-brand" size={22} /> Quản lý Người dùng & Nhân viên
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Phân quyền (Quản trị viên, Nhân viên quản lý vé, Khách hàng) và lưu lại trạng thái hoạt động / bị khóa vào CSDL.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Toast */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-brand/10 border-brand/20 text-brand'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={18} />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Tổng tài khoản', value: users.length, color: 'text-gray-800' },
          { label: 'Khách hàng', value: users.filter((u) => u.role === 'user' || !u.role).length, color: 'text-blue-600' },
          { label: 'Nhân viên vé', value: users.filter((u) => u.role === 'staff').length, color: 'text-purple-600' },
          { label: 'Quản trị viên', value: users.filter((u) => u.role === 'admin').length, color: 'text-amber-600' },
          { label: 'Đã bị khóa', value: users.filter((u) => u.status === 'locked').length, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo Tên, Email hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand/40 transition-colors"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full md:w-48 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand/40 cursor-pointer"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="user">Khách hàng</option>
          <option value="staff">Nhân viên quản lý vé</option>
          <option value="admin">Quản trị viên</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-44 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand/40 cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã bị khóa</option>
        </select>
      </div>

      {/* User List */}
      {loading && users.length === 0 ? (
        <Loading />
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl space-y-4 shadow-sm">
          <Users size={48} className="text-gray-300 mx-auto" />
          <p className="text-gray-400 font-semibold text-xs">Không tìm thấy tài khoản nào phù hợp.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider bg-gray-50">
                  <th className="py-4 pl-6">Người dùng</th>
                  <th className="py-4">Liên hệ</th>
                  <th className="py-4">Vai trò</th>
                  <th className="py-4">Trạng thái</th>
                  <th className="py-4">Ngày đăng ký</th>
                  <th className="py-4 pr-6 text-center">Phân quyền & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {filteredUsers.map((user) => {
                  const createdDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';

                  const isSelf = user._id === currentUserId;

                  return (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      {/* Avatar + Name */}
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 border border-gray-100 ${avatarColor(user.username)}`}
                          >
                            {getInitials(user.username)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 flex items-center gap-1.5">
                              {user.username}
                              {user.role === 'admin' && (
                                <Crown size={11} className="text-amber-400 shrink-0" />
                              )}
                              {user.role === 'staff' && (
                                <Ticket size={11} className="text-purple-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">{user._id?.slice(-8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Mail size={11} className="text-brand shrink-0" />
                            <span className="truncate max-w-[200px]" title={user.email}>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Phone size={11} />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4">{roleBadge(user.role)}</td>

                      {/* Status */}
                      <td className="py-4">{statusBadge(user.status)}</td>

                      {/* Join date */}
                      <td className="py-4">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar size={11} />
                          <span>{createdDate}</span>
                        </div>
                      </td>

                      {/* Actions: Role Selector & Lock Toggle */}
                      <td className="py-4 pr-6">
                        <div className="flex items-center justify-center gap-3">
                          {/* Selector Phân Quyền */}
                          {isSelf ? (
                            <span className="text-[11px] text-gray-400 font-bold bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                              Tài khoản của bạn
                            </span>
                          ) : (
                            <select
                              value={user.role || 'user'}
                              onChange={(e) =>
                                setConfirmRole({
                                  id: user._id,
                                  username: user.username,
                                  currentRole: user.role || 'user',
                                  newRole: e.target.value,
                                })
                              }
                              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <option value="user">👤 Khách hàng</option>
                              <option value="staff">🎟️ Nhân viên vé</option>
                              <option value="admin">👑 Quản trị viên</option>
                            </select>
                          )}

                          {/* Lock / Unlock Button */}
                          {isSelf ? (
                            <span
                              title="Tài khoản của bạn (Không thể tự khóa)"
                              className="p-2 bg-gray-100 border border-gray-200 text-gray-300 rounded-xl cursor-not-allowed inline-flex items-center justify-center opacity-40"
                            >
                              <Lock size={14} />
                            </span>
                          ) : user.status === 'locked' ? (
                            <button
                              onClick={() => setConfirmLock({ id: user._id, username: user.username, currentStatus: 'locked' })}
                              title="Mở khóa tài khoản"
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                            >
                              <Unlock size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmLock({ id: user._id, username: user.username, currentStatus: 'active' })}
                              title="Khóa tài khoản (Vô hiệu hóa)"
                              className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                            >
                              <Lock size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Lock / Unlock Modal */}
      {confirmLock && (
        <ConfirmModal
          icon={
            confirmLock.currentStatus === 'locked' ? (
              <Unlock size={24} className="text-emerald-600" />
            ) : (
              <Lock size={24} className="text-red-600" />
            )
          }
          iconBg={
            confirmLock.currentStatus === 'locked'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }
          title={
            confirmLock.currentStatus === 'locked'
              ? 'Xác nhận mở khóa tài khoản?'
              : 'Xác nhận khóa tài khoản?'
          }
          description={
            confirmLock.currentStatus === 'locked' ? (
              <>
                Mở khóa tài khoản{' '}
                <span className="font-mono text-emerald-700 font-bold">@{confirmLock.username}</span>? Trạng thái "active" sẽ được lưu trực tiếp vào CSDL.
              </>
            ) : (
              <>
                Khóa tài khoản{' '}
                <span className="font-mono text-red-600 font-bold">@{confirmLock.username}</span>? Trạng thái "locked" sẽ được lưu vào CSDL (ngăn đăng nhập & đặt vé).
              </>
            )
          }
          note={
            confirmLock.currentStatus === 'locked'
              ? 'Tài khoản được mở khóa sẽ khôi phục đầy đủ quyền đăng nhập hệ thống.'
              : 'Tài khoản bị khóa sẽ không thể truy cập hệ thống. Toàn bộ lịch sử giao dịch được giữ nguyên.'
          }
          onCancel={() => setConfirmLock(null)}
          onConfirm={handleToggleLockUser}
          loading={actionLoading}
          confirmLabel={confirmLock.currentStatus === 'locked' ? 'Mở khóa tài khoản' : 'Xác nhận khóa'}
          confirmClass={
            confirmLock.currentStatus === 'locked'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_14px_rgba(16,185,129,0.3)]'
              : 'bg-red-600 hover:bg-red-700 shadow-[0_4px_14px_rgba(239,68,68,0.3)]'
          }
        />
      )}

      {/* Confirm Role Change Modal */}
      {confirmRole && (
        <ConfirmModal
          icon={<ShieldCheck size={24} className="text-amber-500" />}
          iconBg="bg-amber-500/10 border-amber-500/20"
          title="Xác nhận thay đổi phân quyền?"
          description={
            <>
              Bạn có chắc chắn muốn thay đổi phân quyền của{' '}
              <span className="font-mono text-brand font-bold">@{confirmRole.username}</span> sang{' '}
              <span className="font-bold text-amber-600">
                {confirmRole.newRole === 'admin'
                  ? 'Quản trị viên (Admin)'
                  : confirmRole.newRole === 'staff'
                  ? 'Nhân viên quản lý vé (Staff)'
                  : 'Khách hàng (User)'}
              </span>?
            </>
          }
          note="Trạng thái phân quyền mới sẽ được lưu trực tiếp vào cơ sở dữ liệu MongoDB."
          onCancel={() => setConfirmRole(null)}
          onConfirm={handleUpdateRole}
          loading={actionLoading}
          confirmLabel="Lưu phân quyền mới"
          confirmClass="bg-brand hover:bg-brand/90 shadow-[0_4px_14px_rgba(229,9,20,0.3)]"
        />
      )}
    </div>
  );
};

// Reusable confirm modal
const ConfirmModal = ({ icon, iconBg, title, description, note, onCancel, onConfirm, loading, confirmLabel, confirmClass }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="space-y-2">
          <h4 className="font-black text-gray-900 text-base">{title}</h4>
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl flex items-start gap-2 mt-2">
            <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-gray-500 leading-normal">{note}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          disabled={loading}
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          disabled={loading}
          onClick={onConfirm}
          className={`px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer ${
            confirmClass || 'bg-brand hover:bg-brand-hover shadow-[0_4px_14px_rgba(229,9,20,0.3)]'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin" /> Đang xử lý...
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </div>
  </div>
);

export default UserManager;
