---
title: Kiosk Local Data Test Plan
version: 1.0
status: Approved
owner: Edge Vision QA Lead
---

# DATA TEST PLAN — Kế hoạch Kiểm thử Dữ liệu Cục bộ Kiosk

## 1. Scope & Objectives (Phạm vi & Mục tiêu)

* **Phạm vi**: Toàn bộ hệ thống lưu trữ dữ liệu tại biên của Kiosk gồm CSDL cục bộ SQLite WAL (`kiosk_local.db`), ma trận bộ nhớ RAM NumPy và cơ chế Atomic Swap khi nạp nóng vector.
* **Mục tiêu**:
  * Đảm bảo không xảy ra khóa tranh chấp (Zero Lock Contention) giữa luồng ghi điểm danh và luồng đọc đồng bộ ngầm.
  * Xác nhận ma trận RAM 1,000 nhân sự so khớp Cosine Similarity $< 2\text{ms}$.
  * Kiểm chứng tính bền vững dữ liệu ngoại tuyến ($\text{RPO} = 0$) kể cả khi ứng dụng bị tắt cưỡng bức.

---

## 2. Approach Decisions (Quyết định Tiếp cận Kiểm thử Dữ liệu Kiosk)

| ID | Decision | Rationale | Basis | Status |
| :--- | :--- | :--- | :---: | :---: |
| `APC-KSK-005` | Kiểm thử đa tiến trình đồng thời (Concurrent Read/Write Testing) trên SQLite WAL. | Xác nhận cơ chế WAL cho phép luồng nhận diện ghi điểm danh ngay cả khi worker đồng bộ đang đọc dữ liệu đệm. | `DTD-KSK-001`, `STK-005` | Accepted |
| `APC-KSK-006` | Đo lường hiệu năng vector hóa với ma trận NumPy kích thước lớn ($N = 2,000$). | Đảm bảo hệ thống vẫn giữ được tốc độ phản hồi tức thì khi quy mô doanh nghiệp tăng gấp đôi. | `DATA-KSK-002`, `NFR-KSK-001` | Accepted |

---

## 3. Data Test Items (Danh mục Ca Kiểm thử Dữ liệu Kiosk)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-KSK-001` | Kiểm thử Khởi tạo & Cấu hình PRAGMA WAL | Kiểm tra khởi tạo file CSDL và cấu hình nhật ký ghi trước. | `DTD-KSK-001` | `BLD-KSK-001` | `PRAGMA journal_mode` trả về `wal`; sinh các file `.wal` và `.shm` phụ trợ chính xác. | Done |
| `TST-KSK-002` | Kiểm thử Ghi Hàng đợi Ngoại tuyến & Đọc Lô 50 | Kiểm tra ghi đệm và bốc lô 50 bản ghi tuần tự khi mất mạng. | `DATA-KSK-001`, `DATA-KSK-006` | `BLD-KSK-002` | Ghi đệm bản ghi hoàn tất $< 5\text{ ms}$; lấy danh sách chưa đồng bộ trả về tối đa 50 bản ghi. | Done |
| `TST-KSK-003` | Kiểm thử Tốc độ So khớp Ma trận RAM NumPy | Kiểm tra phép nhân ma trận Cosine Similarity 1,000 nhân sự. | `DATA-KSK-002`, `DTD-KSK-002` | `BLD-KSK-003` | Ma trận $1,000 \times 512$ thực hiện nhân vector hoàn tất $< 2\text{ ms}$; trả về đúng top 1 similarity. | Done |
| `TST-KSK-004` | Kiểm thử Nạp Nóng Vector (Atomic Swap) | Kiểm tra cập nhật vector mới vào RAM mà không làm giật luồng camera. | `DATA-KSK-002`, `DTD-KSK-002` | `BLD-KSK-003` | Cập nhật ma trận vector mới trong RAM trong khi luồng đọc camera đang chạy không gây crash hoặc giật lag. | Done |

---

## 4. Defect Management (Quản lý Lỗi Dữ liệu Biên)

* Lỗi xung đột khóa đĩa `sqlite3.OperationalError: database is locked` được xếp mức **Critical (P1)** và bắt buộc kiểm tra lại cấu hình timeout 5.0s và WAL journal.
