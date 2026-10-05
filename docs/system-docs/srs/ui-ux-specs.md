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

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `UI-SYS-001` | Người dùng phải thực hiện được hành trình điểm danh khuôn mặt không chạm: bước vào vùng quét, căn mặt vào oval, giữ ổn định 0.5-1.0s và nhận phản hồi trực quan/âm thanh thành công. | Tasks & Journeys | Must | `ACT-001`, `PD-002` | Thời gian hoàn tất chu kỳ $\le 1.0\text{ s}$; không cần chạm tay; hiển thị thẻ kết quả 2.5s rồi quay về màn hình chờ. | Approved |
| `UI-SYS-002` | Người dùng phải thực hiện được hành trình điểm danh dự phòng bằng PIN: bấm phím "Nhập PIN" (F2), nhập mã PIN 6 số trên bàn phím ảo và nhận kết quả xác thực. | Tasks & Journeys | Should | `ACT-001`, `PD-008` | Phím bấm cảm ứng $\ge 60\times 60\text{ px}$; xác thực đúng đóng hộp thoại; tự động khóa bàn phím 15 phút nếu nhập sai quá 5 lần. | Approved |
| `UI-SYS-003` | Người dùng phải tự thực hiện được quy trình nạp mẫu khuôn mặt 3 bước in-viewport: nhập OTP, hộp thoại tự ẩn để dùng toàn màn hình camera chính chụp 3 ảnh chuẩn và nạp vector. | Tasks & Journeys | Must | `ACT-001`, `PD-007` | Hộp thoại tự ẩn nhường trọn camera chính ở Bước 2; hoàn tất tiến trình trong $< 5\text{ s}$. | Approved |
| `UI-SYS-004` | Chuyên viên HR phải theo dõi được luồng sự kiện điểm danh thời gian thực trên Live Dashboard mà không cần reload trang. | Tasks & Journeys | Must | `ACT-002`, `PD-006` | Cập nhật dữ liệu tự động với độ trễ $\le 200\text{ ms}$; thẻ chỉ số tổng quân số và bảng live chèn dòng mới mượt mà. | Approved |
| `UI-SYS-005` | Nhân viên đăng nhập lần đầu phải thực hiện hành trình ký văn bản thỏa thuận Informed Consent điện tử bắt buộc theo Luật 2025. | Tasks & Journeys | Must | `ACT-001`, `PD-005` | Không thể bỏ qua modal; nút đồng ý chỉ kích hoạt khi cuộn hết nội dung; lưu vết chính xác mốc giờ, IP và User-Agent. | Approved |
| `UI-SYS-006` | Chuyên viên HR phải xem xét, phê duyệt/từ chối đơn giải trình công và xuất báo cáo bảng công Excel an toàn chống Formula Injection. | Tasks & Journeys | Must | `ACT-002`, `INF-003` | Thao tác 1-click duyệt/từ chối; file Excel (.xlsx) xuất ra tự động vô hiệu hóa các ký tự công thức nguy hiểm (`=`, `+`, `-`, `@`). | Approved |

---

## 2. Interface & Interaction Specifications (Trạng thái Tương tác Giao diện)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `UI-SYS-007` | Khung Oval định vị phải hiển thị trạng thái Chờ (Standby) khi chưa có người hoặc mặt chưa lọt vào vùng quét. | Interface & Interaction | Must | `UI-SYS-001` | Viền màu Xám nhạt (`#64748B`), nét đứt mảnh; hiển thị thông điệp "Vui lòng nhìn thẳng vào khung oval". | Approved |
| `UI-SYS-008` | Khung Oval định vị phải hiển thị trạng thái Căn chỉnh (Aligning) kèm thông điệp điều hướng khi phát hiện mặt nhưng chưa đạt chuẩn. | Interface & Interaction | Must | `UI-SYS-001` | Viền chuyển màu Vàng hổ phách (`#F59E0B`), nét liền; hiển thị rõ chỉ dẫn: "Đến gần hơn", "Lùi ra xa", "Lệch tâm", "Giữ thẳng đầu". | Approved |
| `UI-SYS-009` | Khung Oval định vị phải chuyển sang trạng thái Thành công (Success) khi nhận diện hợp lệ và đạt ngưỡng ổn định. | Interface & Interaction | Must | `UI-SYS-001` | Viền chuyển màu Xanh lá (`#10B981`) rực rỡ kèm hiệu ứng sóng quét (Pulse Scan) và phát âm thanh "Tít" ngắn ($0.2\text{ s}$). | Approved |
| `UI-SYS-010` | Khung Oval định vị phải chuyển sang trạng thái Từ chối (Rejected) khi phát hiện giả mạo 2D hoặc không nhận diện được. | Interface & Interaction | Must | `UI-SYS-001` | Viền chuyển màu Đỏ cảnh báo (`#EF4444`); hiển thị lý do từ chối và phát tiếng bíp cảnh báo. | Approved |
| `UI-SYS-011` | Giao diện Kiosk phải hiển thị thẻ kết quả điểm danh nổi (Result Card) góc dưới màn hình sau khi nhận diện thành công. | Interface & Interaction | Must | `UI-SYS-001` | Nổi lên trong $2.5\text{ s}$: ảnh đại diện, họ tên, mã nhân viên, giờ chấm và trạng thái "Đúng giờ / Đi muộn". | Approved |
| `UI-SYS-012` | Giao diện Kiosk phải cung cấp hộp thoại bàn phím số ảo PIN Pad cảm ứng kích thước lớn để nhập mã PIN 6 số. | Interface & Interaction | Should | `UI-SYS-002` | Lưới phím $3\times 4$ với các nút $\ge 60\times 60\text{ px}$; hiển thị 6 dấu sao che mã; hỗ trợ phím Xóa và Xác nhận. | Approved |
| `UI-SYS-013` | Giao diện Kiosk phải hiển thị thanh trạng thái Header Bar thể hiện tình trạng kết nối mạng và đồng hồ số thời gian thực. | Interface & Interaction | Must | `PD-004` | Chấm Xanh khi Online; Chấm Vàng/Đỏ khi Offline kèm số lượng bản ghi điểm danh đang chờ gửi bù lên máy chủ. | Approved |

---

## 3. Experience Qualities (Thuộc tính Trải nghiệm Người dùng)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `UI-SYS-014` | Giao diện Kiosk phải được thiết kế theo tỷ lệ chuẩn 9:16 dọc ($1080\times 1920\text{ px}$) và hỗ trợ co giãn tỷ lệ động. | Experience Qualities | Must | `PD-001` | Co giãn theo công thức tỷ lệ $S = \min(W/1080, H/1920)$, hiển thị cân đối từ 720p đến 4K mà không vỡ bố cục. | Approved |
| `UI-SYS-015` | Mọi tương tác chạm hoặc phát hiện khuôn mặt trên Kiosk phải có phản hồi thị giác ngay lập tức. | Experience Qualities | Must | `PD-002` | Độ trễ phản hồi thị giác $\le 50\text{ ms}$, không tạo cảm giác khựng hay phân vân cho người dùng. | Approved |
| `UI-SYS-016` | Giao diện Cổng Web Portal phải đáp ứng chuẩn Responsive đa kích thước màn hình và hỗ trợ chuyển đổi giao diện Sáng/Tối. | Experience Qualities | Should | `PD-001` | Hiển thị tối ưu trên Desktop, Laptop và Mobile; chuyển đổi mượt mà giữa Dark mode và Light mode. | Approved |

---

## 4. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Thiết bị Cảm ứng & Phản hồi Âm thanh**: Màn hình trạm Kiosk hỗ trợ cảm ứng điện dung dọc tỷ lệ 9:16; có trang bị loa mini hoặc còi buzzer phát phản hồi âm thanh (tiếng "tít" 0.2s khi thành công và tiếng bíp cảnh báo khi từ chối).
* **Phím tắt Phần cứng Dự phòng**: Để phòng ngừa sự cố cảm ứng bám bẩn hoặc liệt điểm chạm, hệ thống Kiosk hỗ trợ ánh xạ phím cứng bàn phím `F2` để mở nhanh hộp thoại nhập mã PIN dự phòng (`UI-SYS-002`) và phím `Esc` để đóng các popup.
