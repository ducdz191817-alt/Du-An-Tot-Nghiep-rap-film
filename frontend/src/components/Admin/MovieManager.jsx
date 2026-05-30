import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import movieService from '../../services/movie.service';
import adminService from '../../services/admin.service';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Modal from '../common/Modal';

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
    language: 'English with Vietnamese Subtitles',
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
    // Format date properly
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
    if (!window.confirm('Are you sure you want to delete this movie? Associated showtimes will also be deleted.')) return;
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

    // Preprocessing payload
    const genreArray = form.genre.split(',').map((g) => g.trim()).filter((g) => g !== '');
    const castArray = form.cast.split(',').map((c) => c.trim()).filter((c) => c !== '');
    const durationNum = parseInt(form.duration, 10);

    if (genreArray.length === 0) {
      setError('Please provide at least one genre');
      return;
    }

    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Please provide valid movie duration in minutes');
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
          <h3 className="text-lg font-black text-zinc-200">Movie Inventory</h3>
          <p className="text-xs text-zinc-500 mt-1">Manage catalog releases, ratings, trailer embeds and details.</p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary" className="py-2 px-4 text-sm" icon={<Plus size={16} />}>
          Add Movie
        </Button>
      </div>

      {/* Movies List Table */}
      <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-zinc-900/50 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 pl-6">Movie</th>
                <th className="py-4">Rating</th>
                <th className="py-4">Genre</th>
                <th className="py-4">Status</th>
                <th className="py-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-xs font-semibold text-zinc-300">
              {movies.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-zinc-500 italic">
                    No movies seeded yet. Add one above!
                  </td>
                </tr>
              ) : (
                movies.map((m) => (
                  <tr key={m._id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="py-3 pl-6 flex items-center gap-3">
                      <div className="w-10 h-14 rounded overflow-hidden bg-zinc-950 shrink-0 border border-dark-border">
                        <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200 text-sm max-w-[250px] truncate">{m.title}</div>
                        <div className="text-[10px] text-zinc-500">{m.duration}m &bull; {m.director || 'N/A'}</div>
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        m.status === 'now-showing'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : m.status === 'coming-soon'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {m.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-2 bg-zinc-900 border border-dark-border hover:border-brand/40 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all"
                        title="Edit Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="p-2 bg-zinc-900 border border-dark-border hover:border-red-500/40 text-zinc-400 hover:text-red-400 rounded-xl transition-all"
                        title="Delete Movie"
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

      {/* Add / Edit Movie Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingMovie ? 'Modify Movie Details' : 'Add New Movie Catalog'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="title" label="Movie Title" placeholder="e.g. Dune: Part Two" value={form.title} onChange={handleChange} required />
            <Input name="director" label="Director" placeholder="e.g. Denis Villeneuve" value={form.director} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="duration" type="number" label="Duration (minutes)" placeholder="e.g. 166" value={form.duration} onChange={handleChange} required />
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Release Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                <option value="now-showing">Now Showing</option>
                <option value="coming-soon">Coming Soon</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Content Rating Label</label>
              <select name="rating" value={form.rating} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg py-2.5 px-3 focus:border-brand outline-none cursor-pointer">
                <option value="P">P (General)</option>
                <option value="C13">C13 (13+)</option>
                <option value="T16">T16 (16+)</option>
                <option value="T18">T18 (18+)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="genre" label="Genres (comma-separated)" placeholder="e.g. Sci-Fi, Adventure, Action" value={form.genre} onChange={handleChange} required />
            <Input name="releaseDate" type="date" label="Release Date" value={form.releaseDate} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="posterUrl" label="Poster Image URL" placeholder="https://unsplash.com/..." value={form.posterUrl} onChange={handleChange} required />
            <Input name="trailerUrl" label="YouTube Embed Trailer URL" placeholder="https://www.youtube.com/embed/..." value={form.trailerUrl} onChange={handleChange} />
          </div>

          <Input name="cast" label="Cast list (comma-separated)" placeholder="Timothée Chalamet, Zendaya, Austin Butler" value={form.cast} onChange={handleChange} />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 pl-0.5">Plot Summary / Description</label>
            <textarea
              name="description"
              rows="4"
              placeholder="Provide plot details of the movie..."
              value={form.description}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand focus:ring-1 focus:ring-brand text-zinc-100 placeholder-zinc-500 rounded-lg p-3 outline-none transition-all duration-300 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
            <Button onClick={() => setIsOpen(false)} variant="secondary" className="px-5 py-2">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="px-6 py-2">
              Save Catalog
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MovieManager;
