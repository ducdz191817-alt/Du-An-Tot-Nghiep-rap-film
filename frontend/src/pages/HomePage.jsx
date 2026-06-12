import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Film, CalendarDays, Compass, Star } from 'lucide-react';
import { fetchMovies } from '../store/movieSlice';
import MovieList from '../components/Movie/MovieList';
import MovieFilter from '../components/Movie/MovieFilter';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getPosterUrl } from '../utils/constants';

export const HomePage = () => {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const { movies, loading, error } = useSelector((state) => state.movie);
  const [filters, setFilters] = useState({
    status: 'now-showing',
    genre: '',
    search: '',
  });
  const [bannerImageError, setBannerImageError] = useState(false);

  useEffect(() => {
    dispatch(fetchMovies(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleBannerImageError = () => {
    setBannerImageError(true);
  };

  const nowShowingMovies = movies.filter((m) => m.status === 'now-showing');
  const comingSoonMovies = movies.filter((m) => m.status === 'coming-soon');

  // Phim nổi bật trên banner (phim đầu tiên hoặc tùy chỉnh)
  const featured = nowShowingMovies[0] || movies[0];

  // Lấy title / description theo ngôn ngữ trực tiếp từ DB
  const featuredTitle = featured
    ? (language === 'en' ? (featured.titleEN || featured.title) : featured.title)
    : '';
  const featuredDescription = featured
    ? (language === 'en' ? (featured.descriptionEN || featured.description) : featured.description)
    : '';

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Banner giới thiệu phim nổi bật */}
      {featured && (
        <div className="relative w-full aspect-[21/9] min-h-[350px] md:min-h-[500px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gradient-to-br from-zinc-900 to-black border border-dark-border/50 group">
          {!bannerImageError && (
            <img
              src={getPosterUrl(featured.posterUrl)}
              alt={featuredTitle}
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out"
              onError={handleBannerImageError}
            />
          )}
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-deep via-dark-deep/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-deep via-dark-deep/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 to-transparent opacity-50 mix-blend-overlay" />

          {/* Banner Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl space-y-4">
            <span className="text-[10px] font-black bg-brand px-3 py-1 rounded text-white tracking-widest uppercase w-max select-none shadow-md">
              {t('home.featured')}
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
              {featuredTitle}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-medium line-clamp-3 md:line-clamp-4 drop-shadow-md max-w-2xl">
              {featuredDescription}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link to={`/movies/${featured._id}`}>
                <Button
                  variant="primary"
                  className="py-2.5 px-5 font-bold text-sm bg-gradient-to-r from-brand-dark to-brand hover:from-brand hover:to-brand-light text-white rounded-xl flex items-center gap-2 border border-brand/40 shadow-lg shadow-brand/20 active:scale-95 transition-all"
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
                  <span>{t('home.bookNow')}</span>
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
                  <span>{t('home.watchTrailer')}</span>
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
            <Compass className="text-brand" size={24} /> {t('home.discover')}
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
            {t('home.loadingError')}: {error}
          </div>
        ) : (
          <MovieList movies={movies} />
        )}
      </div>
    </div>
  );
};

export default HomePage;