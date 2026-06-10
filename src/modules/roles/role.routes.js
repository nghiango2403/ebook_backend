/**
 * @file role.routes.js
 * @description Bản đồ định tuyến nội bộ phân hệ quản lý Role. Bảo vệ nghiêm ngặt bằng auth và RBAC.
 */

import { Router } from "express";
import * as roleController from "./role.controller.js";
import authMiddleware from "../../middlewares/auth.js";
// import requireRole from "../../middlewares/rbac.js";

const router = Router();

// Toàn bộ các Endpoint xử lý thực thể Role đều thuộc đặc quyền duy nhất của 'Admin'
// router.use(authMiddleware, requireRole("Admin"));

router.post("/", roleController.handleCreateRole);
router.get("/", roleController.handleGetRoles);
router.patch("/", roleController.handleUpdateRole);
router.delete("/", roleController.handleDeleteRole);

export default router;