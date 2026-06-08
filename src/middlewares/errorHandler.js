// src/middlewares/errorHandler.js
/**
 * @file errorHandler.js
 * @description Middleware tập trung thu gom và xử lý, cấu trúc lại toàn bộ lỗi ứng dụng trước khi phản hồi về Client.
 */
import { AppError } from "../utils/appError.js";

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 1. Khởi tạo giá trị mặc định cho lỗi hệ thống không xác định
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "Lỗi hệ thống hoặc lỗi xử lý cơ sở dữ liệu";
  let statusCode = err.statusCode || 500;
  let details = err.details || null;

  // 2. Xử lý trường hợp lỗi CastError của Mongoose (Sai định dạng ObjectId)
  if (err.name === "CastError") {
    code = "VALIDATION_ERROR";
    message = "ID không hợp lệ";
    statusCode = 400;
    details = null;
  }

  // 3. Xử lý trường hợp lỗi ValidationError của Mongoose (Thiếu trường, sai dữ liệu ràng buộc)
  if (err.name === "ValidationError") {
    code = "VALIDATION_ERROR";
    message = "Dữ liệu không hợp lệ";
    statusCode = 400;
    details = {};
    Object.values(err.errors).forEach((el) => {
      details[el.path] = el.message;
    });
  }

  // 4. Xử lý trường hợp lỗi trùng lặp dữ liệu MongoDB (Duplicate Key Error - Mã lỗi 11000)
  if (err.code === 11000) {
    code = "VALIDATION_ERROR";
    message = "Dữ liệu đã tồn tại";
    statusCode = 400;
    details = {};
    if (err.keyValue) {
      Object.keys(err.keyValue).forEach((key) => {
        details[key] = `${key} đã tồn tại trong hệ thống`;
      });
    }
  }

  // 5. Nếu là lỗi nghiệp vụ xác định từ AppError, ghi đè biến chuẩn hóa
  if (err instanceof AppError || err.isOperational) {
    code = err.code;
    message = err.message;
    statusCode = err.statusCode;
    details = err.details;
  }

  // 6. Quy tắc Logging dựa theo không gian môi trường phát triển (LOGGING RULE)
  if (process.env.NODE_ENV === "development") {
    console.error("====== [DEVELOPMENT ERROR LOG] ======");
    console.error(`Name: ${err.name}`);
    console.error(`Code: ${code}`);
    console.error(`Message: ${message}`);
    console.error(err.stack);
    console.error("=====================================");
  } else {
    // Trên môi trường Production chỉ ghi nhận log các lỗi hệ thống nghiêm trọng
    if (statusCode === 500) {
      console.error("Database Error:", err.message);
    }
  }

  // 7. Trả phản hồi chuẩn hóa về Client theo API_CONTRACT.md (Che giấu tuyệt đối stack trace)
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
};

export default errorHandler;