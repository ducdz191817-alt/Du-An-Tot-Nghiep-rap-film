/**
 * COMPONENT: PaymentForm.jsx — Form thanh toán
 * - 2 phương thức: VietQR, MoMo.
 * - Bắt buộc tick Checkbox "Đồng ý điều khoản" trước khi thanh toán.
 */

import React, { useState } from 'react';
import { Wallet, QrCode } from 'lucide-react';
import Button from '../common/Button';

export const PaymentForm = ({
  onSubmit,
  loading,
  pricing,
  appliedCoupon = null,
}) => {
  const [method, setMethod] = useState('vietqr');
  const [errors, setErrors] = useState({});
  const [agreedTerms, setAgreedTerms] = useState(false);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, pricing.grandTotal - discountAmount);

  const handlePay = (e) => {
    e.preventDefault();
    if (!agreedTerms) {
      setErrors(prev => ({ ...prev, terms: 'Vui lòng đồng ý điều khoản trước khi thanh toán' }));
      return;
    }
    onSubmit(method);
  };

  return (
    <div className="bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 p-6 rounded-3xl space-y-6 shadow-xl">
      <div>
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-3">
          Chọn phương thức thanh toán
        </h3>
      </div>

      {/* Methods selectors: 2 phương thức VietQR và MoMo */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setMethod('vietqr')}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
            method === 'vietqr'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30 shadow-sm'
              : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <QrCode size={24} className="mb-2 text-emerald-500" />
          <span className="text-xs font-bold">Chuyển khoản VietQR</span>
        </button>
        
        <button
          type="button"
          onClick={() => setMethod('momo')}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
            method === 'momo'
              ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-2 ring-pink-500/30 shadow-sm'
              : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Wallet size={24} className="mb-2 text-pink-500" />
          <span className="text-xs font-bold">Ví MoMo</span>
        </button>
      </div>

      {/* Form chi tiết & thông tin phương thức */}
      <form onSubmit={handlePay} className="space-y-4 pt-2 text-center" noValidate>
        {method === 'vietqr' ? (
          <div className="bg-emerald-50 dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/30 p-5 rounded-2xl max-w-sm mx-auto text-left space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-sm">
              <QrCode size={16} />
              <span>Thanh toán VietQR tiện lợi</span>
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-zinc-400 leading-relaxed font-semibold">
              Sau khi nhấn nút phía dưới, mã QR động chứa thông tin số tài khoản ngân hàng, số tiền ({finalTotal.toLocaleString()} VND) và nội dung chuyển khoản tự động sẽ hiển thị. Hệ thống sẽ tự động quét trạng thái giao dịch để duyệt vé cho bạn.
            </p>
          </div>
        ) : (
          <div className="bg-pink-50 dark:bg-gradient-to-b dark:from-pink-950/30 dark:to-zinc-900 border border-pink-200 dark:border-pink-500/20 p-6 rounded-2xl max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-pink-100 dark:bg-pink-500/10 border border-pink-300 dark:border-pink-500/20 flex items-center justify-center mx-auto shadow-sm dark:shadow-[0_0_20px_rgba(236,72,153,0.15)]">
              <Wallet size={28} className="text-pink-600 dark:text-pink-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-gray-900 dark:text-white">Ví điện tử MoMo</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold leading-relaxed">
                Bạn sẽ được chuyển hướng sang ứng dụng MoMo hoặc quét mã QR để hoàn tất thanh toán {finalTotal.toLocaleString()} VND an toàn.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Giao dịch bảo mật bởi MoMo</span>
            </div>
          </div>
        )}

        {/* Điều khoản sử dụng dịch vụ */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group text-left">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => {
                setAgreedTerms(e.target.checked);
                if (e.target.checked && errors.terms) {
                  setErrors(prev => ({ ...prev, terms: '' }));
                }
              }}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/30 accent-brand cursor-pointer"
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold leading-relaxed">
              Tôi đồng ý với <span className="text-brand hover:underline font-bold">điều khoản sử dụng dịch vụ</span> và <span className="text-brand hover:underline font-bold">chính sách bảo mật</span> của Nova Cinema. Vé đã mua <strong className="text-zinc-800 dark:text-zinc-200">không được đổi, trả hoặc hoàn tiền</strong>.
            </span>
          </label>
          {errors.terms && (
            <p className="text-[11px] text-red-500 font-semibold text-left ml-7">⚠️ {errors.terms}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={!agreedTerms}
          className={`w-full py-3.5 rounded-2xl font-black text-sm ${!agreedTerms ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {method === 'vietqr'
            ? `Tiến hành chuyển khoản VietQR (${finalTotal.toLocaleString()} VND)`
            : `Tiến hành thanh toán MoMo (${finalTotal.toLocaleString()} VND)`}
        </Button>
      </form>
    </div>
  );
};

export default PaymentForm;