import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import authService from '../services/auth.service';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import myLogo from '../assets/images/logo.png';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '', resetUrl?: '' }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage({ type: 'error', text: 'Vui lòng điền địa chỉ email hợp lệ' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await authService.forgotPassword(email);
      setMessage({
        type: 'success',
        text: res?.message || 'Đã gửi hướng dẫn khôi phục mật khẩu vào Email của bạn. Vui lòng kiểm tra hộp thư!',
        resetUrl: res?.resetUrl || null,
        skipped: res?.skipped || false,
      });
      setEmail('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.message || 'Không thể gửi email khôi phục. Vui lòng thử lại sau!',
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
            Quên mật khẩu?
          </h2>
          <p className="text-xs text-zinc-500 text-center">
            Nhập email đã đăng ký để nhận liên kết khôi phục mật khẩu.
          </p>
        </div>

        {/* Banner Thông báo */}
        {message && (
          <div className="space-y-3">
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
              <div className="space-y-1">
                <p className="leading-relaxed">{message.text}</p>
                {message.skipped && (
                  <p className="text-[11px] text-zinc-400">
                    Mẹo: Để gửi email thực sự vào hộp thư Gmail, vui lòng thêm cấu hình <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">SMTP_USER</code> và <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">SMTP_PASS</code> vào file <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">backend/.env</code>.
                  </p>
                )}
              </div>
            </div>

            {/* Direct reset URL shortcut for development / testing when SMTP is not configured */}
            {message.resetUrl && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ExternalLink size={15} /> Liên kết Đặt lại Mật khẩu Thử nghiệm:
                </p>
                <a
                  href={message.resetUrl}
                  className="block text-center w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Click để Đặt lại Mật khẩu ngay
                </a>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            name="email"
            type="email"
            label="Địa chỉ Email của bạn"
            placeholder="tenban@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2"
            icon={<Send size={18} />}
          >
            Gửi email khôi phục
          </Button>
        </form>

        {/* Footer Back to Login */}
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

export default ForgotPasswordPage;
