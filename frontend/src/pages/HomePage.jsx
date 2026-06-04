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
        <div className="relative w-full aspect-[21/9] min-h-[350px] md:min-h-[500px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-zinc-950 border border-dark-border/50 group">
          <img
            src={featured.posterUrl}
            alt={featured.title}
            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-deep via-dark-deep/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-deep via-dark-deep/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 to-transparent opacity-50 mix-blend-overlay" />

          {/* Banner Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl space-y-4">
            <span className="text-[10px] font-black bg-brand px-3 py-1 rounded text-white tracking-widest uppercase w-max select-none shadow-md">
              Featured Release
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
              {featured.title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-medium line-clamp-3 md:line-clamp-4 drop-shadow-md max-w-2xl">
              {featured.description}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link to={`/movies/${featured._id}`}>
                <Button variant="primary" className="py-2.5 px-6 font-bold text-sm shadow-glass-brand">
                  Book Now
                </Button>
              </Link>

              <Link to={`/movies/${featured._id}`}>
                <Button variant="glass" className="py-2.5 px-6 font-bold text-sm">
                  Watch Trailer
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