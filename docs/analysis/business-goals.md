# Mục Tiêu Doanh Nghiệp & Bài Toán Thực Tế (Business Goals & Problem Framing)

> **Cấp độ:** Toàn cục (Global)  
> **Mã tài liệu:** `DOC-ANALYSIS-GOALS`  
> **Trạng thái:** [APPROVED]  
> **Căn cứ pháp lý cốt lõi:** **Nghị định 13/2023/NĐ-CP**, **Luật Bảo vệ dữ liệu cá nhân 2025** (Luật số 91/2025/QH15) và **Nghị định 356/2025/NĐ-CP**.

---

## 1. Bài Toán Thực Tế & Rủi Ro Cần Giải Quyết

Các doanh nghiệp và cơ sở sản xuất tại Việt Nam quy mô từ 500 đến 1,000+ nhân sự đang chịu 3 tổn thất lớn:
1. **Gian lận chấm công (Buddy Punching)**: Nhân viên quẹt thẻ hộ nhau gây thất thoát ước tính $2-4\%$ tổng quỹ lương hàng năm.
2. **Ùn tắc & Hỏng hóc mắt đọc vân tay**: Tỷ lệ lỗi nhận diện vân tay lên tới $18\%$ đối với công nhân làm việc trong môi trường bụi, ẩm hoặc dầu mỡ; thời gian quẹt vân tay kéo dài $2.5 - 4.0\text{ s/người}$ gây ùn tắc $5 - 15\text{ phút}$ mỗi ca sáng.
3. **Hiểm họa pháp lý khi cho tải ảnh chân dung tự do (Client Photo Upload)**:
   - Tấn công giả mạo (Presentation Attack): Dùng ảnh in 2D hoặc video smartphone để điểm danh gian lận.
   - Sai lệch vector ArcFace do ánh sáng và góc chụp không chuẩn.
   - Vi phạm pháp luật bảo vệ dữ liệu cá nhân nếu lưu trữ dữ liệu sinh trắc học vĩnh viễn hoặc thiếu cơ chế xóa cứng (Hard Delete) sau 20 ngày nghỉ việc theo Nghị định 356/2025/NĐ-CP.

---

## 2. Mục Tiêu Chiến Lược Của Hệ Thống FAS

- **Tốc độ Điểm danh Không Chạm $\le 350\text{ ms}$**: Xử lý nhận diện khuôn mặt tức thời tại Edge Kiosk trên CPU thông thường, giải phóng ùn tắc ca sáng.
- **Chống Giả Mạo Thụ Động (Anti-Spoofing $\ge 98\%$)**: MiniFASNet chặn đứng ảnh in 2D, màn hình điện thoại, video phát lại mà không đòi hỏi người dùng quay đầu hay chớp mắt gượng gạo.
- **100% Tuân Thủ Pháp Luật Sinh Trắc Học**:
  - Triệt để áp dụng triết lý **Zero-Photo-Upload**: Ảnh camera không bao giờ gửi qua mạng hay lưu xuống đĩa. Chỉ trích xuất vector 512D ArcFace tại Edge.
  - Mã hóa AES-256-GCM toàn bộ vector lưu trữ ở máy chủ trung tâm.
  - Tự động xóa cứng vĩnh viễn vector sau 20 ngày nhân viên thôi việc hoặc 7 ngày sau khi rút thỏa thuận Consent.
- **Tính Sẵn Sàng Ngoại Tuyến Tuyệt Đối ($\text{RPO} = 0$)**: Mất mạng LAN cục bộ vẫn điểm danh bình thường qua hàng đợi SQLite WAL tại Kiosk, tự động gửi bù khi mạng thông suốt.

---

## 3. Các Nhóm Tác Nhân & Giá Trị Mang Lại

| Tác nhân | Nỗi đau hiện tại | Giá trị FAS mang lại |
| :--- | :--- | :--- |
| **Nhân viên (1,000+ người)** | Ùn tắc quẹt vân tay; e ngại bị lộ lọt khuôn mặt | Điểm danh không chạm $\le 350\text{ ms}$; toàn quyền ký và rút Consent minh bạch |
| **Quản lý Ca & Nhân sự (HR)** | Đối soát công thủ công; không biết sĩ số thời gian thực | Live Dashboard WebSocket cập nhật sĩ số tức thời; duyệt đơn giải trình trực tuyến |
| **Cán bộ Bảo vệ Dữ liệu (DPO)** | Rủi ro bị phạt thanh tra Nghị định 13/356 | Cổng giám sát tuân thủ DPO: theo dõi mã hóa AES-256-GCM và lịch trình xóa 20 ngày |
| **Vận hành Hệ thống (IT Admin)** | Sự cố mạng làm tê liệt chấm công | Trạm Kiosk độc lập, bộ đệm SQLite WAL ngoại tuyến, bàn phím số PIN Pad ảo dự phòng |

---

## 4. Các Giả Thuyết & Chỉ Số Đo Lường (KPIs)

- **Thời gian xử lý điểm danh:** $T_{\text{punch}} \le 350\text{ ms}$ trên tập 1,000 nhân sự.
- **Tỷ lệ nhận diện sai:** $\text{FNIR} \le 5.0\%$ tại ngưỡng $\text{FPIR} \le 0.1\%$.
- **Độ chính xác chống giả mạo:** Liveness score $S \ge 0.85$, chặn giả mạo 2D $\ge 98\%$.
- **Khôi phục mất mạng:** $\text{RPO} = 0$, $100\%$ bản ghi ngoại tuyến được gửi bù nguyên vẹn.
- **Thời gian lưu mẫu nghỉ việc:** Tối đa 20 ngày theo Nghị định 356/2025/NĐ-CP.
