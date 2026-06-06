# CODING_RULE.md

# 📐 BACKEND CODING STANDARDS & DEVELOPMENT RULES

Tài liệu này là tiêu chuẩn kỹ thuật bắt buộc áp dụng cho toàn bộ mã nguồn Backend.

Mọi source code được AI hoặc Developer tạo ra đều phải tuân thủ tuyệt đối các quy tắc bên dưới.

---

# I. CÔNG NGHỆ BẮT BUỘC

## Runtime

```text
NodeJS LTS
```

## Framework

```text
ExpressJS
```

## Database

```text
MongoDB
Mongoose ODM
```

## Authentication

```text
JWT
Bcrypt
```

## Notification

```text
Firebase Cloud Messaging (FCM)
```

## Coding Style

```text
ES Module
```

Bắt buộc:

```javascript
import express from "express";
export default router;
```

Không được sử dụng:

```javascript
const express = require("express");
module.exports = router;
```

---

# II. KIẾN TRÚC HỆ THỐNG

Bắt buộc tuân thủ:

```text
3-Layer Architecture
```

Bao gồm:

```text
Routes
Controller
Service
```

---

# III. TRÁCH NHIỆM TỪNG LAYER

## Routes

Chỉ được phép:

```text
Định nghĩa endpoint
Khai báo middleware
Điều hướng request
```

Không được:

```text
Xử lý nghiệp vụ
Truy cập database
Tính toán dữ liệu
```

Ví dụ:

```javascript
router.post(
  "/login",
  authController.login
);
```

---

## Controller

Chỉ được phép:

```text
Nhận request
Đọc body
Đọc params
Đọc query
Validate sơ bộ
Gọi Service
Trả Response
```

Không được:

```text
Query database
Viết business logic
```

Sai:

```javascript
await User.findOne(...)
```

Đúng:

```javascript
const result = await authService.login(data);
```

---

## Service

Là nơi duy nhất xử lý:

```text
Business Logic
Database
Transaction
Permission
```

Service không được sử dụng:

```javascript
req
res
next
```

Sai:

```javascript
res.status(200).json(...)
```

Đúng:

```javascript
return result;
```

---

# IV. QUY TẮC ĐẶT TÊN FILE

## Route

```text
auth.routes.js
book.routes.js
```

## Controller

```text
auth.controller.js
book.controller.js
```

## Service

```text
auth.service.js
book.service.js
```

## Model

```text
user.model.js
book.model.js
```

---

# V. QUY TẮC ĐẶT TÊN BIẾN

## Biến

Sử dụng:

```javascript
camelCase
```

Ví dụ:

```javascript
userId
bookId
chapterNumber
createdAt
```

---

## Constant

Sử dụng:

```javascript
UPPER_SNAKE_CASE
```

Ví dụ:

```javascript
TOKEN_EXPIRED
ACCOUNT_BANNED
```

---

## Collection Name

Sử dụng:

```javascript
snake_case
```

Ví dụ:

```text
users
books
chapters
payment_transactions
```

---

# VI. QUY TẮC MODEL

## Mongoose Schema

Bắt buộc:

```javascript
timestamps: true
```

Ngoại lệ:

```text
User Model
```

Không được tạo:

```javascript
updatedAt
```

Theo yêu cầu ENTITY.md.

---

## Index

Mọi Index phải khai báo ngay trong Model.

Ví dụ:

```javascript
BookSchema.index({
  title: "text"
});
```

```javascript
ChapterSchema.index(
  {
    bookId: 1,
    chapterNumber: 1
  },
  {
    unique: true
  }
);
```

---

## Ref

Bắt buộc:

```javascript
type: mongoose.Schema.Types.ObjectId
```

Ví dụ:

```javascript
creatorId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}
```

---

# VII. VALIDATION RULE

Không validate trong Service.

Validation thực hiện tại:

```text
Controller
```

Hoặc:

```text
Middleware Validation
```

---

## Email

Bắt buộc:

```text
RFC Email Format
```

---

## Password

Tối thiểu:

```text
6 ký tự
```

---

## Username

Tối thiểu:

```text
3 ký tự
```

Tối đa:

```text
50 ký tự
```

---

# VIII. RESPONSE STANDARD

Mọi API phải trả về đúng format.

## Success

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "error": {
    "code": "",
    "message": "",
    "details": null
  }
}
```

---

# IX. HTTP STATUS CODE

## Success

```text
200 OK
201 CREATED
```

---

## Error

```text
400 BAD REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT FOUND
409 CONFLICT
423 LOCKED
500 INTERNAL SERVER ERROR
```

---

# X. ERROR HANDLING

Mọi lỗi phải throw về:

```javascript
AppError
```

Ví dụ:

```javascript
throw new AppError(
  "AUTH_FAILED",
  "Sai email hoặc mật khẩu",
  400
);
```

Không được:

```javascript
throw new Error(...)
```

---

# XI. ASYNC / AWAIT

Bắt buộc:

```javascript
async await
```

Không được:

```javascript
.then()
.catch()
```

Ví dụ:

```javascript
const user = await User.findById(id);
```

---

# XII. JWT RULE

Access Token:

```text
15 phút
```

Refresh Token:

```text
30 ngày
```

Payload:

```json
{
  "userId": "",
  "roleId": "",
  "level": 1
}
```

Không lưu:

```text
password
email
coin
```

trong JWT.

---

# XIII. DATABASE TRANSACTION

Bắt buộc dùng Transaction cho:

```text
Nạp tiền
Mua chương
Donate
Nâng cấp level
```

Ví dụ:

```javascript
const session =
  await mongoose.startSession();
```

```javascript
session.startTransaction();
```

---

# XIV. SECURITY RULE

Bắt buộc sử dụng:

```text
helmet
cors
compression
bcrypt
jwt
```

Không log:

```text
password
jwt
secret key
payment key
```

---

# XV. LOGGING RULE

Chỉ log:

```text
Server Start
Database Connected
Database Error
Payment Callback
FCM Error
```

Không log:

```text
Request Body
Password
Token
```

trên môi trường Production.

---

# XVI. PAGINATION RULE

Mặc định:

```text
page=1
limit=20
```

Giới hạn:

```text
limit <= 100
```

---

# XVII. SOFT DELETE

Không sử dụng:

```text
deletedAt
```

Toàn bộ hệ thống sử dụng:

```text
isBan
status
```

theo ENTITY.md.

---

# XVIII. RBAC RULE

Permission được kiểm tra:

```text
Role
Permission
Level
```

Thứ tự:

```text
1. JWT
2. timeBan
3. Role
4. Permission
5. Level
```

---

# XIX. FILE UPLOAD RULE

Ảnh phải lưu:

```text
Cloudinary
```

Database chỉ lưu:

```text
imageUrl
```

Không lưu:

```text
Binary
Base64
```

trong MongoDB.

---

# XX. AI DEVELOPMENT RULE

Khi thực hiện Task:

```text
Chỉ được sửa các file thuộc Task hiện tại.
```

Không được:

```text
Refactor ngoài phạm vi Task.
Đổi tên thư mục.
Đổi tên file.
Tạo kiến trúc khác README.md.
```

Sau mỗi Task phải:

```text
1. Đánh dấu hoàn thành Task.
2. Cập nhật tiến độ.
3. Liệt kê file tạo mới.
4. Liệt kê file chỉnh sửa.
5. Giải thích ngắn gọn thay đổi.
```
