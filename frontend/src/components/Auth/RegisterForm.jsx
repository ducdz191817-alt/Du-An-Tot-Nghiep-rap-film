import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
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
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: 'Nam',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Vui lòng điền tên';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Tên phải có ít nhất 3 ký tự';
    }

    if (!formData.email) {
      errors.email = 'Vui lòng điền địa chỉ email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Vui lòng cung cấp một email hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng điền mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.phone) {
      errors.phone = 'Vui lòng điền số điện thoại';
    } else if (!/^\d{10,11}$/.test(formData.phone)) {
      errors.phone = 'Số điện thoại phải từ 10-11 chữ số';
    }

    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
      errors.dob = 'Vui lòng điền đầy đủ ngày sinh';
    } else {
      const day = parseInt(formData.dobDay, 10);
      const month = parseInt(formData.dobMonth, 10) - 1; // 0-indexed month
      const year = parseInt(formData.dobYear, 10);
      const birthDate = new Date(year, month, day);
      const today = new Date();
      if (birthDate > today) {
        errors.dob = 'Ngày sinh không thể ở tương lai';
      } else {
        const ageNum = today.getFullYear() - birthDate.getFullYear();
        if (ageNum > 120) {
          errors.dob = 'Ngày sinh không hợp lệ';
        } else if (ageNum < 13) {
          errors.dob = 'Bạn phải từ 13 tuổi trở lên để đăng ký tài khoản';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Also clear general dob error if any dob dropdown is selected
    if (name.startsWith('dob') && formErrors.dob) {
      setFormErrors(prev => ({ ...prev, dob: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const day = formData.dobDay.padStart(2, '0');
    const month = formData.dobMonth.padStart(2, '0');
    const year = formData.dobYear;
    const dobString = `${year}-${month}-${day}`;

    const calculateAge = (dobStr) => {
      const today = new Date();
      const birthDate = new Date(dobStr);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const age = calculateAge(dobString);

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.phone,
        age,
        formData.gender,
        dobString
      );
      if (onSuccess) onSuccess();
    } catch (err) {
      // Handled by useAuth error state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      <Input
        name="username"
        label="Tên"
        placeholder="Tên"
        value={formData.username}
        onChange={handleChange}
        error={formErrors.username}
        required
      />

      <Input
        name="phone"
        label="Số điện thoại"
        placeholder="Số điện thoại"
        value={formData.phone}
        onChange={handleChange}
        error={formErrors.phone}
        required
      />

      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        error={formErrors.email}
        required
      />

      <Input
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Mật khẩu"
        placeholder="Mật khẩu"
        value={formData.password}
        onChange={handleChange}
        error={formErrors.password}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        required
      />

      {/* Date of Birth and Gender */}
      <div className="w-full mb-4">
        <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">
          Ngày sinh<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {/* Days select */}
          <select
            name="dobDay"
            value={formData.dobDay}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand text-gray-900 rounded-lg py-2 px-3 outline-none text-sm cursor-pointer transition-all"
          >
            <option value="">Ngày</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Months select */}
          <select
            name="dobMonth"
            value={formData.dobMonth}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand text-gray-900 rounded-lg py-2 px-3 outline-none text-sm cursor-pointer transition-all"
          >
            <option value="">Tháng</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Years select */}
          <select
            name="dobYear"
            value={formData.dobYear}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand text-gray-900 rounded-lg py-2 px-3 outline-none text-sm cursor-pointer transition-all"
          >
            <option value="">Năm</option>
            {Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i)).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Gender Selector */}
          <div className="flex items-center space-x-3 ml-2">
            <span className="text-red-500 font-bold">*</span>
            <label className="flex items-center space-x-1.5 text-sm font-semibold text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Nam"
                checked={formData.gender === 'Nam'}
                onChange={handleChange}
                className="text-brand focus:ring-brand h-4 w-4 border-gray-300"
              />
              <span>Nam</span>
            </label>
            <label className="flex items-center space-x-1.5 text-sm font-semibold text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Nữ"
                checked={formData.gender === 'Nữ'}
                onChange={handleChange}
                className="text-brand focus:ring-brand h-4 w-4 border-gray-300"
              />
              <span>Nữ</span>
            </label>
          </div>
        </div>
        {formErrors.dob && (
          <p className="mt-1 text-xs text-red-500 font-medium pl-0.5">{formErrors.dob}</p>
        )}
      </div>

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