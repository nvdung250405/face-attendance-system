---
title: Web Portal Subsystem Test Plan
version: 2.0
status: Approved
owner: Web QA Lead & Frontend Test Engineer
type: plan
scope: WEB
updated: 2026-10-08
---

# KẾ HOẠCH KIỂM THỬ TỔNG THỂ PHÂN HỆ CỔNG WEB QUẢN TRỊ & NGƯỜI DÙNG (`web-portal`)

## 1. Phạm vi & Quyết định Tiếp cận Kiểm thử (Scope & Approach Decisions)

Phân hệ `web-portal` áp dụng chiến lược kiểm thử đa tầng từ Unit test, Integration test đến End-to-End (E2E) Browser test, đảm bảo tính ổn định và an toàn của ứng dụng web.

### Danh mục Quyết định Tiếp cận Kiểm thử (`APC-WEB-`):
| ID | Quyết định Tiếp cận Kiểm thử | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-WEB-001` | Sử dụng Vitest kết hợp jsdom để kiểm thử tương tác Storage APIs. | Giả lập môi trường trình duyệt chuẩn, cho phép kiểm tra chi tiết các sự kiện StorageEvent và serialization. | `STK-015`, `DATA-WEB-001` | Approved |
| `APC-WEB-002` | Kiểm thử biên (Edge Case Testing) khi LocalStorage bị khóa hoặc đầy dung lượng (QuotaExceededError). | Ngăn chặn hiện tượng ứng dụng bị crash khi người dùng mở web trong chế độ bảo mật nghiêm ngặt. | `DTD-WEB-001`, `NFR-WEB-001` | Approved |
| `APC-WEB-003` | Kiểm thử đa thiết bị (Cross-device Testing) bằng Playwright Headless Browser. | Tự động chụp ảnh so sánh pixel (Visual Snapshot) trên các viewport: Mobile ($390\times 844$), Tablet ($820\times 1180$), Desktop ($1440\times 900$). | `STK-015`, `UI-WEB-001` | Approved |
| `APC-WEB-004` | Kiểm định tương tác Modal và khả năng tiếp cận (Accessibility - a11y testing). | Đảm bảo các modal có bẫy tiêu điểm (Focus Trap), hỗ trợ đóng bằng phím ESC và phím Tab hoạt động chuẩn mực. | `UXD-WEB-002`, `NFR-WEB-002` | Approved |
| `APC-WEB-005` | Sử dụng `msw` (Mock Service Worker) bắt chặn request ở tầng network ảo. | Kiểm thử chân thực luồng HTTP mà không can thiệp vào mã nguồn nội bộ của Axios. | `STK-015`, `API-WEB-001` | Approved |
| `APC-WEB-006` | Mô phỏng kịch bản Token Hết Hạn Đồng Thời (Concurrent 401 Chaos Testing). | Xác thực cơ chế Mutex Promise Queue hoạt động hoàn hảo, bảo vệ Refresh Token không bị vô hiệu hóa do gọi lặp. | `APD-WEB-002`, `NFR-WEB-001` | Approved |

---

## 2. Công cụ & Tiêu chuẩn Nghiệm thu (Tooling & Acceptance Standard)

* **Công cụ**: Vitest, React Testing Library, Mock Service Worker (MSW), Playwright Test.
* **Tiêu chuẩn hoàn thành**: $100\%$ ca kiểm thử thành công (Pass); độ bao phủ dòng mã của các component nghiệp vụ và service $\ge 80\%$.

---

## 3. Danh mục Ca Kiểm thử Phân hệ Web Portal (`TST-WEB-`)

| ID | Tên Ca Kiểm thử | Bao phủ (`Covers`) | Cấp độ | Tiêu chí Vượt qua (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-WEB-001` | Kiểm thử TypeScript Contracts & Validation | `DATA-WEB-001..004` | Unit | Toàn bộ dữ liệu JSON từ API serialize/deserialize chính xác vào các interface TypeScript mà không mất trường. | Done |
| `TST-WEB-002` | Kiểm thử Safe Storage Adapter & Fallback RAM | `DTD-WEB-001` | Unit / Resiliency | Khi LocalStorage ném lỗi; adapter tự động chuyển sang lưu tạm trong RAM; không làm dừng luồng ứng dụng. | Done |
| `TST-WEB-003` | Kiểm thử Đồng bộ Trạng thái Phiên Đa Tab | `DTD-WEB-001`, `DTD-WEB-002` | Integration | Kích hoạt sự kiện logout trên Tab 1; Tab 2 tự động xóa token và chuyển hướng về màn hình đăng nhập. | Done |
| `TST-WEB-004` | Kiểm thử TanStack Query Realtime Injection | `DATA-WEB-004` | Integration / Cache | Nhận sự kiện WebSocket mới; hook tự động chèn bản ghi vào đầu danh sách cache mà không refetch toàn bộ API. | Done |
| `TST-WEB-005` | Kiểm thử Khung Bố cục Admin Shell Responsive | `UI-WEB-001`, `UXD-WEB-001` | Visual / GUI | Sidebar thu gọn/mở rộng mượt; trên Mobile chuyển thành Drawer menu trượt; nội dung không bị tràn ngang. | Done |
| `TST-WEB-006` | Kiểm thử Live Dashboard Row Highlight & KPI | `UI-WEB-003`, `UXD-WEB-003`, `UXD-WEB-004` | Component / Animation | Bắn sự kiện điểm danh mới; hàng mới chớp sáng màu xanh ngọc trong 1.5s; số KPI tăng tức thì. | Done |
| `TST-WEB-007` | Kiểm thử Modal Ký Cam kết Informed Consent | `UI-WEB-002`, `UXD-WEB-002` | Journey / Flow | Nhân viên đọc điều khoản $\rightarrow$ Ký điện tử $\rightarrow$ Modal hiển thị OTP 6 số và mã QR; nút Copy hoạt động tốt. | Done |
| `TST-WEB-008` | Kiểm thử Lịch Biểu Chấm công Cá nhân | `UI-WEB-005`, `UXD-WEB-005` | Component | Hiển thị dạng lưới tháng; các ô phân biệt rõ màu xanh (đúng giờ), vàng (đi muộn), xám (nghỉ lễ/phép). | Done |
| `TST-WEB-009` | Kiểm thử Tự Động Gắn Bearer Token | `API-WEB-001` | Unit / Network | Request gửi đi tự động có header `Authorization: Bearer <token>`; request public không có header này. | Done |
| `TST-WEB-010` | Kiểm thử Mutex Refresh Interceptor khi 401 | `API-WEB-002`, `APD-WEB-002` | Integration / Concurrency | Bắn đồng thời 5 request trả về 401; chỉ có 1 request refresh được gọi; 5 request ban đầu retry thành công. | Done |
| `TST-WEB-011` | Kiểm thử Kết nối & Tự Reconnect STOMP | `API-WEB-007`, `APD-WEB-003` | Integration / Realtime | Mô phỏng WebSocket đóng bất ngờ; STOMP client kích hoạt cơ chế thử lại sau mỗi 5s và khôi phục kênh. | Done |
| `TST-WEB-012` | Kiểm thử Clean-up Subscription trong Hooks | `APD-WEB-003` | Component / Memory | Unmount component sử dụng `useLiveAttendance`; hàm cleanup gọi `subscription.unsubscribe()` giải phóng RAM. | Done |
| `TST-WEB-013` | Đăng nhập & Định tuyến Phân quyền RBAC | `FR-WEB-001` | Component / Flow | Đăng nhập tài khoản HR mở trang HR; tài khoản NV mở trang cá nhân. | Done |
| `TST-WEB-014` | Quy trình Ký Cam kết Consent & Hiển thị OTP | `FR-WEB-002` | Flow / Integration | Ký cam kết thành công sinh ra đúng mã OTP 6 số và mã QR tương ứng. | Done |
| `TST-WEB-015` | Tiếp nhận Sự kiện Điểm danh Đẩy qua STOMP | `FR-WEB-003` | Integration | Giả lập Backend bắn tin STOMP; bảng Live Dashboard xuất hiện dòng mới ngay lập tức. | Done |
| `TST-WEB-016` | Tra cứu Lịch sử Chấm công Cá nhân | `FR-WEB-004` | Component | Hiển thị chính xác số ngày công, số phút đi trễ theo từng tháng. | Done |
| `TST-WEB-017` | Xuất Báo cáo Điểm danh Ra File Excel | `FR-WEB-006` | Functional | File Excel tải xuống mở được, đúng định dạng cột và số liệu tính toán. | Done |
| `TST-WEB-018` | Kiểm tra Tương thích Giao diện Responsive | `NFR-WEB-002` | Visual / E2E | Hiển thị tốt trên màn hình tablet ($1024\times 768$) và desktop ($1920\times 1080$). | Done |
| `TST-WEB-019` | Kiểm thử Vòng đời Hồ sơ Nhân sự | `FR-WEB-007`, `API-WEB-009`, `API-WEB-010` | Flow / Integration | Tạo hồ sơ hiển thị mật khẩu tạm đúng một lần và cảnh báo không xem lại; sửa/vô hiệu hóa yêu cầu xác nhận; cấp lại mật khẩu tạm thông báo phiên cũ đã bị thu hồi. | Planned |
| `TST-WEB-020` | Kiểm thử Quản lý Ca kíp & Phân ca | `FR-WEB-008`, `API-WEB-011` | Flow / Integration | Tạo/sửa/vô hiệu hóa ca thành công; phân ca chồng khoảng hiển thị lỗi 409 kèm khoảng trống gợi ý; lịch tuần cập nhật ngay sau khi lưu. | Planned |
| `TST-WEB-021` | Kiểm thử Đổi Mật khẩu Tự nguyện & Quản lý PIN | `FR-WEB-009`, `API-WEB-012` | Flow / Security | Người dùng còn dùng mật khẩu tạm vào được mọi màn hình (không có chặn điều hướng); đổi mật khẩu từ menu thành công và thông báo thu hồi phiên cũ; thiết lập PIN yêu cầu nhập lại; đặt lại PIN yêu cầu mật khẩu hiện tại. | Planned |
| `TST-WEB-022` | Kiểm thử Chốt Kỳ công & Lan toả Cờ Khoá | `FR-WEB-010`, `API-WEB-013` | Flow / Integration | Sau khi chốt kỳ, nhãn "Đã chốt" xuất hiện và nút duyệt đơn/điều chỉnh công bị vô hiệu hoá trên mọi màn hình; ADMIN mở lại bắt buộc nhập lý do. | Planned |
| `TST-WEB-023` | Kiểm thử Rút Consent & Yêu cầu Dữ liệu Cá nhân | `FR-WEB-011`, `API-WEB-014` | Flow / Compliance | Cảnh báo hệ quả hiển thị trước khi rút; rút thành công hiển thị hạn tiêu huỷ 7 ngày; yêu cầu dữ liệu cá nhân hiển thị trạng thái xử lý và role `DPO` xử lý được. | Planned |
| `TST-WEB-024` | Kiểm thử Đăng xuất & Xử lý Phiên Hết hạn | `FR-WEB-012`, `API-WEB-015` | Flow / Integration | Đăng xuất gọi API thu hồi token, xoá storage và đăng xuất mọi tab; khi refresh token thất bại tự chuyển về trang đăng nhập kèm thông báo lý do. | Planned |
| `TST-WEB-025` | Kiểm thử Trung tâm Thông báo Trong ứng dụng | `FR-WEB-013`, `API-WEB-016` | Component / Integration | Badge số chưa đọc đúng; đánh dấu đã đọc cập nhật tức thời; thông báo chỉ thuộc người đang đăng nhập và bị xoá khi đăng xuất. | Planned |
| `TST-WEB-026` | Kiểm thử Quản trị Trạm Kiosk & Tra cứu Tuân thủ | `FR-WEB-014`, `API-WEB-017` | Flow / Security | Secret Token chỉ hiển thị một lần và **không** xuất hiện trong LocalStorage/SessionStorage; trạm quá 5 phút không ping có cảnh báo; role `DPO` không thấy thao tác ghi. | Planned |
| `TST-WEB-027` | Kiểm thử Hợp đồng REST Vòng đời (Nhân sự, Ca, Kỳ công, Consent, Phiên, Thông báo, Tuân thủ, Export) | `API-WEB-009` đến `API-WEB-018` | Integration / Contract | Mọi giao diện vòng đời gọi đúng đường dẫn/phương thức và diễn giải đúng 200/201/204 cùng 400/401/403/409; mật khẩu tạm và Secret Token không bị cache hay ghi vào storage. | Planned |
| `TST-WEB-028` | Kiểm thử Store Trạng thái Vòng đời phía Client | `DATA-WEB-005`, `DATA-WEB-006`, `DATA-WEB-007` | Unit / Integration | Trạng thái thông báo phân tách theo người dùng và bị xoá khi đăng xuất; cờ khoá kỳ công **không** xuất hiện trong LocalStorage; Secret Token chỉ tồn tại trong RAM và bị xoá khi unmount/tải lại trang. | Planned |
| `TST-WEB-029` | Kiểm thử Màn hình Vòng đời (Danh mục, Kỳ công, Consent, Thông báo, Tuân thủ) | `UI-WEB-006` đến `UI-WEB-012`, `UXD-WEB-006` đến `UXD-WEB-008` | Visual / Journey | Form nhập liệu trong Drawer và cảnh báo nghiệp vụ hiển thị đúng trên đầu bảng; đổi mật khẩu tự nguyện không chặn điều hướng; badge thông báo và dấu hiệu "chỉ đọc" của màn hình tuân thủ hiển thị chính xác. | Planned |

---

## 4. Quản lý Lỗi & Mức độ Nghiêm trọng (Defect Management)

| Mức độ | Định nghĩa & Tác động | Ví dụ trong Web Portal | Thời gian Xử lý Tối đa |
| :--- | :--- | :--- | :---: |
| **Blocker (P0)** | Hệ thống dừng hoạt động hoàn toàn, lỗi vòng lặp refresh token vô tận, rò rỉ phiên người dùng. | Không thể đăng nhập, Refresh token loop 401 liên tục làm treo trình duyệt. | $\le 4\text{ giờ}$ |
| **Critical (P1)** | Mất mát phiên làm việc đột ngột, hỏng bộ nhớ đệm cache làm hiển thị dữ liệu sai lệch người dùng. | Tab này logout không đồng bộ tab kia; Live Table hiển thị sai dữ liệu của nhân viên khác. | $\le 8\text{ giờ}$ |
| **Major (P2)** | Lỗi làm vỡ layout responsive (thanh cuộn ngang ngoài ý muốn), không đóng được Modal cam kết. | Màn hình tablet bị tràn nội dung; nút đóng Modal OTP không phản hồi. | $\le 24\text{ giờ}$ |
| **Minor (P3)** | Lỗi giao diện nhỏ, màu sắc badge sai lệch nhẹ, animation chớp sáng không mượt. | Hiệu ứng Green Flash kéo dài hơn 1.5s; icon căn chỉnh lệch 2px. | $\le 48\text{ giờ}$ |
