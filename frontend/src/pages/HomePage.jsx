import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Film, CalendarDays, Compass, Star, ArrowUp } from 'lucide-react';
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
    search: '',
    genres: [],
    rating: '',
    sortBy: 'newest',
  });
  
  const [bannerImageError, setBannerImageError] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    dispatch(fetchMovies({ status: filters.status, search: filters.search }));
  }, [dispatch, filters.status, filters.search]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleBannerImageError = () => {
    setBannerImageError(true);
  };

  const nowShowingMovies = movies.filter((m) => m.status === 'now-showing');

  // Phim nổi bật trên banner (phim đầu tiên hoặc tùy chỉnh)
  const featured = nowShowingMovies[0] || movies[0];

  // Lấy title / description theo ngôn ngữ trực tiếp từ DB
  const featuredTitle = featured
    ? (language === 'en' ? (featured.titleEN || featured.title) : featured.title)
    : '';
  const featuredDescription = featured
    ? (language === 'en' ? (featured.descriptionEN || featured.description) : featured.description)
    : '';

  // Perform filtering & sorting client-side for smooth instant response
  const filteredAndSortedMovies = useMemo(() => {
    if (!movies) return [];

    let result = [...movies];

    // 1. Multi-genre filter
    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((movie) =>
        filters.genres.some((genre) => movie.genre && movie.genre.includes(genre))
      );
    }

    // 2. Rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      result = result.filter((movie) => movie.reviewsAverage >= minRating);
    }

    // 3. Sort logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isMovieReleased = (movie) => {
      if (!movie.releaseDate) return false;
      const releaseDate = new Date(movie.releaseDate);
      releaseDate.setHours(0, 0, 0, 0);
      return releaseDate <= today;
    };

    result.sort((a, b) => {
      if (filters.sortBy === 'newest') {
        // Prioritize currently released movies, then sort by newest releaseDate.
        // Upcoming movies go below, sorted by earliest releaseDate first.
        const releasedA = isMovieReleased(a);
        const releasedB = isMovieReleased(b);
        
        if (releasedA && !releasedB) return -1;
        if (!releasedA && releasedB) return 1;
        if (releasedA && releasedB) {
          return new Date(b.releaseDate) - new Date(a.releaseDate);
        }
        return new Date(a.releaseDate) - new Date(b.releaseDate);
      }

      if (filters.sortBy === 'rating') {
        if (b.reviewsAverage !== a.reviewsAverage) {
          return (b.reviewsAverage || 0) - (a.reviewsAverage || 0);
        }
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      }

      if (filters.sortBy === 'durationAsc') {
        const durA = parseInt(a.duration) || 0;
        const durB = parseInt(b.duration) || 0;
        return durA - durB;
      }

      if (filters.sortBy === 'durationDesc') {
        const durA = parseInt(a.duration) || 0;
        const durB = parseInt(b.duration) || 0;
        return durB - durA;
      }

      if (filters.sortBy === 'titleAZ') {
        const titleA = language === 'en' ? (a.titleEN || a.title) : a.title;
        const titleB = language === 'en' ? (b.titleEN || b.title) : b.title;
        return (titleA || '').localeCompare(titleB || '', language);
      }

      return 0;
    });

    return result;
  }, [movies, filters.genres, filters.rating, filters.sortBy, language]);

  return (
    <div className="space-y-12 pb-16 relative">
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
          <MovieList movies={filteredAndSortedMovies} />
        )}
      </div>

      {/* Floating Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-brand text-white shadow-[0_4px_20px_rgba(229,9,20,0.4)] hover:bg-brand-light transition-all duration-300 hover:scale-110 z-50 cursor-pointer active:scale-95 animate-in fade-in zoom-in-50 duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default HomePage;