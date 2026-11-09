# Cẩm nang Dành cho Nhân viên & Người dùng (User Guide)

> **Dự án**: Face Attendance System (FAS)  
> **Áp dụng cho**: Toàn bộ Cán bộ - Nhân viên sử dụng trạm Kiosk và Cổng Web cá nhân.

---

## 1. Điểm danh bằng Khuôn mặt tại Trạm Kiosk

1. **Khoảng cách đứng**: Đứng cách màn hình trạm từ **$0.5\text{m}$ đến $1.2\text{m}$**, đưa khuôn mặt vào giữa khung viền Oval.
2. **Nhận diện màu viền Oval**:
   * **Màu Xám `#64748B` (Chờ quét)**: Chưa phát hiện khuôn mặt hợp lệ.
   * **Màu Hổ phách `#D97706` (Căn chỉnh)**: Đang đứng quá nghiêng hoặc góc nhìn $> 15^\circ$. Hãy nhìn thẳng và giữ yên 0.5 giây.
   * **Màu Xanh lá `#159447` (Thành công)**: Nhận diện thành công, thẻ thông tin cá nhân hiển thị nổi kèm âm thanh xác nhận.
   * **Màu Đỏ `#EF4444` (Từ chối)**: Cảnh báo giả mạo hoặc khuôn mặt chưa được đăng ký trong hệ thống.
3. **Lưu ý**: Hệ thống tích hợp AI chống giả mạo `MiniFASNet`. Tuyệt đối không dùng ảnh chụp điện thoại hoặc video để điểm danh hộ.

---

## 2. Điểm danh Dự phòng bằng Mã PIN (PIN Fallback)

Sử dụng khi khuôn mặt bị che khuất (băng bó chấn thương, đeo khẩu trang đặc thù):

1. Bấm nút **"Nhập PIN"** trên màn hình cảm ứng Kiosk (hoặc phím `F2`).
2. Nhập **Mã Nhân viên** của bạn (ví dụ: `NV-1008`).
3. Nhập **Mã PIN cá nhân 6 chữ số**.
4. Bấm **"Xác nhận điểm danh"**.

> ⚠️ **Bảo mật**: Nhập sai mã PIN quá 5 lần liên tiếp sẽ bị **khóa bàn phím trong 15 phút** để chống dò mã.

---

## 3. Quy trình 3 Bước Tự Đăng ký Khuôn mặt Mới (Self-Enrollment)

Khi là nhân viên mới hoặc cần cập nhật lại dữ liệu khuôn mặt:

1. **Bước 1 - Xác thực OTP**: Nhấn **"Đăng ký mới"** (hoặc phím `F3`), nhập mã OTP 6 số do phòng Nhân sự cấp.
2. **Bước 2 - Lấy mẫu 3 góc nhìn (Multi-pose Capture)**:
   * **Góc 1**: Nhìn thẳng chính diện (Frontal, góc Yaw $0^\circ$).
   * **Góc 2**: Nghiêng nhẹ mặt sang trái theo chỉ dẫn mũi tên (Left tilt, Yaw $\approx +18^\circ$).
   * **Góc 3**: Nghiêng nhẹ mặt sang phải theo chỉ dẫn mũi tên (Right tilt, Yaw $\approx -18^\circ$).
3. **Bước 3 - Hoàn tất**: Hệ thống tự động mã hóa vector sinh trắc học bằng **AES-256-GCM** và nạp vào máy chủ trung tâm.
