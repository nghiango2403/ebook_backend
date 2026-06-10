/**
 * @file role-permission.service.js
 * @description Tầng nghiệp vụ xử lý liên kết ma trận phân quyền. Tuyệt đối không dùng req/res.
 */

import RolePermission from "./role_permission.model.js";
import Role from "./role.model.js";
import Permission from "./permission.model.js";
import { AppError } from "../../utils/appError.js";

/**
 * Nghiệp vụ gán Quyền hạn cho Vai trò
 */
export const assignPermissionToRole = async ({ roleId, permissionId }) => {
  // 1. Kiểm tra Role có tồn tại không
  const isRoleExist = await Role.exists({ _id: roleId });
  if (!isRoleExist) {
    throw new AppError("ROLE_NOT_FOUND", "Vai trò (Role) truyền vào không tồn tại", 404);
  }

  // 2. Kiểm tra Permission có tồn tại không
  const isPermissionExist = await Permission.exists({ _id: permissionId });
  if (!isPermissionExist) {
    throw new AppError("PERMISSION_NOT_FOUND", "Quyền hạn (Permission) truyền vào không tồn tại", 404);
  }

  // 3. Kiểm tra trùng lặp mapping (Chống duplicate trước khi DB chặn)
  const isMappingExist = await RolePermission.exists({ roleId, permissionId });
  if (isMappingExist) {
    throw new AppError("ROLE_PERMISSION_EXISTS", "Quyền hạn này đã được cấu hình gán cho Vai trò từ trước", 409);
  }

  const newMapping = await RolePermission.create({ roleId, permissionId });
  return newMapping;
};

/**
 * Nghiệp vụ lấy danh sách Quyền của một Vai trò (Có tự động Populate)
 */
export const getPermissionsByRole = async (roleId) => {
  if (!roleId) {
    throw new AppError("VALIDATION_ERROR", "Tham số truy vấn roleId là bắt buộc", 400);
  }

  // 1. Lấy dữ liệu từ Database và chỉ cần populate trường permissionId với các fields cần thiết
  const mappings = await RolePermission.find({ roleId })
    .populate({ 
      path: "permissionId", 
      select: "url method -_id"
    });

  // 2. Sử dụng .map() để lọc lấy đúng cấu trúc object { url, method } bên trong trường permissionId
  const purifiedPermissions = mappings
    .filter(item => item.permissionId) 
    .map(item => ({
      url: item.permissionId.url,
      method: item.permissionId.method
    }));

  return purifiedPermissions;
};

/**
 * Nghiệp vụ gỡ Quyền khỏi Vai trò
 */
export const removePermissionFromRole = async ({ roleId, permissionId }) => {
  if (!roleId || !permissionId) {
    throw new AppError("VALIDATION_ERROR", "Yêu cầu cung cấp đầy đủ cả hai tham số roleId và permissionId", 400);
  }

  // Kiểm tra mapping tồn tại trước khi thực hiện xóa
  const mapping = await RolePermission.findOne({ roleId, permissionId });
  if (!mapping) {
    
    throw new AppError("NOT_FOUND", "Mối liên kết giữa Vai trò và Quyền hạn này không tồn tại", 404);
  }

  await RolePermission.findByIdAndDelete(mapping._id);
  return null;
};