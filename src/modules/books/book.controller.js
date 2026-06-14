/**
 * @file book.controller.js
 * @description Tiếp nhận request, kiểm tra định dạng dữ liệu thô và phân phối xử lý cho tầng Service.
 */

import * as bookService from "./book.service.js";
import { formatSuccessResponse } from "../../utils/helpers.js";
import { AppError } from "../../utils/appError.js";
import mongoose from "mongoose";

export const handleCreateBook = async (req, res, next) => {
  try {
    const { title, summary, categoryId } = req.body;
    const file = req.file;
    const userId = req.user?.userId; // Lấy ID người tạo từ middleware xác thực

    // 1. Kiểm tra sự tồn tại của file coverImage bắt buộc
    if (!file) {
      throw new AppError("VALIDATION_ERROR", "Ảnh bìa truyện (coverImage) là bắt buộc", 400);
    }

    // 2. Kiểm tra dữ liệu bắt buộc đầu vào (Validation Rules)
    if (!title || !title.trim()) {
      throw new AppError("VALIDATION_ERROR", "Tiêu đề truyện (title) không được để trống", 400);
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 255) {
      throw new AppError("VALIDATION_ERROR", "Tiêu đề truyện phải có độ dài từ 2 đến 255 ký tự", 400);
    }

    if (!categoryId) {
      throw new AppError("VALIDATION_ERROR", "Mã thể loại truyện (categoryId) là bắt buộc", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("VALIDATION_ERROR", "Mã thể loại truyện (categoryId) không đúng định dạng ObjectId", 400);
    }

    // 3. Gọi tầng nghiệp vụ Service để xử lý lõi (Không truy vấn DB hay gọi req/res tại đây)
    const result = await bookService.createBook({
      title: trimmedTitle,
      summary: summary || "",
      categoryId,
      file,
      userId,
    });

    // 4. Định dạng dữ liệu và phản hồi thành công về phía ứng dụng Flutter
    return res.status(201).json(
      formatSuccessResponse("Tạo truyện thành công", { book: result })
    );
  } catch (error) {
    return next(error);
  }
};


export const handleUpdateBook = async (req, res, next) => {
  try {
    const { id } = req.query; // BẮT BUỘC: Sử dụng req.query.id theo yêu cầu đề bài
    const { title, summary, categoryId, status } = req.body;
    const file = req.file;

    // 1. Kiểm tra Validation cho ID truyện bắt buộc
    if (!id) {
      throw new AppError("VALIDATION_ERROR", "Mã truyện (id) truyền lên URL query là bắt buộc", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("VALIDATION_ERROR", "Mã truyện (id) không đúng định dạng ObjectId", 400);
    }

    // 2. Kiểm tra Validation tùy chọn cho các trường dữ liệu nếu client gửi lên
    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new AppError("VALIDATION_ERROR", "Tiêu đề truyện không được để trống", 400);
      }
      if (trimmedTitle.length < 2 || trimmedTitle.length > 255) {
        throw new AppError("VALIDATION_ERROR", "Tiêu đề truyện phải từ 2 đến 255 ký tự", 400);
      }
      req.body.title = trimmedTitle; // Cập nhật lại giá trị đã trim sạch
    }

    if(!status) {
      throw new AppError("VALIDATION_ERROR", "Trạng thái truyện không được để trống", 400)
    }

    if (categoryId !== undefined && !mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("VALIDATION_ERROR", "Mã thể loại truyện (categoryId) không đúng định dạng ObjectId", 400);
    }

    // Đóng gói thông tin tài khoản người dùng từ token xác thực
    const currentUser = {
      userId: req.user?.userId,
      roleName: req.user?.roleId.name 
    };

    // 3. Đẩy toàn bộ dữ liệu xuống tầng Service (Không query DB hay gọi req/res tại đây)
    const updatedBook = await bookService.updateBook({
      id,
      payload: { title: req.body.title, summary, categoryId, status },
      file,
      currentUser
    });

    // 4. Trả về cấu trúc phản hồi chuẩn hóa formatSuccessResponse theo API_CONTRACT.md
    return res.status(200).json(
      formatSuccessResponse("Cập nhật truyện thành công", { book: updatedBook })
    );
  } catch (error) {
    return next(error);
  }
};


export const handleGetReviewQueue = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { keyword } = req.query;

    const result = await bookService.getReviewQueue({ page, limit, keyword });
    
    return res.status(200).json(formatSuccessResponse("Lấy hàng đợi duyệt thành công", result));
  } catch (error) {
    return next(error);
  }
};


export const handleGetReviewDetail = async (req, res, next) => {
  try {
    const { id } = req.query; // BẮT BUỘC: Sử dụng req.query.id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("VALIDATION_ERROR", "Mã truyện (id) không hợp lệ hoặc thiếu", 400);
    }

    const result = await bookService.getReviewDetail(id);
    return res.status(200).json(formatSuccessResponse("Lấy chi tiết truyện cần duyệt thành công", result));
  } catch (error) {
    return next(error);
  }
};


export const handleApproveBook = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { note } = req.body;
    const currentUser = {
      userId: req.user?.userId,
      roleName: req.user?.roleId.name 
    };

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("VALIDATION_ERROR", "Mã duyệt sách (id) không hợp lệ hoặc thiếu", 400);
    }

    const updatedBook = await bookService.approveBook({ id, note: note || "Duyệt", currentUser });
    return res.status(200).json(formatSuccessResponse("Duyệt truyện thành công", { book: updatedBook }));
  } catch (error) {
    return next(error);
  }
};


export const handleRejectBook = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { note } = req.body;
    const currentUser = {
      userId: req.user?.userId,
      roleName: req.user?.roleId.name 
    };

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("VALIDATION_ERROR", "Mã truyện (id) không hợp lệ hoặc thiếu", 400);
    }
    // Validation: note bắt buộc khi reject
    if (!note || !note.trim()) {
      throw new AppError("VALIDATION_ERROR", "Lý do từ chối duyệt (note) là bắt buộc", 400);
    }

    const updatedBook = await bookService.rejectBook({ id, note: note.trim(), currentUser });
    return res.status(200).json(formatSuccessResponse("Từ chối duyệt truyện thành công", { book: updatedBook }));
  } catch (error) {
    return next(error);
  }
};


export const handleBanBook = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { note } = req.body;
    const userId = req.user?.userId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("VALIDATION_ERROR", "Mã truyện (id) không hợp lệ", 400);
    }
    if (!note || !note.trim()) {
      throw new AppError("VALIDATION_ERROR", "Lý do khóa truyện (note) là bắt buộc", 400);
    }

    const updatedBook = await bookService.banBook({ id, note: note.trim(), userId });
    return res.status(200).json(formatSuccessResponse("Khóa truyện thành công", { book: updatedBook }));
  } catch (error) {
    return next(error);
  }
};


export const handleUnbanBook = async (req, res, next) => {
  try {
    const { id } = req.query;
    const userId = req.user?.userId;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("VALIDATION_ERROR", "Mã truyện (id) không hợp lệ", 400);
    }

    const updatedBook = await bookService.unbanBook(id, userId);
    return res.status(200).json(formatSuccessResponse("Mở khóa truyện thành công", { book: updatedBook }));
  } catch (error) {
    return next(error);
  }
};