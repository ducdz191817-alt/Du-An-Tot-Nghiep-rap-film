import React, { useState } from 'react';
import { MapPin, Phone, Clock, Star, Zap, Tv2, MonitorPlay, Check } from 'lucide-react';

const theater = {
  name: 'Nova Cinema Hà Nội',
  badge: 'Flagship Store',
  city: 'Hà Nội',
  address: '123 Hoàng Quốc Việt, Phường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
  phone: '1900 9090',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.8638!2d105.7958!3d21.0381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAyJzE3LjIiTiAxMDXCsDQ3JzQ0LjkiRQ!5e0!3m2!1sen!2s!4v0',
  image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
  hours: [
    { day: 'Thứ 2 – Thứ 6', time: '08:30 – 23:30' },
    { day: 'Thứ 7 – Chủ Nhật', time: '08:00 – 00:00' },
    { day: 'Lễ & Tết', time: '07:30 – 00:30' },
  ],
  rooms: [
    { name: 'Phòng 1', type: 'IMAX',      seats: 120, icon: <Zap size={15} className="text-amber-600" />,  bg: 'bg-amber-50' },
    { name: 'Phòng 2', type: '3D',        seats: 80,  icon: <Tv2 size={15} className="text-blue-600" />,   bg: 'bg-blue-50' },
    { name: 'Phòng 3', type: '2D',        seats: 60,  icon: <MonitorPlay size={15} className="text-zinc-600" />, bg: 'bg-zinc-50' },
    { name: 'Phòng 4', type: 'GOLDCLASS', seats: 30,  icon: <Star size={15} className="text-purple-600" />, bg: 'bg-purple-50' },
  ],
  facilities: ['Bắp rang bơ Nova', 'Cocktail bar', 'Ghế massage VIP', 'Bãi xe ô tô miễn phí'],
};

const TheatersPage = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 text-zinc-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mx-auto">
          <MapPin size={12} className="text-brand" />
          Hệ thống rạp chiếu phim
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-zinc-900 leading-tight">
          Nova Cinema <span className="text-brand">Hà Nội</span>
        </h1>
        <p className="text-zinc-600 max-w-xl mx-auto text-sm leading-relaxed font-semibold">
          Trải nghiệm điện ảnh đỉnh cao tại chi nhánh Flagship với màn hình chuẩn chiếu phim IMAX, 3D cùng hệ thống âm thanh vòm đỉnh cao.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
        {/* Left: Image + Stats */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden border border-zinc-200 shadow-md group shrink-0">
            <img
              src={theater.image}
              alt={theater.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="bg-brand text-zinc-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                {theater.badge}
              </span>
            </div>
            <div className="absolute bottom-6 left-6 space-y-1.5 text-white">
              <h2 className="text-xl md:text-2xl font-black">{theater.name}</h2>
              <p className="text-xs text-zinc-300 flex items-center gap-1 font-medium">
                <MapPin size={13} className="text-brand" /> {theater.address}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Khu vực',        value: 'Hà Nội',   desc: '123 Hoàng Quốc Việt', color: 'text-brand' },
              { label: 'Số phòng chiếu', value: '4 Phòng',  desc: 'IMAX, 3D, 2D, VIP',   color: 'text-sky-600' },
              { label: 'Tổng ghế ngồi',  value: '290 Ghế',  desc: 'Chất lượng cao',       color: 'text-purple-600' },
            ].map((s, idx) => (
              <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-center text-center shadow-sm">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{s.label}</span>
                <p className={`text-base font-black ${s.color} mt-1`}>{s.value}</p>
                <span className="text-[10px] text-zinc-500 font-semibold mt-0.5 leading-tight">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail Card */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6 h-full">
            {/* Contact */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-zinc-800 border-b border-zinc-100 pb-2 uppercase tracking-wide">
                Thông tin liên hệ
              </h3>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-800 font-bold">Địa chỉ chi nhánh</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold mt-0.5">{theater.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-brand shrink-0" />
                <div>
                  <p className="text-xs text-zinc-800 font-bold">Hotline liên hệ</p>
                  <a href={`tel:${theater.phone.replace(/\s/g, '')}`} className="text-[11px] text-brand hover:underline font-black">
                    {theater.phone} (Đặt vé & giải đáp)
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-zinc-800 border-b border-zinc-100 pb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={15} className="text-brand" /> Giờ hoạt động
              </h3>
              <div className="space-y-1.5">
                {theater.hours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-500">{h.day}</span>
                    <span className="text-zinc-800 font-bold">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-zinc-800 border-b border-zinc-100 pb-2 uppercase tracking-wide">
                Các loại phòng chiếu
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {theater.rooms.map((room) => (
                  <div key={room.name} className="flex items-center gap-2 p-2 rounded-xl border border-zinc-100 bg-zinc-50/50">
                    <div className={`p-1.5 rounded-lg ${room.bg}`}>
                      {room.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black text-zinc-800 leading-none">{room.type}</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-1">{room.seats} ghế</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facilities */}
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
            <div className="pt-2">
              <a
                href="/movies"
                className="block w-full text-center bg-[#f4d068] hover:bg-[#f3c647] text-zinc-950 text-xs font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-[#f4d068]/20 active:scale-95"
              >
                Đặt vé xem phim tại đây
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-6xl mx-auto space-y-3">
        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-wide px-1">
          Bản đồ đường đi đến rạp
        </h3>
        <div className="rounded-3xl overflow-hidden border border-zinc-200 h-[300px] shadow-sm">
          <iframe
            src={theater.mapEmbed}
            className="w-full h-full"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title={`Bản đồ ${theater.name}`}
          />
        </div>
      </div>
    </div>
  );
};

export default TheatersPage;
