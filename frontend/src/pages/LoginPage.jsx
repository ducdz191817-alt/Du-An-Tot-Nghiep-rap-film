import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoginForm from '../components/Auth/LoginForm';


import myLogo from '../assets/images/logo.png'; 

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, reset } = useAuth();
  
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }
    return () => reset();
  }, [isAuthenticated, navigate, redirect]);

  const handleLoginSuccess = () => {
    navigate(redirect);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-dark-card border border-dark-border p-8 rounded-3xl shadow-xl space-y-6">
        
       
        <div className="flex flex-col items-center justify-center space-y-3">
          <img 
            src={myLogo} 
            alt="Nova Cinematic Logo" 
            className="h-16 w-auto object-contain" 
          />
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider text-center mt-2">
            Đăng nhập tài khoản
          </h2>
          <p className="text-xs text-zinc-500 text-center">Chọn ghế ngồi ưng ý và thanh toán chỉ trong vài giây.</p>
        </div>

        {/* Form */}
        <LoginForm onSuccess={handleLoginSuccess} />

        <div className="text-center text-xs font-semibold text-zinc-500 border-t border-dark-border/40 pt-4">
          <span>Chưa có tài khoản Nova Cinematic? </span>
          <Link
            to={`/register?redirect=${encodeURIComponent(redirect)}`}
            className="text-brand font-black hover:underline"
          >
            Tạo tài khoản
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;