import React from 'react';
import { Search } from 'lucide-react';
import { MOVIE_GENRES } from '../../utils/constants';

export const MovieFilter = ({ filters, onChange }) => {
  const handleStatusChange = (status) => {
    onChange({ ...filters, status });
  };

  const handleSearchChange = (e) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleGenreChange = (e) => {
    onChange({ ...filters, genre: e.target.value });
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-dark-card border border-dark-border p-4 rounded-2xl">
      {/* Status tabs */}
      <div className="flex items-center bg-zinc-900 p-1.5 rounded-xl border border-dark-border w-full md:w-auto shrink-0">
        <button
          onClick={() => handleStatusChange('now-showing')}
          className={`flex-1 md:flex-none text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
            filters.status === 'now-showing'
              ? 'bg-brand text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Đang chiếu
        </button>
        <button
          onClick={() => handleStatusChange('coming-soon')}
          className={`flex-1 md:flex-none text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
            filters.status === 'coming-soon'
              ? 'bg-brand text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Sắp chiếu
        </button>
        <button
          onClick={() => handleStatusChange('preview')}
          className={`flex-1 md:flex-none text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
            filters.status === 'preview'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Chiếu sớm
        </button>
        <button
          onClick={() => handleStatusChange('pre-release')}
          className={`flex-1 md:flex-none text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
            filters.status === 'pre-release'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Sắp ra mắt
        </button>
      </div>

      {/* Query Search & Genre dropdown filters */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Search */}
        <div className="relative flex-1 md:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm tên phim..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 pl-9 pr-4 py-2 text-sm rounded-xl focus:border-brand outline-none transition-all"
          />
        </div>

        {/* Genre select */}
        <select
          value={filters.genre}
          onChange={handleGenreChange}
          className="bg-zinc-900 border border-zinc-800 text-zinc-400 pl-3 pr-8 py-2 text-sm rounded-xl focus:border-brand focus:text-zinc-200 outline-none cursor-pointer select-none"
        >
          <option value="">Tất cả thể loại</option>
          {MOVIE_GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MovieFilter;