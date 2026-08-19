import React, { useState, useEffect } from 'react';
import {
  Users, Search, RefreshCw, AlertCircle, X,
  ShieldCheck, UserCheck, Calendar, Phone, Mail, Info, Crown,
  Lock, Unlock, CheckCircle2, Ticket, BadgeCheck, UserCog,
  UserPlus, Edit3, Eye, EyeOff, Save, KeyRound
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

  // Modal states
  const [confirmLock, setConfirmLock] = useState(null); // { id, username, currentStatus }
  const [confirmRole, setConfirmRole] = useState(null); // { id, username, newRole }
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null); // user object to edit
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Create User
  const initialCreateForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    phone: '',
    gender: 'Nam',
    dob: '',
    region: '',
  };
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState('');

  // Form states for Edit User
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: 'staff',
    status: 'active',
    phone: '',
    gender: 'Nam',
    dob: '',
    region: '',
    newPassword: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState('');

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

  // --- Lock / Unlock Handler ---
  const handleToggleLockUser = async () => {
    if (!confirmLock) return;
    setActionLoading(true);
    try {
      const isLocking = confirmLock.currentStatus !== 'locked';
      const res = await adminService.toggleUserStatus(confirmLock.id);
      showMessage(
        res.message || `Đã ${isLocking ? 'khóa' : 'mở khóa'} tài khoản "${confirmLock.username}" thành công!`,
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

  // --- Role Update Handler ---
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
        res.message || `Đã cập nhật vai trò "${confirmRole.username}" thành ${roleText}!`,
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

  // --- Create User Handler ---
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.username.trim()) {
      setCreateError('Vui lòng nhập Tên đăng nhập');
      return;
    }
    if (!createForm.email.trim()) {
      setCreateError('Vui lòng nhập Email');
      return;
    }
    if (!createForm.password) {
      setCreateError('Vui lòng nhập Mật khẩu');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        phone: createForm.phone.trim(),
        gender: createForm.gender,
        dob: createForm.dob,
        region: createForm.region.trim(),
      };

      const res = await adminService.createUser(payload);
      showMessage(res.message || `Tạo tài khoản "${payload.username}" thành công!`, 'success');
      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || 'Không thể tạo tài khoản');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Open Edit User Modal ---
  const handleOpenEdit = (user) => {
    setShowEditModal(user);
    setEditError('');
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'staff',
      status: user.status || 'active',
      phone: user.phone || '',
      gender: user.gender || 'Nam',
      dob: user.dob || '',
      region: user.region || '',
      newPassword: '',
    });
  };

  // --- Submit Edit User ---
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!showEditModal) return;
    setEditError('');

    if (!editForm.username.trim()) {
      setEditError('Tên đăng nhập không được để trống');
      return;
    }
    if (!editForm.email.trim()) {
      setEditError('Email không được để trống');
      return;
    }
    if (editForm.newPassword && editForm.newPassword.length < 6) {
      setEditError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        status: editForm.status,
        phone: editForm.phone.trim(),
        gender: editForm.gender,
        dob: editForm.dob,
        region: editForm.region.trim(),
      };
      if (editForm.newPassword.trim()) {
        payload.password = editForm.newPassword.trim();
      }

      const res = await adminService.updateUser(showEditModal._id, payload);
      showMessage(res.message || `Cập nhật tài khoản "${payload.username}" thành công!`, 'success');
      setShowEditModal(null);
      fetchUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật tài khoản');
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
          <Ticket size={10} /> Nhân viên vé
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
            Tạo tài khoản nhân viên, phân quyền tài khoản và quản lý trạng thái hoạt động trên hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCreateForm(initialCreateForm);
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand-hover shadow-[0_4px_14px_rgba(229,9,20,0.3)] transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <UserPlus size={15} /> Tạo tài khoản nhân viên
          </button>

          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>
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

      {/* Interactive Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Tổng tài khoản', value: users.length, color: 'text-gray-800', roleFilter: 'all', statusFilter: 'all' },
          { label: 'Khách hàng', value: users.filter((u) => u.role === 'user' || !u.role).length, color: 'text-blue-600', roleFilter: 'user', statusFilter: 'all' },
          { label: 'Nhân viên vé', value: users.filter((u) => u.role === 'staff').length, color: 'text-purple-600', roleFilter: 'staff', statusFilter: 'all' },
          { label: 'Quản trị viên', value: users.filter((u) => u.role === 'admin').length, color: 'text-amber-600', roleFilter: 'admin', statusFilter: 'all' },
          { label: 'Đã bị khóa', value: users.filter((u) => u.status === 'locked').length, color: 'text-red-600', roleFilter: 'all', statusFilter: 'locked' },
        ].map((s) => {
          const isSelected = filterRole === s.roleFilter && filterStatus === s.statusFilter;
          return (
            <button
              key={s.label}
              onClick={() => {
                setFilterRole(s.roleFilter);
                setFilterStatus(s.statusFilter);
              }}
              className={`bg-white border rounded-2xl p-4 text-center shadow-sm transition-all cursor-pointer text-left ${
                isSelected ? 'border-brand ring-2 ring-brand/20 bg-brand/5' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
            </button>
          );
        })}
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
          <option value="staff">🎟️ Nhân viên vé</option>
          <option value="admin">👑 Quản trị viên</option>
          <option value="user">👤 Khách hàng</option>
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

      {/* User List Table */}
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
            <table className="w-full text-left border-collapse min-w-[900px]">
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

                      {/* Actions: Quick Role Selector, Edit, Lock */}
                      <td className="py-4 pr-6">
                        <div className="flex items-center justify-center gap-2">
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
                              className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <option value="user">👤 Khách hàng</option>
                              <option value="staff">🎟️ Nhân viên vé</option>
                              <option value="admin">👑 Quản trị viên</option>
                            </select>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Chỉnh sửa chi tiết tài khoản"
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Lock / Unlock Button */}
                          {isSelf ? (
                            <span
                              title="Tài khoản của bạn (Không thể tự khóa)"
                              className="p-2 bg-gray-100 border border-gray-200 text-gray-300 rounded-xl cursor-not-allowed opacity-40"
                            >
                              <Lock size={14} />
                            </span>
                          ) : user.status === 'locked' ? (
                            <button
                              onClick={() => setConfirmLock({ id: user._id, username: user.username, currentStatus: 'locked' })}
                              title="Mở khóa tài khoản"
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-xl transition-all active:scale-95 cursor-pointer"
                            >
                              <Unlock size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmLock({ id: user._id, username: user.username, currentStatus: 'active' })}
                              title="Khóa tài khoản"
                              className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all active:scale-95 cursor-pointer"
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

      {/* ================= MODAL: TẠO TÀI KHOẢN NHÂN VIÊN ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-base">Tạo tài khoản mới</h4>
                  <p className="text-xs text-gray-500">Tạo tài khoản cho Nhân viên bán vé hoặc Quản trị viên</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs font-semibold">
              {/* Username */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên đăng nhập <span className="text-brand">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: nguyenvanan"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Email đăng nhập <span className="text-brand">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="staff@cinema.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Vai trò tài khoản <span className="text-brand">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'staff', label: 'Nhân viên vé', icon: Ticket, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                    { role: 'admin', label: 'Quản trị viên', icon: Crown, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                    { role: 'user', label: 'Khách hàng', icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = createForm.role === item.role;
                    return (
                      <button
                        type="button"
                        key={item.role}
                        onClick={() => setCreateForm({ ...createForm, role: item.role })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected ? `${item.color} font-bold border-2` : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[11px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Mật khẩu <span className="text-brand">*</span></label>
                  <div className="relative">
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      required
                      placeholder="Ít nhất 6 ký tự"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Nhập lại mật khẩu <span className="text-brand">*</span></label>
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    placeholder="Xác nhận mật khẩu"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Optional Fields: Phone, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Giới tính</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-[0_4px_14px_rgba(229,9,20,0.3)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Đang tạo...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Tạo tài khoản
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHỈNH SỬA TÀI KHOẢN ================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-base">Chỉnh sửa thông tin tài khoản</h4>
                  <p className="text-xs text-gray-500 font-mono">ID: {showEditModal._id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs font-semibold">
              {/* Username & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Email đăng nhập</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Vai trò</label>
                  <select
                    value={editForm.role}
                    disabled={showEditModal._id === currentUserId}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand cursor-pointer disabled:opacity-50"
                  >
                    <option value="staff">🎟️ Nhân viên quản lý vé</option>
                    <option value="admin">👑 Quản trị viên</option>
                    <option value="user">👤 Khách hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Trạng thái tài khoản</label>
                  <select
                    value={editForm.status}
                    disabled={showEditModal._id === currentUserId}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand cursor-pointer disabled:opacity-50"
                  >
                    <option value="active">🟢 Đang hoạt động</option>
                    <option value="locked">🔴 Đã bị khóa</option>
                  </select>
                </div>
              </div>

              {/* Phone & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Giới tính</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Reset Password */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-gray-700 font-bold mb-1 flex items-center gap-1">
                  <KeyRound size={13} className="text-amber-500" /> Đặt lại mật khẩu mới <span className="text-gray-400 font-normal">(Bỏ trống nếu không đổi)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới..."
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-gray-800 focus:outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-[0_4px_14px_rgba(229,9,20,0.3)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Lock Modal */}
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
                <span className="font-mono text-emerald-700 font-bold">@{confirmLock.username}</span>? Trạng thái "active" sẽ được lưu vào CSDL.
              </>
            ) : (
              <>
                Khóa tài khoản{' '}
                <span className="font-mono text-red-600 font-bold">@{confirmLock.username}</span>? Trạng thái "locked" sẽ được lưu vào CSDL (ngăn đăng nhập).
              </>
            )
          }
          note={
            confirmLock.currentStatus === 'locked'
              ? 'Tài khoản được mở khóa sẽ khôi phục đầy đủ quyền đăng nhập hệ thống.'
              : 'Tài khoản bị khóa sẽ không thể truy cập hệ thống. Lịch sử giao dịch được giữ nguyên.'
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
          note="Trạng thái phân quyền mới sẽ được lưu trực tiếp vào CSDL MongoDB."
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
