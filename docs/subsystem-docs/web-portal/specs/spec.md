---
title: Web Portal Subsystem Specification
version: 2.0
status: Approved
owner: Web Technical Lead & Frontend Architect
type: spec
scope: WEB
updated: 2026-10-08
---

# ĐẶC TẢ KIẾN TRÚC LÕI PHÂN HỆ CỔNG WEB QUẢN TRỊ & NGƯỜI DÙNG (`web-portal`)

## 1. Giới thiệu Phân hệ & Phạm vi Trách nhiệm Kỹ thuật

Phân hệ **Cổng Web Quản trị & Người dùng** (`web-portal`) là ứng dụng web hiện đại (Single Page Application - SPA) được phát triển bằng ngôn ngữ TypeScript trên nền tảng React 19 và bộ đóng gói Vite 8. Phân hệ đóng vai trò là không gian làm việc số tập trung phục vụ hai nhóm đối tượng chính trong doanh nghiệp:
1. **Quản lý Nhân sự (HR Manager) / Quản trị viên (ADMIN)**: Giám sát chấm công trực tiếp theo thời gian thực từ các trạm Kiosk, quản lý hồ sơ nhân viên, phân ca làm việc, chốt kỳ công, tra cứu nhật ký kiểm toán và xuất báo cáo bảng công định kỳ.
2. **Cán bộ Nhân viên Doanh nghiệp (Employee)**: Tra cứu bảng công cá nhân, theo dõi lịch sử vào/ra, thực hiện quy trình ký cam kết pháp lý Informed Consent (Nghị định 13/2023/NĐ-CP) và nhận mã OTP 6 số kèm mã QR để quét kích hoạt khuôn mặt tại trạm Kiosk.

### Ranh giới Trách nhiệm Kỹ thuật (Technical Scope):
* **Cổng Thông tin Kép (Dual-Role Portal & Role Guards)**: Phân quyền điều hướng tự động dựa trên JWT Claims (`HR_MANAGER`, `EMPLOYEE`, `ADMIN`, `DPO`), bảo vệ các tuyến đường (Protected Routes) và ngăn chặn truy cập trái phép.
* **Quản lý Trạng thái & Lưu trữ Client (Data Facet)**: Lưu trữ phiên an toàn qua LocalStorage Safe Adapter (`fas_auth_session`), cô lập luồng ký cam kết tạm trong SessionStorage (`fas_consent_session`), đồng bộ phiên đa tab qua sự kiện `storage` và tối ưu hóa bộ nhớ đệm truy vấn qua TanStack Query.
* **Giao tiếp Hai chiều (API Facet)**: Kết nối RESTful API qua Axios Client tích hợp bộ chặn tự động làm mới Token (Mutex Refresh Queue) chống Race Condition khi gặp HTTP 401, đồng thời duy trì kết nối WebSocket STOMP nhận thông điệp chấm công trực tiếp và trạng thái nạp khuôn mặt.
* **Trải nghiệm Người dùng Hiện đại (UI/UX Facet)**: Thiết kế dựa trên hệ thống Design Tokens Tailwind CSS phong cách **Indigo Clean SaaS**, bố cục Admin Shell co giãn linh hoạt (Responsive từ mobile đến desktop 4K), bảng Live Table chớp sáng theo thời gian thực và trải nghiệm ký cam kết pháp lý đạt chuẩn bảo vệ dữ liệu cá nhân.

---

## 2. Kiến trúc Nội bộ & Mô hình Phân lớp (Architecture & Component Hierarchy)

Cấu trúc phân lớp của ứng dụng Web Portal được thiết kế theo nguyên tắc phân tách trách nhiệm (Separation of Concerns), đảm bảo tính module hóa và dễ bảo trì:

```mermaid
graph TD
    subgraph Presentation_Layer["Tầng Trình diễn (Presentation Layer - React 19)"]
        Router["React Router v7 (Role-based Guards)"]
        AdminShell["Admin Shell (Sidebar 260px + Header 64px + Content Viewport)"]
        LiveDashboard["Live Attendance Dashboard (KPI Cards + Live Table Flash)"]
        ConsentFlow["Informed Consent Modal & OTP/QR Display"]
        EmployeeCalendar["Employee Attendance Calendar (Month Grid & Drawer)"]
        AdminModules["Management Drawers & Tables (Employees, Shifts, Payroll, Audit)"]
    end

    subgraph State_Layer["Tầng Quản lý Trạng thái & Bộ đệm (State & Cache Layer)"]
        ZustandAuth["Zustand Auth Store (User, Tokens, Permissions)"]
        TanStackQuery["TanStack Query Cache (attendanceKeys, employeeKeys Factory)"]
        UIStore["Zustand UI Store (Sidebar, Toast, Preferences)"]
    end

    subgraph Communication_Layer["Tầng Giao tiếp Mạng (Network & Event Layer)"]
        AxiosClient["Axios HTTP Client (BaseURL, Timeouts)"]
        AuthInterceptor["Response Interceptor (401 Mutex Queue & Refresh Rotation)"]
        StompClient["StompWebSocketService (@stomp/stompjs & SockJS Fallback)"]
    end

    subgraph Client_Storage["Tầng Lưu trữ Trình duyệt (Safe Storage Layer)"]
        SafeLocal["SafeLocalStorage (fas_auth_session, Memory Fallback)"]
        SafeSession["SafeSessionStorage (fas_consent_session)"]
        TabSync["Multi-Tab Storage Event Listener"]
    end

    subgraph Backend_Gateway["Dịch vụ Phía Sau (Remote Services)"]
        BackendREST["Backend Service REST APIs (:8080/api/v1)"]
        BackendWS["WebSocket STOMP Broker (:8080/ws-attendance)"]
    end

    Router --> AdminShell
    AdminShell --> LiveDashboard
    AdminShell --> ConsentFlow
    AdminShell --> EmployeeCalendar
    AdminShell --> AdminModules

    LiveDashboard --> TanStackQuery
    ConsentFlow --> ZustandAuth
    ConsentFlow --> StompClient
    AdminModules --> TanStackQuery

    TanStackQuery --> AxiosClient
    ZustandAuth --> SafeLocal
    ConsentFlow --> SafeSession
    SafeLocal <--> TabSync

    AxiosClient --> AuthInterceptor
    AuthInterceptor --> BackendREST
    StompClient --> BackendWS
    StompClient -.->|Optimistic Cache Prepend| TanStackQuery
```

---

## 3. Danh mục Quyết định Thiết kế Kỹ thuật (Technical Decisions `DD-WEB-`)

Toàn bộ các quyết định kiến trúc và kỹ thuật của Phân hệ Cổng Web Portal được chuẩn hóa trong bảng dưới đây:

| ID | Quyết định Kỹ thuật (Decision) | Lý do & Phân tích Đánh đổi (Rationale) | Giải pháp Thay thế (Alternatives) | Hệ quả & Ràng buộc (Consequences) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `DD-WEB-001` | Xây dựng Web Portal dưới dạng SPA bằng React 19, TypeScript và Vite 8. | Hiệu năng render tối ưu, kiểu dữ liệu an toàn thời gian biên dịch, tốc độ khởi động và HMR cực nhanh của Vite. | Next.js SSR, Vue 3 SPA | Cần xử lý client-side routing và SEO không phải là ưu tiên chính của cổng nội bộ doanh nghiệp. | `ARC-003`, `STK-015`, `STK-016` | Approved |
| `DD-WEB-002` | Phân quyền điều hướng Dual-Role (HR/ADMIN vs EMPLOYEE) qua React Router v7 & Role Guard. | Tách bạch hoàn toàn không gian làm việc số của quản lý nhân sự và nhân viên thông thường, bảo vệ các endpoint UI theo JWT claims. | Tạo 2 ứng dụng web riêng biệt | Giảm chi phí vận hành và hạ tầng deploy, quản lý chung một phiên đăng nhập và domain. | `ARC-003`, `FR-SYS-007` | Approved |
| `DD-WEB-003` | Sử dụng SafeLocalStorage bọc ngoài `window.localStorage` kèm In-Memory Fallback. | Tránh lỗi ứng dụng bị crash khi người dùng mở web ở chế độ ẩn danh (Private Browsing) hoặc khi bộ nhớ quota bị đầy. | Truy cập trực tiếp `localStorage` | Cần module wrapper quản lý serialize/deserialize JSON an toàn và tiền tố `fas_`. | `ARC-003`, `DD-SYS-003` | Approved |
| `DD-WEB-004` | Đồng bộ trạng thái phiên đa tab qua sự kiện `window.addEventListener('storage')`. | Khi người dùng đăng xuất trên một tab, toàn bộ các tab khác đang mở lập tức xóa token và chuyển hướng về `/login`, ngăn chặn rò rỉ phiên. | BroadcastChannel API, Polling | Không phụ thuộc vào service worker, hoạt động đồng nhất trên mọi trình duyệt hiện đại. | `ARC-003`, `FR-SYS-023` | Approved |
| `DD-WEB-005` | Cô lập dữ liệu luồng ký cam kết tạm thời trong `SessionStorage` (`fas_consent_session`). | Dữ liệu OTP, QR code và mã cam kết tự động bị tiêu hủy ngay khi đóng tab hoặc tải lại trình duyệt, tuân thủ an toàn dữ liệu. | Lưu trong LocalStorage, Redux Persist | Người dùng đóng tab sẽ phải ký lại hoặc yêu cầu sinh lại OTP nếu chưa kích hoạt tại Kiosk. | `ARC-003`, `DD-SYS-003` | Approved |
| `DD-WEB-006` | Quản lý bộ đệm truy vấn qua TanStack Query với Query Key Factory tập trung. | Loại bỏ hoàn toàn xung đột cache key giữa các trang; cấu hình `staleTime` linh hoạt ($0\text{ ms}$ cho Live, $60\text{ s}$ cho Lịch sử, $300\text{ s}$ cho Nhân sự). | Redux Toolkit Query, SWR | Tối ưu hóa số lượng network request gửi lên Backend; tái sử dụng dữ liệu mượt mà. | `ARC-003`, `DD-SYS-004` | Approved |
| `DD-WEB-007` | Đồng bộ Cache thời gian thực từ STOMP qua cơ chế Optimistic Prepend (tối đa 50 bản ghi). | Khi nhận bản tin `/topic/live-attendance`, chèn trực tiếp vào đầu cache mảng mà không cần refetch toàn bộ danh sách lịch sử qua HTTP GET. | Polling API định kỳ mỗi 2s, Invalidate Query | Tiết kiệm băng thông máy chủ, thời gian phản hồi giao diện tức thì ($< 100\text{ ms}$). | `ARC-003`, `DD-SYS-004` | Approved |
| `DD-WEB-008` | Đóng gói Axios HTTP Client với Request Interceptor tự động gán Bearer Token. | Tập trung hóa cấu hình BaseURL (`VITE_API_BASE_URL`), timeout chuẩn ($10.0\text{ s}$ cho truy vấn, $5.0\text{ s}$ cho xác thực) và tự gắn JWT token. | Native Fetch API | Đảm bảo tính nhất quán trong xử lý lỗi, chuyển đổi JSON và quản lý hàng đợi interceptors. | `ARC-003`, `DD-SYS-001` | Approved |
| `DD-WEB-009` | Cơ chế Mutex Promise Queue trong Response Interceptor khi gặp HTTP 401 Token Expired. | Ngăn chặn hiện tượng giông bão refresh token (Race Condition) khi 4-5 request song song cùng nhận 401; chỉ phát đúng 1 request `/auth/refresh`. | Bỏ qua refresh tự động, Logout ngay | Giữ phiên làm việc liên tục trong suốt cho người dùng; bảo vệ cơ chế Refresh Token Rotation phía Backend. | `ARC-003`, `DD-SYS-001` | Approved |
| `DD-WEB-010` | Sử dụng `@stomp/stompjs` với SockJS Fallback và tự động kết nối lại theo Exponential Backoff. | Đảm bảo kết nối WebSocket thời gian thực bền bỉ; tự động khôi phục kênh truyền khi mạng chập chờn mà không cần người dùng can thiệp. | Native WebSocket, Server-Sent Events | Khả năng tương thích cao ngay cả phía sau các proxy doanh nghiệp chặn WebSocket thuần. | `ARC-003`, `DD-SYS-004` | Approved |
| `DD-WEB-011` | Tự động đóng Modal OTP và phát hiệu ứng Confetti khi nhận frame STOMP `/topic/enrollment/{otp}`. | Đem lại trải nghiệm người dùng liền mạch: nhân viên quét mặt tại Kiosk, màn hình máy tính cá nhân tự động cập nhật sang trạng thái `ACTIVE`. | Bắt người dùng bấm nút "Tôi đã quét xong", Polling trạng thái | Tăng độ hài lòng của nhân viên, xác nhận tức thì kết quả nạp sinh trắc học thành công. | `ARC-003`, `FR-SYS-008` | Approved |
| `DD-WEB-012` | Áp dụng hệ thống Design Tokens Indigo Clean SaaS trên Tailwind CSS 4 và phông chữ Inter. | Giao diện hiện đại, sạch sẽ, chuyên nghiệp, phông chữ dạng Tabular Monospace giúp các con số trên bảng biểu thẳng hàng tuyệt đối. | Bootstrap, Material UI, Tailwind mặc định | Giao diện có nhận diện thương hiệu nhất quán, tải nhẹ, không thừa mã CSS không sử dụng. | `ARC-003`, `STK-017` | Approved |
| `DD-WEB-013` | Bố cục Admin Shell co giãn: Sidebar 260px (thu gọn 72px) + Header 64px dính đỉnh + Drawer di động. | Tối ưu hóa không gian hiển thị cho các bảng dữ liệu dày đặc; hỗ trợ trải nghiệm từ màn hình di động nhỏ ($< 768\text{ px}$) đến màn hình 4K. | Bố cục cố định không co giãn | Cho phép HR tùy biến thu gọn sidebar để xem trọn vẹn 8-10 cột dữ liệu bảng chấm công. | `ARC-003`, `UXD-WEB-001` | Approved |
| `DD-WEB-014` | Hiệu ứng thị giác Green Flash (1.5s) trên Live Table và tăng bộ đếm thẻ KPI Dashboard. | Giúp người quản trị nhân sự nhận biết tức thì lượt quẹt mới xuất hiện mà không bị phân tâm hay bỏ sót sự kiện. | Chớp nháy toàn bảng, Chuông âm thanh lớn | Trực quan, tinh tế, không gây khó chịu cho người dùng khi có nhiều nhân viên chấm công liên tục. | `ARC-003`, `UXD-WEB-004` | Approved |
| `DD-WEB-015` | Quy trình ký cam kết pháp lý Informed Consent 2 bước có khóa cuộn văn bản 100%. | Đáp ứng nghiêm ngặt Nghị định 13/2023/NĐ-CP: chỉ mở khóa nút "Ký cam kết" khi người dùng đã cuộn hết văn bản điều khoản thu thập dữ liệu. | Cho phép bấm ký ngay không cần đọc | Bảo vệ quyền lợi pháp lý cho doanh nghiệp, đảm bảo sự đồng thuận minh bạch của chủ thể dữ liệu. | `ARC-003`, `DD-SYS-003` | Approved |
| `DD-WEB-016` | Hiển thị mã OTP 6 số kích thước 48px Bold kèm mã QR 200x200px có thời hạn 48 giờ. | Cho phép nhân viên dễ dàng ghi nhớ, sao chép hoặc dùng điện thoại chụp lại để mang ra trạm Kiosk quét kích hoạt. | Chỉ gửi mã qua email, Chỉ hiển thị văn bản nhỏ | Giảm thiểu tối đa lỗi nhập nhầm số tại Kiosk; hỗ trợ người dùng thuận tiện nhất. | `ARC-003`, `UXD-WEB-002` | Approved |
| `DD-WEB-017` | Kết xuất báo cáo bảng công phía Client qua `exceljs` và `jspdf` có phòng chống Formula Injection. | Giảm tải xử lý tài nguyên cho Backend Server; tự động làm sạch các ký tự nguy hiểm (`=`, `+`, `-`, `@`) trong nội dung file Excel tải về. | Render file tại máy chủ Java Backend | Tốc độ xuất báo cáo tức thời ($\le 3\text{ giây}$ cho 1,000 bản ghi), loại trừ rủi ro bảo mật tệp văn phòng. | `ARC-003`, `FR-SYS-016` | Approved |
| `DD-WEB-018` | Hộp thoại mật khẩu tạm hiển thị duy nhất một lần và quy trình đổi mật khẩu tự nguyện. | Bảo vệ thông tin xác thực ban đầu; không chặn điều hướng người dùng; cho phép nhân viên tự do đổi mật khẩu khi có nhu cầu. | Bắt buộc đổi mật khẩu ngay khi đăng nhập | Tránh làm gián đoạn trải nghiệm người dùng; tuân thủ quyết định gỡ bỏ cờ chặn `must_change_password`. | `ARC-003`, `FR-SYS-017` | Approved |
| `DD-WEB-019` | Lưu trữ Secret Token của trạm Kiosk duy nhất trong RAM (React State), không ghi Storage. | Tránh nguy cơ rò rỉ mã bí mật của trạm Kiosk qua công cụ kiểm tra trình duyệt hoặc mã độc XSS; cảnh báo trạm Kiosk mất ping $> 5\text{ phút}$. | Lưu vào LocalStorage | Đảm bảo an toàn tuyệt đối cho phân hệ máy trạm tại biên; token biến mất ngay khi rời màn hình hoặc F5. | `ARC-003`, `FR-SYS-020` | Approved |
| `DD-WEB-020` | Trung tâm thông báo trong ứng dụng cập nhật lạc quan (Optimistic Update) và phân tách theo User. | Badge số lượng thông báo chưa đọc cập nhật ngay lập tức khi click; dữ liệu thông báo được xóa sạch khỏi cache khi người dùng đăng xuất. | Refetch lại danh sách sau mỗi click | Giao diện phản hồi tức thì, mượt mà; không để lộ thông báo của người dùng trước đó. | `ARC-003`, `FR-SYS-027` | Approved |

---

## 4. Ma trận Truy vết & Nguồn Tham chiếu Upstream (Traceability Matrix)

| Quyết định / Thành phần | Mã Kiến trúc Hệ thống | Nguồn Tham chiếu Yêu cầu Hệ thống | Tài liệu Triển khai Kế tiếp |
| :--- | :---: | :---: | :--- |
| `DD-WEB-001`, `DD-WEB-002` | `ARC-003`, `DD-SYS-001` | `FR-SYS-007`, `NFR-SYS-001` | `specs/fr-nfr.md`, `plans/build-plan.md` (`BLD-WEB-012`) |
| `DD-WEB-003`, `DD-WEB-004`, `DD-WEB-005` | `ARC-003`, `DD-SYS-003` | `FR-SYS-008`, `FR-SYS-023` | `specs/data.md`, `plans/build-plan.md` (`BLD-WEB-002`) |
| `DD-WEB-006`, `DD-WEB-007` | `ARC-003`, `DD-SYS-004` | `FR-SYS-014`, `NFR-SYS-003` | `specs/data.md`, `plans/build-plan.md` (`BLD-WEB-003`) |
| `DD-WEB-008`, `DD-WEB-009`, `DD-WEB-010` | `ARC-003`, `DD-SYS-001`, `DD-SYS-004` | `API-SYS-001`, `NFR-SYS-006` | `specs/api.md`, `plans/build-plan.md` (`BLD-WEB-009..011`) |
| `DD-WEB-011`, `DD-WEB-015`, `DD-WEB-016` | `ARC-003`, `DD-SYS-003` | `FR-SYS-008`, `NFR-SYS-007` | `specs/ui-ux.md`, `plans/build-plan.md` (`BLD-WEB-007`) |
| `DD-WEB-012`, `DD-WEB-013`, `DD-WEB-014` | `ARC-003`, `DD-SYS-004` | `FR-SYS-014`, `NFR-SYS-002` | `specs/ui-ux.md`, `plans/build-plan.md` (`BLD-WEB-004..006`) |
| `DD-WEB-017`..`DD-WEB-020` | `ARC-003`, `DD-SYS-001..004` | `FR-SYS-016..027` | `specs/api.md`, `specs/ui-ux.md`, `plans/build-plan.md` (`BLD-WEB-018..024`) |
