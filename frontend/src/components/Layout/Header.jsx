import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, User, LogOut, LayoutDashboard, History } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import myLogo from '../../assets/images/logo.png';

// Flag SVGs (Vietnamese & US/UK English)
const VNFlag = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 rounded-full overflow-hidden inline-block shrink-0 shadow-sm border border-zinc-700/50">
    <rect width="24" height="24" fill="#da251d" />
    <polygon points="12,5 13.85,10.7 18.7,10.7 14.78,13.55 16.27,19.25 12,15.7 7.73,19.25 9.22,13.55 5.3,10.7 10.15,10.7" fill="#ffff00" />
  </svg>
);

const USFlag = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 rounded-full overflow-hidden inline-block shrink-0 shadow-sm border border-zinc-700/50">
    <rect width="24" height="24" fill="#fff" />
    <rect width="24" height="1.85" y="0" fill="#b22234" />
    <rect width="24" height="1.85" y="3.7" fill="#b22234" />
    <rect width="24" height="1.85" y="7.4" fill="#b22234" />
    <rect width="24" height="1.85" y="11.1" fill="#b22234" />
    <rect width="24" height="1.85" y="14.8" fill="#b22234" />
    <rect width="24" height="1.85" y="18.5" fill="#b22234" />
    <rect width="24" height="1.85" y="22.2" fill="#b22234" />
    <rect width="11" height="12.95" fill="#3c3b6e" />
    <circle cx="2.5" cy="2.5" r="0.6" fill="#fff" />
    <circle cx="5.5" cy="2.5" r="0.6" fill="#fff" />
    <circle cx="8.5" cy="2.5" r="0.6" fill="#fff" />
    <circle cx="4" cy="4.5" r="0.6" fill="#fff" />
    <circle cx="7" cy="4.5" r="0.6" fill="#fff" />
    <circle cx="2.5" cy="6.5" r="0.6" fill="#fff" />
    <circle cx="5.5" cy="6.5" r="0.6" fill="#fff" />
    <circle cx="8.5" cy="6.5" r="0.6" fill="#fff" />
    <circle cx="4" cy="8.5" r="0.6" fill="#fff" />
    <circle cx="7" cy="8.5" r="0.6" fill="#fff" />
    <circle cx="2.5" cy="10.5" r="0.6" fill="#fff" />
    <circle cx="5.5" cy="10.5" r="0.6" fill="#fff" />
    <circle cx="8.5" cy="10.5" r="0.6" fill="#fff" />
  </svg>
);

export const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-brand font-bold' : 'text-zinc-300 hover:text-white';
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-dark-deep/80 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <img 
            src={myLogo} 
            alt="Nova Cinematic Logo" 
            className="h-16 w-auto object-contain group-hover:scale-105 transition-transform" 
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
          <Link to="/" className={`${isActive('/')} transition-colors`}>
            {t('nav.home')}
          </Link>
          <Link to="/movies" className={`${isActive('/movies')} transition-colors`}>
            {t('nav.movies')}
          </Link>
          <Link to="/promotions" className={`${isActive('/promotions')} transition-colors`}>
            {t('nav.promotions')}
          </Link>
          <Link to="/theaters" className={`${isActive('/theaters')} transition-colors`}>
            {t('nav.theaters')}
          </Link>
          <Link to="/about" className={`${isActive('/about')} transition-colors`}>
            {t('nav.about')}
          </Link>
          {isAuthenticated && (
            <Link to="/history" className={`${isActive('/history')} flex items-center gap-1.5 transition-colors`}>
              <History size={16} /> {t('nav.myTickets')}
            </Link>
          )}
        </nav>

        {/* Auth status / CTA */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center space-x-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg font-bold transition-all duration-300"
                >
                  <LayoutDashboard size={14} />
                  <span>{t('nav.admin')}</span>
                </Link>
              )}
              
              {/* User Dropdown Profile mock */}
              <div className="flex items-center space-x-2 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-xs uppercase">
                  {user.username.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-zinc-200 hidden sm:inline">{user.username}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-brand transition-colors p-2 rounded-lg hover:bg-zinc-900"
                title={t('nav.logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-zinc-300 hover:text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-block text-zinc-300 hover:text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}

          {/* Language Selector Dropdown (Vietnam & English) */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-zinc-900/60 transition-colors focus:outline-none"
            >
              {language === 'vi' ? <VNFlag /> : <USFlag />}
              <span className="text-sm font-bold text-white uppercase tracking-wider">{language === 'vi' ? 'VN' : 'ENG'}</span>
              <svg className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-xl bg-dark-deep border border-dark-border shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-1">
                <button
                  onClick={() => selectLanguage('vi')}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-left transition-all ${
                    language === 'vi' 
                      ? 'bg-red-600 text-white font-black shadow-[0_2px_8px_rgba(220,38,38,0.4)]' 
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <VNFlag />
                  <span className="text-xs font-black uppercase tracking-wider">VN</span>
                </button>
                <button
                  onClick={() => selectLanguage('en')}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-left transition-all ${
                    language === 'en' 
                      ? 'bg-blue-600 text-white font-black shadow-[0_2px_8px_rgba(37,99,235,0.4)]' 
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <USFlag />
                  <span className="text-xs font-black uppercase tracking-wider">ENG</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Book Ticket Button from mockup */}
          <Link
            to="/movies"
            className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-[0_4px_12px_rgba(168,85,247,0.3)] transition-all transform active:scale-95 uppercase tracking-wider"
          >
            {t('nav.bookNow')}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;