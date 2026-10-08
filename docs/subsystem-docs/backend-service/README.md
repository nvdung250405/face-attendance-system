---
title: Backend Service Documentation Hub
version: 3.0
status: Approved
owner: Backend Technical Lead
type: hub
scope: BE
updated: 2026-10-08
---

# TÀI LIỆU CẤP PHÂN HỆ — PHÂN HỆ MÁY CHỦ DOANH NGHIỆP (`backend-service`)

## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Máy chủ Doanh nghiệp** (`backend-service`) là trung tâm điều phối nghiệp vụ, xử lý dữ liệu trung tâm và bảo mật toàn hệ thống. Được xây dựng trên nền tảng Java 21 LTS và Spring Boot 3.4.x, phân hệ cung cấp các dịch vụ REST API tốc độ cao, quản lý kết nối thời gian thực WebSocket STOMP, bảo vệ dữ liệu sinh trắc học và kiểm toán bất biến.

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Xác thực & Phân quyền (Security & RBAC)**: Xác thực không trạng thái qua JWT (HMAC-SHA256, 15 phút access token, 7 ngày refresh token), phân quyền đa vai trò (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`), quản lý API Key xác thực máy trạm Kiosk.
* **Xử lý Nghiệp vụ Điểm danh (Core Attendance)**: Tiếp nhận chấm công trực tiếp và đồng bộ bù ngoại tuyến theo lô (50 bản ghi), đối chiếu ca kíp làm việc, tính toán đi trễ/về sớm, áp dụng cơ chế Cooldown chống ghi nhận trùng lặp (Caffeine in-memory cache, TTL 120s).
* **Bảo vệ Dữ liệu Sinh trắc (Biometric Crypto)**: Quản lý mã hóa AES-256-GCM cho vector ArcFace 512D (`BYTEA` ciphertext + 12-byte IV ngẫu nhiên), điều phối chu trình đăng ký khuôn mặt OTP 6 chữ số có hạn 48 giờ.
* **Truyền thông Thời gian thực (Real-time STOMP)**: Đẩy sự kiện chấm công lên Web Dashboard (`/topic/attendance-events`) và phát sóng nạp nóng vector mới về các máy trạm Kiosk (`/topic/kiosk-gallery`).
* **Lưu trữ CSDL Trung tâm (Database & Migration)**: Quản lý CSDL PostgreSQL 16 qua Flyway Migration (`V1`..`V5`), kết nối qua HikariCP (20 connections), hỗ trợ ghi log kiểm toán bất biến (Audit Trail) thông qua Spring AOP.

---

## 2. Bản đồ Tài liệu Phân hệ Backend Service (sdlc-docs.md v3.x)

Tuân thủ cấu trúc tài liệu hợp nhất theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §3 & §7), cấu trúc thư mục của phân hệ `backend-service` được chuẩn hóa thành 2 thư mục cốt lõi `specs/` và `plans/`:

```text
docs/subsystem-docs/backend-service/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ Backend
│
├── specs/                         # Bộ tài liệu đặc tả & thiết kế kỹ thuật hợp nhất
│   ├── spec.md                    # Kiến trúc lõi, layered model, Spring Boot 3.4.x & quyết định kỹ thuật DD-BE-
│   ├── fr-nfr.md                  # Nghiệp vụ chức năng (FR-BE-), phi chức năng (NFR-BE-), giải pháp (SOL-BE-)
│   ├── data.md                    # Lưu trữ PostgreSQL 16, DDL, Flyway, Caffeine Cache & Crypto (DATA-BE-, DTD-BE-)
│   └── api.md                     # Hợp đồng RESTful API & STOMP Broker, RFC 7807 Error Dictionary (API-BE-, APD-BE-)
│
└── plans/                         # Kế hoạch thực thi kỹ thuật & kiểm thử phân hệ
    ├── foundation-setup-plan.md   # Thiết lập môi trường Java 21, Maven toolchain & cấu hình ban đầu (FND-BE-)
    ├── build-plan.md              # Kế hoạch xây dựng & tích hợp tổng thể phân hệ Backend (BLD-BE-)
    ├── task-plan.md               # Kế hoạch thi công chi tiết từng Task theo DAG (TASK-BE-)
    └── test-plan.md               # Kế hoạch kiểm thử tổng thể phân hệ Backend (TST-BE-)
```

> **Ghi chú về Facet UI/UX**: Theo Mục 7.2 của `sdlc-docs.md`, nhánh `ui-ux.md` chỉ áp dụng cho các phân hệ có giao diện người dùng trực tiếp. Phân hệ `backend-service` là máy chủ cung cấp API (Headless Service phi giao diện), do đó không có tài liệu `ui-ux.md`. Trải nghiệm người dùng được quản lý độc lập tại `web-portal` và `kiosk-app`.

---

## 3. Danh mục Chi tiết Tập tin & Ma trận Truy vết (Traceability Matrix)

| Nhánh Tài liệu | Tập tin | Mã Leaf | ID Prefix Sở hữu | Nguồn Tham chiếu Upstream |
| :--- | :--- | :---: | :---: | :--- |
| **Trang chủ** | [README.md](README.md) | `BE-HUB` | — | `docs/meta.md`, `system-docs/specs/spec.md` (`ARC-002`) |
| **Lõi Phân hệ** | [specs/spec.md](specs/spec.md) | `BE-SPEC` | `DD-BE-` | `system-docs/specs/spec.md` (`ARC-002`, `DD-SYS-001..028`) |
| **FR/NFR Facet** | [specs/fr-nfr.md](specs/fr-nfr.md) | `BE-FRNFR`| `FR-BE-`, `NFR-BE-`, `SOL-BE-` | `system-docs/specs/fr-nfr.md` (`FR-SYS-`, `NFR-SYS-`, `SOL-SYS-`) |
| **Data Facet** | [specs/data.md](specs/data.md) | `BE-DATA` | `DATA-BE-`, `DTD-BE-` | `system-docs/specs/spec.md` (`DD-SYS-007`, `DD-SYS-010`) |
| **API Facet** | [specs/api.md](specs/api.md) | `BE-API` | `API-BE-`, `APD-BE-` | `system-docs/specs/spec.md` (`DD-SYS-001`, `DD-SYS-012`) |
| **Kế hoạch Nền tảng** | [plans/foundation-setup-plan.md](plans/foundation-setup-plan.md) | `BE-FSP` | `FND-BE-` | `system-docs/plans/foundation-setup-plan.md` |
| **Kế hoạch Xây dựng** | [plans/build-plan.md](plans/build-plan.md) | `BE-BLD` | `BLD-BE-` | `plans/foundation-setup-plan.md`, `specs/spec.md` |
| **Kế hoạch Task** | [plans/task-plan.md](plans/task-plan.md) | `BE-TSK` | `TASK-BE-` | `plans/build-plan.md` |
| **Kế hoạch Kiểm thử** | [plans/test-plan.md](plans/test-plan.md) | `BE-TST` | `TST-BE-` | `specs/fr-nfr.md`, `specs/data.md`, `specs/api.md` |
