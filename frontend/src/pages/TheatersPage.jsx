import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, ChevronDown, ChevronUp, Tv2, Star, Zap, MonitorPlay, Navigation, Loader2, Check } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────
const theatersData = [
  {
    id: 1,
    name: 'Nova Cinema Hà Nội',
    slug: 'hanoi',
    city: 'Hà Nội',
    address: '123 Hoàng Quốc Việt, Phường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
    phone: '1900 9090',
    hotline: '1900 9090',
    lat: 21.0464,
    lng: 105.7963,
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.8638!2d105.7958!3d21.0381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAyJzE3LjIiTiAxMDXCsDQ3JzQ0LjkiRQ!5e0!3m2!1sen!2s!4v0',
    hours: [
      { day: 'Thứ 2 – Thứ 6', time: '08:30 – 23:30' },
      { day: 'Thứ 7 – Chủ Nhật', time: '08:00 – 00:00' },
      { day: 'Lễ & Tết', time: '07:30 – 00:30' },
    ],
    rooms: [
      { name: 'Phòng 1', type: 'IMAX', seats: 120, icon: <Zap size={14} />, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
      { name: 'Phòng 2', type: '3D', seats: 80, icon: <Tv2 size={14} />, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
      { name: 'Phòng 3', type: '2D', seats: 60, icon: <MonitorPlay size={14} />, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
      { name: 'Phòng 4', type: 'GOLDCLASS', seats: 30, icon: <Star size={14} />, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    ],
    facilities: ['Bắp rang bơ Nova', 'Cocktail bar', 'Ghế massage VIP', 'Bãi xe miễn phí'],
    badge: 'Flagship',
    badgeColor: 'bg-brand text-white',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
  }
];



const TheaterCard = ({ theater }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden group hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={theater.image}
          alt={theater.name}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/40 to-transparent" />
        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md ${theater.badgeColor}`}>
            {theater.badge}
          </span>
          {theater.distance !== undefined && (
            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md bg-green-500/90 text-white flex items-center gap-1">
              <Navigation size={10} /> Cách bạn {theater.distance.toFixed(1)} km
            </span>
          )}
        </div>
        <div className="absolute bottom-4 left-4">
          <h3 className="text-lg font-black text-zinc-900 leading-tight drop-shadow-md">{theater.name}</h3>
          <p className="text-xs text-zinc-700 font-semibold flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {theater.city}
          </p>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-zinc-900 leading-tight">
          Nova Cinema <span className="text-brand">Hà Nội</span>
        </h1>
        <p className="text-zinc-600 max-w-xl mx-auto text-sm leading-relaxed font-semibold">
          Trải nghiệm điện ảnh đỉnh cao tại chi nhánh Flagship với màn hình chuẩn chiếu phim IMAX, 3D cùng hệ thống âm thanh vòm đỉnh cao.
        </p>
      </div>

      {/* Info */}
      <div className="p-5 space-y-4">
        {/* Address & Phone */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs text-zinc-600 font-medium">
            <MapPin size={13} className="mt-0.5 shrink-0 text-brand" />
            <span>{theater.address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
            <Phone size={13} className="shrink-0 text-brand" />
            <a href={`tel:${theater.phone.replace(/\s/g, '')}`} className="hover:text-brand transition-colors font-semibold text-zinc-700">
              {theater.phone}
            </a>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4 flex-1">
            {[
              { label: 'Cụm rạp duy nhất', value: 'Hà Nội', desc: '123 Hoàng Quốc Việt', color: 'text-brand' },
              { label: 'Số phòng chiếu', value: '4 Phòng', desc: 'IMAX, 3D, 2D, VIP', color: 'text-sky-600' },
              { label: 'Tổng ghế ngồi', value: '290 Ghế', desc: 'Chất lượng cao', color: 'text-purple-600' },
            ].map((s, idx) => (
              <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-center text-center shadow-sm">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{s.label}</span>
                <p className={`text-base font-black ${s.color} mt-1`}>{s.value}</p>
                <span className="text-[10px] text-zinc-500 font-semibold mt-0.5 leading-tight">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-zinc-500 hover:text-brand transition-colors py-1"
        >
          <span>Xem thêm thông tin</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

            {/* Operating Hours */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-zinc-800 border-b border-zinc-100 pb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={15} className="text-brand" /> Giờ hoạt động
              </h3>
              <div className="space-y-1.5">
                {theater.hours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 font-medium">{h.day}</span>
                    <span className="text-zinc-900 font-bold">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Facilities */}
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Tiện ích</p>
              <div className="flex flex-wrap gap-1.5">
                {theater.facilities.map((f) => (
                  <span key={f} className="text-[10px] bg-gray-50 border border-gray-200 text-zinc-600 font-medium rounded-lg px-2 py-1">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Facilities checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-zinc-800 border-b border-zinc-100 pb-2 uppercase tracking-wide">
                Tiện ích đi kèm
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {theater.facilities.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600 font-bold">
                    <Check size={14} className="text-green-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

        {/* CTA */}
        <a
          href="/movies"
          className="block w-full text-center bg-brand hover:bg-brand-dark text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-brand/20 active:scale-95"
        >
          Xem lịch chiếu tại đây
        </a>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const TheatersPage = () => {
  const [theaters, setTheaters] = useState(theatersData);
  const totalSeats = theaters.flatMap((t) => t.rooms).reduce((a, r) => a + r.seats, 0);

  return (
    <div className="space-y-10 pb-16">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-dark-border bg-gradient-to-br from-dark-card to-dark-deep p-8 md:p-14 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,135,43,0.08),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 text-brand px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            <MapPin size={12} />
            Hệ thống rạp chiếu phim
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 leading-tight">
            Rạp <span className="text-brand">Nova Cinema</span>
          </h1>
          <p className="text-zinc-600 max-w-lg mx-auto text-sm leading-relaxed font-medium">
            Rạp chiếu phim hiện đại với màn hình IMAX, 3D và trải nghiệm âm thanh đỉnh cao.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {[
          { label: 'Cụm rạp', value: theatersData.length, icon: <MapPin size={20} className="text-brand" /> },
          { label: 'Phòng chiếu', value: theatersData.flatMap((t) => t.rooms).length, icon: <Tv2 size={20} className="text-sky-500" /> },
          { label: 'Tổng ghế ngồi', value: totalSeats.toLocaleString(), icon: <Star size={20} className="text-amber-500" /> },
        ].map((s, i) => (
          <div key={i} className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-50 p-2.5 rounded-xl mb-0.5">
              {s.icon}
            </div>
            <span className="text-2xl font-black text-zinc-900">{s.value}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Theater Card */}
      <div className="flex justify-center max-w-5xl mx-auto">
        <div className="w-full max-w-3xl">
          {theaters.map((theater) => (
            <TheaterCard key={theater.id} theater={theater} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TheatersPage;
