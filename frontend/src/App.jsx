import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { LanguageProvider } from './context/LanguageContext';

// Pages
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import PromotionsPage from './pages/PromotionsPage';
import TheatersPage from './pages/TheatersPage';
import AboutPage from './pages/AboutPage';
import VNPayReturnPage from './pages/VNPayReturnPage';

// Layout wrapper for public pages (with Header + Footer)
const PublicLayout = ({ children }) => (
  <div className="min-h-screen bg-dark-deep text-zinc-100 flex flex-col justify-between selection:bg-brand selection:text-white">
    <Header />
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Admin: full-screen standalone (no Header/Footer) ── */}
            <Route path="/admin" element={<AdminPage />} />

            {/* ── Public pages wrapped in Header + Footer ── */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/movies" element={<PublicLayout><MoviesPage /></PublicLayout>} />
            <Route path="/movies/:id" element={<PublicLayout><MovieDetailPage /></PublicLayout>} />
            <Route path="/booking/:showtimeId" element={<PublicLayout><BookingPage /></PublicLayout>} />
            <Route path="/payment" element={<PublicLayout><PaymentPage /></PublicLayout>} />
            <Route path="/history" element={<PublicLayout><BookingHistoryPage /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
            <Route path="/promotions" element={<PublicLayout><PromotionsPage /></PublicLayout>} />
            <Route path="/theaters" element={<PublicLayout><TheatersPage /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/vnpay-return" element={<PublicLayout><VNPayReturnPage /></PublicLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </Provider>
  );
}

export default App;
