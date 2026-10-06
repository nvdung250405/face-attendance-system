---
title: Web Portal Service Build Plan
version: 1.0
status: Approved
owner: Web Lead & Frontend Architect
---

# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Tổng thể Phân hệ Web Portal


## 1. Approach (Chiến lược Thực hiện)

Phân hệ `web-portal` áp dụng chiến lược gom nhóm và sắp xếp thứ tự thực thi theo mô hình **Slices to Integration** qua các đợt phát hành (Waves), tuân thủ Mục 9.4 của [docs/sdlc-docs.md](../../../sdlc-docs.md).
* **Nguyên tắc Điều phối**: Khởi tạo nền tảng Toolchain Vite/React (Foundation) và cấu trúc dữ liệu/lưu trữ an toàn (Data Facet) trước. Sau đó phát triển đồng thời tầng giao tiếp mạng Axios/STOMP (API Facet) và các kho lưu trữ trạng thái định tuyến Auth (FR/NFR Facet). Tiếp theo ghép nối các màn hình giao diện người dùng Responsive (UI/UX Facet) và cuối cùng tích hợp luồng nghiệp vụ toàn trình (Integration).
* **Định nghĩa Hoàn thành Cấp Phân hệ (Definition of Done - DoD)**:
  * Mọi work item (`BLD-`, `FND-`) được chuẩn hóa thành 1 Task độc lập, hoàn thành trọn vẹn trong một Pull Request.
  * Toàn bộ mã nguồn TypeScript biên dịch nghiêm ngặt (`strict: true`), zero lỗi type checking.
  * Giao diện tương thích hoàn hảo trên các độ phân giải từ Mobile ($< 768\text{ px}$) đến Desktop ($\ge 1440\text{ px}$), Lighthouse Performance $\ge 90$.
  * Đạt tiêu chí nghiệm thu (`Done when`) kiểm chứng được và vượt qua toàn bộ ca kiểm thử Vitest/RTL trước khi sáp nhập vào nhánh `develop`.

---

## 2. Build Order (Thứ tự Xây dựng & Điều phối Xuyên Facet)

Bảng điều phối gom nhóm toàn bộ các work item từ các facet build plan (`foundation-setup-plan.md`, `data-build-plan.md`, `fr-nfr-build-plan.md`, `api-build-plan.md`, `ui-ux-build-plan.md`) thành các Wave có thứ tự thực thi tuần tự:

| Wave | Includes | Depends on | Done when |
| :--- | :--- | :--- | :--- |
| **Wave 1: Foundation Setup** | `FND-WEB-001`, `FND-WEB-002`, `FND-WEB-003`, `FND-WEB-004` | — | Dự án Vite 8, React 19, TypeScript, Tailwind CSS 4, TanStack Query và StompJS cài đặt hoàn tất; lệnh build chạy thành công. |
| **Wave 2: Client Data & Network Client** | `BLD-WEB-001`, `BLD-WEB-002`, `BLD-WEB-003`, `BLD-WEB-009`, `BLD-WEB-010` | Wave 1 | TypeScript data contracts đồng bộ; Safe Storage adapters hoạt động an toàn; Axios base client và bộ chặn tự động làm mới token 401 sẵn sàng. |
| **Wave 3: Core State & Admin Shell** | `BLD-WEB-012`, `BLD-WEB-013`, `BLD-WEB-004`, `BLD-WEB-005` | Wave 2 | Zustand Auth Store phân quyền chính xác; modal cam kết Informed Consent sẵn sàng; Tailwind design tokens và khung Admin Shell responsive hoàn chỉnh. |
| **Wave 4: Realtime STOMP & UI Dashboard** | `BLD-WEB-014`, `BLD-WEB-015`, `BLD-WEB-016`, `BLD-WEB-011`, `BLD-WEB-006`, `BLD-WEB-007`, `BLD-WEB-008` | Wave 3 | Hook STOMP nhận tin nhắn ổn định; bảng Live Table chớp sáng thời gian thực; thẻ KPI nhảy số; modal OTP/QR và lịch cá nhân xuất file Excel/PDF hoàn tất. |
| **Wave 5: Portal Full Integration** | `BLD-WEB-017` | Wave 4 | Luồng toàn trình từ Đăng nhập $\rightarrow$ Ký cam kết $\rightarrow$ Giám sát chấm công Live $\rightarrow$ Xuất báo cáo hoạt động trơn tru; không lỗi memory leak. |

---

## 3. Work Items (Hạng mục Tích hợp Phân hệ)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `BLD-WEB-017` | Tích hợp Toàn trình Giao diện Cổng Web | Ghép nối luồng xác thực JWT, phân quyền router guards, nhận sự kiện WebSocket STOMP cập nhật Live Table, quản lý modal OTP và xuất báo cáo. | `ARC-003`, `SOL-WEB-001`, `UXD-WEB-001`, `APD-WEB-001`, `DTD-WEB-001` | `BLD-WEB-008`, `BLD-WEB-016` | Trải nghiệm người dùng liền mạch; luồng ký cam kết mở khóa OTP chuẩn xác; bảng live table hiển thị bản ghi điểm danh mới dưới 1 giây. | Planned |

---
title: Web Portal Core Build Plan
version: 1.0
status: Approved
owner: Web Lead
---

# FR/NFR BUILD PLAN — Kế hoạch Thi công Cốt lõi Phân hệ Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Web Cốt lõi)

$$\text{Auth Store \& Router} \rightarrow \text{Consent \& OTP Module} \rightarrow \text{STOMP Realtime Client} \rightarrow \text{Live Attendance Dashboard} \rightarrow \text{Report Exporter}$$

---

## 2. Core Build Work Items (Danh mục Hạng mục Thi công Cốt lõi)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-012` | Lập trình Auth Store & Protected Routes | Xây dựng Zustand store quản lý user, token, và React Router bọc Auth Guard kiểm tra Role. | `SOL-WEB-001` | `FND-WEB-001` | Chặn truy cập trái phép; tự động điều hướng đúng trang HR hoặc Employee. | Done |
| `BLD-WEB-013` | Lập trình Luồng Ký Cam kết Informed Consent | Xây dựng Modal điều khoản pháp lý, xử lý nút ký, gọi API và hiển thị OTP 6 số kèm mã QR. | `SOL-WEB-002` | `BLD-WEB-012` | Hiển thị mã QR và OTP rõ ràng; tự động đóng modal khi nhận được tín hiệu WebSocket. | Done |
| `BLD-WEB-014` | Lập trình Dịch vụ Kết nối STOMP Client | Xây dựng Hook `useStompClient` kết nối tới `/ws-attendance`, tự động kết nối lại khi rớt mạng. Phụ thuộc dịch vụ STOMP thuộc facet `api` được giải quyết tại `TASK-WEB-018` (Mục 13.2). | `SOL-WEB-003` | `FND-WEB-001` | Nhận tin nhắn ổn định; cập nhật trạng thái kết nối trực tuyến/ngoại tuyến. | Done |
| `BLD-WEB-015` | Lập trình Bảng Chấm công HR Trực tiếp | Xây dựng bảng hiển thị sự kiện điểm danh thời gian thực, tự động thêm dòng mới vào đầu bảng. | `SOL-WEB-004` | `BLD-WEB-014` | Dòng mới chèn lên đầu kèm hiệu ứng ánh sáng nhẹ trong 3s; không giật lag. | Done |
| `BLD-WEB-016` | Lập trình Module Xuất Báo cáo Excel/PDF | Xây dựng dịch vụ trích xuất bảng dữ liệu và tải xuống file Excel/PDF định dạng chuẩn. | `SOL-WEB-005` | `BLD-WEB-015` | Xuất file đầy đủ định dạng tiêu đề, thời gian, tên công ty và số liệu chấm công. | Done |
| `BLD-WEB-018` | Lập trình Module Vòng đời Tài khoản & Phiên | Xây dựng luồng tạo/sửa/vô hiệu hóa hồ sơ nhân sự, hộp thoại mật khẩu tạm một lần, luồng đổi mật khẩu tự nguyện và đăng xuất thu hồi phiên. | `SOL-WEB-006`, `SOL-WEB-010` | `BLD-WEB-012` | Mật khẩu tạm chỉ hiển thị một lần; không có luồng chặn điều hướng theo trạng thái mật khẩu; đăng xuất gọi API thu hồi token trước khi xoá storage và đồng bộ đa tab. | Planned |
| `BLD-WEB-019` | Lập trình Module Ca kíp & Kỳ công | Xây dựng màn hình CRUD ca, phân ca theo khoảng ngày kèm gợi ý khi chồng lấn, và màn hình chốt/mở lại kỳ công có lan toả cờ khoá điều chỉnh. | `SOL-WEB-007`, `SOL-WEB-008` | `BLD-WEB-012` | Phân ca chồng khoảng hiển thị lỗi kèm khoảng trống gợi ý; kỳ đã chốt vô hiệu hoá nút duyệt đơn/điều chỉnh trên toàn bộ giao diện. | Planned |
| `BLD-WEB-020` | Lập trình Module Rút Consent & Trung tâm Thông báo | Xây dựng luồng rút Informed Consent có cảnh báo hệ quả và xác nhận hai bước, màn hình yêu cầu dữ liệu cá nhân, và trung tâm thông báo trong ứng dụng. | `SOL-WEB-009`, `SOL-WEB-011` | `BLD-WEB-012` | Cảnh báo nêu rõ hệ quả trước khi rút; yêu cầu dữ liệu cá nhân hiển thị trạng thái xử lý; badge thông báo chưa đọc cập nhật tức thời. | Planned |
| `BLD-WEB-021` | Lập trình Module Quản trị Trạm Kiosk & Tuân thủ | Xây dựng màn hình đăng ký/đổi token/vô hiệu hóa trạm Kiosk (token chỉ giữ trong RAM), cảnh báo ping quá hạn, và màn hình tra cứu audit/tuân thủ chỉ đọc cho `ADMIN`/`DPO`. | `SOL-WEB-012` | `BLD-WEB-012` | Secret Token không được ghi vào LocalStorage/SessionStorage; trạm không ping quá 5 phút có cảnh báo; role `DPO` không thấy thao tác ghi. | Planned |

---
title: Web Portal Client Data Build Plan
version: 2.0
status: Approved
owner: Web Lead
---

# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Client Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Dữ liệu Client)

$$\text{TypeScript Data Contracts} \rightarrow \text{Safe Storage Adapters} \rightarrow \text{TanStack Query Cache Factory}$$

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công Dữ liệu Client)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-001` | Xây dựng TypeScript Data Contracts | Khởi tạo toàn bộ interfaces, DTOs, Enums cho AuthSession, UserProfile, AttendanceRecord, Pagination và QueryParams. | `DATA-WEB-001`, `DATA-WEB-002`, `DATA-WEB-003`, `DATA-WEB-004` | `FND-WEB-001` | Biên dịch TypeScript không cảnh báo lỗi type; toàn bộ DTOs đồng bộ 100% với Backend. | Done |
| `BLD-WEB-002` | Lập trình Safe Storage Adapters | Xây dựng module đóng gói LocalStorage và SessionStorage với cơ chế fallback bộ nhớ RAM và lắng nghe sự kiện `storage` đồng bộ đa tab. | `DTD-WEB-001`, `DTD-WEB-002`, `DTD-WEB-003` | `BLD-WEB-001` | Hoạt động an toàn trong chế độ ẩn danh (Private Browsing); logout trên 1 tab tự động sync sang các tab còn lại. | Done |
| `BLD-WEB-003` | Cấu hình TanStack Query & Cache Factory | Thiết lập `QueryClient`, định nghĩa tập trung `attendanceKeys`, `employeeKeys` và tích hợp hàm cập nhật thời gian thực khi có STOMP event. | `DATA-WEB-004` | `BLD-WEB-001` | Query cache phân tách rõ ràng; dữ liệu Live Table tự chèn vào đầu mảng mà không giật màn hình. | Done |
| `BLD-WEB-025` | Lập trình Store Trạng thái Vòng đời phía Client | Xây dựng `NotificationStateStore`, `PayrollPeriodStore` và `KioskRegistryMemoryStore` theo `DTD-WEB-004`…`DTD-WEB-006`. | `DTD-WEB-004`, `DTD-WEB-005`, `DTD-WEB-006` | `BLD-WEB-001` | Trạng thái thông báo phân tách theo người dùng và xoá khi đăng xuất; cờ khoá kỳ công không ghi LocalStorage; Secret Token chỉ tồn tại trong RAM và bị xoá khi unmount. | Planned |

---
title: Web Portal API Build Plan
version: 2.0
status: Approved
owner: Web Lead
---

# API BUILD PLAN — Kế hoạch Thi công Tầng Mạng Phân hệ Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Tầng Mạng)

$$\text{Axios Base Client} \rightarrow \text{Mutex Token Refresh Interceptor} \rightarrow \text{STOMP Service \& React Hooks}$$

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công Tầng Mạng)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-009` | Lập trình Axios Base Client & Request Interceptor | Đóng gói `axios` với baseURL, timeout $10\text{ s}$ và bộ chặn Request Interceptor tự động tiêm Bearer Token từ LocalStorage. | `APD-WEB-001` | `FND-WEB-001` | Gọi API kèm token chuẩn xác; tự động từ chối nếu không có cấu hình baseURL. | Done |
| `BLD-WEB-010` | Lập trình Token Refresh Interceptor | Xây dựng bộ chặn Response Interceptor bắt mã HTTP 401, quản lý Promise Queue chống Race Condition khi nhiều request 401 đồng thời. | `APD-WEB-002` | `BLD-WEB-009` | Tự động làm mới token trong suốt; các request đang treo được thực thi lại thành công; logout nếu refresh token hết hạn. | Done |
| `BLD-WEB-011` | Lập trình StompWebSocketService & Hooks | Tích hợp `@stomp/stompjs` và SockJS; phát triển React Hook `useLiveAttendance` và `useEnrollmentStatus`. | `APD-WEB-003` | `BLD-WEB-009` | Nhận bản tin `/topic/live-attendance` tức thời; tự hủy subscription khi component unmount mà không rò rỉ bộ nhớ. | Done |
| `BLD-WEB-022` | Lập trình Bộ Client Dịch vụ Vòng đời | Xây dựng `AdminEmployeeService`, `CredentialService`, `ShiftAdminService`, `PayrollPeriodService`, `DataSubjectService`, `LogoutService`, `NotificationService`, `ComplianceAdminService` và `ReportExportService`. | `APD-WEB-004`, `APD-WEB-005`, `APD-WEB-006`, `APD-WEB-007`, `APD-WEB-008`, `APD-WEB-009`, `APD-WEB-010`, `APD-WEB-011`, `APD-WEB-012` | `BLD-WEB-009` | Mọi giao diện vòng đời gọi đúng hợp đồng Backend; lỗi 400/401/403/409 được chuẩn hoá thành thông điệp hiển thị được; mật khẩu tạm không bị cache. | Planned |

---
title: Web Portal UI/UX Build Plan
version: 2.0
status: Approved
owner: Web Lead & UI Engineer
---

# UI/UX BUILD PLAN — Kế hoạch Thi công Giao diện Phân hệ Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Giao diện)

Xây dựng giao diện React / Tailwind CSS theo 5 giai đoạn liên tục:
$$\text{Design Tokens \& Theme} \rightarrow \text{Admin Shell Layout} \rightarrow \text{Live Monitoring Dashboard} \rightarrow \text{Consent \& OTP Modals} \rightarrow \text{Employee Attendance Calendar}$$

---

## 2. UI Build Work Items (Danh mục Hạng mục Thi công Giao diện)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-004` | Cấu hình Tailwind Design Tokens & Theme | Thiết lập `tailwind.config.js` với bảng màu Indigo, phông chữ Inter và các lớp tiện ích dùng chung. | `UXD-WEB-001` | `FND-WEB-002` | Toàn bộ giao diện áp dụng token tập trung, không dùng giá trị màu sắc hay khoảng cách tùy tiện. | Done |
| `BLD-WEB-005` | Xây dựng Khung Bố cục Quản trị (Admin Shell) | Lắp ráp Sidebar $260\text{ px}$ (hỗ trợ thu gọn $72\text{ px}$), TopHeader $64\text{ px}$ và Main Viewport Responsive. | `UXD-WEB-001` | `BLD-WEB-004` | Bố cục co giãn mượt mà; hiển thị hoàn hảo từ Mobile $< 768\text{ px}$ đến màn hình lớn $\ge 1440\text{ px}$. | Done |
| `BLD-WEB-006` | Lập trình Bảng Chấm công Trực tiếp & Thẻ KPI | Xây dựng lưới 4 thẻ KPI nhảy số thời gian thực và bảng Live Table có hiệu ứng chớp sáng khi nhận tin nhắn STOMP. | `UXD-WEB-003`, `UXD-WEB-004` | `BLD-WEB-005` | Dòng mới chèn lên đầu bảng mượt mà; số đếm KPI tăng tự động theo thời gian thực. | Done |
| `BLD-WEB-007` | Xây dựng Hộp thoại Cam kết & Hiển thị OTP | Thiết kế Modal 2 bước: Bước 1 khóa nút gửi đến khi cuộn hết văn bản; Bước 2 hiển thị mã OTP to rõ + QR Code + hiệu ứng Confetti khi hoàn tất. | `UXD-WEB-002` | `BLD-WEB-005` | Ràng buộc cuộn hoạt động chính xác; modal tự động đóng khi nhận sự kiện quét mặt từ Kiosk. | Done |
| `BLD-WEB-008` | Xây dựng Lịch Chấm công Cá nhân & Xuất File | Phát triển Calendar Grid 7 cột hiển thị giờ chấm công của nhân viên; tích hợp chức năng xuất báo cáo Excel/PDF. | `UXD-WEB-005` | `BLD-WEB-005` | Tải xuống file Excel chuẩn định dạng; nhấp chuột xem Drawer chi tiết ngày tức thời. | Done |
| `BLD-WEB-023` | Xây dựng Màn hình Quản trị Danh mục & Kỳ công | Phát triển màn hình hồ sơ nhân sự (kèm hộp thoại mật khẩu tạm), màn hình ca/phân ca trên lịch tuần và màn hình chốt kỳ công theo bố cục `UXD-WEB-006`. | `UXD-WEB-006` | `BLD-WEB-005` | Form nhập liệu trong Drawer hoạt động đúng; cảnh báo nghiệp vụ (trùng mã, chồng ca, kỳ đã chốt) hiển thị trên đầu bảng; kỳ đã chốt vô hiệu hoá nút điều chỉnh. | Planned |
| `BLD-WEB-024` | Xây dựng Màn hình Đổi mật khẩu Bắt buộc, Consent & Tuân thủ | Phát triển màn hình blocking đổi mật khẩu, luồng rút Consent/yêu cầu dữ liệu cá nhân, trung tâm thông báo và màn hình quản trị trạm Kiosk/tuân thủ theo `UXD-WEB-007`/`UXD-WEB-008`. | `UXD-WEB-007`, `UXD-WEB-008`, `UI-WEB-006`, `UI-WEB-008`, `UI-WEB-010`, `UI-WEB-011`, `UI-WEB-012` | `BLD-WEB-005` | Không thể rời màn hình đổi mật khẩu bắt buộc bằng điều hướng; Secret Token chỉ hiển thị một lần và không lưu lại; role `DPO` không thấy thao tác ghi. | Planned |
