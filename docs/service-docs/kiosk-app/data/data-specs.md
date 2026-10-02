# DATA SPECS — Đặc tả Dữ liệu Cục bộ Phân hệ Kiosk

> **Mã tài liệu:** `SPEC-DAT-KSK-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `kiosk-app`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả các thực thể dữ liệu cục bộ (`DATA-KSK-`) và yêu cầu lưu trữ ngoại tuyến của trạm Kiosk Desktop.

---

## 1. Local Data Entities (Thực thể Dữ liệu Biên)

| ID | Tên Thực thể Dữ liệu | Ý nghĩa & Phạm vi Sở hữu | Thuộc tính Cốt lõi | Tiêu chí Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- |
| `DATA-KSK-001` | Hàng đợi Điểm danh Ngoại tuyến (`offline_punches`) | Lưu trữ tạm thời các lượt chấm công khi trạm Kiosk bị mất mạng Internet hoặc máy chủ Backend không phản hồi. | `id`, `employee_id`, `punch_timestamp`, `punch_type`, `verification_method`, `confidence_score`, `kiosk_id`, `is_synced`, `retry_count`, `created_at`. | Không thất thoát dữ liệu khi mất điện ($\text{RPO} = 0$); lưu trữ mốc giờ ISO-8601 thực tế. |
| `DATA-KSK-002` | Danh mục Vector Bộ nhớ RAM (`GalleryMatrix`) | Ma trận đặc trưng số học của toàn bộ nhân viên được nạp sẵn vào RAM Kiosk để so khớp Cosine 1:N tức thời. | Ma trận $\mathbf{M} \in \mathbb{R}^{N \times 512}$ `float32`, mảng ánh xạ `gallery_index_map = [emp_id]`. | Chiếm dung lượng RAM cực nhỏ ($\sim 2\text{ MB}$ cho $1,000$ nhân sự); hỗ trợ nạp nóng động. |

---

## 2. Local Storage Rules (Quy tắc Lưu trữ Cục bộ)

* **Không lưu ảnh thô (Zero Raw Image)**: Tuyệt đối không lưu ảnh chụp từ webcam xuống ổ cứng máy trạm Kiosk.
* **Tự dọn dẹp hàng đợi ngoại tuyến**: Sau khi các bản ghi ngoại tuyến đã được đồng bộ bù thành công (`is_synced = 1`), bản ghi được lưu giữ tối đa 30 ngày phục vụ đối soát tại biên, sau đó được tự động dọn dẹp để tiết kiệm dung lượng đĩa.
