/**
 * @file role-permission.routes.js
 * @description Định tuyến phân hệ liên kết vai trò - quyền hạn. Đường dẫn phẳng hoàn toàn, không chứa dấu hai chấm (:).
 */

import { Router } from "express";
import * as rolePermissionController from "./role-permission.controller.js";
import authMiddleware from "../../middlewares/auth.js";
// import requireRole from "../../middlewares/rbac.js";

const router = Router();

// Chốt chặn an ninh cấp hệ thống
// router.use(authMiddleware, requireRole("Admin"));

router.post("/", rolePermissionController.handleAssignPermission);
router.get("/", rolePermissionController.handleGetPermissionsByRole);
router.delete("/", rolePermissionController.handleRemovePermission);

export default router;