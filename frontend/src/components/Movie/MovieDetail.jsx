import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, User, Clock, Calendar, Ticket, ChevronRight, Play, ShieldAlert } from 'lucide-react';
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

    return {
      isoString: d.toISOString().split('T')[0],
      dayName,
      dateLabel: d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' }),
    };
  });

  useEffect(() => {
    if (dateTabs.length > 0 && !selectedDate) {
      setSelectedDate(dateTabs[0].isoString);
    }
  }, []);

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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-brand/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Left: Poster */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] relative group">
            <img
              src={getPosterUrl(movie.posterUrl)}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        {/* Right: Text Information */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-black bg-white text-black px-3 py-1 rounded-md tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {movie.rating}
              </span>
              {movie.rating && (
                <span className="text-red-400 font-extrabold text-xs bg-red-500/10 border border-red-500/20 px-3.5 py-1 rounded-full backdrop-blur-sm">
                  {movie.rating === 'P' ? 'Mọi lứa tuổi (P)' : `Yêu cầu từ ${movie.rating.match(/\d+/)?.[0] || '0'} tuổi trở lên`}
                </span>
              )}
              <span className="text-zinc-400 font-semibold text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                <Clock size={14} className="text-brand" /> {movie.duration} {language === 'vi' ? 'phút' : 'min'}
              </span>
              <span className="text-zinc-400 font-semibold text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                <Calendar size={14} className="text-brand" /> {new Date(movie.releaseDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">
              {displayTitle}
            </h1>
            <div className="flex flex-wrap gap-2 pt-2">
              {movie.genre.map((g) => (
                <span key={g} className="text-xs font-bold bg-dark-card border border-white/10 text-zinc-300 px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-default shadow-sm">
                  {t(g)}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-dark-card/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">{t('movie.synopsis')}</h3>
            <p className="text-zinc-300 leading-relaxed text-sm md:text-base font-medium">
              {displayDescription}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm pt-4 border-t border-white/5 mt-4">
              <div className="space-y-1">
                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-black">{t('movie.director')}</p>
                <p className="text-zinc-200 font-medium">{movie.director || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-black">{t('movie.languageLabel')}</p>
                <p className="text-zinc-200 font-medium">{displayLanguage}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-black">Thời lượng</p>
                <p className="text-zinc-200 font-medium">{movie.duration} {language === 'vi' ? 'phút' : 'min'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-black">Khởi chiếu</p>
                <p className="text-zinc-200 font-medium">
                  {new Date(movie.releaseDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-black">Quốc gia</p>
                <p className="text-zinc-200 font-medium">{movie.country || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-black">Giới hạn tuổi</p>
                <p className="text-zinc-200 font-medium">
                  {movie.rating === 'P' ? 'Mọi lứa tuổi' : `Từ ${movie.rating.match(/\d+/)?.[0] || '0'} tuổi trở lên`}
                </p>
              </div>
            </div>
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-1 pt-4">
                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-black">{t('movie.cast')}</p>
                <p className="text-zinc-200 font-medium leading-relaxed">{movie.cast.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Trình phát video Youtube Trailer */}
      {movie.trailerUrl && movie.trailerUrl.trim() && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-dark-border/50 pb-4">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <span className="bg-brand/20 p-2 rounded-xl text-brand">
                <Play size={24} fill="currentColor" />
              </span>
              {t('movie.trailer')}
            </h2>
          </div>
          <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.7)] bg-black group">
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

      {/* 3. Bảng đặt vé theo lịch chiếu */}
      {(movie.status === 'now-showing' || movie.status === 'preview') && (
        <div className="space-y-6 bg-dark-card/60 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-12 relative overflow-hidden">
          {/* Subtle glow in background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6 relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <span className="bg-brand/20 p-2 rounded-xl text-brand">
                <Ticket size={24} />
              </span>
              {t('movie.bookShowtimes')}
            </h2>

            {/* Date selection tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x">
              {dateTabs.map((tab) => {
                const isSelected = selectedDate === tab.isoString;
                return (
                  <button
                    key={tab.isoString}
                    onClick={() => setSelectedDate(tab.isoString)}
                    className={`flex flex-col items-center px-5 py-2.5 rounded-2xl transition-all duration-300 shrink-0 transform active:scale-95 snap-center border ${
                      isSelected
                        ? 'bg-gradient-to-br from-brand to-red-700 text-white border-transparent shadow-[0_10px_20px_rgba(239,68,68,0.3)]'
                        : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white backdrop-blur-sm'
                    }`}
                  >
                    <span className="text-[11px] uppercase font-bold tracking-widest opacity-80">{tab.dayName}</span>
                    <span className="text-base font-black mt-0.5">{tab.dateLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-row: Sort and Format Filter */}
          {!loadingShowtimes && Object.keys(groupedShowtimes).length > 0 && (
            <div className="flex flex-wrap items-center gap-6 py-4 border-b border-white/5 relative z-10">
              {/* Sort selector */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('showtime.sortBy')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white pl-3.5 pr-9 py-2 text-xs rounded-xl focus:border-brand/60 outline-none cursor-pointer transition-colors"
                >
                  <option value="earliest">{t('showtime.sort.earliest')}</option>
                  <option value="latest">{t('showtime.sort.latest')}</option>
                </select>
              </div>

              {/* Format selector */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('showtime.format')}:</span>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white pl-3.5 pr-9 py-2 text-xs rounded-xl focus:border-brand/60 outline-none cursor-pointer transition-colors"
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
            <div className="py-16 flex justify-center items-center gap-3 text-zinc-400 font-semibold relative z-10">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              {t('movie.loadingShowtimes')}
            </div>
          ) : Object.keys(groupedShowtimes).length === 0 ? (
            <div className="py-16 text-center text-zinc-500 font-medium relative z-10 bg-black/20 rounded-2xl border border-white/5 px-4">
              {t('movie.noShowtimes')}
            </div>
          ) : (
            <div className="divide-y divide-white/5 relative z-10">
              {Object.keys(groupedShowtimes).map((theaterName) => (
                <div key={theaterName} className="py-8 flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                  <div className="w-full md:w-64 shrink-0">
                    <h3 className="font-bold text-white text-lg tracking-tight">
                      {theaterName}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">{t('movie.formats')}</p>
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
                          className={`flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 text-left group backdrop-blur-sm border ${
                            isPastShowtime
                              ? 'bg-white/5 border-white/10 text-zinc-500 cursor-not-allowed opacity-70'
                              : 'bg-white/5 hover:bg-brand/10 border-white/10 hover:border-brand/50 hover:-translate-y-1 active:scale-95 shadow-sm hover:shadow-[0_10px_20px_rgba(239,68,68,0.15)]'
                          }`}
                        >
                          <div className="flex-1">
                            <span className={`text-zinc-100 font-black text-base transition-colors ${isPastShowtime ? 'text-zinc-400' : 'group-hover:text-brand'}`}>
                              {startTimeString}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                              {showtime.room?.name || 'Screen'} • {showtime.format}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPastShowtime ? (
                              <span className="text-[10px] uppercase font-black tracking-wider text-red-400">{t('showtime.started')}</span>
                            ) : (
                              <ChevronRight size={16} className="text-zinc-600 group-hover:text-brand transition-all" />
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