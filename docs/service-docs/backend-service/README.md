# TÀI LIỆU CẤP DỊCH VỤ — PHÂN HỆ MÁY CHỦ DOANH NGHIỆP (`backend-service`)

> **Mã phân hệ:** `SVC-BE`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved / Canonical  
> **Hệ thống chủ quản:** [face-attendance-system](../../system-docs/dds/dds.md)  
> **Định vị kiến trúc:** `ARC-SYS-002` (Máy chủ Doanh nghiệp — Enterprise Core Server) & `ARC-SYS-004` (CSDL Quan hệ — PostgreSQL)

---

## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Máy chủ Doanh nghiệp** (`backend-service`) là trung tâm điều phối nghiệp vụ, xử lý dữ liệu và bảo mật toàn hệ thống. Được xây dựng trên nền tảng Java 21 LTS và Spring Boot, phân hệ cung cấp các dịch vụ REST API tốc độ cao, quản lý kết nối thời gian thực WebSocket STOMP, bảo vệ dữ liệu sinh trắc học và kiểm toán bất biến.

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Xác thực & Phân quyền (Security & RBAC)**: Xác thực không trạng thái qua JWT, phân quyền đa vai trò (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`) và xác thực máy trạm Kiosk.
* **Xử lý Nghiệp vụ Điểm danh (Core Attendance)**: Tiếp nhận chấm công trực tiếp và đồng bộ bù ngoại tuyến, đối chiếu ca kíp, tính toán đi trễ/về sớm.
* **Bảo vệ Dữ liệu Sinh trắc (Biometric Crypto)**: Quản lý mã hóa AES-256-GCM cho vector ArcFace, điều phối chu trình đăng ký khuôn mặt OTP 6 chữ số có hạn 48 giờ.
* **Truyền thông Thời gian thực (Real-time STOMP)**: Đẩy sự kiện chấm công lên Web Dashboard và phát sóng nạp nóng vector mới về trạm Kiosk.
* **Lưu trữ CSDL Trung tâm (Database & Migration)**: Quản lý CSDL PostgreSQL 16 qua Flyway Migration, hỗ trợ ghi log kiểm toán bất biến (Audit Trail).

---

## 2. Bản đồ 3 Nhánh Facet Tài liệu Phân hệ Backend

```text
docs/service-docs/backend-service/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ Backend
│
├── core/                          # [Bắt buộc] Khối nghiệp vụ chấm công, bảo mật & mã hóa
│   ├── fsp.md                     # Thiết lập môi trường Java 21, Maven toolchain & cấu hình
│   ├── fr-nfr-specs.md            # Yêu cầu chức năng (FR-BE-) & phi chức năng (NFR-BE-)
│   ├── fr-nfr-design.md           # Thiết kế giải pháp nghiệp vụ & mã hóa (SOL-BE-)
│   ├── fr-nfr-build-plan.md       # Kế hoạch thi công module cốt lõi (CBL-BE-)
│   └── test-plan.md               # Kế hoạch kiểm thử nội bộ phân hệ (TST-BE-)
│
├── api/                           # [Kích hoạt] REST API Controllers & WebSocket STOMP Broker
│   ├── api-specs.md               # Đặc tả các interface REST & STOMP topic (API-BE-)
│   ├── api-design.md              # Thiết kế Controllers, DTOs & Validation (APD-BE-)
│   └── api-build-plan.md          # Kế hoạch thi công tầng truyền thông (ABL-BE-)
│
└── data/                          # [Kích hoạt] Lưu trữ CSDL quan hệ PostgreSQL & Flyway
    ├── data-specs.md              # Đặc tả thực thể CSDL & chính sách bảo mật (DATA-BE-)
    ├── data-design.md             # Thiết kế DDL PostgreSQL & JPA Repositories (DTD-BE-)
    └── data-build-plan.md         # Kế hoạch thi công cơ sở dữ liệu (DBL-BE-)
```
