import React, { useState } from 'react';
import { User, Mail, Lock, Phone, UserPlus } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';

export const RegisterForm = ({ onSuccess }) => {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!formData.email) {
      errors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Vui lòng cung cấp một email hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.phone && !/^\d{10,11}$/.test(formData.phone)) {
      errors.phone = 'Số điện thoại phải từ 10-11 chữ số';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.phone
      );
      if (onSuccess) onSuccess();
    } catch (err) {
      // Handled by useAuth error state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      <Input
        name="username"
        label="Tên đăng nhập"
        placeholder="nguyenvana"
        value={formData.username}
        onChange={handleChange}
        error={formErrors.username}
        icon={<User size={18} />}
        required
      />

      <Input
        name="email"
        type="email"
        label="Địa chỉ Email"
        placeholder="tenban@gmail.com"
        value={formData.email}
        onChange={handleChange}
        error={formErrors.email}
        icon={<Mail size={18} />}
        required
      />

      <Input
        name="phone"
        label="Số điện thoại"
        placeholder="0123456789"
        value={formData.phone}
        onChange={handleChange}
        error={formErrors.phone}
        icon={<Phone size={18} />}
      />

      <Input
        name="password"
        type="password"
        label="Mật khẩu"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        error={formErrors.password}
        icon={<Lock size={18} />}
        required
      />

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className="w-full mt-2"
        icon={<UserPlus size={18} />}
      >
        Tạo tài khoản
      </Button>
    </form>
  );
};

export default RegisterForm;