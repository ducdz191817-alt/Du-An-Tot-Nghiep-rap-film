import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminLayout from '../components/Admin/AdminLayout';
import Dashboard from '../components/Admin/Dashboard';
import MovieManager from '../components/Admin/MovieManager';
import ShowtimeManager from '../components/Admin/ShowtimeManager';
import RoomManager from '../components/Admin/RoomManager';
import ConcessionManager from '../components/Admin/ConcessionManager';
import BookingManager from '../components/Admin/BookingManager';
import RevenueReport from '../components/Admin/RevenueReport';
import UserManager from '../components/Admin/UserManager';
import PricingManager from '../components/Admin/PricingManager';
import SeatPriceManager from '../components/Admin/SeatPriceManager';
import RoomTypeManager from '../components/Admin/RoomTypeManager';
import CouponManager from '../components/Admin/CouponManager';

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isStaff } = useAuth();
  const [activeTab, setActiveTab] = useState(() => (isStaff && !isAdmin ? 'bookings' : 'dashboard'));

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent('/admin'));
    } else if (!isAdmin && !isStaff) {
      alert('Từ chối truy cập: Bạn không có đặc quyền truy cập trang quản lý.');
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, isStaff, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard />;
      case 'movies':      return <MovieManager />;
      case 'showtimes':   return <ShowtimeManager />;
      case 'rooms':       return <RoomManager />;
      case 'room-types':  return <RoomTypeManager />;
      case 'seat-prices': return <SeatPriceManager />;
      case 'concessions': return <ConcessionManager />;
      case 'bookings':    return <BookingManager />;
      case 'coupons':     return <CouponManager />;
      case 'pricing':     return <PricingManager />;
      case 'revenue':     return <RevenueReport />;
      case 'users':       return <UserManager />;
      default:            return isStaff && !isAdmin ? <BookingManager /> : <Dashboard />;
    }
  };

  if (!isAuthenticated || (!isAdmin && !isStaff)) return null;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;