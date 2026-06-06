# CẤU TRÚC THƯ MỤC NODEJS 3-LAYER STANDARD

Toàn bộ hệ thống được chia theo từng Phân hệ tính năng (Module-based). Bên trong mỗi phân hệ, mã nguồn được bóc tách lớp rạch ròi thành 3 lớp (3-Layer Architecture) nhằm cô lập trách nhiệm:
1. **Lớp Giao Tiếp / Định Tuyến (Routes):** Tiếp nhận Endpoint URL và phân phối Middleware.
2. **Lớp Điều Khiển (Controller):** Tiếp nhận HTTP Request (body, params, query), validate sơ bộ và định dạng dữ liệu trả về cho Client.
3. **Lớp Nghiệp Vụ & Dữ Liệu (Service & Model):** Nơi xử lý logic cốt lõi, tính toán, gọi DB Transaction và thao tác trực tiếp với cơ sở dữ liệu.

---

## I. CÂY CẤU TRÚC THƯ MỤC CHI TIẾT (FOLDER TREE)

```text
server/
├── .env                           # Biến môi trường (PORT, DB_URI, SECRET_KEY, PAYMENT_KEYS)
├── package.json                   # Định nghĩa dependencies và scripts khởi chạy dự án
└── src/
    ├── app.js                     # Cấu hình chính của Express, tích hợp CORS, Helmet, Parser
    ├── server.js                  # Điểm khởi chạy (Entry Point), kết nối cơ sở dữ liệu vật lý
    │
    ├── config/                    # Cấu hình hệ thống và dịch vụ bên thứ ba
    │   ├── db.js                  # Thiết lập kết nối cơ sở dữ liệu (Mongoose)
    │   ├── firebase.js            # Khởi tạo Firebase Admin SDK phục vụ FCM
    │   └── payment.js             # Cấu hình môi trường MoMo, ZaloPay, VNPayer
    │
    ├── middlewares/               # Lớp lọc trung gian áp dụng toàn hệ thống
    │   ├── auth.js                # Giải mã JWT để xác thực danh tính User
    │   ├── rbac.js                # Middleware chốt chặn kiểm tra Cấp độ (Level) và Quyền (Permissions)
    │   └── errorHandler.js        # Global Error Handler - chuẩn hóa đầu ra lỗi JSON cho Flutter
    │
    ├── utils/                     # Các hàm tiện ích dùng chung
    │   ├── helpers.js             # Hàm băm mã hóa HmacSHA512 cho cổng thanh toán
    │   └── fcmSender.js           # Xử lý chia mảng token để gửi thông báo số lượng lớn (Bulk Send)
    │
    └── modules/                   # KHU VỰC CHỨA CÁC MODULES CHUYÊN BIỆT (3-LAYER)
        ├── index.routes.js        # Cổng tổng gộp toàn bộ các router con bên dưới
        │
        ├── auth/                  # MODULE 1: XÁC THỰC
        │   ├── auth.routes.js     # [Layer 1] Định tuyến endpoints đăng nhập, đăng ký, quên mật khẩu
        │   ├── auth.controller.js # [Layer 2] Xử lý req/res HTTP, bóc tách chuỗi mật khẩu/email
        │   └── auth.service.js    # [Layer 3] Logic so khớp Bcrypt, ký JWT Token, thao tác DB
        │
        ├── roles/                 # MODULE 2: PHÂN QUYỀN HỆ THỐNG
        │   ├── role.routes.js     # [Layer 1] APIs quản lý, phân bổ quyền cho Admin
        │   ├── role.controller.js # [Layer 2] Tiếp nhận mảng permissionId để gán vào Role
        │   ├── role.model.js      # [Layer 3] Schema cấu trúc dữ liệu vai trò (Admin, Editor, Normal)
        │   ├── permission.model.js# [Layer 3] Schema danh sách các mã quyền (CREATE_BOOK, APPROVE...)
        │   └── role_permission.model.js # [Layer 3] Schema bảng trung gian mapping Role - Permission
        │
        ├── users/                 # MODULE 3: TÀI KHOẢN NGƯỜI DÙNG
        │   ├── user.routes.js     # [Layer 1] Endpoints cập nhật avatar, update FCM Token thiết bị
        │   ├── user.controller.js # [Layer 2] Chặn logic kiểm tra level >= 2 trước khi cho phép đổi avatar
        │   ├── user.service.js    # [Layer 3] Cập nhật bản ghi profile vào cơ sở dữ liệu
        │   └── user.model.js      # [Layer 3] Schema cấu trúc User: số dư coin, cấp độ level, fcmToken
        ├── categories/            # MODULE MỚI 4: QUẢN LÝ THỂ LOẠI
        │   ├── category.routes.js     # [Layer 1]
        │   ├── category.controller.js # [Layer 2]
        │   ├── category.service.js    # [Layer 3]
        │   └── category.model.js      # [Layer 3] Định nghĩa _id, name, zindex
        │
        ├── books/                 # MODULE 4: QUẢN LÝ TRUYỆN (SÁCH)
        │   ├── book.routes.js     # [Layer 1] Endpoints: đăng truyện, sửa truyện, duyệt truyện, ẩn truyện
        │   ├── book.controller.js # [Layer 2] Xử lý tham số truy vấn tìm kiếm, bộ lọc bảng xếp hạng, phân trang
        │   ├── book.service.js    # [Layer 3] Tính toán logic, cập nhật trạng thái, thiết lập chỉ mục
        │   ├── book.model.js      # [Layer 3] Schema thông tin truyện (Tiêu đề, tác giả, trạng thái duyệt)
        │   └── book_editor.model.js # [Layer 3] Schema bảng phân công Editor quản lý theo Scope cuốn sách
        │
        ├── chapters/              # MODULE 5: QUẢN LÝ CHƯƠNG TRUYỆN
        │   ├── chapter.routes.js  # [Layer 1] Endpoints CRUD nội dung chương viết bởi Editor/Admin
        │   ├── chapter.controller.js # [Layer 2] Kiểm tra trung gian, bóc tách nội dung text/ảnh gửi lên
        │   ├── chapter.service.js # [Layer 3] Thực thi ghi/sửa dữ liệu chương truyện vào DB
        │   └── chapter.model.js   # [Layer 3] Schema chương: tiêu đề, số xu yêu cầu mở khóa, nội dung
        │
        ├── comments/              # MODULE 6: BÌNH LUẬN ĐA CẤP
        │   ├── comment.routes.js  # [Layer 1] Endpoints viết bình luận gốc, viết câu trả lời (Reply)
        │   ├── comment.controller.js # [Layer 2] Phân tách luồng load comment gốc độc lập với luồng load reply
        │   ├── comment.service.js # [Layer 3] Ghi nhận cây bình luận vào Database
        │   └── comment.model.js   # [Layer 3] Schema bình luận, lưu trữ liên kết parentId
        │
        ├── interacts/             # MODULE 7: TƯƠNG TÁC TIỆN ÍCH (GỘP TRẠNG THÁI)
        │   ├── interact.routes.js # [Layer 1] Endpoints kích hoạt hành động bấm follow, bookmark, đọc tiếp
        │   ├── interact.controller.js # [Layer 2] Điều hướng và đóng gói dữ liệu tương tác từ Flutter
        │   ├── interact.service.js# [Layer 3] Thực thi cập nhật ghi đè hoặc thêm mới lịch sử đọc
        │   ├── follow.model.js    # [Layer 3] Schema lưu danh sách User theo dõi truyện để nhận FCM
        │   ├── bookmark.model.js  # [Layer 3] Schema lưu vị trí chương đang đọc dở để đồng bộ thiết bị
        │   └── history.model.js   # [Layer 3] Schema lưu vết danh sách các truyện vừa xem gần đây
        │
        ├── notifications/         # MODULE 8: HỘP THƯ THÔNG BÁO VÀ KÍCH HOẠT REALTIME
        │   ├── notification.routes.js   # [Layer 1] Endpoints lấy hòm thư cá nhân, đánh dấu đã đọc
        │   ├── notification.controller.js # [Layer 2] Tiếp nhận yêu cầu cập nhật trạng thái thông báo
        │   ├── notification.service.js  # [Layer 3] Xử lý trigger ngầm quét mảng token và gọi Firebase Admin
        │   └── notification.model.js    # [Layer 3] Schema lưu lịch sử thông báo cá nhân (Inbox) trên DB
        │
        └── transactions/          # MODULE 9: TÀI CHÍNH & TIÊU DÙNG (GỘP BIẾN ĐỘNG SỐ DƯ)
            ├── transaction.routes.js # [Layer 1] Endpoint sinh link nạp tiền, Cổng Webhook nhận tiền tự động
            ├── transaction.controller.js # [Layer 2] Tiếp nhận phản hồi mã hóa (IPN) an toàn từ ví điện tử
            ├── transaction.service.js # [Layer 3] Thực thi ACID DB Transaction bảo mật trừ/cộng coin an toàn
            ├── deposit.model.js   # [Layer 3] Schema hóa đơn nạp tiền (MoMo, VNPayer) chờ đối soát
            └── payment.model.js   # [Layer 3] Schema nhật ký chi tiêu coin (Mua chương VIP, Donate tác giả)
## II. CẤU TRÚC TRẢ VỀ

Toàn bộ Modules trong hệ thống bắt buộc phải trả về dữ liệu theo đúng 2 bộ khung mẫu dưới đây.

---

## 1. KHUNG PHẢN HỒI THÀNH CÔNG (SUCCESS RESPONSE PATTERN)

*Áp dụng cho tất cả các API trả về mã trạng thái HTTP: `200 OK`, `201 Created`.*

```json
{
  "success": true,
  "message": "Chuỗi thông báo hành động thành công bằng tiếng Việt",
  "data": {}
}
```

---

## 2. KHUNG PHẢN HỒI THẤT BẠI / LỖI (ERROR RESPONSE PATTERN)

*Áp dụng tại lớp xử lý lỗi tập trung `errorHandler.js` (Task 25) cho các mã lỗi HTTP như: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `423 Locked`, `500 Internal Server Error`.*

```json
{
  "success": false,
  "error": {
    "code": "MÃ_LỖI_HỆ_THỐNG_VIẾT_HOA",
    "message": "Lời nhắn giải thích chi tiết lỗi thân thiện với người dùng dùng để hiển thị lên UI Flutter",
    "details": null
  }
}
```

### Danh sách mã lỗi hệ thống bắt buộc áp dụng

| Error Code | Mô tả | HTTP Status |
|------------|--------|------------|
| AUTH_FAILED | Đăng nhập sai tài khoản hoặc mật khẩu | 400 |
| TOKEN_EXPIRED | Token JWT đã hết hạn | 401 |
| TOKEN_INVALID | Token JWT không hợp lệ | 401 |
| ACCOUNT_BANNED | Tài khoản đang nằm trong thời gian bị khóa (`timeBan`) | 423 |
| PERMISSION_DENIED | Không đủ cấp độ (`Level`) hoặc quyền hạn để gọi API | 403 |
| BOOK_BANNED | Truyện đã bị Admin khóa (`isBan = true`) | 403 |
| INSUFFICIENT_BALANCE | Không đủ số dư xu (coin) để mua chương hoặc donate | 400 |
| VALIDATION_ERROR | Dữ liệu gửi lên thiếu hoặc sai định dạng | 400 |
| INTERNAL_SERVER_ERROR | Lỗi hệ thống hoặc lỗi xử lý cơ sở dữ liệu | 500 |

---

## CHI TIẾT & GIẢI THÍCH

Cấu trúc phản hồi đồng bộ này giải quyết triệt để bài toán phối hợp giữa **Backend Node.js** và **Frontend Flutter**.

### 1. Khớp nối Model ở Frontend (Đồng bộ kiểu dữ liệu)

Trên ứng dụng Flutter, khi xây dựng lớp giải mã JSON (`BaseResponse<T>`), lập trình viên chỉ cần kiểm tra một trường duy nhất:

```dart
if (json['success'] == true)
```

- Nếu `success = true`, Flutter sẽ xử lý dữ liệu trong trường `data`.
- Nếu `success = false`, Flutter sẽ ánh xạ trực tiếp lỗi sang lớp `AppException` dựa trên giá trị của `error.code`.

### 2. Xử lý `details` động (Dynamic Details)

Trường `details` mặc định được trả về là `null` nhằm giảm dung lượng dữ liệu truyền tải.

Tuy nhiên, với các lỗi nghiệp vụ đặc thù, trường này có thể chứa thêm một đối tượng (`Object`) mang thông tin bổ sung để Flutter xử lý giao diện hoặc luồng nghiệp vụ.

Ví dụ:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Số dư không đủ để mua chương truyện.",
    "details": {
      "requiredCoin": 100,
      "currentCoin": 75,
      "missingCoin": 25
    }
  }
}
```

Flutter có thể sử dụng dữ liệu trong `details` để hiển thị hộp thoại nạp xu hoặc đề xuất hành động phù hợp cho người dùng.