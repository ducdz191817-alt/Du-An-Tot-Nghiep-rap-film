import React, { useState } from 'react';
import { CreditCard, Wallet, QrCode } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

export const PaymentForm = ({
  onSubmit,
  loading,
  pricing,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [method, setMethod] = useState('card');
  const [cardData, setCardData] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setValidatingCoupon(true);
    try {
      await onApplyCoupon(couponInput.trim().toUpperCase());
    } catch (err) {
      setCouponError(err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setCouponInput('');
    setCouponError('');
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, pricing.grandTotal - discountAmount);

  const validate = () => {
    if (method !== 'card') return true;

    const err = {};
    if (!cardData.holder.trim()) {
      err.holder = 'Vui lòng điền tên chủ thẻ';
    }
    if (!cardData.number.trim()) {
      err.number = 'Vui lòng điền số thẻ';
    } else if (!/^\d{16}$/.test(cardData.number.replace(/\s+/g, ''))) {
      err.number = 'Số thẻ không hợp lệ (yêu cầu 16 chữ số)';
    }
    if (!cardData.expiry.trim()) {
      err.expiry = 'Vui lòng điền ngày hết hạn';
    } else if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      err.expiry = 'Sử dụng định dạng MM/YY';
    }
    if (!cardData.cvv.trim()) {
      err.cvv = 'Vui lòng điền mã bảo mật CVV';
    } else if (!/^\d{3}$/.test(cardData.cvv)) {
      err.cvv = 'CVV không hợp lệ (yêu cầu 3 chữ số)';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleCardChange = (e) => {
    setCardData({ ...cardData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(method);
  };

  return (
    <div className="bg-dark-card border border-dark-border p-6 rounded-3xl space-y-6 shadow-xl">
      <div>
        <h3 className="text-lg font-black text-zinc-200 border-b border-dark-border pb-3">
          Chọn phương thức thanh toán
        </h3>
      </div>

      {/* Methods selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setMethod('card')}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            method === 'card'
              ? 'border-brand bg-brand/5 text-brand shadow-sm'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CreditCard size={20} className="mb-2" />
          <span>Thanh toán thẻ</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('vietqr')}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            method === 'vietqr'
              ? 'border-emerald-600 bg-emerald-600/5 text-emerald-400 shadow-sm'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <QrCode size={20} className="mb-2 text-emerald-500" />
          <span>Chuyển khoản VietQR</span>
        </button>
        
        <button
          type="button"
          onClick={() => setMethod('momo')}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            method === 'momo'
              ? 'border-pink-600 bg-pink-600/5 text-pink-400 shadow-sm'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wallet size={20} className="mb-2 text-pink-500" />
          <span>Ví MoMo</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('vnpay')}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
            method === 'vnpay'
              ? 'border-blue-600 bg-blue-600/5 text-blue-400 shadow-sm'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wallet size={20} className="mb-2 text-blue-500" />
          <span>Ví VNPay</span>
        </button>
      </div>

      {/* Coupon input section */}
      <div className="border-t border-dark-border pt-5 space-y-3">
        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider pl-1">
          Mã giảm giá / Voucher
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập mã giảm giá (Ví dụ: NOVA20)"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            disabled={appliedCoupon || loading}
            className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-650 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-50 transition-colors uppercase font-mono tracking-wider"
          />
          {appliedCoupon ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleRemoveCoupon}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold border-red-950/40 text-red-400 hover:bg-red-950/20 shrink-0"
            >
              Hủy áp dụng
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={handleApplyCoupon}
              loading={validatingCoupon}
              disabled={!couponInput.trim() || loading}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold border-brand-dark/30 text-brand hover:bg-brand/10 shrink-0"
            >
              Áp dụng
            </Button>
          )}
        </div>

        {couponError && (
          <p className="text-xs text-red-500 font-semibold pl-1">
            {couponError}
          </p>
        )}

        {appliedCoupon && (
          <div className="bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <span>Đã áp dụng mã: <strong className="font-mono">{appliedCoupon.code}</strong></span>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                {appliedCoupon.discountType === 'percentage'
                  ? `Giảm ${appliedCoupon.discountValue}% (tối đa ${appliedCoupon.maxDiscountAmount?.toLocaleString('vi-VN')} đ)`
                  : `Giảm ${appliedCoupon.discountValue?.toLocaleString('vi-VN')} đ`}
              </p>
            </div>
            <span className="font-extrabold text-sm text-emerald-400 shrink-0">
              -{discountAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}
      </div>

      {/* Card Details fields */}
      {method === 'card' && (
        <form onSubmit={handlePay} className="space-y-4 pt-2" noValidate>
          <Input
            name="holder"
            label="Tên chủ thẻ"
            placeholder="NGUYEN VAN A"
            value={cardData.holder}
            onChange={handleCardChange}
            error={errors.holder}
            required
          />

          <Input
            name="number"
            label="Số thẻ"
            placeholder="1234 5678 1234 5678"
            maxLength={19}
            value={cardData.number}
            onChange={handleCardChange}
            error={errors.number}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="expiry"
              label="Ngày hết hạn"
              placeholder="MM/YY"
              maxLength={5}
              value={cardData.expiry}
              onChange={handleCardChange}
              error={errors.expiry}
              required
            />
            <Input
              name="cvv"
              type="password"
              label="Mã bảo mật CVV"
              placeholder="•••"
              maxLength={3}
              value={cardData.cvv}
              onChange={handleCardChange}
              error={errors.cvv}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-4 py-3.5 rounded-2xl font-black text-sm"
          >
            Xác nhận & Thanh toán {finalTotal.toLocaleString()} VND
          </Button>
        </form>
      )}

      {/* E-wallet & QR flows */}
      {method !== 'card' && (
        <form onSubmit={handlePay} className="space-y-4 pt-4 text-center" noValidate>
          {method === 'vietqr' ? (
            <div className="bg-zinc-900 border border-dark-border p-5 rounded-2xl max-w-sm mx-auto text-left space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <QrCode size={16} />
                <span>Thanh toán VietQR tiện lợi</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                Sau khi nhấn nút phía dưới, mã QR động chứa thông tin số tài khoản ngân hàng, số tiền và nội dung chuyển khoản tự động sẽ hiển thị. Hệ thống sẽ tự động quét trạng thái giao dịch để duyệt vé cho bạn.
              </p>
            </div>
          ) : method === 'vnpay' ? (
            <div className="bg-gradient-to-b from-blue-950/40 to-zinc-900 border border-blue-500/20 p-6 rounded-2xl max-w-sm mx-auto space-y-5">
              {/* VNPay icon */}
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <CreditCard size={28} className="text-blue-400" />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-black text-white">Cổng thanh toán VNPay</h4>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  Bạn sẽ được chuyển hướng sang trang thanh toán bảo mật của VNPay để hoàn tất giao dịch.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-2.5 text-left">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black flex items-center justify-center mt-0.5">1</span>
                  <p className="text-xs text-zinc-400 font-semibold">Nhấn nút <span className="text-blue-400 font-bold">"Thanh toán qua VNPay"</span> bên dưới</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black flex items-center justify-center mt-0.5">2</span>
                  <p className="text-xs text-zinc-400 font-semibold">Chọn ngân hàng và nhập thông tin thẻ trên trang VNPay</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black flex items-center justify-center mt-0.5">3</span>
                  <p className="text-xs text-zinc-400 font-semibold">Xác nhận OTP và tự động quay lại nhận vé</p>
                </div>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest pt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Giao dịch được mã hóa & bảo mật bởi VNPay</span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-b from-pink-950/30 to-zinc-900 border border-pink-500/20 p-6 rounded-2xl max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(236,72,153,0.15)]">
                <Wallet size={28} className="text-pink-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-white">Ví điện tử MoMo</h4>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  Bạn sẽ được chuyển hướng sang ứng dụng MoMo hoặc quét mã QR để hoàn tất giao dịch an toàn.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest pt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Giao dịch bảo mật bởi MoMo</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full py-3.5 rounded-2xl font-black text-sm"
          >
            {method === 'vietqr'
              ? `Tiến hành chuyển khoản VietQR`
              : method === 'vnpay'
              ? `Thanh toán qua VNPay — ${finalTotal.toLocaleString()} VND`
              : `Tiến hành thanh toán MoMo`}
          </Button>
        </form>
      )}
    </div>
  );
};

export default PaymentForm;