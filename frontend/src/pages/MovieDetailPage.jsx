import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import { fetchMovieDetail, clearMovieDetail } from '../store/movieSlice';
import MovieDetail from '../components/Movie/MovieDetail';
import Loading from '../components/common/Loading';

export const MovieDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentMovie, loading, error } = useSelector((state) => state.movie);

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
          Không thể tải thông tin chi tiết phim: {error}
        </div>
        <Link to="/" className="text-brand font-bold text-sm hover:underline inline-flex items-center gap-1">
          <ChevronLeft size={16} /> Trở về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Nút quay lại */}
      <Link
        to="/"
        className="inline-flex items-center text-zinc-400 hover:text-white text-xs font-extrabold uppercase tracking-wider gap-1.5 transition-colors pb-2"
      >
        <ChevronLeft size={16} /> Quay lại danh mục
      </Link>

      {currentMovie && <MovieDetail movie={currentMovie} />}
    </div>
  );
};

export default MovieDetailPage;