/**
 * @file category.controller.js
 * @description Bộ điều khiển phân phối Request/Response cho phân hệ Thể loại (Categories).
 * Đảm bảo bóc tách tham số phẳng từ req.query và định dạng dữ liệu đầu ra chuẩn.
 */

import * as categoryService from "./category.service.js";
import { formatSuccessResponse } from "../../utils/helpers.js";
import { AppError } from "../../utils/appError.js";

// API 1: Tạo thể loại truyện (Admin đặc quyền)
export const handleCreateCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      throw new AppError("VALIDATION_ERROR", "Tên thể loại (name) là thuộc tính bắt buộc", 400);
    }

    const result = await categoryService.createCategory({ name });
    return res.status(201).json(formatSuccessResponse("Tạo thể loại thành công", result));
  } catch (error) {
    return next(error);
  }
};

// API 2: Lấy danh sách thể loại hoạt động - isHidden: false (Công khai cho Độc giả/App Flutter)
export const handleGetCategories = async (req, res, next) => {
  try {
    const { page, limit, keyword } = req.query;

    const result = await categoryService.getCategories({ page, limit, keyword });
    return res.status(200).json(formatSuccessResponse("Lấy danh sách thể loại thành công", result));
  } catch (error) {
    return next(error);
  }
};

// API 3: Lấy toàn bộ danh sách thể loại bao gồm cả mục bị ẩn (Dành riêng cho Admin quản trị)
export const handleGetAllCategories = async (req, res, next) => {
  try {
    const { page, limit, keyword } = req.query;

    const result = await categoryService.getAllCategories({ page, limit, keyword });
    return res.status(200).json(formatSuccessResponse("Lấy danh sách thể loại thành công", result));
  } catch (error) {
    return next(error);
  }
};

// API 4: Lấy thông tin chi tiết một thể loại theo Query ID
export const handleGetCategoryDetail = async (req, res, next) => {
  try {
    const { id } = req.query; // Nhận id phẳng qua Query Parameter (?id=)

    const result = await categoryService.getCategoryById(id);
    return res.status(200).json(formatSuccessResponse("Lấy chi tiết thể loại thành công", result));
  } catch (error) {
    return next(error);
  }
};

// API 5: Chỉ cập nhật tên của thể loại truyện
export const handleUpdateCategoryName = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { name } = req.body;

    const result = await categoryService.updateCategoryName(id, name);
    return res.status(200).json(formatSuccessResponse("Cập nhật tên thể loại thành công", result));
  } catch (error) {
    return next(error);
  }
};

// API 6: Hoán đổi thứ tự hiển thị zindex bằng nút bấm Cộng/Trừ (UP/DOWN)
export const handleSwapCategoryZindex = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { direction } = req.body; // Giá trị: "UP" hoặc "DOWN"

    if (!direction) {
      throw new AppError("VALIDATION_ERROR", "Thuộc tính hướng dịch chuyển direction là bắt buộc", 400);
    }

    const result = await categoryService.swapCategoryZindex(id, direction);
    return res.status(200).json(formatSuccessResponse("Thay đổi thứ tự sắp xếp vị trí thành công", result));
  } catch (error) {
    return next(error);
  }
};

// API 7: Xóa thể loại kết hợp logic động thông báo phản hồi (Xóa cứng hoặc Ẩn mềm)
export const handleDeleteCategory = async (req, res, next) => {
  try {
    const { id } = req.query;

    const result = await categoryService.deleteCategory(id);

    let successMessage = "Xóa thể loại thành công hoàn toàn khỏi hệ thống";
    if (result && result.action === "HIDDEN") {
      successMessage = "Không thể xóa hoàn toàn do có sách đang dùng thể loại này, hệ thống đã tự động ẩn thể loại này với người dùng bình thường";
    }

    return res.status(200).json(formatSuccessResponse(successMessage, null));
  } catch (error) {
    return next(error);
  }
};