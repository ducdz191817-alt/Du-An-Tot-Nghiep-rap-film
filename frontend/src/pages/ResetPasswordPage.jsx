import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import authService from '../services/auth.service';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import myLogo from '../assets/images/logo.png';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải chứa ít nhất 6 ký tự' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await authService.resetPassword(token, password);
      setIsSuccess(true);
      setMessage({
        type: 'success',
        text: res?.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.message || 'Liên kết khôi phục không hợp lệ hoặc đã hết hạn. Vui lòng thử lại!',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-dark-card border border-dark-border p-8 rounded-3xl shadow-xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <img 
            src={myLogo} 
            alt="Nova Cinematic Logo" 
            className="h-16 w-auto object-contain" 
          />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider text-center mt-2">
            Đặt lại mật khẩu
          </h2>
          <p className="text-xs text-zinc-500 text-center">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        {/* Banner Thông báo */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 pt-2">
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              name="password"
              type="password"
              label="Mật khẩu mới"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
            />

            <Input
              name="confirmPassword"
              type="password"
              label="Xác nhận mật khẩu mới"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<KeyRound size={18} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              icon={<CheckCircle2 size={18} />}
            >
              Xác nhận đổi mật khẩu
            </Button>
          </form>
        )}

        {/* Footer Link */}
        <div className="text-center text-xs font-semibold text-zinc-500 border-t border-dark-border/40 pt-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-brand font-black hover:underline"
          >
            <ArrowLeft size={14} /> Quay lại Đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;
