# API_CONTRACT.md

# 📡 API CONTRACT SPECIFICATION

## API VERSION

Base URL:

```text
/api/v1
```

---

# I. RESPONSE STANDARD

## Success Response

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi",
    "details": null
  }
}
```

---

# II. AUTHENTICATION MODULE

## POST /auth/register

### Request

```json
{
  "username": "nghia",
  "email": "nghia@gmail.com",
  "password": "123456"
}
```

### Response

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "userId": ""
  }
}
```

---

## POST /auth/login

### Request

```json
{
  "email": "nghia@gmail.com",
  "password": "123456"
}
```

### Response

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "",
    "refreshToken": "",
    "user": {
      "_id": "",
      "username": "",
      "email": "",
      "avatar": "",
      "level": 1,
      "coin": 0,
      "role": "Normal"
    }
  }
}
```

---

## POST /auth/refresh-token

### Request

```json
{
  "refreshToken": ""
}
```

### Response

```json
{
  "success": true,
  "message": "Làm mới token thành công",
  "data": {
    "accessToken": ""
  }
}
```

---

## POST /auth/forgot-password

### Request

```json
{
  "email": "nghia@gmail.com"
}
```

---

## POST /auth/change-password

### Header

```text
Authorization: Bearer access_token
```

### Request

```json
{
  "oldPassword": "",
  "newPassword": ""
}
```

---

## POST /auth/logout

### Header

```text
Authorization: Bearer access_token
```

---

# III. USER MODULE

## PUT /users/fcm-token

### Request

```json
{
  "fcmToken": ""
}
```

---

## GET /users/profile

### Response

```json
{
  "success": true,
  "message": "Lấy thông tin thành công",
  "data": {
    "_id": "",
    "username": "",
    "email": "",
    "avatar": "",
    "level": 1,
    "coin": 100,
    "totalDeposited": 500,
    "role": "Normal"
  }
}
```

---

# IV. CATEGORY MODULE

## POST /categories

### Request

```json
{
  "name": "Fantasy",
  "zindex": 1
}
```

---

## PUT /categories/:id

### Request

```json
{
  "name": "Fantasy",
  "zindex": 2
}
```

---

## DELETE /categories/:id

---

## GET /categories

### Response

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": {
    "items": [
      {
        "_id": "",
        "name": "",
        "zindex": 1
      }
    ]
  }
}
```

---

# V. BOOK MODULE

## POST /books

### Request

```json
{
  "title": "",
  "summary": "",
  "coverImage": "",
  "categoryId": ""
}
```

---

## PUT /books/:id

### Request

```json
{
  "title": "",
  "summary": "",
  "coverImage": "",
  "categoryId": ""
}
```

---

## PATCH /books/:id/status

### Request

```json
{
  "status": "pending"
}
```

### Allowed Values

```text
pending
completed
pause
```

---

## PATCH /books/:id/ban

### Request

```json
{
  "isBan": true
}
```

---

## GET /books

### Query

```text
page
limit
keyword
categoryId
status
sort
```

### Response

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

---

## GET /books/:id

### Response

```json
{
  "success": true,
  "message": "Lấy chi tiết thành công",
  "data": {
    "_id": "",
    "title": "",
    "summary": "",
    "coverImage": "",
    "views": 0,
    "status": "pending",
    "category": {},
    "creator": {}
  }
}
```

---

# VI. CHAPTER MODULE

## POST /chapters

### Request

```json
{
  "bookId": "",
  "chapterNumber": 1,
  "title": "",
  "content": "",
  "coinRequired": 0
}
```

---

## PUT /chapters/:id

---

## DELETE /chapters/:id

---

## GET /chapters/book/:bookId

### Query

```text
page
limit
```

---

## GET /chapters/:id

---

# VII. COMMENT MODULE

## POST /comments

### Request

```json
{
  "bookId": "",
  "chapterId": null,
  "content": "",
  "parentId": null
}
```

---

## GET /comments

### Query

```text
bookId
chapterId
page
limit
```

---

## DELETE /comments/:id

---

# VIII. FOLLOW MODULE

## POST /interacts/follow

### Request

```json
{
  "bookId": ""
}
```

---

## DELETE /interacts/follow/:bookId

---

## GET /interacts/follow

---

# IX. BOOKMARK MODULE

## POST /interacts/bookmark

### Request

```json
{
  "bookId": "",
  "chapterId": ""
}
```

---

## GET /interacts/bookmark

---

# X. HISTORY MODULE

## POST /interacts/history

### Request

```json
{
  "bookId": "",
  "chapterId": ""
}
```

---

## GET /interacts/history

---

# XI. PAYMENT MODULE

## POST /transactions/deposit

### Request

```json
{
  "amount": 100000,
  "paymentMethod": "VNPAY"
}
```

### Response

```json
{
  "success": true,
  "message": "Khởi tạo giao dịch thành công",
  "data": {
    "orderId": "",
    "paymentUrl": ""
  }
}
```

---

## POST /transactions/ipn

Webhook thanh toán từ cổng thanh toán.

Không cho Flutter gọi trực tiếp.

---

## POST /transactions/buy-chapter

### Request

```json
{
  "bookId": "",
  "chapterId": ""
}
```

---

## POST /transactions/donate

### Request

```json
{
  "bookId": "",
  "receiverId": "",
  "coinAmount": 100
}
```

---

## GET /transactions/deposit-history

---

## GET /transactions/payment-history

---

# XII. NOTIFICATION MODULE

## GET /notifications

### Query

```text
page
limit
isRead
```

---

## PATCH /notifications/:id/read

---

## PATCH /notifications/read-all

---

## DELETE /notifications/:id

---

# XIII. ADMIN ROLE MODULE

## POST /roles

### Request

```json
{
  "name": "Editor",
  "description": ""
}
```

---

## GET /roles

---

## POST /roles/permissions

### Request

```json
{
  "roleId": "",
  "permissionIds": [
    "",
    ""
  ]
}
```

---

## GET /permissions

---

# XIV. PAGINATION STANDARD

Tất cả API danh sách bắt buộc trả về:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

---

# XV. AUTHORIZATION RULES

## Normal

```text
Đọc truyện
Bình luận
Theo dõi
Bookmark
Mua chương
Donate
```

## Editor

```text
Tạo truyện
Sửa truyện được phân công
Duyệt chương
Duyệt truyện
```

## Admin

```text
Toàn quyền hệ thống
Quản lý Role
Quản lý Permission
Khóa User
Khóa Truyện
```
