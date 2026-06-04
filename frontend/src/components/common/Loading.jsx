import React from 'react';

export const Loading = ({ fullPage = false, size = 'md' }) => {
  const sizeStyles = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer glowing ring */}
        <div className={`rounded-full border-t-transparent border-brand animate-spin ${sizeStyles[size]}`} />
        {/* Inner static aesthetic ring */}
        <div className={`absolute top-0 left-0 rounded-full border-zinc-800 opacity-20 ${sizeStyles[size]}`} />
      </div>
      <p className="text-zinc-400 text-sm font-medium animate-pulse">Đang tải trải nghiệm...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-dark-deep z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {spinner}
    </div>
  );
};

export default Loading;
