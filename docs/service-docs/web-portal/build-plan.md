---
title: Web Portal Service Build Plan
version: 1.0
status: Approved
owner: Web Lead & Frontend Architect
---

# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Tổng thể Phân hệ Web Portal


## 1. Approach (Chiến lược Thực hiện)

Phân hệ `web-portal` áp dụng chiến lược gom nhóm và sắp xếp thứ tự thực thi theo mô hình **Slices to Integration** qua các đợt phát hành (Waves), tuân thủ Mục 9.4 của [docs/sdlc-docs.md](../../sdlc-docs.md).
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
| **Wave 1: Foundation Setup** | `FND-WEB-001`, `FND-WEB-002`, `FND-WEB-003`, `FND-WEB-004` | — | Dự án Vite 5, React 18/19, TypeScript, Tailwind CSS, TanStack Query và StompJS cài đặt hoàn tất; lệnh build chạy thành công. |
| **Wave 2: Client Data & Network Client** | `BLD-WEB-001`, `BLD-WEB-002`, `BLD-WEB-003`, `BLD-WEB-009`, `BLD-WEB-010` | Wave 1 | TypeScript data contracts đồng bộ; Safe Storage adapters hoạt động an toàn; Axios base client và bộ chặn tự động làm mới token 401 sẵn sàng. |
| **Wave 3: Core State & Admin Shell** | `BLD-WEB-012`, `BLD-WEB-013`, `BLD-WEB-004`, `BLD-WEB-005` | Wave 2 | Zustand Auth Store phân quyền chính xác; modal cam kết Informed Consent sẵn sàng; Tailwind design tokens và khung Admin Shell responsive hoàn chỉnh. |
| **Wave 4: Realtime STOMP & UI Dashboard** | `BLD-WEB-014`, `BLD-WEB-015`, `BLD-WEB-016`, `BLD-WEB-011`, `BLD-WEB-006`, `BLD-WEB-007`, `BLD-WEB-008` | Wave 3 | Hook STOMP nhận tin nhắn ổn định; bảng Live Table chớp sáng thời gian thực; thẻ KPI nhảy số; modal OTP/QR và lịch cá nhân xuất file Excel/PDF hoàn tất. |
| **Wave 5: Portal Full Integration** | `BLD-WEB-017` | Wave 4 | Luồng toàn trình từ Đăng nhập $\rightarrow$ Ký cam kết $\rightarrow$ Giám sát chấm công Live $\rightarrow$ Xuất báo cáo hoạt động trơn tru; không lỗi memory leak. |

---

## 3. Work Items (Hạng mục Tích hợp Phân hệ)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `BLD-WEB-017` | Tích hợp Toàn trình Giao diện Cổng Web | Ghép nối luồng xác thực JWT, phân quyền router guards, nhận sự kiện WebSocket STOMP cập nhật Live Table, quản lý modal OTP và xuất báo cáo. | `ARC-003`, `SOL-WEB-001`, `UXD-WEB-001`, `APD-WEB-001`, `DTD-WEB-001` | `BLD-WEB-008`, `BLD-WEB-016` | Trải nghiệm người dùng liền mạch; luồng ký cam kết mở khóa OTP chuẩn xác; bảng live table hiển thị bản ghi điểm danh mới dưới 1 giây. | Planned |
