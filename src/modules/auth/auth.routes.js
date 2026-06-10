// src/modules/auth/auth.routes.js
/**
 * @file auth.routes.js
 * @description Quản lý danh sách ánh xạ các Endpoint thuộc phân hệ Xác thực (Authentication Module).
 */

import { Router } from "express";
import * as authController from "./auth.controller.js";
import authMiddleware from "../../middlewares/auth.js"; // Import từ kết quả phân hệ Task 6 trước đó

const router = Router();

router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);
router.post("/refresh-token", authController.handleRefreshToken);
router.post("/forgot-password", authController.handleForgotPassword);
router.post("/verify-otp", authController.handleVerifyOtp);
router.post("/reset-password", authController.handleResetPassword);

// Endpoint đổi mật khẩu yêu cầu người dùng phải đăng nhập hệ thống trước (Chốt chặn bởi authMiddleware)
router.post("/change-password", authMiddleware, authController.handleChangePassword);

export default router;