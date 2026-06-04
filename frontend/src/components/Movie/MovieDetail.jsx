import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, User, Clock, Calendar, Ticket, ChevronRight, Play } from 'lucide-react';
import bookingService from '../../services/booking.service';
import Button from '../common/Button';

export const MovieDetail = ({ movie }) => {
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  // Tạo các tab ngày (Hôm nay + 3 ngày tiếp theo)
  const dateTabs = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      isoString: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
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

  const handleShowtimeClick = (showtimeId) => {
    navigate(`/booking/${showtimeId}`);
  };

  // Nhóm lịch chiếu theo Rạp
  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    const theaterName = showtime.theater?.name || 'Rạp không xác định';
    if (!acc[theaterName]) {
      acc[theaterName] = [];
    }
    acc[theaterName].push(showtime);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      {/* 1. Banner nền & Lưới chi tiết */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Trái: Poster */}
        <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-dark-border shadow-2xl">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Phải: Thông tin văn bản */}
        <div className="md:col-span-2 space-y-6 flex flex-col justify-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-black bg-brand px-3 py-1 rounded-md text-white tracking-wide uppercase">
                {movie.rating}
              </span>
              <span className="text-zinc-400 font-medium text-sm flex items-center gap-1">
                <Clock size={15} /> {movie.duration} phút
              </span>
              <span className="text-zinc-400 font-medium text-sm flex items-center gap-1">
                <Calendar size={15} /> {new Date(movie.releaseDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {movie.title}
            </h1>
            <div className="flex flex-wrap gap-2 pt-1">
              {movie.genre.map((g) => (
                <span key={g} className="text-xs font-bold bg-zinc-900 border border-dark-border text-zinc-300 px-3 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="border-y border-dark-border py-4 space-y-3">
            <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
              {movie.description}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
              <p className="text-zinc-500">
                <strong className="text-zinc-300">Đạo diễn:</strong> {movie.director || 'Đang cập nhật'}
              </p>
              <p className="text-zinc-500">
                <strong className="text-zinc-300">Ngôn ngữ:</strong> {movie.language}
              </p>
            </div>
            {movie.cast && movie.cast.length > 0 && (
              <p className="text-sm text-zinc-500">
                <strong className="text-zinc-300">Diễn viên:</strong> {movie.cast.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Trình phát video Youtube Trailer */}
      {movie.trailerUrl && (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Play size={20} className="text-brand" /> Trailer Phim
          </h2>
          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-dark-border shadow-2xl bg-black">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={movie.trailerUrl}
              title={`Trailer chính thức của ${movie.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 3. Bảng đặt vé theo lịch chiếu */}
      {movie.status === 'now-showing' && (
        <div className="space-y-6 bg-dark-card border border-dark-border p-6 md:p-8 rounded-3xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Ticket size={22} className="text-brand" /> Đặt Vé
            </h2>

            {/* Các tab chọn ngày */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {dateTabs.map((tab) => {
                const isSelected = selectedDate === tab.isoString;
                return (
                  <button
                    key={tab.isoString}
                    onClick={() => setSelectedDate(tab.isoString)}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-300 shrink-0 transform active:scale-95 border ${
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-md'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">{tab.dayName}</span>
                    <span className="text-sm font-black">{tab.dateLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh sách lịch chiếu được nhóm theo rạp */}
          {loadingShowtimes ? (
            <div className="py-12 flex justify-center text-zinc-400 animate-pulse font-semibold">
              Đang tải lịch chiếu...
            </div>
          ) : Object.keys(groupedShowtimes).length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-medium">
              Không có suất chiếu nào trong ngày này. Vui lòng chọn ngày khác!
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {Object.keys(groupedShowtimes).map((theaterName) => (
                <div key={theaterName} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                  <h3 className="w-full md:w-64 font-bold text-zinc-200 text-base shrink-0 pt-1">
                    {theaterName}
                  </h3>

                  <div className="flex-1 flex flex-wrap gap-3">
                    {groupedShowtimes[theaterName].map((showtime) => {
                      const startTimeString = new Date(showtime.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      return (
                        <button
                          key={showtime._id}
                          onClick={() => handleShowtimeClick(showtime._id)}
                          className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-brand/40 px-4 py-2.5 rounded-xl transition-all text-left group transform hover:-translate-y-0.5 active:scale-95"
                        >
                          <div>
                            <span className="text-zinc-100 font-black text-sm group-hover:text-brand transition-colors block">
                              {startTimeString}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-semibold block uppercase">
                              {showtime.room?.name || 'Phòng chiếu'} ({showtime.format})
                            </span>
                          </div>
                          <ChevronRight size={14} className="text-zinc-600 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
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
    </div>
  );
};

export default MovieDetail;