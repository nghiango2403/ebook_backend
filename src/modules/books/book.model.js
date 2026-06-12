/**
 * @file book.model.js
 * @description Định nghĩa Mongoose Schema và Model cho thực thể Book (Sách/Truyện).
 * Tuân thủ chính xác thuộc tính, kiểu dữ liệu và cấu trúc chỉ mục được đặc tả tại ENTITY.md.
 */

import mongoose from "mongoose";

const BookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        summary: {
            type: String,
            default: ""
        },
        coverImage: {
            type: String,
            default: ""
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "completed", "pause"],
            default: "pending"
        },
        isBan: {
            type: Boolean,
            default: false
        },
        views: {
            type: Number,
            default: 0
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reviewStatus: {
            type: String, 
            enum: ["pending", "approved", "rejected"], 
            default: "pending"
        },
        editorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

    },
    {
        collection: "books",
        versionKey: false,
        timestamps: true
    }
);

// CHIẾN LƯỢC KHỞI TẠO CHỈ MỤC (INDEX RULES) TỐI ƯU HÓA TRUY VẤN
// 1. Text Index phục vụ tính năng tìm kiếm nâng cao theo từ khóa (Full-Text Search)
BookSchema.index({ title: "text" });

// 2. Single Field Indexes tối ưu hóa bộ lọc độc lập và các lệnh populate liên kết
BookSchema.index({ categoryId: 1 });
BookSchema.index({ status: 1 });
BookSchema.index({ creatorId: 1 });

// 3. Compound Index (Chỉ mục kép) tối ưu hóa truy vấn lọc kết hợp của Độc giả và Admin công khai
// (Ví dụ: Tìm truyện thuộc Thể loại X, trạng thái đã Hoàn thành và Không bị khóa)
BookSchema.index({ categoryId: 1, status: 1, isBan: 1 });

const Book = mongoose.models.Book || mongoose.model("Book", BookSchema);

export default Book;