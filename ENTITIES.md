# 🗄️ THIẾT KẾ CƠ SỞ DỮ LIỆU ĐÃ CẬP NHẬT (REVISED ENTITIES)

## 🔐 PHẦN 1: HẠ TẦNG PHÂN QUYỀN & TÀI KHOẢN

### 1. Entity: Permission (Quyền hạn tối giản)
* `_id`: Object ID / UUID (Khóa chính)
* `name`: String (Tên quyền)
* `url`: String (Đường dẫn route API chốt chặn bảo mật)

### 2. Entity: Role (Vai trò)
* `_id`: Object ID / UUID (Khóa chính)
* `name`: String (Giới hạn chuẩn xác: `Normal`, `Editor`, `Admin`) - *Unique Index*
* `description`: String

### 3. Entity: Role_Permission (Bảng cấu hình mapping)
* `_id`: Object ID / UUID (Khóa chính)
* `roleId`: Object ID / UUID (Ref sang `Role`)
* `permissionId`: Object ID / UUID (Ref sang `Permission`)
* *Ràng buộc:* `Compound Unique Index` `{ roleId, permissionId }`

### 4. Entity: User (Người dùng)
* `_id`: Object ID / UUID (Khóa chính)
* `username`: String - *Unique Index*
* `email`: String - *Unique Index*
* `password`: String (Bcrypt)
* `avatar`: String
* `level`: Number (Mặc định = `1`. Tự động nâng: $\ge 50 \rightarrow$ Level 2; $\ge 500 \rightarrow$ Level 3)
* `coin`: Number (Số xu hiện tại đang sở hữu, mặc định = `0`)
* `totalDeposited`: Number (Tổng số tiền tích lũy đã nạp từ trước đến nay, mặc định = `0`)
* `timeBan`: DateTime (Thời gian bị khóa tài khoản, nếu `Thời gian hiện tại < timeBan` $\rightarrow$ Chặn đăng nhập; mặc định = `null`)
* `roleId`: Object ID / UUID (Ref sang `Role`)
* `fcmToken`: String (Mặc định = `null`)
* `createdAt`: DateTime
* *Lưu ý cấu trúc:* Tuyệt đối không khai báo trường `updatedAt` theo yêu cầu.

---

## 📚 PHẦN 2: PHÂN HỆ QUẢN LÝ NỘI DUNG

### 5. Entity: Category (Thể loại sách mới)
* `_id`: Object ID / UUID (Khóa chính)
* `name`: String (Tên thể loại truyện)
* `zindex`: Number (Số thứ tự sắp xếp hiển thị ưu tiên trên giao diện Flutter, mặc định = `0`)
* `isHidden`: Bool

### 6. Entity: Book (Truyện / Sách)
* `_id`: Object ID / UUID (Khóa chính)
* `title`: String - *Text Index*
* `summary`: String
* `coverImage`: String
* `categoryId`: Object ID / UUID (Khóa ngoại tham chiếu sang `Category._id`) - *Index*
* `status`: String (Giới hạn: `pending`, `completed`, `pause`)
* `isBan`: Boolean (Cờ chặn của Admin. Nếu `isBan == true` $\rightarrow$ Ẩn hoàn toàn khỏi mọi API tìm kiếm của tài khoản thường, chỉ Admin nhìn thấy, mặc định = `false`)
* `views`: Number (Mặc định = `0`)
* `creatorId`: Object ID / UUID (Ref sang `User._id`)
* `createdAt` / `updatedAt`: DateTime
* `reviewStatus`: String (Giới hạn: `pending`, `approved`, `rejected` - Mặc định = `pending`)
* `editorId`: Object ID (Ref sang `User` - Biên tập viên chịu trách nhiệm duyệt hiện tại)
* *Lưu ý cấu trúc:* Đã loại bỏ hoàn toàn trường `rating`.

### 7. Entity: Book_Review_Log (Nhật ký lịch sử duyệt sách)
* `_id`: Object ID / UUID (Khóa chính)
* `bookId`: Object ID / UUID (Ref sang `Book`)
* `editorId`: Object ID / UUID (Ref sang `User`)
* `reviewStatus`: String (Giới hạn: `pending`, `approved`, `rejected`)
* `note`: String (Lý do duyệt đạt hoặc từ chối, mặc định = `""`)
* `reviewCount`: Number (Số thứ tự của phiên duyệt/sửa đổi)
* `createdAt`: DateTime (Thời gian ghi nhận phiên duyệt)
* *Ràng buộc:* 
    Compound Index theo Sách: { bookId: 1, createdAt: -1 }
    ,Compound Index theo Editor: { editorId: 1, reviewStatus: 1, createdAt: -1 }

### 8. Entity: Chapter (Chương truyện)
* `_id`: Object ID / UUID (Khóa chính)
* `bookId`: Object ID / UUID (Ref sang `Book`) - *Index*
* `chapterNumber`: Number
* `title`: String
* `content`: LongString / Array
* `coinRequired`: Number (Mặc định = `0`)
* `status`: String (`pending`, `approved`, `hidden`)
* `reviewStatus`: String (Giới hạn: `pending`, `approved`, `rejected` - Mặc định = `pending`)
* `createdAt` / `updatedAt`: DateTime
* *Ràng buộc:* `Compound Unique Index` `{ bookId: 1, chapterNumber: 1 }`

---

## 💬 PHẦN 3: PHÂN HỆ TƯƠNG TÁC NGƯỜI DÙNG

### 9. Entity: Comment (Bình luận)
* `_id`: Object ID / UUID (Khóa chính)
* `userId`: Object ID / UUID (Ref sang `User`)
* `bookId`: Object ID / UUID (Ref sang `Book`)
* `chapterId`: Object ID / UUID (Có thể `null`)
* `content`: String
* `parentId`: Object ID / UUID (Cơ chế đệ quy, mặc định `null`)
* `reviewStatus`: String (Giới hạn: `pending`, `approved`, `rejected` - Mặc định = `pending`)
* `createdAt` / `updatedAt`: DateTime

### 10. Entity: Follow (Theo dõi)
* `_id`: Object ID / UUID (Khóa chính)
* `userId`: Object ID / UUID (Ref sang `User`)
* `bookId`: Object ID / UUID (Ref sang `Book`)
* *Ràng buộc:* `Compound Unique Index` `{ userId: 1, bookId: 1 }`

### 11. Entity: Bookmark (Đánh dấu trang)
* `_id`: Object ID / UUID (Khóa chính)
* `userId`: Object ID / UUID (Ref sang `User`)
* `bookId`: Object ID / UUID (Ref sang `Book`)
* `chapterId`: Object ID / UUID (Ref sang `Chapter`)
* *Ràng buộc:* `Compound Unique Index` `{ userId: 1, bookId: 1 }`

### 12. Entity: History (Lịch sử xem)
* `_id`: Object ID / UUID (Khóa chính)
* `userId`: Object ID / UUID (Ref sang `User`)
* `bookId`: Object ID / UUID (Ref sang `Book`)
* `chapterId`: Object ID / UUID (Ref sang `Chapter._id` - Ghi nhận chương cụ thể người đọc đang xem dở)
* `lastReadAt`: DateTime
* *Ràng buộc:* `Compound Unique Index` `{ userId: 1, bookId: 1 }`

---

## 💳 PHẦN 4: PHÂN HỆ TÀI CHÍNH & TIÊU DÙNG

### 13. Entity: Deposit_Transaction (Hóa đơn nạp xu)
* `_id`: Object ID / UUID (Khóa chính)
* `userId`: Object ID / UUID (Ref sang `User`)
* `orderId`: String - *Unique Index*
* `amount`: Number
* `coinGenerated`: Number
* `paymentMethod`: String
* `status`: String (`PENDING`, `SUCCESS`, `FAILED`)
* `createdAt` / `updatedAt`: DateTime

### 14. Entity: Payment_Transaction (Nhật ký chi tiêu coin)
* `_id`: Object ID / UUID (Khóa chính)
* `userId`: Object ID / UUID (Ref sang `User` - Người thanh toán)
* `bookId`: Object ID / UUID (Ref sang `Book._id` - Bắt buộc lưu vết cuốn sách đích dù là hành động mua chương hay donate) - *Index*
* `type`: String (Giới hạn: `BUY_CHAPTER`, `DONATE`)
* `coinAmount`: Number 
* `receiverId`: Object ID / UUID (Có giá trị khi `type = DONATE`, ngược lại `null`)
* `chapterId`: Object ID / UUID (Có giá trị khi `type = BUY_CHAPTER`, ngược lại `null`)
* `createdAt`: DateTime

### 15. Entity: Chapter_Review_Log (Nhật ký lịch sử duyệt chương)
* `_id`: Object ID / UUID (Khóa chính)
* `chapterId`: Object ID / UUID (Ref sang `Chapter`)
* `editorId`: Object ID / UUID (Ref sang `User`)
* `reviewStatus`: String (Giới hạn: `pending`, `approved`, `rejected`)
* `note`: String (Lý do duyệt đạt hoặc từ chối, mặc định = `""`)
* `reviewCount`: Number (Số thứ tự của phiên duyệt/sửa đổi)
* `createdAt`: DateTime (Thời gian ghi nhận phiên duyệt)
* *Ràng buộc:* 
    Compound Index theo Chương: { chapterId: 1, createdAt: -1 }
    ,Compound Index theo Editor: { editorId: 1, reviewStatus: 1, createdAt: -1 }

### 16. Entity: Comment_Review_Log (Nhật ký lịch sử duyệt Comment)
* `_id`: Object ID / UUID (Khóa chính)
* `commentId`: Object ID / UUID (Ref sang `Chapter`)
* `editorId`: Object ID / UUID (Ref sang `User`)
* `reviewStatus`: String (Giới hạn: `pending`, `approved`, `rejected`)
* `note`: String (Lý do duyệt đạt hoặc từ chối, mặc định = `""`)
* `reviewCount`: Number (Số thứ tự của phiên duyệt/sửa đổi)
* `createdAt`: DateTime (Thời gian ghi nhận phiên duyệt)
* *Ràng buộc:* 
    Compound Index theo Bình luận: { commentId: 1, createdAt: -1 }
    ,Compound Index theo Editor: { editorId: 1, reviewStatus: 1, createdAt: -1 }