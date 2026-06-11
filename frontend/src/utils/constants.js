export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Animation',
  'Family',
];

export const CONTENT_RATINGS = {
  P: 'General Audience (P)',
  C13: '13+ Accompanied (C13)',
  T16: '16+ (T16)',
  T18: '18+ (T18)',
};

export const SEAT_TYPES = {
  standard: {
    label: 'Trống',
    color: 'bg-[#2a2a35]/60 hover:bg-zinc-600/60 border border-zinc-700/50 text-zinc-400',
    selectedColor: 'bg-brand border border-brand/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    bookedColor: 'bg-[#b91c1c]/20 border border-red-800/40 text-red-500/50 cursor-not-allowed',
    extraPrice: 0,
  },
  vip: {
    label: 'Ghế VIP',
    color: 'bg-[#6366f1]/20 hover:bg-[#6366f1]/40 border border-[#6366f1]/30 text-[#818cf8]',
    selectedColor: 'bg-brand border border-brand/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    bookedColor: 'bg-[#b91c1c]/20 border border-red-800/40 text-red-500/50 cursor-not-allowed',
    extraPrice: 20000,
  },
  couple: {
    label: 'Sweetbox',
    color: 'bg-[#ec4899]/20 hover:bg-[#ec4899]/40 border border-[#ec4899]/30 text-[#f472b6]',
    selectedColor: 'bg-brand border border-brand/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    bookedColor: 'bg-[#b91c1c]/20 border border-red-800/40 text-red-500/50 cursor-not-allowed',
    extraPrice: 40000,
  },
};
