import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Shield, Zap, Users, Star, MapPin, Film, Trophy,
  Headphones, ChevronDown, ChevronUp, Mail, Phone,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────
const stats = [
  { value: '1', label: 'Cụm rạp', icon: <MapPin size={20} className="text-brand" /> },
  { value: '500K+', label: 'Khách hàng tin tưởng', icon: <Users size={20} className="text-emerald-600" /> },
  { value: '10K+', label: 'Suất chiếu mỗi tháng', icon: <Film size={20} className="text-sky-600" /> },
  { value: '4.8★', label: 'Đánh giá trung bình', icon: <Star size={20} className="text-amber-500" /> },
];

const values = [
  {
    icon: <Heart size={22} className="text-rose-600" />,
    bg: 'bg-rose-50 border-rose-200',
    title: 'Đam mê điện ảnh',
    desc: 'Mọi quyết định của chúng tôi đều xuất phát từ tình yêu với nghệ thuật thứ 7 và khát vọng mang đến trải nghiệm xem phim tuyệt vời nhất.',
  },
  {
    icon: <Shield size={22} className="text-emerald-600" />,
    bg: 'bg-emerald-50 border-emerald-200',
    title: 'Chất lượng & Uy tín',
    desc: 'Chúng tôi cam kết duy trì tiêu chuẩn chất lượng cao nhất ở mọi điểm chạm, từ màn hình IMAX đến ghế ngồi, từ âm thanh đến dịch vụ.',
  },
  {
    icon: <Zap size={22} className="text-amber-600" />,
    bg: 'bg-amber-50 border-amber-200',
    title: 'Công nghệ tiên tiến',
    desc: 'Ứng dụng công nghệ mới nhất để tối ưu trải nghiệm đặt vé, quản lý ghế theo thời gian thực và cá nhân hóa gợi ý phim cho từng người.',
  },
  {
    icon: <Headphones size={22} className="text-sky-600" />,
    bg: 'bg-sky-50 border-sky-200',
    title: 'Dịch vụ tận tâm',
    desc: 'Đội ngũ hỗ trợ 24/7 luôn sẵn sàng giải đáp mọi thắc mắc, xử lý phản hồi và đảm bảo bạn có trải nghiệm hoàn hảo từ đầu đến cuối.',
  },
];

const milestones = [
  { year: '2019', title: 'Thành lập', desc: 'Nova Cinema ra đời tại TP. Hồ Chí Minh với cụm rạp đầu tiên ở Quận 1, mang theo giấc mơ điện ảnh đẳng cấp.' },
  { year: '2020', title: 'Mở rộng ra Hà Nội', desc: 'Vượt qua thách thức của dịch bệnh, chúng tôi vẫn kiên định mở rạp thứ hai tại thủ đô, phục vụ khán giả miền Bắc.' },
  { year: '2022', title: 'Ra mắt ứng dụng', desc: 'Nền tảng đặt vé trực tuyến chính thức ra mắt, giúp khách hàng đặt vé mọi lúc mọi nơi chỉ với vài chạm.' },
  { year: '2023', title: 'Đà Nẵng & IMAX', desc: 'Khai trương cụm rạp miền Trung và nâng cấp màn hình IMAX đầu tiên tại Việt Nam thuộc hệ thống tư nhân.' },
  { year: '2024', title: '500K khách hàng', desc: 'Cột mốc nửa triệu khách hàng trung thành, khẳng định vị thế thương hiệu điện ảnh hàng đầu tại Việt Nam.' },
];

const team = [
  {
    name: 'Nguyễn Minh Tuấn',
    role: 'CEO & Co-founder',
    avatar: 'MT',
    avatarBg: 'from-brand-dark to-brand text-zinc-950',
    quote: '"Điện ảnh không chỉ là giải trí – đó là nghệ thuật kết nối con người."',
  },
  {
    name: 'Trần Thị Lan Anh',
    role: 'COO & Co-founder',
    avatar: 'LA',
    avatarBg: 'from-sky-600 to-sky-400 text-white',
    quote: '"Chúng tôi không chỉ bán vé – chúng tôi bán những khoảnh khắc đáng nhớ."',
  },
  {
    name: 'Lê Hoàng Phúc',
    role: 'CTO',
    avatar: 'HP',
    avatarBg: 'from-emerald-600 to-emerald-400 text-white',
    quote: '"Công nghệ giúp nghệ thuật chạm đến nhiều người hơn, nhanh hơn và tiện lợi hơn."',
  },
  {
    name: 'Phạm Quỳnh Anh',
    role: 'Head of Experience',
    avatar: 'QA',
    avatarBg: 'from-rose-600 to-rose-400 text-white',
    quote: '"Mỗi chuyến đến rạp của bạn là một hành trình – chúng tôi muốn nó hoàn hảo."',
  },
];

const faqs = [
  {
    q: 'Làm sao để đặt vé xem phim trên Nova Cinema?',
    a: 'Bạn có thể đặt vé qua website hoặc ứng dụng di động. Chọn phim → Chọn suất chiếu → Chọn ghế → Thêm bắp nước (tùy chọn) → Thanh toán online. Cực kỳ nhanh chóng, chỉ vài phút!',
  },
  {
    q: 'Nova Cinema hỗ trợ những phương thức thanh toán nào?',
    a: 'Chúng tôi hỗ trợ: Momo, ZaloPay, VNPay, thẻ tín dụng/ghi nợ Visa/Mastercard và thanh toán tiền mặt tại quầy.',
  },
  {
    q: 'Tôi có thể đổi/hoàn vé sau khi đặt không?',
    a: 'Vé có thể hoàn trước giờ chiếu 2 giờ. Phí hoàn vé là 20% giá vé. Vé đặt trong chương trình Flash Sale không được hoàn.',
  },
  {
    q: 'Chính sách thành viên và tích điểm của Nova Cinema?',
    a: 'Mỗi 10,000đ chi tiêu bạn nhận 1 điểm thưởng. Tích lũy đủ điểm để lên hạng thành viên (Bạc, Vàng, Kim Cương) và nhận ưu đãi độc quyền.',
  },
  {
    q: 'Nova Cinema có phòng chiếu dành cho trẻ em không?',
    a: 'Có! Chúng tôi có buổi chiếu Matinee đặc biệt cho gia đình vào buổi sáng cuối tuần với giá vé ưu đãi và không gian thân thiện với trẻ nhỏ.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl transition-all duration-200 overflow-hidden ${open ? 'border-brand bg-brand/5' : 'border-zinc-200 bg-white'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-bold text-zinc-800 pr-4">{q}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-brand" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-zinc-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-zinc-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          {a}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const AboutPage = () => {
  return (
    <div className="space-y-16 pb-16">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-200 bg-white text-center py-16 px-8 md:px-20 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,208,104,0.12),transparent_70%)] pointer-events-none" />
        {/* Decorative dots */}
        <div className="absolute top-6 left-6 w-2 h-2 rounded-full bg-brand/40 animate-pulse" />
        <div className="absolute top-10 right-10 w-1.5 h-1.5 rounded-full bg-brand/30 animate-pulse delay-300" />
        <div className="absolute bottom-6 left-16 w-1 h-1 rounded-full bg-brand/20 animate-pulse delay-700" />

        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand/15 border border-brand/30 text-zinc-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            <Heart size={12} className="text-brand" />
            Câu chuyện của chúng tôi
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 leading-tight">
            Về <span className="text-brand">Nova Cinema</span>
          </h1>
          <p className="text-zinc-600 text-sm md:text-base leading-relaxed font-medium">
            Chúng tôi không chỉ là một hệ thống rạp chiếu phim. Nova Cinema là nơi nghệ thuật điện ảnh 
            gặp gỡ công nghệ hiện đại, mang đến những trải nghiệm xem phim đáng nhớ cho hàng triệu khán giả Việt Nam.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              to="/movies"
              className="bg-[#f4d068] hover:bg-[#f3c647] text-zinc-950 text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[#f4d068]/20 active:scale-95"
            >
              Khám phá phim
            </Link>
            <Link
              to="/theaters"
              className="bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-sm font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95"
            >
              Tìm rạp gần bạn
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col items-center gap-2 text-center hover:border-brand/40 transition-colors shadow-sm">
            {s.icon}
            <span className="text-3xl font-black text-zinc-900">{s.value}</span>
            <span className="text-xs text-zinc-500 font-medium leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Mission ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-12 md:pb-20 border-b border-zinc-100">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 text-zinc-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <Trophy size={11} className="text-brand" /> Sứ mệnh
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 leading-tight">
            Đưa điện ảnh đến<br />
            <span className="text-brand">gần hơn với bạn</span>
          </h2>
          <p className="text-zinc-600 text-sm leading-relaxed font-medium">
            Nova Cinema được thành lập với sứ mệnh dân chủ hóa trải nghiệm điện ảnh đỉnh cao tại Việt Nam. 
            Chúng tôi tin rằng mọi người đều xứng đáng được thưởng thức bộ phim yêu thích trên màn hình lớn 
            với chất lượng hình ảnh và âm thanh tốt nhất.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            Từ IMAX 4K đến những suất chiếu sáng tạo theo chủ đề, chúng tôi không ngừng đổi mới để 
            mỗi lần đến rạp là một kỷ niệm đáng nhớ.
          </p>
        </div>

        {/* Visual collage */}
        <div className="grid grid-cols-2 gap-3 h-64 md:h-80">
          <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 h-full">
            <img
              src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80"
              alt="Cinema"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
          <div className="flex flex-col gap-3 h-full justify-between">
            <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 h-[47%]">
              <img
                src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80"
                alt="IMAX"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 h-[47%]">
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80"
                alt="Seats"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Core Values ── */}
      <div className="space-y-6 pt-16 md:pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-900">Giá trị cốt lõi</h2>
          <p className="text-zinc-500 text-sm mt-1">Những nguyên tắc định hình mọi quyết định của chúng tôi</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((v, i) => (
            <div key={i} className={`bg-white border ${v.bg} rounded-2xl p-5 space-y-3 hover:scale-[1.02] transition-transform duration-200 shadow-sm`}>
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-white shadow-sm">
                {v.icon}
              </div>
              <h3 className="font-black text-zinc-800 text-sm">{v.title}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-900">Câu hỏi thường gặp</h2>
          <p className="text-zinc-500 text-sm mt-1">Giải đáp những thắc mắc phổ biến nhất</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* ── Contact CTA ── */}
      <div className="bg-gradient-to-br from-brand/10 via-white to-zinc-50 border border-brand/20 rounded-3xl p-8 md:p-12 text-center space-y-5 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-black text-zinc-900">Cần hỗ trợ?</h2>
        <p className="text-zinc-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
          Đội ngũ Nova Cinema luôn sẵn sàng lắng nghe và hỗ trợ bạn. Liên hệ với chúng tôi qua các kênh dưới đây.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:support@novacinema.vn"
            className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Mail size={15} className="text-brand" />
            support@novacinema.vn
          </a>
          <a
            href="tel:19009090"
            className="flex items-center gap-2 bg-[#f4d068] hover:bg-[#f3c647] text-zinc-950 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#f4d068]/20"
          >
            <Phone size={15} />
            Hotline: 1900 9090
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;