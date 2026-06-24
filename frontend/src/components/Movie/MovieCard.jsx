import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar, Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getPosterUrl } from '../../utils/constants';

export const MovieCard = ({ movie }) => {
  const { language, t } = useLanguage();
  const [imageError, setImageError] = useState(false);

  // Lấy title và genre theo ngôn ngữ từ DB
  const displayTitle = language === 'en'
    ? (movie.titleEN || movie.title)
    : movie.title;

  const handleImageError = () => {
    setImageError(true);
  };

  // Fallback poster image
  const fallbackPoster = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%23f3f0eb" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23a89888" text-anchor="middle" dominant-baseline="middle" font-family="Arial"%3EMovie Poster%3C/text%3E%3C/svg%3E';

  // Get status label
  const statusLabel = movie.status === 'now-showing' 
    ? (language === 'vi' ? 'ĐANG CHIẾU' : 'NOW SHOWING')
    : movie.status === 'coming-soon'
    ? (language === 'vi' ? 'SẮP CHIẾU' : 'COMING SOON')
    : movie.status === 'preview'
    ? (language === 'vi' ? 'CHIẾU SỚM' : 'PREVIEW')
    : (language === 'vi' ? 'SẮP RA MẮT' : 'PRE-RELEASE');

  const statusColor = movie.status === 'now-showing'
    ? 'bg-emerald-500'
    : movie.status === 'coming-soon'
    ? 'bg-blue-500'
    : movie.status === 'preview'
    ? 'bg-violet-500'
    : 'bg-sky-500';

  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-brand/30 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      {/* Vùng chứa hình ảnh */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
        <img
          src={imageError ? fallbackPoster : getPosterUrl(movie.posterUrl)}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={handleImageError}
        />

        {/* Hiệu ứng nền & Lớp phủ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Nút phát trailer khi di chuột (hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            to={`/movies/${movie._id}`}
            className="bg-brand text-white p-4 rounded-full shadow-[0_4px_20px_rgba(200,135,43,0.5)] hover:scale-110 transition-transform"
          >
            <Play fill="white" size={24} className="ml-0.5" />
          </Link>
        </div>

        {/* Nhãn trạng thái phim (góc dưới bên trái) */}
        <span className={`absolute bottom-3 left-3 text-[9px] font-black ${statusColor} px-2 py-0.5 rounded text-white tracking-wide shadow-md uppercase`}>
          {statusLabel}
        </span>

        {/* Rating badge (góc trên bên phải) */}
        {movie.reviewsAverage > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-gray-800">{movie.reviewsAverage.toFixed(1)}</span>
          </span>
        )}
      </div>

      {/* Phần văn bản chi tiết */}
      <div className="p-4 space-y-2">
        <h3 className="text-gray-900 font-bold truncate text-base group-hover:text-brand transition-colors">
          <Link to={`/movies/${movie._id}`}>{displayTitle}</Link>
        </h3>

        <div className="flex items-center text-xs text-gray-400 gap-1">
          {movie.genre.slice(0, 2).map((g, i) => (
            <React.Fragment key={g}>
              {i > 0 && <span>,</span>}
              <span className="text-gray-500">{t(g)}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;