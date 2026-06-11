/**
 * @file user.routes.js
 * @description Bản đồ định tuyến API dành cho Module quản trị tài khoản người dùng.
 */

import { Router } from "express";
import multer from "multer";
import * as userController from "./user.controller.js";
import authMiddleware, {requireRole} from "../../middlewares/auth.js";
import { AppError } from "../../utils/appError.js";
import upload from "../../middlewares/upload.js"
// import requireRole from "../../middlewares/rbac.js";

const router = Router();

// Endpoint công khai cho bất kỳ thành viên nào đã đăng nhập thành công để đọc thông tin Profile chính mình
router.get("/profile", authMiddleware, userController.handleGetCurrentProfile);
router.patch("/profile", authMiddleware, userController.handleUpdateProfile);
router.patch("/avatar", authMiddleware, upload.single("avatar"), userController.handleUpdateAvatar);

// Toàn bộ các nhánh Endpoint phía dưới thuộc quyền bảo vệ kiểm soát và quản lý duy nhất của cấp Admin
router.use(authMiddleware, requireRole("Admin"));

router.get("/", userController.handleGetUsers); // Gộp chung route xử lý lấy danh sách phân trang hoặc lấy lẻ theo id qua ?id=
router.patch("/role", userController.handleUpdateUserRole);
router.patch("/ban", userController.handleBanUser);
router.patch("/unban", userController.handleUnbanUser);

export default router;