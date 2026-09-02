const axios = require('axios');

const getTMDBApiKey = () => process.env.TMDB_API_KEY;
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

/**
 * @helper   Chuyển đổi phân loại độ tuổi (certification) từ TMDB sang hệ thống phân loại phim Việt Nam
 * @param    {Array} certifications - Danh sách thông tin phát hành từ TMDB
 * @returns  {string} Nhãn độ tuổi tương ứng (P, T13, T16, T18)
 */
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

/**
 * @desc    Tìm kiếm danh sách phim trực tiếp từ TMDB API theo từ khóa
 * @route   GET /api/admin/tmdb/search
 * @access  Private/Admin
 */
const searchTMDB = async (req, res, next) => {
  try {
    const { query, page = 1 } = req.query;
    const TMDB_API_KEY = getTMDBApiKey();
    
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

    // Gửi yêu cầu tìm kiếm tới API của TMDB
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query.trim(),
        page,
        language: 'vi-VN',
        include_adult: false,
      },
    });

    // Chuẩn hóa định dạng kết quả trả về cho Frontend
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

/**
 * @desc    Lấy danh sách các phim nổi bật / đang chiếu nóng nhất từ TMDB
 * @route   GET /api/admin/tmdb/trending
 * @access  Private/Admin
 */
const getTMDBTrending = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const TMDB_API_KEY = getTMDBApiKey();

    if (!TMDB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TMDB API Key chưa được cấu hình',
      });
    }

    // Lấy song song danh sách phim trending trong tuần + phim đang chiếu tại rạp
    const [trendingRes, nowPlayingRes] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
        params: { api_key: TMDB_API_KEY, language: 'vi-VN', page },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
        params: { api_key: TMDB_API_KEY, language: 'vi-VN', page, region: 'VN' },
      }),
    ]);

    // Gộp 2 danh sách, loại bỏ phim trùng lặp theo tmdbId
    const seen = new Set();
    const combined = [];

    for (const movie of [...trendingRes.data.results, ...nowPlayingRes.data.results]) {
      if (!seen.has(movie.id)) {
        seen.add(movie.id);
        combined.push({
          tmdbId: movie.id,
          title: movie.title,
          originalTitle: movie.original_title,
          posterUrl: movie.poster_path ? `${TMDB_IMG_BASE}${movie.poster_path}` : '',
          releaseDate: movie.release_date || '',
          overview: movie.overview || '',
          voteAverage: movie.vote_average || 0,
          genreIds: movie.genre_ids || [],
          genres: (movie.genre_ids || []).map(id => TMDB_GENRE_MAP[id]).filter(Boolean),
        });
      }
    }

    res.json({
      success: true,
      data: combined.slice(0, 20), // Trả về tối đa 20 phim nổi bật
    });
  } catch (error) {
    console.error('TMDB Trending Error:', error.message);
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết đầy đủ của một bộ phim từ TMDB để phục vụ tính năng import tự động
 * @route   GET /api/admin/tmdb/movie/:tmdbId
 * @access  Private/Admin
 */
const getTMDBMovieDetail = async (req, res, next) => {
  try {
    const { tmdbId } = req.params;
    const TMDB_API_KEY = getTMDBApiKey();

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

    // 1. Trích xuất tên Đạo diễn
    const director = credits.crew
      ? credits.crew
          .filter((c) => c.job === 'Director')
          .map((c) => c.name)
          .join(', ')
      : '';

    // 2. Trích xuất top 6 Diễn viên chính
    const cast = credits.cast
      ? credits.cast.slice(0, 6).map((c) => c.name)
      : [];

    // 3. Tìm đường dẫn video Trailer YouTube chính thức
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

    // 4. Ánh xạ danh sách thể loại từ TMDB sang hệ thống
    const genres = (movie.genres || [])
      .map((g) => TMDB_GENRE_MAP[g.id] || g.name)
      .filter(Boolean);

    // 5. Chuyển đổi mã phân loại độ tuổi
    const rating = mapCertification(releaseDates.results);

    // 6. Lấy quốc gia sản xuất
    const country = (movie.production_countries || [])
      .map((c) => c.name)
      .join(', ');

    // 7. Lấy tiêu đề và mô tả bản tiếng Anh
    let descriptionEN = '';
    let titleEN = movie.original_title || '';
    try {
      const enRes = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US' },
      });
      descriptionEN = enRes.data.overview || '';
      titleEN = enRes.data.title || movie.original_title || '';
    } catch (e) {
      // Bỏ qua nếu không lấy được bản tiếng Anh
    }

    // 8. Tự động tính toán trạng thái phim khởi tạo
    const computedStatus = (() => {
      if (!movie.release_date) return 'coming-soon';
      const release = new Date(movie.release_date);
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (release <= now) return 'coming-soon';
      if (release <= thirtyDaysLater) return 'coming-soon';
      return 'pre-release';
    })();

    // 9. Chuẩn hóa dữ liệu theo cấu trúc Model Movie của ứng dụng
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
      status: computedStatus,
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
  getTMDBTrending,
};

