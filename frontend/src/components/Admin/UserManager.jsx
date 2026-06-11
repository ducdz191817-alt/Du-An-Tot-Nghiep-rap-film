import React, { useState, useEffect } from 'react';
import {
  Users, Search, Trash2, RefreshCw, AlertCircle, X,
  ShieldCheck, UserCheck, Calendar, Phone, Mail, Info, Crown,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';
import Button from '../common/Button';

export const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Confirm modals
  const [confirmDelete, setConfirmDelete] = useState(null);   // { id, username }
  const [confirmRole, setConfirmRole] = useState(null);       // { id, username, newRole }
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await adminService.deleteUser(confirmDelete.id);
      showMessage(`Đã xóa người dùng "${confirmDelete.username}" thành công!`, 'success');
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      showMessage(err.message || 'Lỗi khi xóa người dùng.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!confirmRole) return;
    setActionLoading(true);
    try {
      await adminService.updateUserRole(confirmRole.id, confirmRole.newRole);
      showMessage(
        `Đã cập nhật quyền "${confirmRole.username}" thành ${confirmRole.newRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}!`,
        'success'
      );
      setConfirmRole(null);
      fetchUsers();
    } catch (err) {
      showMessage(err.message || 'Lỗi khi cập nhật quyền.', 'error');
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
    return matchSearch && matchRole;
  });

  const roleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Crown size={10} /> Quản trị viên
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <UserCheck size={10} /> Người dùng
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
      'bg-brand/20 text-brand',
      'bg-emerald-500/20 text-emerald-400',
      'bg-purple-500/20 text-purple-400',
      'bg-blue-500/20 text-blue-400',
      'bg-amber-500/20 text-amber-400',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-zinc-200 flex items-center gap-2">
            <Users className="text-brand" size={20} /> Quản lý Người dùng
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Xem danh sách tài khoản, phân quyền hoặc xóa người dùng khỏi hệ thống.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-dark-border hover:border-zinc-700 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Toast */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-brand/10 border-brand/20 text-brand'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={18} />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-zinc-500 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng tài khoản', value: users.length, color: 'text-zinc-300' },
          { label: 'Người dùng', value: users.filter((u) => u.role === 'user').length, color: 'text-blue-400' },
          { label: 'Quản trị viên', value: users.filter((u) => u.role === 'admin').length, color: 'text-amber-400' },
          { label: 'Kết quả lọc', value: filteredUsers.length, color: 'text-brand' },
        ].map((s) => (
          <div key={s.label} className="bg-dark-card border border-dark-border rounded-2xl p-4 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Tìm theo Tên, Email hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-dark-border rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand/40 transition-colors"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full md:w-44 bg-[#0a0a0c] border border-dark-border rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-400 focus:outline-none focus:border-brand/40 cursor-pointer"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="user">Người dùng</option>
          <option value="admin">Quản trị viên</option>
        </select>
      </div>

      {/* User List */}
      {loading && users.length === 0 ? (
        <Loading />
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-dark-card border border-dashed border-dark-border rounded-3xl space-y-4">
          <Users size={48} className="text-zinc-800 mx-auto" />
          <p className="text-zinc-500 font-semibold text-xs">Không tìm thấy người dùng nào phù hợp.</p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-dark-border text-zinc-500 text-xs font-bold uppercase tracking-wider bg-[#0a0a0c]/60">
                  <th className="py-4 pl-6">Người dùng</th>
                  <th className="py-4">Liên hệ</th>
                  <th className="py-4">Vai trò</th>
                  <th className="py-4">Ngày đăng ký</th>
                  <th className="py-4 pr-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs font-semibold text-zinc-300">
                {filteredUsers.map((user) => {
                  const createdDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={user._id} className="hover:bg-zinc-800/10 transition-colors">
                      {/* Avatar + Name */}
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 border border-white/5 ${avatarColor(user.username)}`}
                          >
                            {getInitials(user.username)}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                              {user.username}
                              {user.role === 'admin' && (
                                <Crown size={11} className="text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">{user._id?.slice(-8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Mail size={11} className="text-brand shrink-0" />
                            <span className="truncate max-w-[200px]" title={user.email}>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 text-zinc-500">
                              <Phone size={11} />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4">{roleBadge(user.role)}</td>

                      {/* Join date */}
                      <td className="py-4">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Calendar size={11} />
                          <span>{createdDate}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* Toggle Role button */}
                          <button
                            onClick={() =>
                              setConfirmRole({
                                id: user._id,
                                username: user.username,
                                newRole: user.role === 'admin' ? 'user' : 'admin',
                              })
                            }
                            title={user.role === 'admin' ? 'Hạ xuống Người dùng' : 'Nâng lên Quản trị viên'}
                            className={`p-2 rounded-xl border transition-all duration-300 active:scale-95 inline-flex items-center justify-center ${
                              user.role === 'admin'
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 hover:border-amber-500/40 text-amber-400'
                                : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/40 text-blue-400'
                            }`}
                          >
                            <ShieldCheck size={14} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setConfirmDelete({ id: user._id, username: user.username })}
                            title="Xóa người dùng"
                            className="p-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/40 text-brand rounded-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <ConfirmModal
          icon={<Trash2 size={24} className="text-brand" />}
          iconBg="bg-brand/10 border-brand/20"
          title="Xác nhận xóa người dùng?"
          description={
            <>
              Hành động này sẽ xóa vĩnh viễn tài khoản{' '}
              <span className="font-mono text-brand font-bold">@{confirmDelete.username}</span> và toàn bộ lịch sử đặt vé.
            </>
          }
          note="Các ghế đã đặt sẽ được giải phóng tự động. Hành động này không thể hoàn tác."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDeleteUser}
          loading={actionLoading}
          confirmLabel="Đồng ý xóa"
        />
      )}

      {/* Confirm Role Change Modal */}
      {confirmRole && (
        <ConfirmModal
          icon={<ShieldCheck size={24} className="text-amber-400" />}
          iconBg="bg-amber-500/10 border-amber-500/20"
          title="Xác nhận thay đổi quyền?"
          description={
            <>
              Bạn muốn thay đổi quyền của{' '}
              <span className="font-mono text-brand font-bold">@{confirmRole.username}</span> thành{' '}
              <span className="font-bold text-amber-400">
                {confirmRole.newRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </span>
              ?
            </>
          }
          note={
            confirmRole.newRole === 'admin'
              ? 'Quản trị viên có toàn quyền trên hệ thống. Hãy cân nhắc kỹ.'
              : 'Người dùng này sẽ mất quyền truy cập vào trang quản trị.'
          }
          onCancel={() => setConfirmRole(null)}
          onConfirm={handleUpdateRole}
          loading={actionLoading}
          confirmLabel="Xác nhận"
          confirmClass="bg-amber-500 hover:bg-amber-600 shadow-[0_4px_14px_rgba(245,158,11,0.3)]"
        />
      )}
    </div>
  );
};

// Reusable confirm modal
const ConfirmModal = ({ icon, iconBg, title, description, note, onCancel, onConfirm, loading, confirmLabel, confirmClass }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-dark-card border border-dark-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="space-y-2">
          <h4 className="font-black text-white text-base">{title}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
          <div className="bg-zinc-900 border border-dark-border p-2.5 rounded-xl flex items-start gap-2 mt-2">
            <Info size={14} className="text-zinc-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-zinc-500 leading-normal">{note}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          disabled={loading}
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 rounded-xl transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          disabled={loading}
          onClick={onConfirm}
          className={`px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 ${
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
