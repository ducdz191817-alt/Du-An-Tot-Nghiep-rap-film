import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Eye, Search, Sparkles, Star, Calendar, Clock, Loader2, TrendingUp, Flame } from 'lucide-react';
import movieService from '../../services/movie.service';
import adminService from '../../services/admin.service';
import Input from '../common/Input';
import AutocompleteInput from '../common/AutocompleteInput';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import Toast from '../common/Toast';
import { getPosterUrl } from '../../utils/constants';

// Helper: trả về config hiển thị cho từng trạng thái phim
const getStatusConfig = (status) => {
  const normalizedStatus = status === 'ended' ? 'now-showing' : status;

  const map = {
    'now-showing': { label: 'Đang chiếu', classes: 'bg-green-500/10 text-green-400 border border-green-500/20' },
    'coming-soon': { label: 'Sắp chiếu', classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    'suspended': { label: 'Tạm hoãn', classes: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    'stopped': { label: 'Ngừng chiếu', classes: 'bg-red-500/10 text-red-400 border border-red-500/20' },
    'cancelled': { label: 'Hủy phát hành', classes: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
    'pre-release': { label: 'Sắp ra mắt', classes: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
    'preview': { label: 'Chiếu sớm', classes: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
    'hidden': { label: 'Ẩn / Bảo trì', classes: 'bg-zinc-900 text-zinc-600 border border-zinc-800' },
  };
  return map[normalizedStatus] || { label: normalizedStatus, classes: 'bg-gray-100 text-gray-500 border border-gray-200' };
};

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Anime', 'Biography', 'Comedy',
  'Crime', 'Disaster', 'Documentary', 'Drama', 'Family', 'Fantasy',
  'History', 'Horror', 'Martial Arts', 'Music', 'Musical', 'Mystery',
  'Psychological', 'Romance', 'Sci-Fi', 'Sport', 'Supernatural',
  'Thriller', 'War', 'Western'
];

export const MovieManager = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [viewingMovie, setViewingMovie] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');

  // TMDB Search States
  const [tmdbOpen, setTmdbOpen] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState('');
  const [tmdbDetailLoading, setTmdbDetailLoading] = useState(null);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  const initialForm = {
    title: '',
    description: '',
    duration: '',
    genre: '',
    language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    releaseDate: '',
    posterUrl: '',
    trailerUrl: '',
    status: 'now-showing',
    rating: 'T16',
    director: '',
    cast: [],       // lưu dưới dạng mảng
    country: '',
  };
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Tính danh sách gợi ý đạo diễn và diễn viên từ dữ liệu phim hiện có
  const allDirectors = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => { if (m.director) set.add(m.director.trim()); });
    return Array.from(set).sort();
  }, [movies]);

  const allCast = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => {
      if (Array.isArray(m.cast)) m.cast.forEach((c) => { if (c) set.add(c.trim()); });
    });
    return Array.from(set).sort();
  }, [movies]);

  const fetchMoviesList = async () => {
    setLoading(true);
    try {
      const result = await movieService.getMovies({ status: 'all' }); // Fetch all status
      setMovies(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoviesList();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleToggleGenre = (genre) => {
    const currentGenres = form.genre
      ? form.genre.split(',').map((g) => g.trim()).filter((g) => g !== '')
      : [];

    let newGenres;
    if (currentGenres.includes(genre)) {
      newGenres = currentGenres.filter((g) => g !== genre);
    } else {
      newGenres = [...currentGenres, genre];
    }

    setForm({
      ...form,
      genre: newGenres.join(', '),
    });
  };

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setForm(initialForm);
    setError('');
    setIsOpen(true);
  };

  // === TMDB Auto Import ===
  const handleOpenTMDB = () => {
    setTmdbQuery('');
    setTmdbResults([]);
    setTmdbError('');
    setTmdbOpen(true);
    // Tải danh sách phim trending khi mở modal
    if (trendingMovies.length === 0) {
      fetchTrendingMovies();
    }
  };

  const fetchTrendingMovies = async () => {
    setTrendingLoading(true);
    try {
      const result = await adminService.getTMDBTrending();
      setTrendingMovies(result.data || []);
    } catch (err) {
      console.error('Lỗi tải phim trending:', err);
    } finally {
      setTrendingLoading(false);
    }
  };

  const handleSearchTMDB = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setTmdbResults([]);
      return;
    }
    setTmdbLoading(true);
    setTmdbError('');
    try {
      const result = await adminService.searchTMDB(query);
      setTmdbResults(result.data || []);
    } catch (err) {
      setTmdbError(err.message || 'Lỗi tìm kiếm TMDB');
      setTmdbResults([]);
    } finally {
      setTmdbLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (!tmdbOpen) return;
    const timer = setTimeout(() => handleSearchTMDB(tmdbQuery), 500);
    return () => clearTimeout(timer);
  }, [tmdbQuery, tmdbOpen, handleSearchTMDB]);

  const handleSelectTMDBMovie = async (tmdbId) => {
    setTmdbDetailLoading(tmdbId);
    try {
      const result = await adminService.getTMDBMovieDetail(tmdbId);
      const m = result.data;
      setForm({
        title: m.title || '',
        description: m.description || '',
        duration: m.duration || '',
        genre: (m.genre || []).join(', '),
        language: m.language || 'Tiếng Anh kèm Phụ đề Tiếng Việt',
        releaseDate: m.releaseDate ? m.releaseDate.split('T')[0] : '',
        posterUrl: m.posterUrl || '',
        trailerUrl: m.trailerUrl || '',
        status: m.status || 'coming-soon',
        rating: m.rating || 'T16',
        director: m.director || '',
        cast: Array.isArray(m.cast) ? m.cast : [],
        country: m.country || '',
      });
      setEditingMovie(null);
      setTmdbOpen(false);
      setIsOpen(true);
    } catch (err) {
      setTmdbError(err.message || 'Lỗi lấy chi tiết phim');
    } finally {
      setTmdbDetailLoading(null);
    }
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);

    // Định dạng ngày chính xác
    const dateFormatted = movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '';
    setForm({
      title: movie.title,
      description: movie.description,
      duration: movie.duration,
      genre: movie.genre.join(', '),
      language: movie.language,
      releaseDate: dateFormatted,
      posterUrl: movie.posterUrl,
      trailerUrl: movie.trailerUrl,
      status: movie.status,
      rating: movie.rating,
      director: movie.director || '',
      cast: Array.isArray(movie.cast) ? movie.cast : [],
      country: movie.country || '',
    });
    setError('');
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ phim này không? Các lịch chiếu liên quan cũng sẽ bị xóa.')) return;
    try {
      await adminService.deleteMovie(id);
      setToast({ message: 'Đã xóa phim thành công!', type: 'success' });
      fetchMoviesList();
    } catch (err) {
      setToast({ message: err.message || 'Lỗi khi xóa phim', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Tiền xử lý dữ liệu gửi đi
    const genreArray = form.genre.split(',').map((g) => g.trim()).filter((g) => g !== '');
    // cast đã là mảng, chỉ cần lọc rỗng
    const castArray = Array.isArray(form.cast)
      ? form.cast.map((c) => c.trim()).filter((c) => c !== '')
      : form.cast.split(',').map((c) => c.trim()).filter((c) => c !== '');
    const durationNum = parseInt(form.duration, 10);

    if (genreArray.length === 0) {
      setError('Vui lòng cung cấp ít nhất một thể loại phim');
      return;
    }

    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Vui lòng cung cấp thời lượng phim hợp lệ tính bằng phút');
      return;
    }

    const payload = {
      ...form,
      duration: durationNum,
      genre: genreArray,
      cast: castArray,
    };

    try {
      if (editingMovie) {
        await adminService.updateMovie(editingMovie._id, payload);
        setToast({ message: `Đã cập nhật phim "${form.title}" thành công!`, type: 'success' });
      } else {
        await adminService.createMovie(payload);
        setToast({ message: `Đã thêm phim "${form.title}" thành công!`, type: 'success' });
      }
      setIsOpen(false);
      fetchMoviesList();
    } catch (err) {
      setError(err.message);
      setToast({ message: err.message || 'Có lỗi xảy ra', type: 'error' });
    }
  };

  if (loading) return <Loading />;

  // Client-side movie filters
  const filteredMovies = movies.filter((m) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = 
      query === '' ||
      m.title.toLowerCase().includes(query) ||
      (m.titleEN && m.titleEN.toLowerCase().includes(query)) ||
      (m.director && m.director.toLowerCase().includes(query)) ||
      (m.cast && m.cast.some(c => c.toLowerCase().includes(query)));

    const matchesStatus = 
      statusFilter === 'all' || 
      m.status === statusFilter;

    const matchesGenre = 
      genreFilter === 'all' || 
      (m.genre && m.genre.includes(genreFilter));

    return matchesSearch && matchesStatus && matchesGenre;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-lg font-black text-gray-800">Kho Lưu Trữ Phim</h3>
          <p className="text-xs text-gray-500 mt-1">Quản lý danh sách phát hành, giới hạn độ tuổi, mã nhúng trailer và thông tin chi tiết.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenTMDB} variant="secondary" className="py-2 px-4 text-sm" icon={<Sparkles size={16} />}>
            Thêm Từ TMDB
          </Button>
          <Button onClick={handleOpenAdd} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
            Thêm Thủ Công
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Tìm theo tên phim, đạo diễn, diễn viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-brand transition-colors"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>

        {/* Filters Dropdowns */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3 justify-end">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-700 focus:outline-none focus:border-brand cursor-pointer transition-colors"
            >
              <option value="all">Tất cả</option>
              <option value="now-showing">Đang chiếu</option>
              <option value="coming-soon">Sắp chiếu</option>
              <option value="ended">Đã kết thúc</option>
              <option value="suspended">Tạm hoãn</option>
              <option value="stopped">Ngừng chiếu</option>
              <option value="cancelled">Hủy phát hành</option>
              <option value="pre-release">Sắp ra mắt</option>
              <option value="preview">Chiếu sớm</option>
              <option value="hidden">Ẩn / Bảo trì</option>
            </select>
          </div>

          {/* Genre Select */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Thể loại</span>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-700 focus:outline-none focus:border-brand cursor-pointer transition-colors"
            >
              <option value="all">Tất cả</option>
              {AVAILABLE_GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Phim */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 pl-6">Phim</th>
                <th className="py-4">Phân loại</th>
                <th className="py-4">Thể loại</th>
                <th className="py-4">Trạng thái</th>
                <th className="py-4">Chi tiết</th>
                <th className="py-4 pr-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {movies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 italic">
                    Chưa có phim nào được thêm vào hệ thống. Hãy tạo phim mới ở trên!
                  </td>
                </tr>
              ) : filteredMovies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 italic">
                    Không tìm thấy phim nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredMovies.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pl-6 flex items-center gap-3">
                      <div className="w-10 h-14 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        <img src={getPosterUrl(m.posterUrl)} alt={m.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm max-w-[250px] truncate">{m.title}</div>
                        <div className="text-[10px] text-gray-400">{m.duration} phút &bull; {m.director || 'Chưa cập nhật'}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded font-black text-[10px]">
                        {m.rating}
                      </span>
                    </td>
                    <td className="py-3 max-w-[150px] truncate text-gray-600">
                      {m.genre.join(', ')}
                    </td>
                    <td className="py-3">
                      {(() => {
                        const cfg = getStatusConfig(m.status); return (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${cfg.classes}`}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 max-w-[200px] truncate text-gray-600 font-medium" title={m.description}>
                      {m.description || 'Chưa cập nhật'}
                    </td>
                    <td className="py-3 pr-6 text-right space-x-2">
                      <button
                        onClick={() => setViewingMovie(m)}
                        className="p-2 bg-gray-50 border border-gray-200 hover:border-brand/40 text-gray-500 hover:text-gray-700 rounded-xl transition-all"
                        title="Xem chi tiết phim"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-2 bg-gray-50 border border-gray-200 hover:border-brand/40 text-gray-500 hover:text-gray-700 rounded-xl transition-all"
                        title="Chỉnh sửa chi tiết"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="p-2 bg-gray-50 border border-gray-200 hover:border-red-500/40 text-gray-500 hover:text-red-500 rounded-xl transition-all"
                        title="Xóa phim"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh Sửa Phim */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingMovie ? 'Chỉnh Sửa Chi Tiết Phim' : 'Thêm Phim Mới Vào Danh Mục'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="title" label="Tên Phim" placeholder="Ví dụ: Dune: Part Two" value={form.title} onChange={handleChange} required />
            <AutocompleteInput
              label="Đạo Diễn"
              placeholder="Ví dụ: Denis Villeneuve"
              suggestions={allDirectors}
              value={form.director}
              onChange={(val) => setForm((f) => ({ ...f, director: val }))}
              mode="single"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="duration" type="number" label="Thời Lượng (phút)" placeholder="Ví dụ: 166" value={form.duration} onChange={handleChange} required />

            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Trạng Thái Phát Hành</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                <option value="now-showing">🟢 Đang chiếu</option>
                <option value="coming-soon">🟡 Sắp chiếu</option>
                <option value="pre-release">🔵 Sắp ra mắt</option>
                <option value="preview">🟣 Chiếu sớm / Preview</option>
                <option value="suspended">🟠 Tạm hoãn</option>
                <option value="stopped">🔴 Ngừng chiếu</option>
                <option value="cancelled">❌ Hủy phát hành</option>
                <option value="hidden">🔒 Ẩn / Bảo trì</option>
              </select>
            </div>

            {/* Phân loại độ tuổi */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">Phân Loại Độ Tuổi</label>
              <select name="rating" value={form.rating} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                <option value="P">P (Mọi lứa tuổi)</option>
                <option value="T13">T13 (Trên 13 tuổi)</option>
                <option value="T16">T16 (Trên 16 tuổi)</option>
                <option value="T18">T18 (Trên 18 tuổi)</option>
              </select>
            </div>
          </div>

          {/* Thể loại (Lựa chọn danh mục) */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-800 mb-1.5 pl-0.5">
              Thể Loại <span className="text-brand">*</span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-[160px] overflow-y-auto">
              {(() => {
                const currentGenres = form.genre
                  ? form.genre.split(',').map((g) => g.trim()).filter((g) => g !== '')
                  : [];
                // Merge static list with current genres to ensure any database genres not in list are still shown
                const allVisible = Array.from(new Set([...AVAILABLE_GENRES, ...currentGenres]));

                return allVisible.map((genre) => {
                  const isSelected = currentGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleToggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isSelected
                        ? 'bg-brand/10 border-brand/40 text-brand shadow-[0_2px_8px_rgba(168,85,247,0.15)]'
                        : 'bg-zinc-800/40 border-zinc-700/40 text-white hover:border-zinc-650 hover:text-white'
                        }`}
                    >
                      {genre}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="releaseDate" type="date" label="Ngày Phát Hành" value={form.releaseDate} onChange={handleChange} required />
            <Input name="country" label="Quốc Gia" placeholder="Ví dụ: Mỹ, Hàn Quốc, Việt Nam" value={form.country} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="posterUrl" label="Đường Dẫn Hình Ảnh Poster (URL)" placeholder="https://unsplash.com/..." value={form.posterUrl} onChange={handleChange} required />
            <Input name="trailerUrl" label="Đường Dẫn Nhúng Trailer YouTube (URL)" placeholder="https://www.youtube.com/embed/..." value={form.trailerUrl} onChange={handleChange} />
          </div>

          <AutocompleteInput
            label="Danh Sách Diễn Viên"
            placeholder="Tìm kiếm tên diễn viên..."
            suggestions={allCast}
            value={form.cast}
            onChange={(val) => setForm((f) => ({ ...f, cast: val }))}
            mode="tags"
          />

          <Input
            name="description"
            type="textarea"
            label="Tóm Tắt Nội Dung / Mô Tả Phim"
            rows={4}
            placeholder="Cung cấp tóm tắt cốt truyện hoặc mô tả chi tiết của phim..."
            value={form.description}
            onChange={handleChange}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button onClick={() => setIsOpen(false)} variant="secondary" className="px-5 py-2">
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="px-6 py-2">
              Lưu Phim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Xem Chi Tiết Phim */}
      <Modal isOpen={!!viewingMovie} onClose={() => setViewingMovie(null)} title="Xem Chi Tiết Phim" size="xl">
        {viewingMovie && (
          <div className="space-y-6 text-gray-750">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cột trái: Poster & Trạng thái */}
              <div className="w-full md:w-1/3 space-y-4 shrink-0">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                  <img
                    src={getPosterUrl(viewingMovie.posterUrl)}
                    alt={viewingMovie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="bg-brand/10 border border-brand/20 text-brand px-3 py-1 rounded-xl font-black text-xs">
                    Độ tuổi: {viewingMovie.rating}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wider ${viewingMovie.status === 'now-showing'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : viewingMovie.status === 'coming-soon'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}>
                    {viewingMovie.status === 'now-showing' ? 'Đang chiếu' : viewingMovie.status === 'coming-soon' ? 'Sắp chiếu' : 'Đã kết thúc'}
                  </span>
                </div>
              </div>

              {/* Cột phải: Thông tin chi tiết */}
              <div className="flex-1 space-y-4 text-xs">
                <div>
                  <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Tên phim</h4>
                  <h3 className="text-lg font-black text-gray-900 mt-0.5">{viewingMovie.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Đạo diễn</h4>
                    <p className="font-bold text-gray-800 mt-0.5">{viewingMovie.director || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Thời lượng</h4>
                    <p className="font-bold text-gray-800 mt-0.5">{viewingMovie.duration} phút</p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ngày phát hành</h4>
                    <p className="font-bold text-gray-800 mt-0.5">
                      {viewingMovie.releaseDate ? new Date(viewingMovie.releaseDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Thể loại</h4>
                    <p className="font-bold text-gray-800 mt-0.5">{viewingMovie.genre.join(', ')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ngôn ngữ</h4>
                  <p className="font-bold text-gray-800 mt-0.5">{viewingMovie.language || 'Chưa cập nhật'}</p>
                </div>

                <div>
                  <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Diễn viên</h4>
                  <p className="font-bold text-gray-800 mt-0.5">{viewingMovie.cast && viewingMovie.cast.length > 0 ? viewingMovie.cast.join(', ') : 'Chưa cập nhật'}</p>
                </div>

                <div>
                  <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Tóm tắt nội dung</h4>
                  <p className="text-gray-650 mt-1 leading-relaxed whitespace-pre-line font-medium max-h-[120px] overflow-y-auto pr-1">
                    {viewingMovie.description || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trailer preview if trailerUrl is provided */}
            {viewingMovie.trailerUrl && (
              <div className="space-y-2">
                <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Trailer</h4>
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                  <iframe
                    src={viewingMovie.trailerUrl.includes('embed/') ? viewingMovie.trailerUrl : viewingMovie.trailerUrl.replace('watch?v=', 'embed/').split('&')[0]}
                    title={`Trailer - ${viewingMovie.title}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <a
                href={`/movies/${viewingMovie._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand hover:text-brand-hover font-black flex items-center gap-1 hover:underline"
              >
                Xem trên trang khách hàng &rarr;
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => { setViewingMovie(null); handleOpenEdit(viewingMovie); }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setViewingMovie(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl transition-all shadow-md"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Modal Tìm Kiếm TMDB */}
      <Modal isOpen={tmdbOpen} onClose={() => setTmdbOpen(false)} title="🎬 Tìm Phim Từ TMDB" size="xl">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              placeholder="Nhập tên phim tiếng Anh hoặc tiếng Việt..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-3 pl-10 pr-4 focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none placeholder:text-gray-400 text-sm"
              autoFocus
            />
            {tmdbLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand animate-spin" />}
          </div>

          {tmdbError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{tmdbError}</span>
            </div>
          )}

          {/* Results */}
          <div className="max-h-[55vh] overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {!tmdbLoading && tmdbQuery.length >= 2 && tmdbResults.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">Không tìm thấy phim nào cho "{tmdbQuery}"</p>
            )}
            {tmdbResults.map((movie) => (
              <button
                key={movie.tmdbId}
                onClick={() => handleSelectTMDBMovie(movie.tmdbId)}
                disabled={tmdbDetailLoading === movie.tmdbId}
                className="w-full flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-brand/30 rounded-xl transition-all text-left group"
              >
                <div className="w-14 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {movie.posterUrl ? (
                    <img src={getPosterUrl(movie.posterUrl)} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-450 text-xs">N/A</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 group-hover:text-brand transition-colors truncate">
                    {movie.title}
                  </h4>
                  {movie.originalTitle !== movie.title && (
                    <p className="text-[11px] text-gray-400 truncate">{movie.originalTitle}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    {movie.releaseDate && (
                      <span className="flex items-center gap-1"><Calendar size={10} />{movie.releaseDate.slice(0, 4)}</span>
                    )}
                    {movie.voteAverage > 0 && (
                      <span className="flex items-center gap-1 text-amber-500"><Star size={10} />{movie.voteAverage.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(movie.genres || []).slice(0, 3).map((g) => (
                      <span key={g} className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] text-gray-500">{g}</span>
                    ))}
                  </div>
                </div>
                {tmdbDetailLoading === movie.tmdbId ? (
                  <Loader2 size={16} className="text-brand animate-spin shrink-0 mt-2" />
                ) : (
                  <span className="text-[10px] text-gray-400 group-hover:text-brand font-bold shrink-0 mt-2 transition-colors">CHỌN →</span>
                )}
              </button>
            ))}
          </div>

          {!tmdbQuery && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-full">
                  <Flame size={13} className="text-orange-500" />
                  <span className="text-xs font-black text-orange-600 uppercase tracking-wider">Đang Hot</span>
                </div>
                <span className="text-[11px] text-gray-400">Phim trending & đang chiếu tại rạp</span>
              </div>

              {trendingLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={22} className="text-brand animate-spin" />
                  <span className="ml-2 text-sm text-gray-400">Đang tải gợi ý...</span>
                </div>
              ) : trendingMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                  {trendingMovies.map((movie) => (
                    <button
                      key={movie.tmdbId}
                      onClick={() => handleSelectTMDBMovie(movie.tmdbId)}
                      disabled={tmdbDetailLoading === movie.tmdbId}
                      className="group relative flex flex-col bg-white border border-gray-200 hover:border-brand/40 rounded-2xl overflow-hidden transition-all hover:shadow-md text-left"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] w-full bg-gray-100">
                        {movie.posterUrl ? (
                          <img src={getPosterUrl(movie.posterUrl)} alt={movie.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                        )}
                        {/* Overlay khi hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-white text-[10px] font-bold">Nhấn để chọn</span>
                        </div>
                        {/* Loading overlay */}
                        {tmdbDetailLoading === movie.tmdbId && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <Loader2 size={20} className="text-brand animate-spin" />
                          </div>
                        )}
                        {/* Rating badge */}
                        {movie.voteAverage > 0 && (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-lg">
                            <Star size={9} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-bold text-white">{movie.voteAverage.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-2 flex-1">
                        <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                          {movie.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                          {movie.releaseDate && (
                            <span className="flex items-center gap-0.5">
                              <Calendar size={9} />
                              {movie.releaseDate.slice(0, 4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Sparkles size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">Nhập tên phim để tìm kiếm trên TMDB</p>
                  <p className="text-gray-400 text-xs mt-1">Dữ liệu sẽ tự động điền vào form tạo phim</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default MovieManager;