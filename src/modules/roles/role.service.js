/**
 * @file role.service.js
 * @description Tầng xử lý logic nghiệp vụ, ràng buộc hệ thống và thao tác dữ liệu cho Module Role.
 */

import Role from "./role.model.js";
import { AppError } from "../../utils/appError.js";

/**
 * Nghiệp vụ Tạo Role mới
 */
export const createRole = async ({ name, description }) => {
  const existingRole = await Role.findOne({ name });
  if (existingRole) {
    throw new AppError("VALIDATION_ERROR", `Vai trò '${name}' này đã tồn tại trên hệ thống`, 400);
  }

  return await Role.create({ name, description });
};

/**
 * Nghiệp vụ Tra cứu Role (Gộp luồng: Nếu có ID thì lấy chi tiết, không có ID thì lấy tất cả)
 */
export const getRolesOrById = async (id = null) => {
  if (id) {
    const role = await Role.findById(id);
    if (!role) {
      throw new AppError("ROLE_NOT_FOUND", "Vai trò yêu cầu không tồn tại trên hệ thống", 404);
    }
    return role;
  }
  
  return await Role.find({});
};

/**
 * Nghiệp vụ Cập nhật thông tin Role
 */
export const updateRole = async (id, { description }) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError("ROLE_NOT_FOUND", "Không tìm thấy vai trò để tiến hành cập nhật", 404);
  }

  // Chốt chặn Business Rule: Không cho phép đổi tên hoặc sửa đổi thông tin nếu vai trò thuộc hệ thống
  if (["Admin", "Editor", "Normal"].includes(role.name)) {
    // Chỉ cho phép cập nhật mô tả nếu Role thuộc hệ thống, tuyệt đối chặn đổi tên ở tầng db
    role.description = description !== undefined ? description : role.description;
    return await role.save();
  }

  if (description !== undefined) role.description = description;
  return await role.save();
};

/**
 * Nghiệp vụ Xóa Role
 */
export const deleteRole = async (id) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError("ROLE_NOT_FOUND", "Không tìm thấy vai trò để thực hiện lệnh xóa", 404);
  }

  // Chốt chặn Business Rule: Cấm tuyệt đối hành vi xóa các vai trò cốt lõi của hệ thống
  if (["Admin", "Editor", "Normal"].includes(role.name)) {
    throw new AppError("FORBIDDEN_ACTION", `Hành vi cấm: Không được phép xóa vai trò cốt lõi (${role.name}) của hệ thống`, 403);
  }

  await Role.findByIdAndDelete(id);
  return null;
};