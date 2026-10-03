---
title: Backend Service Build Plan
version: 1.0
status: Approved
owner: Backend Lead
---

# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Tổng thể Phân hệ Backend


## 1. Approach (Chiến lược Thực hiện)

Phân hệ `backend-service` áp dụng chiến lược gom nhóm và sắp xếp thứ tự thực thi theo mô hình **Slices to Integration** qua các đợt phát hành (Waves), tuân thủ Mục 9.4 của [docs/sdlc-docs.md](../../sdlc-docs.md).
* **Nguyên tắc Điều phối**: Hoàn thiện nền tảng kỹ thuật (Foundation) và lớp dữ liệu (Data Facet) làm gốc. Tiếp theo triển khai lớp an ninh bảo mật và các hợp đồng API trung lập, sau đó lập trình các động cơ nghiệp vụ lõi (FR/NFR Facet) và các Controller mạng (API Facet). Cuối cùng thực thi tích hợp liên facet (Integration).
* **Định nghĩa Hoàn thành Cấp Phân hệ (Definition of Done - DoD)**:
  * Mọi work item (`BLD-`, `FND-`) được chuẩn hóa thành 1 Task độc lập, hoàn thành trọn vẹn trong một Pull Request.
  * Toàn bộ mã nguồn tuân thủ coding conventions, không chứa warning từ linter hoặc trình biên dịch.
  * Tỷ lệ bao phủ kiểm thử tự động (Unit & Integration Tests) đạt $\ge 80\%$ đối với các gói Service, Repository và Security.
  * Đạt tiêu chí nghiệm thu (`Done when`) kiểm chứng được và vượt qua toàn bộ kiểm thử hồi quy trước khi sáp nhập vào nhánh `develop`.

---

## 2. Build Order (Thứ tự Xây dựng & Điều phối Xuyên Facet)

Bảng điều phối gom nhóm toàn bộ các work item từ các facet build plan (`foundation-setup-plan.md`, `data-build-plan.md`, `fr-nfr-build-plan.md`, `api-build-plan.md`) thành các Wave có thứ tự thực thi tuần tự, trong đó các task trong cùng một Wave có thể tiến hành song song:

| Wave | Includes | Depends on | Done when |
| :--- | :--- | :--- | :--- |
| **Wave 1: Foundation Setup** | `FND-BE-001`, `FND-BE-002`, `FND-BE-003`, `FND-BE-004`, `FND-BE-005` | — | Khung dự án Spring Boot, Java 21, Flyway, Security JWT base và STOMP broker cấu hình hoàn tất; build Maven zero warning. |
| **Wave 2: Data Persistence Baseline** | `BLD-BE-001`, `BLD-BE-002`, `BLD-BE-003`, `BLD-BE-004` | Wave 1 | CSDL PostgreSQL 16 migrate đủ 8 bảng qua Flyway, 8 JPA Entities & Repositories hoạt động chính xác; Caffeine cache cấu hình chuẩn. |
| **Wave 3: Core Security & API Contracts** | `BLD-BE-005`, `BLD-BE-009`, `BLD-BE-010` | Wave 2 | Security filter, JWT provider, dịch vụ mã hóa AES-256-GCM và bộ DTOs/Validation rules sẵn sàng phục vụ tầng trên. |
| **Wave 4: Business Engine & Broadcasting** | `BLD-BE-011`, `BLD-BE-012`, `BLD-BE-013`, `BLD-BE-014`, `BLD-BE-015` | Wave 3 | Attendance engine, sync-batch handler, OTP lifecycle, STOMP broadcaster và audit aspect được cài đặt hoàn chỉnh. |
| **Wave 5: Network Controllers & Handlers** | `BLD-BE-006`, `BLD-BE-007`, `BLD-BE-008` | Wave 4 | KioskAttendanceController, Portal Controllers và STOMP channel interceptor tiếp nhận và xử lý yêu cầu mạng thông suốt. |
| **Wave 6: Service Integration** | `BLD-BE-016` | Wave 5 | Luồng nghiệp vụ từ Controller $\rightarrow$ Service $\rightarrow$ DB $\rightarrow$ STOMP Broker hoạt động trơn tru; kiểm thử toàn trình đạt $\le 100\text{ ms}$. |

---

## 3. Work Items (Hạng mục Tích hợp Phân hệ)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `BLD-BE-016` | Tích hợp Toàn trình Luồng Điểm danh & STOMP | Ghép nối luồng tiếp nhận punch từ Kiosk qua REST API, kiểm tra cooldown qua Caffeine Cache, ghi nhận PostgreSQL và phát sóng sự kiện qua STOMP. | `ARC-002`, `SOL-BE-002`, `SOL-BE-006`, `APD-BE-001`, `DTD-BE-001` | `BLD-BE-006`, `BLD-BE-014` | Giao dịch điểm danh hoàn tất trong $\le 100\text{ ms}$, đồng thời đẩy tin nhắn JSON hợp lệ lên topic `/topic/live-attendance`. | Planned |
