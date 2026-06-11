import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Landmark, BarChart3 } from 'lucide-react';
import adminService from '../../services/admin.service';
import Loading from '../common/Loading';

export const RevenueReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <h3 className="text-lg font-black text-zinc-200">Báo Cáo & Phân Tích Tài Chính</h3>
        <p className="text-xs text-zinc-500 mt-1">Xem lại hiệu suất bán hàng của các cụm rạp, lưu lượng vé hàng tháng và các phim nổi bật nhất.</p>
      </div>

      {/* Lưới biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Biểu đồ doanh thu hàng tháng */}
        <div className="bg-dark-card border border-dark-border p-6 rounded-3xl space-y-4 shadow-sm">
          <h4 className="font-bold text-zinc-300 text-sm flex items-center gap-2">
            <DollarSign size={16} className="text-brand" /> Doanh Thu Đặt Vé Hàng Tháng
          </h4>
          <div className="h-72 w-full pt-4">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs">
                Chưa có dữ liệu tổng hợp doanh thu hàng tháng.
              </div>
            ) : (
              <ResponsiveContainer width="100%" h="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                  <XAxis dataKey="name" stroke="#9fa0a6" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9fa0a6" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16161e', borderColor: '#2a2a35', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#e50914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Biểu đồ doanh thu theo cụm rạp */}
        <div className="bg-dark-card border border-dark-border p-6 rounded-3xl space-y-4 shadow-sm">
          <h4 className="font-bold text-zinc-300 text-sm flex items-center gap-2">
            <Landmark size={16} className="text-blue-500" /> Hiệu Suất Các Cụm Rạp
          </h4>
          <div className="h-72 w-full pt-4">
            {theaterData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs">
                Chưa có dữ liệu so sánh doanh thu các rạp.
              </div>
            ) : (
              <ResponsiveContainer width="100%" h="100%">
                <BarChart data={theaterData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                  <XAxis type="number" stroke="#9fa0a6" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#9fa0a6" fontSize={10} tickWidth={100} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16161e', borderColor: '#2a2a35', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Biểu đồ tỷ lệ doanh thu theo phim */}
        <div className="bg-dark-card border border-dark-border p-6 rounded-3xl space-y-4 shadow-sm lg:col-span-2">
          <h4 className="font-bold text-zinc-300 text-sm flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-500" /> Tỷ Trọng Doanh Thu Theo Phim
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            <div className="h-64 w-full">
              {movieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs">
                  Chưa có dữ liệu tỷ trọng của phim.
                </div>
              ) : (
                <ResponsiveContainer width="100%" h="100%">
                  <PieChart>
                    <Pie data={movieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {movieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#16161e', borderColor: '#2a2a35', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Danh sách chú giải màu sắc tùy chỉnh */}
            <div className="space-y-3">
              <h5 className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Top Phim Có Doanh Thu Cao Nhất</h5>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                {movieData.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">Chưa có dữ liệu phim.</p>
                ) : (
                  movieData.map((item, idx) => (
                    <div key={item.name} className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-zinc-300 truncate max-w-[150px]">{item.name}</span>
                      </div>
                      <span className="text-zinc-500">{(item.value || 0).toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;