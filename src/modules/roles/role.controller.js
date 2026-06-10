/**
 * @file role.controller.js
 * @description Tầng tiếp nhận HTTP Request, xử lý validation đầu vào và gộp luồng tra cứu dựa trên id tài nguyên.
 */

import * as roleService from "./role.service.js";
import { formatSuccessResponse } from "../../utils/helpers.js";
import { AppError } from "../../utils/appError.js";

export const handleCreateRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError("VALIDATION_ERROR", "Tên vai trò (name) là bắt buộc", 400);
    }
    if (!["Normal", "Editor", "Admin"].includes(name)) {
      throw new AppError("VALIDATION_ERROR", "Tên vai trò phải thuộc một trong các giá trị: Normal, Editor, Admin", 400);
    }

    const result = await roleService.createRole({ name, description });
    return res.status(201).json(formatSuccessResponse("Tạo role thành công", result));
  } catch (error) {
    return next(error);
  }
};

/**
 * Gộp luồng xử lý: Tự động phân tích request để quyết định lấy danh sách hoặc lấy chi tiết
 */
export const handleGetRoles = async (req, res, next) => {
  try {
    const { id } = req.query; // Sẽ có giá trị nếu đi qua route "/:id"
    
    const result = await roleService.getRolesOrById(id);
    const message = id ? "Lấy chi tiết role thành công" : "Lấy danh sách role thành công";
    
    return res.status(200).json(formatSuccessResponse(message, result));
  } catch (error) {
    return next(error);
  }
};

export const handleUpdateRole = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { description, name } = req.body;

    // Chốt chặn Controller Validation: Ngăn chặn gửi dữ liệu đổi tên lên API
    if (name) {
      throw new AppError("VALIDATION_ERROR", "Hệ thống không cho phép thay đổi định danh tên (name) của vai trò", 400);
    }

    const result = await roleService.updateRole(id, { description });
    return res.status(200).json(formatSuccessResponse("Cập nhật mô tả vai trò thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleDeleteRole = async (req, res, next) => {
  try {
    const { id } = req.query;
    await roleService.deleteRole(id);
    return res.status(200).json(formatSuccessResponse("Xóa vai trò thành công", null));
  } catch (error) {
    return next(error);
  }
};