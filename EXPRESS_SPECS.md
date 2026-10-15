# 📋 TÀI LIỆU ĐẶC TẢ HỆ THỐNG BACKEND E-COMMERCE (EXPRESS -> NESTJS SPEC)

> **Mục đích tài liệu:** Đóng gói toàn bộ kiến trúc, Database Schema, Nghiệp vụ cốt lõi (Business Logic), Danh mục API và Quy tắc kỹ thuật từ repo Express.js hiện có (`Clothes-ecomerce-BE`) làm tài liệu chuẩn đặc tả (System Specification) để tiến hành tái cấu trúc và migrate sang NestJS (`Nest_Docker/be`).

---

## 📑 MỤC LỤC
1. [Tổng quan Kiến trúc Hệ thống](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Thiết kế Cơ sở dữ liệu (Database Schema & Prisma Models)](#2-thiết-kế-cơ-sở-dữ-liệu-database-schema--prisma-models)
3. [Cơ chế Xác thực & Phân quyền (Auth & Security Specification)](#3-cơ-chế-xác-thực--phân-quyền-auth--security-specification)
4. [Các Logic Nghiệp Vụ Cốt Lõi (Core Business Logic)](#4-các-logic-nghiệp-vụ-cốt-lõi-core-business-logic)
   - 4.1 Luồng Đăng ký & Xác thực OTP qua Email
   - 4.2 Luồng Đặt hàng Chống Oversell (DB Transaction & Row-level Locking)
   - 4.3 Webhook Tự động Xác nhận Thanh toán Chuyển khoản (SePay)
   - 4.4 Cơ chế Tính & Áp dụng Mã giảm giá (Coupons)
   - 4.5 Quản lý Tồn kho & Lịch sử Nhập xuất (Inventory Logs)
5. [Danh mục API Endpoints Chi tiết (API Reference Specification)](#5-danh-mục-api-endpoints-chi-tiết-api-reference-specification)
   - 5.1 Auth & User Module
   - 5.2 User Address Book
   - 5.3 Category & Hierarchical Tree
   - 5.4 Collections
   - 5.5 Attributes & Attribute Values
   - 5.6 Products & Variants
   - 5.7 Cart
   - 5.8 Coupons
   - 5.9 Orders & Checkout
   - 5.10 Webhooks (SePay)
   - 5.11 Inventory
   - 5.12 Wishlist
   - 5.13 Reviews
   - 5.14 CMS & Settings
   - 5.15 Admin Dashboard Stats
   - 5.16 Media Upload
6. [Xử lý Ngoại lệ & Quy ước Phản hồi (Error Handling & Response Standard)](#6-xử-lý-ngoại-lệ--quy-ước-phản-hồi-error-handling--response-standard)
7. [Bản đồ Quy hoạch Chuyển đổi sang NestJS (NestJS Migration Blueprint)](#7-bản-đồ-quy-hoạch-chuyển-đổi-sang-nestjs-nestjs-migration-blueprint)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

### 1.1 Ngữ cảnh dự án
Hệ thống Backend phục vụ cho Web Application E-Commerce thời trang (Rya's Store), bao gồm:
- **Khách hàng (Client/Customer):** Xem danh mục phân cấp, bộ sưu tập, tìm kiếm/lọc sản phẩm đa biến thể (Màu, Size), quản lý giỏ hàng, áp mã giảm giá, đặt hàng checkout (COD/Chuyển khoản VietQR), theo dõi đơn hàng, sổ địa chỉ, wishlist, đánh giá sản phẩm đã mua.
- **Quản trị viên (Admin):** Quản lý sản phẩm đa biến thể, quản lý danh mục/bộ sưu tập, điều chỉnh kho (Restock/Adjustment), duyệt review, quản lý đơn hàng & trạng thái giao vận, cấu hình CMS trang chủ (Banners/Promotions), xem Dashboard doanh thu và cảnh báo hàng sắp hết.
- **Hệ thống thứ ba:** SePay Webhook (bắn notification khi tiền vào tài khoản ngân hàng để tự động kích hoạt đơn hàng sang `PAID` và `CONFIRMED`), SMTP Nodemailer (gửi mã xác thực OTP).

### 1.2 Tech stack hiện tại (Express.js)
- **Runtime:** Node.js (TypeScript)
- **Web Framework:** Express 5.x
- **Database:** MySQL 8.0
- **ORM:** Prisma Client 5.14 (`@prisma/client`)
- **Authentication:** JWT (`jsonwebtoken`), Cookie-parser, Bcrypt
- **Validation:** Zod 4.x
- **File Upload:** Multer (Local storage `/uploads`)
- **Email:** Nodemailer (SMTP Gmail)
- **External Integration:** SePay API Webhook

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA & PRISMA MODELS)

Database gồm **13 Models** và **6 Enums**, bảng quan hệ được thiết kế chuẩn hoá:

```
[User] ───< [Address]
  │   └───< [Wishlist] >─── [Product] ───< [ProductImage]
  │   └───< [Review]   >─── [Product]
  │                           │
  │                     [Category] (Self-ref parent-child)
  │                     [Collection] (N-N with Product)
  │                           │
  │                     [ProductVariant] ───< [VariantImage]
  │                           │       ├───< [InventoryLog]
  │                           │       └───< [VariantAttributeValue] >─── [AttributeValue] >─── [Attribute]
  │                           │
  ├─── 1-1 ─── [Cart] ───< [CartItem]
  │
  └───< [Order] ───< [OrderItem] (Snapshot info)
          │   ├─── 1-1 ─── [Payment]
          │   ├─── 1-1 ─── [CouponUsage] >─── [Coupon]
          │   └───< [OrderStatusLog]
```

### 2.1 Enums
1. **`Role`**: `USER`, `ADMIN`
2. **`Gender`**: `MALE`, `FEMALE`, `OTHER`
3. **`ProductGender`**: `MALE`, `FEMALE`, `UNISEX`, `KIDS`
4. **`ProductStatus`**: `DRAFT`, `ACTIVE`, `INACTIVE`
5. **`InventoryReason`**: `ORDER` (Xuất khi mua), `RETURN` (Hoàn khi hủy), `RESTOCK` (Nhập thêm), `ADJUSTMENT` (Điều chỉnh kiểm kê)
6. **`OrderStatus`**: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`
7. **`PaymentMethod`**: `COD`, `VNPAY`, `MOMO`, `BANK_TRANSFER`
8. **`PaymentStatus`**: `UNPAID`, `PAID`, `REFUNDED`, `FAILED`
9. **`PaymentGatewayStatus`**: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`
10. **`CouponType`**: `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`
11. **`ReviewStatus`**: `PENDING`, `APPROVED`, `REJECTED`

### 2.2 Chi tiết 13 Bảng (Prisma Models)

#### 1. `User` (Bảng `users`)
| Trường | Kiểu | Ràng buộc | Diễn giải |
| :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | `@id @default(uuid()) @db.VarChar(36)` | Khóa chính |
| `phone` | `String` | `@unique @db.VarChar(15)` | Số điện thoại duy nhất |
| `email` | `String?` | `@unique @db.VarChar(255)` | Email tài khoản duy nhất |
| `password` | `String?` | `@db.VarChar(255)` | Mật khẩu hash Bcrypt |
| `role` | `Role` | `@default(USER)` | USER hoặc ADMIN |
| `name` | `String?` | `@db.VarChar(255)` | Họ tên hiển thị |
| `avatarUrl` | `String?` | `@map("avatar_url") @db.Text` | Link ảnh đại diện |
| `gender` | `Gender?` | `MALE / FEMALE / OTHER` | Giới tính |
| `dateOfBirth` | `DateTime?` | `@map("date_of_birth") @db.Date` | Ngày sinh |
| `isActive` | `Boolean` | `@default(true) @map("is_active")` | Trạng thái hoạt động |
| `otp_code` | `String?` | `@map("otp_code") @db.VarChar(10)` | Mã OTP 6 chữ số |
| `otp_expires_at`| `DateTime?` | `@map("otp_expires_at") @db.DateTime`| Thời hạn OTP (5 phút) |
| `email_verified_at`| `DateTime?`| `@map("email_verified_at") @db.DateTime`| Thời điểm xác thực email |
| `createdAt` | `DateTime` | `@default(now()) @map("created_at")` | Thời gian tạo |
| `updatedAt` | `DateTime` | `@updatedAt @map("updated_at")` | Thời gian sửa |

#### 2. `Address` (Bảng `addresses`)
- `id`: UUID (PK)
- `userId`: UUID (FK -> `User.id`, `onDelete: Cascade`)
- `fullName`: String (255)
- `phone`: String (15)
- `province`: String (100) (Tỉnh/Thành phố)
- `district`: String (100) (Quận/Huyện)
- `ward`: String (100) (Phường/Xã)
- `street`: Text (Số nhà, tên đường)
- `isDefault`: Boolean (Mặc định `false`, mỗi user chỉ nên có 1 địa chỉ default)

#### 3. `Category` (Bảng `categories`)
- `id`: UUID (PK)
- `parentId`: UUID? (FK -> `Category.id`, Self-relation sub-category)
- `name`: String (255)
- `slug`: String (255, Unique)
- `imageUrl`: Text?
- `sortOrder`: Int (Default `0`)
- `isActive`: Boolean (Default `true`)

#### 4. `Collection` (Bảng `collections`)
- `id`: UUID (PK)
- `name`: String (255)
- `slug`: String (255, Unique)
- `description`: Text?
- `eyebrow`: String? (100) (Tag line nhỏ trên tiêu đề bộ sưu tập)
- `imageUrl`: Text?
- `isActive`: Boolean (Default `true`)
- Quan hệ nhiều-nhiều với `Product` qua bảng trung gian implicit `ProductCollections`.

#### 5. `Product` (Bảng `products`)
- `id`: UUID (PK)
- `categoryId`: UUID? (FK -> `Category.id`)
- `name`: String (500)
- `slug`: String (500, Unique)
- `description`: Text?
- `basePrice`: Decimal(12, 2)
- `salePrice`: Decimal(12, 2)?
- `gender`: ProductGender? (`MALE`, `FEMALE`, `UNISEX`, `KIDS`)
- `status`: ProductStatus (`DRAFT`, `ACTIVE`, `INACTIVE`)
- `isFeatured`: Boolean (Default `false`)
- `tags`: Json? (Mảng các string tags)
- `metaTitle`: String(255)?
- `metaDescription`: Text?
- Fulltext index trên: `[name, description]`

#### 6. `ProductImage` (Bảng `product_images`)
- `id`: UUID (PK)
- `productId`: UUID (FK -> `Product.id`, `onDelete: Cascade`)
- `url`: Text
- `altText`: String(255)?
- `sortOrder`: Int (Default `0`)
- `isPrimary`: Boolean (Default `false` - ảnh đại diện sản phẩm)

#### 7. `Attribute` (Bảng `attributes`) & `AttributeValue` (Bảng `attribute_values`)
- `Attribute`: `id`, `name` (VD: "Size", "Màu sắc"), `type` ("color", "button", "dropdown")
- `AttributeValue`: `id`, `attributeId` (FK), `value` (VD: "M", "L", "Đỏ"), `hexCode` (VD: "#FF0000"), `sortOrder`: Int

#### 8. `ProductVariant` (Bảng `product_variants`) & `VariantAttributeValue`
- `ProductVariant`:
  - `id`: UUID (PK)
  - `productId`: UUID (FK -> `Product.id`, `onDelete: Cascade`)
  - `sku`: String (100, Unique)
  - `priceOverride`: Decimal(12, 2)? (Giá riêng cho biến thể này nếu khác giá base)
  - `salePriceOverride`: Decimal(12, 2)?
  - `stockQty`: Int (Default `0` - Số lượng tồn kho tức thời)
  - `weightGram`: Int? (Trọng lượng)
  - `isActive`: Boolean (Default `true`)
- `VariantAttributeValue`: Bảng ghép Many-to-Many giữa `ProductVariant` và `AttributeValue` (`id: [variantId, attributeValueId]`).
- `VariantImage`: Ảnh riêng gắn với variant (ví dụ ảnh áo màu đỏ khi chọn biến thể màu đỏ).

#### 9. `InventoryLog` (Bảng `inventory_logs`)
- `id`: UUID (PK)
- `variantId`: UUID (FK -> `ProductVariant.id`)
- `changeQty`: Int (Số âm = xuất kho, số dương = nhập kho)
- `reason`: `ORDER`, `RETURN`, `RESTOCK`, `ADJUSTMENT`
- `referenceId`: String? (Mã đơn hàng hoặc mã phiếu)
- `note`: Text? (Ghi chú lý do)

#### 10. `Cart` (Bảng `carts`) & `CartItem` (Bảng `cart_items`)
- `Cart`: `id`, `userId` (Unique, 1 User có 1 Cart)
- `CartItem`:
  - `id`: UUID (PK)
  - `cartId`: UUID (FK -> `Cart.id`, `onDelete: Cascade`)
  - `variantId`: UUID (FK -> `ProductVariant.id`, `onDelete: Cascade`)
  - `quantity`: Int
  - Ràng buộc: `@@unique([cartId, variantId])`

#### 11. `Order` (Bảng `orders`) & `OrderItem` & `OrderStatusLog`
- `Order`:
  - `id`: UUID (PK)
  - `orderCode`: String(20, Unique, format: `ORD-YYYYMMDD-XXXX`)
  - `userId`: UUID? (Cho phép guest checkout nếu không đăng nhập)
  - Snapshot địa chỉ giao nhận: `shippingName`, `shippingPhone`, `shippingAddress`, `shippingProvince`
  - Tiền tệ: `subtotal`, `shippingFee`, `discountAmount`, `totalAmount`
  - Trạng thái: `status` (OrderStatus), `paymentMethod`, `paymentStatus`
  - `couponId`: UUID?
  - `note`: Text?, `cancelledReason`: Text?
  - Timestamps giao hàng: `confirmedAt`, `shippedAt`, `deliveredAt`
- `OrderItem`:
  - Lưu **Snapshot bất biến** của sản phẩm tại thời điểm mua (dù sản phẩm gốc có sửa giá hay xóa thì đơn hàng không bị ảnh hưởng):
  - `productName`: String(500)
  - `variantInfo`: Json (VD: `{"Màu sắc": "Đỏ", "Size": "L"}`)
  - `sku`: String(100)
  - `imageUrl`: Text?
  - `unitPrice`: Decimal(12, 2)
  - `quantity`: Int
  - `subtotal`: Decimal(12, 2)
- `OrderStatusLog`: Lịch sử vết thay đổi trạng thái đơn (`oldStatus`, `newStatus`, `note`, `createdBy`).

#### 12. `Payment` (Bảng `payments`)
- `id`: UUID
- `orderId`: UUID (Unique, FK -> `Order.id`)
- `gateway`: PaymentMethod (`BANK_TRANSFER`, `COD`, ...)
- `gatewayTxnId`: String? (Mã giao dịch từ phía Bank / SePay reference code)
- `amount`: Decimal(12, 2)
- `status`: PaymentGatewayStatus
- `gatewayResponse`: Json (Toàn bộ raw payload webhook nhận về từ SePay)
- `paidAt`: DateTime?

#### 13. `Coupon` & `CouponUsage`
- `Coupon`:
  - `code`: String (50, Unique)
  - `type`: `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`
  - `value`: Decimal(12, 2) (Tỷ lệ % hoặc số tiền cố định)
  - `minOrderValue`: Decimal(12, 2)?
  - `maxDiscount`: Decimal(12, 2)? (Giới hạn trần giảm tối đa khi dùng %)
  - `usageLimit`: Int? (Tổng số lượt được dùng)
  - `usedCount`: Int (Đã dùng bao nhiêu lần)
  - `startDate`, `endDate`, `isActive`
- `CouponUsage`: Ghi nhận User nào đã dùng Coupon nào cho Order nào (`@@unique([couponId, userId])` - mỗi khách chỉ dùng mã 1 lần).

#### 14. `Wishlist`, `Review`, `Setting`
- `Wishlist`: `userId`, `productId`, `addedAt` (`@@unique([userId, productId])`).
- `Review`: Đánh giá 1-5 sao, hình ảnh đính kèm, gắn với `orderItemId`, kiểm tra bắt buộc đơn hàng đã `DELIVERED`, trạng thái `PENDING` -> `APPROVED` bởi Admin.
- `Setting`: Lưu JSON config CMS (VD: key `homepage` chứa banner, slider, featured collections).

---

## 3. CƠ CHẾ XÁC THỰC & PHÂN QUYỀN (AUTH & SECURITY SPECIFICATION)

### 3.1 Token Design
- **Access Token:**
  - Ký bằng `process.env.ACCESS_SECRET`
  - Payload: `{ id: user.id, role: user.role }`
  - Thời hạn: `30m` (30 phút)
  - Chấp nhận lấy từ 2 nguồn: Header `Authorization: Bearer <token>` HOẶC Cookie `accessToken` (đáp ứng cả SPA lẫn Mobile App).
- **Refresh Token:**
  - Ký bằng `process.env.REFRESH_SECRET`
  - Payload: `{ id: user.id, role: user.role }`
  - Thời hạn: `7d` (7 ngày)

### 3.2 Role-Based Access Control (RBAC)
- Hai Role chính:
  - `USER`: Khách hàng mua hàng, xem đơn cá nhân, chỉnh sửa giỏ hàng, viết review đơn mình đã mua, sửa profile.
  - `ADMIN`: Quản trị toàn bộ danh mục, sản phẩm, điều chỉnh kho, duyệt đơn hàng, hủy đơn mọi trạng thái (trừ đã DELIVERED), duyệt review, quản lý mã giảm giá, cấu hình CMS.

### 3.3 Middlewares trong Express
- `verifyToken`: Kiểm tra tính hợp lệ của token, decode và gán vào `req.user`. Nếu không có token trả về 401, token sai hoặc hết hạn trả về 403.
- `authorizeRoles('ADMIN')`: Kiểm tra `req.user.role` có nằm trong whitelist không, không thì trả về 403 Forbidden.

---

## 4. CÁC LOGIC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS LOGIC)

Đây là những luồng quan trọng nhất khi chuyển sang NestJS phải giữ nguyên thuật toán và tính toàn vẹn:

### 4.1 Luồng Đăng ký & Xác thực OTP qua Email
1. **Đăng ký (`register`):**
   - Kiểm tra trùng lặp email và phone.
   - Hash mật khẩu bằng Bcrypt (salt round = 10).
   - Tạo mã OTP ngẫu nhiên 6 chữ số: `Math.floor(100000 + Math.random() * 900000)`.
   - Set hạn sử dụng OTP là 5 phút: `new Date(Date.now() + 5 * 60 * 1000)`.
   - Tạo User với trạng thái `email_verified_at = null`.
   - Gửi mail chứa OTP tới user bằng Nodemailer.
2. **Xác thực OTP (`verifyOtp`):**
   - Khách nhập email + otp.
   - Kiểm tra `otp_code === inputOtp` và `otp_expires_at >= new Date()`.
   - Hợp lệ: cập nhật `email_verified_at = new Date()`, set `otp_code = null`, `otp_expires_at = null`.
   - Phát hành cặp Access Token + Refresh Token và cho đăng nhập luôn.
3. **Đăng nhập (`login`):**
   - Nếu `email_verified_at === null`: Tự động tái sinh mã OTP mới, lưu DB và gửi lại email OTP, bắn lỗi HTTP 403 yêu cầu verify.

---

### 4.2 Luồng Đặt hàng Chống Oversell (DB Transaction & Row-level Locking)

Khi có hàng nghìn người cùng mua một mặt hàng còn tồn kho ít (Flash Sale), việc trừ kho cần đảm bảo:
1. **Tránh Deadlock giữa các Transaction:**
   ```typescript
   // Luôn sắp xếp variant IDs theo thứ tự cố định trước khi lock
   const variantIds = data.items.map(item => item.variantId).sort();
   ```
2. **Khoá dòng (Pessimistic Row Lock):**
   ```sql
   SELECT id FROM product_variants WHERE id IN (...) FOR UPDATE
   ```
3. **Kiểm tra tồn kho và tính tiền:**
   - Duyệt từng item trong giỏ, so sánh `variant.stockQty < item.quantity` -> nếu không đủ lập tức ném lỗi 400.
   - Lấy giá: ưu tiên `variant.priceOverride`, nếu không có thì lấy `product.basePrice`.
   - Thu thập snapshot thông tin biến thể: Color, Size, Sku, Ảnh đại diện.
4. **Kiểm tra Mã Giảm Giá (Coupon Validation):**
   - Kiểm tra `isActive`, `startDate <= now <= endDate`, `usedCount < usageLimit`, `subtotal >= minOrderValue`.
   - Tính toán `discountAmount`:
     - Nếu `PERCENTAGE`: `subtotal * value / 100` (không vượt quá `maxDiscount`).
     - Nếu `FIXED_AMOUNT`: Giảm đúng số tiền cố định (không vượt quá subtotal).
   - Tăng `usedCount` lên 1.
5. **Ghi nhận đơn hàng & Trừ kho:**
   - Tạo `Order` + các `OrderItem` con.
   - Trừ kho: `productVariant.update({ stockQty: { decrement: item.quantity } })`.
   - Ghi nhật ký: `inventoryLog.create({ changeQty: -item.quantity, reason: 'ORDER', referenceId: order.id })`.
   - Tạo `CouponUsage` (nếu user đăng nhập).
   - Tự động xóa các item vừa mua khỏi `CartItem` của user.

---

### 4.3 Webhook Tự động Xác nhận Thanh toán Chuyển khoản (SePay)
SePay là cổng trung gian webhook thông báo biến động tài khoản ngân hàng (VietQR / MBBank / Vietcombank / ACB...):
1. **Xác thực Token:** Kiểm tra `req.headers.authorization === Bearer process.env.SEPAY_API_TOKEN`.
2. **Bộ lọc giao dịch:** Chỉ xử lý khi `transferType === 'in'`.
3. **Trích xuất mã đơn hàng bằng Regex:**
   - Biểu thức chính quy: `/ORD[-_]?\d{8}[-_]?\d{4}/i`
   - Chuẩn hóa về format chuẩn DB: `ORD-YYYYMMDD-XXXX`.
4. **Xác minh số tiền:**
   - Kiểm tra đơn có tồn tại không.
   - Đảm bảo đơn chưa `PAID`.
   - Kiểm tra `transferAmount >= order.totalAmount`.
5. **Cập nhật:**
   - Mở Transaction: Update Order sang `paymentStatus = 'PAID'`.
   - Nếu đơn đang ở `PENDING`, tự động chuyển sang `CONFIRMED` (đã duyệt).
   - Tạo bản ghi trong bảng `Payment` lưu mã giao dịch `referenceCode`, số tiền, raw webhook response.

---

### 4.4 Cơ chế Tính & Áp dụng Mã giảm giá (Coupons)
- Hỗ trợ 3 kiểu:
  - `PERCENTAGE`: Giảm theo tỷ lệ %, có chặn trần `maxDiscount`.
  - `FIXED_AMOUNT`: Giảm trừ tiền trực tiếp.
  - `FREE_SHIPPING`: Miễn phí vận chuyển.
- Ràng buộc:
  - `minOrderValue`: Giá trị đơn hàng tối thiểu.
  - `usageLimit` và `usedCount`: Giới hạn tổng số lần sử dụng của toàn hệ thống.
  - Bảng `CouponUsage`: Mỗi User đăng nhập chỉ được dùng mã này 1 lần duy nhất (`@@unique([couponId, userId])`).

---

### 4.5 Quản lý Tồn kho & Lịch sử Nhập xuất (Inventory Logs)
- Không bao giờ sửa thẳng trường `stockQty` mà không có căn cứ.
- Mọi biến động kho đều ghi vào `InventoryLog`:
  - `changeQty`: Số nguyên mang dấu (Âm: xuất, Dương: nhập).
  - `reason`: `ORDER` (Mua hàng), `RETURN` (Khách hủy đơn hoặc hoàn hàng), `RESTOCK` (Admin nhập thêm hàng), `ADJUSTMENT` (Admin kiểm kê chênh lệch).
  - `referenceId`: Mã đơn hàng hoặc mã tham chiếu.
  - `note`: Ghi chú chi tiết.
- Khi Hủy đơn hàng (`cancelOrder`):
  - Tự động hoàn lại số lượng tồn kho `stockQty += item.quantity`.
  - Tạo log hoàn kho với reason `RETURN`.

---

## 5. DANH MỤC API ENDPOINTS CHI TIẾT (API REFERENCE SPECIFICATION)

Tiền tố chung: `/api`

### 5.1 Auth & User Module
| Method | Endpoint | Quyền | Mô tả & Validation Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Public | Body: `{ name, email, password, phone }`<br>Validation: Email hợp lệ, phone VN 10 số, password >= 6 ký tự.<br>Gửi OTP 6 số qua mail. |
| `POST` | `/api/otp/verify` | Public | Body: `{ email, otp }`<br>Xác thực và trả về `{ user, accessToken, refreshToken }`. |
| `POST` | `/api/login` | Public | Body: `{ email, password }`<br>Nếu chưa verify OTP thì trả 403 và gửi lại OTP. |
| `POST` | `/api/refresh-token` | Public | Body: `{ refreshToken }` hoặc Cookie.<br>Trả về `{ accessToken }` mới. |
| `POST` | `/api/logout` | Public | Xóa cookie accessToken. |
| `GET` | `/api/profile` | Auth | Lấy thông tin tài khoản hiện tại (ẩn password). |
| `PUT` | `/api/profile` | Auth | Body: `{ name?, email?, password?, phone? }`<br>Cập nhật thông tin tài khoản. |
| `GET` | `/api/admin/users` | Admin | Lấy danh sách toàn bộ người dùng hệ thống. |
| `PUT` | `/api/admin/users/:id/status`| Admin | Khóa hoặc mở khóa tài khoản user (`isActive`). |

---

### 5.2 User Address Book
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile/addresses` | Auth | Danh sách địa chỉ của user, sắp xếp `isDefault` lên đầu. |
| `POST` | `/api/profile/addresses` | Auth | Thêm địa chỉ mới: `{ fullName, phone, province, district, ward, street, isDefault? }`<br>Nếu `isDefault = true`, tự động set các địa chỉ khác thành `false`. |
| `PUT` | `/api/profile/addresses/:id`| Auth | Cập nhật địa chỉ theo ID. |
| `DELETE`| `/api/profile/addresses/:id`| Auth | Xóa địa chỉ. |

---

### 5.3 Category & Hierarchical Tree
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | Danh sách danh mục đa cấp (hỗ trợ include sub-categories). |
| `POST` | `/api/categories` | Admin | Body: `{ name, slug, parentId?, imageUrl?, sortOrder?, isActive? }` |
| `PUT` | `/api/categories/:id` | Admin | Cập nhật danh mục. |
| `DELETE`| `/api/categories/:id` | Admin | Xóa danh mục. |

---

### 5.4 Collections
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/collections` | Public | Danh sách bộ sưu tập kèm danh sách sản phẩm & hình ảnh. |
| `GET` | `/api/collections/:slug`| Public | Chi tiết bộ sưu tập theo slug. |
| `POST` | `/api/collections` | Admin | Tạo bộ sưu tập: `{ name, slug, description?, eyebrow?, imageUrl?, productIds? }` |
| `PUT` | `/api/collections/:id` | Admin | Sửa bộ sưu tập & cập nhật danh sách `productIds`. |
| `DELETE`| `/api/collections/:id` | Admin | Xóa bộ sưu tập. |

---

### 5.5 Attributes & Attribute Values
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attributes` | Admin | Lấy danh sách thuộc tính (Size, Màu sắc, Chất liệu...) kèm các values. |
| `POST` | `/api/attributes` | Admin | Tạo thuộc tính: `{ name, type }` (color/button/dropdown). |
| `PUT` | `/api/attributes/:id` | Admin | Sửa thuộc tính. |
| `DELETE`| `/api/attributes/:id` | Admin | Xóa thuộc tính (Cascade xóa values). |
| `POST` | `/api/attributes/:id/values` | Admin | Tạo giá trị con: `{ value, hexCode?, sortOrder? }`. |
| `PUT` | `/api/attributes/values/:id` | Admin | Sửa giá trị con. |
| `DELETE`| `/api/attributes/values/:id` | Admin | Xóa giá trị con. |

---

### 5.6 Products & Variants
| Method | Endpoint | Quyền | Mô tả & Logic đặc thù |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Query filter: `gender` (MALE/FEMALE/UNISEX/KIDS), `category` (slug hoặc ID), `collectionSlug`.<br>**Đặc thù Category:** Tự động đệ quy tìm tất cả danh mục con của danh mục được chọn để query toàn bộ sản phẩm thuộc nhánh đó. |
| `GET` | `/api/products/:slug` | Public | Chi tiết 1 sản phẩm: Đầy đủ variants, attributes, images. |
| `POST` | `/api/products` | Admin | Tạo sản phẩm phức hợp trong 1 Transaction duy nhất:<br>- Insert `Product`<br>- Insert `ProductImage[]`<br>- Insert `ProductVariant[]`<br>- Insert `VariantAttributeValue[]`<br>- Insert `VariantImage[]`. |
| `PUT` | `/api/products/:id` | Admin | Cập nhật thông tin sản phẩm và thay thế ảnh. |
| `DELETE`| `/api/products/:id` | Admin | Xóa sản phẩm. |
| `PUT` | `/api/variants/:variantId` | Admin | Cập nhật SKU, giá override, trọng lượng của 1 variant. |
| `DELETE`| `/api/variants/:variantId` | Admin | Xóa variant. |
| `PATCH` | `/api/variants/:variantId/stock` | Admin | Body: `{ changeQty, reason, note }`<br>Transaction: Tăng/giảm `stockQty` và tự động ghi `InventoryLog`. |

---

### 5.7 Cart
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Auth | Lấy toàn bộ giỏ hàng của user hiện tại (kèm thông tin variant, product, ảnh đại diện, thuộc tính size/color). |
| `POST` | `/api/cart` | Auth | Body: `{ variantId, quantity }`<br>Kiểm tra tồn kho: `stockQty >= quantity`.<br>Nếu đã có trong giỏ thì cộng dồn (`increment`), chưa có thì tạo mới (Upsert). |
| `PUT` | `/api/cart/:variantId` | Auth | Body: `{ quantity }`<br>Ghi đè số lượng cho 1 item trong giỏ (nút tăng/giảm số lượng). |
| `DELETE`| `/api/cart/:variantId` | Auth | Xóa 1 mặt hàng khỏi giỏ. |

---

### 5.8 Coupons
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/coupons` | Admin | Phân trang danh sách mã giảm giá. |
| `POST` | `/api/admin/coupons` | Admin | Body: `{ code, type, value, minOrderValue?, maxDiscount?, usageLimit?, startDate?, endDate?, isActive? }`. |
| `PUT` | `/api/admin/coupons/:id` | Admin | Cập nhật mã giảm giá (check tránh trùng code). |
| `DELETE`| `/api/admin/coupons/:id` | Admin | Xóa mã giảm giá. |
| `POST` | `/api/coupons/validate` | Public | Body: `{ code, orderValue }`<br>Kiểm tra tính hợp lệ và trả về số tiền được giảm (`discountAmount`). |

---

### 5.9 Orders & Checkout
| Method | Endpoint | Quyền | Mô tả & Logic cốt lõi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/checkout` | Auth | **Trọng yếu:** Đặt hàng Checkout (DB Transaction + Row Lock chống Oversell + Trừ tồn kho + Ghi Log kho + Snapshot OrderItem + Xóa giỏ hàng). |
| `GET` | `/api/orders/:orderCode/payment-status` | Public | Trả về `{ paymentStatus, status }` phục vụ Frontend Polling kiểm tra trạng thái thanh toán sau khi quét mã QR. |
| `GET` | `/api/orders/me` | Auth | Lấy danh sách đơn hàng của khách hiện tại. |
| `GET` | `/api/orders/me/:id` | Auth | Xem chi tiết 1 đơn hàng của khách. |
| `PUT` | `/api/orders/:id/cancel` | Auth | Khách tự hủy đơn hàng.<br>**Điều kiện:** Đơn phải đang ở trạng thái `PENDING`. Tự động hoàn lại tồn kho và ghi log `RETURN`. |
| `GET` | `/api/admin/orders` | Admin | Quản lý danh sách toàn bộ đơn hàng (phân trang, lọc theo status). |
| `GET` | `/api/admin/orders/:id` | Admin | Xem chi tiết đơn hàng phía Admin. |
| `PUT` | `/api/admin/orders/:id/status` | Admin | Cập nhật trạng thái đơn hàng (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`). |
| `PUT` | `/api/admin/orders/:id/cancel` | Admin | Admin hủy đơn hàng (hoàn kho, ghi log lý do hủy). |

---

### 5.10 Webhooks (SePay)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/webhooks/sepay` | Bearer Token | Nhận biến động số dư ngân hàng từ SePay, trích xuất mã đơn `ORD-...`, xác minh số tiền, chuyển đơn sang `PAID` và ghi nhận bản ghi `Payment`. |

---

### 5.11 Inventory
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/inventory/logs` | Admin | Xem lịch sử nhập xuất kho (phân trang, lọc theo variantId, tự động nối chuỗi thuộc tính Size, Màu). |
| `POST` | `/api/admin/inventory/restock` | Admin | Body: `{ variantId, quantity, note }`<br>Nhập hàng thủ công: Tăng kho và tạo log `RESTOCK`. |

---

### 5.12 Wishlist
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | Auth | Lấy danh sách sản phẩm yêu thích của user. |
| `POST` | `/api/wishlist` | Auth | Body: `{ productId }`<br>Cơ chế Toggle: Đã like thì bỏ like, chưa like thì thêm vào. |

---

### 5.13 Reviews
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Auth | Gửi đánh giá cho sản phẩm.<br>**Điều kiện:** Phải có `orderItemId` của đơn hàng đã `DELIVERED` và chưa từng đánh giá item này trước đây. |
| `GET` | `/api/products/:id/reviews` | Public | Lấy danh sách review đã được duyệt (`APPROVED`) của sản phẩm kèm điểm trung bình rating (`averageRating`). |
| `GET` | `/api/admin/reviews` | Admin | Quản lý toàn bộ review (Lọc theo PENDING/APPROVED/REJECTED). |
| `PUT` | `/api/admin/reviews/:id/status` | Admin | Duyệt hoặc từ chối review (`status: APPROVED / REJECTED`). |

---

### 5.14 CMS & Settings
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings/homepage` | Public | Lấy cấu hình JSON trang chủ (banner, flash sale, collections). |
| `GET` | `/api/admin/settings/:key` | Admin | Xem cấu hình theo key. |
| `PUT` | `/api/admin/settings/:key` | Admin | Cập nhật cấu hình JSON theo key (Upsert). |

---

### 5.15 Admin Dashboard Stats
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/stats` | Admin | Thống kê tổng quan:<br>- `totalOrders`: Tổng số đơn hàng<br>- `totalUsers`: Tổng số khách hàng<br>- `totalRevenue`: Tổng doanh thu từ các đơn `PAID`<br>- `lowStockVariants`: Danh sách sản phẩm sắp hết hàng (`stockQty < 10`). |

---

### 5.16 Media Upload
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | Auth | Upload tối đa 5 file ảnh cùng lúc qua Multer.<br>Lưu trữ tại `/uploads`, trả về danh sách URLs. |

---

## 6. XỬ LÝ NGOẠI LỆ & QUY ƯỚC PHẢN HỒI (ERROR HANDLING & RESPONSE STANDARD)

### 6.1 Chuẩn Lỗi nghiệp vụ (`ApiError`)
Express đang định nghĩa lớp lỗi:
```typescript
export class ApiError extends Error {
    statusCode: number;
    code?: string;
    details?: unknown;
}
```

### 6.2 Format Phản hồi Lỗi (Error Response Format)
- **Lỗi Validation (422 Unprocessable Entity):**
  ```json
  {
    "message": "Dữ liệu không hợp lệ",
    "errors": [
      {
        "field": "email",
        "message": "Email không đúng định dạng",
        "code": "invalid_string"
      }
    ]
  }
  ```
- **Lỗi Nghiệp vụ thông thường (400, 401, 403, 404, 409):**
  ```json
  {
    "message": "Sản phẩm Áo thun (Phân loại: AT-M) chỉ còn 2 trong kho!",
    "code": "INSUFFICIENT_STOCK",
    "details": null
  }
  ```
- **Lỗi Hệ thống không lường trước (500 Internal Server Error):**
  ```json
  {
    "message": "Đã có lỗi xảy ra ở server"
  }
  ```

---

## 7. BẢN ĐỒ QUY HOẠCH CHUYỂN ĐỔI SANG NESTJS (NESTJS MIGRATION BLUEPRINT)

Khi bắt đầu triển khai trong repo NestJS (`Nest_Docker/be`), ta sẽ tái cấu trúc từ mô hình phẳng của Express sang **Kiến trúc Modular hướng đối tượng (NestJS Architecture)**:

### 7.1 Cấu trúc Thư mục Dự kiến trong NestJS (`src/`)

```text
src/
├── app.module.ts                   # Root Module liên kết các feature modules
├── main.ts                         # Bootstrap server, Swagger, Global Pipes, Filters
│
├── common/                         # Shared utilities, Guards, Decorators, Filters
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   ├── roles.decorator.ts         # @Roles('ADMIN', 'USER')
│   │   └── public.decorator.ts        # @Public()
│   ├── filters/
│   │   └── http-exception.filter.ts   # Bắt lỗi toàn cục chuẩn theo format Express cũ
│   ├── guards/
│   │   ├── jwt-auth.guard.ts          # Xác thực Access Token
│   │   └── roles.guard.ts             # Phân quyền Admin/User
│   └── interceptors/
│       └── transform.interceptor.ts   # Định dạng output đồng nhất
│
├── prisma/                         # Tích hợp Prisma ORM
│   ├── prisma.module.ts            # Global Prisma Module
│   └── prisma.service.ts           # Quản lý vòng đời kết nối DB ($connect, $disconnect)
│
├── mail/                           # Module gửi mail OTP
│   ├── mail.module.ts
│   └── mail.service.ts
│
└── modules/                        # Danh sách 16 Feature Modules
    ├── auth/                       # Đăng ký, đăng nhập, verify OTP, refresh token
    ├── users/                      # Profile, Admin quản lý người dùng
    ├── addresses/                  # Sổ địa chỉ giao hàng
    ├── categories/                 # Quản lý danh mục cây phân cấp
    ├── collections/                # Quản lý bộ sưu tập
    ├── attributes/                 # Thuộc tính & Giá trị (Color, Size)
    ├── products/                   # Quản lý sản phẩm & biến thể, lọc đệ quy
    ├── cart/                       # Quản lý giỏ hàng
    ├── coupons/                    # Quản lý & validate mã giảm giá
    ├── orders/                     # Đặt hàng (Transaction + Row lock), hủy đơn
    ├── webhooks/                   # Webhook SePay banking
    ├── inventory/                  # Lịch sử kho & nhập hàng thủ công
    ├── wishlist/                   # Danh sách yêu thích (toggle)
    ├── reviews/                    # Đánh giá đơn hàng
    ├── settings/                   # Cấu hình CMS giao diện
    ├── dashboard/                  # Thống kê doanh thu admin
    └── upload/                     # Upload file ảnh tĩnh
```

### 7.2 Lộ trình Di chuyển Từng Bước (Step-by-Step Migration Roadmap)

1. **Bước 1: Khởi tạo Database & Prisma Module**
   - Di chuyển file `prisma/schema.prisma` từ Express sang NestJS.
   - Tạo `PrismaService` kế thừa `PrismaClient` và triển khai `OnModuleInit`.
   - Export `PrismaModule` ở dạng `@Global()`.

2. **Bước 2: Triển khai Infrastructure & Core Framework (Common)**
   - Thiết lập `HttpExceptionFilter` toàn cục để duy trì đúng format error payload như Express.
   - Cài đặt cấu hình CORS, Cookie-parser, Validation Pipe (`class-validator` hoặc `nestjs-zod`).
   - Thiết lập `MailModule` (Nodemailer) gửi OTP.

3. **Bước 3: Auth & Users Module**
   - Tạo `AuthService`, `AuthController`.
   - Triển khai `JwtStrategy`, `JwtAuthGuard` (hỗ trợ lấy token từ cả Cookie và Authorization Header).
   - Triển khai `RolesGuard` với Decorator `@Roles()`.

4. **Bước 4: Catalog Modules (Categories, Collections, Attributes, Products)**
   - Migrate logic đệ quy tìm kiếm danh mục con.
   - Migrate Transaction tạo sản phẩm phức hợp (Product + Images + Variants + Attribute Values).

5. **Bước 5: Cart & Coupons Module**
   - Triển khai logic giỏ hàng (Upsert, kiểm tra tồn kho).
   - Triển khai thuật toán kiểm tra và tính toán giảm giá Coupon.

6. **Bước 6: Orders & Checkout (Trọng yếu)**
   - Tái lập trình logic Transaction + Pessimistic Row Lock (`SELECT ... FOR UPDATE`) trong `OrderService.checkout`.
   - Tái lập trình logic hủy đơn hoàn kho `cancelOrder`.

7. **Bước 7: Webhooks (SePay Payment)**
   - Triển khai regex trích xuất mã đơn và tự động xác nhận đơn hàng khi SePay bắn webhook.

8. **Bước 8: Inventory, Wishlist, Reviews, Settings, Dashboard, Upload**
   - Hoàn thiện các module phụ trợ còn lại.
   - Viết unit test / e2e test với Vitest sẵn có trong repo NestJS.
