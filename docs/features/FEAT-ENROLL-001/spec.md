---
title: Đặc tả Tính năng Đăng ký & Kích hoạt Mẫu Khuôn mặt Đa Tư Thế (Guided Multi-Pose Face Enrollment & Onboarding)
version: 2.0
status: Approved
owner: Solution Architect & Lead Biometrics Engineer
type: spec
scope: SYS
---

# Feature Specification: Đăng ký & Kích hoạt Mẫu Khuôn mặt Đa Tư Thế (FEAT-ENROLL-001)

- **Mã tính năng**: `FEAT-ENROLL-001`
- **Phiên bản kiến trúc**: v2.0 (Nâng cấp Multi-Template Storage & Guided Multi-Pose Capture)
- **Phân loại**: User-Facing Core Biometric Feature (Liên kết 3 phân hệ: Web Portal $\leftrightarrow$ Central Backend $\leftrightarrow$ Edge Kiosk)
- **Truy vết Yêu cầu Cốt lõi**: `FR-SYS-007`, `FR-SYS-008`, `FR-SYS-009`, `FR-SYS-014`, `FR-BE-006`, `FR-KSK-007`, `UI-WEB-002`, `DATA-BE-005`
- **Cơ sở Pháp lý**: Tuân thủ **Luật Bảo vệ dữ liệu cá nhân 2025** (Luật số 91/2025/QH15) & **Nghị định 356/2025/NĐ-CP**

---

## 1. Bối cảnh & Mục tiêu Sản phẩm (Problem & Objective)

### 1.1. Vấn đề thực tế (Problem Statement)
Trong các hệ thống chấm công sinh trắc học truyền thống, nhân viên thường tải ảnh chân dung tự chụp từ điện thoại hoặc máy tính cá nhân lên hệ thống (Client Photo Uploads). Điều này dẫn đến các rủi ro kỹ thuật và pháp lý nghiêm trọng:
1. **Gian lận ảnh giả (Presentation Attack / Spoofing)**: Sử dụng ảnh đã qua chỉnh sửa hiệu ứng làm đẹp, sai tỷ lệ, hoặc ảnh chụp lại của người khác.
2. **Suy giảm chất lượng trích xuất AI**: Ảnh không đồng nhất về độ nét, ánh sáng và góc chụp khiến vector ArcFace 512D bị suy hao, làm tăng tỷ lệ từ chối sai (FRR) và nhận diện sai (FAR).
3. **Giới hạn của Mẫu đơn (Single Centroid Defect)**: Việc chỉ lưu trữ 1 vector trung bình (centroid averaging) từ ảnh chụp trực diện khiến hệ thống nhận diện kém khi nhân viên tiếp cận Kiosk ở các góc nghiêng tự nhiên ($15^\circ - 25^\circ$) trong điều kiện vận hành thực tế.
4. **Rủi ro Pháp lý (Luật 2025)**: Thu thập dữ liệu sinh trắc học khi chưa có cam kết điện tử minh bạch (*Informed Consent*) vi phạm quy định pháp luật về bảo vệ dữ liệu cá nhân tại Việt Nam.

### 1.2. Mục tiêu & Nguyên tắc Thiết kế (Objective & Principles)
- **Triết lý 100% Zero-Photo-Upload**: Hệ thống **tuyệt đối không** tiếp nhận ảnh chụp tải lên từ máy khách. Mọi dữ liệu khuôn mặt mẫu bắt buộc phải được thu nhận trực tiếp (*Live Onboarding*) qua camera trạm Kiosk.
- **Tuân thủ pháp lý 2 bước**: Bắt buộc ký cam kết *Informed Consent* trên Cổng Web cá nhân trước khi cấp mã kích hoạt Onboarding OTP 6 chữ số (thời hạn 48 giờ).
- **Thu nhận Đa tư thế có Định hướng (Guided Multi-Pose Capture)**: Thay vì chụp ảnh ngẫu nhiên hoặc tính trung bình vector (centroid averaging), Kiosk dẫn dắt nhân viên hoàn tất tương tác 3 bước thu thập 3 tư thế chuẩn mực: Chính diện (`FRONTAL`), Nghiêng trái (`LEFT_TILT`), và Nghiêng phải (`RIGHT_TILT`). Toàn bộ góc Euler (Yaw, Pitch, Roll) được ước lượng thời gian thực trực tiếp từ 5 facial landmarks của YuNet kết hợp khử xoay mặt (de-rotation), độ trễ $< 0.05\text{ ms}$, không dùng thêm mạng nơ-ron phụ.
- **Lưu trữ Đa mẫu (Multi-Template Storage) độc lập & Mã hóa AES-256-GCM**: Mỗi nhân viên sở hữu 3 vector ArcFace 512D ($L_2 = 1.0$) tương ứng với 3 tư thế, lưu trữ trong bảng `biometric_templates` với định danh `pose_type`. Từng vector được mã hóa độc lập bằng AES-256-GCM với IV 12 bytes ngẫu nhiên và Authentication Tag 16 bytes.
- **So khớp Điểm danh Tối ưu ($\text{Best Score} \le 350\text{ ms}$)**: Tại Kiosk, thuật toán điểm danh 1:N so khớp vector truy vấn hiện tại với cả 3 mẫu trong RAM Gallery qua tích vô hướng ma trận NumPy BLAS, lấy $\text{Best Score} = \max(sim_{\text{front}}, sim_{\text{left}}, sim_{\text{right}})$, đảm bảo thời gian xử lý cực nhanh $\le 350\text{ ms}$.

---

### 1.3. Phân định Kiến trúc: Thu nhận Mẫu Gốc (Enrollment) vs. Điểm danh Thường nhật (Punching)

Để đảm bảo đồng thời tính chính xác sinh trắc học tối cao và hiệu năng vận hành tức thì, hệ thống phân định rạch ròi giữa hai chu trình:

| Tiêu chí So sánh | Thu nhận Mẫu Gốc (One-Time Enrollment) | Điểm danh Thường nhật (Daily Punching) | Cơ sở Thiết kế & Ràng buộc |
| :--- | :--- | :--- | :--- |
| **Mục đích & Tần suất** | Thực hiện 1 lần duy nhất khi gia nhập hoặc nạp lại; thiết lập bộ Ground Truth mẫu mực cho nhân viên. | Thực hiện hàng ngày (1–4 lần/ngày); xác thực 1:N danh tính nhân viên nhanh chóng không chạm. | Phân định mục tiêu chất lượng vs. hiệu năng |
| **Góc mặt & Tư thế (Pose)** | Bắt buộc tuần tự 3 tư thế định hướng: `FRONTAL` (\|Yaw\| $\le 5^\circ$), `LEFT_TILT` ($10^\circ \le \text{Yaw} \le 25^\circ$), `RIGHT_TILT` ($-25^\circ \le \text{Yaw} \le -10^\circ$). | Tự do trong phạm vi chấp nhận: \|Yaw\| $\le 25^\circ$, \|Pitch\| $\le 15^\circ$, \|Roll\| $\le 15^\circ$; không bắt buộc hướng nhìn cố định. | Multi-Template cho phép nhận diện ngay cả khi nhân viên nhìn nghiêng |
| **Ngưỡng Liveness (MiniFASNet)** | $S_{\text{liveness}} \ge 0.90$ (áp dụng Safety Margin $+5\%$ so với vận hành để loại trừ triệt để mẫu giả mạo). | $S_{\text{liveness}} \ge 0.85$ (ngưỡng vận hành chuẩn để cân bằng FAR và FRR trong điều kiện ánh sáng đa dạng). | `NFR-ENROLL-002`, `INV-3` |
| **Số lượng Vector sinh ra** | 3 vector độc lập ($3 \times 512$ floats, $L_2 = 1.0$), gắn nhãn `pose_type`. | 1 vector truy vấn ($1 \times 512$ floats) từ khung hình điểm danh hiện tại. | `R2`, `R3` |
| **Chiến lược Khớp mẫu (Matching)** | Không so khớp 1:N; chỉ trích xuất và lưu trữ mẫu mới vào CSDL và RAM Gallery. | 1:N Multi-Template Matching: $\text{Best Score} = \max(sim_{\text{front}}, sim_{\text{left}}, sim_{\text{right}})$ trên ma trận RAM Gallery $(3N \times 512)$. | `R4`, `DD-KSK-003` |
| **Ngân sách Thời gian (SLA)** | Hoàn tất trong $\le 4.0\text{ giây}$ cho toàn bộ 3 bước hướng dẫn tương tác. | Cực kỳ nghiêm ngặt: $\le 350\text{ ms}$ từ khi phát hiện mặt đến khi hiển thị kết quả chấm công. | `NFR-SYS-001`, `R4` |
| **Trải nghiệm Giao diện (UI/UX)** | Hộp thoại tương tác hướng dẫn từng bước, mũi tên điều hướng, thanh đo góc Yaw trực quan. | Chấm công không chạm (Touchless), khung viền đổi màu xanh tức thì trong $< 350\text{ ms}$, không cần bấm phím. | Trải nghiệm người dùng thông suốt |
| **Bảo mật & Kiểm toán** | Bắt buộc ký Informed Consent và xác thực OTP 6 số; ghi nhật ký kiểm toán pháp lý chi tiết. | Áp dụng Cooldown 2 phút (Caffeine cache) chống trùng lặp; ghi nhận `attendance_logs`. | Luật 2025, NĐ 356/2025/NĐ-CP |

---

## 2. Phạm vi Tính năng (Scope)

### Trong phạm vi (In-Scope)
- **Web Portal (Self-Service)**:
  - Giao diện ký cam kết điện tử *Informed Consent* (khóa nút ký nếu chưa cuộn hết 100% văn bản).
  - Khởi tạo và hiển thị mã kích hoạt OTP 6 số + QR code tương ứng (thời hạn 48 giờ, tự hủy sau khi sử dụng).
  - Cung cấp chỉ dẫn người dùng về quy trình thu nạp 3 tư thế (Chính diện, Nghiêng trái, Nghiêng phải) tại trạm Kiosk.
  - Lắng nghe sự kiện kích hoạt thời gian thực qua WebSocket STOMP (`/topic/enrollment/{otp}`) với cấu trúc sự kiện mở rộng (`templateCount: 3`, `poses: [...]`) để tự động đóng modal và phát hiệu ứng hoàn tất (*Confetti*).
- **Backend Service (Central Processing)**:
  - API ký consent, lưu vết kiểm toán pháp lý (IP, User-Agent, thời gian).
  - Sinh mã OTP 6 số ngẫu nhiên, lưu mã băm an toàn (BCrypt), giới hạn tối đa 5 lần thử sai.
  - API xác thực OTP và tiếp nhận mảng 3 vector đặc trưng (`templates: [{poseType, vector512, ...}]`) kèm cơ chế tương thích ngược với vector đơn (`vector512`).
  - Đóng gói mã hóa độc lập 3 vector bằng AES-256-GCM (3 IV 12 bytes ngẫu nhiên + 3 Authentication Tags 16 bytes), lưu trữ vào bảng `biometric_templates` với `pose_type`.
  - Cập nhật Repository query an toàn (`List<BiometricTemplate>`), ngăn ngừa ngoại lệ `NonUniqueResultException` khi người dùng có nhiều mẫu.
  - Kích hoạt trạng thái nhân sự thành `ACTIVE`, cập nhật `hasBiometric = true`.
  - Phát sóng STOMP hai chiều: `/topic/enrollment/{otp}` thông báo hoàn tất về Web Portal kèm `templateCount: 3` và danh sách `poses`; `/topic/kiosk-gallery` broadcast gói đa mẫu xuống toàn bộ cụm Kiosk.
  - Vận hành cron xóa vĩnh viễn dữ liệu sinh trắc học sau 20 ngày đối với nhân viên đã thôi việc hoặc rút consent.
- **Edge Kiosk App (Desktop Hardware)**:
  - Giao diện In-Viewport `EnrollmentModal` (phím tắt `F3` hoặc phím bấm cảm ứng).
  - Bàn phím số ảo xác thực OTP 6 số.
  - Cơ chế tự ẩn modal (`opacity: 0`) nhường toàn bộ khung camera chính; khung Oval hiển thị thẻ hướng dẫn tương tác và mũi tên định hướng theo 3 bước:
    - Bước 1: `FRONTAL` (Nhìn thẳng, \|Yaw\| $\le 5.0^\circ$).
    - Bước 2: `LEFT_TILT` (Nghiêng nhẹ mặt sang TRÁI, $10.0^\circ \le \text{Yaw} \le 25.0^\circ$).
    - Bước 3: `RIGHT_TILT` (Nghiêng nhẹ mặt sang PHẢI, $-25.0^\circ \le \text{Yaw} \le -10.0^\circ$).
  - Pipeline Edge AI thu mẫu: YuNet phát hiện 5 landmarks $\rightarrow$ Ước lượng góc Euler khử xoay $\rightarrow$ Kiểm định chất lượng theo từng tư thế (Độ nét $\ge 30$, Liveness $\ge 0.90$) $\rightarrow$ ArcFace 512D trích xuất vector đơn vị ($L_2 = 1.0 \pm 10^{-4}$).
  - Quản lý bộ đệm Gallery RAM đa mẫu: Nạp đồng thời 3 vector độc lập, hỗ trợ thuật toán so khớp điểm danh 1:N $\text{Best Score} = \max(sim_{\text{front}}, sim_{\text{left}}, sim_{\text{right}})$ đạt chuẩn thời gian $\le 350\text{ ms}$.

### Ngoài phạm vi (Out-of-Scope)
- Đăng ký khuôn mặt qua ứng dụng di động cá nhân (chỉ thực hiện tại trạm Kiosk vật lý).
- Chỉnh sửa thủ công vector sinh trắc học bởi Quản trị viên (chỉ được phép yêu cầu nhân viên quét lại mẫu mới).
- Nhận dạng cảm xúc hoặc phân tích giới tính/tuổi tác.

---

## 3. Luồng Tương tác Hệ thống (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Emp as Nhân viên mới (Employee)
    participant Web as Cổng Web Portal (React 19)
    participant BE as Central Backend (Spring Boot 4)
    participant DB as PostgreSQL 16
    participant Kiosk as Trạm Kiosk Biên (PySide6)

    %% Giai đoạn 1: Ký Consent & Lấy OTP trên Web
    Note over Emp,Web: Giai đoạn 1: Ký Informed Consent & Cấp OTP
    Emp->>Web: Đăng nhập lần đầu (Trạng thái PENDING_CONSENT)
    Web->>Emp: Mở ConsentModal (Khóa nút "Ký cam kết")
    Emp->>Web: Cuộn đọc hết 100% nội dung điều khoản
    Web-->>Emp: Kích hoạt nút "Tôi đồng ý ký cam kết"
    Emp->>Web: Bấm xác nhận ký cam kết
    Web->>BE: POST /api/v1/employee/consent
    BE->>DB: Lưu consent_audit_logs (IP, Agent, Timestamp)
    BE->>BE: Sinh OTP 6 số ngẫu nhiên + băm BCrypt (Hạn 48h)
    BE->>DB: Lưu enrollment_sessions (otp_hash, expires_at, is_used=false)
    BE-->>Web: Trả mã OTP 6 số (ví dụ: "839201")
    Web->>BE: Mở kết nối STOMP: SUBSCRIBE /topic/enrollment/839201
    Web-->>Emp: Hiển thị OTP 6 số + QR code + Chỉ dẫn quy trình 3 tư thế tại Kiosk

    %% Giai đoạn 2: Quét mẫu khuôn mặt 3 tư thế (Guided Multi-Pose) tại Kiosk
    Note over Emp,Kiosk: Giai đoạn 2: Quét mẫu khuôn mặt 3 tư thế (Guided Multi-Pose) tại Kiosk
    Emp->>Kiosk: Ra trạm Kiosk, bấm "Đăng ký khuôn mặt" (hoặc nhấn F3)
    Kiosk-->>Emp: Hiển thị bàn phím ảo nhập OTP 6 chữ số
    Emp->>Kiosk: Nhập mã OTP "839201"
    Kiosk->>BE: POST /api/v1/kiosk/verify-otp {otp: "839201"}
    BE->>DB: Kiểm tra otp_hash, is_used=false, expires_at > now
    BE-->>Kiosk: 200 OK {valid: true, employeeId: 108, fullName: "Nguyễn Văn A", sessionToken: "st_xyz"}
    
    %% Bước 2.1: Chụp tư thế FRONTAL
    Kiosk->>Kiosk: Ẩn EnrollmentModal (opacity: 0), Oval chuyển màu hổ phách
    Kiosk-->>Emp: Hướng dẫn: "Bước 1/3: Giữ thẳng mặt, nhìn trực diện camera"
    Kiosk->>Kiosk: YuNet phát hiện 5 landmarks, kiểm tra |Yaw| <= 5°, Laplacian >= 30, Liveness >= 0.90
    Kiosk->>Kiosk: ArcFace trích xuất vector_frontal (512D, L2=1.0)
    Kiosk-->>Emp: Phát âm thanh bíp nhẹ, chuyển sang Bước 2/3
    
    %% Bước 2.2: Chụp tư thế LEFT_TILT
    Kiosk-->>Emp: Hướng dẫn: "Bước 2/3: Nghiêng nhẹ mặt sang TRÁI (10° - 25°)" kèm mũi tên chỉ hướng
    Kiosk->>Kiosk: YuNet phát hiện 5 landmarks, kiểm tra 10° <= Yaw <= 25°, Laplacian >= 30, Liveness >= 0.90
    Kiosk->>Kiosk: ArcFace trích xuất vector_left (512D, L2=1.0)
    Kiosk-->>Emp: Phát âm thanh bíp nhẹ, chuyển sang Bước 3/3
    
    %% Bước 2.3: Chụp tư thế RIGHT_TILT
    Kiosk-->>Emp: Hướng dẫn: "Bước 3/3: Nghiêng nhẹ mặt sang PHẢI (10° - 25°)" kèm mũi tên chỉ hướng
    Kiosk->>Kiosk: YuNet phát hiện 5 landmarks, kiểm tra -25° <= Yaw <= -10°, Laplacian >= 30, Liveness >= 0.90
    Kiosk->>Kiosk: ArcFace trích xuất vector_right (512D, L2=1.0)
    
    Kiosk->>Kiosk: Nạp nóng cả 3 vector [FRONTAL, LEFT_TILT, RIGHT_TILT] vào RAM Gallery Cache tại trạm

    %% Giai đoạn 3: Mã hóa Đa mẫu, Lưu trữ & Đồng bộ sự kiện
    Note over Kiosk,Web: Giai đoạn 3: Mã hóa Đa mẫu, Lưu trữ & Đồng bộ sự kiện
    Kiosk->>BE: POST /api/v1/kiosk/enroll-face {sessionToken, templates: [FRONTAL, LEFT_TILT, RIGHT_TILT]}
    BE->>BE: Mã hóa độc lập 3 vector bằng AES-256-GCM (3 IV 12-byte ngẫu nhiên)
    BE->>DB: Vô hiệu hóa template cũ (isActive=false) và INSERT 3 bản ghi vào biometric_templates
    BE->>DB: UPDATE users SET status='ACTIVE'; UPDATE enrollment_sessions SET is_used=true
    BE->>Kiosk: Broadcast STOMP /topic/kiosk-gallery (Cập nhật 3 vector mới cho toàn mạng Kiosk)
    BE->>Web: Broadcast STOMP /topic/enrollment/839201 {status: "ENROLLMENT_SUCCESS", templateCount: 3, poses: [...]}
    BE-->>Kiosk: 200 OK {status: "ACTIVATED", templateCount: 3}
    
    Kiosk-->>Emp: Hiển thị thông báo hoàn tất: "Đăng ký thành công 3 góc khuôn mặt!"
    Web-->>Emp: Nhận frame STOMP: Tự đóng Modal OTP, phát hiệu ứng Confetti, cập nhật trang chủ ACTIVE
```

---

## 4. User Stories & Tiêu chí Nghiệm thu (Acceptance Criteria - BDD)

### US-ENROLL-001 — Ký Cam kết Informed Consent trên Cổng Web
- **Actor**: Nhân viên mới tuyển dụng (vai trò `EMPLOYEE`, trạng thái `PENDING_CONSENT`).
- **Story**: Là một nhân viên mới, tôi muốn đọc và ký điện tử cam kết sử dụng dữ liệu sinh trắc học trên Cổng Web, để tuân thủ pháp luật và được cấp mã kích hoạt ra trạm Kiosk.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-ENROLL-001 (Happy Path — Ký cam kết thành công)**:
  - **Given**: Nhân viên đăng nhập Web Portal lần đầu với trạng thái `PENDING_CONSENT`.
  - **When**: Nhân viên mở modal cam kết, cuộn chuột chạm đáy 100% nội dung điều khoản pháp lý và bấm nút *"Tôi đã đọc và đồng ý"*.
  - **Then**: Hệ thống gửi `POST /api/v1/employee/consent`, ghi log kiểm toán vào `consent_audit_logs`, sinh mã OTP 6 số ngẫu nhiên có hiệu lực 48 giờ và hiển thị mã to rõ kèm QR code trên màn hình.
- **AC-ENROLL-002 (Edge Case — Chặn ký khi chưa đọc hết văn bản)**:
  - **Given**: Modal điều khoản cam kết đang mở trên màn hình.
  - **When**: Nhân viên mới cuộn nội dung được dưới 100% chiều cao văn bản.
  - **Then**: Nút *"Tôi đã đọc và đồng ý"* duy trì trạng thái vô hiệu hóa (`disabled = true`) kèm chỉ báo dòng nhắc nhở: *"Vui lòng cuộn đọc đến hết nội dung văn bản để kích hoạt nút ký"*.

---

### US-ENROLL-002 — Xác thực OTP Kích hoạt tại Trạm Kiosk
- **Actor**: Nhân viên đang cầm mã OTP 6 số tại trạm Kiosk.
- **Story**: Là một nhân viên, tôi muốn nhập mã OTP 6 số trên màn hình cảm ứng Kiosk, để xác minh danh tính trước khi bước vào quy trình quét mặt.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-ENROLL-003 (Happy Path — OTP hợp lệ)**:
  - **Given**: Nhân viên mở `EnrollmentModal` trên Kiosk (qua nút chạm hoặc phím `F3`).
  - **When**: Nhân viên nhập đủ 6 chữ số OTP hợp lệ và nhấn *"Xác nhận OTP"*.
  - **Then**: Kiosk gọi API `POST /api/v1/kiosk/verify-otp`, nhận phản hồi `200 OK` chứa `sessionToken` cùng họ tên nhân viên, hiển thị thông điệp chào mừng và chuyển sang bước chụp ảnh.
- **AC-ENROLL-004 (Error Case — OTP sai hoặc hết hạn)**:
  - **Given**: Mã OTP đã quá 48 giờ kể từ lúc sinh, hoặc nhân viên nhập sai mã số.
  - **When**: Nhân viên nhấn *"Xác nhận OTP"*.
  - **Then**: Kiosk rung đỏ ô nhập liệu, phát âm thanh cảnh báo lỗi và hiển thị thông báo chi tiết: *"Mã OTP không chính xác hoặc đã hết hiệu lực. Vui lòng kiểm tra lại trên Cổng Web"*.
- **AC-ENROLL-005 (Security Guard — Chống Brute-Force OTP)**:
  - **Given**: Một mã OTP cụ thể bị nhập sai liên tiếp.
  - **When**: Số lần nhập sai đạt ngưỡng 5 lần.
  - **Then**: Backend tự động vô hiệu hóa mã OTP này trong CSDL; Kiosk khóa chức năng nhập của phiên hiện tại trong 15 phút và yêu cầu nhân viên sinh lại mã mới trên Web Portal.

---

### US-ENROLL-003 — Hướng Dẫn Tương Tác 3 Tư Thế (Guided Multi-Pose) & Trích Xuất AI tại Kiosk
- **Actor**: Nhân viên đứng trước camera trạm Kiosk sau khi xác thực OTP thành công.
- **Story**: Là một nhân viên, tôi muốn camera Kiosk tương tác hướng dẫn trực quan để thu nhận tuần tự 3 tư thế khuôn mặt (Chính diện, Nghiêng trái, Nghiêng phải) đạt chuẩn chất lượng cao, giúp hệ thống nhận diện tôi nhanh chóng và chính xác ở mọi góc nhìn khi điểm danh hàng ngày.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-ENROLL-006 (Happy Path — Thu nạp 3 tư thế Guided Multi-Pose chuẩn mực)**:
  - **Given**: Kiosk đang ở chế độ chụp nạp mẫu, khung Oval màu hổ phách. Nhân viên đứng trong cự ly $0.8\text{ m} \pm 0.2\text{ m}$.
  - **When**: Kiosk thực thi máy trạng thái 3 bước (State Machine) với các tiêu chuẩn kiểm định chặt chẽ:
    1. **Bước 1 (`FRONTAL`)**: Nhân viên nhìn thẳng vào camera. Kiểm định: $|\text{Yaw}| \le 5.0^\circ$, $|\text{Pitch}| \le 15.0^\circ$, $|\text{Roll}| \le 15.0^\circ$, Laplacian $\ge 30.0$, MiniFASNet $S_{\text{liveness}} \ge 0.90$. Kiosk thu nhận và trích xuất vector ArcFace 512D ($L_2 = 1.0$).
    2. **Bước 2 (`LEFT_TILT`)**: Kiosk hiển thị câu nhắc *"Nghiêng nhẹ mặt sang TRÁI (10° - 25°)"* kèm mũi tên chỉ hướng sang trái. Kiểm định: $10.0^\circ \le \text{Yaw} \le 25.0^\circ$, $|\text{Pitch}| \le 15.0^\circ$, $|\text{Roll}| \le 15.0^\circ$, Laplacian $\ge 30.0$, MiniFASNet $S_{\text{liveness}} \ge 0.90$. Kiosk thu nhận và trích xuất vector ArcFace 512D ($L_2 = 1.0$).
    3. **Bước 3 (`RIGHT_TILT`)**: Kiosk hiển thị câu nhắc *"Nghiêng nhẹ mặt sang PHẢI (10° - 25°)"* kèm mũi tên chỉ hướng sang phải. Kiểm định: $-25.0^\circ \le \text{Yaw} \le -10.0^\circ$, $|\text{Pitch}| \le 15.0^\circ$, $|\text{Roll}| \le 15.0^\circ$, Laplacian $\ge 30.0$, MiniFASNet $S_{\text{liveness}} \ge 0.90$. Kiosk thu nhận và trích xuất vector ArcFace 512D ($L_2 = 1.0$).
    4. Toàn bộ góc Euler (Yaw, Pitch, Roll) được ước lượng thời gian thực trực tiếp từ 5 facial landmarks của YuNet kết hợp xoay phẳng tọa độ theo $-\text{Roll}$ với độ trễ $< 0.05\text{ ms}$.
  - **Then**: Kiosk phát âm thanh "Bíp" xác nhận sau mỗi bước đạt chuẩn, cập nhật thanh tiến trình tuần tự $1/3 \rightarrow 2/3 \rightarrow 3/3$, và hoàn tất thu thập đủ 3 vector độc lập trong tổng thời gian $\le 4.0\text{ giây}$.
- **AC-ENROLL-007 (Edge Case — Sai góc xoay, ảnh bị mờ hoặc phát hiện giả mạo)**:
  - **Given**: Nhân viên nghiêng mặt chưa đủ góc (ví dụ: Yaw chỉ đạt $6^\circ$ ở bước `LEFT_TILT`), cử động làm nhòe hình (Laplacian $< 30$) hoặc đưa màn hình điện thoại (MiniFASNet $< 0.90$).
  - **When**: AI Engine đánh giá frame hình ảnh.
  - **Then**: Kiosk từ chối lưu frame, khung Oval chuyển màu cảnh báo và cập nhật chỉ dẫn thời gian thực: *"Vui lòng nghiêng mặt thêm sang trái"* hoặc *"Hình ảnh bị nhòe, vui lòng đứng yên"*.

---

### US-ENROLL-004 — Mã Hóa Đa Mẫu AES-256-GCM, Lưu CSDL & Kích Hoạt Tài Khoản
- **Actor**: Hệ thống phân tán (Kiosk & Backend Service).
- **Story**: Là kiến trúc sư hệ thống, tôi muốn 3 vector đặc trưng được lưu trữ độc lập theo nhãn tư thế, nạp nóng vào bộ nhớ RAM Kiosk và mã hóa AES-256-GCM trước khi lưu vào bảng `biometric_templates`, đảm bảo an toàn tuyệt đối dữ liệu sinh trắc học theo Luật 2025.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-ENROLL-008 (Happy Path — Lưu trữ đa mẫu và kích hoạt thành công)**:
  - **Given**: Kiosk đã thu thập đủ 3 vector 512D hợp lệ từ 3 tư thế `FRONTAL`, `LEFT_TILT`, `RIGHT_TILT`.
  - **When**: Kiosk nạp nóng đồng thời cả 3 vector vào RAM Gallery Cache tại trạm và gửi `POST /api/v1/kiosk/enroll-face` với danh sách `templates`.
  - **Then**:
    1. Backend mã hóa độc lập từng vector bằng AES-256-GCM với IV 12-byte ngẫu nhiên và Auth Tag 16-byte riêng biệt.
    2. Vô hiệu hóa các mẫu cũ của người dùng (`is_active = false`), lưu 3 bản ghi mới vào bảng `biometric_templates` với giá trị `pose_type` tương ứng.
    3. Cập nhật nhân viên sang trạng thái `ACTIVE`, kích hoạt cờ `hasBiometric = true`.
    4. Bắn tin nhắn STOMP tới `/topic/enrollment/{otp}` mang thông tin `{status: "ENROLLMENT_SUCCESS", templateCount: 3, poses: ["FRONTAL", "LEFT_TILT", "RIGHT_TILT"]}` để Web Portal tự đóng modal và chúc mừng nhân viên.
    5. Bắn tin nhắn STOMP tới `/topic/kiosk-gallery` để toàn bộ các trạm Kiosk trong cụm tự động cập nhật danh mục 3 vector mới vào RAM trong $\le 2\text{ giây}$.
- **AC-ENROLL-009 (Điểm danh Hàng ngày với Multi-Template Matching)**:
  - **Given**: Nhân viên đã hoàn tất đăng ký 3 tư thế và có 3 vector trong Gallery RAM Kiosk.
  - **When**: Nhân viên bước vào vùng quét camera Kiosk để điểm danh hàng ngày ở bất kỳ tư thế tự nhiên nào trong phạm vi chấp nhận ($|\text{Yaw}| \le 25^\circ, |\text{Pitch}| \le 15^\circ$, $S_{\text{liveness}} \ge 0.85$).
  - **Then**: Kiosk tính toán tích vô hướng ma trận NumPy BLAS và chọn điểm tương đồng cao nhất $\text{Best Score} = \max(sim_{\text{front}}, sim_{\text{left}}, sim_{\text{right}})$. Nếu $\text{Best Score} \ge 0.65$, hệ thống ghi nhận điểm danh thành công với tổng thời gian xử lý toàn trình $\le 350\text{ ms}$.

---

## 5. Hợp đồng Giao tiếp & Dữ liệu (API & Data Contracts)

### 5.1. REST API Endpoints

#### 1. Yêu cầu cấp OTP Onboarding trên Web
- **Endpoint**: `POST /api/v1/employee/consent`
- **Quyền truy cập**: Bearer JWT (Role `EMPLOYEE`, trạng thái `PENDING_CONSENT`)
- **Request Body**:
  ```json
  {
    "consentVersion": "2025.1-LAW91",
    "agreed": true
  }
  ```
- **Response Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "otp": "839201",
    "expiresAt": "2026-11-01T21:30:00Z",
    "expiresInSeconds": 172800,
    "stompTopic": "/topic/enrollment/839201"
  }
  ```

#### 2. Kiosk xác thực mã OTP
- **Endpoint**: `POST /api/v1/kiosk/verify-otp`
- **Header bắt buộc**: `X-Kiosk-Id: KSK-HN-01`, `X-Kiosk-Secret: <secret_hash>`
- **Request Body**:
  ```json
  {
    "otp": "839201"
  }
  ```
- **Response Success (`200 OK`)**:
  ```json
  {
    "valid": true,
    "employeeId": 108,
    "employeeCode": "EMP-00108",
    "fullName": "Nguyễn Văn A",
    "sessionToken": "st_9f83a2c4e1b7"
  }
  ```

#### 3. Kiosk gửi vector sinh trắc học đa mẫu (Multi-Template)
- **Endpoint**: `POST /api/v1/kiosk/enroll-face`
- **Header bắt buộc**: `X-Kiosk-Id: KSK-HN-01`, `X-Kiosk-Secret: <secret_hash>`
- **Request Body (Hỗ trợ Đa mẫu & Tương thích ngược)**:
  ```json
  {
    "otp": "839201",
    "sessionToken": "st_9f83a2c4e1b7",
    "kioskId": "KSK-HN-01",
    "templates": [
      {
        "poseType": "FRONTAL",
        "vector512": [0.0312, -0.0451, "... 512 số float32, L2=1.0 ...", 0.0891],
        "yaw": 0.8,
        "pitch": -1.5,
        "laplacian": 42.1,
        "livenessScore": 0.94
      },
      {
        "poseType": "LEFT_TILT",
        "vector512": [-0.0123, 0.0543, "... 512 số float32, L2=1.0 ...", 0.0345],
        "yaw": 16.5,
        "pitch": -1.0,
        "laplacian": 38.5,
        "livenessScore": 0.92
      },
      {
        "poseType": "RIGHT_TILT",
        "vector512": [0.0456, -0.0234, "... 512 số float32, L2=1.0 ...", -0.0128],
        "yaw": -18.2,
        "pitch": 0.5,
        "laplacian": 45.0,
        "livenessScore": 0.95
      }
    ],
    "vector512": [0.0312, -0.0451, "... (tùy chọn: fallback vector đơn cho trạm Kiosk phiên bản cũ) ..."]
  }
  ```
- **Response Success (`200 OK`)**:
  ```json
  {
    "status": "ACTIVATED",
    "employeeCode": "EMP-00108",
    "templateCount": 3,
    "poses": ["FRONTAL", "LEFT_TILT", "RIGHT_TILT"],
    "activatedAt": "2026-10-30T21:35:12Z"
  }
  ```
- **Quy tắc Kiểm thực Dữ liệu (Validation Rules)**:
  1. **Trường hợp gửi mảng `templates` (Multi-Template Mode)**:
     - Mảng `templates` bắt buộc có đúng 3 phần tử (`size == 3`).
     - Tập hợp `poseType` trong `templates` phải chứa đúng 3 giá trị phân biệt: `['FRONTAL', 'LEFT_TILT', 'RIGHT_TILT']`.
     - Nếu thiếu tư thế, thừa tư thế, trùng lặp tư thế hoặc xuất hiện tư thế không hợp lệ: Controller lập tức từ chối và trả về HTTP `400 Bad Request` với mã lỗi `INVALID_TEMPLATE_SET`.
     - Mỗi phần tử trong `templates` bắt buộc có `vector512` gồm đúng 512 số float hữu hạn đạt chuẩn $L_2\text{-Norm} = 1.0 \pm 10^{-4}$. Nếu sai kích thước hoặc không chuẩn hóa: trả về HTTP `400 Bad Request` với mã lỗi `INVALID_VECTOR_DIMENSION`.
  2. **Trường hợp tương thích ngược (Legacy Single-Vector Mode)**:
     - Nếu `templates` không được gửi hoặc rỗng, trường `vector512` bắt buộc phải có đúng 512 chiều và được lưu với nhãn `FRONTAL`.
  3. **Trường hợp vi phạm tổng thể**:
     - Nếu cả `templates` và `vector512` đều thiếu hoặc rỗng: trả về HTTP `400 Bad Request` với mã lỗi `VALIDATION_FAILED`.
- **Response Error (`400 Bad Request` - RFC 7807)**:
  ```json
  {
    "type": "https://fas.company.com/errors/invalid-template-set",
    "title": "Bộ mẫu đa tư thế không hợp lệ hoặc thiếu tư thế chuẩn",
    "status": 400,
    "detail": "Bộ mẫu sinh trắc học bắt buộc phải gồm đúng 3 tư thế phân biệt: FRONTAL, LEFT_TILT, RIGHT_TILT",
    "instance": "/api/v1/kiosk/enroll-face",
    "code": "INVALID_TEMPLATE_SET",
    "timestamp": "2026-11-01T08:15:00Z"
  }
  ```

---

### 5.2. WebSocket STOMP Event Contract

#### 1. Kênh thông báo Cổng Web: `/topic/enrollment/{otp}`
- **Payload (`EnrollmentSuccessMessage`)**:
  ```json
  {
    "status": "ENROLLMENT_SUCCESS",
    "otp": "839201",
    "employeeId": 108,
    "employeeCode": "EMP-00108",
    "fullName": "Nguyễn Văn A",
    "templateCount": 3,
    "poses": ["FRONTAL", "LEFT_TILT", "RIGHT_TILT"],
    "activatedAt": "2026-10-30T21:35:12Z",
    "message": "Đăng ký khuôn mặt 3 góc chuẩn thành công! Tài khoản của bạn đã được kích hoạt."
  }
  ```

#### 2. Kênh đồng bộ Cụm Kiosk: `/topic/kiosk-gallery`
- **Payload (`GalleryUpdateEvent`)**:
  ```json
  {
    "action": "ADD_VECTOR",
    "employeeId": 108,
    "employeeCode": "EMP-00108",
    "fullName": "Nguyễn Văn A",
    "vector512": [0.0312, -0.0451, "... vector FRONTAL phục vụ Kiosk cũ ..."],
    "templates": [
      {"poseType": "FRONTAL", "vector512": [...]},
      {"poseType": "LEFT_TILT", "vector512": [...]},
      {"poseType": "RIGHT_TILT", "vector512": [...]}
    ],
    "reason": "ENROLLMENT_COMPLETED",
    "updatedAt": "2026-10-30T21:35:12Z"
  }
  ```

---

### 5.3. CSDL Lưu trữ & Mã hóa Sinh trắc học

```sql
-- 1. Quản lý phiên OTP đăng ký
CREATE TABLE IF NOT EXISTS enrollment_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,
    consent_version VARCHAR(50) NOT NULL,
    consent_signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempt_count INT DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_enrollment_lookup ON enrollment_sessions(otp_hash, is_used, expires_at);

-- 2. Bảng mẫu sinh trắc học đa mẫu (Multi-Template) mã hóa AES-256-GCM
-- Lưu ý kiến trúc (tuân thủ V3 dòng 14-18, V4 dòng 9-11 & issue #56): KHÔNG dùng CHECK constraint
-- trong kịch bản migration. H2 (CSDL dùng cho profile kiểm thử) không đánh giá được CHECK constraint
-- do Flyway tạo (biểu thức ràng buộc giữ tham chiếu session DDL đã đóng), gây lỗi "The database has been closed".
-- Tập giá trị hợp lệ được ràng buộc chặt chẽ bởi enum Java `PoseType`, JPA `@Enumerated(EnumType.STRING)`
-- và tầng xác thực Jakarta Validation của REST API (@Pattern).
CREATE TABLE IF NOT EXISTS biometric_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pose_type VARCHAR(20) NOT NULL DEFAULT 'FRONTAL',
    encrypted_vector BYTEA NOT NULL,                        -- Bản mã AES-256-GCM (2064 bytes: 2048 bytes float32[512] + 16 bytes Auth Tag)
    encryption_iv BYTEA NOT NULL,                           -- Khởi tạo IV ngẫu nhiên 12 bytes độc lập cho từng bản ghi
    algorithm VARCHAR(32) NOT NULL DEFAULT 'ARCFACE_512D',
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_biometric_user_pose_active ON biometric_templates(user_id, pose_type, is_active);
CREATE INDEX IF NOT EXISTS idx_biometric_user_active ON biometric_templates(user_id, is_active);

-- 3. Flyway Migration Script (V8__add_pose_type_to_biometric_templates.sql)
-- Lưu ý: Không thêm CHECK constraint để bảo toàn tính tương thích với H2 in-memory test database (issue #56).
ALTER TABLE biometric_templates 
    ADD COLUMN IF NOT EXISTS pose_type VARCHAR(20) NOT NULL DEFAULT 'FRONTAL';

CREATE INDEX IF NOT EXISTS idx_biometric_user_pose_active 
    ON biometric_templates(user_id, pose_type, is_active);
```

---

## 6. Yêu cầu Phi Chức năng & Ràng buộc Chất lượng (NFRs)

| Tiêu chuẩn NFR | Thuộc tính | Ngưỡng cam kết (SLA / Threshold) | Phương pháp kiểm chứng |
| :--- | :--- | :--- | :--- |
| **NFR-ENROLL-001** | **Tốc độ chụp Guided Multi-Pose** | Hoàn tất tuần tự 3 tư thế kiểm chuẩn (`FRONTAL`, `LEFT_TILT`, `RIGHT_TILT`) + trích xuất vector trong $\le 4.0\text{ giây}$ tương tác trên CPU Intel Core i3 gen 10 / tương đương. | Đo đạc thời gian execution qua log `kiosk-app` benchmark. |
| **NFR-ENROLL-002** | **Ngưỡng Liveness Mẫu gốc** | Điểm số Liveness của cả 3 tư thế bắt buộc đạt $\ge 0.90$ ($+5\%$ Safety Margin so với ngưỡng vận hành $0.85$). | Unit test với bộ kiểm thử 2D Spoofing (giấy in, màn hình iPad, mặt nạ). |
| **NFR-ENROLL-003** | **Cấu trúc Vector Đa mẫu** | Lưu trữ độc lập 3 vector ArcFace 512 chiều $L_2\text{ Norm} = 1.0 \pm 10^{-4}$, mã hóa độc lập 3 lần với 3 IV 12 bytes ngẫu nhiên. | Kiểm tra schema validation tại Backend Controller và kiểm tra tính toàn vẹn CSDL. |
| **NFR-ENROLL-004** | **Đồng bộ STOMP Đa phân hệ** | Thời gian từ lúc Kiosk gửi vector thành công đến khi Web Portal nhận frame STOMP nổ Confetti $\le 500\text{ ms}$; thời gian đồng bộ sang các Kiosk khác $\le 2.0\text{ giây}$. | Kiểm thử tích hợp WebSocket STOMP end-to-end. |
| **NFR-ENROLL-005** | **Tiêu hủy theo Luật 2025** | Khi nhân viên thôi việc (`TERMINATED`) hoặc rút Consent, toàn bộ các vector mẫu tự động bị xóa vĩnh viễn sau 20 ngày theo tác vụ ngầm. | Kiểm thử tính năng `@Scheduled` `BiometricCleanupService` trên Backend. |
| **NFR-ENROLL-006** | **Độ trễ Điểm danh Multi-Template** | So khớp 1:N với Gallery RAM đa mẫu $(3N \times 512)$ đạt $\text{Best Score} = \max(sim_{\text{front}}, sim_{\text{left}}, sim_{\text{right}})$; tổng thời gian nhận diện điểm danh $\le 350\text{ ms}$ (phép nhân ma trận $\le 0.35\text{ ms}$ cho 1,000 nhân sự). | Benchmark ma trận NumPy BLAS trên bộ dữ liệu giả lập 3,000 vector. |

---

## 7. Kế hoạch Kiểm định (Verification Plan)

Trước khi nghiệm thu tính năng, phải thực thi và vượt qua 4 chặng kiểm thử chất lượng theo AGENTS.md:

1. **Edge Kiosk Quality Gates (`app/kiosk-app`)**:
   ```powershell
   cd app/kiosk-app
   pytest tests/test_face_detector.py tests/test_quality_checker.py tests/test_gallery_matcher.py -v
   ruff check .
   ```
   *Kiểm tra: Ước lượng góc Euler từ 5 landmarks, kiểm định chất lượng theo PoseType (FRONTAL, LEFT_TILT, RIGHT_TILT), thuật toán so khớp 1:N Best Score $\le 350\text{ ms}$, linter 0 lỗi.*
2. **Central Backend Quality Gates (`app/backend-service`)**:
   ```powershell
   cd app/backend-service
   ./mvnw test -Dtest=FlywayMigrationTest,BiometricCryptoServiceTest,EnrollmentServiceTest,KioskAttendanceControllerTest
   ```
   *Kiểm tra: Migration V8 bổ sung `pose_type`, mã hóa độc lập 3 vector AES-256-GCM, xử lý DTO đa mẫu, query `List<BiometricTemplate>` an toàn.*
3. **Web Portal Quality Gates (`app/web-portal`)**:
   ```powershell
   cd app/web-portal
   npm test
   npm run lint
   npm run build
   ```
   *Kiểm tra: UI ký cam kết, hiển thị OTP và chỉ dẫn 3 bước, bắt sự kiện STOMP enriched payload, linter 0 lỗi, build production thành công.*
4. **Docs Governance (`tools/docs-check`)**:
   ```powershell
   python tools/docs-check/check_docs.py
   ```
   *Đảm bảo 100% định dạng bảng Markdown chuẩn xác, front matter hợp lệ và không có liên kết đứt gãy.*

---

## 8. Kế hoạch Triển khai & Phân rã Công việc (SDLC Implementation Plan)

Theo quy trình kỹ thuật `/using-sdlc-skills` và kế hoạch tổng thể `PROJECT.md`, tính năng `FEAT-ENROLL-001` được phân rã thành 5 mốc chuyển giao tuần tự (Milestones M1–M5) với 15 nhiệm vụ kỹ thuật cụ thể:

### 8.1. Ma trận Phân rã Cột mốc & Nhiệm vụ

| Cột mốc | Phân hệ | Nhiệm vụ kỹ thuật | File mục tiêu | Tiêu chí hoàn thành |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Docs & Spec | Cập nhật `spec.md` với ngưỡng Guided Multi-Pose, schema đa mẫu, phân định Enrollment vs Punching | `docs/features/FEAT-ENROLL-001/spec.md` | `python tools/docs-check/check_docs.py` đạt 0 lỗi |
| **M2** | Central Backend | Tạo Flyway migration `V8__add_pose_type_to_biometric_templates.sql` | `db/migration/V8__add_pose_type_to_biometric_templates.sql` | Cột `pose_type VARCHAR(20) NOT NULL DEFAULT 'FRONTAL'` kèm index |
| **M2** | Central Backend | Cập nhật JPA entity `BiometricTemplate` và sửa repo query tránh lỗi `NonUniqueResultException` | `BiometricTemplate.java`, `BiometricTemplateRepository.java` | Repo trả về `List<BiometricTemplate>`, tất cả test JPA pass |
| **M2** | Central Backend | Nâng cấp `EnrollmentService` và `KioskEnrollFaceRequest` lưu trữ 3 vector độc lập mã hóa AES-256-GCM | `EnrollmentService.java`, `KioskAttendanceController.java` | Lưu 3 bản ghi cho 3 tư thế, duy trì tương thích fallback vector đơn |
| **M2** | Central Backend | Nâng cấp API Gallery và STOMP broadcaster phát sóng đa mẫu | `StompEventBroadcaster.java`, `GalleryResponse.java` | `/topic/enrollment/{otp}` phát `templateCount: 3`, `/topic/kiosk-gallery` phát `templates` |
| **M3** | Edge Kiosk | Cài đặt ước lượng góc Euler thời gian thực (Yaw, Pitch) từ 5 landmarks YuNet | `src/core/vision/face_detector.py` | Ước lượng Yaw/Pitch chính xác trong dung sai $\pm 3^\circ$, độ trễ $< 0.05\text{ ms}$ |
| **M3** | Edge Kiosk | Xây dựng enum `PoseType` và nâng cấp `quality_checker.py` theo ngưỡng từng tư thế | `src/core/vision/quality_checker.py` | Kiểm tra độc lập FRONTAL, LEFT_TILT, RIGHT_TILT (Liveness $\ge 0.90$, Sharpness $\ge 30$) |
| **M3** | Edge Kiosk | Xây dựng máy trạng thái Guided Multi-Pose và cập nhật giao diện QML | `enrollment_controller.py`, `EnrollmentDialog.qml` | UI dẫn dắt 3 bước trực quan, tự động chuyển bước khi đạt góc |
| **M4** | Edge Kiosk | Nâng cấp `GalleryCacheManager` hỗ trợ Multi-Template và so khớp $\text{Best Score} \le 350\text{ ms}$ | `src/core/vision/gallery_matcher.py` | Tích vô hướng ma trận $(3N \times 512)$ lấy Best Score, benchmark $\le 0.35\text{ ms}$ |
| **M4** | Edge Kiosk | Đồng bộ đa mẫu qua STOMP và benchmark độ trễ nhận diện thực tế | `stomp_worker.py`, `gallery_matcher.py` | Đạt benchmark $\le 110\text{ ms}$ toàn trình ($p95 \ll 350\text{ ms}$) |
| **M5** | Web Portal | Căn chỉnh chỉ dẫn người dùng trong `ConsentModal.tsx` và kiểu dữ liệu `types/consent.ts` | `ConsentModal.tsx`, `consent.ts`, `consentFixtures.ts` | Hiển thị hướng dẫn 3 bước, nhận STOMP payload đa mẫu mượt mà |
| **M5** | Web Portal | Cập nhật bộ test fixtures và Vitest suites cho Consent Modal | `consentFixtures.ts`, `src/components/consent/__tests__/ConsentModal.test.tsx` | Toàn bộ unit tests Web Portal vượt qua 100% |
| **M5** | Toàn hệ thống | Quản trị tài liệu SDLC và xác thực tính toàn vẹn 2 tầng | `docs/features/FEAT-ENROLL-001/spec.md` | `python tools/docs-check/check_docs.py` đạt 0 lỗi |
| **M5** | Toàn hệ thống | Thực thi bộ kiểm thử tự động toàn diện và kiểm định chất lượng cuối cùng | Toàn bộ 3 phân hệ | `pytest`, `ruff`, `./mvnw test`, `npm test`, `npm run lint`, `npm run build` 100% GREEN |

---

### 8.2. Chi tiết 15 Nhiệm vụ Kỹ thuật Theo Cột mốc

#### Giai đoạn 1: Central Backend Multi-Template Storage & Backward-Compatible APIs (M2)

##### Task 1: Flyway Migration V8 & JPA Entity Mapping
- **Mô tả**: Tạo file Flyway migration `V8__add_pose_type_to_biometric_templates.sql` bổ sung cột `pose_type VARCHAR(20) NOT NULL DEFAULT 'FRONTAL'` và chỉ mục phức hợp `idx_biometric_user_pose_active` (tuân thủ quy ước kiến trúc V3/V4 và issue #56: **tuyệt đối không dùng CHECK constraint trong migration** để đảm bảo tương thích H2 test database). Tạo enum Java `PoseType` (`FRONTAL`, `LEFT_TILT`, `RIGHT_TILT`) và cập nhật entity JPA `BiometricTemplate` ánh xạ trường `poseType` với `@Enumerated(EnumType.STRING)`.
- **Tiêu chí nghiệm thu**:
  - Migration file `V8__add_pose_type_to_biometric_templates.sql` áp dụng thành công trên cả H2 (profile test) và PostgreSQL mà không gây lỗi `The database has been closed`.
  - Cột `pose_type` có kiểu `VARCHAR(20) NOT NULL DEFAULT 'FRONTAL'`, không có ràng buộc CHECK trong SQL; tính toàn vẹn miền giá trị được bảo đảm ở tầng ứng dụng qua enum `PoseType` và Jakarta Validation `@Pattern`.
  - Chỉ mục `idx_biometric_user_pose_active` được tạo trên `(user_id, pose_type, is_active)`.
  - Enum `PoseType` được tạo tại `com.fas.data.enums.PoseType` với 3 giá trị: `FRONTAL`, `LEFT_TILT`, `RIGHT_TILT`.
  - `BiometricTemplate.java` có trường `poseType` ánh xạ JPA `@Enumerated(EnumType.STRING)` với giá trị mặc định `PoseType.FRONTAL`.
- **Lệnh kiểm chứng**: `cd app/backend-service && ./mvnw test -Dtest=FlywayMigrationTest,EntityMappingAndConstraintTest`
- **Phụ thuộc**: Không có
- **Tập tin liên quan**:
  - `app/backend-service/src/main/resources/db/migration/V8__add_pose_type_to_biometric_templates.sql`
  - `app/backend-service/src/main/java/com/fas/data/enums/PoseType.java`
  - `app/backend-service/src/main/java/com/fas/data/entity/BiometricTemplate.java`

##### Task 2: Cập nhật Repository Invariant & An toàn Truy vấn Đa Mẫu
- **Mô tả**: Sửa đổi `BiometricTemplateRepository` để phương thức tìm kiếm template đang hoạt động trả về `List<BiometricTemplate>` thay vì `Optional<BiometricTemplate>`, loại bỏ triệt để nguy cơ phát sinh ngoại lệ `IncorrectResultSizeDataAccessException` (`NonUniqueResultException`). Khai báo phương thức JPQL bulk update `@Modifying @Query("UPDATE BiometricTemplate bt SET bt.isActive = false WHERE bt.user.id = :userId AND bt.isActive = true")` để vô hiệu hóa an toàn, nguyên tử toàn bộ mẫu sinh trắc học cũ của nhân viên khi tái đăng ký. Cập nhật các service phụ thuộc (`AuthService`, `AccountManagementService`, `AuditQueryService`).
- **Tiêu chí nghiệm thu**:
  - `findByUserIdAndIsActiveTrue(Long userId)` trả về danh sách `List<BiometricTemplate>`.
  - Bổ sung `existsByUserIdAndIsActiveTrue(Long userId)` phục vụ kiểm tra boolean nhanh cho cờ `hasBiometric`.
  - Bổ sung `findFirstByUserIdAndIsActiveTrue(Long userId)` cho các tác vụ lấy mẫu đại diện.
  - Bổ sung `@Modifying @Query("UPDATE BiometricTemplate bt SET bt.isActive = false WHERE bt.user.id = :userId AND bt.isActive = true") int deactivateAllByUserId(@Param("userId") Long userId);` thực thi vô hiệu hóa nguyên tử 1 câu lệnh duy nhất.
  - Các service gọi repo được cập nhật và vượt qua toàn bộ unit test.
- **Lệnh kiểm chứng**: `cd app/backend-service && ./mvnw test -Dtest=RepositoryIntegrationTest,AuthServiceTest,AccountManagementServiceTest,AuditQueryServiceTest`
- **Phụ thuộc**: Task 1
- **Tập tin liên quan**:
  - `app/backend-service/src/main/java/com/fas/data/repository/BiometricTemplateRepository.java`
  - `app/backend-service/src/main/java/com/fas/service/AuthService.java`
  - `app/backend-service/src/main/java/com/fas/service/AccountManagementService.java`
  - `app/backend-service/src/main/java/com/fas/service/AuditQueryService.java`

##### Task 3: Backend REST DTOs & Multi-Template Enrollment Endpoint
- **Mô tả**: Xây dựng `PoseTemplateDto` và cập nhật `KioskEnrollFaceRequest` tiếp nhận mảng 3 tư thế khuôn mặt, duy trì trường `vector512` đơn để tương thích ngược. Nâng cấp `EnrollmentService.enrollFace` thực hiện kiểm thực nghiêm ngặt bộ mẫu đa tư thế (trả về HTTP 400 `INVALID_TEMPLATE_SET` nếu không đủ 3 tư thế chuẩn hoặc trùng lặp), mã hóa AES-256-GCM độc lập 3 lần và gọi `deactivateAllByUserId` vô hiệu hóa nguyên tử mẫu cũ trước khi lưu 3 bản ghi mới vào CSDL.
- **Tiêu chí nghiệm thu**:
  - `PoseTemplateDto` xác thực `poseType` qua Jakarta Validation `@Pattern(regexp = "FRONTAL|LEFT_TILT|RIGHT_TILT")` và kiểm tra vector 512D chuẩn $L_2 = 1.0 \pm 10^{-4}$.
  - Bổ sung mã lỗi `INVALID_TEMPLATE_SET` vào `ApiErrorCode.java` (HTTP 400 Bad Request, RFC 7807 problem details).
  - Kiểm thực mảng `templates`: từ chối với `INVALID_TEMPLATE_SET` nếu `templates.size() != 3`, trùng lặp tư thế, hoặc thiếu bất kỳ tư thế nào trong bộ ba chuẩn (`FRONTAL`, `LEFT_TILT`, `RIGHT_TILT`).
  - Khi nhận đủ 3 templates hợp lệ, gọi `biometricTemplateRepository.deactivateAllByUserId(user.getId())` để vô hiệu hóa nguyên tử toàn bộ mẫu cũ, sau đó lưu 3 bản ghi mới với 3 IV ngẫu nhiên độc lập.
  - Khi nhận vector đơn lẻ (Kiosk cũ, `templates == null`), lưu 1 bản ghi với `poseType = 'FRONTAL'`.
- **Lệnh kiểm chứng**: `cd app/backend-service && ./mvnw test -Dtest=EnrollmentServiceTest,KioskAttendanceControllerTest`
- **Phụ thuộc**: Task 1, Task 2
- **Tập tin liên quan**:
  - `app/backend-service/src/main/java/com/fas/api/dto/request/PoseTemplateDto.java`
  - `app/backend-service/src/main/java/com/fas/api/dto/request/KioskEnrollFaceRequest.java`
  - `app/backend-service/src/main/java/com/fas/api/error/ApiErrorCode.java`
  - `app/backend-service/src/main/java/com/fas/service/EnrollmentService.java`

##### Task 4: Multi-Template Gallery REST & STOMP Distribution
- **Mô tả**: Cập nhật DTO `GalleryItem` bổ sung `poseType`. Nâng cấp endpoint `GET /api/v1/kiosk/gallery` trả về toàn bộ template đang hoạt động kèm nhãn tư thế. Làm giàu sự kiện STOMP `/topic/enrollment/{otp}` (`templateCount: 3`, `poses`) và `/topic/kiosk-gallery`.
- **Tiêu chí nghiệm thu**:
  - `GalleryItem` chứa thuộc tính `poseType`.
  - `GET /api/v1/kiosk/gallery` kết xuất đầy đủ các template đa tư thế của nhân viên.
  - Sự kiện `/topic/enrollment/{otp}` phát `templateCount: 3` và danh sách tư thế.
  - Sự kiện `/topic/kiosk-gallery` phát gói đa mẫu xuống cụm Kiosk.
- **Lệnh kiểm chứng**: `cd app/backend-service && ./mvnw test -Dtest=KioskAttendanceControllerTest,StompEventBroadcasterTest`
- **Phụ thuộc**: Task 3
- **Tập tin liên quan**:
  - `app/backend-service/src/main/java/com/fas/api/dto/response/GalleryItem.java`
  - `app/backend-service/src/main/java/com/fas/api/dto/event/GalleryUpdateEvent.java`
  - `app/backend-service/src/main/java/com/fas/api/websocket/StompEventBroadcaster.java`

##### Điểm kiểm soát 1 (Checkpoint 1: Backend Foundation Gate)
- `./mvnw clean test` chạy thành công 100% không có lỗi.
- Flyway migration `V8` thực thi hoàn hảo trên CSDL kiểm thử.
- Tính năng đăng ký đa mẫu và fallback tương thích ngược đã kiểm thử thành công.

---

#### Giai đoạn 2: Edge Kiosk Guided Multi-Pose Capture & Interactive UI (M3)

##### Task 5: Ước Lượng Góc Euler Khử Xoay Thời Gian Thực từ 5 Landmarks YuNet
- **Mô tả**: Tối ưu hóa hàm `_estimate_euler_angles(landmarks)` trong `face_detector.py`. Tính toán góc Roll, thực hiện phép biến đổi xoay phẳng tọa độ 5 điểm quanh tâm mắt theo góc $-\text{Roll}$ để loại bỏ hiện tượng méo góc chiếu, tính toán thuần túy Yaw và Pitch với độ trễ $< 0.05\text{ ms}$.
- **Tiêu chí nghiệm thu**:
  - Tọa độ 5 landmark được de-rotate trước khi tính tỷ lệ khoảng cách.
  - Ước lượng Yaw chuẩn xác trên dữ liệu giả lập: nhìn thẳng ($0^\circ \pm 3^\circ$), nghiêng trái ($+18^\circ \pm 3^\circ$), nghiêng phải ($-18^\circ \pm 3^\circ$).
  - Thời gian xử lý trên CPU đạt chuẩn $< 0.1\text{ ms}$, không dùng thêm mô hình nặng.
  - Vượt qua unit test trong `test_face_detector.py`.
- **Lệnh kiểm chứng**: `cd app/kiosk-app && pytest tests/test_face_detector.py -v`
- **Phụ thuộc**: Không có
- **Tập tin liên quan**:
  - `app/kiosk-app/src/core/vision/face_detector.py`
  - `app/kiosk-app/tests/test_face_detector.py`

##### Task 6: Pose-Aware Quality Checker & Tiêu Chuẩn Từng Tư Thế
- **Mô tả**: Xây dựng enum `PoseType` (`FRONTAL`, `LEFT_TILT`, `RIGHT_TILT`) và tích hợp vào `EnrollmentQualityChecker`. Định nghĩa ngưỡng góc xoay riêng biệt cho từng tư thế kết hợp kiểm tra độ nét Laplacian $\ge 30.0$ và liveness $\ge 0.90$.
- **Tiêu chí nghiệm thu**:
  - Enum `PoseType` định nghĩa đầy đủ 3 tư thế chuẩn.
  - Phương thức `evaluate` kiểm tra đúng dải góc Yaw tương ứng của từng tư thế.
  - Thiết lập ngưỡng liveness mẫu gốc tối thiểu $0.90$.
  - Trả về thông điệp hướng dẫn tiếng Việt rõ ràng, thân thiện cho từng tình huống sai lệch góc hoặc mờ hình.
- **Lệnh kiểm chứng**: `cd app/kiosk-app && pytest tests/test_quality_checker.py -v`
- **Phụ thuộc**: Task 5
- **Tập tin liên quan**:
  - `app/kiosk-app/src/core/vision/quality_checker.py`
  - `app/kiosk-app/tests/test_quality_checker.py`

##### Task 7: Máy Trạng Thái Guided Multi-Pose trong EnrollmentController
- **Mô tả**: Nâng cấp `EnrollmentController` quản lý luồng chụp 3 tư thế tuần tự (`FRONTAL` $\to$ `LEFT_TILT` $\to$ `RIGHT_TILT`). Thu nhận đúng 1 vector ArcFace 512D ($L_2 = 1.0$) cho mỗi tư thế và đóng gói payload gửi lên REST API `POST /api/v1/kiosk/enroll-face`.
- **Tiêu chí nghiệm thu**:
  - Máy trạng thái chuyển bước tuần tự từ Bước 1 $\to$ Bước 2 $\to$ Bước 3 khi frame đạt chuẩn.
  - Thu nhận đúng 3 vector đơn vị độc lập, không dùng trung bình cộng (centroid).
  - Hàm `_submit_enrollment` gửi JSON chứa mảng `templates` và trường tương thích ngược `vector512`.
  - Controller expose các thuộc tính QML phục vụ hiển thị tiến trình.
- **Lệnh kiểm chứng**: `cd app/kiosk-app && pytest tests/test_enrollment_controller.py -v`
- **Phụ thuộc**: Task 6, Task 3
- **Tập tin liên quan**:
  - `app/kiosk-app/src/presentation/controllers/enrollment_controller.py`
  - `app/kiosk-app/tests/test_enrollment_controller.py`

##### Task 8: Giao Diện Hướng Dẫn Trực Quan QML
- **Mô tả**: Nâng cấp giao diện Tab 2 trong `EnrollmentDialog.qml` với thanh chỉ báo tiến trình 3 bước, mũi tên đồ họa chỉ hướng quay mặt (trái/phải), và thanh đo góc Yaw trực quan.
- **Tiêu chí nghiệm thu**:
  - Hiển thị rõ ràng bước hiện tại (1: Nhìn thẳng, 2: Nghiêng trái, 3: Nghiêng phải).
  - Mũi tên định hướng xuất hiện sinh động hướng dẫn người dùng nghiêng đầu.
  - Thanh thước đo góc hiển thị vị trí xoay mặt thời gian thực với vùng hợp lệ màu xanh.
  - Hiển thị văn bản hướng dẫn tiếng Việt tương phản cao, dễ nhìn.
- **Lệnh kiểm chứng**: `cd app/kiosk-app && ruff check .`
- **Phụ thuộc**: Task 7
- **Tập tin liên quan**:
  - `app/kiosk-app/resources/qml/dialogs/EnrollmentDialog.qml`
  - `app/kiosk-app/resources/qml/components/PortraitCameraPanel.qml`

##### Điểm kiểm soát 2 (Checkpoint 2: Kiosk Guided Multi-Pose Capture Gate)
- `cd app/kiosk-app && pytest tests/` vượt qua 100% kiểm thử.
- `ruff check .` báo cáo 0 cảnh báo hoặc lỗi cú pháp.
- Máy trạng thái 3 tư thế và giao diện QML hoạt động chuẩn xác với frame giả lập.

---

#### Giai đoạn 3: Edge Kiosk Multi-Template Attendance Matching & Latency (M4)

##### Task 9: Bộ Nhớ Đệm RAM Đa Mẫu trong GalleryCacheManager
- **Mô tả**: Nâng cấp `GalleryCacheManager` trong `gallery_matcher.py` để lưu trữ nhiều template cho mỗi nhân viên, gắn kèm nhãn `pose_type`.
- **Tiêu chí nghiệm thu**:
  - Ma trận vector `_embeddings_matrix` có kích thước $(M, 512)$ float32, mảng ánh xạ `_id_map` kích thước $(M,)$, mảng nhãn `_pose_map` kích thước $(M,)$.
  - Hàm `add_or_update(employee_id, vector, pose_type)` cập nhật hoặc nối thêm mẫu tương ứng.
  - Hàm `remove(employee_id)` xóa toàn bộ tất cả template thuộc về nhân viên đó.
  - Hàm `load_gallery` nạp đầy đủ danh sách đa mẫu từ backend.
- **Lệnh kiểm chứng**: `cd app/kiosk-app && pytest tests/test_gallery_matcher.py -v`
- **Phụ thuộc**: Task 4
- **Tập tin liên quan**:
  - `app/kiosk-app/src/core/vision/gallery_matcher.py`
  - `app/kiosk-app/tests/test_gallery_matcher.py`

##### Task 10: So Khớp Điểm Danh 1:N Best Score & Đồng Bộ STOMP
- **Mô tả**: Hiện thực thuật toán đánh giá $\text{Best Score} = \max(sim_{\text{front}}, sim_{\text{left}}, sim_{\text{right}})$ cho từng nhân viên qua một phép nhân ma trận vô hướng BLAS duy nhất. Cập nhật `stomp_worker.py` nạp nóng các sự kiện STOMP đa mẫu vào RAM. Duy trì tính tương thích ngược 100% cho chữ ký hàm `match()` và căn chỉnh cấu hình ngưỡng điểm danh trong `settings.py`.
- **Tiêu chí nghiệm thu**:
  - Hàm `match(query_vector, threshold=None)` duy trì kiểu trả về 2-tuple `tuple[int | None, float]` là `(matched_emp_id, best_score)`, tương thích hoàn toàn với `kiosk_view_model.py:440` và các test hiện có.
  - Bổ sung phương thức `match_with_pose(query_vector, threshold=None) -> tuple[int | None, float, str | None]` và thuộc tính `last_matched_pose` phục vụ kiểm chuẩn chi tiết tư thế khớp trong unit tests.
  - Phép nhân ma trận BLAS `scores = np.dot(_embeddings_matrix, q)` tìm ra chỉ số có điểm cao nhất qua `best_idx = np.argmax(scores)`.
  - Nhận diện chính xác nhân viên khi đứng nghiêng góc trùng với template nghiêng đã nạp.
  - Cập nhật giá trị cấu hình mặc định trong `app/kiosk-app/src/config/settings.py`: `cosine_similarity_threshold: float = float(os.getenv("COSINE_SIMILARITY_THRESHOLD", "0.65"))` đồng bộ với `AC-ENROLL-009` và khống chế FAR $< 0.001\%$ khi Gallery RAM mở rộng lên 3,000 vectors.
  - `stomp_worker.py` xử lý mượt mà payload `ADD_VECTOR` và `DELETE_VECTOR` đa mẫu.
- **Lệnh kiểm chứng**: `cd app/kiosk-app && pytest tests/test_gallery_matcher.py tests/test_stomp_worker.py -v`
- **Phụ thuộc**: Task 9
- **Tập tin liên quan**:
  - `app/kiosk-app/src/core/vision/gallery_matcher.py`
  - `app/kiosk-app/src/network/stomp_worker.py`
  - `app/kiosk-app/src/config/settings.py`
  - `app/kiosk-app/tests/test_gallery_matcher.py`

##### Task 11: Benchmark Độ Trễ So Khớp Dưới Tải 3,000 Vectors (<= 350ms SLA)
- **Mô tả**: Xây dựng kịch bản kiểm thử hiệu năng trong `test_gallery_matcher.py` với 3,000 vector (mô phỏng 1,000 nhân viên $\times$ 3 tư thế). Đo đạc thời gian so khớp và chứng minh toàn bộ độ trễ chấm công $\le 350\text{ ms}$.
- **Tiêu chí nghiệm thu**:
  - Khởi tạo thành công 3,000 vector ArcFace ngẫu nhiên đạt chuẩn $L_2 = 1.0$.
  - Thực thi 1,000 truy vấn điểm danh mô phỏng: thời gian nhân ma trận BLAS trung bình $\le 1.0\text{ ms}$ (thực tế $< 0.35\text{ ms}$).
  - Tổng thời gian nhận diện toàn trình của Kiosk được chứng minh $\le 110\text{ ms}$ (thỏa mãn ngân sách $\le 350\text{ ms}$).
- **Lệnh kiểm chứng**: `cd app/kiosk-app && pytest tests/test_gallery_matcher.py -k "benchmark" -v`
- **Phụ thuộc**: Task 10
- **Tập tin liên quan**:
  - `app/kiosk-app/tests/test_gallery_matcher.py`

##### Điểm kiểm soát 3 (Checkpoint 3: Kiosk Attendance & Latency Gate)
- Bộ test `app/kiosk-app` vượt qua 100%.
- Kết quả benchmark chứng minh 3,000 vector được xử lý dưới $1.0\text{ ms}$, thỏa mãn tiêu chuẩn $\le 350\text{ ms}$ của hệ thống.

---

#### Giai đoạn 4: Web Portal Alignment & Cross-Subsystem Verification (M5)

##### Task 12: Căn Chỉnh Hướng Dẫn Người Dùng và Kiểu Dữ Liệu Web Portal
- **Mô tả**: Cập nhật file `types/consent.ts` bổ sung các trường tùy chọn `templateCount` và `poses` vào `EnrollmentSuccessMessage`. Cập nhật nội dung Bước 3 trong `ConsentModal.tsx` để hướng dẫn nhân viên về quy trình chụp 3 tư thế tại trạm Kiosk.
- **Tiêu chí nghiệm thu**:
  - `types/consent.ts` định nghĩa kiểu dữ liệu đồng bộ với STOMP payload từ backend.
  - `ConsentModal.tsx` hiển thị chỉ dẫn 3 bước rõ ràng: Nhìn thẳng, Nghiêng trái, Nghiêng phải khi tới Kiosk.
  - Không gây hồi quy lên luồng ký cam kết và sinh OTP hiện tại.
- **Lệnh kiểm chứng**:
  - `cd app/web-portal && npm run lint`
  - `cd app/web-portal && npm run build`
- **Phụ thuộc**: Task 4
- **Tập tin liên quan**:
  - `app/web-portal/src/types/consent.ts`
  - `app/web-portal/src/components/consent/ConsentModal.tsx`

##### Task 13: Cập Nhật Dữ Liệu Kiểm Thử và Vitest Suite Web Portal
- **Mô tả**: Cập nhật test fixtures trong `consentFixtures.ts` và kiểm tra toàn diện bộ test Vitest của `ConsentModal`.
- **Tiêu chí nghiệm thu**:
  - `mockEnrollmentCompletedEvent` được bổ sung `templateCount: 3` và danh sách `poses`.
  - Toàn bộ các test cases trong `ConsentModal.test.tsx` vượt qua 100%.
- **Lệnh kiểm chứng**: `cd app/web-portal && npm test`
- **Phụ thuộc**: Task 12
- **Tập tin liên quan**:
  - `app/web-portal/src/mocks/fixtures/consentFixtures.ts`
  - `app/web-portal/src/components/consent/__tests__/ConsentModal.test.tsx`

##### Task 14: Quản Trị và Kiểm Định Tính Toàn Vẹn Tài Liệu SDLC
- **Mô tả**: Chạy công cụ kiểm định tài liệu hệ thống để đảm bảo file đặc tả `spec.md` tuân thủ nghiêm ngặt các quy tắc bảng Markdown, tiêu đề front-matter, và liên kết truy vết.
- **Tiêu chí nghiệm thu**:
  - File `docs/features/FEAT-ENROLL-001/spec.md` được cập nhật toàn diện theo phiên bản 2.0.
  - `python tools/docs-check/check_docs.py` chạy thành công với 0 lỗi ngoài allowlist.
- **Lệnh kiểm chứng**: `python tools/docs-check/check_docs.py`
- **Phụ thuộc**: Cập nhật spec M1
- **Tập tin liên quan**:
  - `docs/features/FEAT-ENROLL-001/spec.md`

##### Task 15: Thực Thi Toàn Bộ Quality Gates Xuyên Phân Hệ
- **Mô tả**: Thực thi toàn bộ các lệnh kiểm tra chất lượng được quy định tại `AGENTS.md § 3.1` trên cả 3 phân hệ (Edge Kiosk, Central Backend, Web Portal) và công cụ Docs Governance.
- **Tiêu chí nghiệm thu**:
  - `cd app/kiosk-app && pytest tests/` đạt 100% passed.
  - `cd app/kiosk-app && ruff check .` đạt 0 lỗi.
  - `cd app/backend-service && ./mvnw test` đạt 100% passed.
  - `cd app/web-portal && npm test` đạt 100% passed.
  - `cd app/web-portal && npm run lint` đạt 0 lỗi.
  - `cd app/web-portal && npm run build` tạo bundle production thành công.
  - `python tools/docs-check/check_docs.py` đạt 0 lỗi.
- **Lệnh kiểm chứng**: Thực thi tuần tự toàn bộ 7 lệnh chất lượng trên terminal.
- **Phụ thuộc**: Tasks 1 đến 14
- **Tập tin liên quan**: Toàn bộ dự án

##### Điểm kiểm soát 4 (Checkpoint 4: Definition of Done Final Sign-Off)
- Hoàn thành đầy đủ 15 nhiệm vụ kỹ thuật.
- 100% các cổng kiểm định chất lượng (Quality Gates) hiển thị trạng thái GREEN.
- Không để lại tệp rác, tệp tạm hoặc code thử nghiệm mồ côi.

---

### 8.3. Ma trận Rủi ro & Chiến lược Giảm thiểu (Risk Matrix)

| Rủi ro kỹ thuật | Mức độ tác động | Xác suất | Chiến lược giảm thiểu (Mitigation Strategy) |
| :--- | :--- | :--- | :--- |
| **Lỗi H2 CHECK constraint (issue #56)** khi chạy test backend | Cao | Cao | Tuân thủ bất biến kiến trúc tại V3/V4: Tuyệt đối không dùng SQL CHECK constraint trong migration Flyway; ràng buộc miền giá trị hoàn toàn qua Java Enum `PoseType`, JPA `@Enumerated(EnumType.STRING)` và Jakarta Validation `@Pattern` ở REST DTO. |
| **Ngoại lệ JPA NonUniqueResultException & Xung đột Vô hiệu hóa Mẫu cũ** khi tái đăng ký | Cao | Cao | Task 2 thay thế `Optional` bằng `List<BiometricTemplate>`, cung cấp `existsByUserIdAndIsActiveTrue`, và áp dụng JPQL `@Modifying @Query` `deactivateAllByUserId` để vô hiệu hóa nguyên tử toàn bộ template cũ trong 1 transaction, tránh lỗi NonUniqueResultException và race condition. |
| **Trạm Kiosk phiên bản cũ bị từ chối** khi gửi vector đơn | Cao | Thấp | Task 3 & 4 duy trì tính tương thích ngược: `KioskEnrollFaceRequest` tiếp tục chấp nhận trường tùy chọn `vector512` và tự động lưu với nhãn `FRONTAL`. |
| **Nhiễu rung góc Euler (Jitter)** khi khuôn mặt cử động | Trung bình | Trung bình | Task 5 áp dụng phép xoay phẳng de-rotation tọa độ 5 điểm quanh tâm mắt theo $-\text{Roll}$ trước khi tính Yaw/Pitch; thiết lập dung sai góc hợp lý ($10^\circ - 25^\circ$). |
| **Độ trễ điểm danh vượt 350ms** khi số lượng vector tăng gấp 3 | Cao | Thấp | Phép nhân ma trận vector NumPy BLAS $(3000, 512) \times (512,)$ chỉ mất $< 0.35\text{ ms}$. Task 11 xây dựng bài test đo đạc thực tế để khẳng định độ trễ $\le 1.0\text{ ms}$. |
| **Lỗi giải tuần tự hóa STOMP trên Web Portal** | Trung bình | Thấp | File `types/consent.ts` khai báo các trường mới `templateCount` và `poses` dưới dạng tùy chọn (`?`), các client cũ tự động bỏ qua trường lạ an toàn. |
| **Lỗi kiểm định tài liệu hệ thống (`check_docs.py`)** | Trung bình | Thấp | Task 14 kiểm tra định dạng bảng, escape ký tự `\|`, chuẩn hóa tiêu đề và mã định danh trước khi nghiệm thu. |

