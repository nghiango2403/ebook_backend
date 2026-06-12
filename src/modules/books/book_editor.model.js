/**
 * @file book_editor.model.js
 * @description Định nghĩa Mongoose Schema và Model cho thực thể trung gian Book_Editor.
 * Thiết lập mối quan hệ nhiều-nhiều (Many-to-Many) giữa Book và Biên tập viên (User).
 */

import mongoose from "mongoose";

const BookEditorSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    editorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    collection: "book_editors",
    versionKey: false,
    timestamps: false // Khai báo tắt toán bộ bộ đếm thời gian theo đúng đặc tả bản thiết kế
  }
);

// CHIẾN LƯỢC KHỞI TẠO CHỈ MỤC (INDEX RULES)
// Thiết lập Compound Index Unique chặn đứng hành vi gán trùng lặp Biên tập viên vào cùng một đầu truyện
BookEditorSchema.index({ bookId: 1, editorId: 1 }, { unique: true });

const BookEditor = mongoose.models.BookEditor || mongoose.model("BookEditor", BookEditorSchema);

export default BookEditor;