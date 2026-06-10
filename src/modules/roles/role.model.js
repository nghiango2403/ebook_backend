/**
 * @file role.model.js
 * @description Định nghĩa Mongoose Schema và Model cho thực thể Role (Vai trò).
 * Tuân thủ nghiêm ngặt ENTITY.md và CODING_RULE.md.
 */

import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["Normal", "Editor", "Admin"],
      trim: true
    },
    description: {
      type: String,
      default: ""
    }
  },
  {
    versionKey: false,
    timestamps: false,
    collection: "roles"
  }
);

// Tạo chỉ mục unique hỗ trợ quét nhanh và chống ghi đè dữ liệu trùng tên vai trò
RoleSchema.index({ name: 1 }, { unique: true });

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);

export default Role;