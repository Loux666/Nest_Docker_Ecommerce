# ==========================================
# GIAI ĐOẠN 1: BUILD (Builder Stage)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt OpenSSL (Prisma trên Alpine Linux cần thư viện này)
RUN apk add --no-cache openssl

# Copy file định nghĩa package để tận dụng Docker Cache
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để build NestJS)
RUN npm install

# Tự động sinh Prisma Client types
RUN npx prisma generate

# Copy toàn bộ mã nguồn vào container
COPY . .

# Build dự án NestJS sang Javascript thuần trong thư mục dist/
RUN npm run build

# Xóa bớt devDependencies để tối ưu dung lượng
RUN npm prune --production

# ==========================================
# GIAI ĐOẠN 2: PRODUCTION RUNNER (Siêu nhẹ)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy các file cần thiết từ builder stage sang
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Khởi chạy server NestJS
CMD ["node", "dist/main"]
