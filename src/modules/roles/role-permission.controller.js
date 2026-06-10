/**
 * @file role-permission.controller.js
 * @description Tầng tiếp nhận dữ liệu. Cam kết đọc dữ liệu qua req.query cho luồng GET/DELETE.
 */

import * as rolePermissionService from "./role-permission.service.js";
import { formatSuccessResponse } from "../../utils/helpers.js";
import { AppError } from "../../utils/appError.js";

export const handleAssignPermission = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.body;

    if (!roleId || !permissionId) {
      throw new AppError("VALIDATION_ERROR", "Dữ liệu body bắt buộc phải chứa cả roleId và permissionId", 400);
    }

    const result = await rolePermissionService.assignPermissionToRole({ roleId, permissionId });
    return res.status(201).json(formatSuccessResponse("Gán quyền cho vai trò thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleGetPermissionsByRole = async (req, res, next) => {
  try {
    const { roleId } = req.query; // TUÂN THỦ: Đọc nghiêm ngặt từ Query Parameters

    if (!roleId) {
      throw new AppError("VALIDATION_ERROR", "Thiếu tham số query '?roleId=' trên đường dẫn URL", 400);
    }

    const result = await rolePermissionService.getPermissionsByRole(roleId);
    return res.status(200).json(formatSuccessResponse("Lấy danh sách quyền của vai trò thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleRemovePermission = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.query; // TUÂN THỦ: Đọc nghiêm ngặt từ Query Parameters

    const result = await rolePermissionService.removePermissionFromRole({ roleId, permissionId });
    return res.status(200).json(formatSuccessResponse("Gỡ bỏ quyền khỏi vai trò thành công", result));
  } catch (error) {
    return next(error);
  }
};