import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import movieService from '../../services/movie.service';
import adminService from '../../services/admin.service';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';
import { getPosterUrl } from '../../utils/constants';

// Helper: trả về config hiển thị cho từng trạng thái phim
const getStatusConfig = (status) => {
  const map = {
    'now-showing':  { label: 'Đang chiếu',    classes: 'bg-green-500/10 text-green-400 border border-green-500/20' },
    'coming-soon':  { label: 'Sắp chiếu',     classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    'ended':        { label: 'Đã kết thúc',    classes: 'bg-zinc-800 text-zinc-500 border border-zinc-700' },
    'suspended':    { label: 'Tạm hoãn',       classes: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    'stopped':      { label: 'Ngừng chiếu',    classes: 'bg-red-500/10 text-red-400 border border-red-500/20' },
    'cancelled':    { label: 'Hủy phát hành',  classes: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
    'pre-release':  { label: 'Sắp ra mắt',    classes: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
    'preview':      { label: 'Chiếu sớm',      classes: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
    'hidden':       { label: 'Ẩn / Bảo trì',  classes: 'bg-zinc-900 text-zinc-600 border border-zinc-800' },
  };
  return map[status] || { label: status, classes: 'bg-zinc-800 text-zinc-500 border border-zinc-700' };
};

export const MovieManager = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

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
    cast: '',
  };
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

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

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setForm(initialForm);
    setError('');
    setIsOpen(true);
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
      cast: movie.cast ? movie.cast.join(', ') : '',
    });
    setError('');
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ phim này không? Các lịch chiếu liên quan cũng sẽ bị xóa.')) return;
    try {
      await adminService.deleteMovie(id);
      fetchMoviesList();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Tiền xử lý dữ liệu gửi đi
    const genreArray = form.genre.split(',').map((g) => g.trim()).filter((g) => g !== '');
    const castArray = form.cast.split(',').map((c) => c.trim()).filter((c) => c !== '');
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
      } else {
        await adminService.createMovie(payload);
      }
      setIsOpen(false);
      fetchMoviesList();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-dark-border pb-4">
        <div>
          <h3 className="text-lg font-black text-zinc-200">Kho Lưu Trữ Phim</h3>
          <p className="text-xs text-zinc-500 mt-1">Quản lý danh sách phát hành, giới hạn độ tuổi, mã nhúng trailer và thông tin chi tiết.</p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
          Thêm Phim
        </Button>
      </div>

      {/* Bảng Danh Sách Phim */}
      <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-zinc-900/50 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 pl-6">Phim</th>
                <th className="py-4">Phân loại</th>
                <th className="py-4">Thể loại</th>
                <th className="py-4">Trạng thái</th>
                <th className="py-4 pr-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-xs font-semibold text-zinc-300">
              {movies.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-zinc-500 italic">
                    Chưa có phim nào được thêm vào hệ thống. Hãy tạo phim mới ở trên!
                  </td>
                </tr>
              ) : (
                movies.map((m) => (
                  <tr key={m._id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="py-3 pl-6 flex items-center gap-3">
                      <div className="w-10 h-14 rounded overflow-hidden bg-zinc-950 shrink-0 border border-dark-border">
                        <img src={getPosterUrl(m.posterUrl)} alt={m.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200 text-sm max-w-[250px] truncate">{m.title}</div>
                        <div className="text-[10px] text-zinc-500">{m.duration} phút &bull; {m.director || 'Chưa cập nhật'}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded font-black text-[10px]">
                        {m.rating}
                      </span>
                    </td>
                    <td className="py-3 max-w-[150px] truncate text-zinc-400">
                      {m.genre.join(', ')}
                    </td>
                    <td className="py-3">
                      {(() => { const cfg = getStatusConfig(m.status); return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      ); })()}
                    </td>
                    <td className="py-3 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-2 bg-zinc-900 border border-dark-border hover:border-brand/40 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all"
                        title="Chỉnh sửa chi tiết"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="p-2 bg-zinc-900 border border-dark-border hover:border-red-500/40 text-zinc-400 hover:text-red-400 rounded-xl transition-all"
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
            <Input name="director" label="Đạo Diễn" placeholder="Ví dụ: Denis Villeneuve" value={form.director} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="duration" type="number" label="Thời Lượng (phút)" placeholder="Ví dụ: 166" value={form.duration} onChange={handleChange} required />

            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Trạng Thái Phát Hành</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                <option value="now-showing">🟢 Đang chiếu</option>
                <option value="coming-soon">🟡 Sắp chiếu</option>
                <option value="pre-release">🔵 Sắp ra mắt</option>
                <option value="preview">🟣 Chiếu sớm / Preview</option>
                <option value="ended">⚫ Đã kết thúc</option>
                <option value="suspended">🟠 Tạm hoãn</option>
                <option value="stopped">🔴 Ngừng chiếu</option>
                <option value="cancelled">❌ Hủy phát hành</option>
                <option value="hidden">🔒 Ẩn / Bảo trì</option>
              </select>
            </div>

            {/* Phân loại độ tuổi */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Phân Loại Độ Tuổi</label>
              <select name="rating" value={form.rating} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                <option value="P">P (Mọi lứa tuổi)</option>
                <option value="C13">C13 (Trên 13 tuổi)</option>
                <option value="T16">T16 (Trên 16 tuổi)</option>
                <option value="T18">T18 (Trên 18 tuổi)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="genre" label="Thể Loại (phân tách bằng dấu phẩy)" placeholder="Ví dụ: Sci-Fi, Phiêu lưu, Hành động" value={form.genre} onChange={handleChange} required />
            <Input name="releaseDate" type="date" label="Ngày Phát Hành" value={form.releaseDate} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="posterUrl" label="Đường Dẫn Hình Ảnh Poster (URL)" placeholder="https://unsplash.com/..." value={form.posterUrl} onChange={handleChange} required />
            <Input name="trailerUrl" label="Đường Dẫn Nhúng Trailer YouTube (URL)" placeholder="https://www.youtube.com/embed/..." value={form.trailerUrl} onChange={handleChange} />
          </div>

          <Input name="cast" label="Danh Sách Diễn Viên (phân tách bằng dấu phẩy)" placeholder="Timothée Chalamet, Zendaya, Austin Butler" value={form.cast} onChange={handleChange} />

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

          <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
            <Button onClick={() => setIsOpen(false)} variant="secondary" className="px-5 py-2">
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="px-6 py-2">
              Lưu Phim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MovieManager;