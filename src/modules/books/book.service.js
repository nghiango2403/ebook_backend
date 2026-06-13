/**
 * @file book.service.js
 * @description Xử lý logic nghiệp vụ tạo truyện, tự động phân phối Editor/Admin cân bằng và tải ảnh lên Cloudflare R2.
 */

import Book from "./book.model.js";
import BookReviewLog from "./book_review_log.model.js";
import Category from "../categories/category.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../../config/r2.js";
import { AppError } from "../../utils/appError.js";

/**
 * Thuật toán tìm kiếm người kiểm duyệt đang rảnh nhất (ít sách pending nhất)
 * Chiến lược: Ưu tiên Role 'Editor'. Nếu không có ai, tự động hạ cấp dự phòng (Fallback) sang Role 'Admin'.
 * @returns {Promise<String|null>} ID của Editor hoặc Admin thích hợp, hoặc null nếu hệ thống lỗi phân quyền
 */
const findLeastLoadedEditor = async () => {
  // 1. Tìm thông tin Role 'Editor' và 'Admin' từ DB
  const [editorRole, adminRole] = await Promise.all([
    Role.findOne({ name: "Editor" }).lean(),
    Role.findOne({ name: "Admin" }).lean()
  ]);

  let targetRole = editorRole;
  let targetUsers = [];

  // 2. Thử lấy danh sách các User có vai trò là Editor trước
  if (editorRole) {
    targetUsers = await User.find({ roleId: editorRole._id }, "_id").lean();
  }

  // 3. CƠ CHẾ DỰ PHÒNG: Nếu hoàn toàn không có Editor nào, chuyển mục tiêu sang quét nhóm Admin
  if (targetUsers.length === 0 && adminRole) {
    targetRole = adminRole;
    targetUsers = await User.find({ roleId: adminRole._id }, "_id").lean();
  }

  // Nếu hệ thống trống cả Editor lẫn Admin
  if (targetUsers.length === 0) return null;

  const targetUserIds = targetUsers.map(u => u._id);

  // 4. Đếm số sách có trạng thái 'pending' hiện tại của từng người trong nhóm mục tiêu
  const bookCounts = await Book.aggregate([
    {
      $match: {
        editorId: { $in: targetUserIds },
        reviewStatus: "pending"
      }
    },
    {
      $group: {
        _id: "$editorId",
        pendingCount: { $sum: 1 }
      }
    }
  ]);

  // Map lại kết quả đếm để dễ tra cứu (UserId -> số lượng sách đang phụ trách)
  const countMap = new Map(bookCounts.map(item => [item._id.toString(), item.pendingCount]));

  // 5. Tìm kiếm người có lượng sách pending nhỏ nhất trong nhóm
  let selectedUserId = targetUserIds[0];
  let minPending = countMap.get(targetUserIds[0].toString()) || 0;

  for (const id of targetUserIds) {
    const currentPending = countMap.get(id.toString()) || 0;
    if (currentPending < minPending) {
      minPending = currentPending;
      selectedUserId = id;
    }
  }

  return selectedUserId;
};

/**
 * Nghiệp vụ tạo truyện mới hoàn chỉnh kết hợp Thuật toán Load Balancing nâng cao (Editor / Fallback Admin)
 */
export const createBook = async ({ title, summary, categoryId, file, userId }) => {
  // RULE 1: Kiểm tra thực thể Thể loại có tồn tại trên hệ thống
  const isCategoryExist = await Category.findById(categoryId);
  if (!isCategoryExist) {
    throw new AppError("CATEGORY_NOT_FOUND", "Không tìm thấy thể loại", 404);
  }

  // THUẬT TOÁN ĐIỀU PHỐI: Tự động tìm Editor rảnh nhất, hoặc Admin rảnh nhất nếu hệ thống chưa có Editor
  const assignedEditorId = await findLeastLoadedEditor();

  // RULE 2: Xử lý đóng gói và tải trực tiếp tệp tin nhị phân lên Cloudflare R2
  const fileExtension = file.originalname.split(".").pop();
  const r2FileName = `books/${userId}-${Date.now()}.${fileExtension}`;

  try {
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2FileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await r2Client.send(uploadCommand);
  } catch (r2Error) {
    throw new AppError("UPLOAD_IMAGE_FAILED", "Tải ảnh bìa lên hệ thống lưu trữ Cloudflare R2 thất bại", 500);
  }

  const coverImageUrl = `${process.env.R2_PUBLIC_DOMAIN}/${r2FileName}`;

  // RULE 4 & 5: Tiến hành tạo bản ghi Book mới
  const newBook = await Book.create({
    title,
    summary,
    coverImage: coverImageUrl,
    categoryId,
    creatorId: userId,
    status: "pending",
    reviewStatus: "pending",
    isBan: false,
    views: 0,
    editorId: assignedEditorId // Sẽ nhận ID của Editor rảnh nhất HOẶC Admin rảnh nhất
  });

  // RULE 6: Khởi tạo bản ghi dữ liệu lịch sử nhật ký kiểm duyệt đầu tiên (Audit Log)
  await BookReviewLog.create({
    bookId: newBook._id,
    editorId: assignedEditorId || userId, // Dự phòng tối đa: nếu gán lỗi, dùng chính userId người tạo sách
    reviewStatus: "pending",
    note: "",
    reviewCount: 1
  });

  return newBook;
};

/**
 * [TASK 21] - Nghiệp vụ Chỉnh sửa thông tin truyện nâng cao
 */
export const updateBook = async ({ id, payload, file, currentUser }) => {
  const { userId, roleName } = currentUser;

  // 1. Kiểm tra thực thể Book phải tồn tại trong cơ sở dữ liệu
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "Không tìm thấy truyện", 404);
  }
  console.log(currentUser)
  // 2. Chốt chặn bảo mật - Kiểm tra ma trận quyền sở hữu
  let hasPermission = false;
  if (roleName === "Admin") {
    hasPermission = true;
  } else if (roleName === "Creator" && book.creatorId.toString() === userId) {
    hasPermission = true;
  } else if (roleName === "Editor" && book.editorId?.toString() === userId) {
    hasPermission = true;
  }

  if (!hasPermission) {
    throw new AppError("PERMISSION_DENIED", "Bạn không có quyền chỉnh sửa truyện này", 403);
  }

  // Chống giả mạo payload hệ thống
  delete payload.creatorId;
  delete payload.reviewStatus;
  delete payload.editorId;
  delete payload.views;
  delete payload.isBan;

  // 3. Kiểm tra sự tồn tại của danh mục Category mới nếu client gửi lên
  if (payload.categoryId) {
    const isCategoryExist = await Category.findById(payload.categoryId);
    if (!isCategoryExist) {
      throw new AppError("CATEGORY_NOT_FOUND", "Không tìm thấy thể loại", 404);
    }
  }

  // Khởi tạo Object chứa các dữ liệu thực sự thay đổi so với bản gốc
  const updateDraft = {};
  if (payload.title !== undefined && payload.title !== book.title) updateDraft.title = payload.title;
  if (payload.summary !== undefined && payload.summary !== book.summary) updateDraft.summary = payload.summary;
  if (payload.status !== undefined && payload.status !== book.status) {
    const validStatuses = ["pending", "completed", "pause"];
    if (validStatuses.includes(payload.status)) {
      updateDraft.status = payload.status;
    } else {
      throw new Error(`Trạng thái không hợp lệ: ${payload.status}`);
    }
  }
  if (payload.categoryId !== undefined && payload.categoryId.toString() !== book.categoryId.toString()) {
    updateDraft.categoryId = payload.categoryId;
  }

  // 4. Xử lý upload ảnh bìa mới lên Cloudflare R2
  if (file) {
    const fileExtension = file.originalname.split(".").pop();
    const r2FileName = `books/${userId}-${Date.now()}.${fileExtension}`;

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2FileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await r2Client.send(uploadCommand);
      updateDraft.coverImage = `${process.env.R2_PUBLIC_URL}/${r2FileName}`;
    } catch (r2Error) {
      throw new AppError("UPLOAD_IMAGE_FAILED", "Tải ảnh mới lên hệ thống lưu trữ Cloudflare R2 thất bại", 500);
    }
  }

  // Nếu không có bất kỳ trường nào thay đổi hoặc không có ảnh mới, không cần xử lý tiếp
  if (Object.keys(updateDraft).length === 0) {
    return book;
  }

  // 5. CHUYỂN ĐỔI BIẾN ĐỘNG: Đóng gói toàn bộ bản nháp sửa đổi thành chuỗi JSON đưa vào trường note
  const logNotePayload = {
    type: "EDIT_REQUEST",
    draftData: updateDraft,
    userReason: "User updated book details"
  };

  // 6. Truy vết số thứ tự phiên kiểm duyệt trước đó để tăng tiến
  const lastLog = await BookReviewLog.findOne({ bookId: id }).sort({ createdAt: -1 }).lean();
  const previousReviewCount = lastLog ? lastLog.reviewCount : 0;

  // 7. Tạo bản ghi BookReviewLog chứa dữ liệu sửa đổi tạm thời
  await BookReviewLog.create({
    bookId: book._id,
    editorId: userId,
    reviewStatus: "pending",
    note: JSON.stringify(logNotePayload), // Lưu vết JSON string
    reviewCount: previousReviewCount + 1
  });


  return null;
};