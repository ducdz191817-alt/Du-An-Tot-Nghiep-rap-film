import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar, Star } from 'lucide-react';

export const MovieCard = ({ movie }) => {
  const isComingSoon = movie.status === 'coming-soon';

  return (
    <div className="group relative bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-brand/40 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {/* Vùng chứa hình ảnh */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Hiệu ứng nền & Lớp phủ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Nút phát trailer khi di chuột (hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            to={`/movies/${movie._id}`}
            className="bg-brand text-white p-4 rounded-full shadow-[0_4px_20px_rgba(229,9,20,0.5)] hover:scale-110 transition-transform"
          >
            <Play fill="white" size={24} className="ml-0.5" />
          </Link>
        </div>

        {/* Nhãn Đánh giá phim (góc trên bên trái) */}
        <span className="absolute top-3 left-3 text-xs font-black bg-brand px-2.5 py-1 rounded-md text-white tracking-wide shadow-md uppercase">
          {movie.rating}
        </span>
      </div>

      {/* Phần văn bản chi tiết */}
      <div className="p-4 space-y-2">
        <div className="flex flex-wrap gap-1">
          {movie.genre.slice(0, 2).map((g) => (
            <span key={g} className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {g}
            </span>
          ))}
        </div>

        <h3 className="text-zinc-100 font-bold truncate text-base group-hover:text-brand transition-colors">
          <Link to={`/movies/${movie._id}`}>{movie.title}</Link>
        </h3>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            {new Date(movie.releaseDate).getFullYear()}
          </span>
          <span className="text-zinc-400 font-bold">{movie.duration} phút</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;