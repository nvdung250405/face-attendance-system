---
title: Web Portal Client Data Build Plan
version: 2.0
status: Approved
owner: Web Lead
---

# DATA BUILD PLAN — Kế hoạch Thi công Tầng Dữ liệu Client Web Portal


## 1. Approach & Sequencing (Chiến lược Thi công Dữ liệu Client)

$$\text{TypeScript Data Contracts} \rightarrow \text{Safe Storage Adapters} \rightarrow \text{TanStack Query Cache Factory}$$

---

## 2. Data Build Work Items (Danh mục Hạng mục Thi công Dữ liệu Client)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `BLD-WEB-001` | Xây dựng TypeScript Data Contracts | Khởi tạo toàn bộ interfaces, DTOs, Enums cho AuthSession, UserProfile, AttendanceRecord, Pagination và QueryParams. | `DATA-WEB-001`, `DATA-WEB-002`, `DATA-WEB-003`, `DATA-WEB-004` | `FND-WEB-001` | Biên dịch TypeScript không cảnh báo lỗi type; toàn bộ DTOs đồng bộ 100% với Backend. | Done |
| `BLD-WEB-002` | Lập trình Safe Storage Adapters | Xây dựng module đóng gói LocalStorage và SessionStorage với cơ chế fallback bộ nhớ RAM và lắng nghe sự kiện `storage` đồng bộ đa tab. | `DTD-WEB-001`, `DTD-WEB-002`, `DTD-WEB-003` | `BLD-WEB-001` | Hoạt động an toàn trong chế độ ẩn danh (Private Browsing); logout trên 1 tab tự động sync sang các tab còn lại. | Done |
| `BLD-WEB-003` | Cấu hình TanStack Query & Cache Factory | Thiết lập `QueryClient`, định nghĩa tập trung `attendanceKeys`, `employeeKeys` và tích hợp hàm cập nhật thời gian thực khi có STOMP event. | `DATA-WEB-004` | `BLD-WEB-001` | Query cache phân tách rõ ràng; dữ liệu Live Table tự chèn vào đầu mảng mà không giật màn hình. | Done |
| `BLD-WEB-025` | Lập trình Store Trạng thái Vòng đời phía Client | Xây dựng `NotificationStateStore`, `PayrollPeriodStore` và `KioskRegistryMemoryStore` theo `DTD-WEB-004`…`DTD-WEB-006`. | `DTD-WEB-004`, `DTD-WEB-005`, `DTD-WEB-006` | `BLD-WEB-001` | Trạng thái thông báo phân tách theo người dùng và xoá khi đăng xuất; cờ khoá kỳ công không ghi LocalStorage; Secret Token chỉ tồn tại trong RAM và bị xoá khi unmount. | Planned |
