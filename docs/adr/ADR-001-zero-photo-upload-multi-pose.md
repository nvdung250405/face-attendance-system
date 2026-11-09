# ADR-001: Chính sách Zero-Photo-Upload & Thu nhận 3 Tư thế Trực tiếp tại Kiosk

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Architecture Decision Record (ADR)  
> **Primary Owner Skill:** `documentation-and-adrs`  
> **Canonical Destination Path:** `docs/adr/ADR-001-zero-photo-upload-multi-pose.md`  
> **Status:** Accepted  
> **Last updated:** 2026-11-08  

---

## 1. Context & Problem Framing
- **Decision Owners:** Solution Architect & Lead Biometrics Engineer
- **Related Requirements / Features:** `FR-SYS-007`, `FR-SYS-009`, `NFR-SYS-004`, `FEAT-ENROLL-001`
- **Vấn đề kỹ thuật**: Trong các hệ thống điểm danh khuôn mặt truyền thống, nhân viên thường tự tải ảnh chân dung từ điện thoại lên hệ thống (Client Photo Upload). Điều này dẫn tới 3 nguy cơ lớn: gian lận bằng ảnh chỉnh sửa / ảnh chụp lại của người khác; chất lượng trích xuất AI kém do ánh sáng và góc chụp không đồng nhất; và rủi ro vi phạm Luật Bảo vệ Dữ liệu Cá nhân 2025 khi lưu trữ ảnh khuôn mặt thô chưa có cam kết minh bạch.
- Ngoài ra, việc chỉ thu nạp 1 ảnh chính diện (Single Centroid Defect) khiến Kiosk nhận diện rất kém khi người dùng tiếp cận ở góc nghiêng tự nhiên ($15^\circ - 25^\circ$).

---

## 2. Decision Drivers & Quality Attributes
- **Driver 1 (Chống Giả Mạo & Chất Lượng Cao)**: Mọi dữ liệu mẫu phải được kiểm định thực thể sống Liveness $S \ge 0.90$ và độ nét tại thời điểm chụp.
- **Driver 2 (Bảo Vệ Quyền Riêng Tư)**: Không lưu trữ bất kỳ ảnh chụp thô nào trên máy chủ hoặc đám mây; chỉ lưu trữ vector đặc trưng mã hóa.
- **Driver 3 (Độ Chính Xác Đa Góc)**: Hệ thống phải nhận diện tốt cả khi nhân viên nhìn thẳng lẫn nghiêng mặt tự nhiên.

---

## 3. Options Considered

### Option A — Tải ảnh chân dung từ Cổng Web (Client Photo Upload)
- **Benefits:** Thuận tiện cho nhân viên, không phải ra trạm Kiosk để đăng ký.
- **Costs & Risks:** Rất dễ bị tấn công giả mạo (print attack, replay attack); ảnh có độ phân giải không đồng đều; vi phạm nghiêm trọng Luật Bảo vệ Dữ liệu Cá nhân nếu lưu trữ ảnh thô trên máy chủ.
- **Rejected.**

### Option B — Chụp ảnh trực tiếp tại Kiosk và lấy trung bình vector (Centroid Averaging)
- **Benefits:** Chụp trực tiếp loại trừ ảnh giả mạo từ bên ngoài.
- **Costs & Risks:** Việc tính trung bình cộng các vector khi nhân viên nghiêng mặt làm giảm độ sắc nét của đặc trưng toán học trong không gian Euclide, gây suy giảm độ chính xác tổng thể.
- **Rejected.**

### Option C — Guided Multi-Pose Capture trực tiếp tại Kiosk (Thu nhận Đa tư thế có Định hướng)
- **Benefits:**
  - Bắt buộc ký cam kết điện tử Informed Consent trước khi cấp mã OTP 48h.
  - Camera Kiosk dẫn dắt người dùng hoàn tất tuần tự 3 tư thế chuẩn mực: Chính diện (`FRONTAL`), Nghiêng trái (`LEFT_TILT`), Nghiêng phải (`RIGHT_TILT`).
  - Góc Euler được tính toán thời gian thực trực tiếp từ 5 landmarks của YuNet kết hợp khử xoay mặt (de-rotation), độ trễ $< 0.05\text{ ms}$, không tốn tài nguyên GPU.
  - Tạo ra 3 vector ArcFace 512D độc lập ($L_2 = 1.0$), thuật toán so khớp lấy điểm lớn nhất $\max(sim_{\text{front}}, sim_{\text{left}}, sim_{\text{right}})$.
- **Costs & Risks:** Đòi hỏi nhân viên phải đến trực tiếp trạm Kiosk 1 lần đầu tiên để nạp mẫu; cần xây dựng giao diện hướng dẫn tương tác trực quan.

---

## 4. Chosen Decision
**Lựa chọn Option C**: Thiết lập chính sách **100% Zero-Photo-Upload**. Toàn bộ dữ liệu sinh trắc học bắt buộc phải được thu nhận trực tiếp qua camera Kiosk bằng quy trình Guided Multi-Pose Capture kết hợp OTP 6 số.

---

## 5. Consequences & Impact
- **Positive Impacts:** Triệt tiêu hoàn toàn gian lận ảnh giả từ máy khách; độ chính xác nhận diện góc nghiêng tăng vượt trội, đạt $\text{FNIR} \le 5.0\%$ tại $\text{FPIR} \le 0.1\%$; tuân thủ 100% Luật Bảo vệ Dữ liệu Cá nhân 2025.
- **Negative Impacts:** Cần xây dựng màn hình Oval HUD và mũi tên điều hướng trên Kiosk.
- **Security & Reliability:** Khung hình chụp sau khi trích xuất vector được hủy ngay lập tức trong bộ nhớ RAM, không ghi xuống đĩa cứng.

---

## 6. Validation, Revisit Conditions & Review Gate
- **Empirical Validation Plan:** Thử nghiệm đăng ký 1,000 nhân sự theo luồng 3 tư thế; đo lường độ lệch chuẩn vector và thời gian nạp mẫu $\le 4.0\text{ giây}$.
- **Revisit Triggers:** Khi xuất hiện công nghệ trích xuất 3D Morphable Face Model hiệu năng cao trên CPU phổ thông.

