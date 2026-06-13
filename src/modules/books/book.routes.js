/**
 * @file book.routes.js
 * @description Định tuyến các API liên quan đến phân hệ Sách (Books).
 */

import { Router } from "express";
import * as bookController from "./book.controller.js";
import authMiddleware from "../../middlewares/auth.js";
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

export default router;