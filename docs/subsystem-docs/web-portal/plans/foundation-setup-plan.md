---
title: Web Portal Foundation Setup Plan
version: 3.0
status: Approved
owner: Web Lead & DevOps Engineer
type: plan
scope: WEB
updated: 2026-10-12
---

# FOUNDATION SETUP PLAN — Kế hoạch Thiết lập Nền tảng Phân hệ Web Portal

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Chuẩn bị hoàn chỉnh môi trường phát triển Node.js $\ge 24$, cấu hình Vite 8, React 19 với TypeScript, Tailwind CSS 4, tiêu chuẩn đóng gói container SPA và cơ chế sẵn sàng tích hợp cho phân hệ `app/web-portal`, kế thừa từ kế hoạch nền tảng hệ thống (`FND-SYS-001`, `FND-SYS-005`, `FND-SYS-008`).
* **Mục tiêu**:
  * Thiết lập môi trường thực thi Node.js LTS và cấu trúc dự án SPA chuẩn hóa với strict type checking.
  * Tích hợp Tailwind CSS và Design Tokens đồng bộ giao diện Dark Glassmorphism với Kiosk.
  * Cài đặt danh mục thư viện phụ trợ: Axios HTTP client, `@stomp/stompjs`, `sockjs-client`, Lucide Icons, Zustand state management.
  * Chuẩn hóa chuỗi đóng gói Dockerfile multi-stage Nginx phục vụ chạy container nhẹ và bảo mật.
  * Cấu hình Reverse Proxy chuyển hướng `/api` và `/ws-attendance` giải quyết triệt để vấn đề CORS.
  * Xây dựng bộ khung kiểm thử hợp đồng giao diện và mock client.

---

## 2. Approach Decisions (Quyết định Tiếp cận Nền tảng Web)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-WEB-008` | Đóng gói SPA bằng Nginx Alpine và cấu hình Reverse Proxy chống chặn CORS. | Phục vụ trang tĩnh hiệu năng cao, dung lượng siêu nhẹ ($< 50\text{ MB}$), đồng bộ endpoint `/api` với Backend mà không phụ thuộc cấu hình CORS trên máy chủ. | Sử dụng Node.js server động để phục vụ file tĩnh, Mở rộng CORS permitAll trên toàn bộ domain | Cần duy trì tệp cấu hình `nginx.conf` với luật định tuyến fallback `try_files $uri /index.html` cho SPA React Router. | `PD-001`, `STK-019` | Accepted |

---

## 3. Foundation Work Items (Hạng mục Thiết lập Nền tảng Web Portal)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-WEB-001` | Khởi tạo Dự án Vite & React TypeScript | Cấu hình `package.json`, `tsconfig.json`, `vite.config.ts` với strict type checking. | `STK-016`, `STK-017` | `FND-SYS-001` | Lệnh `npm run build` thành công; không có cảnh báo TypeScript. | Done |
| `FND-WEB-002` | Cấu hình Tailwind CSS & Design Tokens | Cài đặt Tailwind CSS, cấu hình font Inter và bảng mã màu đồng bộ với thiết kế Kiosk. | `STK-018` | `FND-WEB-001` | Các class Tailwind biên dịch chính xác; áp dụng được biến màu hệ thống. | Done |
| `FND-WEB-003` | Cài đặt Thư viện Phụ trợ Web | Khóa phiên bản và cài đặt `axios`, `@stomp/stompjs`, `sockjs-client`, `lucide-react`, `zustand`. | `STK-031`, `STK-033` | `FND-WEB-001` | `npm install` sạch sẽ; không có lỗ hổng bảo mật nghiêm trọng (`audit`). | Done |
| `FND-WEB-004` | Cấu hình Biến Môi trường & Proxy Dev | Thiết lập file `.env` chứa `VITE_API_BASE_URL` và cấu hình reverse proxy chuyển hướng trong Vite. | `STK-019`, `STK-034` | `FND-WEB-001` | Gọi API tới Backend qua đường dẫn tương đối `/api` thành công không bị CORS. | Done |
| `FND-WEB-005` | Chuẩn hóa Chuỗi Đóng gói Container SPA | Xây dựng Dockerfile multi-stage (`node:24-alpine` build $\rightarrow$ `nginx:alpine` runtime), cấu hình `nginx.conf` phục vụ SPA routing (`try_files $uri /index.html`), nén Gzip tĩnh và tối ưu cache. | `STK-016`, `STK-022`, `ARC-003` | `FND-WEB-001`, `FND-WEB-002` | Lệnh `docker build` tạo image Nginx tĩnh có kích thước $< 50\text{ MB}$; tải trang SPA tại cổng 80 không bị lỗi 404 khi F5 refresh URL. | Done |
| `FND-WEB-006` | Sẵn sàng Tích hợp & Proxy Chuyển tiếp Đa môi trường | Cấu hình reverse proxy chuyển hướng trong Vite (`/api` $\rightarrow$ Backend 8080, `/ws-attendance` $\rightarrow$ STOMP WebSocket) và Nginx proxy pass, giải quyết triệt để rào cản Cross-Origin Resource Sharing (CORS). | `ARC-003`, `STK-019`, `STK-036` | `FND-WEB-001`, `FND-WEB-004` | Web Portal kết nối và gửi nhận request tới Backend qua đường dẫn tương đối `/api` và `/ws-attendance` mà không gặp lỗi CORS cả trong môi trường Vite dev lẫn Nginx container. | Done |
| `FND-WEB-007` | Bộ Khung Kiểm thử Hợp đồng Giao diện & Mock Service | Thiết lập bộ khung kiểm định hợp đồng REST API và WebSocket Client sử dụng Vitest và Mock Client interceptor. | `STK-017`, `STK-031`, `ARC-003` | `FND-WEB-001`, `FND-WEB-003` | Các test component Web Portal xác thực được phản hồi API chuẩn mà không cần khởi động Backend service thật. | Done |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Phiên bản Node.js & Trình duyệt Hỗ trợ**: Ứng dụng Web Portal yêu cầu Node.js $\ge 24$ để xây dựng gói đóng gói và trình duyệt người dùng hỗ trợ ES2022 trở lên (Chrome/Edge $\ge 110$, Firefox $\ge 115$, Safari $\ge 16$).
* **Đồng bộ Giao thức WebSocket STOMP**: Giao thức truyền thông thời gian thực sử dụng WebSocket native với SockJS fallback; cổng proxy chuyển tiếp phải cấu hình cờ `proxy_set_header Upgrade $http_upgrade` và `proxy_set_header Connection "upgrade"` để duy trì kết nối bền bỉ.
