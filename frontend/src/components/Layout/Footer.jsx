import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Shield, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import myLogo from '../../assets/images/logo.png';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1a1a2e] border-t border-[#2a2a40] py-14 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left branding */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center group w-max">
            <img 
              src={myLogo} 
              alt="Nova Cinematic Logo" 
              className="h-16 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </Link>
          <p className="text-xs leading-relaxed text-gray-500">
            {t('footer.desc')}
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-gray-100 font-extrabold mb-4 uppercase tracking-wider text-sm">{t('footer.explore')}</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.nowShowing')}</a></li>
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.comingSoon')}</a></li>
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.theaters')}</a></li>
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.promotions')}</a></li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 className="text-gray-100 font-extrabold mb-4 uppercase tracking-wider text-sm">{t('footer.support')}</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.terms')}</a></li>
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.refund')}</a></li>
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.faq')}</a></li>
            <li><a href="#" className="hover:text-gray-300 transition-colors">{t('footer.privacy')}</a></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="space-y-3.5 text-sm">
          <h4 className="text-gray-100 font-extrabold mb-4 uppercase tracking-wider text-sm">{t('footer.contact')}</h4>
          <p className="flex items-start gap-2">
            <MapPin size={14} className="text-brand shrink-0" />
            <span>123 Hoàng Quốc Việt, Phường Cầu Giấy, Quận Cầu Giấy, Hà Nội</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone size={14} className="text-brand shrink-0" />
            <span>1900 9090</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-[#2a2a40] flex flex-col sm:flex-row items-center justify-between text-sm gap-4">
        <p>&copy; {new Date().getFullYear()} Nova Cinematic Inc. {t('footer.rights')}</p>
        <div className="flex space-x-6 text-gray-600">
          <a href="#" className="hover:text-gray-400 transition-colors"><Github size={16} /></a>
          <a href="#" className="hover:text-gray-400 transition-colors"><Shield size={16} /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;