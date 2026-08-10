import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, Landmark, CheckCircle2, Clock, Layers, Filter, TrendingUp } from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';

export const RevenueReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllMovies, setShowAllMovies] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dailyFrom, setDailyFrom] = useState('');
  const [dailyTo, setDailyTo] = useState('');

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      try {
        const result = await adminService.getRevenueReport({ status: statusFilter });
        setReport(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [statusFilter]);

  // --- Dữ liệu trích xuất từ report (hỗ trợ cả bọc data và unwrap)
  const summary = report?.summary || report?.data?.summary || {};
  const monthlyData = report?.monthlySales || report?.data?.monthlySales || [];
  const movieData = report?.movieSales || report?.data?.movieSales || [];
  const theaterData = report?.theaterSales || report?.data?.theaterSales || [];
  const dailyData = report?.dailySales || report?.data?.dailySales || [];

  // Lọc daily data theo khoảng ngày
  const filteredDailyData = React.useMemo(() => {
    if (!dailyData.length) return [];
    return dailyData.filter(d => {
      if (dailyFrom && d.name < dailyFrom) return false;
      if (dailyTo && d.name > dailyTo) return false;
      return true;
    });
  }, [dailyData, dailyFrom, dailyTo]);

  const filteredDailyTotal = filteredDailyData.reduce((sum, d) => sum + d.value, 0);

  const setDailyPreset = (days) => {
    if (days === 0) { setDailyFrom(''); setDailyTo(''); return; }
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    setDailyTo(to.toISOString().slice(0, 10));
    setDailyFrom(from.toISOString().slice(0, 10));
  };

  // Kiểm tra preset nào đang active
  const isPreset7Active = dailyFrom && dailyTo && (() => {
    const d = new Date(dailyFrom); d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10) === dailyTo;
  })();
  const isPreset30Active = dailyFrom && dailyTo && (() => {
    const d = new Date(dailyFrom); d.setDate(d.getDate() + 29);
    return d.toISOString().slice(0, 10) === dailyTo;
  })();
  const isPresetAllActive = !dailyFrom && !dailyTo;

  const fmt = (val) => (val || 0).toLocaleString('vi-VN') + ' ₫';

  // Early return SAU khi tất cả hooks đã chạy
  if (loading && !report) return <Loading />;

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-800">Báo Cáo & Phân Tích Tài Chính</h3>
          <p className="text-xs text-gray-500 mt-1">
            Hiệu suất bán hàng của các cụm rạp, vé bán theo tháng và danh sách phim.
          </p>
        </div>

        {/* Bộ lọc tính doanh thu */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 pl-2.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter size={12} /> Lọc:
          </span>
          <button
            onClick={() => setStatusFilter('ended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              statusFilter === 'ended'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✓ Đã kết thúc phim
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              statusFilter === 'all'
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả suất chiếu
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              statusFilter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Chưa chiếu (Đặt trước)
          </button>
        </div>
      </div>

      {/* 3 Thẻ thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-emerald-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">Doanh Thu Phim Đã Chiếu Xong</span>
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{fmt(summary.completedRevenue)}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Chỉ ghi nhận từ các suất chiếu đã kết thúc</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-blue-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">Doanh Thu Vé Đặt Trước</span>
            <Clock size={20} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900">{fmt(summary.upcomingRevenue)}</div>
          <p className="text-[11px] text-blue-600 font-medium">Từ các suất chiếu sắp diễn ra trong tương lai</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-purple-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">Tổng Doanh Thu Đã Thanh Toán</span>
            <Layers size={20} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-900">{fmt(summary.totalRevenue)}</div>
          <p className="text-[11px] text-purple-600 font-medium">Bao gồm cả suất chiếu đã xong & vé đặt trước</p>
        </div>
      </div>

      {/* Lưới biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Biểu đồ doanh thu hàng tháng */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <h4 className="font-bold text-gray-850/800 text-sm flex items-center gap-2">
            <DollarSign size={16} className="text-brand" /> Doanh Thu Đặt Vé Hàng Tháng
          </h4>
          <div className="h-72 w-full pt-4">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 italic text-xs">
                Chưa có dữ liệu tổng hợp doanh thu hàng tháng.
              </div>
            ) : (
              <ResponsiveContainer width="100%" h="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e0d5', borderRadius: '12px' }}
                    labelStyle={{ color: '#1a1a2e', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#e50914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Biểu đồ doanh thu theo cụm rạp */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Landmark size={16} className="text-blue-500" /> Hiệu Suất Các Cụm Rạp
          </h4>
          <div className="h-72 w-full pt-4">
            {theaterData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 italic text-xs">
                Chưa có dữ liệu so sánh doanh thu các rạp.
              </div>
            ) : (
              <ResponsiveContainer width="100%" h="100%">
                <BarChart data={theaterData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} tickWidth={100} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e0d5', borderRadius: '12px' }}
                    labelStyle={{ color: '#1a1a2e', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Biểu đồ doanh thu theo ngày */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm lg:col-span-2">
          {/* Header + Bộ lọc */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" /> Doanh Thu Theo Ngày
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Presets */}
              {[
                { label: '7 ngày', days: 7, active: isPreset7Active },
                { label: '30 ngày', days: 30, active: isPreset30Active },
                { label: 'Tất cả', days: 0, active: isPresetAllActive },
              ].map(p => (
                <button
                  key={p.days}
                  onClick={() => setDailyPreset(p.days)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    p.active
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {/* Date Pickers */}
              <input
                type="date"
                value={dailyFrom}
                max={dailyTo || undefined}
                onChange={e => setDailyFrom(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-[11px] rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-orange-400"
              />
              <span className="text-gray-400 text-xs font-bold">→</span>
              <input
                type="date"
                value={dailyTo}
                min={dailyFrom || undefined}
                onChange={e => setDailyTo(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-[11px] rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-orange-400"
              />
              {/* Tổng doanh thu trong khoảng */}
              {filteredDailyData.length > 0 && (
                <span className="ml-1 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-extrabold rounded-xl">
                  {filteredDailyData.length} ngày · {filteredDailyTotal.toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>
          </div>

          <div className="h-72 w-full">
            {filteredDailyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 italic text-xs">
                Không có dữ liệu doanh thu trong khoảng thời gian này.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredDailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
                    }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#fed7aa', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#1a1a2e', fontWeight: 'bold' }}
                    labelFormatter={(label) => {
                      const d = new Date(label);
                      return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    }}
                    formatter={(value) => [(value || 0).toLocaleString('vi-VN') + ' ₫', 'Doanh thu']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ fill: '#f97316', r: filteredDailyData.length <= 31 ? 5 : 3, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#ea580c' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {/* Phần giao diện đồng bộ với tông màu sáng của màn hình */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-gray-800 text-lg">Top Performing Movies</h4>
            {movieData.length > 3 && (
              <button 
                onClick={() => setShowAllMovies(!showAllMovies)}
                className="text-blue-600 text-xs hover:text-blue-700 font-bold transition-colors"
              >
                {showAllMovies ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
          
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              {/* Tiêu đề các cột của bảng */}
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-2/5">Movie</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tickets</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Occupancy</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {movieData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 italic text-sm">Chưa có dữ liệu phim.</td>
                  </tr>
                ) : (
                  // Sắp xếp phim theo doanh thu giảm dần (b.value - a.value) và giới hạn số lượng hiển thị
                  movieData
                    .sort((a, b) => b.value - a.value)
                    .slice(0, showAllMovies ? movieData.length : 3)
                    .map((item) => (
                    <tr key={item.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
                      
                      {/* Cột 1: Thông tin Phim (Hình ảnh, Tên phim, Thể loại, Thời lượng) */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-4">
                          {/* Khối hiển thị Poster phim */}
                          <div className="w-12 h-16 rounded-md border border-gray-200 overflow-hidden bg-gray-50 shrink-0 shadow-sm">
                            {item.posterUrl ? (
                              <img src={item.posterUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[10px] bg-gray-100">
                                <span className="opacity-70">No Image</span>
                              </div>
                            )}
                          </div>
                          {/* Khối hiển thị Tên và chi tiết */}
                          <div>
                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                              {/* Hiển thị Thể loại và Đổi phút sang định dạng Giờ:Phút */}
                              {(Array.isArray(item.genre) ? item.genre.join(', ') : item.genre) || 'Unknown'} / {item.duration ? `${Math.floor(item.duration/60)}h ${item.duration%60}m` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Cột 2: Số lượng vé đã bán ra (Tickets) */}
                      <td className="py-4">
                        <p className="text-[13px] text-gray-700 font-bold">{item.tickets?.toLocaleString() || 0}</p>
                      </td>
                      
                      {/* Cột 3: Tỷ lệ lấp đầy (Occupancy) - Hiển thị dạng thanh tiến trình */}
                      <td className="py-4 w-48">
                        <div className="flex items-center gap-3">
                           {/* Vỏ ngoài của thanh tiến trình */}
                           <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                             {/* Phần tô màu hiển thị phần trăm */}
                             <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${item.occupancy || 0}%` }}></div>
                           </div>
                           <span className="text-xs text-gray-500 font-bold">{item.occupancy || 0}%</span>
                        </div>
                      </td>
                      
                      {/* Cột 4: Doanh thu (Revenue) */}
                      <td className="py-4 text-right">
                        <p className="text-[13px] font-black text-emerald-600">
                          {(item.value || 0).toLocaleString('vi-VN')} đ
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;