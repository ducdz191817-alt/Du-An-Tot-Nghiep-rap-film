import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import RegisterForm from '../components/Auth/RegisterForm';


import myLogo from '../assets/images/logo.png'; 

export const RegisterPage = () => {
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

  const handleRegisterSuccess = () => {
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
          <h2 className="text-xl font-bold text-white uppercase tracking-wider text-center mt-2">
            Tạo tài khoản mới
          </h2>
          <p className="text-xs text-zinc-500 text-center">Đăng ký ngay hôm nay để tận hưởng các ưu đãi điện ảnh.</p>
        </div>

        {/* Form */}
        <RegisterForm onSuccess={handleRegisterSuccess} />

        <div className="text-center text-xs font-semibold text-zinc-500 border-t border-dark-border/40 pt-4">
          <span>Đã có tài khoản? </span>
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-brand font-black hover:underline"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;