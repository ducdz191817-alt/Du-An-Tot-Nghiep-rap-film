import React, { useState } from 'react';
import { CreditCard, Wallet, QrCode } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

export const PaymentForm = ({ onSubmit, loading, pricing }) => {
  const [method, setMethod] = useState('card');
  const [cardData, setCardData] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    if (method !== 'card') return true;

    const err = {};
    if (!cardData.holder.trim()) err.holder = 'Tên chủ thẻ là bắt buộc';
    if (!/^\d{16}$/.test(cardData.number.replace(/\s+/g, ''))) {
      err.number = 'Số thẻ không hợp lệ (yêu cầu 16 chữ số)';
    }
    if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      err.expiry = 'Sử dụng định dạng MM/YY';
    }
    if (!/^\d{3}$/.test(cardData.cvv)) {
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

      {/* Card Details fields */}
      {method === 'card' && (
        <form onSubmit={handlePay} className="space-y-4 pt-2">
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
            Xác nhận & Thanh toán {pricing.grandTotal.toLocaleString()} VND
          </Button>
        </form>
      )}

      {/* E-wallet & QR simulations */}
      {method !== 'card' && (
        <form onSubmit={handlePay} className="space-y-4 pt-4 text-center">
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
          ) : (
            <div className="bg-zinc-900 border border-dark-border p-6 rounded-2xl max-w-sm mx-auto space-y-4">
              <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border border-zinc-200">
                <div className="w-full h-full bg-zinc-950 flex flex-wrap items-center justify-center p-3 text-[10px] text-zinc-500 font-bold uppercase select-none tracking-widest leading-normal text-center rounded">
                  MÔ PHỎNG MÃ QR
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                Quét mã QR này bằng ứng dụng <span className="capitalize font-black text-white">{method}</span> của bạn để thanh toán.
              </p>
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
              : method === 'momo'
              ? `Tiến hành thanh toán MoMo`
              : `Tôi đã hoàn tất thanh toán`}
          </Button>
        </form>
      )}
    </div>
  );
};

export default PaymentForm;