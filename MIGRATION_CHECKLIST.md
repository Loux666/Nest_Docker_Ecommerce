# 🚀 NESTJS E-COMMERCE MIGRATION CHECKLIST & ROADMAP

> **Mục tiêu:** Di chuyển và nâng cấp toàn bộ hệ thống E-Commerce từ Express.js sang NestJS chuẩn kiến trúc Modular, Dependency Injection, Type-safe và sẵn sàng Production.  
> **Tài liệu tham chiếu đặc tả:** [EXPRESS_SPECS.md](file:///d:/PJ/Nest_Docker/be/EXPRESS_SPECS.md)

---

## 📊 TIẾN ĐỘ TỔNG QUAN
- [x] **Phase 0:** Setup Môi trường & Database Prisma (Khởi động) - HOÀN THÀNH
- [ ] **Phase 1:** Cấu hình Core Framework & Global Infrastructure
- [ ] **Phase 2:** Authentication, Security & User Management
- [ ] **Phase 3:** Product Catalog & Media Upload
- [ ] **Phase 4:** Cart & Coupons System
- [ ] **Phase 5:** Orders, Checkout Anti-Oversell & SePay Webhook
- [ ] **Phase 6:** Inventory, Reviews, CMS & Dashboard Stats
- [ ] **Phase 7:** Hoàn thiện, Dockerfile & Testing

---

## 🛠️ CHI TIẾT CÁC GIAI ĐOẠN (STEP-BY-STEP CHECKLIST)

---

### 🟢 PHASE 0: SETUP MÔI TRƯỜNG & DATABASE PRISMA *(ĐÃ HOÀN THÀNH)*
> **Mục tiêu:** Chạy được container MySQL trên Docker, cấu hình Prisma trong NestJS, migrate thành công 13 bảng vào database.

- [x] **0.1 Chạy Docker MySQL**
  - Chạy `docker compose up -d db`.
  - Container `nest_ecommerce_db` đang chạy ở cổng 3306.
- [x] **0.2 Cài đặt dependencies cho NestJS & Prisma**
  - Đã cài `@prisma/client`, `prisma@5.14`.
  - Đã cài `@nestjs/config`, `class-validator`, `class-transformer`, `cookie-parser`, `@nestjs/swagger`, `swagger-ui-express`.
- [x] **0.3 Thiết lập Biến môi trường (`.env` & `.env.example`)**
  - Cấu hình `DATABASE_URL="mysql://root:root_password_123@localhost:3306/nest_ecommerce_db"`.
  - Cấu hình JWT, SMTP Mailtrap, SePay token.
- [x] **0.4 Khởi tạo Prisma Schema & Migrate**
  - Copy toàn bộ schema từ Express sang `prisma/schema.prisma`.
  - Đã chạy thành công `npx prisma migrate dev --name init_ecommerce_db`.
  - Đã sinh migration SQL và Prisma Client TypeScript types.

---

### 🟢 PHASE 1: CORE FOUNDATION & GLOBAL INFRASTRUCTURE
> **Mục tiêu:** Xây dựng khung chuẩn NestJS (Global Pipes, Filters, Swagger, Prisma Service).

- [ ] **1.1 Xây dựng `PrismaModule` & `PrismaService`**
  - Tạo `src/prisma/prisma.service.ts` kết nối DB (`OnModuleInit`).
  - Tạo `src/prisma/prisma.module.ts` gắn `@Global()` để dùng ở mọi nơi không cần import lại.
- [ ] **1.2 Cấu hình Global Exception Filter**
  - Tạo `src/common/filters/http-exception.filter.ts`.
  - Giữ nguyên cấu trúc trả lỗi đồng nhất từ Express: `{ message, code?, errors?, details? }`.
- [ ] **1.3 Cấu hình Global Validation Pipe & Transform**
  - Kích hoạt `ValidationPipe({ whitelist: true, transform: true })` trong `main.ts`.
- [ ] **1.4 Cấu hình Middleware cơ bản & Swagger**
  - Cấu hình Global Prefix: `/api`.
  - Cấu hình CORS (`credentials: true`, `origin: 'http://localhost:5173'`).
  - Cấu hình `cookie-parser`.
  - Tích hợp `@nestjs/swagger` để tự sinh UI test API tại `http://localhost:3000/api/docs`.

---

### 🟢 PHASE 2: AUTH, SECURITY & USER MANAGEMENT
> **Mục tiêu:** Đăng ký, đăng nhập JWT, gửi OTP qua mail, phân quyền Role Guard.

- [ ] **2.1 Mail Module (Nodemailer)**
  - Tạo `MailModule`, `MailService` gửi mã OTP 6 số qua Gmail SMTP.
- [ ] **2.2 Auth Module**
  - Cài đặt `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`.
  - Tạo `AuthModule`, `AuthService`, `AuthController`.
  - Viết DTO: `RegisterDto`, `LoginDto`, `VerifyOtpDto`, `RefreshTokenDto`.
  - Endpoint `POST /api/register` (Tạo user, sinh OTP 6 số, gửi mail).
  - Endpoint `POST /api/otp/verify` (Xác thực OTP, cấp Access Token & Refresh Token).
  - Endpoint `POST /api/login` (Check password, tự động gửi OTP nếu chưa verify).
  - Endpoint `POST /api/refresh-token` & `POST /api/logout`.
- [ ] **2.3 Guards & Decorators**
  - `JwtAuthGuard` (Hỗ trợ đọc token từ Header `Authorization` và Cookie `accessToken`).
  - `RolesGuard` + Decorator `@Roles('ADMIN', 'USER')`.
  - Custom Decorator `@CurrentUser()` để lấy user từ request.
  - Decorator `@Public()` để bypass auth trên các route mở.
- [ ] **2.4 Users Module**
  - `UsersModule`, `UsersService`, `UsersController`.
  - `GET /api/profile` & `PUT /api/profile`.
  - `GET /api/admin/users` & `PUT /api/admin/users/:id/status`.
- [ ] **2.5 Addresses Module (Sổ địa chỉ)**
  - `AddressesModule`: CRUD địa chỉ giao hàng.
  - Logic tự động unset `isDefault` cũ khi user tạo/sửa địa chỉ mặc định mới.

---

### 🟢 PHASE 3: PRODUCT CATALOG & MEDIA UPLOAD
> **Mục tiêu:** Quản lý danh mục đệ quy, thuộc tính biến thể, upload ảnh và tạo sản phẩm đa biến thể.

- [ ] **3.1 Categories Module**
  - `GET /api/categories` (Hỗ trợ query cây cha - con).
  - CRUD Category cho Admin.
- [ ] **3.2 Collections Module**
  - CRUD Bộ sưu tập, liên kết nhiều-nhiều với sản phẩm.
- [ ] **3.3 Attributes & Values Module**
  - CRUD Attributes (Size, Màu sắc...) và AttributeValues.
- [ ] **3.4 Upload Module**
  - Cấu hình Multer lưu ảnh vào thư mục `public/uploads`.
  - Phục vụ static assets với `express.static` hoặc `ServeStaticModule`.
- [ ] **3.5 Products & Variants Module**
  - Thuật toán `getAllProducts`: Filter theo `gender`, `collectionSlug`, và đệ quy tìm tất cả danh mục con của `categoryId`.
  - `POST /api/products`: Transaction tạo Product + Images + Variants + Attribute Values.
  - CRUD Variants & Update Stock (`PATCH /api/variants/:variantId/stock` kèm ghi `InventoryLog`).

---

### 🟢 PHASE 4: CART & COUPONS SYSTEM
> **Mục tiêu:** Quản lý giỏ hàng real-time và hệ thống mã giảm giá.

- [ ] **4.1 Cart Module**
  - `GET /api/cart`: Lấy giỏ hàng chi tiết kèm giá, ảnh, thuộc tính.
  - `POST /api/cart`: Upsert sản phẩm (cộng dồn `quantity`, kiểm tra `stockQty`).
  - `PUT /api/cart/:variantId`: Điều chỉnh số lượng trực tiếp.
  - `DELETE /api/cart/:variantId`: Xóa item khỏi giỏ.
- [ ] **4.2 Coupons Module**
  - Admin CRUD Coupons (Percentage, Fixed Amount, Free Shipping).
  - Public `POST /api/coupons/validate`: Kiểm tra hạn sử dụng, điều kiện minOrderValue, tính toán `discountAmount`.

---

### 🟢 PHASE 5: ORDERS, CHECKOUT ANTI-OVERSELL & SEPAY WEBHOOK *(TRỌNG TÂM)*
> **Mục tiêu:** Đặt hàng an toàn chịu tải cao, thanh toán tự động qua SePay.

- [ ] **5.1 Orders Module - Checkout Logic**
  - Sắp xếp mảng `variantIds.sort()` chống Deadlock.
  - Khóa dòng Pessimistic Lock: `SELECT id FROM product_variants WHERE id IN (...) FOR UPDATE`.
  - Kiểm tra tồn kho từng mặt hàng & ném lỗi nếu hết.
  - Áp dụng Coupon, tăng `usedCount`, tạo `CouponUsage`.
  - Snapshot bất biến thông tin sản phẩm vào `OrderItem`.
  - Trừ kho `stockQty: decrement` + ghi `InventoryLog` (`reason: ORDER`).
  - Tự động dọn dẹp các sản phẩm đã mua khỏi giỏ hàng.
- [ ] **5.2 Order Management**
  - Polling trạng thái: `GET /api/orders/:orderCode/payment-status`.
  - User xem lịch sử đơn: `GET /api/orders/me`, `GET /api/orders/me/:id`.
  - Khách tự hủy đơn: `PUT /api/orders/:id/cancel` (Chỉ cho phép khi `PENDING`, hoàn lại kho và log `RETURN`).
  - Admin: Phân trang danh sách đơn, cập nhật trạng thái đơn hàng.
- [ ] **5.3 Webhooks Module (SePay Banking)**
  - `POST /api/webhooks/sepay`.
  - Validate SePay Token trong Authorization Header.
  - Regex trích xuất mã đơn `ORD-YYYYMMDD-XXXX`.
  - Xác nhận thanh toán đủ tiền -> chuyển đơn sang `PAID` và `CONFIRMED` + tạo bản ghi `Payment`.

---

### 🟢 PHASE 6: INVENTORY, REVIEWS, CMS & DASHBOARD
> **Mục tiêu:** Nghiệp vụ quản trị và trải nghiệm người dùng hoàn chỉnh.

- [ ] **6.1 Inventory Module**
  - `GET /api/admin/inventory/logs`: Xem lịch sử biến động kho.
  - `POST /api/admin/inventory/restock`: Nhập kho thủ công.
- [ ] **6.2 Reviews Module**
  - `POST /api/reviews`: Đánh giá sản phẩm (Bắt buộc đơn đã `DELIVERED`).
  - `GET /api/products/:id/reviews`: Lấy review đã duyệt (`APPROVED`) kèm tính điểm sao trung bình.
  - Admin duyệt/từ chối review.
- [ ] **6.3 Wishlist Module**
  - `GET /api/wishlist` & `POST /api/wishlist` (Cơ chế Toggle like/unlike).
- [ ] **6.4 Settings Module (CMS)**
  - Cấu hình JSON cho trang chủ (`homepage`).
- [ ] **6.5 Dashboard Module**
  - Thống kê doanh thu, tổng đơn, tổng khách và danh sách sản phẩm sắp hết hàng (`stockQty < 10`).

---

### 🟢 PHASE 7: TESTING & DOCKERIZING PRODUCTION
- [ ] Viết Unit Test & E2E Test với Vitest cho Auth và Checkout.
- [ ] Tối ưu hóa file `Dockerfile` chạy NestJS đa tầng (Multi-stage build).
- [ ] Kiểm thử toàn diện các luồng từ Frontend Vue 3 kết nối sang NestJS.

---

## 🎯 BƯỚC CẦN LÀM NGAY BÂY GIỜ (NEXT ACTION)
1. Bật Docker Desktop và khởi động container MySQL:
   ```bash
   docker compose up -d
   ```
2. Cài đặt các gói cốt lõi:
   ```bash
   npm install @prisma/client @nestjs/config class-validator class-transformer cookie-parser
   npm install -D prisma @types/cookie-parser
   ```
3. Copy `schema.prisma` từ Express sang NestJS và chạy migrate lần đầu!
