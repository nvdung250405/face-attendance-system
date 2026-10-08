---
title: Master Documentation Portal
version: 3.0
status: Approved
owner: Solution Architect & SDLC Governance Lead
type: hub
scope: PROJECT
updated: 2026-10-08
---

# Danh mục Điều hướng Toàn bộ Bộ tài liệu SDLC (Master Documentation Portal)

> - **Hệ thống**: Hệ thống Chấm công Khuôn mặt Doanh nghiệp (`face-attendance-system`)  
> - **Tiêu chuẩn Kiến trúc & Quản trị**: Tuân thủ chuẩn 2 tầng (System-Level & Subsystem-Level) quy định tại [`sdlc-docs.md`](sdlc-docs.md) v3.x và [`meta.md`](meta.md) v4.0.  
> - **Quy tắc Đặc tả**: 100% tài liệu trừu tượng hóa, không chứa đường dẫn mã nguồn nội bộ hoặc tên hàm/lớp triển khai cụ thể; mỗi phần tử kỹ thuật có mã định danh duy nhất phục vụ truy vết hai chiều (Bi-directional Traceability).
> - **Cấu trúc Thư mục Hợp nhất**: Cấp hệ thống và cấp phân hệ được chuẩn hóa thành 2 thư mục cốt lõi `specs/` (hợp nhất SRS & DDS) và `plans/`.

---

## 🏛️ Lớp Quản trị & Quy ước Toàn hệ thống (Governance Layer)

| Tài liệu | Mã Leaf | Mục đích Quản trị & Nội dung Chính |
| :--- | :---: | :--- |
| [**`docs/meta.md`**](meta.md) | `META` | Quy chuẩn định danh (29 prefixes), 6 canonical schemas, Document Tree, Registry, Traceability và Quality Gates. |
| [**`docs/sdlc-docs.md`**](sdlc-docs.md) | `SDLC-GUIDE` | Đặc tả quy chuẩn cấu trúc tài liệu, nguyên tắc thiết kế và hướng dẫn vòng đời phát triển phần mềm v3.x. |

---

## 🌐 Tầng 1: Tài liệu Cấp Hệ thống (System-Level Documentation)

Tài liệu Cấp Hệ thống xác lập khuôn khổ định hướng chiến lược, bối cảnh bài toán, tiêu chuẩn công nghệ nền tảng, kiến trúc tổng thể, đặc tả yêu cầu toàn diện và kế hoạch phối hợp liên phân hệ.

### 1.1. Khởi tạo, Bối cảnh & Công nghệ Nền tảng
| Tài liệu | Mã Leaf | ID Prefix | Tóm tắt Nội dung Kỹ thuật |
| :--- | :---: | :---: | :--- |
| [**`system-docs/info.md`**](system-docs/info.md) | `INFO` | `RQ-`, `SRC-`, `INF-`, `ANL-`, `GAP-` | Kho khảo sát thực tế, bằng chứng kỹ thuật, phân tích tính khả thi và bối cảnh pháp lý Nghị định 13/2023. |
| [**`system-docs/tech-tool-stack.md`**](system-docs/tech-tool-stack.md) | `STACK` | `STK-` | Danh mục công nghệ chuẩn hóa: Python 3.14/PySide6, Java 21 LTS/Spring Boot 3.4.x, React 19/Tailwind 4, PostgreSQL 16, SQLite WAL, ONNX. |
| [**`system-docs/pi.md`**](system-docs/pi.md) | `PI` | `PD-` | Mục tiêu chiến lược, phạm vi sản phẩm (SOW), tiêu chí thành công (KPIs) và quyết định khởi tạo dự án. |

### 1.2. Bộ Đặc tả Kỹ thuật Hệ thống Hợp nhất (`system-docs/specs/`)
| Tài liệu | Mã Leaf | ID Prefix | Tóm tắt Nội dung Kỹ thuật |
| :--- | :---: | :---: | :--- |
| [**`system-docs/specs/spec.md`**](system-docs/specs/spec.md) | `SYS-SPEC` | `ACT-`, `EXT-`, `ARC-`, `DD-SYS-` | Kiến trúc tổng thể hệ thống, phân rã 3 phân hệ, tác nhân/hệ thống ngoài và 28 quyết định kiến trúc then chốt (`DD-SYS-001..028`). |
| [**`system-docs/specs/fr-nfr.md`**](system-docs/specs/fr-nfr.md) | `SYS-FRNFR` | `FR-SYS-`, `NFR-SYS-`, `SOL-SYS-` | 27 Yêu cầu chức năng (`FR-SYS-001..027`), 10 tiêu chuẩn chất lượng (`NFR-SYS-001..010`), và 20 giải pháp hệ thống (`SOL-SYS-001..020`). |

### 1.3. Kế hoạch Quản lý & Vận hành Hệ thống (`system-docs/plans/`)
| Tài liệu | Mã Leaf | ID Prefix | Tóm tắt Nội dung Kỹ thuật |
| :--- | :---: | :---: | :--- |
| [**`system-docs/plans/project-plan.md`**](system-docs/plans/project-plan.md) | `PLN-PRJ` | `APC-SYS-`, `PRJ-`, `ROL-`, `RSK-` | Kế hoạch tổ chức, WBS 5 Phase, 6 mốc nghiệm thu (Milestones) và ma trận rủi ro hệ thống. |
| [**`system-docs/plans/foundation-setup-plan.md`**](system-docs/plans/foundation-setup-plan.md) | `PLN-FND` | `APC-SYS-`, `FND-SYS-` | Kế hoạch chuẩn bị hạ tầng Monorepo, môi trường thực thi và chuỗi công cụ phát triển chung. |
| [**`system-docs/plans/deploy-plan.md`**](system-docs/plans/deploy-plan.md) | `PLN-DPL` | `APC-SYS-`, `DPL-SYS-` | Kế hoạch đóng gói, phát hành, triển khai môi trường và kịch bản dự phòng khôi phục. |
| [**`system-docs/plans/test-plan.md`**](system-docs/plans/test-plan.md) | `PLN-TST` | `APC-SYS-`, `TST-SYS-` | Kế hoạch kiểm thử tích hợp, ma trận kiểm định chất lượng toàn trình và tiêu chí nghiệm thu. |

---

## 🚀 Tầng 2: Tài liệu Cấp Phân hệ (Subsystem-Level Documentation)

Tài liệu Cấp Phân hệ đi sâu vào từng phân hệ độc lập trong thư mục `subsystem-docs/`, cụ thể hóa trách nhiệm kỹ thuật và chi tiết thi công qua 2 thư mục `specs/` và `plans/`.

### 2.1. Phân hệ Trạm Điểm danh Kiosk Desktop — [`kiosk-app`](subsystem-docs/kiosk-app/README.md)
*Trạm điểm danh cận biên chạy độc lập trên phần cứng tại chỗ, giao diện cảm ứng dọc 9:16 ($1080\times 1920\text{ px}$), tích hợp AI thị giác máy tính YuNet/MiniFASNet/ArcFace và CSDL đệm ngoại tuyến SQLite WAL.*

| Nhánh Tài liệu | Tập tin | Mã Leaf | ID Prefix | Nội dung Trọng tâm |
| :--- | :--- | :---: | :---: | :--- |
| **Hub** | [**`kiosk-app/README.md`**](subsystem-docs/kiosk-app/README.md) | `KSK-HUB` | — | Tổng quan phân hệ Kiosk và cẩm nang điều hướng tài liệu. |
| **Kiến trúc Lõi** | [**`specs/spec.md`**](subsystem-docs/kiosk-app/specs/spec.md) | `KSK-SPEC` | `DD-KSK-` | Mô hình 4 luồng PySide6, vòng đời tác nhân, bảo mật Windows DPAPI và 24 quyết định kỹ thuật (`DD-KSK-001..024`). |
| **Nghiệp vụ & Giải pháp** | [**`specs/fr-nfr.md`**](subsystem-docs/kiosk-app/specs/fr-nfr.md) | `KSK-FRNFR` | `FR-KSK-`, `NFR-KSK-`, `SOL-KSK-` | 17 Yêu cầu chức năng, 11 tiêu chuẩn phi chức năng, 11 giải pháp và chuỗi xử lý thị giác máy tính biên. |
| **Dữ liệu Cục bộ** | [**`specs/data.md`**](subsystem-docs/kiosk-app/specs/data.md) | `KSK-DATA` | `DATA-KSK-`, `DTD-KSK-` | Hàng đợi SQLite WAL (`kiosk_local.db`), ma trận vector RAM NumPy và mã hóa DPAPI 2-phase rotation. |
| **Giao diện Truyền thông** | [**`specs/api.md`**](subsystem-docs/kiosk-app/specs/api.md) | `KSK-API` | `API-KSK-`, `APD-KSK-` | Hợp đồng HTTP REST API (`punch`, `sync-batch`, `gallery`), kết nối WebSocket STOMP và worker đồng bộ bù. |
| **Giao diện Người dùng** | [**`specs/ui-ux.md`**](subsystem-docs/kiosk-app/specs/ui-ux.md) | `KSK-UIUX` | `UI-KSK-`, `UXD-KSK-` | Thiết kế màn hình cảm ứng dọc 9:16, Oval 4 màu thích ứng, bàn phím số ảo PIN Pad và luồng Onboarding OTP. |
| **Kế hoạch Nền tảng** | [**`plans/foundation-setup-plan.md`**](subsystem-docs/kiosk-app/plans/foundation-setup-plan.md) | `KSK-FSP` | `FND-KSK-` | Thiết lập môi trường Python 3.14, công cụ PySide6/OpenCV và kiểm định trọng số ONNX. |
| **Kế hoạch Xây dựng** | [**`plans/build-plan.md`**](subsystem-docs/kiosk-app/plans/build-plan.md) | `KSK-BLD` | `BLD-KSK-` | Kế hoạch xây dựng tổng thể phân hệ Kiosk theo các Wave và chuẩn hóa Task. |
| **Kế hoạch Task** | [**`plans/task-plan.md`**](subsystem-docs/kiosk-app/plans/task-plan.md) | `KSK-TSK` | `TASK-KSK-` | Phân rã thi công chi tiết từng Task theo DAG và thứ tự phụ thuộc. |
| **Kế hoạch Kiểm thử** | [**`plans/test-plan.md`**](subsystem-docs/kiosk-app/plans/test-plan.md) | `KSK-TST` | `TST-KSK-` | Ma trận kiểm thử đơn vị, chống giả mạo PAD, đồng bộ ngoại tuyến và kiểm thử ngâm tải RAM 8h. |

---

### 2.2. Phân hệ Máy chủ Doanh nghiệp — [`backend-service`](subsystem-docs/backend-service/README.md)
*Trung tâm xử lý nghiệp vụ, quản lý phiên xác thực JWT, mã hóa vector sinh trắc học AES-256-GCM, phát sóng thời gian thực WebSocket STOMP và CSDL trung tâm PostgreSQL 16.*

| Nhánh Tài liệu | Tập tin | Mã Leaf | ID Prefix | Nội dung Trọng tâm |
| :--- | :--- | :---: | :---: | :--- |
| **Hub** | [**`backend-service/README.md`**](subsystem-docs/backend-service/README.md) | `BE-HUB` | — | Tổng quan phân hệ Backend và cẩm nang điều hướng tài liệu. |
| **Kiến trúc Lõi** | [**`specs/spec.md`**](subsystem-docs/backend-service/specs/spec.md) | `BE-SPEC` | `DD-BE-` | Kiến trúc phân tầng Spring Boot 3.4.x, Java 21 LTS, HikariCP, Caffeine cache và 26 quyết định kỹ thuật (`DD-BE-001..026`). |
| **Nghiệp vụ & Giải pháp** | [**`specs/fr-nfr.md`**](subsystem-docs/backend-service/specs/fr-nfr.md) | `BE-FRNFR` | `FR-BE-`, `NFR-BE-`, `SOL-BE-` | 25 Yêu cầu chức năng, 5 tiêu chuẩn phi chức năng, 28 giải pháp nghiệp vụ và sơ đồ tuần tự xử lý. |
| **Lưu trữ CSDL** | [**`specs/data.md`**](subsystem-docs/backend-service/specs/data.md) | `BE-DATA` | `DATA-BE-`, `DTD-BE-` | Lược đồ CSDL PostgreSQL 16, Flyway migrations (`V1`..`V5`), AES-256-GCM crypto và Caffeine cache TTL 120s. |
| **Hợp đồng API** | [**`specs/api.md`**](subsystem-docs/backend-service/specs/api.md) | `BE-API` | `API-BE-`, `APD-BE-` | 44 REST endpoints, 3 STOMP topics, RFC 7807 Error Dictionary và chi tiết schema từng trường. |
| **Kế hoạch Nền tảng** | [**`plans/foundation-setup-plan.md`**](subsystem-docs/backend-service/plans/foundation-setup-plan.md) | `BE-FSP` | `FND-BE-` | Môi trường Java 21, Maven toolchain, Spring Boot Starter và cấu hình ban đầu. |
| **Kế hoạch Xây dựng** | [**`plans/build-plan.md`**](subsystem-docs/backend-service/plans/build-plan.md) | `BE-BLD` | `BLD-BE-` | Kế hoạch xây dựng & tích hợp tổng thể phân hệ Backend theo Wave. |
| **Kế hoạch Task** | [**`plans/task-plan.md`**](subsystem-docs/backend-service/plans/task-plan.md) | `BE-TSK` | `TASK-BE-` | Phân rã nhiệm vụ thi công chi tiết theo DAG và thứ tự phụ thuộc. |
| **Kế hoạch Kiểm thử** | [**`plans/test-plan.md`**](subsystem-docs/backend-service/plans/test-plan.md) | `BE-TST` | `TST-BE-` | Kiểm thử tích hợp JUnit 5, MockMvc, Testcontainers PostgreSQL 16 và Karate API. |

---

### 2.3. Phân hệ Cổng Web Quản trị & Người dùng — [`web-portal`](subsystem-docs/web-portal/README.md)
*Cổng thông tin kép SPA React 19/Tailwind CSS 4 phục vụ quản lý nhân sự theo dõi chấm công thời gian thực và nhân viên ký cam kết kích hoạt sinh trắc học theo Nghị định 13/2023.*

| Nhánh Tài liệu | Tập tin | Mã Leaf | ID Prefix | Nội dung Trọng tâm |
| :--- | :--- | :---: | :---: | :--- |
| **Hub** | [**`web-portal/README.md`**](subsystem-docs/web-portal/README.md) | `WEB-HUB` | — | Tổng quan phân hệ Web Portal và cẩm nang điều hướng tài liệu. |
| **Kiến trúc Lõi** | [**`specs/spec.md`**](subsystem-docs/web-portal/specs/spec.md) | `WEB-SPEC` | `DD-WEB-` | Kiến trúc SPA React 19, TypeScript, Vite 8, phân quyền Dual-Role và 20 quyết định kỹ thuật (`DD-WEB-001..020`). |
| **Nghiệp vụ & Giải pháp** | [**`specs/fr-nfr.md`**](subsystem-docs/web-portal/specs/fr-nfr.md) | `WEB-FRNFR` | `FR-WEB-`, `NFR-WEB-`, `SOL-WEB-` | 14 Yêu cầu chức năng, 4 tiêu chuẩn phi chức năng, 12 giải pháp và sơ đồ tương tác tuần tự. |
| **Dữ liệu Client** | [**`specs/data.md`**](subsystem-docs/web-portal/specs/data.md) | `WEB-DATA` | `DATA-WEB-`, `DTD-WEB-` | Safe Storage Adapters (LocalStorage, SessionStorage), TypeScript contracts và TanStack Query cache. |
| **Giao tiếp Mạng** | [**`specs/api.md`**](subsystem-docs/web-portal/specs/api.md) | `WEB-API` | `API-WEB-`, `APD-WEB-` | Axios client với Mutex Token Refresh Queue chống Race Condition khi gặp 401, STOMP hooks. |
| **Giao diện Người dùng** | [**`specs/ui-ux.md`**](subsystem-docs/web-portal/specs/ui-ux.md) | `WEB-UIUX` | `UI-WEB-`, `UXD-WEB-` | Design Tokens Indigo Clean SaaS, layout Admin Shell, modal ký cam kết Nghị định 13/2023 và Calendar Grid. |
| **Kế hoạch Nền tảng** | [**`plans/foundation-setup-plan.md`**](subsystem-docs/web-portal/plans/foundation-setup-plan.md) | `WEB-FSP` | `FND-WEB-` | Thiết lập môi trường Node.js 24+, Vite 8, React 19, TypeScript và Tailwind CSS 4. |
| **Kế hoạch Xây dựng** | [**`plans/build-plan.md`**](subsystem-docs/web-portal/plans/build-plan.md) | `WEB-BLD` | `BLD-WEB-` | Kế hoạch xây dựng & tích hợp tổng thể phân hệ Web Portal qua 5 Wave. |
| **Kế hoạch Task** | [**`plans/task-plan.md`**](subsystem-docs/web-portal/plans/task-plan.md) | `WEB-TSK` | `TASK-WEB-` | Phân rã nhiệm vụ thi công chi tiết theo DAG và thứ tự phụ thuộc. |
| **Kế hoạch Kiểm thử** | [**`plans/test-plan.md`**](subsystem-docs/web-portal/plans/test-plan.md) | `WEB-TST` | `TST-WEB-` | Kiểm thử Vitest, React Testing Library, MSW và Playwright E2E đa viewport. |
