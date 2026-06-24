import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Film, CalendarDays, Compass, Star, ArrowUp, ChevronLeft, ChevronRight, Sparkles, Heart, Zap, Wand2, Users } from 'lucide-react';
import { fetchMovies } from '../store/movieSlice';
import MovieList from '../components/Movie/MovieList';
import MovieFilter from '../components/Movie/MovieFilter';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getPosterUrl } from '../utils/constants';

// Genre theme data for "Chủ đề nổi bật"
const GENRE_THEMES = [
  { key: 'Drama', icon: Sparkles, label: 'Luxury', labelVI: 'Luxury', desc: 'Đẳng cấp & Thượng lưu', descEN: 'Premium & Luxury', color: 'from-amber-900/80 to-amber-700/60', border: 'border-amber-400/30' },
  { key: 'Sci-Fi', icon: Wand2, label: 'Sci-Fi', labelVI: 'Sci-Fi', desc: 'Khoa học viễn tưởng', descEN: 'Science Fiction', color: 'from-blue-900/80 to-blue-700/60', border: 'border-blue-400/30' },
  { key: 'Action', icon: Zap, label: 'Action', labelVI: 'Action', desc: 'Hành động mãn nhãn', descEN: 'Thrilling Action', color: 'from-orange-900/80 to-orange-700/60', border: 'border-orange-400/30' },
  { key: 'Romance', icon: Heart, label: 'Romance', labelVI: 'Romance', desc: 'Lãng mạn & Cảm xúc', descEN: 'Romance & Emotion', color: 'from-pink-900/80 to-pink-700/60', border: 'border-pink-400/30' },
  { key: 'Family', icon: Users, label: 'Family', labelVI: 'Family', desc: 'Gia đình & Hoạt hình', descEN: 'Family & Animation', color: 'from-green-900/80 to-green-700/60', border: 'border-green-400/30' },
];

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
  
  const [bannerImageError, setBannerImageError] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const genreScrollRef = useRef(null);

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

  const handleBannerImageError = (idx) => {
    setBannerImageError(prev => ({ ...prev, [idx]: true }));
  };

  const nowShowingMovies = movies.filter((m) => m.status === 'now-showing');
  
  // Lấy top 5 phim nổi bật cho banner carousel
  const bannerMovies = useMemo(() => {
    const topMovies = nowShowingMovies.length > 0 ? nowShowingMovies : movies;
    return topMovies.slice(0, 5);
  }, [nowShowingMovies, movies]);

  const featured = bannerMovies[currentBannerIndex] || bannerMovies[0] || movies[0];

  // Auto-advance banner
  useEffect(() => {
    if (bannerMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % bannerMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bannerMovies.length]);

  const goToBanner = useCallback((dir) => {
    if (bannerMovies.length <= 1) return;
    setCurrentBannerIndex(prev => {
      if (dir === 'prev') return prev === 0 ? bannerMovies.length - 1 : prev - 1;
      return (prev + 1) % bannerMovies.length;
    });
  }, [bannerMovies.length]);

  // Lấy title / description theo ngôn ngữ trực tiếp từ DB
  const featuredTitle = featured
    ? (language === 'en' ? (featured.titleEN || featured.title) : featured.title)
    : '';
  const featuredDescription = featured
    ? (language === 'en' ? (featured.descriptionEN || featured.description) : featured.description)
    : '';

  // Genre scroll
  const scrollGenres = (dir) => {
    if (!genreScrollRef.current) return;
    const scrollAmount = 280;
    genreScrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

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
        <div className="relative w-full aspect-[21/9] min-h-[350px] md:min-h-[500px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] bg-gradient-to-br from-[#f5efe6] to-[#ede4d4] border border-[#e0d5c3]/60 group">
          {!bannerImageError[currentBannerIndex] && (
            <img
              src={getPosterUrl(featured.posterUrl)}
              alt={featuredTitle}
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000 ease-out"
              onError={() => handleBannerImageError(currentBannerIndex)}
            />
          )}
          {/* Gradients - warm light overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#faf7f2] via-[#faf7f2]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf7f2] via-[#faf7f2]/50 to-transparent" />
          
          {/* Golden sparkle decorations */}
          <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-amber-400 rotate-45 opacity-60 animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-300 rotate-45 opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-amber-400 rotate-45 opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
 
          {/* Banner Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl space-y-4">
            <span className="text-[10px] font-black bg-brand px-3 py-1 rounded text-white tracking-widest uppercase w-max select-none shadow-md">
              {t('home.featured')}
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-tight tracking-tighter drop-shadow-sm">
              {featuredTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-medium line-clamp-3 md:line-clamp-4 max-w-2xl">
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
                  className="py-2.5 px-5 font-bold text-sm bg-white/80 hover:bg-white text-gray-700 rounded-xl flex items-center gap-2 border border-gray-200 active:scale-95 transition-all shadow-sm"
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

          {/* Dark mode / Light mode toggle icons (decorative) */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-white/70 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-brand transition-colors shadow-sm">
              <Sparkles size={16} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/70 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-500 hover:text-brand transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
          </div>

          {/* Carousel Arrows */}
          {bannerMovies.length > 1 && (
            <>
              <button
                onClick={() => goToBanner('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-600 hover:text-brand hover:bg-white transition-all shadow-md z-10"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => goToBanner('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-600 hover:text-brand hover:bg-white transition-all shadow-md z-10"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}

      {/* 2. Thanh bộ lọc điều hướng tương tác */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl md:text-3xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
            <Compass className="text-brand" size={24} /> {t('home.discover')}
          </h2>
        </div>

        <MovieFilter filters={filters} onChange={handleFilterChange} />
      </div>

      {/* 4. Lưới danh sách phim */}
      <div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center font-medium">
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
          className="fixed bottom-6 right-6 p-3 rounded-full bg-brand text-white shadow-[0_4px_20px_rgba(200,135,43,0.4)] hover:bg-brand-light transition-all duration-300 hover:scale-110 z-50 cursor-pointer active:scale-95 animate-in fade-in zoom-in-50 duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default HomePage;