/**
 * @file db.js
 * @description Thiết lập kết nối cơ sở dữ liệu MongoDB bằng Mongoose ODM, cấu hình pool và cơ chế retry khi mất kết nối.
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ebook_db";

const connectOptions = {
  maxPoolSize: 10, // Cấu hình Connection Pool
};

let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 giây

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, connectOptions);
    // Logging trạng thái kết nối thành công theo quy định LOGGING RULE
    console.log("Database Connected");
    retryCount = 0; // Reset số lần thử lại
  } catch (error) {
    // Logging lỗi kết nối theo quy định LOGGING RULE
    console.error("Database Error:", error.message);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(connectDB, RETRY_INTERVAL);
    } else {
      throw error;
    }
  }
};

// Lắng nghe các sự kiện mất kết nối trong vòng đời ứng dụng
mongoose.connection.on("disconnected", () => {
  // Chỉ log Database Error/Disconnected và thực hiện kết nối lại
  console.error("Database Error: Disconnected. Attempting to reconnect...");
  connectDB();
});

mongoose.connection.on("error", (error) => {
  console.error("Database Error:", error.message);
});

export default connectDB;
