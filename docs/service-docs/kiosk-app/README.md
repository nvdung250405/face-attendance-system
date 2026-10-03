---
title: Kiosk App Documentation Hub
version: 2.0
status: Approved
owner: Kiosk Technical Lead & Edge Vision Engineer
---

# TÀI LIỆU CẤP DỊCH VỤ — PHÂN HỆ KIOSK DESKTOP (`kiosk-app`)


## 1. Giới thiệu Phân hệ & Trách nhiệm Kỹ thuật

Phân hệ **Kiosk Desktop** (`kiosk-app`) là điểm tiếp xúc trực tiếp giữa người dùng và hệ thống tại các cửa ra vào, khu vực lễ tân doanh nghiệp. Được phát triển bằng ngôn ngữ Python 3 và framework Qt/PySide6, Kiosk vận hành độc lập 24/7 trên thiết bị phần cứng tại biên, hỗ trợ màn hình cảm ứng tỷ lệ chuẩn dọc 9:16 ($1080 \times 1920\text{ px}$).

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Xử lý Thị giác Biên (Edge Vision Pipeline)**: Phát hiện khuôn mặt (YuNet), xác thực thực thể sống chống giả mạo (MiniFASNet), trích xuất vector 512D chuẩn hóa $L_2$ (ArcFace MobileFaceNet) và so khớp định danh 1:N tức thời trong bộ nhớ RAM qua thư viện NumPy.
* **Lưu trữ Cục bộ & Khả năng Chịu lỗi Ngoại tuyến (Data Facet - Offline-First)**: Hàng đợi lưu trữ SQLite WAL (`kiosk_local.db`) cam kết không mất bản ghi điểm danh ($\text{RPO} = 0$) khi mất kết nối mạng Internet; tự động đồng bộ bù gói lô 50 bản ghi khi có mạng trở lại.
* **Giao tiếp Hai chiều (API Facet - Bidirectional Networking)**: Gửi bản ghi điểm danh qua HTTP REST API và nhận nạp nóng vector mới từ Backend qua WebSocket STOMP topic `/topic/kiosk-gallery`.
* **Tương tác Màn hình Cảm ứng Dọc (UI/UX Facet - Touch Experience)**: Khung nhìn Oval 4 màu thích ứng, bàn phím số ảo PIN Pad dự phòng, quy trình tự đăng ký khuôn mặt In-Viewport 3 bước tiếp nhận mã OTP.

---

## 2. Bản đồ 4 Nhánh Facet Tài liệu Phân hệ Kiosk

Tuân thủ cấu trúc tài liệu cấp dịch vụ quy định tại [docs/sdlc-docs.md](../../sdlc-docs.md) và triển khai theo quy trình phụ thuộc chặt chẽ **DATA $\rightarrow$ API $\rightarrow$ UI/UX**:

```text
docs/service-docs/kiosk-app/
│
├── README.md                      # [Tài liệu hiện tại] Cẩm nang & Bản đồ định hướng phân hệ
├── foundation-setup-plan.md       # Thiết lập môi trường ảo, công cụ & trọng số ONNX (FND-KSK-)
├── build-plan.md                  # Kế hoạch xây dựng & tích hợp tổng thể phân hệ Kiosk (Aggregate, BLD-KSK-)
│
├── data/                          # [Bước 1: DATA] Lưu trữ CSDL cục bộ & Ma trận bộ nhớ RAM
│   ├── data-specs.md              # Đặc tả thực thể dữ liệu cục bộ & quy tắc đệm (DATA-KSK-)
│   ├── data-design.md             # Thiết kế DDL SQLite WAL & ma trận RAM (DTD-KSK-)
│   ├── data-build-plan.md         # Kế hoạch thi công tầng lưu trữ biên (BLD-KSK-)
│   └── data-test-plan.md          # Kế hoạch kiểm thử CSDL SQLite WAL & ma trận RAM (TST-KSK-)
│
├── ui-ux/                         # [Bước 2: UI/UX] Giao diện cảm ứng 9:16 & Thiết kế Figma
│   ├── ui-ux-specs.md             # Đặc tả hành trình người dùng & trạng thái Oval (UI-KSK-)
│   ├── ui-ux-design.md            # Thiết kế token màu sắc, bố cục & pixel vector Figma (UXD-KSK-)
│   ├── ui-ux-build-plan.md        # Kế hoạch thi công giao diện QML (BLD-KSK-)
│   └── ui-ux-test-plan.md         # Kế hoạch kiểm thử giao diện & phản hồi chạm (TST-KSK-)
│
├── api/                           # [Bước 3: API] Giao tiếp REST API & WebSocket STOMP
│   ├── api-specs.md               # Đặc tả các interface tiêu thụ & nhận sự kiện (API-KSK-)
│   ├── api-design.md              # Thiết kế chi tiết từng trường request/response (APD-KSK-)
│   ├── api-build-plan.md          # Kế hoạch thi công tầng truyền thông (BLD-KSK-)
│   └── api-test-plan.md           # Kế hoạch kiểm thử giao tiếp mạng & đồng bộ ngoại tuyến (TST-KSK-)
│
└── fr-nfr/                        # [Nghiệp vụ Cốt lõi] Khối nghiệp vụ cốt lõi & Thị giác máy tính
    ├── fr-nfr-specs.md            # Yêu cầu chức năng (FR-KSK-) & phi chức năng (NFR-KSK-)
    ├── fr-nfr-design.md           # Thiết kế giải pháp thị giác biên & hàng đợi (SOL-KSK-)
    ├── fr-nfr-build-plan.md       # Kế hoạch thi công module cốt lõi (BLD-KSK-)
    └── fr-nfr-test-plan.md        # Kế hoạch kiểm thử thị giác và nghiệp vụ (TST-KSK-)
```

---

## 3. Danh mục Chi tiết Tập tin & Ma trận Truy vết (Traceability Matrix)

| Nhánh Facet | Tập tin Tài liệu | Mã Leaf | ID Prefix Sở hữu | Nguồn Tham chiếu Upstream |
| :--- | :--- | :---: | :---: | :--- |
| **Trang chủ** | [README.md](README.md) | `KSK-HUB` | — | `docs/meta.md`, `system-docs/dds/dds.md` (`ARC-001`) |
| **Toàn Service** | [foundation-setup-plan.md](foundation-setup-plan.md) | `SVC-FSP` | `FND-KSK-` | `system-docs/plans/foundation-setup-plan.md`, `tech-tool-stack.md` |
| **Toàn Service** | [build-plan.md](build-plan.md) | `SVC-BLD` | `BLD-KSK-` | `data-build-plan.md`, `ui-ux-build-plan.md`, `api-build-plan.md`, `fr-nfr-build-plan.md`, `foundation-setup-plan.md` |
| **Data** | [data/data-specs.md](data/data-specs.md) | `SVC-SPEC`| `DATA-KSK-` | `system-docs/srs/data-specs.md` (`DATA-SYS-001..003`) |
| **Data** | [data/data-design.md](data/data-design.md) | `SVC-DES` | `DTD-KSK-` | `data/data-specs.md`, `system-docs/dds/data-design.md` |
| **Data** | [data/data-build-plan.md](data/data-build-plan.md) | `SVC-BLD` | `BLD-KSK-` | `data/data-design.md` (`DTD-KSK-001..004`) |
| **Data** | [data/data-test-plan.md](data/data-test-plan.md) | `SVC-TST` | `TST-KSK-` | `data/data-specs.md` (trực tiếp) |
| **UI/UX** | [ui-ux/ui-ux-specs.md](ui-ux/ui-ux-specs.md) | `SVC-SPEC`| `UI-KSK-` | `system-docs/srs/ui-ux-specs.md` (`UI-SYS-001..003`) |
| **UI/UX** | [ui-ux/ui-ux-design.md](ui-ux/ui-ux-design.md) | `SVC-DES` | `UXD-KSK-` | `ui-ux/ui-ux-specs.md`, `system-docs/dds/ui-ux-design.md` |
| **UI/UX** | [ui-ux/ui-ux-build-plan.md](ui-ux/ui-ux-build-plan.md) | `SVC-BLD` | `BLD-KSK-` | `ui-ux/ui-ux-design.md` (`UXD-KSK-001..005`) |
| **UI/UX** | [ui-ux/ui-ux-test-plan.md](ui-ux/ui-ux-test-plan.md) | `SVC-TST` | `TST-KSK-` | `ui-ux/ui-ux-specs.md` (trực tiếp) |
| **API** | [api/api-specs.md](api/api-specs.md) | `SVC-SPEC`| `API-KSK-` | `system-docs/srs/api-specs.md` (`API-SYS-001..003`) |
| **API** | [api/api-design.md](api/api-design.md) | `SVC-DES` | `APD-KSK-` | `api/api-specs.md`, `system-docs/dds/api-design.md` |
| **API** | [api/api-build-plan.md](api/api-build-plan.md) | `SVC-BLD` | `BLD-KSK-` | `api/api-design.md` (`APD-KSK-001..004`) |
| **API** | [api/api-test-plan.md](api/api-test-plan.md) | `SVC-TST` | `TST-KSK-` | `api/api-specs.md` (trực tiếp) |
| **FR/NFR** | [fr-nfr/fr-nfr-specs.md](fr-nfr/fr-nfr-specs.md) | `SVC-SPEC`| `FR-KSK-`, `NFR-KSK-` | `system-docs/srs/fr-nfr-specs.md` (`FR-SYS-001..006`) |
| **FR/NFR** | [fr-nfr/fr-nfr-design.md](fr-nfr/fr-nfr-design.md) | `SVC-DES` | `SOL-KSK-` | `fr-nfr/fr-nfr-specs.md`, `system-docs/dds/fr-nfr-design.md` |
| **FR/NFR** | [fr-nfr/fr-nfr-build-plan.md](fr-nfr/fr-nfr-build-plan.md) | `SVC-BLD` | `BLD-KSK-` | `fr-nfr/fr-nfr-design.md` (`SOL-KSK-001..008`) |
| **FR/NFR** | [fr-nfr/fr-nfr-test-plan.md](fr-nfr/fr-nfr-test-plan.md) | `SVC-TST` | `TST-KSK-` | `fr-nfr/fr-nfr-specs.md` (trực tiếp) |
