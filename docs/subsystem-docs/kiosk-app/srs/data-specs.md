---
title: Kiosk Local Data Specifications
version: 2.1
status: Approved
owner: Edge Vision Lead & Data Engineer
---

# DATA SPECS — Đặc tả Dữ liệu Cục bộ Phân hệ Kiosk

Đặc tả các thực thể dữ liệu cục bộ, cấu trúc bộ nhớ RAM biên, hàng đợi ngoại tuyến SQLite, bộ đệm snapshot gallery và các quy tắc bảo vệ quyền riêng tư dữ liệu sinh trắc học trên trạm Kiosk theo chuẩn SDLC v3.0 ([sdlc-docs.md](../../../sdlc-docs.md) §7.2).

---

## 1. Local Data Entities (Thực thể Dữ liệu Cục bộ & Bộ nhớ Biên)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-KSK-001` | Quản lý thực thể Hàng đợi Ngoại tuyến (`offline_punches`) lưu trữ toàn bộ giao dịch chấm công trong SQLite WAL cục bộ khi mất mạng. | Entity | Must | `FR-SYS-006`, `NFR-SYS-006`, `SRS-008`, `ARC-001`, `PD-004` | Lưu `employee_id`, `punch_timestamp` ISO-8601, `punch_type`, `verification_method`, `confidence_score`, `kiosk_id`, `is_synced` (0/1), `retry_count`; bảo toàn dữ liệu $\text{RPO} = 0$. | Approved |
| `DATA-KSK-002` | Quản lý thực thể Ma trận Gallery RAM (`GalleryMatrix`) duy trì thường trực $N \times 512$ vector ArcFace đã chuẩn hóa L2 để so khớp Cosine 1:N dưới 2ms (nạp từ Backend hoặc snapshot cache SQLite cục bộ khi khởi động ngoại tuyến). | Entity | Must | `FR-SYS-003`, `FR-SYS-006`, `NFR-SYS-001`, `ARC-001`, `PD-002`, `INF-007` | Mảng `numpy.ndarray float32` kèm mảng `id_map` và hashmap `metadata_registry`; hỗ trợ nạp nóng Atomic Swap mà không lock Camera Stream; nạp fallback từ bộ đệm SQLite khi khởi động ngoại tuyến. | Approved |
| `DATA-KSK-003` | Quản lý thực thể Bộ đệm Cooldown Biên (`LocalCooldownCache`) lưu trữ mốc giờ quẹt gần nhất của từng nhân viên trong RAM để chặn quẹt dồn dập. | Entity | Must | `FR-SYS-005`, `ARC-001`, `FR-KSK-005`, `PD-001` | Cửa sổ cooldown 120s; từ chối và báo "Đã ghi nhận" khi quẹt lặp; luồng nền tự dọn dẹp mục sau 300s. | Approved |
| `DATA-KSK-004` | Quản lý thực thể Cấu hình Vận hành Trạm (`KioskConfig`) lưu trữ các tham số camera, URL backend, secret token và các ngưỡng AI từ biến môi trường. | Entity | Must | `SRS-006`, `FR-SYS-020`, `ARC-001`, `PD-001` | Nạp đúng `KIOSK_ID`, `BACKEND_URL`, `CAMERA_DEVICE_INDEX`, ngưỡng similarity 0.50, liveness 0.85, stability 0.60s. | Approved |
| `DATA-KSK-007` | Quản lý thực thể Bộ đệm Danh mục Khuôn mặt Cục bộ (`local_gallery_cache`) trong SQLite lưu trữ bản sao vector mã hóa AES-256-GCM từ Backend, phục vụ nạp ma trận RAM khi trạm Kiosk khởi động trong tình trạng ngoại tuyến (Cold-Start Offline). | Entity | Must | `SRS-001`, `FR-SYS-003`, `FR-SYS-006`, `ARC-001`, `ARC-007`, `PD-004` | Lưu `employee_id`, `employee_code`, `full_name`, `department`, `vector_data` (BLOB 2048 bytes ciphertext), `iv` (12 bytes), `auth_tag` (16 bytes), `updated_at`; khi mất mạng lúc khởi động, giải mã nạp thành công Gallery RAM từ snapshot này thay vì rỗng. | Approved |

---

## 2. Local Storage Rules & Privacy Protection (Quy tắc Lưu trữ & Bảo vệ Quyền riêng tư)

| ID | Statement | Category | Priority | Basis | Acceptance | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `DATA-KSK-005` | Nguyên tắc Không Lưu Ảnh Thô (Zero Raw Image Retention tại biên): Tuyệt đối không lưu khung hình camera hay ảnh crop khuôn mặt xuống đĩa cứng Kiosk. | Privacy | Must | `SRS-004`, `SRS-001`, `NFR-SYS-007`, `PD-005` | Khung hình và crop chỉ nằm trong RAM trong chu kỳ suy luận ($< 350\text{ ms}$) và được giải phóng ngay lập tức sau khi hoàn tất chu kỳ; kiểm tra hệ thống tệp không tồn tại file ảnh. | Approved |
| `DATA-KSK-006` | Quy tắc Vòng đời Hàng đợi Ngoại tuyến (Offline Queue Retention): Dọn dẹp bản ghi đã đồng bộ sau 30 ngày, bảo toàn vĩnh viễn bản ghi chưa gửi. | Retention | Must | `NFR-SYS-006`, `SRS-008`, `PD-002` | Bản ghi có `is_synced = 1` tự động xóa sau 30 ngày; bản ghi có `is_synced = 0` được bảo lưu vĩnh viễn đến khi gửi bù thành công lên máy chủ. | Approved |

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
| `STABILITY_SECONDS` | `float` | `0.60` | Thời gian giữ ổn định trong Oval trước khi nhận diện (thuộc dải 0.5 - 1.0s). |
| `NTP_SERVER` | `string` | `"pool.ntp.org"` | Máy chủ đồng bộ thời gian NTP đảm bảo tính chính xác cho `punch_timestamp`. |
| `STOMP_ENDPOINT` | `string` | `"ws://localhost:8080/ws"` | Địa chỉ kênh WebSocket STOMP (Local Dev: `ws://localhost:8080/ws`; Production bắt buộc `wss://api.fas.example.com/ws` theo `SRS-002`/`ARC-005`). |
| `LOCAL_STORAGE_KEY` | `string` | — | Khóa bí mật 256-bit nạp từ biến môi trường trạm / Windows DPAPI dùng để mã hóa AES-256-GCM bộ đệm SQLite `local_gallery_cache`. |
| `LOG_LEVEL` | `string` | `"INFO"` | Mức độ chi tiết của nhật ký vận hành trạm. |
| `LOG_PATH` | `string` | `"/var/log/fas-kiosk/kiosk.log"` | Đường dẫn lưu trữ tệp nhật ký cục bộ trên trạm. |
| `PIN_LOCKOUT_THRESHOLD`| `int` | `5` | Số lần thử PIN sai tối đa trước khi khóa tạm thời. |
| `PIN_LOCKOUT_MINUTES` | `int` | `15` | Thời gian khóa bàn phím số khi vượt ngưỡng thử sai (phút). |

### 3.5. Cấu trúc Bảng SQLite `local_gallery_cache` (`DATA-KSK-007`)

Bảng bộ đệm snapshot vector khuôn mặt phục vụ khởi động nguội ngoại tuyến (Cold-Start Offline) khi trạm Kiosk bật nguồn mà chưa có kết nối mạng. Toàn bộ vector tĩnh được mã hóa đối xứng AES-256-GCM tuân thủ nguyên tắc bảo vệ dữ liệu nhạy cảm tại nơi lưu trữ (`SRS-001`):

```sql
CREATE TABLE IF NOT EXISTS local_gallery_cache (
    employee_id INTEGER PRIMARY KEY,
    employee_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    vector_data BLOB NOT NULL,          -- Ciphertext AES-256-GCM của mảng 512 float32 (2048 bytes)
    iv BLOB NOT NULL,                   -- Initialization Vector / Nonce ngẫu nhiên (12 bytes)
    auth_tag BLOB NOT NULL,             -- Khóa xác thực tính toàn vẹn GCM Authentication Tag (16 bytes)
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gallery_emp_code ON local_gallery_cache(employee_code);
```

| Thuộc tính | Kiểu dữ liệu SQLite | Ràng buộc | Giá trị mặc định | Ý nghĩa & Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `employee_id` | `INTEGER` | PRIMARY KEY | — | Mã định danh nhân viên trong hệ thống trung tâm. |
| `employee_code` | `TEXT` | NOT NULL | — | Mã số nhân viên (Ví dụ: `'NV-1042'`). |
| `full_name` | `TEXT` | NOT NULL | — | Họ và tên đầy đủ của nhân viên. |
| `department` | `TEXT` | NOT NULL | — | Tên phòng ban / bộ phận công tác. |
| `vector_data` | `BLOB` | NOT NULL | — | Ciphertext mã hóa AES-256-GCM của 512 số thực float32 (2048 bytes). |
| `iv` | `BLOB` | NOT NULL | — | Initialization Vector / Nonce 96-bit (12 bytes) độc nhất cho mỗi bản ghi. |
| `auth_tag` | `BLOB` | NOT NULL | — | Authentication Tag 128-bit (16 bytes) chống giả mạo vector. |
| `updated_at` | `TEXT` | NOT NULL | `(datetime('now'))` | Mốc thời gian đồng bộ bản ghi vector gần nhất (UTC). |

* **Bảo mật & Giới hạn dung lượng**:
  * Tệp CSDL SQLite trạm được cô lập trong sandbox thư mục dữ liệu ứng dụng của HĐH, phân quyền chỉ đọc/ghi cho tiến trình Kiosk; dữ liệu sinh trắc tĩnh luôn được mã hóa AES-256-GCM với `LOCAL_STORAGE_KEY`.
  * Giới hạn dung lượng: Với quy mô $10,000$ nhân sự, mỗi bản ghi chiếm $2076\text{ bytes}$ dữ liệu mật mã, toàn bảng chiếm tối đa $\approx 25\text{ MB}$, hoàn toàn an toàn cho ổ đĩa trạm.
  * Đồng bộ Thêm/Sửa (`ADD`): Mỗi khi nhận danh mục từ `GET /api/v1/kiosks/{id}/gallery` hoặc bản tin STOMP `ADD`, Kiosk mã hóa và cập nhật đồng thời ma trận RAM và bảng này (`INSERT OR REPLACE`).
  * Đồng bộ Thu hồi/Xóa (`DELETE`): Khi Kiosk nhận bản tin STOMP `action: "DELETE"` cho `employeeId`, Kiosk xóa tức thời vector khỏi `GalleryMatrix` trong RAM đồng thời thực thi `DELETE FROM local_gallery_cache WHERE employee_id = :id` để bảo đảm tuân thủ triệt để quyền riêng tư và quy định thu hồi dữ liệu sinh trắc học khi nhân sự thôi việc (`M12`).

