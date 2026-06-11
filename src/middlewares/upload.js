import multer from "multer";
import path from "path";
import { AppError } from "../utils/appError.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/tmp/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "img-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Tối đa 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("VALIDATION_ERROR", "Tệp tin tải lên bắt buộc phải là định dạng hình ảnh (png, jpg, jpeg)", 400));
    }
  },
});

export default upload;