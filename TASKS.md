# 📋 REVISED BACKEND TASK BOARD (AGILE BACKLOG)

---

# 🕒 LỊCH SỬ CẬP NHẬT TIẾN ĐỘ (SYSTEM LOG)

**Tiến độ tổng thể:** `||███████████████████████░|| 23/35 Tasks (65.71%)

* **15/06/2026:** Hoàn thành Task 23: Thiết lập hạ tầng định tuyến an toàn qua `authMiddleware` cho 6 API hệ thống truyện; hoàn thiện bộ lọc động đồng bộ, cơ chế tăng lượt xem độc lập và tính năng phân phối/truy vấn công việc nâng cao của phân hệ Editor/Admin.
* **14/06/2026:** Hoàn thành Task 22: Triển khai các API điều hướng trạng thái vòng đời sách & Hoàn thiện cơ chế bóc tách JSON Patching khi phê duyệt.
* **13/06/2026:** Hoàn thành Task 21: Phát triển API Chỉnh sửa Truyện
* **12/06/2026:** Hoàn thành Task 20: API Tạo Truyện & Đóng gói luồng tải lên Cloudflare R2.
* **12/06/2026:** Hoàn thành Task 19: Schema Book & Book_Editor.
* **11/06/2026:** Hoàn thành Task 18: Module Categories CRUD.
* **10/06/2026:** Hoàn thành Task 17: API Cập nhật FCM Token.
* **10/06/2026:** Hoàn thành Task 16: Cập nhật Schema User & TimeBan & Tích hợp Cloudflare R2.
* **10/06/2026:** Hoàn thành Task 15: Liên kết Role-Permission.
* **10/06/2026:** Hoàn thành Task 14: Khởi tạo Module Roles.
* **10/06/2026:** Hoàn thành Task 13: Khởi tạo Module Permissions.
* **08/06/2026:** Hoàn thành Task 12: Xây dựng Module Authentication.
* **08/06/2026:** Hoàn thành Task 10: Xây dựng FCM Sender Service.
* **08/06/2026:** Hoàn thành Task 9: Xây dựng Utility Layer.
* **07/06/2026:** Hoàn thành Task 8: Xây dựng Global Error Handler.
* **07/06/2026:** Hoàn thành Task 7: Xây dựng Middleware RBAC.
* **07/06/2026:** Hoàn thành Task 6: Xây dựng Middleware Authentication.
* **07/06/2026:** Hoàn thành Task 5: Thiết lập Payment Configuration.
* **06/06/2026:** Hoàn thành Task 4: Thiết lập Firebase Admin SDK.
* **06/06/2026:** Hoàn thành Task 3: Thiết lập Database Connection.
* **06/06/2026:** Hoàn thành Task 2: Khởi tạo Server Entry Point.
* **06/06/2026:** Hoàn thành Task 1: Khởi tạo Express Application.

---

# I. PHẦN 0: FOUNDATION & SYSTEM CORE (TASKS 1 - 10)

## 🚀 HẠ TẦNG KHỞI TẠO HỆ THỐNG

### [x] Task 1: Khởi tạo Express Application

**File xử lý:** `src/app.js`

**Mục tiêu:**

* Cấu hình Express
* Cấu hình JSON Parser
* Cấu hình URL Encoded Parser
* Cấu hình CORS
* Cấu hình Helmet
* Cấu hình Compression
* Mount Root Router

---

### [x] Task 2: Khởi tạo Server Entry Point

**File xử lý:** `src/server.js`

**Mục tiêu:**

* Khởi động HTTP Server
* Đọc biến môi trường
* Kết nối Database
* Khởi tạo Firebase Service
* Gắn Error Handler toàn cục

---

### [x] Task 3: Thiết lập Database Connection

**File xử lý:** `src/config/db.js`

**Mục tiêu:**

* Kết nối MongoDB bằng Mongoose
* Cấu hình Pool Connection
* Retry khi mất kết nối
* Logging trạng thái Database

---

### [x] Task 4: Thiết lập Firebase Admin SDK

**File xử lý:** `src/config/firebase.js`

**Mục tiêu:**

* Khởi tạo Firebase Admin SDK
* Nạp Service Account
* Chuẩn bị hạ tầng FCM

---

### [x] Task 5: Thiết lập Payment Configuration

**File xử lý:** `src/config/payment.js`

**Mục tiêu:**

* Nạp cấu hình VNPay
* Nạp cấu hình MoMo
* Nạp cấu hình ZaloPay
* Quản lý Secret Keys

---

### [x] Task 6: Xây dựng Middleware Authentication

**File xử lý:** `src/middlewares/auth.js`

**Mục tiêu:**

* Xác thực JWT
* Kiểm tra Token hết hạn
* Kiểm tra Token hợp lệ
* Kiểm tra trạng thái tài khoản
* Kiểm tra `timeBan`

---

### [x] Task 7: Xây dựng Middleware RBAC

**File xử lý:** `src/middlewares/rbac.js`

**Mục tiêu:**

* Kiểm tra Role
* Kiểm tra Permission
* Kiểm tra Level
* Chặn truy cập trái phép

---

### [x] Task 8: Xây dựng Global Error Handler

**File xử lý:** `src/middlewares/errorHandler.js`

**Mục tiêu:**

* Chuẩn hóa Error Response
* Mapping Error Code
* Logging lỗi hệ thống
* Che giấu Stack Trace khỏi Client

---

### [x] Task 9: Xây dựng Utility Layer

**File xử lý:** `src/utils/helpers.js`

**Mục tiêu:**

* Hash Password
* Verify Password
* HMAC SHA512
* Sinh mã giao dịch
* Format dữ liệu dùng chung

---

### [x] Task 10: Xây dựng FCM Sender Service

**File xử lý:** `src/utils/fcmSender.js`

**Mục tiêu:**

* Bulk Send Notification
* Chia nhỏ Token Batch
* Retry khi gửi lỗi
* Gom kết quả gửi

---

# II. PHẦN 1: AUTHENTICATION & AUTHORIZATION (TASKS 11 - 17)

### [x] Task 11: Xây dựng Root Router Aggregator

**File xử lý:** `src/modules/index.routes.js`

**Mục tiêu:**

* Tổng hợp toàn bộ Router
* Versioning API (`/api/v1`)
* Đăng ký Middleware chung

---

### [x] Task 12: Xây dựng Module Authentication

**File xử lý:** `src/modules/auth/*`

**Mục tiêu:**

* Đăng ký
* Đăng nhập
* Làm mới Token
* Quên mật khẩu
* Đổi mật khẩu
* Đăng xuất

---

### [x] Task 13: Khởi tạo Module Permissions

**File xử lý:** `src/modules/roles/permission.model.js`

**Mục tiêu:**

* Thêm
* Sữa
* Xóa
* Lấy

---

### [x] Task 14: Khởi tạo Module Roles

**File xử lý:** `src/modules/roles/role.model.js`

**Các role:**

* Normal
* Editor
* Admin

**Mục tiêu**

* Thêm
* Sữa
* Xóa
* Lấy

---

### [x] Task 15: Liên kết Role-Permission

**File xử lý:** `src/modules/roles/role_permission.model.js`

**Mục tiêu:**

* Mapping Role ↔ Permission
* Quản lý ma trận phân quyền

---

### [x] Task 16: Cập nhật Schema User & TimeBan

**File xử lý:** `src/modules/users/user.model.js`

**Mục tiêu:**

* `totalDeposited`
* `timeBan`
* `level`
* `coin`
* `fcmToken`

---

### [x] Task 17: API Cập nhật FCM Token

**File xử lý:** `src/modules/users/*`

**Mục tiêu:**

* Đồng bộ Token thiết bị
* Cập nhật Token mới khi đổi thiết bị

---

# III. PHẦN 2: CONTENT MANAGEMENT (TASKS 18 - 24)

### [x] Task 18: Module Categories CRUD

**File xử lý:** `src/modules/categories/*`

**Mục tiêu:**

* Tạo thể loại
* Cập nhật thể loại
* Xóa thể loại
* Danh sách thể loại
* Sắp xếp theo `zindex`

---

### [x] Task 19: Tái cấu trúc Schema Book & Khởi tạo Hệ thống Review Logs cho Editor

**File xử lý:** 
* `src/modules/books/book.model.js`
* `src/modules/books/book_review_log.model.js`

**Mục tiêu:**

* Liên kết Category: Tích hợp categoryId liên kết chặt chẽ với thực thể Category.
* Trạng thái sách & Duyệt: Bổ sung status vận hành truyện và bộ đôi quản lý trạng thái duyệt hiện tại (reviewStatus và editorId).
* Compound Index tối ưu: Thiết lập chỉ mục kép phục vụ bộ lọc tìm kiếm của Độc giả (categoryId + status + isBan) và chỉ mục phục vụ Full-Text Search (title).
* Audit Log Lịch sử Duyệt: Khởi tạo bảng BookReviewLog lưu vết chi tiết các phiên duyệt của Editor, cấu hình Compound Index theo quy tắc ESR (bookId + createdAt và editorId + reviewStatus + createdAt) để tối ưu hóa sắp xếp mới nhất.

---

### [x] Task 20: API Tạo Truyện

**File xử lý:** `src/modules/books/*`

**Mục tiêu:**

* Kiểm tra quyền
* Kiểm tra Category
* Khởi tạo trạng thái `pending`

---

### [x] Task 21: API Chỉnh sửa Truyện

**File xử lý:** `src/modules/books/*`

**Mục tiêu:**

* Kiểm tra quyền sở hữu
* Admin được toàn quyền

---

### [x] Task 22: API Duyệt / Pause / Complete / Ban Truyện / Lấy các phần duyệt truyện

**File xử lý:** `src/modules/books/*`

**Mục tiêu:**

* Editor duyệt theo Scope
* Admin Ban sách

---

### [x] Task 23: API Danh sách & Chi tiết Truyện

**File xử lý:** `src/modules/books/*`

**Mục tiêu:**

* Tìm kiếm
* Phân trang
* Lọc Category
* Ẩn sách bị Ban

---

### [ ] Task 24: Module Chapters CRUD

**File xử lý:** `src/modules/chapters/*`, `src/modules/chapters/chapter_review_log.model.js`

**Mục tiêu:**

* CRUD chương
* Unique `{ bookId, chapterNumber }`
* Quản lý giá mở khóa chương
* Triển khai Schema: chapter_review_log.model.js để lưu vết các phiên duyệt chương của Editor (chapterId, bookId, editorId, reviewStatus, reviewCount, createdAt, reviewedAt).
* Viết API Duyệt Chương cho Editor & ghi log đồng thời.

---

# IV. PHẦN 3: USER INTERACTION (TASKS 25 - 28)

### [ ] Task 25: Bình luận đa cấp

**File xử lý:** `src/modules/comments/*`, ``

**Mục tiêu:**

* Thiết lập Schema Comment hỗ trợ phân cấp (Self-reference qua parentId). Viết API lấy danh sách bình luận phân trang theo cơ chế cây.
* Xây dựng Schema Report (Lưu thông tin khi User bấm báo cáo xấu một comment).
* Triển khai Schema: comment_review_log.model.js để kiểm soát lịch sử duyệt bình luận với cấu trúc unique { reportId: 1 } chặn trùng lặp.
* Viết API xử lý báo cáo dành cho Editor.

---

### [ ] Task 26: Theo dõi truyện

**File xử lý:** `src/modules/interacts/follow.model.js`

**Mục tiêu:**

* Follow
* Unfollow
* Danh sách theo dõi

---

### [ ] Task 27: Bookmark truyện

**File xử lý:** `src/modules/interacts/bookmark.model.js`

**Mục tiêu:**

* Lưu vị trí đọc
* Đồng bộ đa thiết bị

---

### [ ] Task 28: Lịch sử đọc

**File xử lý:** `src/modules/interacts/history.model.js`

**Mục tiêu:**

* Ghi nhận lịch sử đọc
* Lưu bookId và chapterId

---

# V. PHẦN 4: PAYMENT & LEVEL SYSTEM (TASKS 29 - 33)

### [ ] Task 29: Cấu hình chữ ký thanh toán

**File xử lý:** `src/config/payment.js`, `src/utils/helpers.js`

**Mục tiêu:**

* SHA512
* Tạo chữ ký
* Xác thực chữ ký

---

### [ ] Task 30: API Khởi tạo hóa đơn nạp tiền

**File xử lý:** `src/modules/transactions/*`

**Mục tiêu:**

* Tạo Deposit
* Sinh Payment URL

---

### [ ] Task 31: Webhook/IPN & Auto Level Up

**File xử lý:** `src/modules/transactions/*`

**Mục tiêu:**

* Cộng coin
* Cập nhật totalDeposited
* Auto nâng cấp Level

---

### [ ] Task 32: API Mua chương truyện

**File xử lý:** `src/modules/transactions/*`

**Mục tiêu:**

* Trừ coin
* Lưu Payment Transaction
* Ghi bookId và chapterId

---

### [ ] Task 33: API Donate tác giả

**File xử lý:** `src/modules/transactions/*`

**Mục tiêu:**

* Chuyển coin
* Lưu bookId
* chapterId = null

---

# VI. PHẦN 5: REALTIME NOTIFICATION (TASKS 34 - 35)

### [ ] Task 34: Module Notification Inbox

**File xử lý:** `src/modules/notifications/*`

**Mục tiêu:**

* Danh sách thông báo
* Đánh dấu đã đọc
* Xóa thông báo

---

### [ ] Task 35: FCM Realtime Notification

**File xử lý:** `src/modules/notifications/notification.service.js`

**Mục tiêu:**

* Gửi FCM khi có chương mới
* Tạo Inbox Notification
* Đồng bộ trạng thái đọc/chưa đọc

---
