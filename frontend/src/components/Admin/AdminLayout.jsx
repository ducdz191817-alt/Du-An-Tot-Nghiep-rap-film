import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Film, Calendar, Building2, Coffee,
  Ticket, BarChart3, LogOut, Menu, ChevronRight,
  Clapperboard, Zap, Bell, ChevronDown, Activity, Users,
  Hourglass, X, AlertCircle, Tag,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import adminService from '../../services/admin.service';

const NAV_ITEMS = [
  {
    group: 'Tổng quan',
    items: [
      { key: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Nội dung',
    items: [
      { key: 'movies',     label: 'Quản lý Phim',       icon: Film },
      { key: 'showtimes',  label: 'Lịch chiếu',          icon: Calendar },
      { key: 'rooms',      label: 'Rạp & Phòng chiếu',   icon: Building2 },
      { key: 'concessions',label: 'Bắp nước & Combo',    icon: Coffee },
    ]
  },
  {
    group: 'Giao dịch',
    items: [
      { key: 'bookings', label: 'Đặt vé',           icon: Ticket },
      { key: 'coupons',  label: 'Mã giảm giá',      icon: Tag },
      { key: 'revenue',  label: 'Báo cáo doanh thu', icon: BarChart3 },
    ]
  },
  {
    group: 'Hệ thống',
    items: [
      { key: 'users', label: 'Người dùng', icon: Users },
    ]
  },
];

const AdminLayout = ({ activeTab, setActiveTab, children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [collapsed, setCollapsed]       = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [bellOpen, setBellOpen]         = useState(false);
  const [pendingBookings, setPendingBookings] = useState([]);
  const profileRef = useRef(null);
  const bellRef    = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (bellRef.current    && !bellRef.current.contains(e.target))    setBellOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Fetch pending bookings for notifications
  useEffect(() => {
    const loadPending = async () => {
      try {
        const data = await adminService.getBookings();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setPendingBookings(list.filter(b => b.paymentStatus === 'pending'));
      } catch (_) {}
    };
    loadPending();
    const interval = setInterval(loadPending, 60000); // Refresh mỗi 1 phút
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleNav    = (key) => { setActiveTab(key); setSidebarOpen(false); };

  const currentLabel = NAV_ITEMS.flatMap(g => g.items).find(i => i.key === activeTab)?.label || 'Admin';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#faf7f2', fontFamily:'Outfit, Inter, sans-serif' }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(4px)' }}
        />
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, height: '100%',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        background: '#0d0d12',
        borderRight: '1px solid #1a1a28',
        transition: 'width 0.3s ease, transform 0.3s ease',
        width: collapsed ? 72 : 256,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        flexShrink: 0,
      }}
      className="admin-sidebar"
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: collapsed ? '0 16px' : '0 20px',
          height: 64,
          borderBottom: '1px solid #1a1a28',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}>
          <div style={{ position:'relative', flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
            }}>
              <Clapperboard size={18} color="white" />
            </div>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 10, height: 10, background: '#34d399', borderRadius: '50%',
              border: '2px solid #0d0d12',
            }} />
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, color: 'white', fontSize: 14, letterSpacing: '-0.02em' }}>CineAdmin</div>
              <div style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Management</div>
            </div>
          )}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, borderRadius: 6,
              background: 'transparent', border: 'none',
              color: '#52525b', cursor: 'pointer',
              marginLeft: collapsed ? 'auto' : undefined,
            }}
          >
            <ChevronRight size={14} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {NAV_ITEMS.map(group => (
            <div key={group.group} style={{ marginBottom: 8 }}>
              {!collapsed ? (
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: '#94a3b8',
                  padding: '10px 20px 6px',
                }}>
                  {group.group}
                </p>
              ) : (
                <div style={{ height: 1, background: '#1a1a28', margin: '8px 16px' }} />
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.key)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      width: collapsed ? 44 : 'calc(100% - 16px)',
                      margin: collapsed ? '2px auto' : '1px 8px',
                      display: 'flex', alignItems: 'center',
                      gap: 10, padding: '9px 12px',
                      borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: isActive ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      fontWeight: isActive ? 700 : 600, fontSize: 14,
                      textAlign: 'left', position: 'relative',
                      transition: 'all 0.15s',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#cbd5e1';
                      }
                    }}
                  >
                    {isActive && (
                      <span style={{
                        position: 'absolute', left: 0, top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4, height: 20,
                        background: 'linear-gradient(to bottom, #a855f7, #c084fc)',
                        borderRadius: '0 4px 4px 0',
                      }} />
                    )}
                    <Icon size={17} color={isActive ? '#c4b5fd' : undefined} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user area */}
        <div style={{ padding: 12, borderTop: '1px solid #1a1a28', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Đăng xuất' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: '9px 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#9ca3af',
              fontWeight: 600, fontSize: 13,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        marginLeft: collapsed ? 72 : 256,
        transition: 'margin-left 0.3s ease',
        minWidth: 0, overflow: 'hidden',
      }}>
        {/* Top bar */}
        <header style={{
          height: 64, display: 'flex', alignItems: 'center', gap: 16,
          padding: '0 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e0d5',
          flexShrink: 0, zIndex: 10,
        }}>
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', padding: 8, borderRadius: 8, border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer' }}
            className="admin-mobile-menu"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Clapperboard size={14} color="#8b5cf6" />
            <ChevronRight size={12} color="#9ca3af" />
            <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{currentLabel}</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: '#6b7280', fontWeight: 700,
            background: '#f5f0e8', border: '1px solid #e5e0d5',
            padding: '5px 10px', borderRadius: 8,
          }}>
            <Activity size={12} color="#34d399" />
            Live
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
          </div>

          {/* Bell – Thông báo đơn chưa thanh toán */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              style={{
                padding: 8, borderRadius: 8, border: 'none',
                background: bellOpen ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: pendingBookings.length > 0 ? '#f59e0b' : '#6b7280',
                cursor: 'pointer', position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <Bell size={18} />
              {pendingBookings.length > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: '#ef4444', color: 'white',
                  fontSize: 9, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #ffffff', padding: '0 3px',
                }}>
                  {pendingBookings.length > 99 ? '99+' : pendingBookings.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {bellOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 360, background: '#ffffff',
                border: '1px solid #e5e0d5', borderRadius: 16,
                boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
                zIndex: 200, overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderBottom: '1px solid #e5e0d5',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Hourglass size={13} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a2e' }}>Nhắc nhở thanh toán</div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>
                        {pendingBookings.length} đơn chưa thanh toán
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setBellOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* List */}
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {pendingBookings.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                      <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                      <p>Không có đơn nào chưa thanh toán</p>
                    </div>
                  ) : (
                    pendingBookings.slice(0, 8).map((b, idx) => {
                      const movie = b.showtime?.movie || {};
                      const user  = b.user || {};
                      const startTime = b.showtime?.startTime ? new Date(b.showtime.startTime) : null;
                      const isLast = idx === Math.min(pendingBookings.length, 8) - 1;
                      return (
                        <div
                          key={b._id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: isLast ? 'none' : '1px solid #e5e0d5',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f5f0e8'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => { setActiveTab('bookings'); setBellOpen(false); }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <AlertCircle size={14} color="#f59e0b" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user.username || 'Khách'} — {movie.title || 'Phim đã xóa'}
                            </div>
                            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                              {startTime ? startTime.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
                              {(b.totalPrice || 0).toLocaleString()} VND — Chờ thanh toán
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {pendingBookings.length > 0 && (
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e0d5' }}>
                    <button
                      onClick={() => { setActiveTab('bookings'); setBellOpen(false); }}
                      style={{
                        width: '100%', padding: '8px 12px',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 10, color: '#f59e0b', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                    >
                      Xem tất cả {pendingBookings.length} đơn chưa thanh toán →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 24, background: '#e5e0d5' }} />

          {/* Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 8,
                border: 'none', background: 'transparent', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f0e8'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: 11,
              }}>
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{user?.username || 'Admin'}</span>
              <ChevronDown size={13} color="#9ca3af" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 8,
                width: 200, background: '#ffffff',
                border: '1px solid #e5e0d5', borderRadius: 14,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e0d5' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{user?.username}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
                <div style={{ padding: 6 }}>
                  <button
                    onClick={() => { navigate('/'); setProfileOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      color: '#6b7280', fontSize: 12, fontWeight: 600,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f0e8'; e.currentTarget.style.color = '#1a1a2e'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                  >
                    <Zap size={13} /> Về trang chủ
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      color: '#f87171', fontSize: 12, fontWeight: 600,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={13} /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto', padding: '28px',
          scrollbarWidth: 'thin', scrollbarColor: '#2a2a35 transparent',
        }}>
          <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-mobile-menu { display: flex !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
