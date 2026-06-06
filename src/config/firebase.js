/**
 * @file firebase.js
 * @description Cấu hình và khởi tạo Firebase Admin SDK phục vụ gửi thông báo FCM. Hỗ trợ đọc Service Account từ biến môi trường dạng chuỗi JSON hoặc file credential.
 */

import admin from "firebase-admin";

/**
 * Khởi tạo Firebase Admin SDK. Đảm bảo là thực thể duy nhất.
 * @returns {admin.app.App} Đối tượng ứng dụng Firebase đã khởi tạo
 */
const initializeFirebase = () => {
  // Tránh việc khởi tạo trùng lặp
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let credential;

  // 1. Thử đọc cấu hình từ biến môi trường dạng chuỗi JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      const initError = new Error(`Firebase configuration invalid: ${error.message}`);
      console.error("FCM Error: Invalid service account JSON configuration");
      throw initError;
    }
  }
  // 2. Thử sử dụng GOOGLE_APPLICATION_CREDENTIALS trỏ tới đường dẫn file
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      credential = admin.credential.applicationDefault();
    } catch (error) {
      const initError = new Error(`Firebase credentials loading failed: ${error.message}`);
      console.error("FCM Error: Failed to load application default credentials");
      throw initError;
    }
  } else {
    // Không tìm thấy cấu hình hợp lệ
    const initError = new Error("Firebase configuration invalid: Missing FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS");
    console.error("FCM Error: Firebase service account configuration missing");
    throw initError;
  }

  try {
    admin.initializeApp({
      credential,
    });
    console.log("Firebase Admin SDK initialized");
  } catch (error) {
    console.error("FCM Error: Initialization failed", error.message);
    throw error;
  }
};

export { admin, initializeFirebase };
export default admin;
