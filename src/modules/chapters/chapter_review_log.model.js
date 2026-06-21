/**
 * @file chapter_review_log.model.js
 * @description Định nghĩa Schema lưu vết lịch sử toàn bộ vòng đời kiểm duyệt của các chương truyện.
 */

import mongoose from "mongoose";

const chapterReviewLogSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true
    },
    bookId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true
    },
    editorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true
    },
    note: {
      type: String,
      default: ""
    },
    reviewCount: {
      type: Number,
      required: true,
      default: 1
    },
    action: {
      type: String,
      enum: ["create", "update", "approve", "reject", "hidden"],
      required: true
    }
  },
  {
    collection: "chapter_review_logs",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false
  }
);

// Tạo Compound Index hỗ trợ API lấy lịch sử duyệt chương sắp xếp theo thời gian
chapterReviewLogSchema.index({ editorId: 1, reviewStatus: 1, bookId: 1 });

const ChapterReviewLog = mongoose.model("ChapterReviewLog", chapterReviewLogSchema);
export default ChapterReviewLog;