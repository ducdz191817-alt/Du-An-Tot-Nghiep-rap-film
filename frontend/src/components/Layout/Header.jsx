import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, User, LogOut, LayoutDashboard, History, Bell, X, Hourglass, CreditCard } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import bookingService from '../../services/booking.service';
import myLogo from '../../assets/images/logo.png';

// Flag SVGs (Vietnamese & US/UK English)
const VNFlag = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 rounded-full overflow-hidden inline-block shrink-0 shadow-sm border border-gray-200">
    <rect width="24" height="24" fill="#da251d" />
    <polygon points="12,5 13.85,10.7 18.7,10.7 14.78,13.55 16.27,19.25 12,15.7 7.73,19.25 9.22,13.55 5.3,10.7 10.15,10.7" fill="#ffff00" />
  </svg>
);

const USFlag = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 rounded-full overflow-hidden inline-block shrink-0 shadow-sm border border-gray-200">
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
  const [bellOpen, setBellOpen]             = useState(false);
  const [pendingBookings, setPendingBookings] = useState([]);
  const dropdownRef = useRef(null);
  const bellRef     = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (bellRef.current     && !bellRef.current.contains(event.target))     setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load pending bookings of the current user
  useEffect(() => {
    if (!isAuthenticated) { setPendingBookings([]); return; }
    const loadPending = async () => {
      try {
        const res = await bookingService.getMyBookings();
        const list = Array.isArray(res) ? res : (res?.data || []);
        setPendingBookings(list.filter(b => b.paymentStatus === 'pending'));
      } catch (_) {}
    };
    loadPending();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-brand font-bold' : 'text-gray-600 hover:text-gray-900';
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <img 
            src={myLogo} 
            alt="Nova Cinematic Logo" 
            className="h-16 w-auto object-contain group-hover:scale-105 transition-transform brightness-50 contrast-150" 
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
                  className="hidden sm:flex items-center space-x-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg font-bold transition-all duration-300"
                >
                  <LayoutDashboard size={14} />
                  <span>{t('nav.admin')}</span>
                </Link>
              )}

              {/* 🔔 Thông báo đơn chưa thanh toán */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen(!bellOpen)}
                  className={`relative p-2 rounded-xl transition-all ${
                    pendingBookings.length > 0
                      ? 'text-amber-500 hover:bg-amber-50'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Thông báo"
                >
                  <Bell size={18} />
                  {pendingBookings.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {pendingBookings.length > 9 ? '9+' : pendingBookings.length}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {bellOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-80 bg-white border border-gray-200 rounded-2xl shadow-[0_20px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-800">Thông báo</p>
                      <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {pendingBookings.length > 0 ? (
                        pendingBookings.map((b) => {
                          const movie = b.showtime?.movie || {};
                          const startTime = b.showtime?.startTime ? new Date(b.showtime.startTime) : null;
                          return (
                            <div
                              key={b._id}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => { navigate('/history'); setBellOpen(false); }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                  <CreditCard size={13} className="text-amber-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">Thanh toán vé phim {movie.title || 'Phim'}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {startTime ? startTime.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                  </p>
                                  <p className="text-[11px] font-black text-amber-600 mt-1">
                                    {(b.totalPrice || 0).toLocaleString()} VND
                                  </p>
                                </div>
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0 self-start mt-0.5">
                                  Chưa TT
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-gray-400">Chưa có thông báo mới</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown Profile mock */}
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-xs uppercase">
                  {user.username.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:inline">{user.username}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-brand transition-colors p-2 rounded-lg hover:bg-gray-100"
                title={t('nav.logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-gray-600 text-sm font-bold">
              <User size={18} strokeWidth={2} className="text-gray-700 shrink-0" />
              <div className="flex items-center uppercase tracking-wide">
                <Link
                  to="/login"
                  className="hover:text-brand transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <span className="text-gray-400">/</span>
                <Link
                  to="/register"
                  className="hover:text-brand transition-colors pl-1"
                >
                  {t('nav.register')}
                </Link>
              </div>
            </div>
          )}

          {/* Language Selector Dropdown (Vietnam & English) */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            >
              {language === 'vi' ? <VNFlag /> : <USFlag />}
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">{language === 'vi' ? 'VN' : 'ENG'}</span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-xl bg-white border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-1">
                <button
                  onClick={() => selectLanguage('vi')}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-left transition-all ${
                    language === 'vi' 
                      ? 'bg-red-500 text-white font-black shadow-[0_2px_8px_rgba(220,38,38,0.3)]' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <VNFlag />
                  <span className="text-xs font-black uppercase tracking-wider">VN</span>
                </button>
                <button
                  onClick={() => selectLanguage('en')}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-left transition-all ${
                    language === 'en' 
                      ? 'bg-blue-500 text-white font-black shadow-[0_2px_8px_rgba(37,99,235,0.3)]' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
            className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-[0_4px_12px_rgba(200,135,43,0.3)] transition-all transform active:scale-95 uppercase tracking-wider"
          >
            {t('nav.bookNow')}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;