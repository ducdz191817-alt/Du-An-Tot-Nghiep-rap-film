import api from './api';

const getMovies = async (params = {}) => {
  const response = await api.get('/movies', { params });
  return response.data;
};

const getMovieById = async (id) => {
  const response = await api.get(`/movies/${id}`);
  return response.data;
};

const movieService = {
  getMovies,
  getMovieById,
};

export default movieService;
