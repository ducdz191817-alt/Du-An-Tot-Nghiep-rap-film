import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import movieService from '../services/movie.service';

export const fetchMovies = createAsyncThunk(
  'movie/fetchMovies',
  async (filters, thunkAPI) => {
    try {
      return await movieService.getMovies(filters);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchMovieDetail = createAsyncThunk(
  'movie/fetchMovieDetail',
  async (id, thunkAPI) => {
    try {
      return await movieService.getMovieById(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const initialState = {
  movies: [],
  currentMovie: null,
  filters: {
    status: 'now-showing',
    genre: '',
    search: '',
  },
  loading: false,
  error: null,
};

const movieSlice = createSlice({
  name: 'movie',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearMovieDetail: (state) => {
      state.currentMovie = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Movies
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { success, count, data: [...] }
        state.movies = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.data ?? [];
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Movie Detail
      .addCase(fetchMovieDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovieDetail.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { success, data: {...} }
        state.currentMovie = action.payload?.data ?? action.payload;
      })
      .addCase(fetchMovieDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilter, resetFilters, clearMovieDetail } = movieSlice.actions;
export default movieSlice.reducer;
