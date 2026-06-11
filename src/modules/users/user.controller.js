/**
 * @file user.controller.js
 * @description Tầng tiếp nhận request, validate dữ liệu thô đầu vào và đóng gói response chuẩn hóa.
 */

import * as userService from "./user.service.js";
import { formatSuccessResponse, parseDateFlexible } from "../../utils/helpers.js";
import { AppError } from "../../utils/appError.js";

export const handleGetUsers = async (req, res, next) => {
  try {
    const { id, page, limit, keyword } = req.query; // TUÂN THỦ: Đọc nghiêm ngặt từ Query Parameters

    const result = await userService.getUsersOrById({ id, page, limit, keyword });
    const message = id ? "Lấy thông tin chi tiết người dùng thành công" : "Lấy danh sách người dùng thành công";

    return res.status(200).json(formatSuccessResponse(message, result));
  } catch (error) {
    return next(error);
  }
};

export const handleGetCurrentProfile = async (req, res, next) => {
  try {
    // req.user được nạp tự động từ Middleware auth.js sau khi xác thực mã JWT thành công
    const currentUserId = req.user.userId;

    const result = await userService.getCurrentProfile(currentUserId);
    return res.status(200).json(formatSuccessResponse("Lấy thông tin trang cá nhân thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleUpdateUserRole = async (req, res, next) => {
  try {
    const currentAdminId = req.user.userId;
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      throw new AppError("VALIDATION_ERROR", "Dữ liệu body bắt buộc phải cung cấp đủ userId và roleId", 400);
    }

    const result = await userService.updateUserRole({ currentAdminId, targetUserId: userId, newRoleId: roleId });
    return res.status(200).json(formatSuccessResponse("Cập nhật vai trò người dùng thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleBanUser = async (req, res, next) => {
  try {
    const { userId, timeBan } = req.body;

    if (!userId || !timeBan) {
      throw new AppError("VALIDATION_ERROR", "Yêu cầu cung cấp đầy đủ thông tin định danh userId và thời hạn khóa timeBan", 400);
    }

    const banDate = parseDateFlexible(timeBan);
    if (isNaN(banDate.getTime()) || banDate <= new Date()) {
      throw new AppError("VALIDATION_ERROR", "Thời gian khóa tài khoản định dạng không hợp lệ hoặc phải nằm trong tương lai", 400);
    }

    const result = await userService.updateUserBanStatus({ targetUserId: userId, timeBan: banDate });
    return res.status(200).json(formatSuccessResponse("Khóa tài khoản người dùng thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleUnbanUser = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      throw new AppError("VALIDATION_ERROR", "Tham số định danh định vị tài khoản người dùng (userId) là bắt buộc", 400);
    }

    const result = await userService.updateUserBanStatus({ targetUserId: userId, timeBan: null });
    return res.status(200).json(formatSuccessResponse("Mở khóa tài khoản người dùng thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleUpdateProfile = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const { username, password, coin, totalDeposited } = req.body;

    // Chốt chặn bảo mật: Cấm tuyệt đối cập nhật các trường nhạy cảm/tài chính trong Task 16
    if (password || coin || totalDeposited) {
      throw new AppError("VALIDATION_ERROR", "Hệ thống cấm thay đổi mật khẩu hoặc số dư qua API này", 400);
    }
    const result = await userService.updateCurrentProfile(currentUserId, { username });
    return res.status(200).json(formatSuccessResponse("Cập nhật thông tin cá nhân thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleUpdateAvatar = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;

    if (!req.file) {
      throw new AppError("VALIDATION_ERROR", "Thiếu trường dữ liệu avatar trong cấu trúc yêu cầu", 400);
    }
    const result = await userService.updateCurrentUserAvatar(currentUserId, req.file);
    return res.status(200).json(formatSuccessResponse("Cập nhật ảnh đại diện thành công", result));
  } catch (error) {
    return next(error);
  }
};