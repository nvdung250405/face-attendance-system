# Cổng Tài Liệu Vòng Đời Kỹ Nghệ SDLC (`docs/`)

> **Cấp độ không gian:** Cấp 2 (Documentation Hub - Zero-Hop Subspace Index)  
> **Không gian cha:** [`README.md`](../README.md) (Thư mục Gốc)  
> **Trách nhiệm cốt lõi:** Quản lý tập trung toàn bộ tài liệu kỹ nghệ phần mềm của hệ thống FAS theo mô hình Metadata 2 cấp độ. Toàn bộ tài liệu chuẩn hóa 100% định dạng Markdown (`.md`), liên kết trực tiếp tới các tài liệu toàn cục và 8 lát cắt tính năng cục bộ trong 1 bước nhảy (1 hop).

---

## 1. Cấu Trúc Tài Liệu Tinh Gọn (3-Pillar Documentation Layout)

```text
docs/
├── README.md                          # Hub điều hướng tài liệu cấp 2 (Subspace Hub)
│
├── analysis/                          # [GLOBAL] YÊU CẦU & MỤC TIÊU HỆ THỐNG
│   ├── business-goals.md              # Bài toán thực tế, rủi ro pháp lý & mục tiêu chiến lược
│   ├── prd.md                         # Yêu cầu sản phẩm (Product Requirements Document)
│   ├── srs.md                         # Đặc tả kỹ thuật lượng hóa (22 FR & 10 NFR)
│   └── rtm.md                         # Ma trận truy vết hai chiều (Requirements Traceability Matrix)
│
├── design/                            # [GLOBAL] THIẾT KẾ KIẾN TRÚC & HẠ TẦNG KỸ THUẬT
│   ├── architecture.md                # Kiến trúc tổng thể C4, phân luồng đa dịch vụ
│   ├── api.md                         # Chuẩn giao tiếp REST API, RFC 9457 & WebSocket STOMP
│   ├── database.md                    # Hạ tầng PostgreSQL 16, Flyway, Pool HikariCP & H2 test
│   ├── ui.md                          # UI Design System: Tailwind CSS v4 tokens, QML touch kiosk
│   ├── security.md                    # Mô hình đe dọa STRIDE-A, 4 bất biến an ninh sinh trắc học
│   └── adr/                           # Danh mục 5 bản ghi quyết định kiến trúc cốt lõi
│       ├── ADR-001-zero-photo-upload-multi-pose.md
│       ├── ADR-002-edge-sqlite-wal-offline-sync.md
│       ├── ADR-003-central-aes-256-gcm-crypto.md
│       ├── ADR-004-stomp-websocket-realtime-feed.md
│       └── ADR-005-pin-fallback-and-lockout.md
│
└── features/                          # [LOCAL] 8 LÁT CẮT TÍNH NĂNG CỤC BỘ (100% LEAN & FLAT)
    ├── FEAT-001-attend/spec.md        # Điểm danh khuôn mặt, MiniFASNet liveness & Cooldown 120s
    ├── FEAT-002-comply/spec.md        # Quyền chủ thể dữ liệu, rút consent & tiêu hủy 20 ngày
    ├── FEAT-003-enroll/spec.md        # Đăng ký mẫu khuôn mặt Edge 512D ArcFace tại Kiosk
    ├── FEAT-004-excuse/spec.md        # Đơn giải trình công & quy trình phê duyệt
    ├── FEAT-005-fallback/spec.md      # Điểm danh dự phòng bằng mã PIN / QR ảo
    ├── FEAT-006-monitor/spec.md       # Giám sát sĩ số trực tiếp Web Dashboard qua WebSocket STOMP <= 200ms
    ├── FEAT-007-offline/spec.md       # [Subsystem Resilience] Lưu đệm ngoại tuyến SQLite WAL & Đồng bộ mạng LAN
    └── FEAT-008-shift/spec.md         # Quản trị ca kíp, phân ca linh hoạt & đánh giá punch
```

---

## 2. Bảng Tra Cứu Toàn Cục (Global Analysis & Design Index)

| Nhu cầu tra cứu | Tài liệu cần đọc | Cấp độ |
| :--- | :--- | :---: |
| **Tìm hiểu bài toán, bối cảnh kinh doanh & ROI** | [`analysis/business-goals.md`](analysis/business-goals.md) | Global |
| **Đọc yêu cầu sản phẩm, tác nhân & Epics** | [`analysis/prd.md`](analysis/prd.md) | Global |
| **Tra cứu yêu cầu chức năng (FR) & phi chức năng (NFR)** | [`analysis/srs.md`](analysis/srs.md) | Global |
| **Tra cứu ma trận liên kết SRS $\leftrightarrow$ Feature** | [`analysis/rtm.md`](analysis/rtm.md) | Global |
| **Xem kiến trúc hệ thống tổng thể & phân tầng** | [`design/architecture.md`](design/architecture.md) | Global |
| **Xem chuẩn thiết kế REST API, RFC 9457 & STOMP** | [`design/api.md`](design/api.md) | Global |
| **Xem thiết kế CSDL Postgres 16, Flyway & Pool** | [`design/database.md`](design/database.md) | Global |
| **Xem hệ thống UI Design Tokens & Touch Ergonomics** | [`design/ui.md`](design/ui.md) | Global |
| **Xem mô hình an ninh STRIDE & Bất biến sinh trắc** | [`design/security.md`](design/security.md) | Global |
| **Tra cứu 5 quyết định kiến trúc quan trọng** | [`design/adr/`](design/adr/) | Global |

---

## 3. Danh Mục 8 Lát Cắt Tính Năng Cục Bộ (`docs/features/`)

Truy cập trực tiếp trong 1 hop tới đặc tả chi tiết của từng tính năng:

| Mã Feature | Tên Tính Năng | Phân Hệ Tác Động | Tệp Đặc Tả Cốt Lõi |
| :--- | :--- | :---: | :--- |
| **`FEAT-001-attend`** | Điểm danh khuôn mặt, MiniFASNet liveness & Cooldown 120s | Backend $\leftrightarrow$ Kiosk | [`features/FEAT-001-attend/spec.md`](features/FEAT-001-attend/spec.md) |
| **`FEAT-002-comply`** | Quyền chủ thể dữ liệu, Rút consent & Tiêu hủy 20 ngày (Nghị định 356) | Backend $\leftrightarrow$ Web | [`features/FEAT-002-comply/spec.md`](features/FEAT-002-comply/spec.md) |
| **`FEAT-003-enroll`** | Đăng ký khuôn mặt đa tư thế Guided Multi-Pose (ArcFace 512D) | Kiosk $\leftrightarrow$ Backend | [`features/FEAT-003-enroll/spec.md`](features/FEAT-003-enroll/spec.md) |
| **`FEAT-004-excuse`** | Nộp đơn giải trình công trực tuyến & Quy trình phê duyệt Quản lý | Backend $\leftrightarrow$ Web | [`features/FEAT-004-excuse/spec.md`](features/FEAT-004-excuse/spec.md) |
| **`FEAT-005-fallback`** | Bàn phím số PIN Pad ảo & Cơ chế điểm danh dự phòng khi lỗi camera | Kiosk $\leftrightarrow$ Backend $\leftrightarrow$ Web | [`features/FEAT-005-fallback/spec.md`](features/FEAT-005-fallback/spec.md) |
| **`FEAT-006-monitor`** | Giám sát sĩ số trực tiếp Web Dashboard qua WebSocket STOMP $\le 200\text{ ms}$ | Web $\leftrightarrow$ Backend | [`features/FEAT-006-monitor/spec.md`](features/FEAT-006-monitor/spec.md) |
| **`FEAT-007-offline`** | [Subsystem Resilience] Lưu đệm ngoại tuyến SQLite WAL & Đồng bộ mạng LAN | Kiosk $\leftrightarrow$ Backend | [`features/FEAT-007-offline/spec.md`](features/FEAT-007-offline/spec.md) |
| **`FEAT-008-shift`** | Quản trị ca kíp, phân ca linh hoạt & Logic đánh giá điểm danh ca | Backend $\leftrightarrow$ Web | [`features/FEAT-008-shift/spec.md`](features/FEAT-008-shift/spec.md) |
