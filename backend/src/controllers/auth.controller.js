const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const sendEmail = require('../utils/sendEmail');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforbookingmovies12345', {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, phone, age, gender, dob, region, favoriteTheater } = req.body;

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').trim();

    // Check if email exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      res.status(400);
      throw new Error('Email này đã được sử dụng cho tài khoản khác!');
    }

    // Check if phone exists
    if (cleanPhone) {
      const phoneExists = await User.findOne({ phone: cleanPhone });
      if (phoneExists) {
        res.status(400);
        throw new Error(`Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác!`);
      }
    }

    // Create user
    const user = await User.create({
      username: (username || '').trim(),
      email: cleanEmail,
      password,
      phone: cleanPhone,
      age: age || 0,
      gender: gender || 'Nam',
      dob: dob || '',
      region: region || '',
      favoriteTheater: favoriteTheater || '',
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          age: user.age,
          gender: user.gender,
          dob: user.dob,
          region: user.region,
          favoriteTheater: user.favoriteTheater,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400);
      throw new Error('Dữ liệu đăng ký không hợp lệ');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    // Check email and password
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    if (user.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ.',
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        dob: user.dob,
        region: user.region,
        favoriteTheater: user.favoriteTheater,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          age: user.age,
          gender: user.gender,
          dob: user.dob,
          region: user.region,
          favoriteTheater: user.favoriteTheater,
        },
      });
    } else {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.phone !== undefined && req.body.phone.trim() !== '') {
        const cleanPhone = req.body.phone.trim();
        if (cleanPhone !== user.phone) {
          const phoneExists = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
          if (phoneExists) {
            res.status(400);
            throw new Error(`Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác!`);
          }
        }
        user.phone = cleanPhone;
      }

      user.username = req.body.username || user.username;
      user.age = req.body.age !== undefined ? req.body.age : user.age;
      user.gender = req.body.gender !== undefined ? req.body.gender : user.gender;
      user.dob = req.body.dob !== undefined ? req.body.dob : user.dob;
      user.region = req.body.region !== undefined ? req.body.region : user.region;
      user.favoriteTheater = req.body.favoriteTheater !== undefined ? req.body.favoriteTheater : user.favoriteTheater;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          age: updatedUser.age,
          gender: updatedUser.gender,
          dob: updatedUser.dob,
          region: updatedUser.region,
          favoriteTheater: updatedUser.favoriteTheater,
          token: generateToken(updatedUser._id),
        },
      });
    } else {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - Send email with reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Vui lòng cung cấp địa chỉ Email');
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy tài khoản nào khớp với địa chỉ Email này');
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });

    // Client url for password reset link
    const origin = req.headers.origin || req.headers.referer ? new URL(req.headers.referer).origin : null;
    const clientUrl = process.env.APP_URL || process.env.CLIENT_URL || origin || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaee00; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #e50914;">
          <h2 style="color: #e50914; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">NOVA CINEMATIC</h2>
          <p style="color: #666; font-size: 13px; margin-top: 4px;">Hệ Thống Đặt Vé Phim Trực Tuyến</p>
        </div>
        <div style="padding: 24px 0; color: #333; line-height: 1.6;">
          <h3 style="color: #111; font-size: 18px; margin-bottom: 12px;">Xin chào ${user.username || 'Quý khách'},</h3>
          <p style="font-size: 14px; color: #444;">Bạn nhận được email này vì đã gửi yêu cầu đặt lại mật khẩu cho tài khoản <strong>${user.email}</strong> tại Nova Cinematic.</p>
          <p style="font-size: 14px; color: #444;">Vui lòng nhấp vào nút bên dưới để tiến hành thiết lập lại mật khẩu mới (Liên kết có hiệu lực trong <strong>15 phút</strong>):</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" target="_blank" style="background-color: #e50914; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(229,9,20,0.35);">
              ĐẶT LẠI MẬT KHẨU NGAY
            </a>
          </div>

          <p style="font-size: 12px; color: #777; margin-top: 24px;">Hoặc bạn có thể sao chép và dán đường dẫn sau vào trình duyệt:</p>
          <div style="font-size: 12px; font-family: monospace; word-break: break-all; color: #d32f2f; background-color: #f9f9f9; padding: 10px 14px; border-radius: 8px; border: 1px solid #eeeeee;">
            ${resetUrl}
          </div>

          <p style="font-size: 13px; color: #888; margin-top: 24px; font-style: italic;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn được bảo mật an toàn.</p>
        </div>
        <div style="border-top: 1px solid #eeeeee; padding-top: 16px; text-align: center; font-size: 12px; color: #999999;">
          <p style="margin: 0;">© 2026 Nova Cinematic. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    `;

    try {
      const mailRes = await sendEmail({
        to: user.email,
        subject: '[NOVA CINEMATIC] Yêu cầu khôi phục mật khẩu tài khoản',
        html: htmlContent,
        text: `Yêu cầu khôi phục mật khẩu Nova Cinematic: ${resetUrl}`,
      });

      if (mailRes && mailRes.skipped) {
        return res.json({
          success: true,
          skipped: true,
          resetUrl,
          message: 'Đã tạo liên kết khôi phục mật khẩu (Do chưa cấu hình SMTP_USER trong backend/.env nên email không thể gửi trực tiếp).',
        });
      }

      res.json({
        success: true,
        message: 'Đã gửi hướng dẫn khôi phục mật khẩu vào Email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/Spam)!',
      });
    } catch (err) {
      console.error('Lỗi gửi email khôi phục mật khẩu:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500);
      throw new Error('Không thể gửi Email khôi phục. Vui lòng kiểm tra cấu hình Email hệ thống hoặc thử lại sau!');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Mật khẩu mới phải chứa ít nhất 6 ký tự');
    }

    // Get hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Liên kết khôi phục không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng thực hiện lại yêu cầu Quên mật khẩu!');
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
};
