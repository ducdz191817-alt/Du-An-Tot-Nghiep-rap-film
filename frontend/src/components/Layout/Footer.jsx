import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Shield, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import myLogo from '../../assets/images/logo.png';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0a0a0c] border-t border-dark-border py-12 text-zinc-500 text-sm">
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
          <p className="text-xs leading-relaxed text-zinc-500">
            {t('footer.desc')}
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-zinc-200 font-bold mb-4 uppercase tracking-wider text-xs">{t('footer.explore')}</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.nowShowing')}</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.comingSoon')}</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.theaters')}</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.promotions')}</a></li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 className="text-zinc-200 font-bold mb-4 uppercase tracking-wider text-xs">{t('footer.support')}</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.terms')}</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.refund')}</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.faq')}</a></li>
            <li><a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.privacy')}</a></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="space-y-3 text-xs">
          <h4 className="text-zinc-200 font-bold mb-4 uppercase tracking-wider text-xs">{t('footer.contact')}</h4>
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
        <p>&copy; {new Date().getFullYear()} Nova Cinematic Inc. {t('footer.rights')}</p>
        <div className="flex space-x-6 text-zinc-600">
          <a href="#" className="hover:text-zinc-400 transition-colors"><Github size={16} /></a>
          <a href="#" className="hover:text-zinc-400 transition-colors"><Shield size={16} /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;