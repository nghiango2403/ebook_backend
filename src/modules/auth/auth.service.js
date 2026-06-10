// src/modules/auth/auth.service.js
/**
 * @file auth.service.js
 * @description Tầng xử lý logic nghiệp vụ phân hệ Xác thực (Register, Login, Refresh, Change Password).
 * Tuân thủ nghiêm ngặt CODING_RULE.md (Không dùng req, res, next, không chứa logic hiển thị).
 */

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/appError.js";
import { hashPassword, verifyPassword, sanitizeUser } from "../../utils/helpers.js";
import { sendEmailWithOTP } from "../../utils/mailSender.js";

// Định nghĩa inline Model dựa theo ENTITY.md
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: Number, default: 1 },
  coin: { type: Number, default: 0 },
  totalDeposited: { type: Number, default: 0 },
  timeBan: { type: Date, default: null },
  fcmToken: { type: String, default: null },
  secret: {type: String, default:null},
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }
}, { collection: "users", timestamps: true });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String
}, { collection: "roles" });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_key_123";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_key_456";

/**
 * Tạo token cặp đôi Access Token và Refresh Token
 */
const generateTokenPair = (payload) => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" });
  return { accessToken, refreshToken };
};

/**
 * Nghiệp vụ Đăng ký tài khoản mới
 */
export const registerUser = async ({ username, email, password }) => {
  // 1. Kiểm tra username tồn tại
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new AppError("VALIDATION_ERROR", "Tên tài khoản này đã tồn tại trong hệ thống", 400);
  }

  // 2. Kiểm tra email tồn tại
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new AppError("VALIDATION_ERROR", "Địa chỉ email này đã được sử dụng", 400);
  }

  // 3. Tra cứu tìm kiếm Role 'Normal' mặc định
  let defaultRole = await Role.findOne({ name: "Normal" });
  if (!defaultRole) {
    // Tự động tạo Role Normal phòng trường hợp Database trống chưa được seed dữ liệu ban đầu
    defaultRole = await Role.create({ name: "Normal", description: "Người đọc phổ thông" });
  }

  // 4. Hash mật khẩu bằng hàm tiện ích từ Task 9
  const hashedPassword = await hashPassword(password);

  // 5. Lưu thực thể người dùng mới vào database
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    level: 1,
    coin: 0,
    totalDeposited: 0,
    timeBan: null,
    fcmToken: null,
    secret: null,
    roleId: defaultRole._id
  });
  console.log(newUser);
  return { user: sanitizeUser(newUser) };
};

/**
 * Nghiệp vụ Đăng nhập tài khoản
 */
export const loginUser = async ({ email, password }) => {
  // 1. Tìm kiếm User theo email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("AUTH_FAILED", "Địa chỉ email hoặc mật khẩu không chính xác", 401);
  }

  // 2. Đối chiếu mật khẩu băm
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("AUTH_FAILED", "Địa chỉ email hoặc mật khẩu không chính xác", 401);
  }

  // 3. Kiểm tra trạng thái cấm (timeBan)
  if (user.timeBan && new Date(user.timeBan) > new Date()) {
    throw new AppError("ACCOUNT_BANNED", "Tài khoản của bạn hiện đang bị khóa truy cập", 403);
  }

  // 4. Sinh bộ khóa bảo mật JWT
  const tokenPayload = {
    userId: user._id,
    roleId: user.roleId,
    level: user.level
  };

  const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
};

/**
 * Nghiệp vụ làm mới cặp mã Token hết hạn
 */
export const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("TOKEN_INVALID", "Mã làm mới token không được để trống", 400);
  }

  try {
    // 1. Giải mã kiểm định Refresh Token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // 2. Sinh Access Token mới dựa trên cấu trúc payload sạch thu hồi được
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, roleId: decoded.roleId, level: decoded.level },
      JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new AppError("TOKEN_EXPIRED", "Mã làm mới (Refresh Token) đã hết hạn hoặc không hợp lệ", 401);
  }
};

/**
 * Nghiệp vụ Thay đổi mật khẩu tài khoản chủ động
 */
export const changeUserPassword = async (userId, { oldPassword, newPassword }) => {
  // 1. Tìm thông tin User hiện tại
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("AUTH_FAILED", "Tài khoản không tồn tại trên hệ thống", 404);
  }

  // 2. Xác thực mật khẩu cũ
  const isOldMatch = await verifyPassword(oldPassword, user.password);
  if (!isOldMatch) {
    throw new AppError("AUTH_FAILED", "Mật khẩu hiện tại nhập vào không chính xác", 400);
  }

  // 3. Tiến hành mã hóa băm mật khẩu mới và lưu trữ cập nhật
  user.password = await hashPassword(newPassword);
  await user.save();

  return null;
};

/**
 * Nghiệp vụ Quên mật khẩu - Chuẩn Production (Bảo mật tuyệt đối, không lộ OTP qua F12)
 * @param {string} email - Địa chỉ email yêu cầu khôi phục mật khẩu
 */
export const forgotUserPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("NOT_FOUND", "Địa chỉ email này không tồn tại trên hệ thống", 404);
  }

  if (user.timeBan && new Date(user.timeBan) > new Date()) {
    throw new AppError("ACCOUNT_BANNED", "Tài khoản gắn liền với email này hiện đang bị khóa", 403);
  }

  // 1. Sinh mã OTP 6 chữ số
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  
  // 2. Thiết lập thời gian hết hạn cho OTP (Ví dụ: 5 phút tính từ hiện tại)
  const otpExpiredAt = new Date(Date.now() + 5 * 60 * 1000);

  // 3. Lưu OTP và thời gian hết hạn trực tiếp vào tài khoản User trong Database để đối chiếu sau này
  // (Tận dụng trường 'secret' quy định tại ENTITY.md để lưu chuỗi JSON hoặc mã băm OTP)
  user.secret = JSON.stringify({ code: otpCode, expiresAt: otpExpiredAt });
  await user.save();

  // 4. GỌI EMAIL SERVICE (Sẽ phát triển ở Task sau)
  sendEmailWithOTP(user.email, otpCode);

  console.log("Otp: ", otpCode);

  // 5. CHỈ TRẢ VỀ thông tin cơ bản để xác nhận, tuyệt đối KHÔNG chứa otpCode
  return {
    email: user.email,
    otpExpiredAt:otpExpiredAt
  };
};

/**
 * Nghiệp vụ Xác thực mã OTP khôi phục mật khẩu
 * @param {string} email - Email tài khoản cần xác thực
 * @param {string} otpCode - Mã OTP 6 chữ số người dùng nhập từ Giao diện Flutter
 * @returns {Promise<Object>} Trả về Reset Token ngắn hạn nếu khớp dữ liệu
 */
export const verifyUserOtp = async (email, otpCode) => {
  // 1. Tìm User theo email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("NOT_FOUND", "Địa chỉ email không tồn tại", 404);
  }

  // 2. Kiểm tra xem trường secret có dữ liệu OTP hay không
  if (!user.secret) {
    throw new AppError("VALIDATION_ERROR", "Yêu cầu mã xác minh chưa được khởi tạo hoặc đã sử dụng", 400);
  }

  // 3. Giải mã khối dữ liệu secret lưu trong DB
  let otpData;
  try {
    otpData = JSON.parse(user.secret);
  } catch (e) {
    throw new AppError("INTERNAL_SERVER_ERROR", "Dữ liệu xác thực hệ thống bị lỗi cấu trúc", 500);
  }

  // 4. Kiểm tra thời hạn hiệu lực (Expiration Time) của OTP
  if (new Date() > new Date(otpData.expiresAt)) {
    user.secret = null; // Xóa OTP đã hết hạn khỏi DB
    await user.save();
    throw new AppError("TOKEN_EXPIRED", "Mã OTP đã hết hạn sử dụng (quá 5 phút)", 401);
  }

  // 5. So khớp mã số OTP
  if (otpData.code !== String(otpCode)) {
    throw new AppError("VALIDATION_ERROR", "Mã xác minh OTP nhập vào không chính xác", 400);
  }

  // 6. Xóa OTP sau khi xác thực thành công để chống tấn công phát lại (Replay Attack)
  user.secret = null;
  await user.save();

  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_key_123";
  const resetToken = jwt.sign(
    { userId: user._id, purpose: "reset_password" },
    JWT_ACCESS_SECRET,
    { expiresIn: "5m" }
  );
  console.log("Key: ", JWT_ACCESS_SECRET);
  return { resetToken };
};

/**
 * Nghiệp vụ Đặt lại mật khẩu mới bằng Reset Token (Kết thúc luồng Quên mật khẩu)
 * @param {string} resetToken - Mã JWT Reset Token ngắn hạn do Flutter gửi lên
 * @param {string} newPassword - Mật khẩu mới đã được xác thực độ dài ở Controller
 */
export const resetUserPasswordWithToken = async (resetToken, newPassword) => {
  try {
    const secretKey = process.env.JWT_ACCESS_SECRET || "access_secret_key_123";
    
    // 1. Xác thực và giải mã mã Token bảo mật ngắn hạn
    const decoded = jwt.verify(resetToken, secretKey);
    
    // 2. Kiểm tra tính toàn vẹn và mục đích sử dụng (Purpose Claim) của Token
    if (decoded.purpose !== "reset_password") {
      throw new AppError("TOKEN_INVALID", "Mã xác thực không hợp lệ cho hành động này", 403);
    }
    
    // 3. Truy vấn tìm kiếm thực thể người dùng tương ứng
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError("NOT_FOUND", "Tài khoản người dùng không còn tồn tại trên hệ thống", 404);
    }
    
    // 4. Tiến hành mã hóa băm mật khẩu mới bằng hàm tiện ích và lưu trữ vào Database
    user.password = await hashPassword(newPassword);
    await user.save();
    
    return null;
  } catch (error) {
    // Nếu lỗi bản chất là do jwt hết hạn hoặc sai chữ ký, chuyển đổi cấu trúc lỗi chuẩn hệ thống
    if (error instanceof AppError) throw error;
    throw new AppError("TOKEN_EXPIRED", "Phiên làm việc hoặc mã xác thực đã hết hạn, vui lòng thực hiện lại từ bước gửi OTP", 401);
  }
};