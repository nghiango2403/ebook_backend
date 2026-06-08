// src/utils/fcmSender.js
/**
 * @file fcmSender.js
 * @description Tiện ích hạ tầng gửi thông báo đẩy qua Firebase Cloud Messaging (FCM).
 * Hỗ trợ gửi đơn lẻ, gửi hàng loạt theo lô (Batching), tự động thử lại lỗi (Retry) và tổng hợp báo cáo kết quả.
 */

import admin from "firebase-admin";

const BATCH_SIZE = 500; // Giới hạn kích thước tối đa của mỗi Batch theo tiêu chuẩn Firebase
const MAX_RETRY = 3;    // Số lần thử lại tối đa đối với các token gặp sự cố đường truyền

/**
 * 5. Chuẩn hóa payload theo định dạng thông điệp của Firebase Admin SDK
 * @param {Object} payload - Khối dữ liệu thô nhập vào { title, body, data }
 * @returns {Object} Đối tượng message chuẩn hóa
 */
export const buildMessage = (payload) => {
  const { title, body, data } = payload || {};
  
  // Đảm bảo tất cả giá trị trong object data phải là String theo yêu cầu của Firebase SDK
  const sanitizedData = {};
  if (data && typeof data === "object") {
    Object.keys(data).forEach((key) => {
      sanitizedData[key] = String(data[key]);
    });
  }

  return {
    notification: {
      title: title || "",
      body: body || ""
    },
    data: sanitizedData
  };
};

/**
 * 3. Chia nhỏ mảng token thiết bị thành nhiều phân đoạn (Batch/Chunk)
 * @param {string[]} tokens - Danh sách chuỗi token cần chia
 * @param {number} batchSize - Kích thước giới hạn cho mỗi phân đoạn
 * @returns {string[][]} Mảng hai chiều chứa các nhóm token đã phân đoạn
 */
export const chunkTokens = (tokens, batchSize = BATCH_SIZE) => {
  if (!Array.isArray(tokens)) return [];
  const chunks = [];
  for (let i = 0; i < tokens.length; i += batchSize) {
    chunks.push(tokens.slice(i, i + batchSize));
  }
  return chunks;
};

/**
 * 1. Gửi thông báo tới duy nhất một thiết bị định danh
 * @param {string} token - Chuỗi FCM Token của thiết bị đích
 * @param {Object} payload - Đối tượng chứa { title, body, data }
 * @returns {Promise<Object>} Trạng thái kết quả { success, messageId } hoặc phản hồi lỗi
 */
export const sendNotification = async (token, payload) => {
  try {
    if (!token) {
      return { success: false, error: "Missing FCM Token" };
    }

    const baseMessage = buildMessage(payload);
    const message = {
      ...baseMessage,
      token: token
    };

    const messageId = await admin.messaging().send(message);
    
    // Logging thành công theo quy định hệ thống (Chỉ log trạng thái và ID, không log Token/Secret)
    console.log(`FCM Success: Message sent successfully with ID ${messageId}`);
    
    return {
      success: true,
      messageId: messageId
    };
  } catch (error) {
    console.error("FCM Error: Failed to send single notification", error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 4. Cơ chế tự động thử lại (Retry) đối với các token gửi thất bại đơn lẻ
 * @param {string[]} failedTokens - Danh sách các token bị lỗi ở vòng trước
 * @param {Object} baseMessage - Payload đã chuẩn hóa
 * @returns {Promise<Object>} Kết quả gom cụm sau khi kết thúc các lượt retry
 */
const retryFailedNotifications = async (failedTokens, baseMessage) => {
  let currentFailed = [...failedTokens];
  let currentSuccessCount = 0;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    if (currentFailed.length === 0) break;

    console.log(`Retry Attempt: Retrying ${currentFailed.length} failed tokens. Turn: ${attempt}/${MAX_RETRY}`);
    const nextFailed = [];

    // Sử dụng Promise.allSettled để gửi song song các token lỗi mà không gây nghẽn tiến trình chung
    const promises = currentFailed.map((token) =>
      admin.messaging().send({ ...baseMessage, token }).catch((err) => ({ __isError: true, token, err }))
    );

    const responses = await Promise.all(promises);

    responses.forEach((res, index) => {
      if (res && res.__isError) {
        nextFailed.push(res.token);
      } else {
        currentSuccessCount++;
      }
    });

    currentFailed = nextFailed;
  }

  return {
    successCount: currentSuccessCount,
    failedTokens: currentFailed
  };
};

/**
 * 2. Gửi thông báo số lượng lớn hàng loạt (Bulk Send) tích hợp chia lô và tự động thử lại
 * @param {string[]} tokens - Mảng tập hợp chuỗi FCM Token người nhận
 * @param {Object} payload - Đối tượng chứa nội dung { title, body, data }
 * @returns {Promise<Object>} Kết quả tổng hợp chuẩn hóa (6. Tổng hợp kết quả gửi)
 */
export const sendBulkNotification = async (tokens, payload) => {
  const resultSummary = {
    totalTokens: Array.isArray(tokens) ? tokens.length : 0,
    successCount: 0,
    failureCount: 0,
    failedTokens: []
  };

  if (!tokens || tokens.length === 0) return resultSummary;

  const baseMessage = buildMessage(payload);
  const tokenBatches = chunkTokens(tokens, BATCH_SIZE);

  // Vòng lặp duyệt qua từng Batch dữ liệu
  for (const batch of tokenBatches) {
    try {
      // Đóng gói danh sách tin nhắn theo cấu hình của admin.messaging().sendEach()
      const messages = batch.map((token) => ({
        ...baseMessage,
        token: token
      }));

      // Gửi toàn bộ Batch lên hệ thống Firebase
      const response = await admin.messaging().sendEach(messages);

      resultSummary.successCount += response.successCount;
      resultSummary.failureCount += response.failureCount;

      // 8. Xử lý Error Handling: Lọc và trích xuất chính xác token lỗi trong lô
      if (response.failureCount > 0) {
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            resultSummary.failedTokens.push(batch[idx]);
          }
        });
      }
    } catch (batchError) {
      console.error("FCM Error: Batch transmission failed critically", batchError.message);
      // Nếu rớt cả Batch (Lỗi mạng mạng/token tổng), ghi nhận toàn bộ token của batch đó vào mảng lỗi
      resultSummary.failureCount += batch.length;
      resultSummary.failedTokens.push(...batch);
    }
  }

  // 4. Nếu có token lỗi, kích hoạt luồng tái gửi độc lập (Retry Loop)
  if (resultSummary.failedTokens.length > 0) {
    const retryResult = await retryFailedNotifications(resultSummary.failedTokens, baseMessage);
    
    // Tái cấu trúc, dịch chuyển số liệu dựa trên kết quả thu hồi sau các lượt thử lại
    resultSummary.successCount += retryResult.successCount;
    resultSummary.failureCount -= retryResult.successCount;
    resultSummary.failedTokens = retryResult.failedTokens;
  }

  return resultSummary;
};