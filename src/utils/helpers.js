// src/utils/helpers.js
/**
 * @file helpers.js
 * @description Lớp Tiện ích (Utility Layer) chứa các hàm xử lý dữ liệu, mã hóa và định dạng dùng chung cho toàn hệ thống.
 * Tuân thủ nghiêm ngặt CODING_RULE.md và API_CONTRACT.md.
 */

import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

/**
 * 1. Hash mật khẩu bằng bcrypt
 * @param {string} password - Mật khẩu gốc dạng raw text
 * @returns {Promise<string>} Chuỗi mật khẩu đã được mã hóa kèm salt
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 2. So sánh đối chiếu mật khẩu thô và chuỗi hash lưu trữ
 * @param {string} password - Mật khẩu raw text người dùng nhập vào
 * @param {string} hashedPassword - Mật khẩu mã hóa lưu trong Database
 * @returns {Promise<boolean>} Kết quả kiểm tra (true: khớp, false: sai lệch)
 */
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * 3. Sinh chuỗi chữ ký số bảo mật HMAC SHA512 cho các cổng thanh toán
 * @param {string} data - Chuỗi dữ liệu sắp xếp theo bảng chữ cái cần ký nhận
 * @param {string} secret - Khóa bí mật (Secret Key) được cấp bởi nhà cung cấp giải pháp
 * @returns {string} Chuỗi mã hóa dạng hex string viết thường
 */
export const generateHmacSHA512 = (data, secret) => {
  return crypto
    .createHmac("sha512", secret)
    .update(data)
    .digest("hex");
};

/**
 * 4. Sinh mã giao dịch duy nhất ở cấp độ ứng dụng dựa trên mốc thời gian mili giây
 * Định dạng: PREFIX_YYYYMMDDHHMMSSmmmRANDOM
 * @param {string} prefix - Tiền tố đại diện phân hệ (Ví dụ: DEP, PAY, DONATE)
 * @returns {string} Mã giao dịch chuẩn hóa không chứa ký tự đặc biệt
 */
export const generateTransactionId = (prefix) => {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
  
  // Thêm chuỗi 3 số ngẫu nhiên để triệt tiêu hoàn toàn tỷ lệ trùng lặp khi chạy đa luồng đồng thời
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  
  return `${prefix}_${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${randomSuffix}`;
};

/**
 * 5. Chuẩn hóa cấu trúc siêu dữ liệu phân trang theo PAGINATION RULE
 * @param {number} page - Số trang hiện tại
 * @param {number} limit - Số lượng phần tử giới hạn trên một trang
 * @param {number} totalItems - Tổng số bản ghi thực tế thu được trong Database
 * @returns {Object} Đối tượng cấu trúc phân trang hoàn chỉnh
 */
export const formatPagination = (page, limit, totalItems) => {
  const p = parseInt(page, 10) || 10;
  const l = parseInt(limit, 10) || 20;
  const total = parseInt(totalItems, 10) || 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / l);

  return {
    page: p,
    limit: l,
    totalItems: total,
    totalPages: totalPages
  };
};

/**
 * 6. Loại bỏ dữ liệu nhạy cảm của tài khoản người dùng trước khi phản hồi về Client
 * @param {Object} user - Đối tượng dữ liệu gốc Mongoose Document hoặc Object phẳng
 * @returns {Object} Đối tượng đã lược bỏ các trường thông tin mật
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  
  // Chuyển đổi dữ liệu từ dạng Document của Mongoose nếu cần thiết
  const userObj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.secret;
  delete userObj.__v; // Xóa thêm thông tin nội bộ của Mongoose để làm sạch payload
  
  return userObj;
};

/**
 * 7. Định dạng cấu trúc gói tin phản hồi thành công chuẩn (Success Response Standard)
 * @param {string} message - Lời nhắn mô tả trạng thái thao tác thành công
 * @param {any} data - Khối dữ liệu kết quả nghiệp vụ (Object hoặc Array)
 * @returns {Object} Cấu trúc gói tin JSON hợp lệ theo API_CONTRACT.md
 */
export const formatSuccessResponse = (message, data) => {
  return {
    success: true,
    message: message || "Thao tác thành công",
    data: data || {}
  };
};

/**
 * 8. Định dạng cấu trúc gói tin phản hồi thất bại chuẩn (Error Response Standard)
 * @param {string} code - Mã lỗi định danh hệ thống (Ví dụ: VALIDATION_ERROR)
 * @param {string} message - Nội dung giải nghĩa chi tiết nguyên nhân gây lỗi
 * @param {any} [details=null] - Tập hợp dữ liệu đính kèm làm rõ lỗi động phục vụ UI Flutter
 * @returns {Object} Cấu trúc gói tin JSON lỗi hợp lệ theo API_CONTRACT.md
 */
export const formatErrorResponse = (code, message, details = null) => {
  return {
    success: false,
    error: {
      code: code || "INTERNAL_SERVER_ERROR",
      message: message || "Lỗi hệ thống hoặc lỗi xử lý cơ sở dữ liệu",
      details: details
    }
  };
};

/**
 * 9. Định dạng cấu trúc ngày
 * @param {string} dateString - Ngày nhập vào
 * @returns {Object} Ngày được fomat
 */
// src/utils/date.js

export const parseDateFlexible = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  // ISO 8601
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // dd/MM/yyyy
  const vnMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (vnMatch) {
    const [, dayStr, monthStr, yearStr] = vnMatch;

    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    const date = new Date(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999
    );

    // Validate ngày thực tế
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  return null;
};