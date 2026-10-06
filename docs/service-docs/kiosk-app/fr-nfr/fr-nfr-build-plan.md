---
title: Kiosk Core Build Plan
version: 1.0
status: Approved
owner: Edge Vision Lead
---

# FR/NFR BUILD PLAN — Kế hoạch Thi công Cốt lõi Phân hệ Kiosk


## 1. Approach & Sequencing (Chiến lược Thi công)

Xây dựng các module xử lý độc lập và tích hợp theo chuỗi tín hiệu bất đồng bộ:
$$\text{Camera Ingestion} \rightarrow \text{YuNet \& Oval Gate} \rightarrow \text{Liveness Gate} \rightarrow \text{ArcFace Extractor} \rightarrow \text{RAM Matcher} \rightarrow \text{SQLite WAL Queue}$$

---

## 2. Core Build Work Items (Danh mục Hạng mục Thi công Cốt lõi)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-KSK-012` | Lập trình Luồng Đọc Camera | Xây dựng worker đọc khung hình qua OpenCV DirectShow, phát tín hiệu `frame_ready(frame)` tốc độ $\ge 15\text{ FPS}$. | `SOL-KSK-001` | `FND-KSK-004` | Đọc video ổn định; tự kết nối lại sau 3s khi mất camera. | Done |
| `BLD-KSK-013` | Tích hợp Bộ Phát hiện Mặt YuNet | Nạp mô hình ONNX YuNet, phát hiện mặt $\ge 120\text{ px}$, tính góc quay Euler và 5 điểm mốc. | `SOL-KSK-002` | `BLD-KSK-012` | Trả về bounding box chính xác; lọc mặt nghiêng $> 15^\circ$. | Done |
| `BLD-KSK-014` | Lập trình Cổng Căn chỉnh Oval | Xây dựng bộ kiểm chuẩn hình học và độ ổn định thời gian $0.5 - 1.0\text{ s}$ trước khi kích hoạt nhận diện. | `SOL-KSK-003` | `BLD-KSK-013` | Giữ ổn định đúng thời gian mới mở cổng; phát thông điệp điều hướng màu Vàng. | Done |
| `BLD-KSK-015` | Tích hợp Lọc Liveness MiniFASNet | Nạp mô hình ONNX MiniFASNet, crop vùng mặt 1.5x, tính xác suất $S \ge 0.85$. | `SOL-KSK-004` | `BLD-KSK-013` | Chặn ảnh in 2D và video màn hình; thời gian suy luận $\le 50\text{ ms}$. | Done |
| `BLD-KSK-016` | Tích hợp Trích xuất ArcFace & RAM Matcher | Căn chỉnh Affine $112\times 112\text{ px}$, trích xuất vector 512D chuẩn hóa L2, nhân ma trận Cosine qua NumPy. | `SOL-KSK-005`, `SOL-KSK-006` | `BLD-KSK-015` | So khớp ma trận 1,000 nhân sự $< 2\text{ ms}$; ngưỡng Cosine $\ge 0.50$. | Done |
| `BLD-KSK-019` | Lập trình Thẩm định PIN Dự phòng, Vòng đời Bộ nhớ & Cấu hình Trạm | Xây dựng luồng gọi `verify-pin` và ánh xạ lỗi PIN (401/423) sang UI, bộ quản lý cấp phát/giải phóng mảng khung hình, vòng lặp tự phục hồi camera và `KioskConfig` nạp từ `.env`. Phụ thuộc client HTTP thuộc facet `api` được giải quyết tại `TASK-KSK-028` (Mục 13.2). | `SOL-KSK-007`, `SOL-KSK-008`, `SOL-KSK-009`, `DTD-KSK-005` | `FND-KSK-002` | PIN chỉ được chấp nhận khi Backend trả 200 và không tạo bản ghi khi thất bại; RAM biến thiên $\le 10\%$ sau 8 giờ; camera tự phục hồi $\le 3\text{ s}$; thiếu biến cấu hình bắt buộc thì khởi động thất bại kèm thông báo rõ. | Planned |
| `BLD-KSK-017` | Lập trình Hàng đợi SQLite WAL | Quản lý CSDL `kiosk_local.db` chế độ WAL, hàm `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()`. | `SOL-KSK-008` | `FND-KSK-005` | Ghi đệm an toàn khi mất mạng; đọc non-blocking song song. | Done |
