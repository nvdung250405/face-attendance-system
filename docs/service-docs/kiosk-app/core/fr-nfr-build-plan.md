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

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `CBL-KSK-001` | Lập trình Luồng Đọc Camera | Xây dựng worker đọc khung hình qua OpenCV DirectShow, phát tín hiệu `frame_ready(frame)` tốc độ $\ge 15\text{ FPS}$. | `SOL-KSK-001` | `FND-KSK-004` | Đọc video ổn định; tự kết nối lại sau 3s khi mất camera. | **Hoàn thành** |
| `CBL-KSK-002` | Tích hợp Bộ Phát hiện Mặt YuNet | Nạp mô hình ONNX YuNet, phát hiện mặt $\ge 120\text{ px}$, tính góc quay Euler và 5 điểm mốc. | `SOL-KSK-002` | `CBL-KSK-001` | Trả về bounding box chính xác; lọc mặt nghiêng $> 15^\circ$. | **Hoàn thành** |
| `CBL-KSK-003` | Lập trình Cổng Căn chỉnh Oval | Xây dựng bộ kiểm chuẩn hình học và độ ổn định thời gian $0.5 - 1.0\text{ s}$ trước khi kích hoạt nhận diện. | `SOL-KSK-003` | `CBL-KSK-002` | Giữ ổn định đúng thời gian mới mở cổng; phát thông điệp điều hướng màu Vàng. | **Hoàn thành** |
| `CBL-KSK-004` | Tích hợp Lọc Liveness MiniFASNet | Nạp mô hình ONNX MiniFASNet, crop vùng mặt 1.5x, tính xác suất $S \ge 0.85$. | `SOL-KSK-004` | `CBL-KSK-002` | Chặn ảnh in 2D và video màn hình; thời gian suy luận $\le 50\text{ ms}$. | **Hoàn thành** |
| `CBL-KSK-005` | Tích hợp Trích xuất ArcFace & RAM Matcher | Căn chỉnh Affine $112\times 112\text{ px}$, trích xuất vector 512D chuẩn hóa L2, nhân ma trận Cosine qua NumPy. | `SOL-KSK-005`, `SOL-KSK-006` | `CBL-KSK-004` | So khớp ma trận 1,000 nhân sự $< 2\text{ ms}$; ngưỡng Cosine $\ge 0.50$. | **Hoàn thành** |
| `CBL-KSK-006` | Lập trình Hàng đợi SQLite WAL | Quản lý CSDL `kiosk_local.db` chế độ WAL, hàm `enqueue_punch()`, `fetch_unsynced_batch()`, `mark_synced()`. | `SOL-KSK-008` | `FND-KSK-005` | Ghi đệm an toàn khi mất mạng; đọc non-blocking song song. | **Hoàn thành** |
