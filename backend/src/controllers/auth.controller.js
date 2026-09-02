const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const sendEmail = require('../utils/sendEmail');

/**
 * @helper   Tạo JSON Web Token (JWT) cho xác thực người dùng
 * @param    {string} id - ID của người dùng trong MongoDB
 * @returns  {string} Chuỗi token JWT có thời hạn 30 ngày
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforbookingmovies12345', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Đăng ký tài khoản người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, phone, age, gender, dob, region, favoriteTheater } = req.body;

    // Chuẩn hóa dữ liệu đầu vào (viết thường và loại bỏ khoảng trắng thừa)
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').trim();

    // 1. Kiểm tra Email đã tồn tại trong cơ sở dữ liệu chưa
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      res.status(400);
      throw new Error('Email này đã được sử dụng cho tài khoản khác!');
    }

    // 2. Kiểm tra Số điện thoại đã được đăng ký chưa (nếu có nhập SĐT)
    if (cleanPhone) {
      const phoneExists = await User.findOne({ phone: cleanPhone });
      if (phoneExists) {
        res.status(400);
        throw new Error(`Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác!`);
      }
    }

    // 3. Tạo tài khoản người dùng mới trong database (Mật khẩu được băm tự động ở Pre-save hook của Model)
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

    // 4. Trả về thông tin tài khoản kèm Token xác thực sau khi đăng ký thành công
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

/**
 * @desc    Đăng nhập hệ thống
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    // 1. Tìm người dùng theo Email (lấy kèm trường password do mặc định trong Schema để select: false)
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // 2. Kiểm tra mật khẩu nhập vào với mật khẩu đã băm trong database
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // 3. Kiểm tra xem tài khoản có đang bị Quản trị viên khóa hay không
    if (user.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ.',
      });
    }

    // 4. Trả về thông tin người dùng và JWT Token khi đăng nhập thành công
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

/**
 * @desc    Lấy thông tin cá nhân của người dùng đang đăng nhập
 * @route   GET /api/auth/profile
 * @access  Private (Yêu cầu Token)
 */
const getUserProfile = async (req, res, next) => {
  try {
    // Tìm người dùng trong DB theo ID lưu trong req.user (từ Middleware xác thực JWT)
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

/**
 * @desc    Cập nhật thông tin hồ sơ cá nhân
 * @route   PUT /api/auth/profile
 * @access  Private (Yêu cầu Token)
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Nếu thay đổi số điện thoại, kiểm tra xem SĐT mới đã bị tài khoản khác sử dụng chưa
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

      // 2. Cập nhật các trường thông tin nếu có gửi lên từ client
      user.username = req.body.username || user.username;
      user.age = req.body.age !== undefined ? req.body.age : user.age;
      user.gender = req.body.gender !== undefined ? req.body.gender : user.gender;
      user.dob = req.body.dob !== undefined ? req.body.dob : user.dob;
      user.region = req.body.region !== undefined ? req.body.region : user.region;
      user.favoriteTheater = req.body.favoriteTheater !== undefined ? req.body.favoriteTheater : user.favoriteTheater;

      // 3. Nếu người dùng muốn đổi mật khẩu mới
      if (req.body.password) {
        user.password = req.body.password;
      }

      // 4. Lưu lại thông tin đã thay đổi
      const updatedUser = await user.save();

      // 5. Trả về dữ liệu mới đã được cập nhật kèm Token mới
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

/**
 * @desc    Quên mật khẩu - Gửi Email chứa liên kết khôi phục mật khẩu
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
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

    // 1. Tạo chuỗi ngẫu nhiên (resetToken) và băm bằng thuật toán SHA256 để lưu an toàn vào DB
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 2. Thiết lập token khôi phục và thời gian hết hạn (15 phút)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 phút

    await user.save({ validateBeforeSave: false });

    // 3. Xây dựng đường dẫn URL tới trang Đặt lại mật khẩu ở phía Frontend
    const origin = req.headers.origin || req.headers.referer ? new URL(req.headers.referer).origin : null;
    const clientUrl = process.env.APP_URL || process.env.CLIENT_URL || origin || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // 4. Nội dung Email định dạng HTML mẫu đẹp mắt
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaee00; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #e50914;">
          <h2 style="color: #e50914; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">NOVA CINEMA</h2>
          <p style="color: #666; font-size: 13px; margin-top: 4px;">Hệ Thống Đặt Vé Phim Trực Tuyến</p>
        </div>
        <div style="padding: 24px 0; color: #333; line-height: 1.6;">
          <h3 style="color: #111; font-size: 18px; margin-bottom: 12px;">Xin chào ${user.username || 'Quý khách'},</h3>
          <p style="font-size: 14px; color: #444;">Bạn nhận được email này vì đã gửi yêu cầu đặt lại mật khẩu cho tài khoản <strong>${user.email}</strong> tại Nova Cinema.</p>
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
          <p style="margin: 0;">© 2026 Nova Cinema. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    `;

    try {
      // 5. Gửi Email thông qua tiện ích sendEmail
      const mailRes = await sendEmail({
        to: user.email,
        subject: '[NOVA CINEMA] Yêu cầu khôi phục mật khẩu tài khoản',
        html: htmlContent,
        text: `Yêu cầu khôi phục mật khẩu Nova Cinema: ${resetUrl}`,
      });

      // Nếu hệ thống chưa cấu hình gửi mail thật (trạng thái skipped)
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

/**
 * @desc    Đặt lại mật khẩu mới bằng Token từ Email
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Kiểm tra độ dài mật khẩu mới
    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Mật khẩu mới phải chứa ít nhất 6 ký tự');
    }

    // 2. Băm token nhận được từ URL để so sánh với resetPasswordToken lưu trong DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 3. Tìm tài khoản trùng khớp token băm và kiểm tra thời hạn hết hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Liên kết khôi phục không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng thực hiện lại yêu cầu Quên mật khẩu!');
    }

    // 4. Cập nhật mật khẩu mới và xóa bỏ các thông tin token khôi phục
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

