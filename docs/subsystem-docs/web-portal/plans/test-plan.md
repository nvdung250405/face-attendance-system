---
title: Web Portal Subsystem Test Plan
version: 3.0
status: Done
owner: Web QA Lead & Frontend Test Engineer
type: plan
scope: WEB
updated: 2026-10-17
---

# TEST PLAN — Kế hoạch Kiểm thử Toàn diện Phân hệ Cổng Web Quản trị & Người dùng (`web-portal`)

Tài liệu này xác định kế hoạch kiểm thử toàn diện, phương pháp luận nghiệm thu đa tầng và ma trận truy vết ca kiểm thử cho **Phân hệ Cổng Web Quản trị & Người dùng** (`web-portal`) của Hệ thống Điểm danh Khuôn mặt (FAS) theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §8.6).

Tài liệu bao phủ và kiểm chứng toàn vẹn các đặc tả kỹ thuật:

- **Spec Core**: 14 Yêu cầu Chức năng (`FR-WEB-001` .. `FR-WEB-014`), 4 Yêu cầu Phi chức năng (`NFR-WEB-001` .. `NFR-WEB-004`), 14 Thành phần Giải pháp Kỹ thuật (`SOL-WEB-001` .. `SOL-WEB-014`), 20 Quyết định Kỹ thuật (`DD-WEB-001` .. `DD-WEB-020`) tại [spec.md](../specs/spec.md).
- **API Specs & Design**: 18 Giao diện REST/WebSocket (`API-WEB-001` .. `API-WEB-018`), 6 Thiết kế Kết nối Mạng (`APD-WEB-001` .. `APD-WEB-006`) tại [api.md](../specs/api.md).
- **Data Specs & Design**: 7 Thực thể Lưu trữ Client (`DATA-WEB-001` .. `DATA-WEB-007`), 4 Thiết kế Cấu trúc Dữ liệu (`DTD-WEB-001` .. `DTD-WEB-004`) tại [data.md](../specs/data.md).
- **UI/UX Specs & Design**: 12 Yêu cầu Giao diện & Hành trình Người dùng (`UI-WEB-001` .. `UI-WEB-012`), 8 Thành phần Thiết kế Giao diện (`UXD-WEB-001` .. `UXD-WEB-008`), Bảng màu Figma Clean SaaS tại [ui-ux.md](../specs/ui-ux.md).

---

## 1. Scope & Test Objectives (Phạm vi & Mục tiêu Kiểm thử)

### 1.1. Phạm vi Kiểm thử (Test Scope)

Toàn bộ 5 khối kiến trúc nội bộ của ứng dụng Web React 19 / TypeScript / Vite 8:

1. **Tầng Trình diễn & Điều phối Giao diện (Presentation & Component Layer)**:
   - React Router v7 phân luồng theo vai trò người dùng (Role-based Guards: `HR_MANAGER`, `EMPLOYEE`, `ADMIN`, `DPO`).
   - Khung bố cục Admin Shell co giãn linh hoạt (Sidebar thu gọn $260\text{ px} \leftrightarrow 72\text{ px}$, Header $64\text{ px}$, Drawer trượt).
   - Bảng Live Attendance Table chớp sáng nổi bật trong $1.5\text{ s}$ khi nhận sự kiện điểm danh mới; 4 thẻ chỉ số KPI tự động cập nhật.
   - Modal quy trình ký cam kết điện tử Informed Consent và hiển thị mã kích hoạt OTP 6 số kèm mã QR Code.
   - Bảng công và lịch chấm công cá nhân dạng lưới tháng (Month Grid) hỗ trợ xem chi tiết ngày qua Drawer.
   - Các màn hình quản trị vòng đời: nhân sự, ca làm việc, phân ca, chốt kỳ công, rút consent, thông báo và quản lý trạm Kiosk.
2. **Tầng Quản lý Trạng thái & Lưu trữ Client (State & Cache Layer)**:
   - Zustand Auth Store: quản lý hồ sơ người dùng, cặp token JWT, quyền hạn và trạng thái mật khẩu tạm/PIN.
   - `SafeLocalStorage` và `SafeSessionStorage`: bộ điều hợp an toàn tự động fallback sang bộ nhớ RAM khi gặp lỗi `QuotaExceededError`.
   - Cơ chế đồng bộ phiên đa tab qua sự kiện trình duyệt `window.addEventListener('storage')`.
   - Bộ nhớ đệm truy vấn TanStack Query: quản lý khóa query phân tầng, chính sách staleTime và hủy bỏ cache khi cần.
   - Zustand Stores chuyên biệt: `payrollPeriodStore`, `notificationStore`, `kioskRegistryStore`.
3. **Tầng Giao tiếp Mạng & Xử lý Ngoại lệ (Networking & Error Handling Layer)**:
   - Axios Client: tự động tiêm Header `Authorization: Bearer <token>`, cấu hình timeout và base URL.
   - Bộ chặn Response Interceptor: xử lý mã lỗi HTTP 401 với hàng đợi Promise Mutex Refresh Queue chống gọi lặp refresh token.
   - Dịch vụ `StompWebSocketService` (@stomp/stompjs): kết nối WebSocket STOMP tới topic `/topic/live-attendance` và `/topic/enrollment/{otp}` kèm chiến lược thử lại tự động.
   - Bộ chuẩn hóa mã lỗi RFC 7807 ProblemDetails thành thông báo thân thiện trên giao diện.
4. **Bảo mật, Quyền riêng tư & Tuân thủ Dữ liệu (Security & Compliance)**:
   - Tuyệt đối không lưu Secret Token trạm Kiosk hay cờ khóa kỳ công vào LocalStorage/SessionStorage; chỉ lưu tạm trong RAM.
   - Mật khẩu tạm ban đầu hiển thị đúng một lần trong hộp thoại có nút sao chép và cảnh báo không xem lại được.
   - Phòng chống triệt để Formula Injection khi xuất file Excel (.xlsx): escape ký tự nguy hiểm (`=`, `+`, `-`, `@`).
   - Đăng xuất an toàn: gọi API thu hồi token trước khi xóa bộ nhớ client và đồng bộ đăng xuất trên mọi tab.

### 1.2. Mục tiêu Chất lượng (Quality Objectives)

- **Tỷ lệ Đạt (Pass Rate)**: $100\%$ các bài kiểm thử tự động (`Vitest`) vượt qua thành công, $0\text{ Failures}$, $0\text{ Errors}$, $0\text{ Skipped}$.
- **Thời gian Tải trang (First Contentful Paint)**: Đạt FCP $\le 1.5\text{ giây}$ trên đường truyền tiêu chuẩn (`NFR-WEB-001`).
- **Khả năng Tương thích Responsive**: Bố cục hiển thị mượt mà từ độ phân giải $1024\times 768\text{ px}$ đến $4\text{K}$, không tràn viền ngang (`NFR-WEB-002`).
- **Độ Tin cậy Kênh Thời gian thực**: Tự động kết nối lại STOMP WebSocket trong $\le 5\text{ giây}$ khi rớt mạng, không rò rỉ RAM (`NFR-WEB-003`).
- **An toàn Bảo mật Phiên**: Bảo vệ phiên người dùng chống XSS; xóa sạch dữ liệu xác thực khi đăng xuất (`NFR-WEB-004`).

---

## 2. Approach Decisions (Quyết định Phương pháp Tiếp cận Kiểm thử)

| ID | Quyết định Tiếp cận Kiểm thử | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-WEB-001` | Sử dụng Vitest kết hợp happy-dom / jsdom để kiểm thử Component và Storage APIs. | Giả lập môi trường trình duyệt chuẩn, cho phép kiểm tra chi tiết các sự kiện StorageEvent, DOM re-render và serialization. | `STK-015`, `DATA-WEB-001` | Accepted |
| `APC-WEB-002` | Kiểm thử biên (Edge Case Testing) khi LocalStorage bị khóa hoặc đầy dung lượng (QuotaExceededError). | Ngăn chặn hiện tượng ứng dụng bị crash khi người dùng duyệt web trong chế độ bảo mật nghiêm ngặt (Private/Incognito Mode). | `DTD-WEB-001`, `NFR-WEB-001` | Accepted |
| `APC-WEB-003` | Mô phỏng kịch bản Token Hết Hạn Đồng Thời (Concurrent 401 Chaos Testing). | Xác thực cơ chế Mutex Promise Queue hoạt động hoàn hảo, bảo vệ Refresh Token không bị vô hiệu hóa do gọi lặp nhiều lần. | `APD-WEB-002`, `NFR-WEB-001` | Accepted |
| `APC-WEB-004` | Giả lập Giao tiếp Mạng Toàn diện qua Mock Axios Adapter & Mock Handlers. | Kiểm thử chân thực luồng HTTP mà không cần khởi chạy máy chủ Backend; kiểm chứng 100% hợp đồng mã lỗi RFC 7807. | `STK-015`, `API-WEB-001` | Accepted |
| `APC-WEB-005` | Giả lập STOMP WebSocket Broker & Kiểm thử Live Table Flash Animation ($1.5\text{ s}$). | Kiểm chứng khả năng tiếp nhận bản tin STOMP tức thì, tối ưu hóa optimistic update vào TanStack Query cache và hiệu ứng giao diện. | `APD-WEB-003`, `FR-WEB-003` | Accepted |
| `APC-WEB-006` | Kiểm tra Tự động Khử Ký tự Nguy hiểm khi Xuất File Excel (Formula Injection Prevention). | Đảm bảo các chuỗi bắt đầu bằng `=`, `+`, `-`, `@` trong tên nhân viên hoặc ghi chú được escape an toàn trước khi kết xuất file. | `FR-WEB-006`, `FR-SYS-016` | Accepted |

---

## 3. Ma trận Ca Kiểm thử Chi tiết Phân hệ Web Portal (Detailed Test Matrix)

### 3.1. Nhóm 1: Xác thực, Phân quyền RBAC, Quản lý Phiên & Lưu trữ Client

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-001` | Kiểm thử TypeScript Contracts & Validation | Kiểm tra tính toàn vẹn kiểu dữ liệu của toàn bộ DTOs và phản hồi API trong TypeScript. | `DATA-WEB-001`..`004` | `BLD-WEB-001` | Toàn bộ dữ liệu JSON từ API serialize/deserialize chính xác vào các interface TypeScript mà không mất trường. |   Done  |
| `TST-WEB-002` | Kiểm thử Safe Storage Adapter & Fallback RAM | Kiểm tra bộ điều hợp `SafeLocalStorage` tự động fallback sang RAM khi LocalStorage ném `QuotaExceededError`. | `DTD-WEB-001` | `BLD-WEB-002` | Khi LocalStorage ném lỗi; adapter tự động chuyển sang lưu tạm trong RAM; không làm dừng luồng ứng dụng. |   Done  |
| `TST-WEB-003` | Kiểm thử Đồng bộ Trạng thái Phiên Đa Tab | Kiểm tra sự kiện `window.addEventListener('storage')` đồng bộ đăng nhập/đăng xuất giữa nhiều tab trình duyệt. | `DTD-WEB-001`, `DTD-WEB-002` | `BLD-WEB-002` | Kích hoạt sự kiện logout trên Tab 1; Tab 2 tự động xóa token và chuyển hướng về màn hình đăng nhập tức thì. |   Done  |
| `TST-WEB-009` | Kiểm thử Tự Động Gắn Bearer Token | Kiểm tra Axios Request Interceptor tự động gắn Header `Authorization: Bearer <token>` vào request có xác thực. | `API-WEB-001` | `BLD-WEB-003` | Request gửi đi tự động có header `Authorization: Bearer <token>`; request public không có header này. |   Done  |
| `TST-WEB-010` | Kiểm thử Mutex Refresh Interceptor khi 401 | Bắn đồng thời nhiều request trả về 401; kiểm tra cơ chế Mutex Promise Queue chỉ gọi duy nhất 1 lần API làm mới token. | `API-WEB-002`, `APD-WEB-002` | `BLD-WEB-003` | Bắn đồng thời 5 request trả về 401; chỉ có 1 request refresh được gọi; 5 request ban đầu retry thành công. |   Done  |
| `TST-WEB-013` | Đăng nhập & Định tuyến Phân quyền RBAC | Kiểm tra form đăng nhập, hiển thị spinner nạp dữ liệu và điều hướng chuẩn xác theo vai trò (`HR_MANAGER`, `EMPLOYEE`, `ADMIN`, `DPO`). | `FR-WEB-001` | `BLD-WEB-004` | Đăng nhập tài khoản HR mở trang HR; tài khoản NV mở trang cá nhân; chặn truy cập trái quyền trả về Forbidden. |   Done  |
| `TST-WEB-024` | Kiểm thử Đăng xuất & Xử lý Phiên Hết hạn | Kiểm tra luồng đăng xuất gọi API thu hồi refresh token, xóa sạch storage và xử lý khi refresh token thất bại. | `FR-WEB-012`, `API-WEB-015` | `BLD-WEB-005` | Đăng xuất gọi API thu hồi token, xóa storage và đăng xuất mọi tab; khi refresh token thất bại tự chuyển về trang đăng nhập. |   Done  |

---

### 3.2. Nhóm 2: Bảng Điều khiển Trực tiếp, WebSocket STOMP & Thông báo

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-004` | Kiểm thử TanStack Query Realtime Injection | Kiểm tra cơ chế chèn trực tiếp bản ghi điểm danh mới vào đầu bộ nhớ đệm cache mà không cần refetch API. | `DATA-WEB-004` | `BLD-WEB-006` | Nhận sự kiện WebSocket mới; hook tự động chèn bản ghi vào đầu danh sách cache mà không refetch toàn bộ API. |   Done  |
| `TST-WEB-006` | Kiểm thử Live Dashboard Row Highlight & KPI | Kiểm tra bảng Live Attendance nhận event mới; hàng mới chớp sáng màu xanh ngọc (Green Flash) trong $1.5\text{ s}$; số KPI tăng tức thì. | `UI-WEB-003`, `UXD-WEB-003`, `API-WEB-004` | `BLD-WEB-007` | Bắn sự kiện điểm danh mới; hàng mới chớp sáng màu xanh ngọc trong 1.5s; 4 thẻ chỉ số KPI tự động tăng tức thì. |   Done  |
| `TST-WEB-011` | Kiểm thử Kết nối & Tự Reconnect STOMP | Mô phỏng WebSocket đóng bất ngờ; kiểm tra STOMP client kích hoạt cơ chế thử lại tự động sau mỗi 5s và khôi phục kênh. | `API-WEB-007`, `APD-WEB-003`, `NFR-WEB-003` | `BLD-WEB-008` | Mô phỏng WebSocket đóng bất ngờ; STOMP client kích hoạt cơ chế thử lại sau mỗi 5s và khôi phục kênh không rò rỉ RAM. |   Done  |
| `TST-WEB-012` | Kiểm thử Clean-up Subscription trong Hooks | Kiểm tra hook `useLiveAttendance` gọi `subscription.unsubscribe()` khi unmount component để giải phóng bộ nhớ. | `APD-WEB-003` | `BLD-WEB-008` | Unmount component sử dụng `useLiveAttendance`; hàm cleanup gọi `subscription.unsubscribe()` giải phóng RAM. |   Done  |
| `TST-WEB-015` | Tiếp nhận Sự kiện Điểm danh Đẩy qua STOMP | Giả lập Backend bắn tin STOMP lên `/topic/live-attendance`; kiểm tra bảng Live Dashboard xuất hiện dòng mới ngay lập tức. | `FR-WEB-003` | `BLD-WEB-007` | Giả lập Backend bắn tin STOMP; bảng Live Dashboard xuất hiện dòng mới ngay lập tức mà không cần F5 tải lại. |   Done  |
| `TST-WEB-025` | Kiểm thử Trung tâm Thông báo Trong ứng dụng | Kiểm tra biểu tượng chuông hiển thị badge số chưa đọc, danh sách phân loại sự kiện và đánh dấu đã đọc tức thời. | `FR-WEB-013`, `API-WEB-016` | `BLD-WEB-009` | Badge số chưa đọc đúng; đánh dấu đã đọc cập nhật tức thời; thông báo chỉ thuộc người đang đăng nhập và bị xóa khi đăng xuất. |   Done  |
| `TST-WEB-028` | Kiểm thử Store Trạng thái Vòng đời phía Client | Kiểm tra `notificationStore`, `payrollPeriodStore`, `kioskRegistryStore`: trạng thái cách ly theo user và cấm lưu Secret Token vào storage. | `DATA-WEB-005`..`007` | `BLD-WEB-010` | Trạng thái thông báo phân tách theo người dùng; cờ khóa kỳ công không lưu LocalStorage; Secret Token chỉ lưu trong RAM. |   Done  |

---

### 3.3. Nhóm 3: Quản lý Nhân sự, Ca Kíp, Kỳ công & Quản trị Trạm Kiosk

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-019` | Kiểm thử Vòng đời Hồ sơ Nhân sự | Tạo hồ sơ hiển thị mật khẩu tạm đúng một lần; sửa hồ sơ, vô hiệu hóa có xác nhận; cấp lại mật khẩu tạm thông báo phiên cũ bị thu hồi. | `FR-WEB-007`, `API-WEB-009`, `API-WEB-010` | `BLD-WEB-011` | Mật khẩu tạm hiển thị đúng một lần kèm nút sao chép; sửa/vô hiệu hóa yêu cầu xác nhận; trùng mã/email báo lỗi 409. |   Done  |
| `TST-WEB-020` | Kiểm thử Quản lý Ca kíp & Phân ca | Tạo/sửa ca làm việc và phân ca theo khoảng ngày; khi chồng lấn hiển thị lỗi 409 kèm khoảng trống gợi ý cho HR. | `FR-WEB-008`, `API-WEB-011` | `BLD-WEB-012` | Tạo/sửa/vô hiệu hóa ca thành công; phân ca chồng khoảng hiển thị lỗi 409 kèm khoảng trống gợi ý; lịch tuần cập nhật ngay sau khi lưu. |   Done  |
| `TST-WEB-021` | Kiểm thử Đổi Mật khẩu Tự nguyện & Quản lý PIN | Người dùng còn dùng mật khẩu tạm không bị chặn điều hướng; đổi mật khẩu tự nguyện; thiết lập PIN và đặt lại PIN yêu cầu mật khẩu hiện tại. | `FR-WEB-009`, `API-WEB-012` | `BLD-WEB-013` | Người dùng vào được mọi màn hình ngay sau đăng nhập; đổi mật khẩu thu hồi phiên cũ; đặt lại PIN yêu cầu mật khẩu hiện tại. |   Done  |
| `TST-WEB-022` | Kiểm thử Chốt Kỳ công & Lan toả Cờ Khoá | Chốt kỳ công theo tháng; kiểm tra cờ khóa `isAdjustmentLocked` lan tỏa tới mọi màn hình, vô hiệu hóa nút duyệt đơn/sửa công; ADMIN mở lại có lý do. | `FR-WEB-010`, `API-WEB-013` | `BLD-WEB-014` | Sau khi chốt kỳ, nhãn "Đã chốt" xuất hiện và nút duyệt đơn/điều chỉnh công bị vô hiệu hóa trên mọi màn hình; ADMIN mở lại bắt buộc nhập lý do. |   Done  |
| `TST-WEB-026` | Kiểm thử Quản trị Trạm Kiosk & Tra cứu Tuân thủ | ADMIN đăng ký trạm nhận Secret Token hiển thị một lần (không lưu storage); cảnh báo ping $>5\text{ phút}$; role `DPO` chỉ đọc. | `FR-WEB-014`, `API-WEB-017` | `BLD-WEB-015` | Secret Token chỉ hiển thị một lần và không xuất hiện trong storage; trạm quá 5 phút không ping có cảnh báo; DPO chỉ đọc. |   Done  |
| `TST-WEB-027` | Kiểm thử Hợp đồng REST Vòng đời Toàn diện | Kiểm tra 10 endpoint REST vòng đời gọi đúng method/URL, diễn giải đúng mã HTTP 200/201/204 và các mã lỗi 400/401/403/409. | `API-WEB-009`..`018` | `BLD-WEB-016` | Mọi giao diện vòng đời gọi đúng đường dẫn/phương thức; diễn giải đúng HTTP status; mật khẩu tạm và Secret Token không bị cache. |   Done  |
| `TST-WEB-029` | Kiểm thử Màn hình Vòng đời & Giao diện Quản trị | Form nhập liệu trong Drawer, cảnh báo nghiệp vụ trên đầu bảng, đổi mật khẩu không chặn điều hướng, badge thông báo hiển thị chuẩn xác. | `UI-WEB-006`..`012`, `UXD-WEB-006`..`008` | `BLD-WEB-017` | Drawer form hiển thị mượt mà; cảnh báo nghiệp vụ nổi bật; badge thông báo và dấu hiệu chỉ đọc hiển thị chính xác. |   Done  |

---

### 3.4. Nhóm 4: Cổng Cá nhân, Cam kết Consent, Báo cáo Excel & Responsive

| ID | Tên Ca Kiểm thử | Mô tả Chi tiết | Bao phủ (`Covers`) | Phụ thuộc | Tiêu chuẩn Hoàn thành (`Done when`) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-005` | Kiểm thử Khung Bố cục Admin Shell Responsive | Sidebar thu gọn/mở rộng mượt; trên Mobile/Tablet chuyển thành Drawer menu trượt; nội dung không bị tràn ngang. | `UI-WEB-001`, `UXD-WEB-001` | `BLD-WEB-018` | Sidebar thu gọn/mở rộng mượt; trên Mobile chuyển thành Drawer menu trượt; nội dung không bị tràn ngang. |   Done  |
| `TST-WEB-007` | Kiểm thử Modal Ký Cam kết Informed Consent | Nhân viên đọc điều khoản $\rightarrow$ cuộn $100\%$ mới mở nút ký $\rightarrow$ ký điện tử thành công hiển thị OTP 6 số và mã QR kích hoạt. | `UI-WEB-002`, `UXD-WEB-002`, `API-WEB-003` | `BLD-WEB-019` | Nút ký chỉ mở khi cuộn hết văn bản; ký thành công hiển thị OTP 6 số hạn 48h và mã QR kích hoạt tại trạm Kiosk. |   Done  |
| `TST-WEB-008` | Kiểm thử Lịch Biểu Chấm công Cá nhân | Hiển thị dạng lưới tháng 7 cột; các ô ngày phân biệt rõ màu xanh (đúng giờ), vàng (đi muộn), xám (nghỉ lễ/phép); nhấp xem Drawer chi tiết. | `UI-WEB-004`, `UI-WEB-005`, `UXD-WEB-005` | `BLD-WEB-020` | Hiển thị dạng lưới tháng; phân biệt rõ màu sắc theo trạng thái; nhấp chuột mở Drawer xem chi tiết các lượt quẹt trong ngày. |   Done  |
| `TST-WEB-014` | Quy trình Ký Cam kết Consent & Hiển thị OTP | Ký cam kết thành công sinh ra đúng mã OTP 6 số và mã QR tương ứng; tự động đóng modal khi quét mặt xong tại Kiosk qua STOMP. | `FR-WEB-002` | `BLD-WEB-019` | Ký cam kết thành công sinh ra đúng mã OTP 6 số và mã QR tương ứng; tự đóng modal khi quét xong tại Kiosk. |   Done  |
| `TST-WEB-016` | Tra cứu Lịch sử Chấm công Cá nhân | Nhân sự tra cứu lịch sử chấm công cá nhân; hiển thị chính xác số ngày công, số phút đi trễ theo từng tháng. | `FR-WEB-004`, `FR-WEB-005` | `BLD-WEB-020` | Hiển thị chính xác số ngày công, số phút đi trễ theo từng tháng; tải dữ liệu theo phân trang mượt mà. |   Done  |
| `TST-WEB-017` | Xuất Báo cáo Điểm danh Ra File Excel | Cho phép HR kết xuất báo cáo tổng hợp chấm công ra file Excel (.xlsx); tải xuống $\le 3\text{ s}$; escape ký tự formula injection. | `FR-WEB-006` | `BLD-WEB-021` | File Excel tải xuống mở được, đúng định dạng cột và số liệu; escape an toàn các ký tự formula injection (`=`, `+`, `-`, `@`). |   Done  |
| `TST-WEB-018` | Kiểm tra Tương thích Giao diện Responsive | Kiểm tra hiển thị tốt trên mọi kích thước màn hình từ tablet ($1024\times 768$) đến desktop 4K ($3840\times 2160$), không vỡ bố cục. | `NFR-WEB-001`, `NFR-WEB-002`, `NFR-WEB-004` | `BLD-WEB-018` | Hiển thị tốt trên màn hình tablet ($1024\times 768$) và desktop ($1920\times 1080$); không xuất hiện thanh cuộn ngang ngoài ý muốn. |   Done  |
| `TST-WEB-023` | Kiểm thử Rút Consent & Yêu cầu Dữ liệu Cá nhân | Hiển thị cảnh báo hệ quả trước khi rút consent (chỉ chấm công bằng PIN, dữ liệu tiêu hủy sau 7 ngày); theo dõi trạng thái yêu cầu dữ liệu. | `FR-WEB-011`, `API-WEB-014` | `BLD-WEB-022` | Cảnh báo hệ quả hiển thị trước khi rút; rút thành công hiển thị hạn tiêu hủy 7 ngày; yêu cầu dữ liệu hiển thị trạng thái xử lý. |   Done  |

---

## 4. Ma trận Truy vết Yêu cầu Kỹ thuật (Requirements Traceability Matrix - R2T)

Bảng đối chiếu toàn diện bảo đảm **100% các mục đặc tả kỹ thuật** được kiểm chứng bởi các ca kiểm thử và mã nguồn kiểm thử thực tế trong bộ test suite TypeScript (351 tests):

| Mã Đặc tả | Loại | Tên / Định nghĩa | Ca Kiểm thử Bao phủ | File Test TypeScript Thực thi |
| :--- | :--: | :--- | :---: | :--- |
| `FR-WEB-001` | FR | Đăng nhập bảo mật, lưu token tự động & điều hướng theo Role | `TST-WEB-009`, `010`, `013` | `ProtectedRoute.test.tsx`, `portalFullIntegration.test.tsx`, `tokenRefreshInterceptor.test.ts` |
| `FR-WEB-002` | FR | Ký cam kết Informed Consent điện tử & hiển thị OTP/QR | `TST-WEB-007`, `014` | `consentAndNotification.test.tsx`, `consentService.test.ts` |
| `FR-WEB-003` | FR | Bảng theo dõi điểm danh thời gian thực đẩy qua WebSocket STOMP | `TST-WEB-004`, `006`, `015` | `liveDashboardAndKpi.test.tsx`, `stompClientService.test.ts` |
| `FR-WEB-004` | FR | Nhân sự tra cứu bảng công cá nhân, xem giờ vào/ra và phút trễ | `TST-WEB-008`, `016` | `personalCalendarExport.test.tsx`, `hrAttendanceView.test.tsx` |
| `FR-WEB-005` | FR | Quản lý hồ sơ nhân viên, trạng thái kích hoạt mặt & phân ca | `TST-WEB-016`, `019`, `020` | `accountSessionLifecycle.test.tsx`, `hrAttendanceView.test.tsx` |
| `FR-WEB-006` | FR | Xuất báo cáo tổng hợp chấm công Excel (.xlsx) chống injection | `TST-WEB-017` | `reportExportModule.test.tsx` |
| `FR-WEB-007` | FR | Quản lý vòng đời hồ sơ nhân sự (mật khẩu tạm hiển thị 1 lần) | `TST-WEB-019` | `accountSessionLifecycle.test.tsx` |
| `FR-WEB-008` | FR | Quản lý danh mục ca và phân ca theo khoảng ngày (chống chồng lấn) | `TST-WEB-020` | `shiftAndPayroll.test.tsx` |
| `FR-WEB-009` | FR | Đổi mật khẩu tự nguyện & luồng thiết lập/đặt lại mã PIN | `TST-WEB-021` | `forceChangePasswordAndCompliance.test.tsx` |
| `FR-WEB-010` | FR | Chốt kỳ công theo tháng & lan tỏa cờ khóa tới mọi màn hình | `TST-WEB-022` | `shiftAndPayroll.test.tsx`, `adminCategoryAndPayrollViews.test.tsx` |
| `FR-WEB-011` | FR | Rút Informed Consent (tiêu hủy 7 ngày) & yêu cầu dữ liệu cá nhân | `TST-WEB-023` | `forceChangePasswordAndCompliance.test.tsx`, `kioskAndCompliance.test.tsx` |
| `FR-WEB-012` | FR | Đăng xuất thu hồi token & xử lý phiên hết hạn đa tab | `TST-WEB-003`, `024` | `accountSessionLifecycle.test.tsx`, `lifecycleServices.test.ts` |
| `FR-WEB-013` | FR | Trung tâm thông báo trong ứng dụng theo các sự kiện vòng đời | `TST-WEB-025`, `028` | `consentAndNotification.test.tsx`, `notificationStore.test.ts` |
| `FR-WEB-014` | FR | Quản lý trạm Kiosk (Secret Token RAM) & tra cứu kiểm toán chỉ đọc | `TST-WEB-026` | `kioskAndCompliance.test.tsx`, `kioskRegistryStore.test.ts` |
| `NFR-WEB-001` | NFR | Thời gian tải trang ban đầu FCP $\le 1.5\text{ s}$ qua code splitting | `TST-WEB-018` | `tokens.test.ts`, `nginxConfig.test.ts` |
| `NFR-WEB-002` | NFR | Tương thích giao diện Responsive từ $1024\times 768$ đến 4K | `TST-WEB-005`, `018` | `adminShellLayout.test.tsx` |
| `NFR-WEB-003` | NFR | Tự động kết nối lại WebSocket STOMP với Exponential Backoff | `TST-WEB-011`, `012` | `stompClientService.test.ts`, `useStompClient.test.ts` |
| `NFR-WEB-004` | NFR | Bảo mật phiên, chống XSS & không lưu dữ liệu nhạy cảm storage | `TST-WEB-002`, `026`, `028` | `storage.test.ts`, `kioskRegistryStore.test.ts` |
| `SOL-WEB-001`..`014` | SOL | Toàn bộ 14 giải pháp kỹ thuật Web Portal | `TST-WEB-001` .. `029` | Toàn bộ 30 test files Vitest |
| `DD-WEB-001`..`020` | DD | Toàn bộ 20 quyết định kỹ thuật Web Portal | `TST-WEB-001` .. `029` | Toàn bộ 30 test files Vitest |
| `API-WEB-001`..`018` | API | Toàn bộ 18 giao diện REST & WebSocket STOMP tiêu thụ | `TST-WEB-009`..`012`, `027` | `apiClient.test.ts`, `lifecycleServices.test.ts`, `mockHarness.test.ts` |
| `DATA-WEB-001`..`007` | DATA | Toàn bộ 7 thực thể lưu trữ và bộ nhớ đệm client | `TST-WEB-001`..`003`, `028` | `storage.test.ts`, `authStore.test.ts`, `notificationStore.test.ts` |
| `UI-WEB-001`..`012` | UI | Toàn bộ 12 hành trình trải nghiệm người dùng Web | `TST-WEB-005`..`008`, `029` | `adminShellLayout.test.tsx`, `portalFullIntegration.test.tsx` |

---

## 5. Ma trận Kiểm định Trạng thái Ngoại lệ & Kháng lỗi Web (Error & Resilience Matrix)

| Tình huống Ngoại lệ | Hành vi Kỳ vọng của Web Portal | Ca Kiểm thử Kiểm chứng | File Test Kiểm thử | Trạng thái |
| :--- | :--- | :---: | :--- | :---: |
| **LocalStorage bị khóa / QuotaExceededError** | `SafeLocalStorage` tự động fallback sang RAM; không crash ứng dụng; phiên tiếp tục hoạt động. | `TST-WEB-002` | `storage.test.ts` |   Done  |
| **Bắn đồng thời 5 request gặp 401 Unauthorized** | Mutex Promise Queue giữ 4 request lại; chỉ gọi 1 lần `/auth/refresh`; 5 request ban đầu retry thành công. | `TST-WEB-010` | `tokenRefreshInterceptor.test.ts` |   Done  |
| **Đứt kết nối WebSocket STOMP đột ngột** | Client chuyển sang trạng thái `RECONNECTING`; thử kết nối lại sau mỗi 5s; khôi phục subscription không rò rỉ RAM. | `TST-WEB-011` | `stompClientService.test.ts` |   Done  |
| **Mất mạng khi bấm Đăng xuất** | Client bắt lỗi kết nối nhưng vẫn xóa sạch `fas_auth_session` trong storage và đồng bộ đăng xuất đa tab. | `TST-WEB-024` | `lifecycleServices.test.ts` |   Done  |
| **Tab 1 Đăng xuất khi Tab 2 đang mở** | Tab 2 nhận sự kiện `storage`, xóa sạch bộ nhớ trong và tự động chuyển hướng về trang `/login`. | `TST-WEB-003` | `authStore.test.ts` |   Done  |
| **Phân ca chồng khoảng ngày cho cùng nhân viên** | Backend trả 409 Conflict; giao diện bắt lỗi và hiển thị cảnh báo kèm khoảng trống gợi ý gần nhất. | `TST-WEB-020` | `shiftAndPayroll.test.tsx` |   Done  |
| **Kỳ công đã chốt (`LOCKED`)** | Cờ khóa lan tỏa tới mọi màn hình; vô hiệu hóa nút duyệt đơn/điều chỉnh công; tooltip giải thích rõ lý do. | `TST-WEB-022` | `adminCategoryAndPayrollViews.test.tsx` |   Done  |
| **Mã độc công thức Excel (`=`, `+`, `-`, `@`)** | Hàm xuất báo cáo tự động thêm dấu nháy đơn (`'`) vào đầu chuỗi để vô hiệu hóa thực thi macro/formula injection. | `TST-WEB-017` | `reportExportModule.test.tsx` |   Done  |

---

## 6. Tiêu chuẩn Nghiệm thu & Quy trình Triển khai Kiểm thử (Acceptance Criteria & Test Execution Protocol)

### 6.1. Tiêu chí Nghiệm thu để Ca Kiểm thử Chuyển sang "Done"

Một ca kiểm thử trong kế hoạch chỉ được đánh dấu hoàn thành (**`Done`**) khi đáp ứng đầy đủ các điều kiện khắt khe sau trong quá trình thực thi:

1. **Thực thi Kiểm thử Đạt 100%**:
   - Tất cả các bài kiểm thử tự động tương ứng (`Vitest`) chạy thành công với $0\text{ Failures}$, $0\text{ Errors}$, $0\text{ Skipped}$.
2. **Bằng chứng Thực thi Rõ ràng (Execution Evidence)**:
   - Có nhật ký thực thi (Test Execution Logs) với thời gian (Timestamp), số lượng test run, tỷ lệ pass được đính kèm vào báo cáo nghiệm thu.
   - Đối soát thành công với các component React, store Zustand và mock API thực tế.
3. **Không gây Hồi quy (Zero Regression)**:
   - Toàn bộ test suite của phân hệ Web Portal giữ vững tỷ lệ pass tuyệt đối, không phát sinh lỗi kiểm thử ngoài phạm vi.

### 6.2. Quy trình Triển khai Kiểm thử Thực tế Theo Pha (Phased Execution)

- **Pha 1 — Kế hoạch & Rà soát Đặc tả (Test Planning & Review)**: *(Hoàn thành)*
  - Rà soát toàn diện và chuẩn hóa Test Plan v3.0 bao phủ 100% đặc tả (`spec.md`, `api.md`, `data.md`, `ui-ux.md`).
  - Thiết lập ma trận 29 ca kiểm thử (`TST-WEB-001` .. `TST-WEB-029`) ở trạng thái khởi tạo **`Planned`**.
- **Pha 2 — Triển khai Thực thi Kiểm thử Tự động Theo Nhóm (Automated Execution by Groups)**: *(Sẵn sàng triển khai)*
  - Thực thi tuần tự 4 nhóm kiểm thử trên môi trường Node.js / Vitest của `app/web-portal`:
    - **Nhóm 1**: Xác thực, Phân quyền RBAC, Quản lý Phiên & Lưu trữ Client (7 ca kiểm thử).
    - **Nhóm 2**: Bảng Điều khiển Trực tiếp, WebSocket STOMP & Thông báo (7 ca kiểm thử).
    - **Nhóm 3**: Quản lý Nhân sự, Ca Kíp, Kỳ công & Quản trị Trạm Kiosk (7 ca kiểm thử).
    - **Nhóm 4**: Cổng Cá nhân, Cam kết Consent, Báo cáo Excel & Responsive (8 ca kiểm thử).
- **Pha 3 — Nghiệm thu & Lập Báo cáo Kết quả (Test Acceptance & Reporting)**:
  - Cập nhật trạng thái `Done` cho từng nhóm kèm bằng chứng thực thi, nâng frontmatter `status` lên `Done` sau khi hoàn tất 29/29 ca kiểm thử.

### 6.3. Tiến độ & Nhật ký Nghiệm thu Thực thi (Execution Progress & Evidence Log)

| Nhóm Kiểm thử | Ca kiểm thử | Số test thực thi | Kết quả | Bằng chứng / File Test Thực thi | Mốc thời gian | Trạng thái Nghiệm thu |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **Nhóm 1: Xác thực, Phân quyền RBAC, Phiên & Storage** | `TST-WEB-001`, `002`, `003`, `009`, `010`, `013`, `024` | 93 tests | **93/93 PASS (100%)** | `tokenRefreshInterceptor.test.ts`, `storage.test.ts`, `authStore.test.ts`, `ProtectedRoute.test.tsx`, `accountSessionLifecycle.test.tsx`, `apiClient.test.ts`, `lifecycleServices.test.ts` | 2026-10-17 02:28:45 | **Done (7/7 ca)** |
| **Nhóm 2: Live Dashboard, WebSocket STOMP & Thông báo** | `TST-WEB-004`, `006`, `011`, `012`, `015`, `025`, `028` | 92 tests | **92/92 PASS (100%)** | `liveDashboardAndKpi.test.tsx`, `stompClientService.test.ts`, `useStompClient.test.ts`, `notificationStore.test.ts`, `queryClient.test.ts`, `payrollPeriodStore.test.ts`, `kioskRegistryStore.test.ts` | 2026-10-17 02:30:03 | **Done (7/7 ca)** |
| **Nhóm 3: Nhân sự, Ca kíp, Kỳ công & Quản trị Kiosk** | `TST-WEB-019`, `020`, `021`, `022`, `026`, `027`, `029` | 108 tests | **108/108 PASS (100%)** | `accountSessionLifecycle.test.tsx`, `shiftAndPayroll.test.tsx`, `forceChangePasswordAndCompliance.test.tsx`, `adminCategoryAndPayrollViews.test.tsx`, `kioskAndCompliance.test.tsx`, `lifecycleServices.test.ts`, `portalFullIntegration.test.tsx` | 2026-10-17 02:31:29 | **Done (7/7 ca)** |
| **Nhóm 4: Cổng Cá nhân, Consent, Báo cáo & Responsive** | `TST-WEB-005`, `007`, `008`, `014`, `016`, `017`, `018`, `023` | 77 tests | **77/77 PASS (100%)** | `adminShellLayout.test.tsx`, `consentAndNotification.test.tsx`, `consentService.test.ts`, `personalCalendarExport.test.tsx`, `hrAttendanceView.test.tsx`, `reportExportModule.test.tsx`, `tokens.test.ts` | 2026-10-17 02:32:45 | **Done (8/8 ca)** |
