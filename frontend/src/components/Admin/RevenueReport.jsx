import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Landmark, BarChart3 } from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';

export const RevenueReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllMovies, setShowAllMovies] = useState(false);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const result = await adminService.getRevenueReport();
        setReport(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  if (loading) return <Loading />;

  const COLORS = ['#e50914', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const monthlyData = report?.data?.monthlySales || report?.monthlySales || [];
  const movieData = report?.data?.movieSales || report?.movieSales || [];
  const theaterData = report?.data?.theaterSales || report?.theaterSales || [];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-black text-gray-800">Báo Cáo & Phân Tích Tài Chính</h3>
        <p className="text-xs text-gray-500 mt-1">Xem lại hiệu suất bán hàng của các cụm rạp, lưu lượng vé hàng tháng và các phim nổi bật nhất.</p>
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

        {/* 3. Top Performing Movies (Tỷ trọng doanh thu theo phim - Giao diện Light Mode) */}
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