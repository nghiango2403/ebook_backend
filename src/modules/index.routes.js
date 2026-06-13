// src/modules/index.routes.js
/**
 * @file index.routes.js
 * @description Bộ điều phối định tuyến trung tâm (Root Router Aggregator) của hệ thống.
 * Chịu trách nhiệm gom cụm toàn bộ router phân hệ, quản lý phiên bản API (Versioning) và xử lý lỗi 404 Endpoint.
 */

import { Router } from "express";
import { formatSuccessResponse } from "../utils/helpers.js";
import authRoutes from "./auth/auth.routes.js";
import permissionRoutes from "./roles/permission.routes.js";
import roleRoutes from "./roles/role.routes.js";
import rolePermissionRoutes from "./roles/role-permission.routes.js";
import userRoutes from "./users/user.routes.js";
import categoryRoutes from "./categories/category.routes.js"
import bookRoutes from "./books/book.routes.js"

const router = Router();

/**
 * 3. Health Check Endpoint
 * Định tuyến kiểm tra trạng thái vận hành của Server Backend
 * URL thực tế sau khi mount: GET /api/v1/health
 */
router.get("/health", (req, res) => {
  return res.status(200).json(
    formatSuccessResponse("Server is running", { status: "OK" })
  );
});

/**
 * 4. Router Registration (Hạ tầng đăng ký các module nghiệp vụ)
 * Đăng ký và kết nối router của các phân hệ chức năng khi được triển khai ở các task sau.
 * Hiện tại các module chưa được khởi tạo, thiết lập dưới dạng TODO Stub theo đúng thiết kế bắt buộc.
 */
// Đăng ký Module Authentication an toàn dưới prefix /api/v1/auth
router.use("/auth", authRoutes);

// Đăng ký mount tuyến đường vào router trung tâm 
router.use("/permissions", permissionRoutes);

// Đăng ký ROUTER module ROLES (/api/v1/roles)
router.use("/roles", roleRoutes);

// Đăng ký router module role-permissions
router.use("/role-permissions", rolePermissionRoutes);

// Đăng ký router module user
router.use("/users", userRoutes);

// TODO: Register book routes (Task 18)
router.use("/books", bookRoutes);

// TODO: Register chapter routes (Task 21)
// router.use("/chapters", chapterRoutes);

// Đăng ký router module category
router.use("/categories", categoryRoutes);

// TODO: Register comment routes (Task 26)
// router.use("/comments", commentRoutes);

// TODO: Register transaction routes (Task 30)
// router.use("/transactions", transactionRoutes);

// TODO: Register notification routes (Task 34)
// router.use("/notifications", notificationRoutes);


/**
 * 5. 404 Handler (Chốt chặn Endpoint không tồn tại)
 * Bắt lỗi toàn bộ các Request gọi sai Method hoặc sai URL Endpoint cấu hình
 */
router.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "API endpoint not found",
      details: null
    }
  });
});

export default router;