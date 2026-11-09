# Danh Mục Đặc Tả Tính Năng Toàn Trình (Feature Specifications Index)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Feature Specifications Index  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/README.md`  
> **Status:** Approved  
> **Last updated:** 2026-11-08  

Tài liệu này là chỉ mục tra cứu toàn bộ 8 Tính năng Cốt lõi (**Core Features**) của Hệ thống Chấm công Doanh nghiệp Bằng Nhận Diện Khuôn Mặt (**Enterprise Face Attendance System — FAS**).

Mỗi tính năng được chuẩn hóa thành một lát cắt dọc độc lập gồm bộ 3 tài liệu canonical:
- **`spec.md`**: Đặc tả tính năng (User Stories & Tiêu chí nghiệm thu BDD Given/When/Then).
- **`tasks.md`**: Bảng phân rã công việc thi công (Task DAG, target files & verification commands).
- **`acceptance-report.md`**: Báo cáo nghiệm thu thực nghiệm kèm log kiểm thử và đo đạc SLA thực tế.

---

## 📋 Danh Sách 8 Tính Năng Cốt Lõi (Core Features)

| Mã Tính Năng | Tên Đặc Tả Tính Năng | Phân Hệ Liên Quan | Bộ Tài Liệu Canonical | Tóm Tắt Trách Nhiệm Kỹ Thuật & Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| **`FEAT-ENROLL-001`** | **Đăng ký & Kích hoạt Mẫu Khuôn mặt Đa Tư Thế (Guided Multi-Pose Enrollment)** | Web $\leftrightarrow$ Kiosk $\leftrightarrow$ Backend | [Spec](FEAT-ENROLL-001/spec.md) \| [Plan](FEAT-ENROLL-001/plan.md) \| [Tasks](FEAT-ENROLL-001/tasks.md) \| [Report](FEAT-ENROLL-001/acceptance-report.md) | Ký cam kết Informed Consent điện tử, sinh mã OTP 48h, hướng dẫn chụp 3 tư thế (Chính diện, Nghiêng trái, Nghiêng phải) tại Kiosk, mã hóa độc lập 3 vector AES-256-GCM. |
| **`FEAT-ATTEND-001`** | **Điểm danh Không Chạm & So khớp Ma trận Biên (Touchless Biometric Attendance)** | Kiosk $\leftrightarrow$ Backend $\leftrightarrow$ Web | [Spec](FEAT-ATTEND-001/spec.md) \| [Plan](FEAT-ATTEND-001/plan.md) \| [Tasks](FEAT-ATTEND-001/tasks.md) \| [Report](FEAT-ATTEND-001/acceptance-report.md) | Quét mặt tự động $\le 350\text{ ms}$ trên CPU, chống giả mạo 2D MiniFASNet ($S_{\text{liveness}} \ge 0.85$), so khớp đa mẫu RAM BLAS 1:N, Cooldown 120s và phát sóng STOMP $\le 200\text{ ms}$. |
| **`FEAT-FALLBACK-001`** | **Xác thực Điểm danh Dự phòng bằng Mã PIN (PIN Fallback & Lockout Security)** | Kiosk $\leftrightarrow$ Backend $\leftrightarrow$ Web | [Spec](FEAT-FALLBACK-001/spec.md) \| [Plan](FEAT-FALLBACK-001/plan.md) \| [Tasks](FEAT-FALLBACK-001/tasks.md) \| [Report](FEAT-FALLBACK-001/acceptance-report.md) | Bàn phím số ảo PIN Pad tại Kiosk cho người gặp sự cố sinh trắc hoặc đã rút Consent; thẩm định BCrypt tập trung; khóa 15 phút sau đúng 5 lần nhập sai liên tiếp. |
| **`FEAT-OFFLINE-001`** | **Lưu đệm & Tự động Đồng bộ Ngoại tuyến (Offline-First Resiliency & Batch Sync)** | Kiosk $\leftrightarrow$ Backend | [Spec](FEAT-OFFLINE-001/spec.md) \| [Plan](FEAT-OFFLINE-001/plan.md) \| [Tasks](FEAT-OFFLINE-001/tasks.md) \| [Report](FEAT-OFFLINE-001/acceptance-report.md) | Điểm danh bình thường khi mất mạng ($\text{RPO} = 0$), đệm bền vững vào SQLite WAL (`kiosk_local.db`); worker tự động gửi bù theo lô tối đa 50 bản ghi khi có mạng lại. |
| **`FEAT-SHIFT-001`** | **Quản lý Ca kíp & Tự động Đánh giá Công (Shift Scheduling & Attendance Evaluation)** | Web $\leftrightarrow$ Backend | [Spec](FEAT-SHIFT-001/spec.md) \| [Plan](FEAT-SHIFT-001/plan.md) \| [Tasks](FEAT-SHIFT-001/tasks.md) \| [Report](FEAT-SHIFT-001/acceptance-report.md) | Cấu hình ca làm việc, thời gian ân hạn 15 phút, thuật toán chống chồng lấn ca (`isOverlapping`), tự động phân loại trạng thái công `ON_TIME`, `LATE`, `EARLY_LEAVE`, `ANOMALOUS`. |
| **`FEAT-LIVE-001`** | **Giám sát Sĩ số Trực tiếp Thời gian thực (Real-time Live Monitoring Dashboard)** | Backend $\leftrightarrow$ Web | [Spec](FEAT-LIVE-001/spec.md) \| [Plan](FEAT-LIVE-001/plan.md) \| [Tasks](FEAT-LIVE-001/tasks.md) \| [Report](FEAT-LIVE-001/acceptance-report.md) | Kênh WebSocket STOMP `/topic/live-attendance`, giao diện Live Dashboard cập nhật dòng mới không cần tải lại trang trong $\le 200\text{ ms}$, tự động cập nhật thẻ chỉ số KPI. |
| **`FEAT-EXCUSE-001`** | **Quản lý Đơn Giải trình Công & Chốt Báo cáo An toàn (Excuse & Secure Export)** | Web $\leftrightarrow$ Backend | [Spec](FEAT-EXCUSE-001/spec.md) \| [Plan](FEAT-EXCUSE-001/plan.md) \| [Tasks](FEAT-EXCUSE-001/tasks.md) \| [Report](FEAT-EXCUSE-001/acceptance-report.md) | Nhân viên nộp đơn giải trình trong 30 ngày; HR xét duyệt trực tuyến; cơ chế khóa cứng kỳ công tháng bất biến (`LOCKED`); xuất file Excel an toàn chống Formula Injection (CWE-1236). |
| **`FEAT-COMPLY-001`** | **Quản trị Quyền Dữ liệu Cá nhân & Tiêu hủy Sinh trắc (Compliance & 20-Day Erasure)** | Web $\leftrightarrow$ Backend | [Spec](FEAT-COMPLY-001/spec.md) \| [Plan](FEAT-COMPLY-001/plan.md) \| [Tasks](FEAT-COMPLY-001/tasks.md) \| [Report](FEAT-COMPLY-001/acceptance-report.md) | Tự động quét xóa cứng (Hard Delete) 100% vector sau 20 ngày nhân viên thôi việc; thực thi quyền rút Consent (tiêu hủy trong 7 ngày) theo Luật 2025; cổng tra cứu DPO và nhật ký kiểm toán bất biến. |

---

## 🏛️ Cơ Sở Quy Chuẩn Kiến Trúc & Liên Kết Toàn Cục
- [**Cẩm nang Điều hướng Toàn hệ thống (Master README)**](../README.md)
- [**Tài liệu Yêu cầu Sản phẩm Toàn diện (PRD)**](../prd.md)
- [**Tổng quan Kiến trúc Hệ thống Toàn diện (Architecture Overview)**](../architecture.md)
- [**Đặc tả Yêu cầu Kỹ thuật Phần mềm (SRS)**](../specs/SRS.md)
- [**Ma trận Truy vết Yêu cầu (RTM)**](../specs/RTM.md)
- [**Hợp đồng Giao tiếp Máy đọc Tập trung (Contracts)**](../../contracts/README.md)
