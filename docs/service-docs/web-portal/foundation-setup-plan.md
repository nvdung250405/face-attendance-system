---
title: Web Portal Foundation Setup Plan
version: 1.0
status: Approved
owner: Web Lead & DevOps Engineer
---

# FOUNDATION SETUP PLAN — Kế hoạch Thiết lập Nền tảng Phân hệ Web Portal


## 1. Mục tiêu & Phạm vi (Objectives & Scope)

* **Mục tiêu**: Chuẩn bị hoàn chỉnh môi trường phát triển Node.js $\ge 20$, cấu hình Vite 5, React 18/19 với TypeScript, thiết lập Tailwind CSS và cấu trúc dự án chuẩn SPA.
* **Phạm vi**: Giới hạn trong phân hệ `app/web-portal`, kế thừa từ kế hoạch nền tảng hệ thống `PLN-FND-01` (`FND-SYS-001`, `FND-SYS-003`).

---

## 2. Foundation Work Items (Hạng mục Thiết lập Nền tảng Web Portal)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `FND-WEB-001` | Khởi tạo Dự án Vite & React TypeScript | Cấu hình `package.json`, `tsconfig.json`, `vite.config.ts` với strict type checking. | `STK-015`, `STK-016` | `FND-SYS-001` | Lệnh `npm run build` thành công; không có cảnh báo TypeScript. | Done |
| `FND-WEB-002` | Cấu hình Tailwind CSS & Design Tokens | Cài đặt Tailwind CSS, cấu hình font Inter và bảng mã màu đồng bộ với thiết kế Kiosk. | `STK-017` | `FND-WEB-001` | Các class Tailwind biên dịch chính xác; áp dụng được biến màu hệ thống. | Done |
| `FND-WEB-003` | Cài đặt Thư viện Phụ trợ Web | Khóa phiên bản và cài đặt `axios`, `@stomp/stompjs`, `sockjs-client`, `lucide-react`, `zustand`. | `STK-015` | `FND-WEB-001` | `npm install` sạch sẽ; không có lỗ hổng bảo mật nghiêm trọng (`audit`). | Done |
| `FND-WEB-004` | Cấu hình Biến Môi trường & Proxy Dev | Thiết lập file `.env` chứa `VITE_API_BASE_URL` và cấu hình reverse proxy chuyển hướng trong Vite. | `STK-015` | `FND-WEB-001` | Gọi API tới Backend qua đường dẫn tương đối `/api` thành công không bị CORS. | Done |
