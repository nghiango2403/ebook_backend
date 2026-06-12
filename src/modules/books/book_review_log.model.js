/**
 * @file book_review_log.model.js
 * @description Lưu lịch sử (Audit Log) các phiên duyệt Sách (Book) của Editor.
 * Hỗ trợ tra cứu nhanh lịch sử theo bookId, hiệu suất làm việc theo editorId và bộ lọc trạng thái.
 */
import mongoose from "mongoose";

const BookReviewLogSchema = new mongoose.Schema(
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
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true
    },
    note: {
      type: String,
      default: ""
    }, // Lý do duyệt đạt hoặc từ chối (rất quan trọng cho phần log)
    reviewCount: {
      type: Number,
      required: true
    }, // Số thứ tự của phiên duyệt (ví dụ: Duyệt lần 1, lần 2, lần 3...)
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "book_review_logs",
    versionKey: false,
    timestamps: false
  }
);

// CHIẾN LƯỢC KHỞI TẠO CHỈ MỤC TỐI ƯU (ĐÃ TÍNH TOÁN QUY TẮC ESR & SORT)

// 1. Tối ưu truy vấn: Lấy lịch sử các lần duyệt của một cuốn sách (Sắp xếp từ mới nhất đến cũ nhất)
BookReviewLogSchema.index({ bookId: 1, createdAt: -1 });

// 2. Tối ưu truy vấn: Lọc theo Editor, hoặc nhóm (Editor + Trạng thái) và luôn đẩy Log mới nhất lên đầu
BookReviewLogSchema.index({ editorId: 1, reviewStatus: 1, createdAt: -1 });

const BookReviewLog = mongoose.models.BookReviewLog || mongoose.model("BookReviewLog", BookReviewLogSchema);

export default BookReviewLog;