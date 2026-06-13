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