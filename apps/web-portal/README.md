# Phân Hệ Cổng Web Quản Trị & Tự Phục Vụ (`web-portal`)

> **Cấp độ không gian:** Cấp 2 (Service Workspace)  
> **Không gian cha:** [`README.md`](../../README.md) (Thư mục Gốc)  
> **Công nghệ cốt lõi:** React 18, TypeScript, Vite, Tailwind CSS, Zustand (`store/authStore.ts`), Axios, SockJS + `@stomp/stompjs`.

---

## 1. Cấu Trúc Mã Nguồn Nội Bộ (Internal Layout)

| Thư mục / Tệp | Loại tài nguyên | Trách nhiệm chi tiết |
| :--- | :--- | :--- |
| [`src/`](src/) | Production Source | Toàn bộ mã nguồn ứng dụng (100% production code, không lẫn tests hay mocks) |
| [`tests/`](tests/) | Test Suite & Mocks | Cô lập 100% Unit, Component, Integration Tests và Test Fixtures/Mocks |
| [`src/views/`](src/views/) | Application Views | Toàn bộ màn hình giao diện chính (Admin Views, Auth Views, Employee Views) |
| [`src/components/`](src/components/) | UI Components | Components dùng chung (`ui/`), theo nghiệp vụ (`attendance/`, `account/`, `excuse/`, `kiosk/`) |
| [`src/store/`](src/store/) | State Management | Zustand global stores (`authStore.ts`, `toastStore.ts`) |
| [`src/hooks/`](src/hooks/) | Custom Hooks | Xử lý WebSocket STOMP, live buffer, window responsive hooks |
| [`src/services/`](src/services/) | Network Services | Axios HTTP API Clients giao tiếp với Backend (`/api/v1/...`) |
| [`src/types/`](src/types/) | Type Definitions | TypeScript Interfaces đồng bộ với JSON Schemas trong `contracts/` |
| [`src/utils/`](src/utils/) | Utilities | Hàm tiện ích xử lý ngày tháng, format code, sanitization |

---

## 2. Bảng Tra Cứu Màn Hình Nhanh (Domain-to-View Index)

Agent tra cứu trực tiếp file view giao diện mà không cần tìm kiếm:

| Nghiệp vụ giao diện | Đường dẫn tệp View chính | Component bổ trợ liên quan |
| :--- | :--- | :--- |
| **Giám sát chấm công Live** | `src/views/admin/AdminAttendanceView.tsx` | `components/attendance/AttendanceFilterToolbar.tsx` |
| **Bảng tổng quan KPI** | `src/views/admin/AdminDashboardView.tsx` | `components/kiosk/KioskKpiCards.tsx` |
| **Quản trị Nhân viên & Mã PIN** | `src/views/admin/EmployeeManagementView.tsx` | `components/account/EmployeeDrawer.tsx`, `PinManagementModal.tsx` |
| **Quản lý Ca kíp** | `src/views/admin/AdminShiftManagementView.tsx` | `components/shift/` |
| **Phê duyệt Đơn giải trình** | `src/views/admin/AdminExcuseManagementView.tsx` | `components/excuse/ApproveExcuseModal.tsx`, `RejectExcuseModal.tsx` |
| **Quản trị Trạm Kiosk** | `src/views/admin/AdminKioskManagementView.tsx` | `components/kiosk/ReissuedTokenDialog.tsx` |
| **Khóa / Mở Kỳ công lương** | `src/views/admin/AdminPayrollPeriodView.tsx` | `components/payroll/` |
| **Đăng nhập hệ thống** | `src/views/auth/LoginView.tsx` | `components/account/ChangePasswordModal.tsx` |
| **Ký cam kết Consent (NV)** | `src/views/employee/EmployeeConsentView.tsx` | `components/consent/` |
| **Lịch sử giải trình cá nhân** | `src/views/employee/EmployeeExcuseHistoryView.tsx` | `components/excuse/` |

---

## 3. Lệnh Khởi Chạy & Kiểm Thử Chuẩn

Thực hiện từ thư mục `apps/web-portal/`:

### 3.1. Chế độ Phát triển Độc lập (Standalone UI Dev)
Phát triển giao diện độc lập không phụ thuộc vào hạ tầng Backend hay Docker. Tự động kích hoạt mock server mô phỏng toàn bộ REST API và cung cấp tính năng Đăng nhập nhanh 1-click (Dev Mode Quick Login):

```bash
npm run dev:mock
```
* **Đặc điểm:** Không cần chạy Docker hay khởi động `fas-backend` / `fas-postgres`.
* **Xác thực nhanh:** Trên trang đăng nhập xuất hiện các nút đăng nhập 1-click cho các vai trò (Admin / HR, Nhân viên, Cán bộ DPO) và thanh chuyển đổi vai trò nhanh trên giao diện quản trị.

### 3.2. Chế độ Phát triển Tích hợp (Full-stack Integration Dev)
Kết nối trực tiếp với backend Spring Boot và cơ sở dữ liệu PostgreSQL qua môi trường Docker Compose:

```bash
# Khởi động dịch vụ phụ trợ từ thư mục gốc
docker compose up -d fas-backend fas-postgres

# Khởi chạy giao diện Cổng Web (từ apps/web-portal/)
npm run dev
```

### 3.3. Kiểm thử & Đóng gói Bản dựng

```bash
# 1. Chạy toàn bộ Unit & Component Tests qua Vitest (Bắt buộc)
npm test

# 2. Kiểm tra chuẩn mã nguồn & cú pháp ESLint (Bắt buộc)
npm run lint

# 3. Đóng gói bản phát hành Production
npm run build
```

* **Địa chỉ truy cập cục bộ:** [http://localhost:5173](http://localhost:5173)
* **Tài khoản kiểm thử mẫu (Staging DB):**
  * Quản trị viên (Admin): `staging-admin@fas.company.com` / `StagingAdmin@2026!`
  * Quản lý Nhân sự (HR): `hr.manager@fas.company.com` / `Staging@FAS2026!`
  * Cán bộ DPO: `dpo.officer@fas.company.com` / `Staging@FAS2026!`
  * Kỹ sư (Employee): `dev.an@fas.company.com` / `Staging@FAS2026!`
