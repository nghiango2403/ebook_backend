// src/modules/users/user.model.js
/**
 * @file user.model.js
 * @description Định nghĩa Mongoose Schema và Model cho thực thể User (Người dùng).
 * Tuân thủ nghiêm ngặt ENTITY.md và CODING_RULE.md (ES Module).
 */

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: ""
    },
    level: {
      type: Number,
      default: 1
    },
    coin: {
      type: Number,
      default: 0
    },
    totalDeposited: {
      type: Number,
      default: 0
    },
    timeBan: {
      type: Date,
      default: null
    },
    fcmToken: {
      type: String,
      default: null
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true
    },
    secret: {
      type: String,
      default: null 
    }
  },
  {
    timestamps: true, // Tự động quản lý createdAt và updatedAt theo ENTITY.md
    collection: "users"
  }
);

// Tạo chỉ mục (Index) hỗ trợ tối ưu tìm kiếm nhanh
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Bắt buộc export default để khớp với cấu trúc import bên file auth.js
export default User;