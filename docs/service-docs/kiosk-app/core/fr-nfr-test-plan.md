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

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-001` | Khởi tạo Camera DirectShow & Đo FPS | `FR-KSK-001`, `NFR-KSK-002` | Component | Đọc khung hình ổn định; đạt tốc độ $\ge 15\text{ FPS}$ liên tục. | **Passed** |
| `TST-KSK-002` | Phát hiện Khuôn mặt YuNet & Đo Góc Euler | `FR-KSK-001` | Unit | Định vị đúng mặt $\ge 120\times 120\text{ px}$; từ chối mặt nghiêng $> 15^\circ$. | **Passed** |
| `TST-KSK-003` | Cổng Căn chỉnh Oval & Giữ Ổn định 0.5s - 1.0s | `FR-KSK-001` | Functional | Chỉ kích hoạt khi mặt nằm gọn trong Oval và giữ ổn định $0.5 - 1.0\text{ s}$. | **Passed** |
| `TST-KSK-004` | Chặn Ảnh In 2D Giả mạo (Print Attack) | `FR-KSK-002` | PAD / Security | Chặn ảnh in màu chân dung giấy A4; $S_{\text{liveness}} < 0.85$, viền đỏ. | **Passed** |
| `TST-KSK-005` | Chặn Video Màn hình Điện thoại (Replay Attack) | `FR-KSK-002` | PAD / Security | Chặn video phát lại trên smartphone; độ chính xác phát hiện $\ge 98\%$. | **Passed** |
| `TST-KSK-006` | Trích xuất ArcFace & Nhân Ma trận Cosine RAM | `FR-KSK-003`, `NFR-KSK-001` | Unit / Performance| Vector 512D chuẩn hóa L2; so khớp ma trận 1,000 nhân sự $< 2\text{ ms}$. | **Passed** |
| `TST-KSK-007` | Bộ Đệm Cooldown 120s Chống Quét Dồn dập | `FR-KSK-005` | Functional | Quẹt liên tiếp trong 120s bị từ chối; hiển thị "Đã ghi nhận". | **Passed** |
| `TST-KSK-008` | Hàng đợi Ngoại tuyến SQLite WAL khi Mất mạng | `FR-KSK-006`, `NFR-KSK-003` | Resiliency | Mất mạng ghi bản ghi vào `offline_punches`; tắt máy cưỡng bức không hỏng CSDL. | **Passed** |
| `TST-KSK-009` | Kiểm thử Tự Phục hồi Camera khi Mất Tín hiệu | `NFR-KSK-005` | Robustness | Rút camera đột ngột; ứng dụng kích hoạt vòng lặp kết nối lại mỗi 3s không crash. | **Passed** |
| `TST-KSK-010` | Kiểm thử Ngâm tải Bộ nhớ RAM 8 Giờ Liên tục | `NFR-KSK-004` | Soak Testing | Chạy camera liên tục 8h; mức tiêu thụ RAM duy trì ổn định $\le 600\text{ MB}$ ($\Delta \le 10\%$). | **Passed** |
