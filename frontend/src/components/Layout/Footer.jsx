import React from 'react';
import { Film, Github, Shield, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#0a0a0c] border-t border-dark-border py-12 text-zinc-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left branding */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="bg-brand p-1.5 rounded-lg">
              <Film className="text-white" size={16} />
            </div>
            <span className="text-lg font-black text-white tracking-wider uppercase">
              Nova <span className="text-brand">Cinematic</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Tận hưởng trải nghiệm đặt vé xem phim tuyệt vời. Lựa chọn ghế ngồi ưng ý, đồ ăn vặt hấp dẫn và thanh toán an toàn chỉ với vài cú nhấp chuột.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-zinc-200 font-bold mb-4 uppercase tracking-wider text-xs">Khám phá</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Phim đang chiếu</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Phim sắp chiếu</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Hệ thống rạp</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Khuyến mãi</a></li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 className="text-zinc-200 font-bold mb-4 uppercase tracking-wider text-xs">Hỗ trợ & Pháp lý</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Điều khoản sử dụng</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Chính sách hoàn tiền</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Câu hỏi thường gặp</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">Bảo mật thông tin</a></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="space-y-3 text-xs">
          <h4 className="text-zinc-200 font-bold mb-4 uppercase tracking-wider text-xs">Liên hệ</h4>
          <p className="flex items-start gap-2">
            <MapPin size={14} className="text-brand shrink-0" />
            <span>Tầng B1, Landmark 81, Quận Bình Thạnh, TP.HCM</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone size={14} className="text-brand shrink-0" />
            <span>1900 6017</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
        <p>&copy; {new Date().getFullYear()} Nova Cinematic Inc. Bảo lưu mọi quyền.</p>
        <div className="flex space-x-6 text-zinc-600">
          <a href="#" className="hover:text-zinc-400 transition-colors"><Github size={16} /></a>
          <a href="#" className="hover:text-zinc-400 transition-colors"><Shield size={16} /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;  