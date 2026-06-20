const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/original';

// Map TMDB genre IDs → tên thể loại tiếng Anh (dùng trong hệ thống)
const TMDB_GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'Drama',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Map TMDB certification → hệ thống phân loại Việt Nam
const mapCertification = (certifications) => {
  if (!certifications || certifications.length === 0) return 'T16';
  
  // Ưu tiên lấy certification từ US
  const usCert = certifications.find(c => c.iso_3166_1 === 'US');
  const cert = usCert ? usCert.release_dates?.[0]?.certification : '';
  
  switch (cert) {
    case 'G':
    case 'PG':
      return 'P';
    case 'PG-13':
      return 'T13';
    case 'R':
      return 'T16';
    case 'NC-17':
      return 'T18';
    default:
      return 'T16';
  }
};

// ==========================================
// 1. Tìm kiếm phim trên TMDB
// GET /api/admin/tmdb/search?query=...&page=1
// ==========================================
const searchTMDB = async (req, res, next) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm',
      });
    }

    if (!TMDB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TMDB API Key chưa được cấu hình. Vui lòng thêm TMDB_API_KEY vào file .env',
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query.trim(),
        page,
        language: 'vi-VN',
        include_adult: false,
      },
    });

    // Map kết quả thành format gọn cho frontend
    const results = response.data.results.map((movie) => ({
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      posterUrl: movie.poster_path ? `${TMDB_IMG_BASE}${movie.poster_path}` : '',
      releaseDate: movie.release_date || '',
      overview: movie.overview || '',
      voteAverage: movie.vote_average || 0,
      genreIds: movie.genre_ids || [],
      genres: (movie.genre_ids || []).map(id => TMDB_GENRE_MAP[id]).filter(Boolean),
    }));

    res.json({
      success: true,
      data: results,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results,
      page: response.data.page,
    });
  } catch (error) {
    console.error('TMDB Search Error:', error.message);
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'TMDB API Key không hợp lệ. Vui lòng kiểm tra lại.',
      });
    }
    next(error);
  }
};

// ==========================================
// 2. Lấy chi tiết phim từ TMDB theo ID
// GET /api/admin/tmdb/movie/:tmdbId
// ==========================================
const getTMDBMovieDetail = async (req, res, next) => {
  try {
    const { tmdbId } = req.params;

    if (!TMDB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TMDB API Key chưa được cấu hình',
      });
    }

    // Gọi song song: chi tiết phim + credits (đạo diễn, diễn viên) + videos (trailer) + release dates (rating)
    const [movieRes, creditsRes, videosRes, releaseDatesRes] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: { api_key: TMDB_API_KEY, language: 'vi-VN' },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
        params: { api_key: TMDB_API_KEY },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US' },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/release_dates`, {
        params: { api_key: TMDB_API_KEY },
      }),
    ]);

    const movie = movieRes.data;
    const credits = creditsRes.data;
    const videos = videosRes.data;
    const releaseDates = releaseDatesRes.data;

    // Lấy đạo diễn (crew có job = "Director")
    const director = credits.crew
      ? credits.crew
          .filter((c) => c.job === 'Director')
          .map((c) => c.name)
          .join(', ')
      : '';

    // Lấy top 6 diễn viên chính
    const cast = credits.cast
      ? credits.cast.slice(0, 6).map((c) => c.name)
      : [];

    // Tìm trailer YouTube (ưu tiên Official Trailer)
    let trailerUrl = '';
    if (videos.results && videos.results.length > 0) {
      const officialTrailer = videos.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official === true
      );
      const anyTrailer = videos.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      const anyVideo = videos.results.find((v) => v.site === 'YouTube');

      const chosen = officialTrailer || anyTrailer || anyVideo;
      if (chosen) {
        trailerUrl = `https://www.youtube.com/embed/${chosen.key}`;
      }
    }

    // Map genre TMDB → hệ thống
    const genres = (movie.genres || [])
      .map((g) => TMDB_GENRE_MAP[g.id] || g.name)
      .filter(Boolean);

    // Lấy rating/certification
    const rating = mapCertification(releaseDates.results);

    // Lấy quốc gia sản xuất
    const country = (movie.production_countries || [])
      .map((c) => c.name)
      .join(', ');

    // Lấy tiêu đề tiếng Anh (original_title) nếu khác tiếng Việt
    // Cũng fetch thêm bản tiếng Anh cho description
    let descriptionEN = '';
    let titleEN = movie.original_title || '';
    try {
      const enRes = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US' },
      });
      descriptionEN = enRes.data.overview || '';
      titleEN = enRes.data.title || movie.original_title || '';
    } catch (e) {
      // fallback: dùng original_title
    }

    // Trả về data đã map sang format Movie model
    const mappedMovie = {
      title: movie.title || movie.original_title,
      titleEN,
      description: movie.overview || descriptionEN || 'Chưa có mô tả',
      descriptionEN,
      duration: movie.runtime || 120,
      genre: genres,
      language: 'Tiếng Anh kèm Phụ đề Tiếng Việt',
      releaseDate: movie.release_date || '',
      posterUrl: movie.poster_path ? `${TMDB_IMG_BASE}${movie.poster_path}` : '',
      trailerUrl,
      status: 'coming-soon',
      rating,
      director,
      cast,
      country,
      tmdbId: movie.id,
    };

    res.json({
      success: true,
      data: mappedMovie,
    });
  } catch (error) {
    console.error('TMDB Detail Error:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim trên TMDB',
      });
    }
    next(error);
  }
};

module.exports = {
  searchTMDB,
  getTMDBMovieDetail,
};
