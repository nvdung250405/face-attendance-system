# ADR-005: Xác thực Dự phòng bằng Bàn phím Ảo PIN Pad & Khóa 15 Phút Chống Brute-Force

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Architecture Decision Record (ADR)  
> **Primary Owner Skill:** `documentation-and-adrs`  
> **Canonical Destination Path:** `docs/adr/ADR-005-pin-fallback-and-lockout.md`  
> **Status:** Accepted  
> **Last updated:** 2026-11-08  

---

## 1. Context & Problem Framing
- **Decision Owners:** Solution Architect & Lead Security Engineer
- **Related Requirements / Features:** `FR-SYS-006`, `NFR-SYS-008`, `FEAT-FALLBACK-001`, `FEAT-COMPLY-001`
- **Vấn đề kỹ thuật**: Trong điều kiện vận hành thực tế tại doanh nghiệp, luôn tồn tại các tình huống ngoại lệ khi nhận diện sinh trắc học khuôn mặt không thể thực hiện được:
  1. Nhân viên gặp chấn thương vùng mặt (băng bó y tế, sưng tấy sau tai nạn).
  2. Nhân viên thực hiện quyền rút Informed Consent theo Luật Bảo vệ Dữ liệu Cá nhân 2025, yêu cầu xóa dữ liệu khuôn mặt và chuyển sang hình thức chấm công phi sinh trắc học.
  3. Sự cố tạm thời về camera tại một trạm Kiosk trong khi chờ kỹ thuật viên thay thế.
- Hệ thống bắt buộc phải có phương án xác thực dự phòng không chạm tay vào phím cứng (Touchscreen Virtual PIN Pad), nhưng đồng thời phải có cơ chế an ninh nghiêm ngặt ngăn chặn việc đồng nghiệp bấm mã hộ hoặc tấn công dò mã (brute-force attack).

---

## 2. Decision Drivers & Quality Attributes
- **Driver 1 (Tính liên tục trong nghiệp vụ)**: Đảm bảo $100\%$ nhân viên luôn có phương thức điểm danh hợp lệ ngay cả khi không dùng khuôn mặt.
- **Driver 2 (Bảo vệ Chống Tấn Công Brute-Force)**: Ngăn chặn kẻ xấu đứng tại Kiosk dò thử mã PIN của người khác.
- **Driver 3 (Bảo Mật Băm Tập Trung)**: Mã PIN không được lưu dạng rõ tại bất kỳ đâu; thẩm định an toàn tại Backend bằng thuật toán băm chậm (BCrypt).

---

## 3. Options Considered

### Option A — Dùng thẻ từ RFID phụ trợ
- **Benefits:** Quẹt nhanh, chi phí thẻ thấp.
- **Costs & Risks:** Mua thêm phần cứng đầu đọc RFID tích hợp Kiosk; nhân viên dễ làm mất thẻ hoặc cho đồng nghiệp mượn thẻ để quẹt hộ (tái phát vấn nạn buddy punching).
- **Rejected.**

### Option B — Bàn phím số vật lý gắn ngoài Kiosk
- **Benefits:** Bấm có cảm giác phím nảy.
- **Costs & Risks:** Thêm phần cứng dây nối; dễ bám bẩn dầu mỡ tại xưởng sản xuất; dễ bị gắn thiết bị nghe trộm phím (hardware keylogger).
- **Rejected.**

### Option C — Bàn phím số ảo In-Viewport PIN Pad trên màn hình cảm ứng kết hợp Khóa 15 phút
- **Benefits:**
  - Hoàn toàn bằng phần mềm, hiển thị trực tiếp trên màn hình cảm ứng dọc $1080\times 1920\text{ px}$.
  - Mã PIN gồm 6 chữ số, được băm bằng thuật toán **BCrypt (10 rounds)** lưu trong CSDL máy chủ.
  - Cơ chế bảo vệ Brute-Force nghiêm ngặt: Backend duy trì bộ đếm số lần nhập sai liên tiếp. Đúng sau **5 lần nhập sai liên tiếp**, tài khoản và mã nhân viên đó lập tức bị khóa cứng trong **15 phút**.
  - Kiosk phát âm thanh cảnh báo và hiển thị thông báo liên hệ phòng Nhân sự để hỗ trợ mở khóa.
  - Tự động đóng bàn phím sau 30 giây nếu người dùng không thao tác (Inactivity Timeout).
- **Costs & Risks:** Thời gian nhập mã PIN (5-8 giây) lâu hơn nhận diện khuôn mặt ($\le 350\text{ ms}$). Tuy nhiên đây chỉ là phương án dự phòng ($< 2\%$ tổng lượt quẹt).

---

## 4. Chosen Decision
**Lựa chọn Option C**: Xây dựng **Bàn phím số ảo PIN Pad trên màn hình cảm ứng Kiosk** làm phương án điểm danh dự phòng duy nhất. Áp dụng thẩm định băm BCrypt tập trung và chính sách khóa 15 phút sau đúng 5 lần nhập sai liên tiếp.

---

## 5. Consequences & Impact
- **Positive Impacts:** Đảm bảo quyền chấm công cho nhân viên rút Consent hoặc chấn thương mặt; loại bỏ chi phí phần cứng thẻ từ; triệt tiêu hoàn toàn nguy cơ brute-force.
- **Negative Impacts:** HR cần có quyền tra cứu nhật ký khóa và mở khóa tài khoản thủ công trong các trường hợp nhân viên quên mã.

---

## 6. Validation, Revisit Conditions & Review Gate
- **Empirical Validation Plan:** Thử nghiệm kịch bản nhập sai mã PIN 5 lần liên tiếp qua automation script; xác nhận lượt thứ 6 bị chặn ngay lập tức với mã lỗi HTTP 423 Locked và duy trì khóa trong đúng 15 phút.
- **Revisit Triggers:** Khi tỷ lệ sử dụng PIN vượt quá $10\%$ tổng lượt điểm danh (cần điều tra nguyên nhân ánh sáng hoặc chất lượng camera).

