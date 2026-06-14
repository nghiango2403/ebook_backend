/**
 * @file book.routes.js
 * @description Định tuyến các API liên quan đến phân hệ Sách (Books).
 */

import { Router } from "express";
import * as bookController from "./book.controller.js";
import authMiddleware, {requireRole} from "../../middlewares/auth.js";
import multer from "multer";
import upload from "../../middlewares/upload.js"

const router = Router();



// API: POST /api/v1/books - Tạo truyện mới (Yêu cầu đăng nhập và upload 1 ảnh coverImage)
router.post(
  "/",
  authMiddleware,
  upload.single("coverImage"),
  bookController.handleCreateBook
);

// API: PATCH /api/v1/books?id= - Chỉnh sửa thông tin truyện
router.patch(
  "/",
  authMiddleware,
  upload.single("coverImage"),
  bookController.handleUpdateBook
);

// API: GET /api/v1/books/review-queue - Lấy danh sách truyện chờ duyệt (Editor & Admin)
router.get(
  "/review-queue",
  authMiddleware,
  requireRole("Editor", "Admin"),
  bookController.handleGetReviewQueue
);

// API: GET /api/v1/books/review-detail - Lấy chi tiết truyện cần duyệt kèm lịch sử review (Editor & Admin)
router.get(
  "/review-detail",
  authMiddleware,
  requireRole("Editor", "Admin"),
  bookController.handleGetReviewDetail
);

// API: PATCH /api/v1/books/approve - Duyệt phê duyệt truyện (Editor & Admin)
router.patch(
  "/approve",
  authMiddleware,
  requireRole("Editor", "Admin"),
  bookController.handleApproveBook
);

// API: PATCH /api/v1/books/reject - Từ chối duyệt truyện (Editor & Admin)
router.patch(
  "/reject",
  authMiddleware,
  requireRole("Editor", "Admin"),
  bookController.handleRejectBook
);

// API: PATCH /api/v1/books/ban - Khóa truyện do vi phạm (Chỉ Admin)
router.patch(
  "/ban",
  authMiddleware,
  requireRole("Admin"),
  bookController.handleBanBook
);

// API: PATCH /api/v1/books/unban - Mở khóa truyện (Chỉ Admin)
router.patch(
  "/unban",
  authMiddleware,
  requireRole("Admin"),
  bookController.handleUnbanBook
);

export default router;