// src/middlewares/auth.js
/**
 * @file auth.js
 * @description Middleware xác thực Token JWT, kiểm tra trạng thái người dùng (ban/khóa) và nhúng thông tin định danh vào luồng request.
 */

import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Đọc Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_INVALID",
          message: "Token không hợp lệ",
          details: null
        }
      });
    }
    const token = authHeader.split(" ")[1];
    // 2. Xác thực tính hợp lệ và thời hạn của JWT Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "access_secret_key");
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Token đã hết hạn",
            details: null
          }
        });
      }
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_INVALID",
          message: "Token không hợp lệ",
          details: null
        }
      });
    }

    // 3. Truy vấn tìm kiếm Người dùng từ Database dựa trên ID giải mã
    const user = await User.findById(decoded.userId || decoded._id).populate("roleId");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "AUTH_FAILED",
          message: "Người dùng không tồn tại",
          details: null
        }
      });
    }

    // 4. Kiểm tra thời hạn cấm tài khoản (timeBan) theo quy định trong ENTITY.md
    if (user.timeBan && new Date() < new Date(user.timeBan)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_BANNED",
          message: "Tài khoản đang bị khóa",
          details: {
            timeBan: user.timeBan
          }
        }
      });
    }

    // 5. Đính kèm dữ liệu vào đối tượng Request và chuyển tiếp đến luồng xử lý kế tiếp
    req.user = {
      userId: user._id.toString(),
      roleId: user.roleId,
      level: user.level || 1
    };

    return next();
  } catch (error) {
    // Chuyển tiếp lỗi hệ thống không lường trước về Error Handler toàn cục
    return next(error);
  }
};

export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roleId) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Bạn không có quyền truy cập tính năng này", details: null }
        });
      }
      // Lấy ra name của Role (Ví dụ: "Normal", "Admin") từ dữ liệu đã populate
      const userRoleName = req.user.roleId.name;
      // Kiểm tra quyền của user có nằm trong danh sách các quyền được phép truy cập không
      if (!allowedRoles.includes(userRoleName)) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Tài khoản của bạn không đủ thẩm quyền", details: null }
        });
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

export default authMiddleware;