import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Compass, ArrowUp, Clapperboard, CalendarClock, ChevronDown, ChevronUp, Film } from 'lucide-react';
import { fetchMovies } from '../store/movieSlice';
import MovieList from '../components/Movie/MovieList';
import MovieFilter from '../components/Movie/MovieFilter';
import Loading from '../components/common/Loading';
import { useLanguage } from '../context/LanguageContext';

// Status groups
const NOW_SHOWING_STATUSES = ['now-showing', 'preview'];
const UPCOMING_STATUSES = ['coming-soon', 'pre-release'];

export const MoviesPage = () => {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const { movies, loading, error } = useSelector((state) => state.movie);

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    genres: [],
    rating: '',
    date: '',
    sortBy: 'newest',
  });

  const [showScrollTop, setShowScrollTop] = useState(false);
  // Upcoming section: collapsed by default
  const [showUpcoming, setShowUpcoming] = useState(false);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    const params = {
      status: filters.status,
      search: filters.search,
      date: filters.date,
    };
    if (filters.genres && filters.genres.length > 0) {
      params.genres = filters.genres;
    }
    dispatch(fetchMovies(params));
  }, [dispatch, filters.status, filters.search, filters.date, filters.genres]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // When user explicitly picks a status, expand upcoming if they chose upcoming statuses
    if (UPCOMING_STATUSES.includes(newFilters.status)) {
      setShowUpcoming(true);
    }
  };

  // Apply client-side genre/rating/sort filters
  const applyClientFilters = (list) => {
    let result = [...list];

    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((movie) =>
        filters.genres.some((genre) => movie.genre && movie.genre.includes(genre))
      );
    }

    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      result = result.filter((movie) => movie.reviewsAverage >= minRating);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isReleased = (movie) => {
      if (!movie.releaseDate) return false;
      const d = new Date(movie.releaseDate);
      d.setHours(0, 0, 0, 0);
      return d <= today;
    };

    result.sort((a, b) => {
      if (filters.sortBy === 'newest') {
        const rA = isReleased(a), rB = isReleased(b);
        if (rA && !rB) return -1;
        if (!rA && rB) return 1;
        if (rA && rB) return new Date(b.releaseDate) - new Date(a.releaseDate);
        return new Date(a.releaseDate) - new Date(b.releaseDate);
      }
      if (filters.sortBy === 'rating') {
        if (b.reviewsAverage !== a.reviewsAverage) return (b.reviewsAverage || 0) - (a.reviewsAverage || 0);
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      }
      if (filters.sortBy === 'durationAsc') return (parseInt(a.duration) || 0) - (parseInt(b.duration) || 0);
      if (filters.sortBy === 'durationDesc') return (parseInt(b.duration) || 0) - (parseInt(a.duration) || 0);
      if (filters.sortBy === 'titleAZ') {
        const tA = language === 'en' ? (a.titleEN || a.title) : a.title;
        const tB = language === 'en' ? (b.titleEN || b.title) : b.title;
        return (tA || '').localeCompare(tB || '', language);
      }
      return 0;
    });
    return result;
  };

  // When 'all' status is selected → split into two groups
  const isAllMode = filters.status === 'all';

  const nowShowingMovies = useMemo(() => {
    if (!movies || !isAllMode) return [];
    return applyClientFilters(movies.filter((m) => NOW_SHOWING_STATUSES.includes(m.status)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, filters, language, isAllMode]);

  const upcomingMovies = useMemo(() => {
    if (!movies || !isAllMode) return [];
    return applyClientFilters(movies.filter((m) => UPCOMING_STATUSES.includes(m.status)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, filters, language, isAllMode]);

  // Non-all mode: single filtered list
  const filteredAndSortedMovies = useMemo(() => {
    if (!movies || isAllMode) return [];
    return applyClientFilters([...movies]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, filters, language, isAllMode]);

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Page header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
          <Compass className="text-brand" size={32} /> {t('movies.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">{t('movies.subtitle')}</p>
      </div>

      <MovieFilter filters={filters} onChange={handleFilterChange} />

      {/* ── Content ── */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center font-medium">
          Lỗi: {error}
        </div>
      ) : isAllMode ? (
        /* ── ALL MODE: Two-section layout ── */
        <div className="space-y-12">

          {/* ── Section 1: Đang chiếu ── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand/10 text-brand shrink-0">
                <Clapperboard size={20} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Đang chiếu</h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  {nowShowingMovies.length} phim đang được chiếu tại rạp
                </p>
              </div>
              {/* Live indicator */}
              <span className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>

            {nowShowingMovies.length === 0 ? (
              <div className="w-full text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-white/50">
                <Film size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium">Hiện chưa có phim nào đang chiếu.</p>
              </div>
            ) : (
              <MovieList movies={nowShowingMovies} />
            )}
          </section>

          {/* ── Section 2: Sắp chiếu (collapsible) ── */}
          {upcomingMovies.length > 0 && (
            <section>
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => setShowUpcoming(!showUpcoming)}
                className="w-full flex items-center gap-3 mb-6 group"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 transition-colors ${showUpcoming ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500 group-hover:bg-brand/10 group-hover:text-brand'}`}>
                  <CalendarClock size={20} />
                </div>
                <div className="flex-1 text-left">
                  <h2 className={`text-2xl font-black tracking-tight transition-colors ${showUpcoming ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>
                    Sắp chiếu & Sắp ra mắt
                  </h2>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                    {upcomingMovies.length} phim sắp ra mắt — {showUpcoming ? 'Nhấn để ẩn' : 'Nhấn để xem'}
                  </p>
                </div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${showUpcoming ? 'bg-brand/10 border-brand/30 text-brand' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-brand/30 group-hover:text-brand'}`}>
                  {showUpcoming ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Collapsible content */}
              {showUpcoming && (
                <div className="animate-in fade-in slide-in-from-top-3 duration-300">
                  <MovieList movies={upcomingMovies} />
                </div>
              )}
            </section>
          )}
        </div>
      ) : (
        /* ── SINGLE STATUS MODE: Normal list ── */
        <MovieList movies={filteredAndSortedMovies} />
      )}

      {/* Scroll-to-top button */}
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

export default MoviesPage;