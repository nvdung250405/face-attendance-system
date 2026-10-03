---
title: Kiosk Core Test Plan
version: 1.0
status: Approved
owner: Edge Vision QA Lead
---

# FR/NFR TEST PLAN — Kế hoạch Kiểm thử Nội bộ Phân hệ Kiosk

## 1. Approach & Frameworks (Công cụ & Phương pháp Kiểm thử)

* **Framework**: `pytest`, `pytest-qt`, `pytest-cov`.
* **Môi trường giả lập**: Khung hình camera tĩnh (Synthetic Frames) và video ghi sẵn phục vụ chạy tự động trong CI/CD.
* **Tiêu chuẩn hoàn thành**: 100% ca kiểm thử pass; độ bao phủ dòng lệnh gói cốt lõi $\ge 80\%$.

---

## 2. Core Test Items (Danh mục Ca Kiểm thử Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-013` | Khởi tạo Camera DirectShow & Đo FPS | Kiểm tra đọc khung hình ổn định qua DirectShow với tốc độ $\ge 15\text{ FPS}$. | `FR-KSK-001`, `NFR-KSK-002` | `BLD-KSK-012` | Đọc khung hình ổn định; đạt tốc độ $\ge 15\text{ FPS}$ liên tục trong 30 phút. | Done |
| `TST-KSK-014` | Phát hiện Khuôn mặt YuNet & Đo Góc Euler | Kiểm tra phát hiện khuôn mặt kích thước $\ge 120\times 120\text{ px}$ và lọc góc Euler. | `FR-KSK-001` | `BLD-KSK-013` | Định vị đúng mặt $\ge 120\times 120\text{ px}$; từ chối mặt nghiêng $> 15^\circ$. | Done |
| `TST-KSK-015` | Cổng Căn chỉnh Oval & Giữ Ổn định | Kiểm tra điều kiện lọt khung Oval và ổn định thời gian $0.5 - 1.0\text{ s}$. | `FR-KSK-001`, `UI-KSK-001` | `BLD-KSK-014` | Chỉ kích hoạt nhận diện khi mặt nằm gọn trong Oval và giữ ổn định đúng thời gian. | Done |
| `TST-KSK-016` | Chặn Ảnh In 2D Giả mạo (Print Attack) | Kiểm tra MiniFASNet phát hiện và chặn ảnh chụp in giấy màu A4. | `FR-KSK-002` | `BLD-KSK-015` | Chặn ảnh in màu chân dung giấy A4; điểm $S < 0.85$, viền đỏ cảnh báo. | Done |
| `TST-KSK-017` | Chặn Video Màn hình Điện thoại (Replay Attack) | Kiểm tra MiniFASNet phát hiện và chặn video phát lại trên smartphone/tablet. | `FR-KSK-002` | `BLD-KSK-015` | Chặn video phát lại trên thiết bị di động với độ chính xác $\ge 98\%$. | Done |
| `TST-KSK-018` | Trích xuất ArcFace & Nhân Ma trận Cosine RAM | Kiểm tra trích xuất vector 512D chuẩn hóa L2 và so khớp ma trận RAM 1,000 NV. | `FR-KSK-003`, `NFR-KSK-001` | `BLD-KSK-016` | Vector 512D chuẩn hóa L2; so khớp ma trận 1,000 nhân sự hoàn tất $< 2\text{ ms}$. | Done |
| `TST-KSK-019` | Bộ Đệm Cooldown 120s Chống Quét Dồn dập | Kiểm tra cơ chế chặn quẹt liên tiếp trong 120s của cùng một nhân viên. | `FR-KSK-005` | `BLD-KSK-003` | Quẹt liên tiếp trong 120s bị từ chối; hiển thị thông báo "Đã ghi nhận". | Done |
| `TST-KSK-020` | Hàng đợi Ngoại tuyến SQLite WAL khi Mất mạng | Kiểm tra lưu trữ đệm an toàn vào `offline_punches` khi không có kết nối mạng. | `FR-KSK-006`, `NFR-KSK-003` | `BLD-KSK-017` | Mất mạng ghi bản ghi vào `offline_punches`; tắt máy cưỡng bức không hỏng CSDL. | Done |
| `TST-KSK-021` | Kiểm thử Tự Phục hồi Camera khi Mất Tín hiệu | Kiểm tra vòng lặp tự động kết nối lại camera DirectShow khi bị rút cáp. | `NFR-KSK-005` | `BLD-KSK-012` | Rút camera đột ngột; ứng dụng kích hoạt vòng lặp kết nối lại mỗi 3s không crash. | Done |
