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

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent('/admin'));
    } else if (!isAdmin) {
      alert('Từ chối truy cập: Bạn không có đặc quyền quản trị.');
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard />;
      case 'movies':      return <MovieManager />;
      case 'showtimes':   return <ShowtimeManager />;
      case 'rooms':       return <RoomManager />;
      case 'concessions': return <ConcessionManager />;
      case 'bookings':    return <BookingManager />;
      case 'revenue':     return <RevenueReport />;
      case 'users':       return <UserManager />;
      default:            return <Dashboard />;
    }
  };

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;