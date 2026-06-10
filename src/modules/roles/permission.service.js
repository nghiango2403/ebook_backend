/**
 * @file permission.service.js
 * @description Tầng xử lý logic nghiệp vụ CRUD cho thực thể Permission.
 */

import Permission from "./permission.model.js";
import { AppError } from "../../utils/appError.js";

export const createPermission = async ({ name, url, method }) => {
  const existing = await Permission.findOne({ name });
  if (existing) {
    throw new AppError("VALIDATION_ERROR", `Quyền hạn '${name}' này đã tồn tại`, 400);
  }
  return await Permission.create({ name, url, method });
};

export const getAllPermissions = async () => {
  return await Permission.find({});
};

export const getPermissionById = async (id) => {
  const permission = await Permission.findById(id);
  if (!permission) {
    throw new AppError("NOT_FOUND", "Không tìm thấy quyền hạn yêu cầu", 404);
  }
  return permission;
};

export const updatePermission = async (id, { name, url, method }) => {
  if (name) {
    const existing = await Permission.findOne({ name, _id: { $ne: id } });
    if (existing) {
      throw new AppError("VALIDATION_ERROR", `Tên quyền '${name}' đã được sử dụng bởi thực thể khác`, 400);
    }
  }

  const updatedPermission = await Permission.findByIdAndUpdate(
    id,
    { name, url, method },
    { new: true, runValidators: true }
  );

  if (!updatedPermission) {
    throw new AppError("NOT_FOUND", "Không tìm thấy quyền hạn để cập nhật", 404);
  }
  return updatedPermission;
};

export const deletePermission = async (id) => {
  const deletedPermission = await Permission.findByIdAndDelete(id);
  if (!deletedPermission) {
    throw new AppError("NOT_FOUND", "Không tìm thấy quyền hạn để xóa", 404);
  }
  return null;
};