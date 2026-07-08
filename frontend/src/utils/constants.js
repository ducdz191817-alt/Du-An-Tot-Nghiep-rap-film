const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

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
    color: 'bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200',
    selectedColor: 'bg-brand border border-brand/50 text-white shadow-[0_0_12px_rgba(200,135,43,0.5)]',
    bookedColor: 'bg-gray-300 border border-gray-400 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500',
    extraPrice: 0,
  },
  vip: {
    label: 'Ghế VIP',
    color: 'bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/50 dark:border-indigo-700 dark:text-indigo-300',
    selectedColor: 'bg-brand border border-brand/50 text-white shadow-[0_0_12px_rgba(200,135,43,0.5)]',
    bookedColor: 'bg-gray-300 border border-gray-400 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500',
    extraPrice: 5000,
  },
  couple: {
    label: 'Sweetbox',
    color: 'bg-pink-100 hover:bg-pink-200 border border-pink-200 text-pink-700 dark:bg-pink-900/50 dark:hover:bg-pink-800/50 dark:border-pink-700 dark:text-pink-300',
    selectedColor: 'bg-brand border border-brand/50 text-white shadow-[0_0_12px_rgba(200,135,43,0.5)]',
    bookedColor: 'bg-gray-300 border border-gray-400 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500',
    extraPrice: 120000,
  },
};

export const getPosterUrl = (url) => {
  if (!url) return '';
  return url;
};

export const getEmbedUrl = (url) => {
  if (!url) return '';
  const cleanedUrl = url.trim();
  if (cleanedUrl.includes('youtube.com/embed/')) return cleanedUrl;
  
  let videoId = '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = cleanedUrl.match(regExp);
  
  if (match && match[2].length === 11) {
    videoId = match[2];
  } else {
    try {
      const urlObj = new URL(cleanedUrl);
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.substring(1);
      }
    } catch (e) {
      if (cleanedUrl.length === 11 && !cleanedUrl.includes('/') && !cleanedUrl.includes('.')) {
        videoId = cleanedUrl;
      }
    }
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : cleanedUrl;
};
