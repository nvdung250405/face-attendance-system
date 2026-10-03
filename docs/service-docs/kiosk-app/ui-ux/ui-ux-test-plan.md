---
title: Kiosk UI/UX Test Plan
version: 1.0
status: Approved
owner: Product Designer & QA Lead
---

# UI/UX TEST PLAN — Kế hoạch Kiểm thử Giao diện & Trải nghiệm Phân hệ Kiosk

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ các thành phần giao diện người dùng PySide6/QML, tỷ lệ co giãn $S$ trên màn hình dọc 9:16, máy trạng thái viền Oval, bàn phím số ảo PIN Pad và các modal tự phục vụ.
* **Mục tiêu**:
  * Đảm bảo thời gian phản hồi giao diện tức thì $\le 50\text{ms}$ khi máy trạng thái chuyển đổi.
  * Xác thực kích thước vùng chạm phím bấm tối thiểu $60 \times 60\text{px}$ thuận tiện thao tác một chạm trên màn hình cảm ứng.
  * Kiểm chứng luồng tự đăng ký khuôn mặt 3 bước tự ẩn/hiện popup theo đúng tài liệu thiết kế Figma.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Giao diện)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-007` | Sử dụng `pytest-qt` kiểm thử tự động tương tác chạm và tín hiệu QML. | Mô phỏng chính xác sự kiện chạm màn hình, gõ phím ảo và kiểm tra trạng thái hiển thị của các thành phần đồ họa. | `STK-003`, `UI-KSK-001` | Accepted |
| `APC-KSK-008` | Kiểm định hiển thị trực quan đa độ phân giải (Visual Regression: 720x1280, 1080x1920, 2160x3840). | Bảo đảm công thức tỷ lệ co giãn $S = \min(W/1080, H/1920)$ không làm biến dạng hình học vector và phông chữ. | `UXD-KSK-005`, `NFR-KSK-002` | Accepted |

---

## 3. UI/UX Test Items (Danh mục Ca Kiểm thử Giao diện Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-005` | Kiểm thử Máy trạng thái Khung Oval 4 Màu | Kiểm tra chuyển đổi 4 trạng thái thị giác: Standby $\rightarrow$ Aligning $\rightarrow$ Success $\rightarrow$ Rejected. | `UI-KSK-001`, `UXD-KSK-001` | `BLD-KSK-006` | Chuyển đổi chính xác 4 màu; hiệu ứng Pulse Scan và Shake hoạt động trơn tru. | Done |
| `TST-KSK-006` | Kiểm thử Co giãn Tỷ lệ Động $S$ (Scaling Test) | Kiểm tra công thức $S = \min(W/1080, H/1920)$ trên các độ phân giải HD, Full HD và 4K. | `UXD-KSK-005`, `UI-KSK-008` | `BLD-KSK-005` | Tỷ lệ 9:16 giữ nguyên không bị méo; phông chữ co giãn mượt mà; không tràn viền. | Done |
| `TST-KSK-007` | Kiểm thử Bàn phím Ảo PIN Pad & Khóa 15 Phút | Kiểm tra tương tác bàn phím số cảm ứng $88\times 88\text{ px}$ và cơ chế khóa 15 phút. | `UI-KSK-002`, `UXD-KSK-003` | `BLD-KSK-008` | Bấm số phản hồi âm thanh; nhập sai 5 lần hiện đếm ngược khóa 15 phút, vô hiệu hóa phím bấm. | Done |
| `TST-KSK-008` | Kiểm thử Luồng Tự Đăng ký In-Viewport | Kiểm tra quy trình 3 bước tự ẩn dialog nhường trọn camera chính ở Bước 2. | `UI-KSK-003`, `UXD-KSK-004` | `BLD-KSK-008` | Nhập OTP hợp lệ $\rightarrow$ Dialog tự ẩn để lộ camera chính $\rightarrow$ Chụp 3 ảnh chuẩn $\rightarrow$ Hiện lại dialog thành công. | Done |

---

## 4. Defect Management (Quản lý Lỗi Giao diện Kiosk)

* Lỗi làm vỡ giao diện (Layout Broken) hoặc kẹt máy trạng thái Oval (Freeze State) được xếp mức **Critical (P1)** và phải khắc phục ngay lập tức.
