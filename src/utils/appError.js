// src/utils/appError.js
/**
 * @file appError.js
 * @description Lớp đại diện cho lỗi nghiệp vụ (Operational Error) có cấu trúc mã định danh của hệ thống.
 */
export class AppError extends Error {
  /**
   * @param {string} code - Mã lỗi định danh (Ví dụ: 'AUTH_FAILED')
   * @param {string} message - Thông báo lỗi chi tiết hiển thị cho Client
   * @param {number} statusCode - Mã trạng thái HTTP tương ứng (Ví dụ: 400, 401, 403)
   * @param {any} [details=null] - Dữ liệu bổ sung đi kèm phục vụ UI xử lý thông tin
   */
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Đánh dấu lỗi nghiệp vụ chủ động kiểm soát

    Error.captureStackTrace(this, this.constructor);
  }
}