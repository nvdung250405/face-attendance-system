# TÀI LIỆU CẤP DỊCH VỤ — PHÂN HỆ CỔNG WEB QUẢN TRỊ & NGƯỜI DÙNG (`web-portal`)

> **Mã phân hệ:** `SVC-WEB`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved / Canonical  
> **Hệ thống chủ quản:** [face-attendance-system](../../system-docs/dds/dds.md)  
> **Định vị kiến trúc:** `ARC-SYS-003` (Cổng Thông tin Kép — Dual Web Portal)

---

## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Cổng Web Quản trị & Người dùng** (`web-portal`) là ứng dụng web hiện đại (Single Page Application - SPA) được phát triển bằng React 18/19, TypeScript và Tailwind CSS. Phân hệ cung cấp không gian làm việc số cho hai nhóm đối tượng: Quản lý Nhân sự (HR Manager) và Nhân viên Doanh nghiệp (Employee).

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Cổng Thông tin Kép (Dual-Role Portal)**: Phân quyền điều hướng tự động dựa trên JWT Claims giữa giao diện Quản trị Chấm công (HR) và Không gian Cá nhân (Nhân viên).
* **Ký Cam kết & Kích hoạt Sinh trắc (Informed Consent)**: Quy trình pháp lý trực tuyến tuân thủ Luật Bảo vệ dữ liệu cá nhân; kích hoạt phiên đăng ký cấp mã OTP 6 số và mã QR Code.
* **Theo dõi Chấm công Thời gian thực (Real-time Live Table)**: Kết nối WebSocket STOMP tới Backend nhận sự kiện điểm danh từ các trạm Kiosk và hiển thị trực tiếp lên bảng Dashboard.
* **Báo cáo & Thống kê Chấm công (Reporting & Export)**: Trực quan hóa dữ liệu chấm công qua biểu đồ và hỗ trợ xuất file Excel/PDF định dạng chuẩn.

---

## 2. Bản đồ 3 Nhánh Facet Tài liệu Phân hệ Web Portal

```text
docs/service-docs/web-portal/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ Web Portal
│
├── core/                          # [Bắt buộc] Khối quản lý trạng thái, routing & nghiệp vụ client
│   ├── fsp.md                     # Thiết lập môi trường Node.js, Vite & TypeScript
│   ├── fr-nfr-specs.md            # Yêu cầu chức năng (FR-WEB-) & phi chức năng (NFR-WEB-)
│   ├── fr-nfr-design.md           # Thiết kế kiến trúc SPA & quản lý phiên (SOL-WEB-)
│   ├── fr-nfr-build-plan.md       # Kế hoạch thi công module cốt lõi (CBL-WEB-)
│   └── test-plan.md               # Kế hoạch kiểm thử nội bộ phân hệ (TST-WEB-)
│
├── ui-ux/                         # [Kích hoạt] Giao diện người dùng Web Responsive & Design Tokens
│   ├── ui-ux-specs.md             # Đặc tả hành trình người dùng & tương tác Web (UI-WEB-)
│   ├── ui-ux-design.md            # Thiết kế Design Tokens Tailwind & layout components (UXD-WEB-)
│   └── ui-ux-build-plan.md        # Kế hoạch thi công giao diện React (UBL-WEB-)
│
└── api/                           # [Kích hoạt] Tầng mạng Axios Client & STOMP Hook
    ├── api-specs.md               # Đặc tả các interface tiêu thụ & STOMP topics (API-WEB-)
    ├── api-design.md              # Thiết kế Axios Interceptor & STOMP Service (APD-WEB-)
    └── api-build-plan.md          # Kế hoạch thi công tầng truyền thông (ABL-WEB-)
```
