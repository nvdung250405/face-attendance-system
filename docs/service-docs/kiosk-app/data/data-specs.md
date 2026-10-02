# DATA SPECS — Đặc tả Dữ liệu Cục bộ Phân hệ Kiosk

> **Mã tài liệu:** `SPEC-DAT-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả chi tiết các thực thể dữ liệu cục bộ (`DATA-KSK-`), cấu trúc ma trận bộ nhớ RAM, bộ đệm Cooldown biên và cấu hình máy trạm Kiosk Desktop.

---

## 1. Local Data Entities (Thực thể Dữ liệu Cục bộ & Bộ nhớ Biên)

### 1.1. Thực thể Hàng đợi Điểm danh Ngoại tuyến (`DATA-KSK-001` — `offline_punches`)
Lưu trữ giao dịch chấm công trong CSDL SQLite cục bộ khi trạm Kiosk mất mạng Internet hoặc máy chủ Backend không phản hồi.

| Tên Thuộc tính | Kiểu Dữ liệu SQLite | Ràng buộc | Giá trị Mặc định | Mô tả & Ý nghĩa Nghiệp vụ |
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

### 1.2. Thực thể Ma trận Danh mục Vector Trong Bộ nhớ RAM (`DATA-KSK-002` — `GalleryMatrix`)
Cấu trúc dữ liệu số học tối ưu hóa bằng thư viện NumPy, duy trì thường trực trong bộ nhớ RAM của ứng dụng Kiosk để phục vụ so khớp Cosine 1:N tức thời dưới 2 mili-giây.

| Thành phần Cấu trúc | Kiểu Dữ liệu / Cấu trúc | Kích thước / Dung lượng | Mô tả & Chức năng |
| :--- | :--- | :--- | :--- |
| `feature_matrix` ($\mathbf{M}$) | `numpy.ndarray` (`float32`) | $N \times 512$ ($\sim 2\text{ MB}$ cho $1,000$ nhân sự) | Ma trận chứa $N$ vector đặc trưng khuôn mặt 512 chiều đã được chuẩn hóa độ dài ($L_2 = 1.0$). |
| `id_map` | `numpy.ndarray` (`int64`) | $N$ phần tử | Mảng 1 chiều ánh xạ chỉ số dòng $i$ trong ma trận $\mathbf{M}$ với `employee_id` tương ứng. |
| `metadata_registry` | `dict[int, dict]` (Hashmap) | $N$ mục | Bảng tra cứu thông tin nhanh: `{emp_id: {"code": "NV-1042", "name": "Ngô Văn Dũng", "dept": "Phòng Kỹ thuật"}}`. |
| `gallery_version` | `int` | 8 bytes | Số phiên bản của danh mục vector, dùng để đối soát tính mới với Backend. |

### 1.3. Thực thể Bộ đệm Cooldown Biên (`DATA-KSK-003` — `LocalCooldownCache`)
Bộ đệm trong RAM ngăn chặn việc quẹt thẻ trùng lặp dồn dập tại trạm Kiosk trong khoảng thời gian ngắn.

| Thành phần Cấu trúc | Kiểu Cấu trúc | Quy tắc Quản lý | Mô tả & Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `cooldown_dict` | `dict[int, float]` | Hashmap `{employee_id: epoch_timestamp}` | Lưu trữ mốc thời gian (giây) của lần chấm công thành công gần nhất của nhân sự. |
| `cooldown_window` | Hằng số `120.0` (giây) | Ngưỡng kiểm tra | Nếu `CurrentTime - last_punch_time < 120.0`, trạm từ chối quẹt và phát thông báo "Đã ghi nhận". |
| `cleanup_interval` | `300.0` (giây) | Tác vụ dọn dẹp định kỳ | Luồng nền tự động xóa các mục có `CurrentTime - last_punch_time > 300.0` để giải phóng RAM. |

### 1.4. Thực thể Cấu hình Vận hành Trạm (`DATA-KSK-004` — `KioskConfig`)
Bộ tham số cấu hình cục bộ nạp từ file `.env` hoặc file cấu hình khi ứng dụng Kiosk khởi chạy.

| Tên Tham số | Kiểu Dữ liệu | Giá trị Mặc định | Ý nghĩa & Mục đích Cấu hình |
| :--- | :--- | :--- | :--- |
| `KIOSK_ID` | `string` | `"KIOSK-HN-01"` | Mã định danh duy nhất của trạm Kiosk. |
| `BACKEND_URL` | `string` | `"http://localhost:8080"` | Địa chỉ gốc của máy chủ trung tâm Backend. |
| `KIOSK_SECRET_TOKEN` | `string` | — | Khóa bí mật dùng để xác thực các request gửi lên Backend. |
| `CAMERA_DEVICE_INDEX` | `int` | `0` | Chỉ số phần cứng của camera quang học USB (DirectShow). |
| `CAMERA_WIDTH` / `HEIGHT`| `int` | `1280` / `720` | Độ phân giải khung hình thu nhận từ webcam. |
| `SIMILARITY_THRESHOLD`| `float` | `0.50` | Ngưỡng Cosine Similarity tối thiểu để xác nhận nhận diện đúng khuôn mặt. |
| `LIVENESS_THRESHOLD` | `float` | `0.85` | Ngưỡng xác thực thực thể sống MiniFASNet tối thiểu để chống ảnh/video giả mạo. |
| `STABILITY_SECONDS` | `float` | `0.60` | Thời gian giữ ổn định liên tục trong khung Oval trước khi kích hoạt nhận diện. |

---

## 2. Local Storage Rules & Privacy Protection (Quy tắc Lưu trữ & Bảo vệ Quyền riêng tư)

* **Nguyên tắc Tuyệt đối Không Lưu Ảnh Thô (Zero Raw Image Retention)**:
  * Không bao giờ lưu trữ khung hình camera (`np.ndarray`), ảnh crop khuôn mặt hay tệp `.jpg`/`.png` xuống ổ đĩa cục bộ của trạm Kiosk.
  * Mọi dữ liệu hình ảnh chỉ tồn tại tạm thời trong bộ nhớ RAM trong chu kỳ suy luận ($< 350\text{ ms}$) và được bộ thu gom rác giải phóng ngay lập tức.
* **Quy tắc Vòng đời Hàng đợi Ngoại tuyến (Offline Queue Retention)**:
  * Khi mất mạng, bản ghi được lưu với `is_synced = 0`.
  * Sau khi đồng bộ bù thành công lên Backend, bản ghi được cập nhật `is_synced = 1`.
  * Các bản ghi đã đồng bộ (`is_synced = 1`) được lưu trữ tại biên tối đa 30 ngày phục vụ đối soát, sau đó được tự động dọn dẹp bằng câu lệnh:
    `DELETE FROM offline_punches WHERE is_synced = 1 AND created_at < datetime('now', '-30 days');`
