/**
 * @file category.routes.js
 * @description Bản đồ phân phối đường dẫn API cho Module Categories.
 * Phân định rõ ràng ranh giới giữa luồng Public (Độc giả) và luồng Admin (RBAC).
 */

import { Router } from "express";
import * as categoryController from "./category.controller.js";
import authMiddleware, {requireRole} from "../../middlewares/auth.js";

const router = Router();

// ======================== TUYẾN ĐƯỜNG CÔNG KHAI (APP FLUTTER / ĐỘC GIẢ) ========================
// Chỉ lấy danh mục có isHidden: false phục vụ UI App đọc truyện công khai
router.get("/", categoryController.handleGetCategories);
router.get("/detail", categoryController.handleGetCategoryDetail); // API: /api/v1/categories/detail?id=xxxx

// ======================== TUYẾN ĐƯỜNG ĐẶC QUYỀN QUẢN TRỊ (ADMIN ONLY) ========================
// Chốt chặn bảo vệ xác thực tài khoản và phân quyền RBAC
router.use(authMiddleware, requireRole("Admin"));

router.post("/", categoryController.handleCreateCategory);
router.get("/admin-list", categoryController.handleGetAllCategories); // Xem danh sách quản trị gồm cả mục đã ẩn
router.patch("/name", categoryController.handleUpdateCategoryName);   // API: /api/v1/categories/name?id=xxxx
router.patch("/reorder", categoryController.handleSwapCategoryZindex); // API: /api/v1/categories/reorder?id=xxxx
router.delete("/", categoryController.handleDeleteCategory);          // API: /api/v1/categories?id=xxxx

export default router;