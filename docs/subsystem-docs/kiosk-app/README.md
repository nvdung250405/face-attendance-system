---
title: Kiosk App Documentation Hub
version: 3.0
status: Approved
owner: Kiosk Technical Lead & Edge Vision Engineer
type: hub
scope: KSK
updated: 2026-10-08
---

# TÀI LIỆU CẤP PHÂN HỆ — PHÂN HỆ KIOSK DESKTOP (`kiosk-app`)

## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Kiosk Desktop** (`kiosk-app`) là điểm tiếp xúc trực tiếp giữa người dùng và hệ thống tại các cửa ra vào, khu vực lễ tân doanh nghiệp. Được phát triển bằng ngôn ngữ Python 3 và framework Qt/PySide6, Kiosk vận hành độc lập 24/7 trên thiết bị phần cứng tại biên, hỗ trợ màn hình cảm ứng tỷ lệ chuẩn dọc 9:16 ($1080 \times 1920\text{ px}$).

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Xử lý Thị giác Biên (Edge Vision Pipeline)**: Phát hiện khuôn mặt (YuNet), xác thực thực thể sống chống giả mạo (MiniFASNet), trích xuất vector 512D chuẩn hóa $L_2$ (ArcFace MobileFaceNet) và so khớp định danh 1:N tức thời trong bộ nhớ RAM qua thư viện NumPy.
* **Lưu trữ Cục bộ & Khả năng Chịu lỗi Ngoại tuyến (Data Facet - Offline-First)**: Hàng đợi lưu trữ SQLite WAL (`kiosk_local.db`) cam kết không mất bản ghi điểm danh ($\text{RPO} = 0$) khi mất kết nối mạng Internet; mã hóa bằng Windows DPAPI 2-phase rotation; tự động đồng bộ bù gói lô 50 bản ghi khi có mạng trở lại.
* **Giao tiếp Hai chiều (API Facet - Bidirectional Networking)**: Gửi bản ghi điểm danh qua HTTP REST API và nhận nạp nóng vector mới từ Backend qua WebSocket STOMP topic `/topic/kiosk-gallery`.
* **Tương tác Màn hình Cảm ứng Dọc (UI/UX Facet - Touch Experience)**: Khung nhìn Oval 4 màu thích ứng, bàn phím số ảo PIN Pad dự phòng, quy trình tự đăng ký khuôn mặt In-Viewport 3 bước tiếp nhận mã OTP.

---

## 2. Bản đồ Tài liệu Phân hệ Kiosk (sdlc-docs.md v3.x)

Tuân thủ cấu trúc tài liệu hợp nhất theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../sdlc-docs.md) §3 & §7), cấu trúc thư mục của phân hệ `kiosk-app` được chuẩn hóa thành 2 thư mục cốt lõi `specs/` và `plans/`:

```text
docs/subsystem-docs/kiosk-app/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ
│
├── specs/                         # Bộ tài liệu đặc tả & thiết kế kỹ thuật hợp nhất
│   ├── spec.md                    # Spec Core: Kiến trúc lõi, 4-thread model, FR-KSK-, NFR-KSK-, SOL-KSK- & quyết định kỹ thuật DD-KSK-
│   ├── data.md                    # Lưu trữ CSDL SQLite WAL, bộ nhớ RAM & bảo mật DPAPI (DATA-KSK-, DTD-KSK-)
│   ├── api.md                     # Giao diện RESTful & STOMP WebSocket (API-KSK-, APD-KSK-)
│   └── ui-ux.md                   # Trải nghiệm màn hình dọc 9:16, QML & tokens (UI-KSK-, UXD-KSK-)
│
└── plans/                         # Kế hoạch thực thi kỹ thuật & kiểm thử phân hệ
    ├── foundation-setup-plan.md   # Thiết lập môi trường ảo, công cụ & trọng số ONNX (FND-KSK-)
    ├── build-plan.md              # Kế hoạch xây dựng & tích hợp tổng thể phân hệ Kiosk (BLD-KSK-)
    ├── task-plan.md               # Kế hoạch thi công chi tiết từng Task theo DAG (TASK-KSK-)
    └── test-plan.md               # Kế hoạch kiểm thử tổng thể phân hệ Kiosk (TST-KSK-)
```

---

## 3. Danh mục Chi tiết Tập tin & Ma trận Truy vết (Traceability Matrix)

| Nhánh Tài liệu | Tập tin | Mã Leaf | ID Prefix Sở hữu | Nguồn Tham chiếu Upstream |
| :--- | :--- | :---: | :---: | :--- |
| **Trang chủ** | [README.md](README.md) | `KSK-HUB` | — | `docs/meta.md`, `system-docs/specs/spec.md` (`ARC-001`) |
| **Spec Core** | [specs/spec.md](specs/spec.md) | `KSK-SPEC` | `ACT-`, `EXT-`, `FR-KSK-`, `NFR-KSK-`, `SOL-KSK-`, `DD-KSK-` | `system-docs/specs/spec.md` (`ARC-001..018`, `FR-SYS-`, `NFR-SYS-`, `SOL-SYS-`, `DD-SYS-001..028`) |
| **Data Facet** | [specs/data.md](specs/data.md) | `KSK-DATA` | `DATA-KSK-`, `DTD-KSK-` | `system-docs/specs/spec.md` (`DD-SYS-006`, `DD-SYS-010`) |
| **API Facet** | [specs/api.md](specs/api.md) | `KSK-API` | `API-KSK-`, `APD-KSK-` | `system-docs/specs/spec.md` (`DD-SYS-001`, `DD-SYS-012`) |
| **UI/UX Facet** | [specs/ui-ux.md](specs/ui-ux.md) | `KSK-UIUX` | `UI-KSK-`, `UXD-KSK-` | `system-docs/specs/spec.md` (`DD-SYS-004`, `DD-SYS-011`) |
| **Kế hoạch Nền tảng** | [plans/foundation-setup-plan.md](plans/foundation-setup-plan.md) | `KSK-FSP` | `FND-KSK-` | `system-docs/plans/foundation-setup-plan.md` |
| **Kế hoạch Xây dựng** | [plans/build-plan.md](plans/build-plan.md) | `KSK-BLD` | `BLD-KSK-` | `plans/foundation-setup-plan.md`, `specs/spec.md` |
| **Kế hoạch Task** | [plans/task-plan.md](plans/task-plan.md) | `KSK-TSK` | `TASK-KSK-` | `plans/build-plan.md` |
| **Kế hoạch Kiểm thử** | [plans/test-plan.md](plans/test-plan.md) | `KSK-TST` | `TST-KSK-` | `specs/spec.md`, `specs/data.md`, `specs/api.md`, `specs/ui-ux.md` |
