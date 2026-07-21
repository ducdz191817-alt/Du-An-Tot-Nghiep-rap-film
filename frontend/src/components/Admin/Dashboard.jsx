import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Ticket, Film, Calendar, ArrowRight, Download, FileText } from 'lucide-react';
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

  const exportToExcel = () => {
    // UTF-16 LE CSV uses Tab (\t) as the standard delimiter for Excel compatibility
    let csvContent = `BÁO CÁO DOANH THU - CINEADMIN\r\n`;
    csvContent += `Thời gian lọc:\t${filterType === 'all' ? 'Tất cả thời gian' : filterType === 'date' ? filterDate : filterType === 'month' ? filterMonth : filterYear}\r\n`;
    csvContent += `Tổng doanh thu:\t${stats?.totalRevenue !== undefined && stats?.totalRevenue !== null ? stats.totalRevenue.toLocaleString() : 0} VND\r\n`;
    csvContent += `Người dùng hoạt động:\t${stats?.totalUsers || 0}\r\n`;
    csvContent += `Lượt đặt vé:\t${stats?.totalBookings || 0}\r\n`;
    csvContent += `Phim trên hệ thống:\t${stats?.totalMovies || 0}\r\n\r\n`;
    
    // Add Transaction Table Headers
    csvContent += `Người dùng\tEmail\tPhim\tRạp\tGhế\tTổng thanh toán\tNgày đặt\r\n`;
    
    // Add Transaction Rows
    recentBookings.forEach((b) => {
      const username = b.user?.username || 'Khách';
      const email = b.user?.email || 'N/A';
      const movie = b.showtime?.movie?.title || 'Phim đã xóa';
      const theater = b.showtime?.theater?.name || 'Rạp đã xóa';
      const seats = b.seats ? b.seats.join(' ') : '';
      const total = b.totalPrice || 0;
      const date = new Date(b.bookingDate).toLocaleDateString('vi-VN');
      
      const cleanVal = (val) => `"${String(val).replace(/"/g, '""')}"`;
      csvContent += `${cleanVal(username)}\t${cleanVal(email)}\t${cleanVal(movie)}\t${cleanVal(theater)}\t${cleanVal(seats)}\t${total}\t${date}\r\n`;
    });
    
    // Convert string to UTF-16 LE byte array
    const buffer = new ArrayBuffer(csvContent.length * 2 + 2);
    const view = new DataView(buffer);
    
    // Write UTF-16 LE BOM (0xFEFF)
    view.setUint16(0, 0xFEFF, true); // true for little endian
    
    // Write characters
    for (let i = 0; i < csvContent.length; i++) {
      view.setUint16((i + 1) * 2, csvContent.charCodeAt(i), true); // true for little endian
    }
    
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-16le;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileSuffix = filterType === 'all' ? 'tong_hop' : filterType === 'date' ? filterDate : filterType === 'month' ? filterMonth : filterYear;
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_cao_doanh_thu_${fileSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

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
      label: `Doanh thu phim chiếu xong${getTimeSuffix()}`,
      value: `${stats?.totalRevenue !== undefined && stats?.totalRevenue !== null ? stats.totalRevenue.toLocaleString('vi-VN') : 0} ₫`,
      subtitle: stats?.upcomingRevenue ? `+${stats.upcomingRevenue.toLocaleString('vi-VN')} ₫ vé đặt trước` : 'Đã kết thúc suất chiếu',
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
      {/* Print-only Business Header */}
      <div className="hidden print:block print-header border-b-2 border-zinc-200 pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase text-black">CineAdmin - Báo Cáo Doanh Thu</h1>
        <p className="text-xs text-zinc-600 mt-1">
          Hệ thống đặt vé phim Nova Cinematic | Ngày xuất báo cáo: {new Date().toLocaleString('vi-VN')}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">
          Thời gian lọc: {filterType === 'all' ? 'Tất cả thời gian' : filterType === 'date' ? filterDate : filterType === 'month' ? filterMonth : filterYear}
        </p>
      </div>

      {/* 0. Bộ lọc thời gian */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 p-5 rounded-3xl shadow-sm">
        <div>
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">Bộ lọc doanh thu</h3>
          <p className="text-[11px] text-gray-500 mt-1">Chọn lọc theo ngày, tháng hoặc năm để xem chi tiết doanh thu và danh sách giao dịch.</p>
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
            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-3 py-2.5 focus:border-brand outline-none cursor-pointer font-bold"
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
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-3.5 py-2.5 focus:border-brand outline-none font-bold select-none"
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
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-4 py-2.5 focus:border-brand outline-none cursor-pointer font-bold"
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
            className={`bg-white border rounded-3xl p-6 flex items-center justify-between shadow-sm bg-gradient-to-br ${card.bg}`}
          >
            <div className="space-y-1">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-xl md:text-2xl font-black text-gray-900 block">{card.value}</span>
              {card.subtitle && (
                <span className="text-[11px] font-semibold text-emerald-600 block">{card.subtitle}</span>
              )}
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl shrink-0">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Bảng giao dịch gần đây */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-800">
              {filterType === 'all' ? 'Giao dịch gần đây' : `Danh sách giao dịch${getTimeSuffix()}`}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {filterType === 'all'
                ? 'Nhật ký thời gian thực về các vé được người dùng mua gần nhất.'
                : `Hiển thị đầy đủ tất cả các giao dịch được ghi nhận trong thời gian lọc.`}
            </p>
          </div>
          
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="pb-3 pl-4">Người dùng</th>
                <th className="pb-3">Phim</th>
                <th className="pb-3">Rạp</th>
                <th className="pb-3">Ghế</th>
                <th className="pb-3">Tổng thanh toán</th>
                <th className="pb-3 pr-4 text-right">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 italic">
                    Chưa có giao dịch nào được ghi nhận trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 pl-4">
                      <div className="font-bold text-gray-800">{b.user?.username || 'Khách'}</div>
                      <div className="text-[10px] text-gray-400">{b.user?.email || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate">
                      {b.showtime?.movie?.title || 'Phim đã xóa'}
                    </td>
                    <td className="py-3.5 truncate">
                      {b.showtime?.theater?.name || 'Rạp đã xóa'}
                    </td>
                    <td className="py-3.5">
                      <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded font-black text-brand text-[10px]">
                        {b.seats.join(', ')}
                      </span>
                    </td>
                    <td className="py-3.5 font-black text-gray-800">
                      {b.totalPrice.toLocaleString()} VND
                    </td>
                    <td className="py-3.5 pr-4 text-right text-gray-400 font-bold">
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

        {/* Export Buttons at the absolute bottom of the page */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 no-print">
          <button
            onClick={exportToExcel}
            title="Xuất Báo cáo Excel (.csv)"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl px-4 py-2.5 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Download size={14} />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            title="Xuất Báo cáo PDF"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 font-bold text-xs rounded-xl px-4 py-2.5 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <FileText size={14} />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Print-only CSS styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar menu, top header menu, select filters, and download buttons */
          aside, header, select, input, button, .no-print, .admin-mobile-menu {
            display: none !important;
          }
          
          /* Remove index.css body decorative shimmer overlays which wash out print text on white background */
          body::before, body::after {
            display: none !important;
            content: none !important;
          }
          
          /* Reset root layout margins and paddings for paper spacing */
          body, html, #root, main, div, section, article, table, thead, tbody, tr, th, td, h1, h2, h3, h4, h5, h6, p, span, svg, a {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0d0d12 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          /* Force clear sidebar margins */
          div[style*="margin-left"] {
            margin-left: 0 !important;
          }

          /* Force dark color on elements using Tailwind text- classes */
          [class*="text-"] {
            color: #0d0d12 !important;
          }

          /* Color corrections for clean black text on white paper */
          .text-white, .text-zinc-200, .text-zinc-300, span, h3, h4, td, th {
            color: #0d0d12 !important;
          }

          .text-zinc-500, .text-zinc-400, p, span.text-zinc-500 {
            color: #374151 !important;
          }

          /* Format visual cards to white panels */
          .bg-dark-card, .bg-zinc-950/40, .bg-zinc-900 {
            background: #ffffff !important;
            border: 1px solid #d1d5db !important;
            color: #0d0d12 !important;
          }

          /* Display graphs/grids clean */
          .grid {
            display: grid !important;
            gap: 16px !important;
          }

          .border, .border-dark-border {
            border-color: #d1d5db !important;
          }

          /* Clean tabular reports border lines */
          th {
            border-bottom: 2px solid #000000 !important;
            padding-bottom: 8px !important;
            font-weight: bold !important;
            color: #0d0d12 !important;
          }
          
          td {
            border-bottom: 1px solid #e5e7eb !important;
            padding: 10px 0 !important;
            color: #0d0d12 !important;
          }

          /* print header layout style */
          .print-header {
            display: block !important;
            margin-bottom: 24px !important;
            border-bottom: 3px double #000000 !important;
            padding-bottom: 16px !important;
            color: #0d0d12 !important;
          }
        }
      ` }} />
    </div>
  );
};

export default Dashboard;