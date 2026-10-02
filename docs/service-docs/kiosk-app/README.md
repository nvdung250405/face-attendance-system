# TÀI LIỆU CẤP DỊCH VỤ — PHÂN HỆ KIOSK DESKTOP (`kiosk-app`)

> **Mã phân hệ:** `SVC-KSK`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved / Canonical  
> **Hệ thống chủ quản:** [face-attendance-system](../../system-docs/dds/dds.md)  
> **Định vị kiến trúc:** `ARC-SYS-001` (Trạm Điểm danh Cận biên — Edge Attendance Station)

---

## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Kiosk Desktop** (`kiosk-app`) là điểm tiếp xúc trực tiếp giữa người dùng và hệ thống tại các cửa ra vào, khu vực lễ tân doanh nghiệp. Được phát triển bằng ngôn ngữ Python 3 và framework Qt/PySide6, Kiosk vận hành độc lập 24/7 trên thiết bị phần cứng tại biên, hỗ trợ màn hình cảm ứng tỷ lệ chuẩn dọc 9:16 ($1080 \times 1920\text{ px}$).

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Xử lý Thị giác Biên (Edge Vision Pipeline)**: Phát hiện khuôn mặt (YuNet), xác thực thực thể sống chống giả mạo (MiniFASNet), trích xuất vector 512D chuẩn hóa L2 (ArcFace MobileFaceNet) và so khớp định danh 1:N tức thời trong bộ nhớ RAM qua thư viện NumPy.
* **Tương tác Màn hình Cảm ứng Dọc (Touch UI/UX)**: Khung nhìn Oval 4 màu thích ứng, bàn phím số ảo PIN Pad dự phòng, quy trình tự đăng ký khuôn mặt In-Viewport 3 bước tiếp nhận mã OTP.
* **Chịu lỗi & Hoạt động Ngoại tuyến (Resilience & Offline-First)**: Hàng đợi lưu trữ SQLite WAL (`kiosk_local.db`) cam kết không mất bản ghi điểm danh ($\text{RPO} = 0$) khi mất mạng Internet; tự động đồng bộ bù gói lô 50 bản ghi khi có mạng trở lại.
* **Giao tiếp Hai chiều (Bidirectional Networking)**: Gửi bản ghi điểm danh qua HTTP REST API và nhận nạp nóng vector mới từ Backend qua WebSocket STOMP topic `/topic/kiosk-gallery`.

---

## 2. Bản đồ 4 Nhánh Facet Tài liệu Phân hệ Kiosk

Tuân thủ cấu trúc tài liệu cấp dịch vụ quy định tại [docs/sdlc-docs.md](../../sdlc-docs.md) và [docs/meta.md](../../meta.md), phân hệ Kiosk được tổ chức thành 4 nhánh facet chuyên biệt:

```text
docs/service-docs/kiosk-app/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ
│
├── core/                          # [Bắt buộc] Khối nghiệp vụ cốt lõi & Thị giác máy tính
│   ├── fsp.md                     # Thiết lập môi trường ảo, công cụ & trọng số ONNX
│   ├── fr-nfr-specs.md            # Yêu cầu chức năng (FR-KSK-) & phi chức năng (NFR-KSK-)
│   ├── fr-nfr-design.md           # Thiết kế giải pháp thị giác biên & hàng đợi (SOL-KSK-)
│   ├── fr-nfr-build-plan.md       # Kế hoạch thi công module cốt lõi (CBL-KSK-)
│   └── test-plan.md               # Kế hoạch kiểm thử nội bộ phân hệ (TST-KSK-)
│
├── ui-ux/                         # [Kích hoạt] Giao diện người dùng màn hình cảm ứng dọc 9:16
│   ├── ui-ux-specs.md             # Đặc tả hành trình người dùng & trạng thái Oval (UI-KSK-)
│   ├── ui-ux-design.md            # Thiết kế token màu sắc, bố cục & tỷ lệ co giãn (UXD-KSK-)
│   └── ui-ux-build-plan.md        # Kế hoạch thi công giao diện QML (UBL-KSK-)
│
├── api/                           # [Kích hoạt] Giao tiếp REST API & WebSocket STOMP
│   ├── api-specs.md               # Đặc tả các interface tiêu thụ & nhận sự kiện (API-KSK-)
│   ├── api-design.md              # Thiết kế HTTP Client, cơ chế retry & subscriber (APD-KSK-)
│   └── api-build-plan.md          # Kế hoạch thi công tầng truyền thông (ABL-KSK-)
│
└── data/                          # [Kích hoạt] Lưu trữ CSDL cục bộ & Ma trận bộ nhớ RAM
    ├── data-specs.md              # Đặc tả thực thể dữ liệu cục bộ & quy tắc đệm (DATA-KSK-)
    ├── data-design.md             # Thiết kế lược đồ SQLite WAL & ma trận RAM (DTD-KSK-)
    └── data-build-plan.md         # Kế hoạch thi công tầng lưu trữ biên (DBL-KSK-)
```

---

## 3. Danh mục Chi tiết Tập tin & Ma trận Truy vết (Traceability Matrix)

| Nhánh Facet | Tập tin Tài liệu | Mã Leaf | ID Prefix Sở hữu | Nguồn Tham chiếu Upstream |
| :--- | :--- | :---: | :---: | :--- |
| **Trang chủ** | [README.md](README.md) | `KSK-HUB` | — | `docs/meta.md`, `system-docs/dds/dds.md` (`ARC-SYS-001`) |
| **Core** | [core/fsp.md](core/fsp.md) | `SVC-FSP` | `FND-KSK-` | `system-docs/plans/foundation-setup-plan.md`, `tech-tool-stack.md` |
| **Core** | [core/fr-nfr-specs.md](core/fr-nfr-specs.md) | `SVC-SPEC`| `FR-KSK-`, `NFR-KSK-` | `system-docs/srs/fr-nfr-specs.md` (`FR-SYS-001..006`) |
| **Core** | [core/fr-nfr-design.md](core/fr-nfr-design.md) | `SVC-DES` | `SOL-KSK-` | `core/fr-nfr-specs.md`, `system-docs/dds/fr-nfr-design.md` |
| **Core** | [core/fr-nfr-build-plan.md](core/fr-nfr-build-plan.md) | `SVC-BLD` | `CBL-KSK-` | `core/fr-nfr-design.md` (`SOL-KSK-001..008`) |
| **Core** | [core/test-plan.md](core/test-plan.md) | `SVC-TST` | `TST-KSK-` | `core/fr-nfr-specs.md` (trực tiếp) |
| **UI/UX** | [ui-ux/ui-ux-specs.md](ui-ux/ui-ux-specs.md) | `SVC-SPEC`| `UI-KSK-` | `system-docs/srs/ui-ux-specs.md` (`UI-SYS-001..003`) |
| **UI/UX** | [ui-ux/ui-ux-design.md](ui-ux/ui-ux-design.md) | `SVC-DES` | `UXD-KSK-` | `ui-ux/ui-ux-specs.md`, `system-docs/dds/ui-ux-design.md` |
| **UI/UX** | [ui-ux/ui-ux-build-plan.md](ui-ux/ui-ux-build-plan.md) | `SVC-BLD` | `UBL-KSK-` | `ui-ux/ui-ux-design.md` (`UXD-KSK-001..005`) |
| **API** | [api/api-specs.md](api/api-specs.md) | `SVC-SPEC`| `API-KSK-` | `system-docs/srs/api-specs.md` (`API-SYS-001..003`) |
| **API** | [api/api-design.md](api/api-design.md) | `SVC-DES` | `APD-KSK-` | `api/api-specs.md`, `system-docs/dds/api-design.md` |
| **API** | [api/api-build-plan.md](api/api-build-plan.md) | `SVC-BLD` | `ABL-KSK-` | `api/api-design.md` (`APD-KSK-001..003`) |
| **Data** | [data/data-specs.md](data/data-specs.md) | `SVC-SPEC`| `DATA-KSK-` | `system-docs/srs/data-specs.md` (`DATA-SYS-001..003`) |
| **Data** | [data/data-design.md](data/data-design.md) | `SVC-DES` | `DTD-KSK-` | `data/data-specs.md`, `system-docs/dds/data-design.md` |
| **Data** | [data/data-build-plan.md](data/data-build-plan.md) | `SVC-BLD` | `DBL-KSK-` | `data/data-design.md` (`DTD-KSK-001..002`) |
