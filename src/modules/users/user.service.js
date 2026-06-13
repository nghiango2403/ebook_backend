/**
 * @file user.service.js
 * @description Tầng xử lý logic nghiệp vụ quản trị người dùng, khóa tài khoản và phân trang dữ liệu.
 */

import User from "./user.model.js";
import Role from "../roles/role.model.js";
import { AppError } from "../../utils/appError.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../../config/r2.js";

/**
 * Hàm tiện ích lọc sạch thông tin nhạy cảm (password) trước khi trả về dữ liệu cho Client
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};

/**
 * Nghiệp vụ tra cứu danh sách người dùng hoặc chi tiết dựa vào tham số query id
 */
export const getUsersOrById = async ({ id, page = 1, limit = 10, keyword = "" }) => {
  // Luồng 1: Lấy chi tiết người dùng nếu có tham số id (?id=...)
  if (id) {
    const user = await User.findById(id).populate({ path: "roleId", select: "_id name description" });
    if (!user) {
      throw new AppError("USER_NOT_FOUND", "Không tìm thấy thông tin tài khoản người dùng yêu cầu", 404);
    }
    return sanitizeUser(user);
  }
  // Luồng 2: Lấy danh sách kết hợp phân trang và lọc từ khóa (?page=&limit=&keyword=)
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const queryConditions = {};
  if (keyword) {
    queryConditions.$or = [
      { username: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } }
    ];
  }

  const [users, totalDocs] = await Promise.all([
    User.find(queryConditions)
      .populate({ path: "roleId", select: "_id name description" })
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 }),
    User.countDocuments(queryConditions)
  ]);

  return {
    users: users.map(user => sanitizeUser(user)),
    pagination: {
      totalDocs,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalDocs / parsedLimit)
    }
  };
};

/**
 * Nghiệp vụ lấy thông tin trang cá nhân hiện tại
 */
export const getCurrentProfile = async (userId) => {
  const user = await User.findById(userId).populate({ path: "roleId", select: "_id name description" });
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "Tài khoản người dùng hiện tại không tồn tại trên hệ thống", 404);
  }
  return sanitizeUser(user);
};

/**
 * Nghiệp vụ cập nhật vai trò (Role) cho User - Chặn Admin tự hạ quyền chính mình
 */
export const updateUserRole = async ({ currentAdminId, targetUserId, newRoleId }) => {
  // Chốt chặn Business Rule: Không cho phép Admin tự thay đổi quyền hạn của chính mình
  // if (String(currentAdminId) === String(targetUserId)) {
  //   throw new AppError("FORBIDDEN_ACTION", "Hành vi bị từ chối: Quản trị viên không được tự hạ quyền hoặc thay đổi vai trò của chính mình", 403);
  // }

  // Kiểm tra tính hợp lệ của vai trò mới
  const isRoleExist = await Role.exists({ _id: newRoleId });
  if (!isRoleExist) {
    throw new AppError("ROLE_NOT_FOUND", "Vai trò (Role) chỉ định gán mới không tồn tại trên hệ thống", 404);
  }

  const updatedUser = await User.findByIdAndUpdate(
    targetUserId,
    { roleId: newRoleId },
    { new: true }
  ).populate({ path: "roleId", select: "_id name description" });

  if (!updatedUser) {
    throw new AppError("USER_NOT_FOUND", "Không tìm thấy người dùng để thực hiện thay đổi vai trò", 404);
  }

  return sanitizeUser(updatedUser);
};

/**
 * Nghiệp vụ Khóa / Mở khóa tài khoản người dùng
 */
export const updateUserBanStatus = async ({ targetUserId, timeBan }) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "Không tìm thấy người dùng để thực hiện thay đổi trạng thái khóa", 404);
  }

  user.timeBan = timeBan;
  await user.save();

  // Nạp lại dữ liệu quan hệ roleId đầy đủ trước khi trả về
  const populatedUser = await User.findById(targetUserId).populate({ path: "roleId", select: "_id name description" });
  return sanitizeUser(populatedUser);
};

/**
 * Nghiệp vụ Cập nhật thông tin hồ sơ cá nhân (Chỉ cho phép sửa username)
 * @param {string} userId - ID người dùng hiện tại từ Token
 * @param {Object} updateData - Dữ liệu cập nhật từ Client
 */
export const updateCurrentProfile = async (userId, { username }) => {
  if (!username) {
    throw new AppError("VALIDATION_ERROR", "Tên người dùng (username) không được để trống", 400);
  }

  // Kiểm tra trùng lặp username với tài khoản khác
  const isUsernameExist = await User.exists({ username, _id: { $ne: userId } });
  if (isUsernameExist) {
    throw new AppError("VALIDATION_ERROR", "Tên người dùng này đã được sử dụng", 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { username },
    { returnDocument: "after", runValidators: true }
  ).populate({ path: "roleId", select: "_id name description" });

  if (!updatedUser) {
    throw new AppError("USER_NOT_FOUND", "Tài khoản người dùng không tồn tại", 404);
  }

  return sanitizeUser(updatedUser);
};

/**
 * Nghiệp vụ Cập nhật ảnh đại diện người dùng
 * @param {string} userId - ID người dùng hiện tại từ Token
 * @param {string} avatarUrl - Đường dẫn URL ảnh đại diện mới
 */
export const updateCurrentUserAvatar = async (userId, file) => {
  if (!file) {
    throw new AppError("VALIDATION_ERROR", "Không tìm thấy dữ liệu tệp tin hình ảnh tải lên", 400);
  }

  const fileExtension = file.originalname.split(".").pop();
  const r2FileName = `avatars/${userId}-${Date.now()}.${fileExtension}`;
  
  try {
    // 2. Thiết lập Command đẩy dữ liệu thô (Buffer) từ RAM lên Cloudflare R2 Bucket
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2FileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await r2Client.send(uploadCommand);

    // 3. Khởi tạo đường dẫn URL CDN công khai trỏ trực tiếp đến tệp tin vừa upload
    // Định dạng: https://<pub-domain-or-subdomain>/avatars/userId-timestamp.png
    const publicAvatarUrl = `${process.env.R2_PUBLIC_DOMAIN}/${r2FileName}`;

    // 4. Ghi nhận URL ảnh mới vào Database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: publicAvatarUrl },
      { returnDocument: "after" }
    ).populate({ path: "roleId", select: "_id name description" });
    if (!updatedUser) {
      throw new AppError("USER_NOT_FOUND", "Tài khoản người dùng không tồn tại trên hệ thống", 404);
    }

    return sanitizeUser(updatedUser);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("STORAGE_ERROR", `Lỗi kết nối bộ lưu trữ Cloudflare R2: ${error.message}`, 500);
  }
};

/**
 * Nghiệp vụ cập nhật hoặc ghi đè FCM Token mới cho người dùng hiện tại
 * @param {string} userId - ID của người dùng từ Token xác thực
 * @param {string} fcmToken - Chuỗi định danh thiết bị mới nhận từ Flutter Client
 */
export const updateFcmToken = async (userId, fcmToken) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "Người dùng không tồn tại trên hệ thống", 404);
  }

  // Ghi đè token mới (mỗi user chỉ giữ một token của thiết bị hoạt động gần nhất)
  user.fcmToken = fcmToken;
  await user.save();
  
  return null;
};

/**
 * Nghiệp vụ xóa hoàn toàn FCM Token (đưa về null) khi người dùng tiến hành đăng xuất
 * @param {string} userId - ID của người dùng từ Token xác thực
 */
export const removeFcmToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "Người dùng không tồn tại trên hệ thống", 404);
  }

  user.fcmToken = null;
  await user.save();
  
  return null;
};