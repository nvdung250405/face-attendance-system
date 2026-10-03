---
title: Master Documentation Portal
version: 2.0
status: Approved
owner: Solution Architect & SDLC Governance Lead
---

# Danh mục Điều hướng Toàn bộ Bộ tài liệu SDLC (Master Documentation Portal)

> - **Hệ thống**: Hệ thống Chấm công Khuôn mặt Doanh nghiệp (`face-attendance-system`)  
> - **Tiêu chuẩn Kiến trúc & Quản trị**: Tuân thủ chuẩn 2 tầng (System-Level & Service-Level) quy định tại [`sdlc-docs.md`](sdlc-docs.md) và [`meta.md`](meta.md).  
> - **Quy tắc Đặc tả**: 100% tài liệu trừu tượng hóa, không chứa đường dẫn mã nguồn nội bộ hoặc tên hàm/lớp triển khai cụ thể; mỗi phần tử kỹ thuật có mã định danh duy nhất phục vụ truy vết hai chiều (Bi-directional Traceability).

---

## 🏛️ Lớp Quản trị & Quy ước Toàn hệ thống (Governance Layer)

| Tài liệu | Mã Leaf | Mục đích Quản trị & Nội dung Chính |
| :--- | :---: | :--- |
| [**`docs/meta.md`**](meta.md) | `META` | Quy chuẩn định danh (29 prefixes), 6 canonical schemas, Document Tree, Registry, Traceability và Quality Gates. |
| [**`docs/sdlc-docs.md`**](sdlc-docs.md) | `SDLC-GUIDE` | Đặc tả quy chuẩn cấu trúc tài liệu, nguyên tắc thiết kế và hướng dẫn vòng đời phát triển phần mềm. |

---

## 🌐 Tầng 1: Tài liệu Cấp Hệ thống (System-Level Documentation)

Tài liệu Cấp Hệ thống xác lập khuôn khổ định hướng chiến lược, bối cảnh bài toán, tiêu chuẩn công nghệ nền tảng, kiến trúc tổng thể, đặc tả yêu cầu toàn diện và kế hoạch phối hợp liên phân hệ.

### 1.1. Khởi tạo, Bối cảnh & Công nghệ Nền tảng
| Tài liệu | Mã Leaf | ID Prefix | Tóm tắt Nội dung Kỹ thuật |
| :--- | :---: | :---: | :--- |
| [**`system-docs/info.md`**](system-docs/info.md) | `INFO` | `SRC-`, `INF-` | Kho khảo sát thực tế, bằng chứng kỹ thuật, phân tích tính khả thi và bối cảnh pháp lý Luật 2025. |
| [**`system-docs/tech-tool-stack.md`**](system-docs/tech-tool-stack.md) | `STACK` | `STK-` | Danh mục công nghệ chuẩn hóa: Python/PySide6, Java 21/Spring Boot, React/Tailwind, PostgreSQL, SQLite WAL, ONNX. |
| [**`system-docs/pi.md`**](system-docs/pi.md) | `PI` | `PD-` | Mục tiêu chiến lược, phạm vi sản phẩm (SOW), tiêu chí thành công (KPIs) và quyết định khởi tạo dự án. |

### 1.2. Phân hệ Đặc tả Yêu cầu Hệ thống (System Requirements Specification - SRS)
| Tài liệu | Mã Leaf | ID Prefix | Tóm tắt Nội dung Kỹ thuật |
| :--- | :---: | :---: | :--- |
| [**`system-docs/srs/srs.md`**](system-docs/srs/srs.md) | `SRS` | `ACT-`, `EXT-`, `SRS-` | Ngữ cảnh hệ thống, định danh tác nhân (Actor), hệ thống ngoài và các yêu cầu cross-cutting. |
| [**`system-docs/srs/fr-nfr-specs.md`**](system-docs/srs/fr-nfr-specs.md) | `SPEC-FR` | `FR-SYS-`, `NFR-SYS-` | 15 Yêu cầu chức năng cốt lõi (FR-01..15) và 10 chỉ số chất lượng hệ thống (NFR-01..10). |
| [**`system-docs/srs/ui-ux-specs.md`**](system-docs/srs/ui-ux-specs.md) | `SPEC-UI` | `UI-SYS-` | Đặc tả hành trình người dùng toàn trình, trải nghiệm tương tác Kiosk và Cổng Web. |
| [**`system-docs/srs/api-specs.md`**](system-docs/srs/api-specs.md) | `SPEC-API` | `API-SYS-` | Đặc tả các giao diện truyền thông trung lập công nghệ, luồng REST API và WebSocket STOMP. |
| [**`system-docs/srs/data-specs.md`**](system-docs/srs/data-specs.md) | `SPEC-DAT` | `DATA-SYS-` | Đặc tả mô hình dữ liệu khái niệm, thực thể trung tâm và chính sách bảo vệ dữ liệu sinh trắc học. |

### 1.3. Phân hệ Thiết kế Chi tiết Hệ thống (Detailed Design Specification - DDS)
| Tài liệu | Mã Leaf | ID Prefix | Tóm tắt Nội dung Kỹ thuật |
| :--- | :---: | :---: | :--- |
| [**`system-docs/dds/dds.md`**](system-docs/dds/dds.md) | `DDS` | `ARC-SYS-`, `DD-SYS-` | Kiến trúc phân tầng C4, phân rã 3 ranh giới service, 6 quyết định kiến trúc then chốt (ADR). |
| [**`system-docs/dds/fr-nfr-design.md`**](system-docs/dds/fr-nfr-design.md) | `DES-FR` | `SOL-SYS-`, `DD-SOL-` | Thiết kế giải pháp kỹ thuật cho chu trình AI biên, xác thực OTP và bảo mật đa tầng. |
| [**`system-docs/dds/ui-ux-design.md`**](system-docs/dds/ui-ux-design.md) | `DES-UI` | `UXD-SYS-`, `DD-UXD-` | Thiết kế hệ thống Design System chung, bộ quy chuẩn màu sắc, typography và tỷ lệ hình học. |
| [**`system-docs/dds/api-design.md`**](system-docs/dds/api-design.md) | `DES-API` | `APD-SYS-`, `DD-APD-` | Thiết kế hợp đồng API cụ thể, schema JSON Request/Response, mã lỗi RFC 7807 và kênh STOMP. |
| [**`system-docs/dds/data-design.md`**](system-docs/dds/data-design.md) | `DES-DAT` | `DTD-SYS-`, `DD-DTD-` | Thiết kế mô hình CSDL quan hệ PostgreSQL 16, CSDL cục bộ SQLite WAL và chiến lược lập chỉ mục. |

### 1.4. Phân hệ Kế hoạch Hệ thống (System Plans)
| Tài liệu | Mã Leaf | ID Prefix | Tóm tắt Nội dung Kỹ thuật |
| :--- | :---: | :---: | :--- |
| [**`system-docs/plans/project-plan.md`**](system-docs/plans/project-plan.md) | `PLN-PRJ` | `APC-SYS-`, `PRJ-SYS-`, `RSK-SYS-` | Kế hoạch tổ chức, WBS 5 Phase, 6 mốc nghiệm thu (Milestones) và ma trận rủi ro hệ thống. |
| [**`system-docs/plans/foundation-setup-plan.md`**](system-docs/plans/foundation-setup-plan.md) | `PLN-FND` | `FND-SYS-` | Kế hoạch chuẩn bị hạ tầng Monorepo, môi trường thực thi và chuỗi công cụ phát triển chung. |
| [**`system-docs/plans/build-plan.md`**](system-docs/plans/build-plan.md) | `PLN-BLD` | `BLD-SYS-` | Kế hoạch xây dựng & tích hợp toàn diện xuyên suốt 3 phân hệ từ Biên đến Trung tâm. |
| [**`system-docs/plans/test-plan.md`**](system-docs/plans/test-plan.md) | `PLN-TST` | `TST-SYS-` | Kế hoạch kiểm thử tích hợp, ma trận kiểm định chất lượng toàn trình và tiêu chí nghiệm thu. |
| [**`system-docs/plans/deploy-plan.md`**](system-docs/plans/deploy-plan.md) | `PLN-DPL` | `DPL-SYS-` | Kế hoạch đóng gói, phát hành, triển khai môi trường và kịch bản dự phòng khôi phục. |

---

## 🚀 Tầng 2: Tài liệu Cấp Dịch vụ (Service-Level Documentation)

Tài liệu Cấp Dịch vụ đi sâu vào từng phân hệ độc lập trong thư mục `/app`, cụ thể hóa trách nhiệm kỹ thuật và chi tiết thi công theo các nhánh facet tương ứng.

### 2.1. Phân hệ Trạm Điểm danh Kiosk Desktop — [`kiosk-app`](service-docs/kiosk-app/README.md)
*Trạm điểm danh cận biên chạy độc lập trên phần cứng tại chỗ, giao diện cảm ứng dọc 9:16, tích hợp AI thị giác máy tính và CSDL đệm ngoại tuyến.*

| Nhánh Facet | Tài liệu | Mã Leaf | ID Prefix | Nội dung Trọng tâm |
| :--- | :--- | :---: | :---: | :--- |
| **Hub** | [**`kiosk-app/README.md`**](service-docs/kiosk-app/README.md) | `KSK-HUB` | — | Tổng quan phân hệ Kiosk và cẩm nang điều hướng 4 facet. |
| **Toàn Service** | [**`foundation-setup-plan.md`**](service-docs/kiosk-app/foundation-setup-plan.md) | `SVC-FSP` | `FND-KSK-` | Môi trường ảo Python, thư viện PySide6/OpenCV, kiểm định mô hình ONNX. |
| **Toàn Service** | [**`build-plan.md`**](service-docs/kiosk-app/build-plan.md) | `SVC-BLD` | `BLD-KSK-` | Kế hoạch build tổng của Kiosk, điều phối thứ tự wave và chuẩn hóa task. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-specs.md`**](service-docs/kiosk-app/fr-nfr/fr-nfr-specs.md) | `SVC-SPEC` | `FR-KSK-`, `NFR-KSK-` | Yêu cầu thị giác YuNet, MiniFASNet, ArcFace, bàn phím PIN, đệm 120s. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-design.md`**](service-docs/kiosk-app/fr-nfr/fr-nfr-design.md) | `SVC-DES` | `SOL-KSK-` | Thiết kế pipeline thị giác biên, kiểm chuẩn Oval và hàng đợi SQLite WAL. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-build-plan.md`**](service-docs/kiosk-app/fr-nfr/fr-nfr-build-plan.md) | `SVC-BLD` | `CBL-KSK-` | Kế hoạch thi công module camera worker, AI detector, RAM matcher. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-test-plan.md`**](service-docs/kiosk-app/fr-nfr/fr-nfr-test-plan.md) | `SVC-TST` | `TST-KSK-` | Ma trận kiểm thử đơn vị, chống giả mạo PAD và kiểm thử ngâm tải RAM 8h. |
| **UI/UX** | [**`ui-ux/ui-ux-specs.md`**](service-docs/kiosk-app/ui-ux/ui-ux-specs.md) | `SVC-SPEC` | `UI-KSK-` | Hành trình điểm danh, nhập PIN dự phòng và máy trạng thái Oval 4 màu. |
| **UI/UX** | [**`ui-ux/ui-ux-design.md`**](service-docs/kiosk-app/ui-ux/ui-ux-design.md) | `SVC-DES` | `UXD-KSK-` | Design tokens QML, tỷ lệ co giãn động $1080\times 1920$, modal PIN và In-Viewport. |
| **UI/UX** | [**`ui-ux/ui-ux-build-plan.md`**](service-docs/kiosk-app/ui-ux/ui-ux-build-plan.md) | `SVC-BLD` | `UBL-KSK-` | Kế hoạch thi công component QML, hiệu ứng sóng quét và âm thanh phản hồi. |
| **UI/UX** | [**`ui-ux/ui-ux-test-plan.md`**](service-docs/kiosk-app/ui-ux/ui-ux-test-plan.md) | `SVC-TST` | `TST-KSK-` | Kế hoạch kiểm thử giao diện và tương tác chạm người dùng. |
| **API** | [**`api/api-specs.md`**](service-docs/kiosk-app/api/api-specs.md) | `SVC-SPEC` | `API-KSK-` | Đặc tả interface HTTP tiêu thụ (`punch`, `sync-batch`, `gallery`) và STOMP. |
| **API** | [**`api/api-design.md`**](service-docs/kiosk-app/api/api-design.md) | `SVC-DES` | `APD-KSK-` | Thiết kế HTTP Client (`httpx`), luồng STOMP worker và đồng bộ bù ngoại tuyến. |
| **API** | [**`api/api-build-plan.md`**](service-docs/kiosk-app/api/api-build-plan.md) | `SVC-BLD` | `ABL-KSK-` | Kế hoạch thi công HTTP client wrapper và worker đồng bộ ngầm. |
| **API** | [**`api/api-test-plan.md`**](service-docs/kiosk-app/api/api-test-plan.md) | `SVC-TST` | `TST-KSK-` | Kế hoạch kiểm thử truyền thông mạng Kiosk và đồng bộ ngoại tuyến. |
| **Data** | [**`data/data-specs.md`**](service-docs/kiosk-app/data/data-specs.md) | `SVC-SPEC` | `DATA-KSK-` | Thực thể hàng đợi `offline_punches` và ma trận bộ nhớ RAM NumPy. |
| **Data** | [**`data/data-design.md`**](service-docs/kiosk-app/data/data-design.md) | `SVC-DES` | `DTD-KSK-` | Lược đồ bảng SQLite WAL, cơ chế PRAGMA tối ưu và công thức tích vô hướng. |
| **Data** | [**`data/data-build-plan.md`**](service-docs/kiosk-app/data/data-build-plan.md) | `SVC-BLD` | `DBL-KSK-` | Kế hoạch thi công bảng CSDL cục bộ và module quản lý RAM gallery. |
| **Data** | [**`data/data-test-plan.md`**](service-docs/kiosk-app/data/data-test-plan.md) | `SVC-TST` | `TST-KSK-` | Kế hoạch kiểm thử CSDL SQLite WAL và ma trận RAM. |

---

### 2.2. Phân hệ Máy chủ Doanh nghiệp — [`backend-service`](service-docs/backend-service/README.md)
*Trung tâm xử lý nghiệp vụ, quản lý phiên xác thực JWT, mã hóa dữ liệu sinh trắc học AES-256-GCM, phát sóng thời gian thực WebSocket STOMP và CSDL PostgreSQL 16.*

| Nhánh Facet | Tài liệu | Mã Leaf | ID Prefix | Nội dung Trọng tâm |
| :--- | :--- | :---: | :---: | :--- |
| **Hub** | [**`backend-service/README.md`**](service-docs/backend-service/README.md) | `BE-HUB` | — | Tổng quan phân hệ Backend và cẩm nang điều hướng 3 facet. |
| **Toàn Service** | [**`foundation-setup-plan.md`**](service-docs/backend-service/foundation-setup-plan.md) | `SVC-FSP` | `FND-BE-` | Môi trường Java 21 LTS, cấu hình Maven, Spring Boot Starter và Flyway. |
| **Toàn Service** | [**`build-plan.md`**](service-docs/backend-service/build-plan.md) | `SVC-BLD` | `BLD-BE-` | Kế hoạch build tổng của Backend, điều phối thứ tự wave và chuẩn hóa task. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-specs.md`**](service-docs/backend-service/fr-nfr/fr-nfr-specs.md) | `SVC-SPEC` | `FR-BE-`, `NFR-BE-` | Xác thực RBAC, xử lý điểm danh, mã hóa vector sinh trắc học, độ trễ $\le 100\text{ ms}$. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-design.md`**](service-docs/backend-service/fr-nfr/fr-nfr-design.md) | `SVC-DES` | `SOL-BE-` | Security filter chain, Biometric crypto service, STOMP event broadcaster. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-build-plan.md`**](service-docs/backend-service/fr-nfr/fr-nfr-build-plan.md) | `SVC-BLD` | `CBL-BE-` | Kế hoạch thi công JWT provider, attendance engine và aspect audit trail. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-test-plan.md`**](service-docs/backend-service/fr-nfr/fr-nfr-test-plan.md) | `SVC-TST` | `TST-BE-` | Ca kiểm thử JUnit 5, MockMvc, Testcontainers PostgreSQL và kiểm thử tải. |
| **Data** | [**`data/data-specs.md`**](service-docs/backend-service/data/data-specs.md) | `SVC-SPEC` | `DATA-BE-` | Thực thể `users`, `biometric_templates`, `attendance_logs`, `audit_logs`. |
| **Data** | [**`data/data-design.md`**](service-docs/backend-service/data/data-design.md) | `SVC-DES` | `DTD-BE-` | Lược đồ bảng PostgreSQL 16, chỉ mục khóa ngoại và cấu hình kết nối HikariCP. |
| **Data** | [**`data/data-build-plan.md`**](service-docs/backend-service/data/data-build-plan.md) | `SVC-BLD` | `DBL-BE-` | Kế hoạch thi công script Flyway migration và Spring Data JPA Repositories. |
| **Data** | [**`data/data-test-plan.md`**](service-docs/backend-service/data/data-test-plan.md) | `SVC-TST` | `TST-BE-` | Kế hoạch kiểm thử tính toàn vẹn CSDL và migration. |
| **API** | [**`api/api-specs.md`**](service-docs/backend-service/api/api-specs.md) | `SVC-SPEC` | `API-BE-` | Danh mục REST endpoints (`punch`, `sync-batch`, `gallery`, `consent`) và STOMP topics. |
| **API** | [**`api/api-design.md`**](service-docs/backend-service/api/api-design.md) | `SVC-DES` | `APD-BE-` | Thiết kế REST Controllers, Record DTOs, Validation và STOMP Broker. |
| **API** | [**`api/api-build-plan.md`**](service-docs/backend-service/api/api-build-plan.md) | `SVC-BLD` | `ABL-BE-` | Kế hoạch thi công API Controllers, WebSocket handlers và global exception. |
| **API** | [**`api/api-test-plan.md`**](service-docs/backend-service/api/api-test-plan.md) | `SVC-TST` | `TST-BE-` | Kế hoạch kiểm thử hợp đồng REST API và STOMP. |

---

### 2.3. Phân hệ Cổng Web Quản trị & Người dùng — [`web-portal`](service-docs/web-portal/README.md)
*Cổng thông tin kép SPA React/Tailwind phục vụ quản lý nhân sự theo dõi chấm công thời gian thực và nhân viên ký cam kết kích hoạt sinh trắc học.*

| Nhánh Facet | Tài liệu | Mã Leaf | ID Prefix | Nội dung Trọng tâm |
| :--- | :--- | :---: | :---: | :--- |
| **Hub** | [**`web-portal/README.md`**](service-docs/web-portal/README.md) | `WEB-HUB` | — | Tổng quan phân hệ Web Portal và cẩm nang điều hướng 4 facet. |
| **Toàn Service** | [**`foundation-setup-plan.md`**](service-docs/web-portal/foundation-setup-plan.md) | `SVC-FSP` | `FND-WEB-` | Môi trường Node.js 20+, cấu hình Vite 5, React 18/19 TypeScript và Tailwind. |
| **Toàn Service** | [**`build-plan.md`**](service-docs/web-portal/build-plan.md) | `SVC-BLD` | `BLD-WEB-` | Kế hoạch build tổng của Web Portal, điều phối thứ tự wave và chuẩn hóa task. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-specs.md`**](service-docs/web-portal/fr-nfr/fr-nfr-specs.md) | `SVC-SPEC` | `FR-WEB-`, `NFR-WEB-` | Đăng nhập phân quyền, ký cam kết Consent, nhận sự kiện STOMP, xuất file Excel/PDF. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-design.md`**](service-docs/web-portal/fr-nfr/fr-nfr-design.md) | `SVC-DES` | `SOL-WEB-` | Quản lý phiên Zustand, React Router guards, STOMP hook và động cơ xuất file. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-build-plan.md`**](service-docs/web-portal/fr-nfr/fr-nfr-build-plan.md) | `SVC-BLD` | `CBL-WEB-` | Kế hoạch thi công Auth store, module cam kết, STOMP client và báo cáo. |
| **FR/NFR** | [**`fr-nfr/fr-nfr-test-plan.md`**](service-docs/web-portal/fr-nfr/fr-nfr-test-plan.md) | `SVC-TST` | `TST-WEB-` | Ca kiểm thử Vitest, React Testing Library, kiểm thử luồng E2E và responsive. |
| **Data** | [**`data/data-specs.md`**](service-docs/web-portal/data/data-specs.md) | `SVC-SPEC` | `DATA-WEB-` | Thực thể Local/SessionStorage và TanStack Query Cache. |
| **Data** | [**`data/data-design.md`**](service-docs/web-portal/data/data-design.md) | `SVC-DES` | `DTD-WEB-` | TypeScript contracts, Storage Adapter và cấu trúc khóa cache. |
| **Data** | [**`data/data-build-plan.md`**](service-docs/web-portal/data/data-build-plan.md) | `SVC-BLD` | `DBL-WEB-` | Kế hoạch thi công tầng lưu trữ client và bộ đệm cache. |
| **Data** | [**`data/data-test-plan.md`**](service-docs/web-portal/data/data-test-plan.md) | `SVC-TST` | `TST-WEB-` | Kế hoạch kiểm thử lưu trữ client và bộ đệm cache. |
| **API** | [**`api/api-specs.md`**](service-docs/web-portal/api/api-specs.md) | `SVC-SPEC` | `API-WEB-` | Đặc tả interface tiêu thụ (`auth`, `attendance`, `consent`) và đăng ký STOMP topic. |
| **API** | [**`api/api-design.md`**](service-docs/web-portal/api/api-design.md) | `SVC-DES` | `APD-WEB-` | Thiết kế Axios client instance, tự động làm mới token và hook `useStompListener`. |
| **API** | [**`api/api-build-plan.md`**](service-docs/web-portal/api/api-build-plan.md) | `SVC-BLD` | `ABL-WEB-` | Kế hoạch thi công Axios wrapper, API services và STOMP provider. |
| **API** | [**`api/api-test-plan.md`**](service-docs/web-portal/api/api-test-plan.md) | `SVC-TST` | `TST-WEB-` | Kế hoạch kiểm thử Axios client và WebSocket STOMP hooks. |
| **UI/UX** | [**`ui-ux/ui-ux-specs.md`**](service-docs/web-portal/ui-ux/ui-ux-specs.md) | `SVC-SPEC` | `UI-WEB-` | Luồng ký cam kết, thẻ thống kê KPI, bảng Live Table và lịch biểu cá nhân. |
| **UI/UX** | [**`ui-ux/ui-ux-design.md`**](service-docs/web-portal/ui-ux/ui-ux-design.md) | `SVC-DES` | `UXD-WEB-` | Bảng màu Tailwind, typography Inter, cấu trúc Sidebar/Header và modal dialogs. |
| **UI/UX** | [**`ui-ux/ui-ux-build-plan.md`**](service-docs/web-portal/ui-ux/ui-ux-build-plan.md) | `SVC-BLD` | `UBL-WEB-` | Kế hoạch thi công bộ thành phần Base UI, trang Dashboard và Calendar view. |
| **UI/UX** | [**`ui-ux/ui-ux-test-plan.md`**](service-docs/web-portal/ui-ux/ui-ux-test-plan.md) | `SVC-TST` | `TST-WEB-` | Kế hoạch kiểm thử giao diện và độ phản hồi đa thiết bị. |
