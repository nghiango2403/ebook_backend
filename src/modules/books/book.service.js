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

/**
 * Lấy danh sách truyện trong hàng đợi duyệt
 */
export const getReviewQueue = async ({ page, limit, keyword }) => {
  const skip = (page - 1) * limit;

  let reviewStatus = "pending"

  // 1. Khởi tạo Object điều kiện lọc cho bảng BookReviewLog
  const logQuery = { reviewStatus };

  // 2. Nếu có từ khóa tìm kiếm (keyword), ta cần tìm các bookId thỏa mãn title trước
  if (keyword) {
    const matchingBooks = await Book.find({
      title: { $regex: keyword, $options: "i" }
    }, "_id").lean();

    const matchingBookIds = matchingBooks.map(b => b._id);
    logQuery.bookId = { $in: matchingBookIds };
  }

  // 3. Thực hiện truy vấn chính trên bảng BookReviewLog kết hợp Nested Populate (Lồng nhau)
  const reviewLogs = await BookReviewLog.find(logQuery)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "bookId",
      select: "_id title coverImage status categoryId creatorId",
      populate: [
        {
          path: "creatorId",
          select: "_id username email avatar"
        },
        {
          path: "categoryId",
          select: "name"
        }
      ]
    })
    .lean();

  // 4. Định dạng và chuẩn hóa cấu trúc dữ liệu đầu ra phù hợp với UI Flutter Client
  const mappedItems = reviewLogs
    .filter(log => log.bookId) // Phòng ngừa trường hợp truyện gốc đã bị xóa vật lý khỏi DB
    .map(log => {
      const book = log.bookId;
      const author = book.creatorId;
      const category = book.categoryId;

      // Kiểm tra xem note có chứa chuỗi bản vá dữ liệu JSON (Task 21) hay không để hiển thị thông tin mới nhất ra hàng đợi
      let displayTitle = book.title;
      let displayCoverImage = book.coverImage;

      if (log.note) {
        try {
          const parsedNote = JSON.parse(log.note);
          if (parsedNote.type === "EDIT_REQUEST" && parsedNote.draftData) {
            if (parsedNote.draftData.title) displayTitle = parsedNote.draftData.title;
            if (parsedNote.draftData.coverImage) displayCoverImage = parsedNote.draftData.coverImage;
          }
        } catch (e) {
          // Note dạng chuỗi thuần túy (Luồng tạo mới truyện Task 20), giữ nguyên dữ liệu gốc
        }
      }

      return {
        _id: book._id,                // Trả về ID truyện để phục vụ việc bấm xem chi tiết ở Client
        logId: log._id,              // ID của bản ghi log kiểm duyệt
        title: displayTitle,         // Tên truyện (Đã ưu tiên hiển thị tên mới lưu tạm trong bản nháp)
        coverImage: displayCoverImage, // Ảnh truyện (Đã ưu tiên hiển thị ảnh bìa mới lưu tạm trong bản nháp)
        status: book.status,
        reviewStatus: log.reviewStatus,
        reviewCount: log.reviewCount, // Đưa ra số thứ tự của phiên duyệt/sửa đổi theo yêu cầu bài toán
        createdAt: log.createdAt,    // Thời điểm gửi yêu cầu duyệt
        category: category ? { _id: category._id, name: category.name } : null,
        author: author ? {
          _id: author._id,
          username: author.username,
          email: author.email,
          avatar: author.avatar
        } : null
      };
    });

  const total = await BookReviewLog.countDocuments(logQuery);

  return {
    items: mappedItems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

/**
 * Lấy chi tiết truyện cần duyệt kèm lịch sử review toàn cục
 */
export const getReviewDetail = async (id) => {
  const book = await Book.findById(id)
    .populate({ path: "categoryId", select: "_id name" })
    .populate({ path: "creatorId", select: "_id username email avatar createdAt" })
    .populate({ path: "editorId", select: "_id username email avatar" })
    .lean();

  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "Không tìm thấy truyện cần duyệt", 404);
  }

  // Truy vấn lịch sử đánh giá theo quy tắc Index: Sắp xếp giảm dần theo thời gian tạo
  const reviewLogs = await BookReviewLog.find({ bookId: id })
    .sort({ createdAt: -1 })
    .lean();

  // Mapping cấu trúc trả về tương thích API Contract
  return {
    book: {
      _id: book._id,
      title: book.title,
      summary: book.summary,
      coverImage: book.coverImage,
      status: book.status,
      reviewStatus: book.reviewStatus,
      views: book.views,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      category: book.categoryId,
      author: book.creatorId,
      editor: book.editorId || null
    },
    reviewLogs
  };
};

export const approveBook = async ({ id, note, currentUser }) => {
  const { userId, roleName } = currentUser;
  // 1. Kiểm tra bản ghi BookReviewLog phải tồn tại trong cơ sở dữ liệu
  const currentLog = await BookReviewLog.findById(id);
  if (!currentLog) {
    throw new AppError("REVIEW_LOG_NOT_FOUND", "Không tìm thấy lịch sử phiên kiểm duyệt", 404);
  }

  // Kiểm tra tính hợp lệ của trạng thái log (Tránh việc phê duyệt lại một bản ghi đã xử lý)
  if (currentLog.reviewStatus !== "pending") {
    throw new AppError("BAD_REQUEST", "Phiên kiểm duyệt này đã được xử lý trước đó", 400);
  }

  // 2. CHỐT CHẶN PHÂN QUYỀN: Bắt buộc là Admin hoặc chính Editor được giao phụ trách bản ghi log này
  const isAssignedEditor = currentLog.editorId && currentLog.editorId.toString() === userId;
  const isAdmin = roleName === "Admin";

  if (!isAssignedEditor && !isAdmin) {
    throw new AppError("PERMISSION_DENIED", "Bạn không có quyền duyệt phiên kiểm duyệt này", 403);
  }

  // 3. Kiểm tra thực thể Book liên kết xem có tồn tại hay không
  const book = await Book.findById(currentLog.bookId);
  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "Không tìm thấy truyện liên kết với phiên duyệt này", 404);
  }

  // 4. Khởi tạo cấu trúc cập nhật trạng thái cốt lõi cho Book
  let dataUpdate = {
    reviewStatus: "approved",
  };

  // 5. KIỂM TRA BẢN VÁ DỮ LIỆU (DATA PATCHING): Bóc tách JSON trực tiếp từ bản ghi log hiện tại
  if (currentLog.note) {
    try {
      const parsedNote = JSON.parse(currentLog.note);
      if (parsedNote.type === "EDIT_REQUEST" && parsedNote.draftData) {
        // Đồng bộ đè dữ liệu sửa đổi nháp từ log note vào trực tiếp bảng Book
        dataUpdate = { ...dataUpdate, ...parsedNote.draftData };
      }
    } catch (e) {
      // Trường note là chữ thường thuần túy (Luồng truyện mới tạo), bỏ qua bóc tách JSON
    }
  }
  // 6. Thực hiện cập nhật thay đổi nội dung sang bảng Book
  const updatedBook = await Book.findByIdAndUpdate(
    currentLog.bookId,
    { $set: dataUpdate },
    { returnDocument: 'after', runValidators: true }
  );
  // 7. Cập nhật chính trạng thái của bản ghi BookReviewLog hiện tại từ 'pending' sang 'approved'
  let updatedNoteStr = "";

  try {
    // 1. Nếu currentLog.note có dữ liệu, parse nó ra object. Nếu rỗng "", khởi tạo object mới có cấu trúc mặc định
    const noteObj = currentLog.note ? JSON.parse(currentLog.note) : { type: "CREATE_REQUEST", draftData: {} };

    // 2. Gán giá trị của biến note vào thuộc tính userReason
    noteObj.userReason = note;

    // 3. Chuyển object thành chuỗi JSON để chuẩn bị cập nhật vào Database
    updatedNoteStr = JSON.stringify(noteObj);
  } catch (error) {
    // Phòng trường hợp chuỗi trong DB bị lỗi định dạng JSON
    console.error("Lỗi parse JSON note:", error);
    updatedNoteStr = JSON.stringify({ type: "EDIT_REQUEST", draftData: {}, userReason: note });
  }
  currentLog.note = updatedNoteStr;
  currentLog.reviewStatus = "approved";
  currentLog.editorId = userId; // Đảm bảo lưu đúng ID người thực tế bấm nút duyệt (trong trường hợp Admin duyệt thay)
  await currentLog.save();

  return updatedBook;
};

export const rejectBook = async ({ id, note, currentUser }) => {
  const { userId, roleName } = currentUser;

  // 1. Kiểm tra bản ghi BookReviewLog phải tồn tại trong cơ sở dữ liệu
  const currentLog = await BookReviewLog.findById(id);
  if (!currentLog) {
    throw new AppError("REVIEW_LOG_NOT_FOUND", "Không tìm thấy lịch sử phiên kiểm duyệt", 404);
  }

  // Chặn trường hợp xử lý lại một bản ghi log đã hoàn thành
  if (currentLog.reviewStatus !== "pending") {
    throw new AppError("BAD_REQUEST", "Phiên kiểm duyệt này đã được xử lý trước đó", 400);
  }

  // 2. CHỐT CHẶN PHÂN QUYỀN: Phải là Admin hoặc đúng Editor được phân công chịu trách nhiệm bản ghi log này
  const isAssignedEditor = currentLog.editorId && currentLog.editorId.toString() === userId;
  const isAdmin = roleName === "Admin";

  if (!isAssignedEditor && !isAdmin) {
    throw new AppError("PERMISSION_DENIED", "Bạn không có quyền từ chối phiên kiểm duyệt này", 403);
  }

  // 3. Kiểm tra tính toàn vẹn - Thực thể Book liên kết phải tồn tại
  const book = await Book.findById(currentLog.bookId);
  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "Không tìm thấy truyện liên kết với phiên duyệt này", 404);
  }

  // 4. KIỂM TRA LOẠI YÊU CẦU ĐỂ ĐIỀU HƯỚNG TRẠNG THÁI BẢNG BOOK CHÍNH XÁC
  let isEditRequest = false;
  if (currentLog.note) {
    try {
      const parsedNote = JSON.parse(currentLog.note);
      if (parsedNote.type === "EDIT_REQUEST") {
        isEditRequest = true; // Đây là yêu cầu sửa đổi nội dung từ Task 21
      }
    } catch (e) {
      // Note là text thuần -> Đây là yêu cầu duyệt truyện mới tạo (Task 20)
    }
  }

  // 5. CẬP NHẬT TRẠNG THÁI BẢNG BOOK (Có chọn lọc)
  if (!isEditRequest) {
    // Nếu từ chối một cuốn truyện mới tạo (Task 20), ta đưa reviewStatus của Book về 'rejected'
    await Book.findByIdAndUpdate(currentLog.bookId, {
      $set: { 
        reviewStatus: "rejected",
        editorId: userId // Ghi nhận editor/admin thực tế xử lý từ chối
      }
    });
  }

  // 6. CẬP NHẬT TRỰC TIẾP TRÊN BẢN GHI BOOKREVIEWLOG HIỆN TẠI
  currentLog.reviewStatus = "rejected";
  currentLog.note = note; // Ghi nhận lý do từ chối cụ thể (ví dụ: "Ảnh bìa nhạy cảm", "Sai chính tả")
  currentLog.editorId = userId; // Ghi nhận ID người thực tế thao tác bấm nút (Phòng trường hợp Admin duyệt thay)
  
  await currentLog.save();

  // 7. Lấy lại dữ liệu truyện sau khi xử lý để trả về đồng bộ với API Contract
  const updatedBook = await Book.findById(currentLog.bookId);
  return updatedBook;
};

/**
 * Ban Book - Khóa truyện vi phạm chính sách hệ thống
 */
export const banBook = async ({ id, note, userId }) => {
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "Không tìm thấy truyện", 404);
  }

  if (book.isBan) {
    throw new AppError("BOOK_ALREADY_BANNED", "Truyện này đã bị khóa từ trước đó", 400);
  }

  const lastLog = await BookReviewLog.findOne({ bookId: id }).sort({ createdAt: -1 }).lean();
  const previousReviewCount = lastLog ? lastLog.reviewCount : 0;

  // Thực hiện đồng thời hạ trạng thái hiển thị và cắm cờ khóa
  const updatedBook = await Book.findByIdAndUpdate(
    id,
    { $set: { isBan: true } },
    { returnDocument: "after" }
  );

  // Lưu vết lịch sử khóa của Admin vào Log
  await BookReviewLog.create({
    bookId: id,
    editorId: userId,
    reviewStatus: "rejected",
    note: `[BAN REASON]: ${note}`,
    reviewCount: previousReviewCount + 1
  });

  return updatedBook;
};

/**
 * Unban Book - Mở khóa truyện
 */
export const unbanBook = async (id, userId) => {
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError("BOOK_NOT_FOUND", "Không tìm thấy truyện", 404);
  }

  if (!book.isBan) {
    throw new AppError("BOOK_ALREADY_UNBANNED", "Truyện này đã mở khóa từ trước đó", 400);
  }

  // 1. Cập nhật trạng thái truyện bằng Atomic Update
  const updatedBook = await Book.findByIdAndUpdate(
    id,
    { $set: { isBan: false, status: "approved" } },
    { returnDocument: "after" }
  );

  // 2. Tìm log reject gần nhất để lấy reviewCount hiện tại
  const lastLog = await BookReviewLog.findOne({ bookId: id }).sort({ createdAt: -1 });
  const currentReviewCount = lastLog ? lastLog.reviewCount : 0;

  // 3. Ghi log mới ghi nhận việc UNBAN 
  await BookReviewLog.create({
    bookId: id,
    editorId: userId,
    reviewStatus: "approved",
    note: "[UNBAN]: Truyện đã được mở khóa bởi Admin",
    reviewCount: currentReviewCount + 1
  });

  return updatedBook;
};