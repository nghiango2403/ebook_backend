// src/modules/roles/permission.model.js
/**
 * @file permission.model.js
 * @description Định nghĩa Mongoose Schema và Model cho thực thể Permission (Quyền hạn).
 * Tuân thủ nghiêm ngặt cấu trúc tối giản của ENTITY.md và quy định tại CODING_RULE.md.
 */

import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        method: {
            type: String, 
            required: true,
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"]
        }
    },
    {
        versionKey: false, // Loại bỏ trường __v không cần thiết của Mongoose
        timestamps: false, // ENTITY.md không yêu cầu trường dữ liệu thời gian createdAt/updatedAt
        collection: "permissions" // Định danh chính xác tên bảng lưu trữ trong MongoDB Atlas
    }
);

const Permission = mongoose.models.Permission || mongoose.model("Permission", PermissionSchema);

export default Permission;