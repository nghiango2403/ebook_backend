// src/middlewares/rbac.js
/**
 * @file rbac.js
 * @description Middleware kiểm tra phân quyền dựa trên cơ chế RBAC (Role, Permission, Level) quy định tại CODING_RULE.md và ENTITIES.md.
 */

import RolePermission from "../modules/roles/rolePermission.model.js";
import Permission from "../modules/roles/permission.model.js";

/**
 * Factory Middleware xác thực quyền hạn truy cập API (RBAC)
 * @param {string} requiredPermissionName - Tên quyền hạn bắt buộc thực hiện hành động (Ví dụ: "WRITE_BOOK")
 * @param {number} [requiredLevel=1] - Cấp độ tài khoản (level) tối thiểu yêu cầu hệ thống
 */
const rbacMiddleware = (requiredPermissionName, requiredLevel = 1) => {
  return async (req, res, next) => {
    try {
      // 1. Trích xuất thông tin User được gán từ authMiddleware (Task 6)
      const { roleId, level } = req.user || {};

      if (!roleId) {
        return res.status(403).json({
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Không có quyền truy cập: Thiếu thông tin vai trò",
            details: null
          }
        });
      }

      // 2. Kiểm tra điều kiện Cấp độ (Level) trước để tối ưu hóa truy vấn Database (Early Return)
      if (level < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Cấp độ tài khoản của bạn không đủ điều kiện thực hiện thao tác này",
            details: {
              currentLevel: level,
              requiredLevel: requiredLevel
            }
          }
        });
      }

      // 3. Tra cứu ID thực thể của Permission từ tên quyền hạn yêu cầu
      const permission = await Permission.findOne({ name: requiredPermissionName });
      if (!permission) {
        return res.status(403).json({
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Quyền hạn yêu cầu không tồn tại trên hệ thống",
            details: null
          }
        });
      }

      // 4. Đối chiếu kiểm tra bản ghi ánh xạ giữa [Role - Permission] tại Role_Permission (ENTITY.md)
      const hasPermission = await RolePermission.findOne({
        roleId: roleId,
        permissionId: permission._id
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Tài khoản của bạn không được cấp quyền thực hiện hành động này",
            details: null
          }
        });
      }

      // 5. Thỏa mãn toàn bộ điều kiện phân quyền, cho phép tiếp tục luồng xử lý
      return next();
    } catch (error) {
      // Chuyển tiếp lỗi bất ngờ phát sinh về hệ thống Error Handler toàn cục
      return next(error);
    }
  };
};

export default rbacMiddleware;