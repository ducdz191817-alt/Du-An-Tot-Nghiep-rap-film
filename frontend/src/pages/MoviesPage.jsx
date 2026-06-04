import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Compass } from 'lucide-react';
import { fetchMovies } from '../store/movieSlice';
import MovieList from '../components/Movie/MovieList';
import MovieFilter from '../components/Movie/MovieFilter';
import Loading from '../components/common/Loading';

export const MoviesPage = () => {
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

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-2">
          <Compass className="text-brand" size={28} /> Danh mục phim
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Duyệt danh sách phim đang chiếu hoặc xem trước các phim sắp ra mắt.</p>
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
          <MovieList movies={movies} />
        )}
      </div>
    </div>
  );
};

export default MoviesPage;