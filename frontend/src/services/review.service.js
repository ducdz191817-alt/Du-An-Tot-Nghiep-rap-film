import api from './api';

const reviewService = {
  // Lấy tất cả đánh giá của một phim (public, không cần token)
  getReviewsByMovie: async (movieId) => {
    const response = await api.get(`/reviews/movie/${movieId}`);
    return response;
  },

  // Tạo đánh giá mới
  createReview: async (movieId, rating, comment) => {
    const response = await api.post('/reviews', { movieId, rating, comment });
    return response;
  },

  // Cập nhật đánh giá
  updateReview: async (reviewId, rating, comment) => {
    const response = await api.put(`/reviews/${reviewId}`, { rating, comment });
    return response;
  },

  // Xóa đánh giá
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response;
  },

  // Gửi phản hồi (admin)
  replyReview: async (reviewId, comment) => {
    const response = await api.post(`/reviews/${reviewId}/reply`, { comment });
    return response;
  },

  // Xóa phản hồi (admin)
  deleteReply: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}/reply`);
    return response;
  },
};

export default reviewService;
