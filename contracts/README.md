# Hợp Đồng Giao Tiếp Tập Trung (`contracts/`)

> **Cấp độ không gian:** Cấp 2 (Contract Hub)  
> **Không gian cha:** [`README.md`](../README.md) (Thư mục Gốc)  
> **Định dạng chuẩn:** OpenAPI 3.0.3 (`.yaml`), STOMP 1.2 Protocol (`.yaml`), JSON Schema Draft 2020-12 (`.json`).  
> **Nguyên tắc cốt lõi (Contract-First):** Hợp đồng là chân lý máy đọc được. Mọi thay đổi về API, tên trường DTO hoặc WebSocket topic đều phải được cập nhật tại đây trước khi sinh code.

---

## 1. Danh Mục Hợp Đồng Máy Đọc (Contract Manifests)

| Tệp Hợp Đồng | Định Dạng | Phạm Vi Nghiệp Vụ Cốt Lõi | Công Nghệ Thực Thi |
| :--- | :--- | :--- | :--- |
| [**`openapi.yaml`**](openapi.yaml) | OpenAPI 3.0.3 | Toàn bộ REST APIs: Xác thực JWT, Điểm danh Kiosk, Đồng bộ Offline, Quản trị Ca kíp & Giải trình, Báo cáo | HTTP REST, RFC 7807/9457 `ProblemDetails` |
| [**`stomp-websocket.yaml`**](stomp-websocket.yaml) | STOMP 1.2 | Các kênh phát sóng thời gian thực: `/topic/live-attendance`, `/topic/kiosk-gallery`, `/topic/onboarding-status/{id}` | SockJS, Spring WebSocket STOMP Broker |
| [**`data-contract.json`**](data-contract.json) | JSON Schema | Định dạng mẫu sinh trắc 3 tư thế (ArcFace 512D), Cam kết Informed Consent, Hồ sơ nhân viên | Wire Serialization, Validation Gate |

---

## 2. Bản Đồ Kênh Truyền Thông WebSocket STOMP

| Kênh Topic | Bên Phát Sóng (Producer) | Bên Nhận Tin (Consumer) | Dữ Liệu Trao Đổi |
| :--- | :--- | :--- | :--- |
| **`/topic/live-attendance`** | `backend-service` | `web-portal` | Sự kiện quẹt mặt tức thời (User ID, Tên, Ca kíp, Thời gian, Trạng thái) |
| **`/topic/kiosk-gallery`** | `backend-service` | `kiosk-app` | Danh sách cập nhật vector khuôn mặt mới để nạp nóng vào RAM Gallery |
| **`/topic/onboarding-status/{id}`**| `kiosk-app` (qua BE) | `web-portal` | Trạng thái đăng ký thành công tại Kiosk hiển thị về Cổng Web của nhân viên |

---

## 3. Cách Thức Đối Soát & Kiểm Tra Hợp Đồng

* **Xem trực tiếp qua Swagger UI:** Khi Backend khởi chạy, truy cập [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) để đối soát với `contracts/openapi.yaml`.
* **Kiểm tra tương thích kiểu dữ liệu:** Phân hệ Web Portal (`apps/web-portal/src/types/`) và Backend (`apps/backend-service/src/main/java/com/fas/api/dto/`) bắt buộc phải map 1:1 với các schemas trong thư mục này.
