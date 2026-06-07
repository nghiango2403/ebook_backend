/**
 * @file payment.js
 * @description Quản lý tham số cấu hình môi trường, định danh và khóa bí mật cho các cổng thanh toán (VNPay, MoMo, ZaloPay).
 */

const paymentConfig = {
  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE || "",
    hashSecret: process.env.VNP_HASH_SECRET || "",
    baseUrl: process.env.VNP_BASE_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: process.env.VNP_RETURN_URL || "http://localhost:5000/api/v1/transactions/vnpay-return",
  },
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || "",
    accessKey: process.env.MOMO_ACCESS_KEY || "",
    secretKey: process.env.MOMO_SECRET_KEY || "",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:3000/api/v1/transactions/momo-return",
    ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:5000/api/v1/transactions/ipn",
  },
  zalopay: {
    appId: process.env.ZALO_APP_ID || "",
    key1: process.env.ZALO_KEY1 || "",
    key2: process.env.ZALO_KEY2 || "",
    endpoint: process.env.ZALO_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create",
  }
};

export default paymentConfig;