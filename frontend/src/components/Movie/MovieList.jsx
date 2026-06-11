import React from 'react';
import MovieCard from './MovieCard';

export const MovieList = ({ movies = [] }) => {
  if (movies.length === 0) {
    return (
      <div className="w-full text-center py-16 border border-dashed border-dark-border rounded-2xl bg-dark-card/30">
        <p className="text-zinc-500 font-medium">Không tìm thấy phim nào khớp với bộ lọc của bạn.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie._id} movie={movie} />
      ))}
    </div>
  );
};

export default MovieList;