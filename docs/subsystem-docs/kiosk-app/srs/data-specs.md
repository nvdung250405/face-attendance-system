---
title: Kiosk Local Data Specifications
version: 2.0
status: Approved
owner: Edge Vision Lead & Data Engineer
---

# DATA SPECS — Đặc tả Dữ liệu Cục bộ Phân hệ Kiosk

Đặc tả các thực thể dữ liệu cục bộ, cấu trúc bộ nhớ RAM biên, hàng đợi ngoại tuyến SQLite và các quy tắc bảo vệ quyền riêng tư dữ liệu sinh trắc học trên trạm Kiosk.

---

## 1. Local Data Entities (Thực thể Dữ liệu Cục bộ & Bộ nhớ Biên)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-KSK-001` | Quản lý thực thể Hàng đợi Ngoại tuyến (`offline_punches`) lưu trữ toàn bộ giao dịch chấm công trong SQLite WAL cục bộ khi mất mạng. | Entity | Must | `DATA-SYS-004`, `PD-002` | Lưu employee_id, punch_timestamp ISO-8601, punch_type, verification_method, confidence_score, kiosk_id, is_synced (0/1), retry_count; bảo toàn dữ liệu RPO = 0. | Approved |
| `DATA-KSK-002` | Quản lý thực thể Ma trận Gallery RAM (`GalleryMatrix`) duy trì thường trực $N \times 512$ vector ArcFace đã chuẩn hóa L2 để so khớp Cosine 1:N dưới 2ms. | Entity | Must | `DATA-SYS-005`, `PD-006` | Mảng numpy float32 kèm mảng id_map và hashmap metadata; hỗ trợ nạp nóng Atomic Swap mà không lock Camera Stream. | Approved |
| `DATA-KSK-003` | Quản lý thực thể Bộ đệm Cooldown Biên (`LocalCooldownCache`) lưu trữ mốc giờ quẹt gần nhất của từng nhân viên trong RAM để chặn quẹt dồn dập. | Entity | Must | `DATA-SYS-012`, `PD-001` | Cửa sổ cooldown 120s; từ chối và báo "Đã ghi nhận" khi quẹt lặp; luồng nền tự dọn dẹp mục sau 300s. | Approved |
| `DATA-KSK-004` | Quản lý thực thể Cấu hình Vận hành Trạm (`KioskConfig`) lưu trữ các tham số camera, URL backend, secret token và các ngưỡng AI từ biến môi trường. | Entity | Must | `DATA-SYS-001`, `PD-001` | Nạp đúng KIOSK_ID, BACKEND_URL, CAMERA_DEVICE_INDEX, ngưỡng similarity 0.50, liveness 0.85, stability 0.60s. | Approved |

---

## 2. Local Storage Rules & Privacy Protection (Quy tắc Lưu trữ & Bảo vệ Quyền riêng tư)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-KSK-005` | Nguyên tắc Không Lưu Ảnh Thô (Zero Raw Image Retention tại biên): Tuyệt đối không lưu khung hình camera hay ảnh crop khuôn mặt xuống đĩa cứng Kiosk. | Privacy | Must | `DATA-SYS-005`, `PD-005` | Khung hình và crop chỉ nằm trong RAM trong chu kỳ suy luận (< 350ms) và được giải phóng ngay lập tức sau khi hoàn tất. | Approved |
| `DATA-KSK-006` | Quy tắc Vòng đời Hàng đợi Ngoại tuyến (Offline Queue Retention): Dọn dẹp bản ghi đã đồng bộ sau 30 ngày, bảo toàn vĩnh viễn bản ghi chưa gửi. | Retention | Must | `DATA-SYS-014`, `PD-002` | Bản ghi có is_synced = 1 tự động xóa sau 30 ngày; bản ghi có is_synced = 0 được bảo lưu vĩnh viễn đến khi gửi thành công. | Approved |

---

## 3. Detailed Data Dictionaries (Từ điển Thuộc tính & Cấu trúc Dữ liệu Chi tiết)

### 3.1. Cấu trúc Bảng SQLite `offline_punches` (`DATA-KSK-001`)

| Thuộc tính | Kiểu dữ liệu SQLite | Ràng buộc | Giá trị mặc định | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | PRIMARY KEY AUTOINCREMENT | Tự tăng | Khóa chính định danh cục bộ của bản ghi điểm danh ngoại tuyến. |
| `employee_id` | `INTEGER` | NOT NULL | — | Mã định danh số của nhân viên trong CSDL trung tâm (`1042`). |
| `punch_timestamp` | `TEXT` | NOT NULL | — | Mốc thời gian ISO-8601 tại thời điểm quét thực tế (`2026-10-03T08:29:45.120+07:00`). |
| `punch_type` | `TEXT` | NOT NULL | `'CHECK_IN'` | Loại điểm danh: `'CHECK_IN'` hoặc `'CHECK_OUT'`. |
| `verification_method`| `TEXT` | NOT NULL | `'VERIFICATION_FACE'`| Phương thức xác thực: `'VERIFICATION_FACE'` hoặc `'VERIFICATION_PIN'`. |
| `confidence_score` | `REAL` | NULLABLE | `NULL` | Điểm số tương đồng Cosine Similarity ($0.0 - 1.0$) nếu điểm danh qua mặt. |
| `kiosk_id` | `TEXT` | NOT NULL | — | Mã định danh của trạm Kiosk thực hiện (Ví dụ: `'KIOSK-HN-01'`). |
| `is_synced` | `INTEGER` | NOT NULL | `0` | Trạng thái đồng bộ: `0` = Chưa đồng bộ, `1` = Đã đồng bộ thành công lên máy chủ. |
| `retry_count` | `INTEGER` | NOT NULL | `0` | Số lần gửi bù thất bại (dùng để tính toán độ lùi Exponential Backoff). |
| `created_at` | `TEXT` | NOT NULL | `(datetime('now'))` | Thời điểm ghi bản ghi vào CSDL cục bộ (UTC). |

### 3.2. Cấu trúc Ma trận Bộ nhớ RAM `GalleryMatrix` (`DATA-KSK-002`)

| Thành phần | Kiểu dữ liệu | Dung lượng | Mô tả & Chức năng |
| :--- | :--- | :--- | :--- |
| `feature_matrix` | `numpy.ndarray` (`float32`) | $N \times 512$ (~2 MB cho 1,000 NV) | Ma trận chứa $N$ vector đặc trưng khuôn mặt 512D chuẩn hóa $L_2 = 1.0$. |
| `id_map` | `numpy.ndarray` (`int64`) | $N$ phần tử | Mảng 1 chiều ánh xạ chỉ số dòng $i$ với `employee_id` tương ứng. |
| `metadata_registry` | `dict[int, dict]` (Hashmap) | $N$ mục | Bảng tra cứu: `{emp_id: {"code": "NV-1042", "name": "Ngô Văn Dũng", "dept": "Phòng Kỹ thuật"}}`. |
| `gallery_version` | `int` | 8 bytes | Số phiên bản của danh mục vector dùng để đối soát tính mới với Backend. |

### 3.3. Cấu trúc Bộ đệm Cooldown `LocalCooldownCache` (`DATA-KSK-003`)

| Thành phần | Kiểu cấu trúc | Quy tắc quản lý | Mô tả & Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `cooldown_dict` | `dict[int, float]` | Hashmap `{employee_id: epoch_timestamp}` | Lưu trữ mốc thời gian chấm công thành công gần nhất. |
| `cooldown_window` | Hằng số `120.0` (giây) | Ngưỡng kiểm tra | Nếu `CurrentTime - last_punch_time < 120.0`, từ chối và hiển thị "Đã ghi nhận". |
| `cleanup_interval` | `300.0` (giây) | Tác vụ dọn dẹp định kỳ | Tự động xóa các mục có `CurrentTime - last_punch_time > 300.0` để giải phóng RAM. |

### 3.4. Cấu hình Vận hành Trạm `KioskConfig` (`DATA-KSK-004`)

| Tham số | Kiểu dữ liệu | Giá trị mặc định | Ý nghĩa & Mục đích |
| :--- | :--- | :--- | :--- |
| `KIOSK_ID` | `string` | `"KIOSK-HN-01"` | Mã định danh duy nhất của trạm Kiosk. |
| `BACKEND_URL` | `string` | `"http://localhost:8080"` | Địa chỉ gốc của máy chủ trung tâm Backend. |
| `KIOSK_SECRET_TOKEN` | `string` | — | Khóa bí mật dùng để xác thực API với Backend. |
| `CAMERA_DEVICE_INDEX` | `int` | `0` | Chỉ số phần cứng của camera USB (DirectShow). |
| `CAMERA_WIDTH` / `HEIGHT`| `int` | `1280` / `720` | Độ phân giải khung hình thu nhận từ webcam. |
| `SIMILARITY_THRESHOLD`| `float` | `0.50` | Ngưỡng Cosine Similarity tối thiểu để xác nhận danh tính. |
| `LIVENESS_THRESHOLD` | `float` | `0.85` | Ngưỡng liveness MiniFASNet tối thiểu chống giả mạo. |
| `STABILITY_SECONDS` | `float` | `0.60` | Thời gian giữ ổn định trong Oval trước khi nhận diện. |
