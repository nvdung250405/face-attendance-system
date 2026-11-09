# Phân hệ Cổng Web Quản trị & Tự phục vụ (`web-portal`)

> **Mã phân hệ:** `SVC-WEB`  
> **Cấp độ không gian:** Child Service Workspace  
> **Đường dẫn:** `app/web-portal`  
> **Không gian cha:** [`app/README.md`](../README.md)  
> **Trách nhiệm cốt lõi (Single Responsibility):** Cung cấp giao diện Web thời gian thực cho Quản trị viên Nhân sự (HR Dashboard theo dõi chấm công qua WebSocket STOMP) và Cổng tự phục vụ cho Nhân viên (đọc và ký cam kết bảo vệ dữ liệu Informed Consent, nhận mã OTP kích hoạt tài khoản tại Kiosk, nộp đơn giải trình).

---

## 1. Mục đích & Vai trò Kỹ thuật

`web-portal` là giao diện người dùng trên nền tảng web phục vụ hai nhóm đối tượng tác nhân:
* **Nền tảng công nghệ**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios, SockJS + `@stomp/stompjs`.
* **Tính năng Cốt lõi**:
  1. **Live Attendance Dashboard**: Bảng giám sát quân số trực tiếp, tự động cập nhật danh sách quét mặt ngay khi nhân viên chấm công tại Kiosk thông qua kênh WebSocket `/topic/live-attendance` (không cần F5 tải lại trang).
  2. **Employee Self-Service (Onboarding)**: Nhân viên mới đăng nhập, đọc và ký cam kết điện tử tuân thủ Luật 2025, nhận mã OTP 6 số (hạn 48 giờ) để ra trạm Kiosk quét mặt lần đầu.
  3. **Quản trị Ca kíp & Giải trình (HR Tools)**: Cấu hình ca làm việc, phân ca, phê duyệt giải trình đi muộn/về sớm và xuất báo cáo bảng công ra file Excel an toàn (chống Formula Injection).

---

## 2. Bản đồ Cấu trúc Nội bộ (Internal Layout)

| Thư mục / Tệp | Loại tài nguyên | Trách nhiệm chi tiết |
|:---|:---|:---|
| [`src/components/`](src/components/) | UI Components | Các thành phần giao diện tái sử dụng: Bảng chấm công, Dialogs, Header, Navbar |
| [`src/pages/`](src/pages/) | Application Views | Các trang chính: `DashboardPage`, `OnboardingPage`, `ShiftManagementPage`, `ReportsPage` |
| [`src/hooks/`](src/hooks/) | Custom Hooks | Xử lý trạng thái và luồng dữ liệu: `useWebSocket`, `useAuth`, `useAttendance` |
| [`src/services/`](src/services/) | Network Services | Axios HTTP API Clients giao tiếp với Backend (`/api/v1/...`) |
| [`src/types/`](src/types/) | Type Definitions | Khai báo TypeScript Interfaces đồng bộ với JSON Schemas trong `contracts/` |
| [`public/`](public/) | Static Assets | Favicon, SVG icons, logo thương hiệu |
| [`package.json`](package.json) | NPM Dependencies | Khai báo thư viện, scripts khởi chạy dev, build và lint |

---

## 3. Hướng dẫn Khởi chạy Cục bộ (Local Run Guide)

### 3.1. Cài đặt Thư viện
Từ thư mục `app/web-portal/`:
```bash
npm install
```

### 3.2. Khởi chạy Máy chủ Phát triển (Vite Dev Server)
```bash
npm run dev
```
* **Địa chỉ truy cập**: [http://localhost:5173](http://localhost:5173)
* **Tài khoản mặc định thử nghiệm**:
  * Quản trị viên (Admin): `admin` / `Admin@123`
  * Quản lý Nhân sự (HR): `hr_manager` / `Hr@123456`
  * Nhân viên (Employee): `emp_demo` / `Emp@123456`

---

## 4. Kiểm thử & Đảm bảo Chất lượng (Testing & Lint)

```bash
# 1. Chạy toàn bộ Unit Tests & Component Tests qua Vitest
npm test

# 2. Kiểm tra lỗi cú pháp và chuẩn mã nguồn (ESLint)
npm run lint

# 3. Đóng gói mã nguồn bản phát hành thương mại (Production Build)
npm run build
```

---

## 5. Chính sách Dữ liệu & Quy tắc Git (Data & Git Policy)

* **Tài nguyên theo dõi (Tracked)**: Toàn bộ mã nguồn `src/`, tệp cấu hình `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`, `package.json`, và `Dockerfile`.
* **Tài nguyên bỏ qua (Ignored 100%)**:
  * Thư mục phụ thuộc: `node_modules/`.
  * Thư mục bản dựng: `dist/`, `dist-ssr/`.
  * Tệp biến môi trường cục bộ: `.env.local`, `.env.*.local`.
  * Bộ nhớ đệm kiểm thử: `.vitest/`.
