/**
 * @file role_permission.model.js
 * @description Định nghĩa Mongoose Schema bảng cấu hình Many-to-Many giữa Role và Permission.
 * Tuân thủ nghiêm ngặt ENTITY.md và quy định tại CODING_RULE.md.
 */

import mongoose from "mongoose";

const RolePermissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: false,
    collection: "role_permissions"
  }
);

// Bắt buộc Compound Unique Index ngăn chặn trùng lặp ma trận
RolePermissionSchema.index(
  { roleId: 1, permissionId: 1 },
  { unique: true }
);

const RolePermission = mongoose.models.RolePermission || mongoose.model("RolePermission", RolePermissionSchema);

export default RolePermission;