# API DESIGN — Thiết kế Giao tiếp Mạng Phân hệ Kiosk

> **Mã tài liệu:** `DES-API-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 2.0  
> **Ngày hiệu lực:** 2026-10-03  
> **Trạng thái:** Approved  
> **Mục đích:** Thiết kế chi tiết kiến trúc Client giao tiếp mạng (`httpx`), hợp đồng dữ liệu từng trường, cơ chế chuyển tiếp ngoại tuyến (Offline Fallback) và luồng WebSocket STOMP Hot-Patching cho trạm Kiosk.

---

## 1. Kiến trúc Máy trạm Mạng Kiosk (Network Clients Architecture)

```mermaid
graph TD
    subgraph UI_Main_Thread["QML / UI Main Thread"]
        UI["Giao diện Kiosk QML"]
        KioskController["Bộ điều phối Kiosk Controller"]
    end

    subgraph Network_Layer["Tầng Giao tiếp Mạng (Background QThreads)"]
        HttpClient["KioskHttpClient (httpx Wrapper)"]
        SyncWorker["OfflineSyncWorker (QThread - 10s Loop)"]
        StompWorker["KioskStompWorker (QThread - stomp.py)"]
    end

    subgraph Data_Storage["Lưu trữ & Bộ nhớ Cục bộ"]
        SQLiteDB[("SQLite WAL: offline_punches")]
        RAMGallery[("RAM Matrix: GalleryManager")]
    end

    subgraph Remote_Backend["Máy chủ Trung tâm (Backend)"]
        RestAPI["REST API (/punch, /sync-batch, /gallery, ...)"]
        StompBroker["WebSocket STOMP Broker (/topic/kiosk-gallery)"]
    end

    UI --> KioskController
    KioskController -->|1. Gọi chấm công| HttpClient
    HttpClient -->|2a. HTTP OK| RestAPI
    HttpClient -.->|2b. Timeout / Network Down| SQLiteDB

    SyncWorker -->|3. Đọc bản ghi PENDING| SQLiteDB
    SyncWorker -->|4. sync-batch| RestAPI
    SyncWorker -->|5. Cập nhật SENT| SQLiteDB

    StompBroker -->|6. Đẩy thông điệp cập nhật| StompWorker
    StompWorker -->|7. Hot-patching ADD/DELETE| RAMGallery
```

| ID Thành phần | Lớp / Module Kỹ thuật | Trách nhiệm Kiến trúc | Công nghệ Sử dụng | Giao diện Thực thi |
| :--- | :--- | :--- | :--- | :---: |
| `APD-KSK-001` | `KioskHttpClient` | Thực hiện các lệnh gọi REST API đồng bộ/bất đồng bộ với timeout $3.0\text{ s}$; tự động tiêm Header xác thực (`X-Kiosk-Id`, Bearer Token); ánh xạ mã lỗi HTTP sang Ngoại lệ Nghiệp vụ (Domain Exceptions). | `httpx.Client` (Connection Pooling) | `API-KSK-001` đến `API-KSK-005` |
| `APD-KSK-002` | `KioskStompWorker` | Luồng nền `QThread` duy trì kết nối WebSocket STOMP tới Backend qua `stomp.py`, lắng nghe topic `/topic/kiosk-gallery`; tự động kết nối lại khi đứt kết nối (Exponential Backoff); phát tín hiệu nạp nóng vector. | `QThread`, `stomp.py` | `API-KSK-006` |
| `APD-KSK-003` | `OfflineSyncWorker` | Luồng nền `QThread` quét hàng đợi SQLite `offline_punches` mỗi $10\text{ s}$, gom tối đa 50 bản ghi gửi `sync-batch` và cập nhật trạng thái `SENT` khi máy chủ phản hồi thành công. | `QThread`, SQLite Connection | `API-KSK-002` |

---

## 2. Hợp đồng Chi tiết Từng Endpoint REST (Field-by-Field Contracts)

### 2.1. `POST /api/v1/kiosk/punch` — Gửi Điểm danh Trực tiếp

* **Client Handler**: `KioskHttpClient.send_punch(employee_id, method, score=None) -> PunchResultDto`
* **Request Headers**:
  ```http
  Content-Type: application/json; charset=UTF-8
  X-Kiosk-Id: KIOSK-HN-01
  Authorization: Bearer ksk_sec_7a8b9c0d1e2f3a4b
  ```
* **Request Payload Schema (JSON)**:
  | Tên Trường | Kiểu Dữ liệu | Bắt buộc | Ràng buộc Giá trị | Mô tả Chi tiết |
  | :--- | :--- | :---: | :--- | :--- |
  | `employeeId` | `int64` | Có | $> 0$ | Mã ID nhân viên định danh từ kết quả so khớp Gallery RAM. |
  | `punchTimestamp` | `string` | Có | ISO-8601 kèm offset | Mốc thời gian quét từ đồng hồ hệ thống Kiosk (`YYYY-MM-DDTHH:mm:ss.sss+07:00`). |
  | `verificationMethod` | `string` | Có | `VERIFICATION_FACE` \| `VERIFICATION_PIN` | Hình thức chấm công thực tế đã thực hiện tại Kiosk. |
  | `confidenceScore` | `float` | Không | $0.0 \le score \le 1.0$ | Điểm cosine tương đồng đối với khuôn mặt; `null` đối với mã PIN. |
  | `kioskId` | `string` | Có | Khớp cấu hình trạm | Mã định danh phần cứng của Kiosk (`KIOSK-HN-01`). |

  *Ví dụ Request Payload:*
  ```json
  {
    "employeeId": 1042,
    "punchTimestamp": "2026-10-03T08:29:45.120+07:00",
    "verificationMethod": "VERIFICATION_FACE",
    "confidenceScore": 0.8924,
    "kioskId": "KIOSK-HN-01"
  }
  ```

* **Phản hồi 200 OK (Response Payload)**:
  ```json
  {
    "success": true,
    "code": "PUNCH_RECORDED",
    "message": "Ghi nhận điểm danh thành công",
    "data": {
      "recordId": 98231,
      "employeeId": 1042,
      "employeeCode": "NV-1042",
      "fullName": "Ngô Văn Dũng",
      "punchType": "CHECK_IN",
      "punchTime": "2026-10-03T08:29:45.120+07:00",
      "status": "ON_TIME",
      "lateMinutes": 0,
      "department": "Phòng Kỹ thuật"
    },
    "timestamp": "2026-10-03T08:29:45.185+07:00"
  }
  ```

* **Quy trình Xử lý Ngoại lệ tại Kiosk**:
  * **Lỗi `409 Conflict` (`COOLDOWN_ACTIVE`)**: Ghi nhận nhân viên đã quẹt thành công trước đó trong 120s; cập nhật ngay `LocalCooldownCache` tại Kiosk để triệt tiêu các lượt quẹt thừa kế tiếp; hiển thị thông báo "Bạn đã chấm công rồi".
  * **Lỗi Mạng (`httpx.TimeoutException`, `httpx.ConnectError`, HTTP 5xx)**:
    1. Kích hoạt ngoại lệ nội bộ `KioskNetworkFallback`.
    2. Chuyển đổi payload thành bản ghi SQLite: `INSERT INTO offline_punches (employee_id, punch_timestamp, verification_method, confidence_score, status) VALUES (...)`.
    3. Trả về kết quả thành công giả lập (Offline Mode) cho Controller để hiển thị thông báo "Điểm danh ngoại tuyến thành công - Dữ liệu sẽ tự động đồng bộ khi có mạng".

---

### 2.2. `POST /api/v1/kiosk/sync-batch` — Đồng bộ Bù Ngoại tuyến

* **Client Handler**: `OfflineSyncWorker.sync_batch(records) -> SyncBatchResultDto`
* **Request Payload Schema (JSON)**:
  | Tên Trường | Kiểu Dữ liệu | Bắt buộc | Ràng buộc Giá trị | Mô tả Chi tiết |
  | :--- | :--- | :---: | :--- | :--- |
  | `kioskId` | `string` | Có | Không rỗng | Mã trạm Kiosk thực hiện đồng bộ. |
  | `batchSize` | `int` | Có | $1 \le batchSize \le 50$ | Số lượng phần tử trong mảng `records`. |
  | `records` | `array[object]` | Có | Độ dài bằng `batchSize` | Danh sách các bản ghi điểm danh ngoại tuyến. |

  *Cấu trúc từng phần tử trong `records`:*
  | Trường con | Kiểu | Mô tả |
  | :--- | :--- | :--- |
  | `localQueueId` | `int64` | Khóa chính tự tăng `local_id` trong bảng SQLite `offline_punches`. |
  | `employeeId` | `int64` | ID nhân viên đã chấm công lúc ngoại tuyến. |
  | `punchTimestamp` | `string` | Chuỗi ISO-8601 thời điểm quẹt ngoại tuyến thực tế. |
  | `verificationMethod` | `string` | `VERIFICATION_FACE` hoặc `VERIFICATION_PIN`. |
  | `confidenceScore` | `float` | Điểm cosine matching lúc ngoại tuyến hoặc `null`. |

  *Ví dụ Request Payload:*
  ```json
  {
    "kioskId": "KIOSK-HN-01",
    "batchSize": 2,
    "records": [
      {
        "localQueueId": 101,
        "employeeId": 1042,
        "punchTimestamp": "2026-10-03T07:45:10.000+07:00",
        "verificationMethod": "VERIFICATION_FACE",
        "confidenceScore": 0.8850
      },
      {
        "localQueueId": 102,
        "employeeId": 1088,
        "punchTimestamp": "2026-10-03T07:48:22.000+07:00",
        "verificationMethod": "VERIFICATION_PIN",
        "confidenceScore": null
      }
    ]
  }
  ```

* **Phản hồi 200 OK (Response Payload)**:
  ```json
  {
    "success": true,
    "code": "BATCH_SYNC_PROCESSED",
    "message": "Đồng bộ thành công 2 bản ghi",
    "data": {
      "syncedCount": 2,
      "syncedLocalIds": [101, 102],
      "failedLocalIds": []
    },
    "timestamp": "2026-10-03T08:35:12.300+07:00"
  }
  ```

* **Hành vi Xử lý Client sau phản hồi**:
  * Thực thi câu lệnh SQL cập nhật trạng thái:
    ```sql
    UPDATE offline_punches 
    SET status = 'SENT', synced_at = CURRENT_TIMESTAMP 
    WHERE local_id IN (101, 102);
    ```

---

### 2.3. `GET /api/v1/kiosk/gallery` — Tải Danh mục Vector Mẫu

* **Client Handler**: `KioskHttpClient.fetch_gallery() -> GalleryPayloadDto`
* **Request**: Không có tham số Body hoặc Query.
* **Phản hồi 200 OK (Response Payload)**:
  ```json
  {
    "success": true,
    "code": "GALLERY_FETCHED",
    "message": "Lấy danh mục vector thành công",
    "data": {
      "galleryVersion": 18,
      "totalCount": 2,
      "items": [
        {
          "employeeId": 1042,
          "employeeCode": "NV-1042",
          "fullName": "Ngô Văn Dũng",
          "department": "Phòng Kỹ thuật",
          "vector512": [0.0412, -0.0521, 0.0189, "...đủ 512 số float32..."],
          "updatedAt": "2026-10-02T15:30:00+07:00"
        },
        {
          "employeeId": 1088,
          "employeeCode": "NV-1088",
          "fullName": "Trần Thị Mai",
          "department": "Phòng Nhân sự",
          "vector512": [-0.0125, 0.0381, -0.0654, "...đủ 512 số float32..."],
          "updatedAt": "2026-10-02T16:00:00+07:00"
        }
      ]
    },
    "timestamp": "2026-10-03T07:00:00.450+07:00"
  }
  ```

* **Xử lý Dữ liệu tại Kiosk**:
  * Chuyển đổi danh sách `items` thành mảng NumPy 2 chiều $\mathbf{M} \in \mathbb{R}^{N \times 512}$ và danh sách metadata tương ứng trong `GalleryManager`.
  * Ghi đè bộ nhớ đệm snapshot cục bộ để phòng trường hợp khởi động Kiosk khi hoàn toàn mất mạng.

---

### 2.4. `POST /api/v1/kiosk/verify-otp` — Xác minh Mã OTP Kích hoạt

* **Client Handler**: `KioskHttpClient.verify_otp(otp: str) -> OtpVerificationResultDto`
* **Request Payload**:
  ```json
  {
    "otp": "839201",
    "kioskId": "KIOSK-HN-01"
  }
  ```
* **Phản hồi 200 OK**:
  ```json
  {
    "success": true,
    "code": "OTP_VERIFIED",
    "message": "Mã OTP hợp lệ",
    "data": {
      "sessionToken": "tmp_sess_9a8b7c6d5e4f3a2b1c0d",
      "employeeId": 1042,
      "employeeCode": "NV-1042",
      "fullName": "Ngô Văn Dũng",
      "department": "Phòng Kỹ thuật"
    },
    "timestamp": "2026-10-03T08:40:11.100+07:00"
  }
  ```
* **Phản hồi Lỗi (RFC 7807)**:
  * `400 Bad Request` (`OTP_INVALID` / `OTP_EXPIRED`): Ném `KioskOtpError(detail="Mã OTP không chính xác hoặc đã hết hạn")`.
  * `409 Conflict` (`OTP_ALREADY_USED`): Ném `KioskOtpError(detail="Mã OTP này đã được dùng trước đó")`.

---

### 2.5. `POST /api/v1/kiosk/enroll-face` — Tiếp nhận Vector Mới từ Kiosk

* **Client Handler**: `KioskHttpClient.enroll_face(otp, session_token, vector512) -> EnrollResultDto`
* **Request Payload**:
  ```json
  {
    "otp": "839201",
    "sessionToken": "tmp_sess_9a8b7c6d5e4f3a2b1c0d",
    "vector512": [0.0412, -0.0521, 0.0189, "...đủ 512 số float32..."],
    "kioskId": "KIOSK-HN-01"
  }
  ```
* **Phản hồi 200 OK**:
  ```json
  {
    "success": true,
    "code": "ENROLLMENT_COMPLETED",
    "message": "Đăng ký khuôn mặt thành công",
    "data": {
      "employeeId": 1042,
      "templateId": 851,
      "status": "ACTIVE",
      "activatedAt": "2026-10-03T08:41:05.320+07:00"
    },
    "timestamp": "2026-10-03T08:41:05.350+07:00"
  }
  ```

---

## 3. Thiết kế Kênh WebSocket STOMP Hot-Patching

* **Endpoint Kết nối**: `ws://localhost:8080/ws-attendance`
* **Kênh Lắng nghe (Topic)**: `/topic/kiosk-gallery`
* **Giao thức**: STOMP over WebSocket (thư viện `stomp.py`).

### 3.1. Hợp đồng Thông điệp STOMP (Event Payloads)

#### Trường hợp Thêm mới / Cập nhật Vector (`ADD_VECTOR`):
```json
{
  "action": "ADD_VECTOR",
  "employeeId": 1042,
  "employeeCode": "NV-1042",
  "fullName": "Ngô Văn Dũng",
  "department": "Phòng Kỹ thuật",
  "vector512": [0.0412, -0.0521, 0.0189, "...đủ 512 số float32..."],
  "updatedAt": "2026-10-03T08:41:05.320+07:00"
}
```

#### Trường hợp Xóa / Thu hồi Vector (`DELETE_VECTOR`):
```json
{
  "action": "DELETE_VECTOR",
  "employeeId": 1042,
  "reason": "EMPLOYEE_TERMINATED",
  "updatedAt": "2026-10-03T09:00:00.000+07:00"
}
```

### 3.2. Thuật toán Nạp Nóng Không Khóa Stream (Hot-Patching Routine)

```text
Khi nhận Frame STOMP MESSAGE từ topic /topic/kiosk-gallery:
1. Parse JSON payload -> Kiểm tra trường "action".
2. Nếu action == "ADD_VECTOR":
   - Chuẩn hóa vector v = vector512 / norm(vector512).
   - Kiểm tra nếu employeeId đã tồn tại trong Gallery metadata:
       -> Cập nhật hàng tương ứng trong GalleryMatrix M[row, :] = v.
     Nếu chưa tồn tại:
       -> Ghép hàng mới: M_new = np.vstack([M, v]).
       -> Cập nhật danh sách metadata nhân viên.
3. Nếu action == "DELETE_VECTOR":
   - Tìm chỉ số dòng row_idx chứa employeeId.
   - Xóa dòng khỏi ma trận: M_new = np.delete(M, row_idx, axis=0).
   - Xóa employeeId khỏi danh sách metadata.
4. Toàn bộ thao tác hoán đổi con trỏ ma trận trong 1 phép gán nguyên tử (Atomic Pointer Swap) để Camera Inference Thread không bị giật khung hình.
```

### 3.3. Cơ chế Tự động Kết nối Lại (Reconnection Strategy)

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: Khởi tạo kết nối STOMP
    Connecting --> Connected: Bắt tay thành công (CONNECTED frame)
    Connected --> Subscribed: SUBSCRIBE /topic/kiosk-gallery
    Subscribed --> Connected: Nhận tin nhắn bình thường

    Connected --> Disconnected: Rớt mạng / Server Restart
    Subscribed --> Disconnected: Lỗi kết nối Socket
    
    Disconnected --> BackoffWait: Tính thời gian chờ (delay = min(2^attempt, 30s))
    BackoffWait --> Connecting: Hết thời gian chờ, thử lại
```

---

## 4. Thiết kế Luồng Đồng bộ Bù Ngoại tuyến (`OfflineSyncWorker`)

```mermaid
sequenceDiagram
    autonumber
    participant Worker as OfflineSyncWorker (QThread)
    participant DB as SQLite WAL (offline_punches)
    participant Client as KioskHttpClient
    participant Backend as Backend REST Server

    loop Mỗi chu kỳ 10 giây
        Worker->>DB: SELECT * FROM offline_punches WHERE status = 'PENDING' ORDER BY local_id ASC LIMIT 50
        alt Không có bản ghi tồn đọng
            Worker->>Worker: Ngủ 10 giây
        else Có từ 1 đến 50 bản ghi
            Worker->>Client: sync_batch(records)
            Client->>Backend: POST /api/v1/kiosk/sync-batch
            alt Kết nối Thành công (HTTP 200 OK)
                Backend-->>Client: 200 OK (syncedLocalIds=[101, 102])
                Client-->>Worker: SyncBatchResultDto
                Worker->>DB: UPDATE offline_punches SET status='SENT', synced_at=NOW WHERE local_id IN (101, 102)
            else Lỗi Mạng / Timeout (HTTP 5xx / Connection Error)
                Client-->>Worker: KioskNetworkError
                Worker->>Worker: Hủy đợt gửi hiện tại, giữ nguyên status='PENDING', ngủ 10 giây thử lại
            end
        end
    end
```
