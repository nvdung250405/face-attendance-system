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

| ID | Quyết định Tiếp cận Kiểm thử Giao diện | Lý do & Phân tích Đánh đổi (Rationale) | Nguồn tham chiếu (Basis) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-UX-01` | Sử dụng `pytest-qt` kiểm thử tự động tương tác chạm và tín hiệu QML. | Mô phỏng chính xác sự kiện chạm màn hình, gõ phím ảo và kiểm tra trạng thái hiển thị của các thành phần đồ họa. | `STK-002`, `UI-KSK-001` | Approved |
| `APC-KSK-UX-02` | Kiểm định hiển thị trực quan đa độ phân giải (Visual Regression: 720x1280, 1080x1920, 2160x3840). | Bảo đảm công thức tỷ lệ co giãn $S = \min(W/1080, H/1920)$ không làm biến dạng hình học vector và phông chữ. | `UXD-KSK-001`, `NFR-KSK-002` | Approved |

---

## 3. UI/UX Test Items (Danh mục Ca Kiểm thử Giao diện Kiosk)

| ID | Tên Ca Kiểm thử | Covers Spec | Mức độ Test | Tiêu chí Đạt (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-UX-001` | Kiểm thử Máy trạng thái Khung Oval 4 Màu | `UI-KSK-001`, `UXD-KSK-002` | Component / GUI | Chuyển đổi chính xác 4 màu: Xám (Chờ) $\rightarrow$ Vàng (Căn chỉnh) $\rightarrow$ Xanh (Thành công) $\rightarrow$ Đỏ (Từ chối). | **Passed** |
| `TST-KSK-UX-002` | Kiểm thử Co giãn Tỷ lệ Động $S$ (Scaling Test) | `UXD-KSK-001` | Visual / UI | Thay đổi kích thước cửa sổ; tỷ lệ 9:16 giữ nguyên không bị méo; phông chữ co giãn mượt mà. | **Passed** |
| `TST-KSK-UX-003` | Kiểm thử Bàn phím Ảo PIN Pad & Khóa 15 Phút | `UI-KSK-002`, `UXD-KSK-003` | GUI / Security | Bấm số phản hồi âm thanh; nhập sai 5 lần hiện đếm ngược khóa 15 phút, vô hiệu hóa phím bấm. | **Passed** |
| `TST-KSK-UX-004` | Kiểm thử Luồng Tự Đăng ký In-Viewport | `UI-KSK-003`, `UXD-KSK-004` | Journey / UX | Nhập OTP hợp lệ $\rightarrow$ Dialog tự ẩn để lộ camera chính $\rightarrow$ Chụp 3 ảnh chuẩn $\rightarrow$ Hiện lại dialog thành công. | **Passed** |

---

## 4. Defect Management (Quản lý Lỗi Giao diện Kiosk)

* Lỗi làm vỡ giao diện (Layout Broken) hoặc kẹt máy trạng thái Oval (Freeze State) được xếp mức **Critical (P1)** và phải khắc phục ngay lập tức.
