import api from './api';

const getMovies = async (params = {}) => {
  // api.js interceptor already returns response.data, so we return directly
  return await api.get('/movies', { params });
};

const getMovieById = async (id) => {
  return await api.get(`/movies/${id}`);
};

const movieService = {
  getMovies,
  getMovieById,
};

export default movieService;
