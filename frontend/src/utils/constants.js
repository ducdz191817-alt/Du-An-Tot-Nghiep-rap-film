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
    label: 'Standard',
    color: 'bg-zinc-700 hover:bg-zinc-600 text-white',
    selectedColor: 'bg-brand text-white',
    bookedColor: 'bg-zinc-900 cursor-not-allowed opacity-40 text-zinc-500',
    extraPrice: 0,
  },
  vip: {
    label: 'VIP Accent',
    color: 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400',
    selectedColor: 'bg-brand text-white border-none',
    bookedColor: 'bg-zinc-900 cursor-not-allowed opacity-40 text-zinc-500',
    extraPrice: 20000,
  },
  couple: {
    label: 'Sweetbox (Couple)',
    color: 'bg-pink-600 hover:bg-pink-500 text-white border border-pink-400',
    selectedColor: 'bg-brand text-white border-none',
    bookedColor: 'bg-zinc-900 cursor-not-allowed opacity-40 text-zinc-500',
    extraPrice: 40000,
  },
};
