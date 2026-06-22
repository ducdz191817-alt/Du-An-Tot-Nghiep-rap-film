import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Ticket, Film, Calendar, ArrowRight } from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTodayMonthString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  };

  const getTodayYearString = () => {
    return String(new Date().getFullYear());
  };

  const [filterType, setFilterType] = useState('all'); // 'all', 'date', 'month', 'year'
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [filterMonth, setFilterMonth] = useState(getTodayMonthString());
  const [filterYear, setFilterYear] = useState(getTodayYearString());
  const [isFiltering, setIsFiltering] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchStats = async () => {
      setIsFiltering(true);
      try {
        const params = {};
        if (filterType === 'date' && filterDate) {
          params.date = filterDate;
        } else if (filterType === 'month' && filterMonth) {
          params.month = filterMonth;
        } else if (filterType === 'year' && filterYear) {
          params.year = filterYear;
        }

        const result = await adminService.getDashboardStats(params);
        setStats(result.stats);
        setRecentBookings(result.recentBookings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setIsFiltering(false);
      }
    };
    fetchStats();
  }, [filterType, filterDate, filterMonth, filterYear]);

  if (loading) return <Loading />;

  const getTimeSuffix = () => {
    if (filterType === 'date' && filterDate) {
      try {
        const d = new Date(filterDate);
        return ` (${d.toLocaleDateString('vi-VN')})`;
      } catch {
        return ` (${filterDate})`;
      }
    }
    if (filterType === 'month' && filterMonth) {
      const [y, m] = filterMonth.split('-');
      return ` (${m}/${y})`;
    }
    if (filterType === 'year' && filterYear) {
      return ` (năm ${filterYear})`;
    }
    return '';
  };

  const cards = [
    {
      label: `Tổng doanh thu${getTimeSuffix()}`,
      value: `${stats?.totalRevenue !== undefined && stats?.totalRevenue !== null ? stats.totalRevenue.toLocaleString() : 0} VND`,
      icon: <TrendingUp size={24} className="text-emerald-500" />,
      bg: 'from-emerald-500/10 to-emerald-500/0 border-emerald-500/20',
    },
    {
      label: `Người dùng hoạt động${getTimeSuffix()}`,
      value: stats?.totalUsers || 0,
      icon: <Users size={24} className="text-blue-500" />,
      bg: 'from-blue-500/10 to-blue-500/0 border-blue-500/20',
    },
    {
      label: `Lượt đặt vé${getTimeSuffix()}`,
      value: stats?.totalBookings || 0,
      icon: <Ticket size={24} className="text-brand" />,
      bg: 'from-brand/10 to-brand/0 border-brand/20',
    },
    {
      label: 'Phim trên hệ thống',
      value: stats?.totalMovies || 0,
      icon: <Film size={24} className="text-purple-500" />,
      bg: 'from-purple-500/10 to-purple-500/0 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 0. Bộ lọc thời gian */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-card border border-dark-border p-5 rounded-3xl shadow-md">
        <div>
          <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">Bộ lọc doanh thu</h3>
          <p className="text-[11px] text-zinc-500 mt-1">Chọn lọc theo ngày, tháng hoặc năm để xem chi tiết doanh thu và danh sách giao dịch.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterDate(getTodayDateString());
              setFilterMonth(getTodayMonthString());
              setFilterYear(getTodayYearString());
            }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2.5 focus:border-brand outline-none cursor-pointer font-bold"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="date">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>

          {filterType === 'date' && (
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2.5 focus:border-brand outline-none font-bold select-none"
            />
          )}

          {filterType === 'month' && (
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2.5 focus:border-brand outline-none font-bold select-none"
            />
          )}

          {filterType === 'year' && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-4 py-2.5 focus:border-brand outline-none cursor-pointer font-bold"
            >
              <option value="">Chọn năm...</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          
          {isFiltering && (
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin ml-1" />
          )}
        </div>
      </div>

      {/* 1. Thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`bg-dark-card border rounded-3xl p-6 flex items-center justify-between shadow-md bg-gradient-to-br ${card.bg}`}
          >
            <div className="space-y-1">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-xl md:text-2xl font-black text-white block">{card.value}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shrink-0">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Bảng giao dịch gần đây */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-md space-y-6">
        <div>
          <h3 className="text-lg font-black text-zinc-200">
            {filterType === 'all' ? 'Giao dịch gần đây' : `Danh sách giao dịch${getTimeSuffix()}`}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {filterType === 'all'
              ? 'Nhật ký thời gian thực về các vé được người dùng mua gần nhất.'
              : `Hiển thị đầy đủ tất cả các giao dịch được ghi nhận trong thời gian lọc.`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <th className="pb-3 pl-4">Người dùng</th>
                <th className="pb-3">Phim</th>
                <th className="pb-3">Rạp</th>
                <th className="pb-3">Ghế</th>
                <th className="pb-3">Tổng thanh toán</th>
                <th className="pb-3 pr-4 text-right">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-xs font-semibold text-zinc-300">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-500 italic">
                    Chưa có giao dịch nào được ghi nhận trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 pl-4">
                      <div className="font-bold text-zinc-200">{b.user?.username || 'Khách'}</div>
                      <div className="text-[10px] text-zinc-500">{b.user?.email || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate">
                      {b.showtime?.movie?.title || 'Phim đã xóa'}
                    </td>
                    <td className="py-3.5 truncate">
                      {b.showtime?.theater?.name || 'Rạp đã xóa'}
                    </td>
                    <td className="py-3.5">
                      <span className="bg-zinc-900 border border-dark-border px-2.5 py-1 rounded font-black text-brand text-[10px]">
                        {b.seats.join(', ')}
                      </span>
                    </td>
                    <td className="py-3.5 font-black text-zinc-200">
                      {b.totalPrice.toLocaleString()} VND
                    </td>
                    <td className="py-3.5 pr-4 text-right text-zinc-500 font-bold">
                      {new Date(b.bookingDate).toLocaleDateString('vi-VN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;