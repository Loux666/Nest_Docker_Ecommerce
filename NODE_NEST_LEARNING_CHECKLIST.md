# 📚 CẨM NANG & CHECKLIST LÀM CHỦ BACKEND: NODE.JS, TYPESCRIPT & NESTJS

> **Mục tiêu:** Giúp bạn nắm vững bản chất 4 trụ cột cốt lõi của Backend hiện đại: **TypeScript Core**, **Asynchronous Programming**, **Node.js Runtime**, và **NestJS Architecture**.  
> Mỗi phần đều đi kèm **Lý thuyết bản chất** và **Ví dụ thực tế trực tiếp trong dự án E-Commerce** này.

---

## 📊 BẢNG TIẾN ĐỘ HỌC TẬP TỔNG QUAN

- [ ] **Trụ cột 1:** TypeScript Core (Hệ thống Kiểu dữ liệu & Siêu dữ liệu Decorators)
- [ ] **Trụ cột 2:** Asynchronous Programming (Bất đồng bộ, Event Loop & Concurrency)
- [ ] **Trụ cột 3:** Node.js Runtime (Cơ chế hoạt động bên dưới nắp ca-pô của Node)
- [ ] **Trụ cột 4:** NestJS Architecture (Kiến trúc Hướng đối tượng & Dependency Injection)

---

## 🏛️ TRỤ CỘT 1: TYPESCRIPT CORE (HỆ THỐNG KIỂU DỮ LIỆU THỰC CHIẾN)

> **Tại sao phải học?** NestJS được xây dựng 100% bằng TypeScript. Không nắm vững TypeScript, bạn sẽ chỉ "copy-paste" code mà không hiểu tại sao Decorator hoạt động, tại sao DTO tự validate được, hoặc tại sao Prisma sinh ra được các type an toàn tuyệt đối.

### 📋 Checklist Kiến thức:
- [ ] **1.1 Primitive Types, Union & Intersection Types**
  - Hiểu `string`, `number`, `boolean`, `null`, `undefined`.
  - Union (`|`): Ví dụ trạng thái đơn hàng `OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED'`.
  - Intersection (`&`): Ghép kiểu dữ liệu.
- [ ] **1.2 Interface vs Type Alias (Khi nào dùng cái nào?)**
  - `interface`: Dành cho định nghĩa cấu trúc đối tượng, có khả năng mở rộng (declaration merging).
  - `type`: Linh hoạt hơn cho Unions, Primitives, Tuples.
- [ ] **1.3 Generics (Lập trình tham số hóa kiểu dữ liệu)**
  - Viết các hàm, class hoặc interface dùng lại cho nhiều kiểu dữ liệu khác nhau.
  - Cực kỳ hữu dụng khi viết `ApiResponse<T>`, `PaginatedResult<T>`.
- [ ] **1.4 TypeScript Utility Types hay dùng nhất trong E-commerce**
  - `Partial<T>`: Biến mọi thuộc tính thành tùy chọn (Dùng cho Update DTO).
  - `Pick<T, Keys>`: Chỉ chọn một vài thuộc tính.
  - `Omit<T, Keys>`: Bỏ đi thuộc tính không mong muốn (ví dụ giấu `password` của User).
  - `Record<K, T>`: Kiểu Dictionary/Map key-value.
- [ ] **1.5 Decorators & Metadata Reflection (`reflect-metadata`)**
  - Bản chất: Decorator là một hàm bọc (Wrapper/Higher-order function) gắn thêm metadata vào Class, Method, Property hoặc Parameter.
  - Hiểu cách `@Injectable()`, `@Controller()`, `@Post()`, `@Body()` hoạt động dưới nền.

---

### 💡 VÍ DỤ THỰC TẾ TRONG DỰ ÁN E-COMMERCE:

#### Ví dụ 1: Generic Paginated Response (Chuẩn hóa dữ liệu trả về cho Frontend)
```typescript
// Định nghĩa khuôn mẫu phân trang chung cho bất kỳ Entity nào (Product, Order, User)
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Khi dùng thực tế cho Product:
async function getProducts(): Promise<PaginatedResult<Product>> {
  // TypeScript sẽ tự động gợi ý toàn bộ thuộc tính của Product trong mảng data
  return {
    data: products,
    meta: { total: 100, page: 1, limit: 10, totalPages: 10 }
  };
}
```

#### Ví dụ 2: Dùng `Omit` giấu Password của User
```typescript
import { User } from '@prisma/client';

// Kiểu trả về cho Client: Có đầy đủ thông tin User nhưng KHÔNG CÓ password và otp_code
export type SafeUser = Omit<User, 'password' | 'otp_code'>;

function sanitizeUser(user: User): SafeUser {
  const { password, otp_code, ...safeUser } = user;
  return safeUser;
}
```

---

## ⚡ TRỤ CỘT 2: ASYNCHRONOUS PROGRAMMING (BẤT ĐỒNG BỘ TRONG NODE.JS)

> **Tại sao phải học?** 99% tác vụ Backend trong E-Commerce (query database, gọi webhook SePay, gửi email OTP, lưu file ảnh) đều là tác vụ **I/O Bất đồng bộ**. Không hiểu async/await sẽ dẫn đến lỗi race condition, thất thoát đơn hàng hoặc làm server đơ cứng.

### 📋 Checklist Kiến thức:
- [ ] **2.1 Bản chất của Promise**
  - 3 trạng thái: `Pending` -> `Fulfilled` (Resolved) hoặc `Rejected`.
  - Chuỗi `.then().catch().finally()`.
- [ ] **2.2 Cú pháp `async / await` & Xử lý lỗi với `try / catch`**
  - Bản chất: `async/await` là syntactic sugar (cú pháp bọc đẹp hơn) của Promise.
  - Bắt buộc phải có `try/catch` hoặc Global Exception Filter để tránh lỗi `UnhandledPromiseRejection`.
- [ ] **2.3 Chạy song song với `Promise.all` vs `Promise.allSettled`**
  - `Promise.all`: Chạy nhiều promise cùng lúc, nếu 1 promise fail -> tất cả fail. Tối ưu tốc độ gấp 3-4 lần so với await tuần tự.
  - `Promise.allSettled`: Chạy hết dù có promise bị lỗi (dùng khi gửi email hàng loạt).
- [ ] **2.4 Race Condition & Concurrency Control (Tranh chấp tài nguyên)**
  - Tình huống: 2 người cùng bấm nút mua sản phẩm cuối cùng tại cùng 1 mili-giây.
  - Giải pháp: Pessimistic Row Lock (`SELECT ... FOR UPDATE`) và Database Transaction.

---

### 💡 VÍ DỤ THỰC TẾ TRONG DỰ ÁN E-COMMERCE:

#### Ví dụ 1: Tối ưu Dashboard Stats bằng `Promise.all` (Giảm thời gian từ 400ms xuống 100ms)
```typescript
// ❌ CÁCH CHẬM: Chạy tuần tự (mất 100ms + 100ms + 100ms = 300ms)
const totalOrders = await this.prisma.order.count();
const totalUsers = await this.prisma.user.count();
const totalRevenue = await this.prisma.order.aggregate({ _sum: { totalAmount: true } });

// ✅ CÁCH NHANH: Chạy đồng thời 3 câu query cùng lúc (chỉ mất ~100ms)
const [totalOrders, totalUsers, revenueAggr] = await Promise.all([
  this.prisma.order.count(),
  this.prisma.user.count(),
  this.prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { paymentStatus: 'PAID' }
  })
]);
```

#### Ví dụ 2: Concurrency & Transaction (Chống Oversell khi thanh toán giỏ hàng)
```typescript
// Bắt buộc gom toàn bộ luồng trừ kho và tạo đơn vào 1 Transaction duy nhất:
await this.prisma.$transaction(async (tx) => {
  // 1. Khóa dòng của variant lại, các request khác phải đứng đợi
  await tx.$executeRawUnsafe(`SELECT id FROM product_variants WHERE id = '${variantId}' FOR UPDATE`);
  
  // 2. Check kho an toàn 100% không lo bị luồng khác sửa đè
  const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
  if (variant.stockQty < quantity) {
    throw new BadRequestException('Hết hàng!');
  }

  // 3. Trừ kho và tạo Order
  await tx.productVariant.update({ where: { id: variantId }, data: { stockQty: { decrement: quantity } } });
  await tx.order.create({ /* ... */ });
});
```

---

## ⚙️ TRỤ CỘT 3: NODE.JS RUNTIME (HIỂU BÊN DƯỚI NẮP CA-PÔ)

> **Tại sao phải học?** Node.js nổi tiếng là **Single Threaded** (chạy đơn luồng Javascript). Nếu bạn không hiểu cơ chế Event Loop, bạn có thể vô tình viết 1 hàm tính toán nặng làm "treo" toàn bộ server, khiến hàng nghìn khách hàng khác không thể vào mua sắm!

### 📋 Checklist Kiến thức:
- [ ] **3.1 Kiến trúc Single Thread & Non-blocking I/O**
  - Javascript chạy trên 1 luồng chính (Main Call Stack).
  - Các tác vụ nặng về I/O (Database, Network, File) được giao cho thư viện C++ **Libuv** chạy ngầm ở Thread Pool.
- [ ] **3.2 Vòng lặp sự kiện (Event Loop Mechanics)**
  - Các pha của Event Loop: `Timers` -> `Pending Callbacks` -> `Poll (I/O)` -> `Check (setImmediate)` -> `Close Callbacks`.
  - Microtasks (`process.nextTick`, `Promise`) luôn được ưu tiên xử lý trước Macrotasks (`setTimeout`).
- [ ] **3.3 Không bao giờ chặn Call Stack (Don't Block the Event Loop)**
  - Tránh các hàm đồng bộ nặng: `fs.readFileSync`, vòng lặp hàng triệu lần, regex quá phức tạp (ReDoS).
- [ ] **3.4 Quản lý biến môi trường (`process.env`) & Configuration**
  - Cách Node.js nạp file `.env`.
  - Tại sao không nên gọi `process.env` bừa bãi trong NestJS (Dùng `ConfigService` để type-safe).
- [ ] **3.5 Streams & Buffers (Xử lý Upload File)**
  - Hiểu cách Multer nhận file ảnh dưới dạng Buffer bộ nhớ hoặc Stream ghi trực tiếp xuống ổ cứng.

---

### 💡 VÍ DỤ THỰC TẾ TRONG DỰ ÁN E-COMMERCE:

#### Ví dụ: Khác biệt giữa Blocking và Non-blocking khi Upload ảnh
```typescript
// ❌ CẤM DÙNG: Ghi file đồng bộ (Làm treo toàn bộ server trong lúc đang ghi ổ đĩa)
import fs from 'fs';
fs.writeFileSync('/uploads/ao-khoac.jpg', fileBuffer); // Các user khác bị đơ chờ!

// ✅ CHUẨN XỊN: Dùng non-blocking I/O qua Promises hoặc Stream
import fs from 'fs/promises';
await fs.writeFile('/uploads/ao-khoac.jpg', fileBuffer); // Giao cho Libuv, luồng chính vẫn tiếp tục nhận order của khách khác
```

---

## 🦁 TRỤ CỘT 4: NESTJS FRAMEWORK ARCHITECTURE (CHUẨN DOANH NGHIỆP)

> **Tại sao phải học?** NestJS không phải là một framework ngẫu hứng như Express. Nó áp dụng các Design Pattern kinh điển của ngành công nghiệp phần mềm: **Dependency Injection**, **Inversion of Control (IoC)**, **Modular Architecture**, và **AOP (Aspect-Oriented Programming)**.

### 📋 Checklist Kiến thức:
- [ ] **4.1 Vòng đời của một HTTP Request trong NestJS (Request Lifecycle)**
  - Thứ tự đi qua: `Incoming Request` -> `Middleware` -> `Guards` -> `Interceptors (Pre)` -> `Pipes` -> `Controller / Service` -> `Interceptors (Post)` -> `Exception Filters` -> `Response`.
- [ ] **4.2 Modules & Dependency Injection (DI Container)**
  - Khái niệm `@Module({ imports, controllers, providers, exports })`.
  - Token injection: NestJS tự tìm xem Service nào cần gì để tự khởi tạo (`new Service()`), ta không phải `new` bằng tay.
- [ ] **4.3 Controllers & Services (Tách biệt Trách nhiệm - Separation of Concerns)**
  - `Controller`: Chỉ nhận request HTTP, kiểm tra auth, gọi service, trả response. Không viết câu lệnh Prisma/SQL trong controller!
  - `Service`: Nơi chứa toàn bộ Business Logic (tính giá tiền, trừ kho, gọi SePay...).
- [ ] **4.4 Data Transfer Objects (DTO) & Validation Pipes**
  - Kết hợp Class với `class-validator` (`@IsEmail()`, `@IsNotEmpty()`, `@Min()`).
  - Dữ liệu rác bị lọc bỏ tự động bằng `whitelist: true`.
- [ ] **4.5 Guards (Bảo mật & Phân quyền)**
  - `JwtAuthGuard`: Chặn người chưa đăng nhập.
  - `RolesGuard`: Chặn người không phải `ADMIN`.
- [ ] **4.6 Exception Filters (Bắt lỗi toàn cục)**
  - Chuẩn hóa format lỗi cho toàn hệ thống để Frontend dễ bắt lỗi.
- [ ] **4.7 Swagger Documentation Tự động**
  - Gắn Decorator `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` để tự sinh tài liệu API chạy được trên web.

---

### 💡 VÍ DỤ THỰC TẾ TRONG DỰ ÁN E-COMMERCE:

#### Ví dụ 1: Request DTO tự động validate mã giảm giá
```typescript
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SALE50', description: 'Mã giảm giá khách hàng nhập' })
  @IsString({ message: 'Mã giảm giá phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã giảm giá' })
  code: string;

  @ApiProperty({ example: 500000, description: 'Giá trị đơn hàng hiện tại (VNĐ)' })
  @IsNumber({}, { message: 'Giá trị đơn hàng phải là số tiền' })
  @Min(0, { message: 'Giá trị đơn hàng không được nhỏ hơn 0' })
  orderValue: number;
}
```

#### Ví dụ 2: Controller chuẩn chỉ (Siêu gọn, chỉ 5 dòng code)
```typescript
@ApiTags('Coupons')
@Controller('coupons')
export class CouponController {
  // Tiêm CouponService vào qua Dependency Injection
  constructor(private readonly couponService: CouponService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Khách kiểm tra mã giảm giá trước khi đặt hàng' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    // Dữ liệu đã tự động validate 100% nhờ ValidationPipe trước khi vào đây
    return await this.couponService.validateCoupon(dto.code, dto.orderValue);
  }
}
```

#### Ví dụ 3: Custom Decorator lấy thông tin User đang đăng nhập (`@CurrentUser()`)
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Trả về thông tin { id, role, email } từ JWT
  },
);

// Cách dùng trong Controller cực kỳ sang xịn mịn:
@Get('cart')
@UseGuards(JwtAuthGuard)
async getMyCart(@CurrentUser() user: any) {
  return await this.cartService.getCart(user.id);
}
```

---

## 🎯 LỘ TRÌNH ĐỀ XUẤT ĐỂ BẠN HỌC & LÀM SONG HÀNH

Không cần phải đọc lý thuyết suông hàng tuần trời! Cách học lập trình nhanh nhất là **"Học khái niệm nào -> Code ngay tính năng đó vào dự án"**:

1. **Khi làm Phase 1 (Core & PrismaModule):** Học về **NestJS Modules**, **Dependency Injection**, và **Global Exception Filters**.
2. **Khi làm Phase 2 (Auth & Users):** Học về **JWT Guards**, **Decorators (`@CurrentUser`)**, và **DTO Validation Pipes**.
3. **Khi làm Phase 3 (Catalog & Products):** Học về **TypeScript Generics**, **Query Filters đệ quy**, và **File Upload Buffers**.
4. **Khi làm Phase 5 (Checkout & SePay):** Học sâu về **Async Concurrency**, **Pessimistic Row Lock**, và **Database Transactions**.
