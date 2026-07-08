import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Star, SlidersHorizontal, Calendar, Film } from 'lucide-react';
import { MOVIE_GENRES } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';

export const MovieFilter = ({ filters, onChange }) => {
  const { t, language } = useLanguage();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const statusRef = useRef(null);
  const genreRef = useRef(null);
  const ratingRef = useRef(null);
  const dateRef = useRef(null);
  const sortRef = useRef(null);
  const dateInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
      if (genreRef.current && !genreRef.current.contains(event.target)) {
        setIsGenreOpen(false);
      }
      if (ratingRef.current && !ratingRef.current.contains(event.target)) {
        setIsRatingOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setIsDateOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (status) => {
    onChange({ ...filters, status });
  };

  const handleSearchChange = (e) => {
    onChange({ ...filters, search: e.target.value });
  };

  const selectedStatus = filters.status || 'all';
  const selectedGenres = filters.genres || [];
  const selectedRating = filters.rating || '';
  const selectedDate = filters.date || '';
  const selectedSortBy = filters.sortBy || 'newest';

  const handleGenreToggle = (genre) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onChange({ ...filters, genres: newGenres });
  };

  const handleRatingSelect = (rating) => {
    onChange({ ...filters, rating });
    setIsRatingOpen(false);
  };

  const handleSortSelect = (sortBy) => {
    onChange({ ...filters, sortBy });
    setIsSortOpen(false);
  };

  const handleClearFilters = () => {
    onChange({
      ...filters,
      search: '',
      genres: [],
      rating: '',
      sortBy: 'newest',
      status: 'all',
      date: '',
    });
  };

  const hasActiveFilters =
    (filters.search && filters.search !== '') ||
    selectedGenres.length > 0 ||
    selectedRating !== '' ||
    selectedStatus !== 'all' ||
    selectedDate !== '' ||
    selectedSortBy !== 'newest';

  const statusOptions = [
    { value: 'all', label: t('filter.statusAll') },
    { value: 'now-showing', label: t('filter.nowShowing') },
    { value: 'coming-soon', label: t('filter.comingSoon') },
    { value: 'preview', label: t('filter.preview') },
    { value: 'pre-release', label: t('filter.preRelease') },
  ];

  const dateOptions = useMemo(() => {
    const options = [{ value: '', label: t('filter.dateAll') }];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoString = `${yyyy}-${mm}-${dd}`;

      let label = '';
      if (i === 0) {
        label = language === 'vi' ? 'Hôm nay' : 'Today';
      } else if (i === 1) {
        label = language === 'vi' ? 'Ngày mai' : 'Tomorrow';
      } else {
        label = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
      }
      const dateLabel = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });
      options.push({
        value: isoString,
        label: `${label} (${dateLabel})`,
      });
    }
    return options;
  }, [language, t]);

  const selectedDateIsCustom = useMemo(() => {
    if (!selectedDate) return false;
    return !dateOptions.some((opt) => opt.value === selectedDate);
  }, [selectedDate, dateOptions]);

  const getFriendlyDateLabel = () => {
    if (!selectedDate) return t('filter.dateAll');
    const matched = dateOptions.find((opt) => opt.value === selectedDate);
    if (matched) return matched.label;

    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  };

  const ratingOptions = [
    { value: '', label: t('filter.ratingAll') },
    { value: '4.5', label: t('filter.ratingAbove4.5') },
    { value: '4.0', label: t('filter.ratingAbove4.0') },
    { value: '3.0', label: t('filter.ratingAbove3.0') },
  ];

  const sortOptions = [
    { value: 'newest', label: t('filter.sort.newest') },
    { value: 'rating', label: t('filter.sort.rating') },
    { value: 'durationAsc', label: t('filter.sort.durationAsc') },
    { value: 'durationDesc', label: t('filter.sort.durationDesc') },
    { value: 'titleAZ', label: t('filter.sort.titleAZ') },
  ];

  return (
    <div className="space-y-4 bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 p-4 sm:p-5 rounded-2xl shadow-sm">
      {/* Row 1: Status tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status tabs */}
        <div className="flex flex-wrap items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => handleStatusChange('all')}
            className={`flex-1 lg:flex-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap ${filters.status === 'all'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            {t('filter.statusAll')}
          </button>
          <button
            onClick={() => handleStatusChange('now-showing')}
            className={`flex-1 lg:flex-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap ${filters.status === 'now-showing'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            {t('filter.nowShowing')}
          </button>
          <button
            onClick={() => handleStatusChange('coming-soon')}
            className={`flex-1 lg:flex-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap ${filters.status === 'coming-soon'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            {t('filter.comingSoon')}
          </button>
          <button
            onClick={() => handleStatusChange('preview')}
            className={`flex-1 lg:flex-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap ${filters.status === 'preview'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            {t('filter.preview')}
          </button>
          <button
            onClick={() => handleStatusChange('pre-release')}
            className={`flex-1 lg:flex-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap ${filters.status === 'pre-release'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            {t('filter.preRelease')}
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-full lg:max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={t('filter.searchPlaceholder')}
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 pl-10 pr-4 py-2.5 text-sm rounded-xl focus:border-brand/60 focus:bg-white dark:focus:bg-[#1a2035] outline-none transition-all duration-300"
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 ${showAdvancedFilters ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-brand hover:border-brand/30'}`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Row 2: Status Dropdown, Genre Dropdown, Rating Dropdown, Date Dropdown, Sort Dropdown & Clear Filters */}
      {showAdvancedFilters && (
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wider pr-1">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <span>{t('filter.sortBy').split(':')[0]}:</span>
          </div>

          {/* Status filter dropdown */}
          <div className="relative" ref={statusRef}>
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border text-sm rounded-xl transition-all hover:bg-gray-100 cursor-pointer ${selectedStatus !== 'now-showing'
                  ? 'border-brand/40 text-brand font-semibold bg-brand/5'
                  : 'border-gray-200 text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                <Film size={13} className={selectedStatus !== 'now-showing' ? 'text-brand' : 'text-gray-400'} />
                {statusOptions.find((o) => o.value === selectedStatus)?.label || selectedStatus}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} />
            </button>
            {isStatusOpen && (
              <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white border border-gray-200 shadow-xl z-50 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      handleStatusChange(opt.value);
                      setIsStatusOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedStatus === opt.value
                        ? 'text-brand bg-brand/5 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {selectedStatus === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Genre Multi-select dropdown */}
          <div className="relative" ref={genreRef}>
            <button
              type="button"
              onClick={() => setIsGenreOpen(!isGenreOpen)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border text-sm rounded-xl transition-all hover:bg-gray-100 cursor-pointer ${selectedGenres.length > 0
                  ? 'border-brand/40 text-brand font-semibold bg-brand/5'
                  : 'border-gray-200 text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="truncate max-w-[140px]">
                {selectedGenres.length === 0
                  ? t('filter.allGenres')
                  : selectedGenres.length === 1
                    ? t(selectedGenres[0])
                    : `${selectedGenres.length} ${t('filter.selectedGenres')}`}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${isGenreOpen ? 'rotate-180' : ''}`} />
            </button>
            {isGenreOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-50 p-2 max-h-72 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {MOVIE_GENRES.map((g) => {
                  const isChecked = selectedGenres.includes(g);
                  return (
                    <label
                      key={g}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg hover:bg-gray-50 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span>{t(g)}</span>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleGenreToggle(g)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked
                            ? 'bg-brand border-brand text-white shadow-md shadow-brand/20'
                            : 'border-gray-300 bg-gray-50'
                          }`}>
                          {isChecked && <Check size={11} strokeWidth={3.5} />}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rating filter dropdown */}
          <div className="relative" ref={ratingRef}>
            <button
              type="button"
              onClick={() => setIsRatingOpen(!isRatingOpen)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border text-sm rounded-xl transition-all hover:bg-gray-100 cursor-pointer ${selectedRating !== ''
                  ? 'border-amber-400/40 text-amber-600 font-semibold bg-amber-50'
                  : 'border-gray-200 text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="flex items-center gap-1">
                {selectedRating !== '' && <Star size={13} className="fill-amber-500 text-amber-500 shrink-0" />}
                {ratingOptions.find((o) => o.value === selectedRating)?.label}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isRatingOpen ? 'rotate-180' : ''}`} />
            </button>
            {isRatingOpen && (
              <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white border border-gray-200 shadow-xl z-50 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {ratingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleRatingSelect(opt.value)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedRating === opt.value
                        ? 'text-amber-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {selectedRating === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date filter dropdown */}
          <div className="relative" ref={dateRef}>
            <button
              type="button"
              onClick={() => setIsDateOpen(!isDateOpen)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border text-sm rounded-xl transition-all hover:bg-gray-100 cursor-pointer ${selectedDate !== ''
                  ? 'border-brand/40 text-brand font-semibold bg-brand/5'
                  : 'border-gray-200 text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="flex items-center gap-1.5 truncate max-w-[160px]">
                <Calendar size={13} className={selectedDate !== '' ? 'text-brand' : 'text-gray-400'} />
                {getFriendlyDateLabel()}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isDateOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDateOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-50 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange({ ...filters, date: opt.value });
                        setIsDateOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedDate === opt.value
                          ? 'text-brand bg-brand/5 font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {selectedDate === opt.value && <Check size={14} />}
                    </button>
                  ))}
                </div>

                {/* Custom date input option */}
                <div className="border-t border-gray-200 my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (dateInputRef.current) {
                        dateInputRef.current.showPicker();
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedDateIsCustom
                        ? 'text-brand bg-brand/5 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="truncate max-w-[130px]">
                      {selectedDateIsCustom ? getFriendlyDateLabel() : t('filter.customDate')}
                    </span>
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                  </button>
                  <input
                    type="date"
                    ref={dateInputRef}
                    value={selectedDateIsCustom ? selectedDate : ''}
                    onChange={(e) => {
                      onChange({ ...filters, date: e.target.value });
                      setIsDateOpen(false);
                    }}
                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border text-sm rounded-xl transition-all hover:bg-gray-100 cursor-pointer ${selectedSortBy !== 'newest'
                  ? 'border-brand/40 text-brand font-semibold bg-brand/5'
                  : 'border-gray-200 text-gray-600 hover:text-gray-800'
                }`}
            >
              <span className="truncate max-w-[140px]">
                {t('filter.sortBy')}: {sortOptions.find((o) => o.value === selectedSortBy)?.label}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSortOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-50 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortSelect(opt.value)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedSortBy === opt.value
                        ? 'text-brand bg-brand/5 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {selectedSortBy === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-gray-400 hover:text-red-500 text-xs font-bold rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 transition-all duration-300 active:scale-95 whitespace-nowrap cursor-pointer mt-2 sm:mt-0"
          >
            <X size={14} />
            <span>{t('filter.clearAll')}</span>
          </button>
        )}
        </div>
      )}
    </div>
  );
};

export default MovieFilter;