import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, User, LogOut, LayoutDashboard, History } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import myLogo from '../../assets/images/logo.png';

export const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-brand font-bold' : 'text-zinc-300 hover:text-white';
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
            Home
          </Link>
          <Link to="/movies" className={`${isActive('/movies')} transition-colors`}>
            Phim
          </Link>
          <a href="#" className="text-zinc-300 hover:text-white transition-colors">
            Khuyến mãi
          </a>
          <a href="#" className="text-zinc-300 hover:text-white transition-colors">
            Rạp
          </a>
          <a href="#" className="text-zinc-300 hover:text-white transition-colors">
            Về chúng tôi
          </a>
          {isAuthenticated && (
            <Link to="/history" className={`${isActive('/history')} flex items-center gap-1.5 transition-colors`}>
              <History size={16} /> Vé của tôi
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
                  <span>Quản trị</span>
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
                title="Đăng xuất"
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
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-block text-zinc-300 hover:text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Quick Book Ticket Button from mockup */}
          <Link
            to="/movies"
            className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-[0_4px_12px_rgba(168,85,247,0.3)] transition-all transform active:scale-95 uppercase tracking-wider"
          >
            Đặt vé
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;