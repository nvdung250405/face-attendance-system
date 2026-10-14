---
title: Web Portal Task Plan
version: 2.0
status: Approved
owner: Frontend Lead
type: plan
scope: WEB
updated: 2026-10-08
---

# TASK PLAN — Kế hoạch Thi công Chi tiết Cổng Web Portal

## 1. Approach (Chiến lược Thực hiện)

Tài liệu này là lớp kế hoạch thi công giữa các đơn vị quy hoạch (`BLD-`, `FND-`) trong `foundation-setup-plan.md`, `build-plan.md` và giai đoạn viết mã, tuân thủ Mục 8.7 của [docs/sdlc-docs.md](../../../sdlc-docs.md).
* **Nguyên tắc phân rã**: Mỗi `TASK-WEB-` hoàn thành trọn vẹn trong một Pull Request và `Derived from` **đúng một** `BLD-`/`FND-` cùng service.
* **Giải quyết phụ thuộc**: Phụ thuộc xuyên facet (ví dụ hook STOMP thuộc `spec` phụ thuộc dịch vụ STOMP thuộc `api`) được giải quyết **tại đây** bằng `Depends on` giữa các `TASK-`, không ghi trong build plan (Mục 13.2).
* **Cơ chế Wave**: `Wave(task) = 1 + max(Wave(dep))` theo Mục 14.4; các task cùng Wave độc lập và có thể thi công song song.

### Approach Decisions (Quyết định Tiếp cận Thi công Chi tiết)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-WEB-007` | Thực thi theo 7 Wave: Toolchain → Hợp đồng dữ liệu & Shell → Tầng mạng & Luồng Consent → Bố cục & Dịch vụ STOMP → Bảng Live & Lịch cá nhân → Xuất báo cáo → Tích hợp toàn trình | Phân rã 29 hạng mục `FND-`/`BLD-` của Web Portal thành 29 `TASK-` độc lập, ưu tiên hợp đồng dữ liệu và xác thực trước giao diện. | Big-bang integration hoặc phân công tự do (bị loại vì dễ vỡ luồng xác thực/refresh token) | Dependency xuyên facet bắt buộc giải quyết tại Task Plan; mỗi task có `Done when` đo được; task cùng Wave giao song song được. | `ARC-003`, `STK-015` | Accepted |

---

## 2. Tasks (Danh mục Nhiệm vụ Thi công)

| ID | Name | Description | Derived from | Depends on | Wave | Done when | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| `TASK-WEB-001` | Khởi tạo Dự án Vite & React TypeScript | Cấu hình `package.json`, `tsconfig.json`, `vite.config.ts` với strict type checking. | `FND-WEB-001` | — | Wave 1 | `npm run build` thành công, không cảnh báo TypeScript. | Done |
| `TASK-WEB-002` | Cấu hình Tailwind CSS & Design Tokens | Cài Tailwind, font Inter và bảng màu đồng bộ với thiết kế Kiosk. | `FND-WEB-002` | `TASK-WEB-001` | Wave 2 | Class Tailwind biên dịch đúng; áp dụng được biến màu hệ thống. | Done |
| `TASK-WEB-003` | Cài đặt Thư viện Phụ trợ Web | Cài `axios`, `@stomp/stompjs`, `sockjs-client`, `lucide-react`, `zustand` với phiên bản khóa. | `FND-WEB-003` | `TASK-WEB-001` | Wave 2 | `npm install` sạch; `npm audit` không có lỗ hổng nghiêm trọng. | Done |
| `TASK-WEB-004` | Cấu hình Biến Môi trường & Proxy Dev | Thiết lập `.env` với `VITE_API_BASE_URL` và reverse proxy trong Vite. | `FND-WEB-004` | `TASK-WEB-001` | Wave 2 | Gọi API tới Backend qua `/api` thành công, không bị CORS. | Done |
| `TASK-WEB-005` | Xây dựng TypeScript Data Contracts | Khởi tạo interfaces/DTOs/Enums cho AuthSession, UserProfile, AttendanceRecord, Pagination, QueryParams. | `BLD-WEB-001` | `TASK-WEB-001` | Wave 2 | Biên dịch không cảnh báo type; DTOs đồng bộ 100% với hợp đồng Backend. | Done |
| `TASK-WEB-006` | Lập trình Safe Storage Adapters | Đóng gói LocalStorage/SessionStorage kèm fallback RAM và đồng bộ đa tab qua sự kiện `storage`. | `BLD-WEB-002` | `TASK-WEB-005` | Wave 3 | Hoạt động ở chế độ ẩn danh; logout một tab tự đồng bộ sang các tab còn lại. | Done |
| `TASK-WEB-007` | Cấu hình TanStack Query & Cache Factory | Thiết lập `QueryClient`, tập trung `attendanceKeys`/`employeeKeys`, tích hợp cập nhật thời gian thực từ STOMP. | `BLD-WEB-003` | `TASK-WEB-005` | Wave 3 | Query cache tách bạch; Live Table chèn dòng mới lên đầu không giật màn hình. | Done |
| `TASK-WEB-008` | Cấu hình Tailwind Tokens & Theme | Thiết lập `tailwind.config.js` với bảng màu Indigo, font Inter, lớp tiện ích dùng chung. | `BLD-WEB-004` | `TASK-WEB-002` | Wave 3 | Toàn bộ giao diện dùng token tập trung, không có màu/khoảng cách tuỳ tiện. | Done |
| `TASK-WEB-009` | Xây dựng Khung Bố cục Quản trị | Lắp Sidebar 260 px (thu gọn 72 px), TopHeader 64 px và Main Viewport responsive. | `BLD-WEB-005` | `TASK-WEB-008` | Wave 4 | Co giãn mượt từ mobile < 768 px tới màn hình ≥ 1440 px. | Ready |
| `TASK-WEB-010` | Bảng Chấm công Trực tiếp & Thẻ KPI | Lưới 4 thẻ KPI nhảy số thời gian thực và Live Table chớp sáng khi nhận tin STOMP. | `BLD-WEB-006` | `TASK-WEB-009` | Wave 5 | Dòng mới chèn lên đầu mượt; số đếm KPI tăng tự động theo thời gian thực. | Done |
| `TASK-WEB-011` | Hộp thoại Cam kết & Hiển thị OTP | Modal 2 bước: khóa nút gửi tới khi cuộn hết văn bản; hiển thị OTP lớn kèm QR và hiệu ứng hoàn tất. | `BLD-WEB-007` | `TASK-WEB-009` | Wave 5 | Ràng buộc cuộn chính xác; modal tự đóng khi nhận sự kiện quét mặt từ Kiosk. | Done |
| `TASK-WEB-012` | Lịch Chấm công Cá nhân & Xuất File | Calendar Grid 7 cột hiển thị giờ chấm công của nhân viên và tích hợp tải báo cáo. | `BLD-WEB-008` | `TASK-WEB-009` | Wave 5 | Tải file Excel chuẩn định dạng; mở Drawer chi tiết ngày tức thời. | Done |
| `TASK-WEB-013` | Axios Base Client & Request Interceptor | Đóng gói `axios` với baseURL, timeout 10 s và tự tiêm Bearer token từ LocalStorage. | `BLD-WEB-009` | `TASK-WEB-001` | Wave 2 | Gọi API kèm token chuẩn xác; từ chối khởi tạo khi thiếu cấu hình baseURL. | Done |
| `TASK-WEB-014` | Token Refresh Interceptor | Bộ chặn Response Interceptor bắt 401 và quản lý Promise Queue chống race condition. | `BLD-WEB-010` | `TASK-WEB-013` | Wave 3 | Làm mới token trong suốt; request đang treo được thực thi lại; logout khi refresh token hết hạn. | Done |
| `TASK-WEB-015` | StompWebSocketService & Hooks | Tích hợp `@stomp/stompjs` + SockJS, phát triển hook `useLiveAttendance`, `useEnrollmentStatus`. | `BLD-WEB-011` | `TASK-WEB-013` | Wave 3 | Nhận bản tin `/topic/live-attendance` tức thời; tự huỷ subscription khi unmount, không rò rỉ bộ nhớ. | Done |
| `TASK-WEB-016` | Auth Store & Protected Routes | Zustand store quản lý user/token và React Router bọc Auth Guard kiểm tra role. | `BLD-WEB-012` | `TASK-WEB-001` | Wave 2 | Chặn truy cập trái phép; điều hướng đúng trang HR hoặc Employee. | Done |
| `TASK-WEB-017` | Luồng Ký Cam kết Informed Consent | Modal điều khoản pháp lý, xử lý nút ký, gọi API và hiển thị OTP 6 số kèm QR. | `BLD-WEB-013` | `TASK-WEB-016` | Wave 3 | QR và OTP hiển thị rõ; modal tự đóng khi nhận tín hiệu WebSocket. | Done |
| `TASK-WEB-018` | Dịch vụ Kết nối STOMP Client | Hook `useStompClient` kết nối `/ws-attendance`, tự kết nối lại khi rớt mạng. | `BLD-WEB-014` | `TASK-WEB-015` | Wave 4 | Nhận tin nhắn ổn định; trạng thái trực tuyến/ngoại tuyến hiển thị đúng. | Done |
| `TASK-WEB-019` | Bảng Chấm công HR Trực tiếp | Bảng sự kiện điểm danh thời gian thực, tự chèn dòng mới lên đầu kèm hiệu ứng ánh sáng. | `BLD-WEB-015` | `TASK-WEB-018` | Wave 5 | Dòng mới chèn lên đầu với hiệu ứng 3 s; không giật lag. | Done |
| `TASK-WEB-020` | Module Xuất Báo cáo Excel/PDF | Dịch vụ trích xuất bảng dữ liệu và tải file Excel/PDF định dạng chuẩn. | `BLD-WEB-016` | `TASK-WEB-019` | Wave 6 | File tải về đủ tiêu đề, mốc thời gian, tên công ty và số liệu chấm công. | Done |
| `TASK-WEB-021` | Tích hợp Toàn trình Giao diện Cổng Web | Ghép luồng xác thực JWT, router guard, sự kiện STOMP cập nhật Live Table, modal OTP, các màn hình vòng đời và xuất báo cáo. | `BLD-WEB-017` | `TASK-WEB-012`, `TASK-WEB-020`, `TASK-WEB-028`, `TASK-WEB-029` | Wave 7 | Trải nghiệm liền mạch; ký cam kết mở khoá OTP chuẩn xác; Live Table hiển thị bản ghi mới dưới 1 giây; các luồng vòng đời (đổi mật khẩu bắt buộc, chốt kỳ, rút Consent) hoạt động end-to-end. | Ready |
| `TASK-WEB-022` | Lập trình Store Trạng thái Vòng đời phía Client | Xây dựng `NotificationStateStore`, `PayrollPeriodStore` và `KioskRegistryMemoryStore`. | `BLD-WEB-025` | `TASK-WEB-005` | Wave 3 | Thông báo phân tách theo người dùng và xoá khi đăng xuất; cờ khoá kỳ công không ghi LocalStorage; Secret Token chỉ tồn tại trong RAM và bị xoá khi unmount. | Done |
| `TASK-WEB-023` | Lập trình Bộ Client Dịch vụ Vòng đời | Xây dựng 9 service client cho nhân sự, thông tin xác thực, ca, kỳ công, dữ liệu cá nhân, đăng xuất, thông báo, tuân thủ và export. | `BLD-WEB-022` | `TASK-WEB-013` | Wave 3 | Mọi giao diện gọi đúng hợp đồng Backend; lỗi 400/401/403/409 được chuẩn hoá thành thông điệp hiển thị; mật khẩu tạm không bị cache. | Done |
| `TASK-WEB-024` | Lập trình Module Vòng đời Tài khoản & Phiên | Xây dựng luồng hồ sơ nhân sự (kèm hộp thoại mật khẩu tạm), đổi mật khẩu tự nguyện và đăng xuất thu hồi phiên. | `BLD-WEB-018` | `TASK-WEB-017`, `TASK-WEB-016` | Wave 4 | Mật khẩu tạm chỉ hiển thị một lần; không có luồng chặn điều hướng nào theo trạng thái mật khẩu; đăng xuất thu hồi token và đồng bộ đa tab. | Done |
| `TASK-WEB-025` | Lập trình Module Ca kíp & Kỳ công | Xây dựng màn hình CRUD ca, phân ca theo khoảng ngày kèm gợi ý chồng lấn, và màn hình chốt/mở lại kỳ công lan toả cờ khoá điều chỉnh. | `BLD-WEB-019` | `TASK-WEB-009`, `TASK-WEB-023` | Wave 5 | Phân ca chồng khoảng hiển thị lỗi kèm khoảng trống gợi ý; kỳ đã chốt vô hiệu hoá nút duyệt đơn/điều chỉnh trên toàn bộ giao diện. | Done |
| `TASK-WEB-026` | Lập trình Module Rút Consent & Trung tâm Thông báo | Xây dựng luồng rút Consent có cảnh báo và xác nhận hai bước, màn hình yêu cầu dữ liệu cá nhân và trung tâm thông báo trong ứng dụng. | `BLD-WEB-020` | `TASK-WEB-017`, `TASK-WEB-023`, `TASK-WEB-022` | Wave 4 | Cảnh báo nêu rõ hệ quả trước khi rút; yêu cầu dữ liệu cá nhân hiển thị trạng thái xử lý; badge chưa đọc cập nhật tức thời. | Done |
| `TASK-WEB-027` | Lập trình Module Quản trị Trạm Kiosk & Tuân thủ | Xây dựng màn hình quản lý trạm Kiosk (token chỉ trong RAM, cảnh báo ping) và màn hình tra cứu audit/tuân thủ chỉ đọc cho `ADMIN`/`DPO`. | `BLD-WEB-021` | `TASK-WEB-023`, `TASK-WEB-022` | Wave 4 | Secret Token không xuất hiện trong LocalStorage/SessionStorage; trạm quá 5 phút không ping có cảnh báo; role `DPO` không thấy thao tác ghi. | Done |
| `TASK-WEB-028` | Xây dựng Màn hình Quản trị Danh mục & Kỳ công | Phát triển màn hình hồ sơ nhân sự, ca/phân ca trên lịch tuần và chốt kỳ công theo bố cục `UXD-WEB-006`. | `BLD-WEB-023` | `TASK-WEB-009`, `TASK-WEB-024`, `TASK-WEB-025` | Wave 6 | Form trong Drawer và cảnh báo nghiệp vụ hiển thị đúng trên đầu bảng; kỳ đã chốt vô hiệu hoá nút điều chỉnh. | Ready |
| `TASK-WEB-029` | Xây dựng Màn hình Đổi mật khẩu Bắt buộc, Consent & Tuân thủ | Phát triển màn hình blocking đổi mật khẩu, luồng Consent/yêu cầu dữ liệu, trung tâm thông báo và màn hình trạm Kiosk/tuân thủ. | `BLD-WEB-024` | `TASK-WEB-009`, `TASK-WEB-026`, `TASK-WEB-027` | Wave 5 | Không rời được màn hình đổi mật khẩu bắt buộc bằng điều hướng; Secret Token chỉ hiển thị một lần; role `DPO` chỉ đọc. | Done |
| `TASK-WEB-030` | Chuẩn hóa Chuỗi Đóng gói Container SPA Nginx | Xây dựng Dockerfile multi-stage cho Web Portal (Node build + Nginx Alpine serve), cấu hình nginx.conf định tuyến fallback SPA /index.html. | `FND-WEB-005` | `TASK-WEB-001` | Wave 2 | Container build thành công, phục vụ tĩnh tài nguyên và định tuyến SPA mượt mà không lỗi 404 khi F5 trên các sub-routes. | Done |
| `TASK-WEB-031` | Cấu hình Reverse Proxy Chuyển tiếp & CORS Mitigation | Cấu hình Nginx proxy_pass chuyển tiếp /api/ và /ws-attendance sang Backend, thiết lập header CORS, WebSocket upgrade phục vụ môi trường tích hợp và Docker Compose. | `FND-WEB-006` | `TASK-WEB-004` | Wave 3 | Trình duyệt gọi API và WebSocket thông qua cùng host/port của Nginx mà không phát sinh lỗi CORS hay chặn Upgrade header. | Done |
| `TASK-WEB-032` | Thiết lập Bộ Khung Kiểm thử Hợp đồng Giao diện & Mock Client | Cài đặt Mock Service Worker (MSW) hoặc Axios Mock Adapter trong test runner (Vitest/Jest), định nghĩa fixtures phản hồi chuẩn cho API auth, live attendance, consent. | `FND-WEB-007` | `TASK-WEB-003` | Wave 3 | Các test suite giao diện và hook chạy độc lập với mock server cục bộ, kiểm thử được các nhánh timeout, refresh token và lỗi mạng. | Ready |

---

## 3. Dependency Structure (Cấu trúc Phụ thuộc)

```text
[Foundation Layer]
TASK-WEB-001 (Vite + React TS)
    ├── TASK-WEB-002 (Tailwind & Tokens)  ──→ TASK-WEB-008 (Theme Config) ──→ TASK-WEB-009 (Admin Shell)
    │                                                                            ├── TASK-WEB-010 (KPI & Live Table)
    │                                                                            ├── TASK-WEB-011 (Consent Modal)
    │                                                                            └── TASK-WEB-012 (Personal Calendar)
    ├── TASK-WEB-003 (Dependencies)       ──→ TASK-WEB-032 (Mock Contract Harness)
    ├── TASK-WEB-004 (Env & Proxy)        ──→ TASK-WEB-031 (Reverse Proxy CORS)
    ├── TASK-WEB-030 (Container Packaging)
    ├── TASK-WEB-005 (Data Contracts)     ──→ TASK-WEB-006 (Safe Storage)
    │                                     └──→ TASK-WEB-007 (Query Cache)
    ├── TASK-WEB-013 (Axios Client)       ──→ TASK-WEB-014 (Refresh Interceptor)
    │                                     └──→ TASK-WEB-015 (STOMP Service & Hooks) ──→ TASK-WEB-018 (STOMP Client Hook)
    │                                                                                     └──→ TASK-WEB-019 (HR Live Table) ──→ TASK-WEB-020 (Export Module)
    └── TASK-WEB-016 (Auth Store & Guards) ──→ TASK-WEB-017 (Consent Flow)

[Integration Layer]
TASK-WEB-012 + TASK-WEB-020 ──→ TASK-WEB-021 (Full Portal Integration) ──→ BUILD
```

---

## 4. Execution Waves (Các Lớp Thực thi Song song)

* **Wave 1: Foundation Toolchain**: `TASK-WEB-001`.
* **Wave 2: Toolchain Config, Data Contracts, HTTP Client, Auth Store & Packaging**: `TASK-WEB-002`, `TASK-WEB-003`, `TASK-WEB-004`, `TASK-WEB-005`, `TASK-WEB-013`, `TASK-WEB-016`, `TASK-WEB-030`.
* **Wave 3: Storage, Cache, Theme, Refresh Token, Consent Flow, Lifecycle Clients, Proxy & Mock Harness**: `TASK-WEB-006`, `TASK-WEB-007`, `TASK-WEB-008`, `TASK-WEB-014`, `TASK-WEB-015`, `TASK-WEB-017`, `TASK-WEB-022`, `TASK-WEB-023`, `TASK-WEB-031`, `TASK-WEB-032`.
* **Wave 4: Admin Shell, STOMP Client & Lifecycle Modules**: `TASK-WEB-009`, `TASK-WEB-018`, `TASK-WEB-024`, `TASK-WEB-026`, `TASK-WEB-027`.
* **Wave 5: Live Dashboard, Consent Modal, Calendar, HR Table, Shift/Payroll & Compliance Screens**: `TASK-WEB-010`, `TASK-WEB-011`, `TASK-WEB-012`, `TASK-WEB-019`, `TASK-WEB-025`, `TASK-WEB-029`.
* **Wave 6: Export Module, Category & Payroll Screens**: `TASK-WEB-020`, `TASK-WEB-028`.
* **Wave 7: Portal Full Integration**: `TASK-WEB-021`.

---

## 5. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Phụ thuộc Hợp đồng Backend**: `TASK-WEB-005` (data contracts) và `TASK-WEB-013/014` (xác thực/refresh token) phải bám theo hợp đồng Backend đã chốt tại `subsystem-docs/backend-service/specs/api.md`; khi Backend bổ sung giao diện mới, `TASK-WEB-005` phải cập nhật DTO tương ứng trước khi task giao diện tiêu thụ nó bắt đầu.
* **Kiểm thử Giao diện**: Các task UI/UX cần kiểm thử thủ công trên tối thiểu 3 kích thước màn hình; kiểm thử tự động chỉ phủ logic store/interceptor.
* **Độc lập Pull Request theo Task**: Mỗi `TASK-WEB-` thi công trên một nhánh riêng; các task cùng Wave không phụ thuộc nhau nên giao song song được.
