/**
 * @file server.js
 * @description Điểm khởi chạy (Entry Point) của hệ thống. Đọc biến môi trường, kết nối Database, khởi tạo Firebase, gắn Error Handler và chạy HTTP Server.
 */

import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import initializeFirebase from "./config/firebase.js";
import errorHandler from "./middlewares/errorHandler.js";

// Đọc biến môi trường
dotenv.config();

const PORT = process.env.PORT || 5000;

// Gắn Error Handler toàn cục
app.use(errorHandler);

const startServer = async () => {
  try {
    // 1. Kết nối Cơ sở dữ liệu (Mongoose)
    await connectDB();

    // 2. Khởi tạo Firebase Admin SDK
    initializeFirebase();

    // 3. Khởi động HTTP Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
