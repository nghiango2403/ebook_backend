// src/modules/auth/auth.controller.js
/**
 * @file auth.controller.js
 * @description Tầng tiếp nhận HTTP Request, thực thi xác thực định dạng đầu vào (Validation) và cấu trúc phản hồi.
 * Tuân thủ nghiêm ngặt CODING_RULE.md (Không chứa câu lệnh truy vấn DB, không xử lý business logic sâu).
 */

import * as authService from "./auth.service.js";
import { formatSuccessResponse } from "../../utils/helpers.js";
import { AppError } from "../../utils/appError.js";

/**
 * Biểu thức RegExp kiểm tra tính hợp lệ cơ bản của cấu trúc email
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handleRegister = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Tiến hành Validation sơ bộ tại đầu vào Controller
    if (!username || username.trim().length < 3) {
      throw new AppError("VALIDATION_ERROR", "Tên tài khoản (username) phải chứa ít nhất 3 ký tự", 400);
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new AppError("VALIDATION_ERROR", "Định dạng địa chỉ email cung cấp không hợp lệ", 400);
    }
    if (!password || password.length < 6) {
      throw new AppError("VALIDATION_ERROR", "Mật khẩu bảo mật phải chứa ít nhất 6 ký tự", 400);
    }

    const result = await authService.registerUser({ username, email, password });
    
    return res.status(201).json(
      formatSuccessResponse("Đăng ký thành công", result)
    );
  } catch (error) {
    return next(error);
  }
};

export const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("VALIDATION_ERROR", "Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu", 400);
    }

    const result = await authService.loginUser({ email, password });

    return res.status(200).json(
      formatSuccessResponse("Đăng nhập thành công", result)
    );
  } catch (error) {
    return next(error);
  }
};

export const handleRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("VALIDATION_ERROR", "Yêu cầu mã Refresh Token để thực hiện hành động này", 400);
    }

    const result = await authService.refreshUserToken(refreshToken);

    return res.status(200).json(
      formatSuccessResponse("Làm mới token thành công", result)
    );
  } catch (error) {
    return next(error);
  }
};

export const handleForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      throw new AppError("VALIDATION_ERROR", "Vui lòng nhập chính xác định dạng địa chỉ email", 400);
    }

    const result = await authService.forgotUserPassword(email);

    return res.status(200).json(
      formatSuccessResponse(
        "Mã xác minh khôi phục mật khẩu đã được gửi đến hộp thư Email của bạn.",
        result
      )
    );
  } catch (error) {
    return next(error);
  }
};

export const handleVerifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    // Validation định dạng dữ liệu đầu vào
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new AppError("VALIDATION_ERROR", "Định dạng địa chỉ email không hợp lệ", 400);
    }
    if (!otpCode || String(otpCode).length !== 6) {
      throw new AppError("VALIDATION_ERROR", "Mã xác minh OTP phải chứa chính xác 6 chữ số", 400);
    }

    // Gọi xuống tầng Service để xử lý so khớp mã số
    const result = await authService.verifyUserOtp(email, otpCode);

    return res.status(200).json(
      formatSuccessResponse("Xác thực mã OTP thành công. Vui lòng tiến hành đặt lại mật khẩu mới.", result)
    );
  } catch (error) {
    return next(error);
  }
};

export const handleResetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Chốt chặn Validation: Thực hiện kiểm tra dữ liệu thô ngay tại đầu vào Controller
    if (!resetToken) {
      throw new AppError("VALIDATION_ERROR", "Thiếu mã xác thực resetToken để thực hiện hành động này", 400);
    }
    if (!newPassword || newPassword.length < 6) {
      throw new AppError("VALIDATION_ERROR", "Mật khẩu đổi mới phải chứa ít nhất 6 ký tự", 400);
    }

    // Bàn giao dữ liệu sạch xuống tầng Service xử lý nghiệp vụ sâu với Database
    await authService.resetUserPasswordWithToken(resetToken, newPassword);

    return res.status(200).json(
      formatSuccessResponse("Đặt lại mật khẩu mới thành công. Vui lòng sử dụng mật khẩu này để đăng nhập.", null)
    );
  } catch (error) {
    return next(error);
  }
};

export const handleChangePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // Lấy thông tin định danh userId được bóc tách đính kèm từ authMiddleware (Task 6)
    const userId = req.user?.userId;

    if (!oldPassword || !newPassword) {
      throw new AppError("VALIDATION_ERROR", "Vui lòng cung cấp đầy đủ mật khẩu cũ và mật khẩu mới", 400);
    }
    if (newPassword.length < 6) {
      throw new AppError("VALIDATION_ERROR", "Mật khẩu đổi mới phải chứa ít nhất 6 ký tự", 400);
    }

    await authService.changeUserPassword(userId, { oldPassword, newPassword });

    return res.status(200).json(
      formatSuccessResponse("Đổi mật khẩu thành công", null)
    );
  } catch (error) {
    return next(error);
  }
};

