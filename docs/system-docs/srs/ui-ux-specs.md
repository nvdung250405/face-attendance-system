---
title: Đặc tả Yêu cầu Giao diện & Trải nghiệm Người dùng Hệ thống (UI/UX)
version: 1.0
status: Approved
owner: Product Designer
---

# UI/UX SPECS — Đặc tả Yêu cầu Giao diện & Trải nghiệm Người dùng Hệ thống

Đặc tả hành trình người dùng (User Journeys), các trạng thái tương tác trực quan và các thuộc tính trải nghiệm (Experience Qualities) trên cả hai phân hệ có giao diện: Trạm Điểm danh Kiosk Desktop và Cổng Quản trị Web Portal.

---

## 1. Tasks & User Journeys (Nhiệm vụ & Hành trình Người dùng)

| ID | User Journey / Task | Tác nhân Chính | Luồng Tương tác Nghiệp vụ | Tiêu chí Nghiệm thu Trải nghiệm |
| :--- | :--- | :---: | :--- | :--- |
| `UI-SYS-001` | Hành trình Điểm danh Khuôn mặt Không tiếp xúc | `ACT-001` | Người dùng bước vào vùng quét $\rightarrow$ Khung oval hướng dẫn căn mặt $\rightarrow$ Giữ ổn định $0.5 - 1.0\text{ s}$ $\rightarrow$ Viền chuyển Xanh lá kèm tiếng "Tít" $\rightarrow$ Hiển thị thông tin cá nhân trong 2.5s $\rightarrow$ Quay về màn hình chờ. | Thời gian hoàn tất $\le 1.0\text{ s}$; không cần chạm tay; thao tác trực quan, tự nhiên. |
| `UI-SYS-002` | Hành trình Điểm danh Dự phòng bằng PIN | `ACT-001` | Nhấn nút "Nhập PIN" (F2) $\rightarrow$ Bàn phím số ảo PIN Pad hiển thị $\rightarrow$ Nhập mã PIN 6 số $\rightarrow$ Xác thực thành công $\rightarrow$ Viền Xanh lá, phát âm thanh $\rightarrow$ Đóng hộp thoại. | Phím bấm cảm ứng lớn $\ge 60\times 60\text{ px}$; khóa 15 phút nếu nhập sai quá 5 lần. |
| `UI-SYS-003` | Hành trình Tự Đăng ký Mẫu Mặt (In-Viewport 3 Bước) | `ACT-001` | Nhấn "Đăng ký" (F3) $\rightarrow$ Nhập mã OTP 6 số $\rightarrow$ Hộp thoại tự ẩn để dùng toàn màn hình camera chính $\rightarrow$ Chụp liên tiếp 3 ảnh đạt chuẩn $\rightarrow$ Tự mở lại hộp thoại Bước 3 $\rightarrow$ Xác nhận thành công. | Người dùng không bị phân tâm bởi popup nhỏ; tận dụng khung oval lớn trên camera chính; hoàn tất $< 5\text{ s}$. |
| `UI-SYS-004` | Hành trình Giám sát Trực quan Thời gian thực (Live Dashboard) | `ACT-002` | HR mở màn hình Dashboard $\rightarrow$ Luồng sự kiện điểm danh từ Kiosk tự động bắn xuống $\rightarrow$ Bảng danh sách cập nhật động, card tổng sĩ số tăng tức thời $\rightarrow$ Bật cảnh báo nếu đi muộn. | Không cần reload trang (Zero Page Refresh); độ trễ hiển thị $\le 200\text{ ms}$; hiệu ứng chuyển động mượt mà. |
| `UI-SYS-005` | Hành trình Ký Cam kết Informed Consent Điện tử | `ACT-001` | Nhân viên đăng nhập Cổng Web lần đầu $\rightarrow$ Modal cam kết pháp lý Luật 2025 hiển thị bắt buộc $\rightarrow$ Đọc quyền lợi và nghĩa vụ $\rightarrow$ Tích chọn đồng thuận $\rightarrow$ Hệ thống mở khóa tài khoản. | Không thể bỏ qua modal; lưu vết pháp lý chính xác mốc thời gian, IP và User-Agent. |
| `UI-SYS-006` | Hành trình Duyệt Đơn Giải trình Công & Xuất Báo cáo | `ACT-002` | HR mở danh sách đơn giải trình $\rightarrow$ Xem lý do và minh chứng $\rightarrow$ Nhấn "Phê duyệt" hoặc "Từ chối" $\rightarrow$ Bảng công tự động cập nhật lại $\rightarrow$ Nhấn "Xuất Excel" tải file an toàn. | Thao tác 1-click; file Excel tải về sạch mã độc công thức (Anti-Formula Injection). |

---

## 2. Interface & Interaction Specifications (Trạng thái Tương tác Giao diện)

| ID | Thành phần Giao diện | Trạng thái / Hành vi | Đặc tả Trực quan & Hành vi Tương tác |
| :--- | :--- | :--- | :--- |
| `UI-SYS-007` | Khung Oval Định vị Khuôn mặt (Kiosk) | **Trạng thái Chờ (Standby)** | Viền màu Xám nhạt (`#64748B`), nét đứt mảnh; hiển thị thông điệp "Vui lòng nhìn thẳng vào khung oval". |
| `UI-SYS-008` | Khung Oval Định vị Khuôn mặt (Kiosk) | **Trạng thái Căn chỉnh (Aligning)** | Viền chuyển màu Vàng hổ phách (`#F59E0B`), nét liền; hiển thị thông điệp chỉ dẫn điều hướng: "Đến gần hơn", "Lùi ra xa", "Lệch trái", "Lệch phải" hoặc "Giữ thẳng đầu". |
| `UI-SYS-009` | Khung Oval Định vị Khuôn mặt (Kiosk) | **Trạng thái Thành công (Success)** | Viền chuyển màu Xanh lá (`#10B981`), nét dày rực rỡ kèm hiệu ứng sóng quét (Pulse Scan); phát âm thanh "Tít" ngắn ($0.2\text{ s}$). |
| `UI-SYS-010` | Khung Oval Định vị Khuôn mặt (Kiosk) | **Trạng thái Từ chối (Rejected)** | Viền chuyển màu Đỏ cảnh báo (`#EF4444`); hiển thị lý do: "Ảnh giả mạo", "Nghiêng đầu quá góc" hoặc "Không nhận diện được"; phát tiếng bíp cảnh báo. |
| `UI-SYS-011` | Thẻ Thông tin Điểm danh (Kiosk Result Card) | Hiển thị kết quả thành công | Xuất hiện góc dưới màn hình trong $2.5\text{ giây}$: Ảnh đại diện, Họ tên nhân viên, Mã nhân viên, Giờ chấm công và trạng thái "Đúng giờ / Đi muộn". |
| `UI-SYS-012` | Bàn phím Số ảo PIN Pad (Virtual PIN Dialog) | Cảm ứng kích thước lớn | Lưới phím số $3\times 4$ với các nút $0-9$, nút Xóa (`Backspace`) và nút Xác nhận (`OK`); kích thước nút tối thiểu $60\times 60\text{ px}$; ô hiển thị 6 dấu sao che mã. |
| `UI-SYS-013` | Thanh Trạng thái Hệ thống (Header & Status Bar) | Hiển thị tình trạng kết nối | Biểu tượng trạng thái kết nối máy chủ (Chấm Xanh: Online, Chấm Vàng/Đỏ: Offline kèm số lượng bản ghi đang chờ đồng bộ bù); đồng hồ số thời gian thực. |

---

## 3. Experience Qualities (Thuộc tính Trải nghiệm Người dùng)

| ID | Thuộc tính Trải nghiệm | Ràng buộc Kỹ thuật & Thiết kế | Mục tiêu Chất lượng |
| :--- | :--- | :--- | :--- |
| `UI-SYS-014` | Tỷ lệ Màn hình Kiosk Chuẩn 9:16 | Thiết kế tối ưu cho màn hình cảm ứng đặt dọc ($1080\times 1920\text{ px}$). | Tự động co giãn theo tỷ lệ động (Proportional Scaling) tương thích từ độ phân giải 720p đến 4K mà không vỡ bố cục. |
| `UI-SYS-015` | Phản hồi Ngay lập tức (Instant Visual Feedback) | Mọi tương tác chạm hoặc phát hiện khuôn mặt phải có phản hồi thị giác trong vòng $\le 50\text{ ms}$. | Không tạo cảm giác chờ đợi hoặc phân vân cho người dùng khi đứng trước trạm Kiosk. |
| `UI-SYS-016` | Thiết kế Web Quản trị Thích ứng (Responsive Design) | Giao diện Cổng Web Portal tối ưu hiển thị trên màn hình Desktop (1920x1080), Laptop (1366x768) và Tablet/Mobile. | Bố cục dạng thẻ linh hoạt, sidebar thu gọn thông minh, hỗ trợ chuyển đổi giao diện Sáng/Tối (Light/Dark mode). |
