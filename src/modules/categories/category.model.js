/**
 * @file category.model.js
 * @description Định nghĩa Mongoose Schema và Model cho thực thể Category (Thể loại).
 * Tuân thủ chính xác quy định cấu trúc tại ENTITY.md và CODING_RULE.md.
 */

import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    zindex: {
      type: Number,
      default: 0
    },
    isHidden:{
      type: Boolean,
      default: false
    }
  },
  {
    versionKey: false,
    timestamps: true 
  }
);

// Tạo các chỉ mục tối ưu hóa tốc độ truy vấn theo đặc tả TASK.md
CategorySchema.index({ zindex: 1 });
CategorySchema.index({ isHidden: 1 });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;