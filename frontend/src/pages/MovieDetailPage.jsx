import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import { fetchMovieDetail, clearMovieDetail } from '../store/movieSlice';
import MovieDetail from '../components/Movie/MovieDetail';
import Loading from '../components/common/Loading';
import { useLanguage } from '../context/LanguageContext';

export const MovieDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentMovie, loading, error } = useSelector((state) => state.movie);
  const { t } = useLanguage();

  useEffect(() => {
    dispatch(fetchMovieDetail(id));
    return () => {
      dispatch(clearMovieDetail());
    };
  }, [dispatch, id]);

  if (loading) return <Loading fullPage />;
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl font-medium shadow-md">
          {t('movie.errorLoad')}: {error}
        </div>
        <Link to="/" className="text-brand font-bold text-sm hover:underline inline-flex items-center gap-1">
          <ChevronLeft size={16} /> {t('movie.backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Nút quay lại */}
      <Link
        to="/"
        className="inline-flex items-center text-gray-500 hover:text-gray-900 text-sm font-extrabold uppercase tracking-wider gap-1.5 transition-colors pb-2"
      >
        <ChevronLeft size={16} /> {t('movie.backToCatalog')}
      </Link>

      {currentMovie && <MovieDetail movie={currentMovie} />}
    </div>
  );
};

export default MovieDetailPage;