/**
 * @file permission.routes.js
 * @description Quản lý danh sách các Endpoint của phân hệ Permission.
 */

import { Router } from "express";
import * as permissionController from "./permission.controller.js";

const router = Router();

router.post("/", permissionController.handleCreatePermission);
router.get("/", permissionController.handleGetAllPermissions);
router.patch("/", permissionController.handleUpdatePermission);
router.delete("/", permissionController.handleDeletePermission);

export default router;