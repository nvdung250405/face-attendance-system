# ADR-003: Mã hóa Vector Khuôn mặt ArcFace 512D bằng AES-256-GCM tại Máy chủ

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Architecture Decision Record (ADR)  
> **Primary Owner Skill:** `documentation-and-adrs`  
> **Canonical Destination Path:** `docs/adr/ADR-003-central-aes-256-gcm-crypto.md`  
> **Status:** Accepted  
> **Last updated:** 2026-11-08  

---

## 1. Context & Problem Framing
- **Decision Owners:** Lead Security Architect & Data Protection Officer (DPO)
- **Related Requirements / Features:** `FR-SYS-010`, `NFR-SYS-007`, `FEAT-ENROLL-001`, `FEAT-COMPLY-001`
- **Vấn đề kỹ thuật**: Dữ liệu sinh trắc học khuôn mặt là loại dữ liệu cá nhân nhạy cảm đặc biệt theo quy định của **Luật Bảo vệ Dữ liệu Cá nhân 2025 (Luật số 91/2025/QH15)** và **Nghị định 356/2025/NĐ-CP**. Mặc dù hệ thống không lưu ảnh thô mà chỉ lưu vector 512 chiều, các nghiên cứu gần đây cho thấy vector nhúng (embedding vectors) có khả năng bị tấn công đảo ngược (reconstruction attack) để tái tạo lại đường nét khuôn mặt nạn nhân nếu kẻ tấn công tiếp cận được CSDL dạng rõ (plaintext).
- Do đó, mọi vector sinh trắc học bắt buộc phải được mã hóa khi lưu trữ tĩnh (Encryption at Rest) bằng thuật toán mật mã chuẩn mực, có cơ chế xác thực toàn vẹn (Authenticated Encryption), và quản lý khóa độc lập.

---

## 2. Decision Drivers & Quality Attributes
- **Driver 1 (Tuân thủ Pháp lý Bắt buộc)**: Đáp ứng 100% các điều khoản của Luật Bảo vệ Dữ liệu Cá nhân 2025 về mã hóa dữ liệu sinh trắc học.
- **Driver 2 (Bảo vệ Toàn vẹn & Chống Giả mạo Dữ liệu)**: Chống lại các cuộc tấn công sửa đổi vector (tampering attack) trong CSDL.
- **Driver 3 (Hiệu năng Mã hóa/Giải mã)**: Thời gian giải mã khi nạp Gallery hoặc đồng bộ không được gây nghẽn CPU máy chủ.

---

## 3. Options Considered

### Option A — Lưu vector dạng mảng số thực thô (Plaintext Float Array / PostgreSQL pgvector)
- **Benefits:** Dễ dàng tìm kiếm trực tiếp bằng toán tử `<->` hoặc `<=>` trong PostgreSQL.
- **Costs & Risks:** Toàn bộ vector nằm dưới dạng rõ; nếu CSDL bị rò rỉ hoặc sao lưu bị đánh cắp, dữ liệu sinh trắc học của hàng nghìn nhân sự sẽ bị lộ lọt hoàn toàn. Vi phạm quy định pháp lý và có thể bị phạt tới $5\%$ doanh thu.
- **Rejected.**

### Option B — Mã hóa AES-256 chế độ CBC (Cipher Block Chaining)
- **Benefits:** Tiêu chuẩn mã hóa đối xứng phổ biến.
- **Costs & Risks:** Không có cơ chế xác thực toàn vẹn (integrity tag); dễ bị tổn thương trước các cuộc tấn công padding oracle và bit-flipping attack nếu không dùng thêm HMAC phụ.
- **Rejected.**

### Option C — Mã hóa Đối xứng AES-256 chế độ GCM (Galois/Counter Mode)
- **Benefits:**
  - AES-256-GCM là chuẩn mật mã AEAD (Authenticated Encryption with Associated Data) hàng đầu thế giới.
  - Cung cấp đồng thời cả tính bảo mật (Confidentiality) lẫn tính toàn vẹn (Integrity). Mỗi vector được mã hóa độc lập với IV (Initialization Vector) 12 bytes ngẫu nhiên và Authentication Tag 16 bytes.
  - Nếu bản ghi trong CSDL bị chỉnh sửa dù chỉ 1 bit, thuật toán giải mã sẽ lập tức ném lỗi ngoại lệ xác thực `AEADBadTagException`.
  - Hỗ trợ tăng tốc phần cứng AES-NI trên các CPU hiện đại, thông lượng giải mã đạt hàng GB/giây.
- **Costs & Risks:** Không thể sử dụng toán tử tìm kiếm khoảng cách vector trực tiếp trong PostgreSQL (phải giải mã trong bộ nhớ RAM ứng dụng). Tuy nhiên, do việc so khớp 1:N được thực thi hoàn toàn tại RAM Kiosk, Backend không cần tìm kiếm vector trong CSDL.

---

## 4. Chosen Decision
**Lựa chọn Option C**: Áp dụng mã hóa **AES-256-GCM** độc lập cho từng vector sinh trắc học ArcFace 512D ($3\times 512$ floats cho 3 tư thế). Lưu trữ dữ liệu mã hóa dưới dạng `BYTEA` trong bảng `biometric_templates` của PostgreSQL 16. Khóa mã hóa Master Key được quản lý qua biến môi trường của container/hệ điều hành.

---

## 5. Consequences & Impact
- **Positive Impacts:** Bảo vệ tuyệt đối dữ liệu sinh trắc học của nhân viên ngay cả khi bản sao lưu CSDL bị đánh cắp; thỏa mãn 100% tiêu chuẩn kiểm toán DPO theo Luật 2025.
- **Negative Impacts:** Cần quản lý vòng đời và kế hoạch xoay vòng khóa (key rotation) định kỳ.

---

## 6. Validation, Revisit Conditions & Review Gate
- **Empirical Validation Plan:** Viết unit test mã hóa và giải mã với vector ArcFace 512D; kiểm tra tính ngẫu nhiên của IV và thử cố tình sửa 1 byte mã hóa để xác nhận ngoại lệ `AEADBadTagException` được kích hoạt.
- **Revisit Triggers:** Khi lượng dữ liệu nhân viên vượt quá 100,000 người hoặc khi có yêu cầu chuyển đổi sang mô hình KMS (Key Management Service) dựa trên đám mây.

