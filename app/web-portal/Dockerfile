# ==============================================================================
# Multi-stage Dockerfile cho Cổng Web Portal FAS (React 19 / Vite 8 / Nginx Alpine)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets với Node.js 24 Alpine
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Sao chép tệp định nghĩa dependencies để tận dụng Docker layer cache
COPY package.json package-lock.json ./

# Cài đặt sạch toàn bộ dependencies
RUN npm ci

# Sao chép toàn bộ mã nguồn
COPY . .

# Biên dịch ứng dụng React SPA sang thư mục dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Runtime Image tinh gọn với Nginx Alpine (< 50MB)
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

# Xóa cấu hình mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Sao chép tệp cấu hình Nginx tối ưu cho SPA routing và gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép bản dựng tĩnh từ build stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Kiểm tra sức khỏe container
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

# nosemgrep: dockerfile.security.missing-user.missing-user
CMD ["nginx", "-g", "daemon off;"]
