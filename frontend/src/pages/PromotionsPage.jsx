import React, { useState, useEffect } from 'react';
import { Tag, Clock, Copy, CheckCheck, Zap, Gift, Percent, Star, Flame } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────
const promotions = [
  {
    id: 1,
    badge: 'HOT',
    badgeColor: 'bg-red-500',
    icon: <Flame size={22} className="text-red-400" />,
    title: 'Thứ Tư Vui Vẻ',
    subtitle: 'Giảm 30% tất cả loại vé',
    description: 'Mỗi thứ Tư hàng tuần, tất cả vé 2D, 3D và IMAX được giảm 30%. Áp dụng cho tối đa 4 vé mỗi lần đặt.',
    code: 'WEDNESDAY30',
    discount: '30%',
    discountType: 'percent',
    minOrder: '0đ',
    validUntil: new Date(new Date().setDate(new Date().getDate() + 5)),
    tag: 'Mỗi Thứ Tư',
    gradient: 'from-red-900/40 via-dark-card to-dark-card',
    glowColor: 'shadow-red-500/10',
    borderColor: 'border-red-500/20',
    accentColor: 'text-red-400',
    bgAccent: 'bg-red-500/10',
  },
  {
    id: 2,
    badge: 'MỚI',
    badgeColor: 'bg-brand',
    icon: <Gift size={22} className="text-brand" />,
    title: 'Combo Cặp Đôi',
    subtitle: 'Mua 2 vé tặng 1 combo bắp nước',
    description: 'Đặt 2 vé bất kỳ cùng lúc, nhận ngay 1 combo bắp rang bơ size L + 2 nước ngọt miễn phí. Chỉ áp dụng cuối tuần.',
    code: 'COUPLE2024',
    discount: 'Tặng combo',
    discountType: 'gift',
    minOrder: '200,000đ',
    validUntil: new Date(new Date().setDate(new Date().getDate() + 12)),
    tag: 'Cuối tuần',
    gradient: 'from-purple-900/40 via-dark-card to-dark-card',
    glowColor: 'shadow-purple-500/10',
    borderColor: 'border-purple-500/20',
    accentColor: 'text-brand',
    bgAccent: 'bg-brand/10',
  },
  {
    id: 3,
    badge: 'SỐC',
    badgeColor: 'bg-amber-500',
    icon: <Zap size={22} className="text-amber-400" />,
    title: 'Flash Sale IMAX',
    subtitle: 'Vé IMAX chỉ 99,000đ',
    description: 'Giá vé IMAX siêu rẻ chỉ 99,000đ cho suất chiếu trước 12 giờ trưa. Số lượng có hạn, đặt nhanh kẻo hết!',
    code: 'IMAXFLASH',
    discount: '99K',
    discountType: 'fixed',
    minOrder: '0đ',
    validUntil: new Date(new Date().setDate(new Date().getDate() + 2)),
    tag: 'Suất sáng',
    gradient: 'from-amber-900/40 via-dark-card to-dark-card',
    glowColor: 'shadow-amber-500/10',
    borderColor: 'border-amber-500/20',
    accentColor: 'text-amber-400',
    bgAccent: 'bg-amber-500/10',
  },
  {
    id: 4,
    badge: 'VIP',
    badgeColor: 'bg-emerald-500',
    icon: <Star size={22} className="text-emerald-400" />,
    title: 'Thành Viên Mới',
    subtitle: 'Giảm 50K đơn hàng đầu tiên',
    description: 'Đăng ký tài khoản và đặt vé lần đầu tiên nhận ngay ưu đãi giảm 50,000đ. Không giới hạn loại vé hay suất chiếu.',
    code: 'NEWMEMBER',
    discount: '50K',
    discountType: 'fixed',
    minOrder: '100,000đ',
    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
    tag: 'Không giới hạn',
    gradient: 'from-emerald-900/40 via-dark-card to-dark-card',
    glowColor: 'shadow-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    accentColor: 'text-emerald-400',
    bgAccent: 'bg-emerald-500/10',
  },
  {
    id: 5,
    badge: 'SINH NHẬT',
    badgeColor: 'bg-pink-500',
    icon: <Percent size={22} className="text-pink-400" />,
    title: 'Ưu Đãi Sinh Nhật',
    subtitle: 'Giảm 40% trong tháng sinh nhật',
    description: 'Cập nhật ngày sinh trong tài khoản để nhận ưu đãi 40% toàn bộ vé trong tháng sinh nhật của bạn. Tặng thêm bắp rang miễn phí!',
    code: 'BIRTHDAY40',
    discount: '40%',
    discountType: 'percent',
    minOrder: '0đ',
    validUntil: new Date(new Date().setDate(new Date().getDate() + 60)),
    tag: 'Cả tháng',
    gradient: 'from-pink-900/40 via-dark-card to-dark-card',
    glowColor: 'shadow-pink-500/10',
    borderColor: 'border-pink-500/20',
    accentColor: 'text-pink-400',
    bgAccent: 'bg-pink-500/10',
  },
  {
    id: 6,
    badge: 'NHÓM',
    badgeColor: 'bg-sky-500',
    icon: <Gift size={22} className="text-sky-400" />,
    title: 'Đặt Vé Nhóm',
    subtitle: 'Từ 5 vé giảm 20% toàn bộ',
    description: 'Đặt từ 5 vé trở lên trong cùng một đơn hàng, tự động được giảm 20% tổng giá trị. Lý tưởng cho nhóm bạn hoặc gia đình.',
    code: 'GROUP5PLUS',
    discount: '20%',
    discountType: 'percent',
    minOrder: '450,000đ',
    validUntil: new Date(new Date().setDate(new Date().getDate() + 90)),
    tag: 'Từ 5 vé',
    gradient: 'from-sky-900/40 via-dark-card to-dark-card',
    glowColor: 'shadow-sky-500/10',
    borderColor: 'border-sky-500/20',
    accentColor: 'text-sky-400',
    bgAccent: 'bg-sky-500/10',
  },
];

// ─── Countdown hook ───────────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const calcLeft = () => {
    const diff = targetDate - new Date();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calcLeft);
  useEffect(() => {
    const t = setInterval(() => setTime(calcLeft()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return time;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const TimeBox = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-black text-white tabular-nums leading-none">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

const CountdownTimer = ({ validUntil }) => {
  const { d, h, m, s } = useCountdown(validUntil);
  return (
    <div className="flex items-center gap-2">
      <Clock size={13} className="text-zinc-500" />
      <div className="flex items-center gap-1.5">
        <TimeBox value={d} label="ngày" />
        <span className="text-zinc-500 font-bold text-sm leading-none pb-2">:</span>
        <TimeBox value={h} label="giờ" />
        <span className="text-zinc-500 font-bold text-sm leading-none pb-2">:</span>
        <TimeBox value={m} label="phút" />
        <span className="text-zinc-500 font-bold text-sm leading-none pb-2">:</span>
        <TimeBox value={s} label="giây" />
      </div>
    </div>
  );
};

const PromoCard = ({ promo }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`
        relative group rounded-2xl border ${promo.borderColor}
        bg-gradient-to-br ${promo.gradient}
        shadow-xl ${promo.glowColor}
        hover:scale-[1.02] hover:shadow-2xl
        transition-all duration-300 overflow-hidden
        flex flex-col
      `}
    >
      {/* Glow orb */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/[0.02] blur-2xl group-hover:bg-white/[0.04] transition-all duration-500 pointer-events-none" />

      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${promo.bgAccent}`}>
              {promo.icon}
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md text-white ${promo.badgeColor} uppercase tracking-wider`}>
              {promo.badge}
            </span>
          </div>
          <div className={`text-2xl font-black ${promo.accentColor}`}>
            -{promo.discount}
          </div>
        </div>

        <h3 className="text-base font-black text-white leading-tight">{promo.title}</h3>
        <p className={`text-sm font-semibold ${promo.accentColor} mt-0.5`}>{promo.subtitle}</p>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3">{promo.description}</p>
      </div>

      {/* Divider dashed */}
      <div className="mx-5 my-4 border-t border-dashed border-dark-border/60" />

      {/* Footer */}
      <div className="px-5 pb-5 space-y-3 mt-auto">
        {/* Info row */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Đơn tối thiểu: <span className="text-zinc-300 font-semibold">{promo.minOrder}</span></span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${promo.bgAccent} ${promo.accentColor}`}>
            {promo.tag}
          </span>
        </div>

        {/* Countdown */}
        <CountdownTimer validUntil={promo.validUntil} />

        {/* Code copy */}
        <button
          onClick={handleCopy}
          className={`
            w-full flex items-center justify-between
            bg-dark-deep/60 hover:bg-dark-deep/90
            border border-dashed ${promo.borderColor}
            rounded-xl px-4 py-2.5
            transition-all duration-200 group/btn
          `}
        >
          <span className={`font-black text-sm tracking-widest ${promo.accentColor}`}>
            {promo.code}
          </span>
          {copied ? (
            <CheckCheck size={16} className="text-emerald-400" />
          ) : (
            <Copy size={14} className="text-zinc-500 group-hover/btn:text-zinc-300 transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const PromotionsPage = () => {
  return (
    <div className="space-y-10 pb-16">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-brand/20 bg-gradient-to-br from-brand-dark/30 via-dark-card to-dark-deep p-8 md:p-14 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.12),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 text-brand px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            <Tag size={12} />
            Ưu đãi đặc biệt
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Khuyến Mãi <span className="text-brand">Hấp Dẫn</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
            Săn ưu đãi, sao chép mã giảm giá và tận hưởng trải nghiệm xem phim tuyệt vời với chi phí tiết kiệm nhất.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Mã đang hoạt động', value: promotions.length, icon: <Tag size={18} className="text-brand" /> },
          { label: 'Tiết kiệm tối đa', value: '50%', icon: <Percent size={18} className="text-emerald-400" /> },
          { label: 'Cập nhật hàng tuần', value: '7 ngày', icon: <Clock size={18} className="text-amber-400" /> },
        ].map((s, i) => (
          <div key={i} className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col items-center gap-1 text-center">
            {s.icon}
            <span className="text-xl font-black text-white">{s.value}</span>
            <span className="text-[11px] text-zinc-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Promotions grid */}
      <div>
        <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
          <Flame size={20} className="text-brand" /> Tất cả ưu đãi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {promotions.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      </div>

      {/* How to use */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-8">
        <h3 className="text-lg font-black text-white mb-6 text-center">Cách sử dụng mã khuyến mãi</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Chọn phim', desc: 'Duyệt danh sách phim và chọn suất chiếu bạn muốn xem.' },
            { step: '02', title: 'Chọn ghế', desc: 'Chọn ghế yêu thích và thêm bắp nước nếu muốn.' },
            { step: '03', title: 'Nhập mã', desc: 'Sao chép và dán mã khuyến mãi vào ô nhập khi thanh toán.' },
            { step: '04', title: 'Tận hưởng', desc: 'Hoàn tất đặt vé và tận hưởng bộ phim với giá ưu đãi!' },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 text-brand font-black text-sm flex items-center justify-center mx-auto">
                {item.step}
              </div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionsPage;
