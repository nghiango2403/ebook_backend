/**
 * @file mailSender.js
 * @description Tiện ích cấu hình và kết nối SMTP Server để gửi Email tự động trong hệ thống.
 */

import nodemailer from "nodemailer";



/**
 * Gửi email chứa mã xác minh OTP với giao diện HTML chuẩn hóa
 * @param {string} toEmail - Địa chỉ email người nhận (Độc giả)
 * @param {string} otpCode - Mã số OTP bí mật gồm 6 chữ số
 * @returns {Promise<boolean>} Trạng thái gửi thư (true: thành công)
 */
export const sendEmailWithOTP = async (toEmail, otpCode) => {
  try {
    console.log(process.env.SMTP_PORT, " ", process.env.SMTP_USER, " ", process.env.SMTP_PASS);
    // Khởi tạo đối tượng Transport cấu hình từ biến môi trường
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT, 10) || 465,
      secure: true, // true cho cổng 465 (SSL), false cho các cổng khác (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Mật khẩu ứng dụng App Password
      },
    });
    const mailOptions = {
      from: `"E-Book App" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "[E-Book] Mã Xác Minh Khôi Phục Mật Khẩu Của Bạn",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">Khôi Phục Mật Khẩu</h2>
          <p>Xin chào,</p>
          <p>Hệ thống nhận được yêu cầu cấp lại mật khẩu gắn liền với tài khoản email này. Vui lòng sử dụng mã OTP dưới đây để hoàn tất tiến trình xác minh:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #16a085; background: #f2f9f6; padding: 10px 30px; border-radius: 5px; border: 1px dashed #16a085;">
              ${otpCode}
            </span>
          </div>
          <p style="color: #e74c3c; font-weight: bold;">Lưu ý: Mã OTP này có hiệu lực trong vòng 5 phút và chỉ được sử dụng duy nhất 1 lần. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Đây là email tự động từ hệ thống quản lý ứng dụng E-Book, vui lòng không phản hồi lại thư này.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL SUCCESS]: Email đã được gửi tới ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[MAIL ERROR]: Gặp sự cố khi kết nối hoặc gửi thư qua SMTP server", error.message);
    // Không ném lỗi ra client để tránh làm đổ vỡ tiến trình chính, ghi log để kỹ thuật xử lý
    return false;
  }
};