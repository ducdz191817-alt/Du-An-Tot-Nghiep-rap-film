/**
 * @middleware notFound
 * @desc       Middleware xử lý các tuyến đường API không tồn tại (Lỗi 404 Not Found)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy tài nguyên API - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * @middleware errorHandler
 * @desc       Middleware xử lý lỗi tập trung toàn cục (Global Error Handler)
 *             Chuẩn hóa các loại lỗi từ Mongoose (CastError, DuplicateKey, ValidationError) và trả về định dạng JSON
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // 1. Xử lý lỗi Mongoose CastError (ObjectId không đúng định dạng 24 ký tự hex)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Đường dẫn hoặc mã định danh (ID) không đúng định dạng';
  }

  // 2. Xử lý lỗi trùng lặp khóa Mongoose (Duplicate Key Error - ví dụ: trùng email, trùng số điện thoại)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Dữ liệu nhập vào bị trùng lặp với thông tin đã có trong cơ sở dữ liệu';
  }

  // 3. Xử lý lỗi kiểm tra ràng buộc dữ liệu của Mongoose (ValidationError)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Trả về kết quả lỗi định dạng JSON (chỉ kèm stack trace khi ở môi trường development)
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };

