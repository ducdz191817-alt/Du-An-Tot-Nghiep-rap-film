import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({
  message,
  type = 'success',
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-zinc-900/90 border-green-500/30 text-green-400',
      icon: <CheckCircle2 size={18} className="text-green-500" />,
      glow: 'shadow-[0_4px_20px_rgba(34,197,94,0.15)]',
    },
    error: {
      bg: 'bg-zinc-900/90 border-red-500/30 text-red-400',
      icon: <XCircle size={18} className="text-red-500" />,
      glow: 'shadow-[0_4px_20px_rgba(239,68,68,0.15)]',
    },
    warning: {
      bg: 'bg-zinc-900/90 border-amber-500/30 text-amber-400',
      icon: <AlertTriangle size={18} className="text-amber-500" />,
      glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
    },
    info: {
      bg: 'bg-zinc-900/90 border-blue-500/30 text-blue-400',
      icon: <Info size={18} className="text-blue-500" />,
      glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.15)]',
    },
  };

  if (!message) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 border px-4 py-3 rounded-xl backdrop-blur-md animate-in slide-in-from-top-5 fade-in duration-300 ${styles[type].bg} ${styles[type].glow}`}
    >
      <span>{styles[type].icon}</span>
      <p className="text-sm font-semibold max-w-[250px]">{message}</p>
      <button
        onClick={onClose}
        className="text-zinc-500 hover:text-zinc-300 transition-colors pl-2 border-l border-zinc-800"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
