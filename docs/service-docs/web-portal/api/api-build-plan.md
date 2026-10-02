# API BUILD PLAN — Kế hoạch Thi công Tầng Mạng Phân hệ Web Portal

> **Mã tài liệu:** `PLN-ABL-WEB-01`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level — `web-portal`)  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Approved  
> **Mục đích:** Đặc tả danh mục các hạng mục thi công giao tiếp mạng (`ABL-WEB-`) của Cổng Web Portal.

---

## 1. Approach & Sequencing (Chiến lược Thi công Tầng Mạng Web)

$$\text{Axios Instance Setup} \rightarrow \text{JWT Refresh Interceptor} \rightarrow \text{API Service Modules} \rightarrow \text{STOMP React Hooks}$$

---

## 2. API Build Work Items (Danh mục Hạng mục Thi công Tầng Mạng)

| ID | Hạng mục Thi công | Mô tả Kỹ thuật Thực hiện | Covers | Depends on | Tiêu chí Nghiệm thu (Done when) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `ABL-WEB-001` | Cấu hình Axios Client & Interceptor | Khởi tạo client cấu hình baseURL, tự động gắn header Authorization và xử lý refresh token khi gặp lỗi 401. | `APD-WEB-001`, `APD-WEB-002` | `FND-WEB-003` | Gọi API an toàn; token hết hạn tự động gia hạn trong suốt mà không văng ra login. | **Hoàn thành** |
| `ABL-WEB-002` | Lập trình Các Module Dịch vụ API | Xây dựng các hàm `authApi`, `attendanceApi`, `employeeApi` bọc các endpoint REST của Backend. | `APD-WEB-001` | `ABL-WEB-001` | Kiểu dữ liệu trả về được định kiểu TypeScript nghiêm ngặt (Strict Types). | **Hoàn thành** |
| `ABL-WEB-003` | Lập trình STOMP Provider & Custom Hooks| Xây dựng Context Provider quản lý kết nối STOMP và hook `useLiveAttendance` cung cấp dữ liệu cho bảng Dashboard. | `APD-WEB-003` | `FND-WEB-003` | Nhận bản tin điểm danh trực tiếp ổn định; tự kết nối lại sau khi rớt mạng. | **Hoàn thành** |
