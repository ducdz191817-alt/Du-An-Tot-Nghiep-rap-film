import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Compass, ArrowUp } from 'lucide-react';
import { fetchMovies } from '../store/movieSlice';
import MovieList from '../components/Movie/MovieList';
import MovieFilter from '../components/Movie/MovieFilter';
import Loading from '../components/common/Loading';
import { useLanguage } from '../context/LanguageContext';

export const MoviesPage = () => {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const { movies, loading, error } = useSelector((state) => state.movie);
  const [filters, setFilters] = useState({
    status: 'now-showing',
    search: '',
    genres: [],
    rating: '',
    date: '',
    sortBy: 'newest',
  });

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
    dispatch(fetchMovies({ status: filters.status, search: filters.search, date: filters.date }));
  }, [dispatch, filters.status, filters.search, filters.date]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

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
    <div className="space-y-8 pb-16 relative">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
          <Compass className="text-brand" size={32} /> {t('movies.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">{t('movies.subtitle')}</p>
      </div>

      <MovieFilter filters={filters} onChange={handleFilterChange} />

      <div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center font-medium">
            Lỗi: {error}
          </div>
        ) : (
          <MovieList movies={filteredAndSortedMovies} />
        )}
      </div>

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