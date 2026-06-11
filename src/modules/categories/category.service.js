/**
 * @file category.service.js
 * @description Xử lý nghiệp vụ logic thao tác dữ liệu Thể loại, phân trang, và chốt chặn liên thông dữ liệu.
 */

import Category from "./category.model.js";
import mongoose from "mongoose";
import { AppError } from "../../utils/appError.js";

/**
 * Nghiệp vụ tạo mới thể loại truyện
 */
export const createCategory = async ({ name }) => {
  // 1. Kiểm tra trùng lặp tên thể loại (name)
  const isNameExist = await Category.exists({ name });
  if (isNameExist) {
    throw new AppError("VALIDATION_ERROR", "Tên thể loại này đã tồn tại trên hệ thống", 400);
  }

  // 2. Logic tự động tính toán số zindex tiếp theo (Auto-increment)
  // Tìm thể loại có zindex lớn nhất hiện tại bằng cách sắp xếp giảm dần và lấy 1 bản ghi
  const highestCategory = await Category.findOne({}, { zindex: 1 })
    .sort({ zindex: -1 })
    .lean();

  // Nếu đã có dữ liệu thì lấy zindex lớn nhất + 1, nếu chưa có (bảng rỗng) thì mặc định là 1
  const nextZindex = highestCategory && highestCategory.zindex !== undefined 
    ? highestCategory.zindex + 1 
    : 1;

  // 3. Tiến hành khởi tạo và lưu trữ vào Database
  return await Category.create({ name, zindex: nextZindex });
};

/**
 * Nghiệp vụ lấy danh sách thể loại kết hợp tìm kiếm và phân trang
 */
export const getCategories = async ({ page = 1, limit = 10, keyword = "" }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const queryConditions = {};
  if (keyword) {
    queryConditions.name = { $regex: keyword, $options: "i" };
  }

  // Thực hiện truy vấn đồng thời tối ưu hóa thời gian phản hồi
  const [items, totalDocs] = await Promise.all([
    Category.find(queryConditions)
      .sort({ zindex: 1, createdAt: -1 }) // Quy ước sắp xếp: zindex tăng dần, cũ hơn xếp sau
      .skip(skip)
      .limit(parsedLimit),
    Category.countDocuments(queryConditions)
  ]);

  return {
    items,
    pagination: {
      totalDocs,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalDocs / parsedLimit)
    }
  };
};
/**
 * Nghiệp vụ lấy tất cả danh sách thể loại kết hợp tìm kiếm và phân trang
 */
export const getAllCategories = async ({ page = 1, limit = 10, keyword = "" }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const queryConditions = { isHidden: false };
  if (keyword) {
    queryConditions.name = { $regex: keyword, $options: "i" };
  }

  // Thực hiện truy vấn đồng thời tối ưu hóa thời gian phản hồi
  const [items, totalDocs] = await Promise.all([
    Category.find(queryConditions)
      .sort({ zindex: 1, createdAt: -1 }) // Quy ước sắp xếp: zindex tăng dần, cũ hơn xếp sau
      .skip(skip)
      .limit(parsedLimit),
    Category.countDocuments(queryConditions)
  ]);

  return {
    items,
    pagination: {
      totalDocs,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalDocs / parsedLimit)
    }
  };
};

/**
 * Nghiệp vụ lấy chi tiết một thể loại theo ID
 */
export const getCategoryById = async (id) => {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Tham số định danh id là bắt buộc", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("CATEGORY_NOT_FOUND", "Không tìm thấy thể loại yêu cầu", 404);
  }

  return category;
};

/**
 * Nghiệp vụ cập nhật tên thể loại truyện
 */
export const updateCategoryName = async (id, name) => {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Thiếu tham số query id để thực hiện cập nhật tên", 400);
  }
  if (!name || !name.trim()) {
    throw new AppError("VALIDATION_ERROR", "Tên thể loại mới không được để trống", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("CATEGORY_NOT_FOUND", "Không tìm thấy thể loại để tiến hành cập nhật", 404);
  }

  // Kiểm tra xem tên mới có bị trùng với danh mục KHÁC hay không
  const isNameExist = await Category.exists({ name: name.trim(), _id: { $ne: id } });
  if (isNameExist) {
    throw new AppError("VALIDATION_ERROR", "Tên thể loại mới đã bị trùng lặp với dữ liệu có sẵn", 400);
  }

  category.name = name.trim();
  return await category.save();
};

/**
 * Nghiệp vụ đổi zindex thể loại truyện
 */
export const swapCategoryZindex = async (id, direction) => {
  if (!id || !["UP", "DOWN"].includes(direction)) {
    throw new AppError("VALIDATION_ERROR", "Tham số đầu vào id hoặc hướng dịch chuyển direction không hợp lệ", 400);
  }

  const currentCategory = await Category.findOne({ _id: id, isHidden: false });
  if (!currentCategory) {
    throw new AppError("CATEGORY_NOT_FOUND", "Không tìm thấy thể loại hiện tại hoặc thể loại đã bị ẩn", 404);
  }

  let targetCategory = null;

  // Thuật toán tìm kiếm thể loại liền kề dựa trên chỉ số zindex xếp tăng dần
  if (direction === "UP") {
    // Khi bấm nút LÊN (Tăng thứ tự ưu tiên): Tìm thằng có zindex nhỏ hơn gần nhất
    targetCategory = await Category.findOne({ zindex: { $lt: currentCategory.zindex }, isHidden: false })
      .sort({ zindex: -1 }); // Lấy thằng sát nút nó nhất bên trái
  } else {
    // Khi bấm nút XUỐNG (Giảm thứ tự ưu tiên): Tìm thằng có zindex lớn hơn gần nhất
    targetCategory = await Category.findOne({ zindex: { $gt: currentCategory.zindex }, isHidden: false })
      .sort({ zindex: 1 }); // Lấy thằng sát nút nó nhất bên phải
  }

  // Nếu không tìm thấy targetCategory nghĩa là nó đã đứng đầu danh sách (khi UP) hoặc cuối danh sách (khi DOWN) -> Giữ nguyên vị trí
  if (!targetCategory) {
    return currentCategory;
  }

  // Thực hiện hoán đổi giá trị zindex (Swap)
  const tempZindex = currentCategory.zindex;
  currentCategory.zindex = targetCategory.zindex;
  targetCategory.zindex = tempZindex;

  // Lưu đồng thời cả 2 thay đổi vào database
  await Promise.all([currentCategory.save(), targetCategory.save()]);

  return currentCategory;
};

/**
 * Nghiệp vụ xóa thể loại truyện kèm kiểm tra chốt chặn toàn vẹn dữ liệu ngoại khóa
 */
export const deleteCategory = async (id) => {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Thiếu tham số query id để thực hiện lệnh xóa", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("CATEGORY_NOT_FOUND", "Không tìm thấy thể loại để thực hiện lệnh xóa", 404);
  }

  // Biến cờ đánh dấu trạng thái danh mục có đang được sách sử dụng hay không
  let isCategoryInUse = false;
  
  const BookModel = mongoose.models.Book;
  if (BookModel) {
    isCategoryInUse = await BookModel.exists({ categories: id });
  }

  if (isCategoryInUse) {
    // KỊCH BẢN A: Có sách đang dùng -> Chuyển trạng thái ẩn (Soft Delete)
    category.isHidden = true;
    await category.save();
    return { action: "HIDDEN" };
  } else {
    // KỊCH BẢN B: Không có sách sử dụng -> Thực hiện xóa hoàn toàn khỏi DB (Hard Delete)
    await Category.findByIdAndDelete(id);
    return { action: "DELETED" };
  }

  return null;
};