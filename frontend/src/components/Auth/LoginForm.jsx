import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';

export const LoginForm = ({ onSuccess }) => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errors = {};
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
      await login(formData.email, formData.password);
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
        icon={<LogIn size={18} />}
      >
        Đăng nhập
      </Button>
    </form>
  );
};

export default LoginForm;