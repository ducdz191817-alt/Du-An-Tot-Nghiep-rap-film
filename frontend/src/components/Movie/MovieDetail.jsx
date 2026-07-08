import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, User, Clock, Calendar, Ticket, ChevronRight, Play, ShieldAlert, Bell, CalendarClock } from 'lucide-react';
import bookingService from '../../services/booking.service';
import Button from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import useAuth from '../../hooks/useAuth';
import Modal from '../common/Modal';
import ReviewSection from './ReviewSection';
import { getPosterUrl, getEmbedUrl } from '../../utils/constants';

export const MovieDetail = ({ movie }) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [ageWarning, setAgeWarning] = useState({ isOpen: false, movieTitle: '', requiredAge: 0, userAge: 0 });
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [trailerError, setTrailerError] = useState(false);
  const [sortBy, setSortBy] = useState('earliest');
  const [formatFilter, setFormatFilter] = useState('');
  const [dateAvailability, setDateAvailability] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // ── Lấy title / description / language theo ngôn ngữ trực tiếp từ DB ──────
  // Nếu phim có titleEN/descriptionEN thì dùng, không thì fallback về bản gốc.
  const displayTitle = language === 'en'
    ? (movie.titleEN || movie.title)
    : movie.title;

  const displayDescription = language === 'en'
    ? (movie.descriptionEN || movie.description)
    : movie.description;

  const displayLanguage = t(movie.language);

  // Tạo các tab ngày (Hôm nay + 3 ngày tiếp theo)
  const dateTabs = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    let dayName = '';
    if (i === 0) {
      dayName = language === 'vi' ? 'Hôm nay' : 'Today';
    } else {
      dayName = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const localDateStr = `${yyyy}-${mm}-${dd}`;

    return {
      isoString: localDateStr,
      dayName,
      dateLabel: d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' }),
    };
  });

  // Fetch availability for all 4 days in parallel, then auto-select nearest available
  useEffect(() => {
    if (!movie?._id || dateTabs.length === 0) return;
    const checkAllDates = async () => {
      setCheckingAvailability(true);
      try {
        const results = await Promise.all(
          dateTabs.map((tab) =>
            bookingService.getShowtimesByMovie(movie._id, tab.isoString)
              .then((data) => ({ date: tab.isoString, hasShowtimes: Array.isArray(data) && data.length > 0 }))
              .catch(() => ({ date: tab.isoString, hasShowtimes: false }))
          )
        );
        const availability = {};
        results.forEach(({ date, hasShowtimes }) => { availability[date] = hasShowtimes; });
        setDateAvailability(availability);
        // Auto-select first date that has showtimes
        const firstAvailable = results.find((r) => r.hasShowtimes);
        setSelectedDate(firstAvailable ? firstAvailable.date : dateTabs[0].isoString);
      } catch {
        setSelectedDate(dateTabs[0].isoString);
      } finally {
        setCheckingAvailability(false);
      }
    };
    checkAllDates();
  }, [movie?._id]);

  // Lấy lịch chiếu khi phim hoặc ngày thay đổi
  useEffect(() => {
    const fetchMovieShowtimes = async () => {
      if (!movie?._id || !selectedDate) return;
      setLoadingShowtimes(true);
      try {
        const result = await bookingService.getShowtimesByMovie(movie._id, selectedDate);
        setShowtimes(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingShowtimes(false);
      }
    };
    fetchMovieShowtimes();
  }, [movie?._id, selectedDate]);

  const handleShowtimeClick = (showtimeId, isPastShowtime) => {
    if (isPastShowtime) {
      alert(t('showtime.alertPastShowtime'));
      return;
    }

    if (user) {
      const userAge = user.age || 0;
      const getMovieAgeLimit = (r) => {
        if (!r) return 0;
        if (r === 'P') return 0;
        const match = r.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const requiredAge = getMovieAgeLimit(movie.rating);
      if (userAge < requiredAge) {
        setAgeWarning({
          isOpen: true,
          movieTitle: movie.title,
          requiredAge,
          userAge,
        });
        return;
      }
    }

    navigate(`/booking/${showtimeId}`);
  };

  // Lọc và sắp xếp showtimes client-side
  const processedShowtimes = useMemo(() => {
    if (!showtimes) return [];

    let filtered = [...showtimes];
    if (formatFilter) {
      filtered = filtered.filter((s) => s.format === formatFilter);
    }

    filtered.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return sortBy === 'earliest' ? timeA - timeB : timeB - timeA;
    });

    return filtered;
  }, [showtimes, formatFilter, sortBy]);

  // Nhóm lịch chiếu theo Rạp
  const groupedShowtimes = useMemo(() => {
    return processedShowtimes.reduce((acc, showtime) => {
      const theaterName = showtime.theater?.name || 'Rạp không xác định';
      if (!acc[theaterName]) {
        acc[theaterName] = [];
      }
      acc[theaterName].push(showtime);
      return acc;
    }, {});
  }, [processedShowtimes]);

  return (
    <div className="space-y-12">
      {/* 1. Backdrop Banner & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 relative">
        {/* Abstract Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-brand/8 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Left: Poster */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-[0_20px_40px_rgba(0,0,0,0.1)] relative group">
            <img
              src={getPosterUrl(movie.posterUrl)}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        {/* Right: Text Information */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-black bg-gray-900 text-white px-3 py-1.5 rounded-md tracking-widest uppercase shadow-md">
                {movie.rating}
              </span>
              {movie.rating && (
                <span className="text-red-600 font-extrabold text-xs bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full">
                  {movie.rating === 'P' ? 'Mọi lứa tuổi (P)' : `Yêu cầu từ ${movie.rating.match(/\d+/)?.[0] || '0'} tuổi trở lên`}
                </span>
              )}
              <span className="text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                <Clock size={14} className="text-brand" /> {movie.duration} {language === 'vi' ? 'phút' : 'min'}
              </span>
              <span className="text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                <Calendar size={14} className="text-brand" /> {new Date(movie.releaseDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-gray-100 tracking-tighter leading-tight">
              {displayTitle}
            </h1>
            <div className="flex flex-wrap gap-2 pt-2">
              {movie.genre.map((g) => (
                <span key={g} className="text-xs font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-default shadow-sm">
                  {t(g)}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">{t('movie.synopsis')}</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base font-semibold">
              {displayDescription}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
              <div className="space-y-1.5">
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[11px] font-black">{t('movie.director')}</p>
                <p className="text-gray-800 dark:text-gray-200 font-bold">{movie.director || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[11px] font-black">{t('movie.languageLabel')}</p>
                <p className="text-gray-800 dark:text-gray-200 font-bold">{displayLanguage}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[11px] font-black">Thời lượng</p>
                <p className="text-gray-800 dark:text-gray-200 font-bold">{movie.duration} {language === 'vi' ? 'phút' : 'min'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[11px] font-black">Khởi chiếu</p>
                <p className="text-gray-800 dark:text-gray-200 font-bold">
                  {new Date(movie.releaseDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[11px] font-black">Quốc gia</p>
                <p className="text-gray-800 dark:text-gray-200 font-bold">{movie.country || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[11px] font-black">Giới hạn tuổi</p>
                <p className="text-gray-800 dark:text-gray-200 font-bold">
                  {movie.rating === 'P' ? 'Mọi lứa tuổi' : `Từ ${movie.rating.match(/\d+/)?.[0] || '0'} tuổi trở lên`}
                </p>
              </div>
            </div>
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-1.5 pt-4">
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[11px] font-black">{t('movie.cast')}</p>
                <p className="text-gray-800 dark:text-gray-200 font-bold leading-relaxed">{movie.cast.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Trình phát video Youtube Trailer */}
      {movie.trailerUrl && movie.trailerUrl.trim() && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span className="bg-brand/20 p-2 rounded-xl text-brand">
                <Play size={24} fill="currentColor" />
              </span>
              {t('movie.trailer')}
            </h2>
          </div>
          <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border border-gray-200 shadow-[0_30px_60px_rgba(0,0,0,0.15)] bg-black group">
            <iframe
              className="absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out"
              src={getEmbedUrl(movie.trailerUrl)}
              title={`Trailer - ${displayTitle}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 3. Banner Sắp chiếu / Sắp ra mắt cho phim chưa/không có lịch chiếu */}
      {(movie.status === 'coming-soon' || movie.status === 'pre-release') && (
        <div className="bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 p-8 md:p-12 rounded-[2rem] shadow-lg mt-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/3 via-transparent to-sky-50/50 pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand/5 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            {/* Icon */}
            <div className={`shrink-0 flex items-center justify-center w-20 h-20 rounded-3xl shadow-lg ${
              movie.status === 'pre-release'
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                : 'bg-gradient-to-br from-brand to-brand-dark'
            }`}>
              {movie.status === 'pre-release'
                ? <Bell size={36} className="text-white" />
                : <CalendarClock size={36} className="text-white" />}
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <span className={`inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${
                movie.status === 'pre-release'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-brand/10 text-brand'
              }`}>
                {movie.status === 'pre-release' ? 'Sắp Ra Mắt' : 'Sắp Chiếu'}
              </span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {movie.status === 'pre-release'
                  ? 'Phim chưa có lịch chiếu'
                  : 'Lịch chiếu sắp được mở'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-2 leading-relaxed max-w-lg">
                {movie.status === 'pre-release'
                  ? 'Phim này chưa được lên lịch chiếu. Quay lại sau để xem lịch chiếu được cập nhật mới nhất.'
                  : 'Phim có lịch chiếu trong thời gian tới. Lịch chiếu hôm nay sẽ tự động mở khi đến ngày chiếu.'}
              </p>

              {/* Release date */}
              {movie.releaseDate && (
                <div className="mt-4 inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3">
                  <Calendar size={16} className="text-brand shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Ngày khởi chiếu dự kiến</p>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                      {new Date(movie.releaseDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Bảng đặt vé theo lịch chiếu */}
      {(movie.status === 'now-showing' || movie.status === 'preview') && (
        <div className="space-y-6 bg-white dark:bg-[#151a28] border border-gray-200 dark:border-gray-800 p-6 md:p-10 rounded-[2rem] shadow-lg mt-12 relative overflow-hidden">
          {/* Subtle glow in background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-200 dark:border-gray-800 pb-6 relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3 tracking-tight">
              <span className="bg-brand/20 p-2 rounded-xl text-brand">
                <Ticket size={24} />
              </span>
              {t('movie.bookShowtimes')}
            </h2>

            {/* Date selection tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x">
              {checkingAvailability
                ? dateTabs.map((tab) => (
                    <div key={tab.isoString} className="flex flex-col items-center px-5 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 shrink-0 animate-pulse">
                      <span className="text-[11px] uppercase font-bold tracking-widest text-gray-300">{tab.dayName}</span>
                      <span className="text-base font-black mt-0.5 text-gray-300">{tab.dateLabel}</span>
                    </div>
                  ))
                : dateTabs.map((tab) => {
                    const isSelected = selectedDate === tab.isoString;
                    const hasShowtimes = dateAvailability[tab.isoString];
                    const availabilityKnown = tab.isoString in dateAvailability;
                    return (
                      <button
                        key={tab.isoString}
                        onClick={() => setSelectedDate(tab.isoString)}
                        className={`relative flex flex-col items-center px-5 py-2.5 rounded-2xl transition-all duration-300 shrink-0 transform active:scale-95 snap-center border ${
                          isSelected
                            ? 'bg-gradient-to-br from-brand to-brand-dark text-white border-transparent shadow-[0_10px_20px_rgba(200,135,43,0.3)]'
                            : availabilityKnown && !hasShowtimes
                              ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-400 dark:hover:text-gray-500 cursor-pointer'
                              : 'bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        <span className="text-[11px] uppercase font-bold tracking-widest opacity-80">{tab.dayName}</span>
                        <span className="text-base font-black mt-0.5">{tab.dateLabel}</span>
                        {/* Availability dot indicator */}
                        {availabilityKnown && (
                          <span
                            className={`mt-1.5 w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white/70'
                                : hasShowtimes
                                  ? 'bg-green-500'
                                  : 'bg-gray-300'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Sub-row: Sort and Format Filter */}
          {!loadingShowtimes && Object.keys(groupedShowtimes).length > 0 && (
            <div className="flex flex-wrap items-center gap-6 py-4 border-b border-gray-200 dark:border-gray-800 relative z-10">
              {/* Sort selector */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('showtime.sortBy')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 pl-3.5 pr-9 py-2 text-xs rounded-xl focus:border-brand/60 outline-none cursor-pointer transition-colors"
                >
                  <option value="earliest">{t('showtime.sort.earliest')}</option>
                  <option value="latest">{t('showtime.sort.latest')}</option>
                </select>
              </div>

              {/* Format selector */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('showtime.format')}:</span>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 pl-3.5 pr-9 py-2 text-xs rounded-xl focus:border-brand/60 outline-none cursor-pointer transition-colors"
                >
                  <option value="">{t('showtime.format.all')}</option>
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                </select>
              </div>
            </div>
          )}

          {/* Danh sách lịch chiếu được nhóm theo rạp */}
          {loadingShowtimes ? (
            <div className="py-16 flex justify-center items-center gap-3 text-gray-500 dark:text-gray-400 font-semibold relative z-10">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              {t('movie.loadingShowtimes')}
            </div>
          ) : Object.keys(groupedShowtimes).length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500 font-semibold relative z-10 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-4">
              {t('movie.noShowtimes')}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800 relative z-10">
              {Object.keys(groupedShowtimes).map((theaterName) => (
                <div key={theaterName} className="py-8 flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                  <div className="w-full md:w-64 shrink-0">
                    <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-lg tracking-tight">
                      {theaterName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">{t('movie.formats')}</p>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-4">
                    {groupedShowtimes[theaterName].map((showtime) => {
                      const showtimeTimestamp = new Date(showtime.startTime).getTime();
                      const isPastShowtime = showtimeTimestamp <= Date.now();
                      const startTimeString = new Date(showtime.startTime).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      return (
                        <button
                          key={showtime._id}
                          onClick={() => handleShowtimeClick(showtime._id, isPastShowtime)}
                          disabled={isPastShowtime}
                          className={`flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 text-left group border ${
                            isPastShowtime
                              ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-70'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-brand/10 dark:hover:bg-brand/10 border-gray-200 dark:border-gray-700 hover:border-brand/50 dark:hover:border-brand/50 hover:-translate-y-1 active:scale-95 shadow-sm hover:shadow-[0_10px_20px_rgba(200,135,43,0.15)]'
                          }`}
                        >
                          <div className="flex-1">
                            <span className={`text-gray-900 dark:text-gray-100 font-black text-base transition-colors ${isPastShowtime ? 'text-gray-400 dark:text-gray-600' : 'group-hover:text-brand'}`}>
                              {startTimeString}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold block uppercase tracking-wider">
                              {showtime.room?.name || 'Screen'} • {showtime.format}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPastShowtime ? (
                              <span className="text-[10px] uppercase font-black tracking-wider text-red-500">{t('showtime.started')}</span>
                            ) : (
                              <ChevronRight size={16} className="text-gray-400 group-hover:text-brand transition-all" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Khu vực đánh giá / bình luận phim */}
      <ReviewSection movieId={movie._id} />

      {/* Modal Cảnh Báo Độ Tuổi */}
      <Modal
        isOpen={ageWarning.isOpen}
        onClose={() => setAgeWarning({ ...ageWarning, isOpen: false })}
        title="Thông báo: Giới hạn độ tuổi"
        size="sm"
      >
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-base">Bạn chưa đủ tuổi xem phim</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              Phim <span className="text-zinc-200 font-bold">"{ageWarning.movieTitle}"</span> yêu cầu độ tuổi tối thiểu từ <span className="text-red-400 font-bold">{ageWarning.requiredAge} tuổi</span> trở lên.
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">
              Số tuổi tài khoản hiện tại của bạn: <span className="text-zinc-300 font-bold">{ageWarning.userAge} tuổi</span>.
            </p>
          </div>
          <Button
            onClick={() => setAgeWarning({ ...ageWarning, isOpen: false })}
            variant="primary"
            className="w-full py-2.5 rounded-xl font-bold mt-2"
          >
            Đã hiểu và quay lại
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MovieDetail;