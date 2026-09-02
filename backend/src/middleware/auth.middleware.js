const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * @middleware protect
 * @desc       Middleware xác thực JWT Token người dùng trong Header yêu cầu (Authorization: Bearer <token>)
 *             Kiểm tra tính hợp lệ của token, sự tồn tại của người dùng và trạng thái khóa tài khoản
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Kiểm tra header Authorization có định dạng "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Trích xuất chuỗi JWT Token từ header
      token = req.headers.authorization.split(' ')[1];

      // 3. Giải mã và kiểm tra token bằng JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforbookingmovies12345');

      // 4. Lấy thông tin tài khoản người dùng từ DB theo id (không lấy trường mật khẩu)
      req.user = await User.findById(decoded.id).select('-password');

      // 5. Nếu không tìm thấy thông tin tài khoản
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Không có quyền truy cập, không tìm thấy người dùng' });
      }

      // 6. Kiểm tra xem tài khoản có đang bị Quản trị viên khóa hay không
      if (req.user.status === 'locked') {
        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.' });
      }

      next();
    } catch (error) {
      console.error('Lỗi xác thực JWT:', error.message);
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Không có quyền truy cập, vui lòng cung cấp Token xác thực' });
  }
};

/**
 * @middleware admin
 * @desc       Middleware phân quyền yêu cầu tài khoản phải là Quản trị viên (Admin)
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Yêu cầu quyền Quản trị viên (Admin) để thực hiện thao tác này' });
  }
};

/**
 * @middleware staffOrAdmin
 * @desc       Middleware phân quyền cho phép Nhân viên (Staff) hoặc Quản trị viên (Admin)
 */
const staffOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Không có quyền truy cập dành cho Nhân viên hoặc Quản trị viên' });
  }
};

module.exports = { protect, admin, staffOrAdmin };

