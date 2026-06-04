import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Film, CalendarDays, Compass, Star } from 'lucide-react';
import { fetchMovies } from '../store/movieSlice';
import MovieList from '../components/Movie/MovieList';
import MovieFilter from '../components/Movie/MovieFilter';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const dispatch = useDispatch();
  const { movies, loading, error } = useSelector((state) => state.movie);
  const [filters, setFilters] = useState({
    status: 'now-showing',
    genre: '',
    search: '',
  });

  useEffect(() => {
    dispatch(fetchMovies(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const nowShowingMovies = movies.filter((m) => m.status === 'now-showing');
  const comingSoonMovies = movies.filter((m) => m.status === 'coming-soon');

  // Phim nổi bật trên banner (phim đầu tiên hoặc tùy chỉnh)
  const featured = nowShowingMovies[0] || movies[0];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Banner giới thiệu phim nổi bật */}
      {featured && (
        <div className="relative w-full aspect-[21/9] min-h-[300px] md:min-h-[450px] rounded-3xl overflow-hidden shadow-2xl bg-zinc-950 border border-dark-border">
          <img
            src={featured.posterUrl}
            alt={featured.title}
            className="w-full h-full object-cover opacity-35"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-deep via-dark-deep/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-deep via-transparent to-transparent" />

          {/* Banner Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl space-y-4">
            <span className="text-[10px] font-black bg-brand px-3 py-1 rounded text-white tracking-widest uppercase w-max select-none shadow-md">
              Phim Nổi Bật
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight drop-shadow">
              {featured.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-semibold line-clamp-3 drop-shadow">
              {featured.description}
            </p>
            
           
            <div className="flex items-center gap-4 pt-2">
              <Link to={`/movies/${featured._id}`}>
                <Button 
                  variant="primary" 
                  className="py-2.5 px-5 font-bold text-sm bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white rounded-xl flex items-center gap-2 border border-red-600/40 shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                >
                
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="-rotate-12"
                  >
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                    <line x1="13" x2="13" y1="5" y2="9" />
                    <line x1="13" x2="13" y1="15" y2="19" />
                  </svg>
                  <span>Đặt Vé Ngay</span>
                </Button>
              </Link>

              <Link to={`/movies/${featured._id}`}>
                <Button 
                  variant="glass" 
                  className="py-2.5 px-5 font-bold text-sm bg-[#27272a]/80 hover:bg-[#3f3f46]/80 text-white rounded-xl flex items-center gap-2 border border-zinc-600 active:scale-95 transition-all"
                >
                 
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                  </svg>
                  <span>Xem Trailer</span>
                </Button>
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* 2. Thanh bộ lọc điều hướng tương tác */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-dark-border pb-4">
          <h2 className="text-xl md:text-3xl font-black text-white flex items-center gap-2 tracking-tight">
            <Compass className="text-brand" size={24} /> Khám Phá Phim
          </h2>
        </div>

        <MovieFilter filters={filters} onChange={handleFilterChange} />
      </div>

      {/* 3. Lưới danh sách phim */}
      <div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center font-medium">
            Lỗi khi tải danh sách phim: {error}
          </div>
        ) : (
          <MovieList movies={movies} />
        )}
      </div>
    </div>
  );
};

export default HomePage;