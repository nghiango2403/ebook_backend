/**
 * @file permission.controller.js
 * @description Tầng tiếp nhận HTTP Request và Validation dữ liệu thô cho Permission.
 */

import * as permissionService from "./permission.service.js";
import { formatSuccessResponse } from "../../utils/helpers.js";
import { AppError } from "../../utils/appError.js";

export const handleCreatePermission = async (req, res, next) => {
  try {
    const { name, url, method } = req.body;
    if (!name || !url) {
      throw new AppError("VALIDATION_ERROR", "Tên quyền (name) và đường dẫn (url) không được để trống", 400);
    }
    const result = await permissionService.createPermission({ name, url, method });
    return res.status(201).json(formatSuccessResponse("Tạo quyền hạn thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleGetAllPermissions = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (id) {
      const result = await permissionService.getPermissionById(id);
      return res.status(200).json(formatSuccessResponse("Lấy chi tiết quyền hạn thành công", result));
    }

    const result = await permissionService.getAllPermissions();
    return res.status(200).json(formatSuccessResponse("Lấy danh sách quyền hạn thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleUpdatePermission = async (req, res, next) => {
  try {
    const { id } = req.query
    const { name, url } = req.body;
    const result = await permissionService.updatePermission(id, { name, url });
    return res.status(200).json(formatSuccessResponse("Cập nhật quyền hạn thành công", result));
  } catch (error) {
    return next(error);
  }
};

export const handleDeletePermission = async (req, res, next) => {
  try {
    const { id } = req.query;
    await permissionService.deletePermission(id);
    return res.status(200).json(formatSuccessResponse("Xóa quyền hạn thành công", null));
  } catch (error) {
    return next(error);
  }
};