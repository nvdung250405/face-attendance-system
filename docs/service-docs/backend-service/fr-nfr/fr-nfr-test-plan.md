---
title: Backend Core Test Plan
version: 1.0
status: Approved
owner: Backend QA Lead
---

# FR/NFR TEST PLAN — Kế hoạch Kiểm thử Nghiệp vụ Cốt lõi Backend

## 1. Approach Decisions (Quyết định Phương pháp Kiểm thử)

| ID | Decision | Rationale | Alternatives | Consequences | Basis | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `APC-BE-006` | Chiến lược Kiểm thử Tự động Đa tầng Phân hệ Backend (Multi-layer Testing). | Kết hợp 3 cấp độ kiểm thử: Unit Test (JUnit 5 + Mockito cô lập logic ca kíp và mã hóa); Integration Test (Spring Boot Test + Testcontainers PostgreSQL 16); Load Test (500 RPS từ 50 Kiosk ảo). Tiêu chuẩn: 100% test pass; coverage $\ge 85\%$; zero security flaw. | Chỉ kiểm thử thủ công qua Swagger/Postman, Dùng CSDL H2 in-memory thay cho Testcontainers | Đòi hỏi Docker daemon hoạt động khi chạy Integration Test với Testcontainers, nhưng bảo đảm độ chính xác 100% môi trường CSDL thật. | `NFR-BE-001`, `NFR-BE-002`, `STK-011` | Accepted |

---

## 2. Core Test Items (Danh mục Ca Kiểm thử Cốt lõi Backend)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `TST-BE-009` | Xác thực Đăng nhập & Sinh JWT Token | Kiểm tra xác thực tài khoản và cấp phát JWT token có thời hạn kèm phân quyền RBAC (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`). | `FR-BE-001` | `BLD-BE-009` | Cấp phát token hợp lệ khi đúng thông tin; trả về 401 Unauthorized khi sai mật khẩu; trả về 403 Forbidden khi truy cập trái quyền. | Done |
| `TST-BE-010` | Tiếp nhận Điểm danh & Tính Phút Đi muộn | Kiểm tra tiếp nhận punch, tính toán ca kíp, ghi nhận trạng thái điểm danh và kiểm tra cooldown 120s phía server. | `FR-BE-002`, `NFR-BE-001` | `BLD-BE-011` | Phản hồi trong $\le 100\text{ ms}$; phân loại trạng thái điểm danh chuẩn xác; lượt quẹt lặp trong 120s bị chặn từ Caffeine cache. | Done |
| `TST-BE-011` | Xử lý Gói lô Đồng bộ Bù Ngoại tuyến | Kiểm tra tiếp nhận gói 50 bản ghi đồng bộ bù từ Kiosk và xử lý idempotency chống trùng lặp. | `FR-BE-003` | `BLD-BE-012` | Gửi gói 50 bản ghi lưu thành công 100%; không phát sinh bản ghi trùng lặp; bảo toàn mốc thời gian thực tế của bản ghi ngoại tuyến. | Done |
| `TST-BE-012` | Mã hóa & Giải mã Vector AES-256-GCM | Kiểm tra bảo vệ vector ArcFace 512D với AES-256-GCM và IV ngẫu nhiên 12-byte. | `FR-BE-004`, `FR-BE-006`, `NFR-BE-003` | `BLD-BE-010` | Mã hóa và giải mã bảo toàn 100% dữ liệu gốc; sinh mới IV ngẫu nhiên mỗi lần mã hóa; không bao giờ để lộ plaintext trên đĩa. | Done |
| `TST-BE-013` | Vòng đời Phiên Đăng ký Khuôn mặt OTP | Kiểm tra luồng cấp phát và thẩm định OTP 6 số kích hoạt nạp mặt có hạn 48h sau khi ký Informed Consent. | `FR-BE-005`, `FR-BE-006` | `BLD-BE-013` | Chỉ tạo OTP khi có cam kết Consent; từ chối khi nhập sai hoặc hết hạn 48h; nạp vector hợp lệ kích hoạt trạng thái `ACTIVE`. | Done |
| `TST-BE-014` | Phát sóng Bản tin WebSocket STOMP | Kiểm tra phát sóng sự kiện điểm danh tức thời lên `/topic/live-attendance` và cập nhật gallery lên `/topic/kiosk-gallery`. | `FR-BE-007` | `BLD-BE-014` | Subscriber nhận đúng JSON payload trên `/topic/live-attendance` và `/topic/kiosk-gallery` trong $\le 50\text{ ms}$. | Done |
| `TST-BE-015` | Ghi vết Kiểm toán Bất biến & Chống Injection | Kiểm tra Spring AOP tự động ghi nhận mọi biến động dữ liệu nhạy cảm vào `audit_logs` và khử ký tự nguy hiểm khi xuất file Excel. | `FR-BE-008`, `NFR-BE-005` | `BLD-BE-015` | Cập nhật bản ghi điểm danh sinh đúng một dòng audit log có đầy đủ ngữ cảnh; file Excel được escape các ký tự đặc biệt (`=`, `+`, `-`, `@`). | Done |
| `TST-BE-016` | Kiểm thử Tải Điểm danh Đồng thời (Load Test) | Kiểm tra năng lực chịu tải đồng thời của máy chủ dưới áp lực 50 trạm Kiosk gửi liên tục. | `NFR-BE-002` | `BLD-BE-011` | Chịu tải $\ge 500\text{ req/s}$ với tỷ lệ lỗi HTTP 5xx $< 0.01\%$; mức sử dụng CPU $\le 75\%$ trên cấu hình chuẩn. | Done |
| `TST-BE-017` | Kiểm tra Tác vụ Tiêu hủy Dữ liệu Định kỳ | Kiểm tra Spring `@Scheduled` xóa cứng toàn bộ bản ghi `biometric_templates` của nhân viên thôi việc quá 20 ngày. | `FR-BE-009`, `NFR-BE-003` | `BLD-BE-017` | Bản ghi thôi việc $\le 20$ ngày được bảo toàn; bản ghi $> 20$ ngày bị xóa vĩnh viễn khỏi CSDL, không thể phục hồi. | Done |
| `TST-BE-018` | Kiểm tra Kháng lỗi & Giám sát Sức khỏe Actuator | Kiểm tra phản hồi của endpoint `/actuator/health` và khả năng tự phục hồi kết nối CSDL khi có gián đoạn tạm thời. | `NFR-BE-004` | `BLD-BE-011` | Endpoint trả về `{"status":"UP"}` với thông tin PostgreSQL và Disk Space; tự động tái kết nối CSDL thành công trong $\le 5\text{ s}$. | Done |
| `TST-BE-019` | Cổng Kiểm định Chất lượng Phân hệ Backend (Gate) | Tiêu chí chốt chặn nghiệm thu toàn bộ phân hệ Backend trước khi triển khai tích hợp hoặc phát hành sản phẩm. | `FR-BE-001`, `FR-BE-002`, `NFR-BE-001`, `NFR-BE-002` | `TST-BE-009`, `TST-BE-010`, `TST-BE-016`, `TST-BE-018` | 100% test cases pass; kiểm thử ngập tải không rò rỉ bộ nhớ; báo cáo SonarQube không có lỗ hổng Block/Critical. | Done |
| `TST-BE-025` | Kiểm thử Nghiệp vụ Ca kíp & Phân ca | Tạo ca thường/ca gãy, phân ca theo khoảng hiệu lực, kiểm tra chồng lấn và kiểm tra động cơ điểm danh dùng ca đang hiệu lực. | `FR-BE-013` | `BLD-BE-024` | Ca có mã duy nhất và ân hạn 0-60 phút; phân ca chồng khoảng trả 409 và không ghi bản ghi; vô hiệu hóa ca đang được phân trả 409; chấm công dùng ca hiệu lực để tính `late_minutes`, nhân viên chưa phân ca nhận `ANOMALOUS`. | Planned |
| `TST-BE-026` | Kiểm thử Nghiệp vụ Đơn Giải trình Công | Nhân viên nộp đơn cho bản ghi của mình; kiểm tra chặn nộp cho bản ghi của người khác và bản ghi quá 30 ngày; HR duyệt/từ chối và kiểm tra nhật ký kiểm toán. | `FR-BE-014`, `FR-BE-015` | `BLD-BE-025` | Đơn khởi tạo `PENDING`; duyệt đơn cập nhật đúng `attendance_logs` và sinh đúng một bản ghi audit có giá trị trước/sau; từ chối bắt buộc có lý do; đơn đã xử lý trả 409; nộp cho bản ghi người khác trả 404. | Planned |
| `TST-BE-027` | Kiểm thử Tra cứu Kiểm toán & Tuân thủ | Tra cứu `audit_logs` bằng role `ADMIN`, tra cứu Consent/lịch trình tiêu hủy bằng role `DPO`; kiểm tra chặn ghi với cả hai role. | `FR-BE-016` | `BLD-BE-026` | ADMIN lọc được audit log theo thời gian/tác nhân/hành vi; role `DPO` chỉ đọc được Consent/retention và nhận 403 ở mọi endpoint ghi; không tồn tại API sửa/xoá `audit_logs`. | Planned |
| `TST-BE-028` | Kiểm thử Vòng đời Trạm Kiosk | Đăng ký trạm, dùng token gọi giao diện Kiosk, đổi token, vô hiệu hóa trạm và kiểm tra cập nhật `last_ping_at`. | `FR-BE-017` | `BLD-BE-026` | Secret Token chỉ trả về một lần và lưu dạng băm; token cũ bị từ chối ngay sau khi đổi; trạm `INACTIVE` nhận 401 ở mọi giao diện Kiosk; `last_ping_at` cập nhật theo lượt gọi hợp lệ. | Planned |
| `TST-BE-033` | Kiểm thử Bootstrap Tài khoản Quản trị Đầu tiên | Chạy bootstrap trên CSDL trống, restart lại nhiều lần, kiểm tra tài khoản dùng được ngay bằng mật khẩu tạm và việc không tồn tại mật khẩu mặc định. | `FR-BE-018` | `BLD-BE-031` | Lần chạy đầu tạo đúng một tài khoản `ADMIN` dùng được ngay bằng mật khẩu tạm (không có bước chặn buộc đổi); các lần chạy lại không tạo thêm tài khoản; không có mật khẩu mặc định trong mã nguồn, `application.yml` hay Flyway. | Planned |
| `TST-BE-034` | Kiểm thử Khôi phục Thông tin Xác thực & Thu hồi Phiên | HR cấp lại mật khẩu tạm; nhân viên đặt lại PIN; kiểm tra đăng xuất, thu hồi refresh token theo tài khoản và việc từ chối token của tài khoản đã vô hiệu hóa. | `FR-BE-019`, `FR-BE-020` | `BLD-BE-031` | Mật khẩu tạm cũ hết hiệu lực và mọi phiên cũ bị thu hồi ngay; đặt lại PIN cần mật khẩu hiện tại đúng; refresh token đã thu hồi trả 401; tài khoản `TERMINATED` không dùng được access token còn hạn. | Planned |
| `TST-BE-035` | Kiểm thử Chốt Kỳ công & Khoá Điều chỉnh | HR chốt kỳ công tháng; thử nộp/duyệt đơn và điều chỉnh công thuộc kỳ đã chốt; ADMIN mở lại kèm lý do. | `FR-BE-021` | `BLD-BE-032` | Nộp/duyệt đơn và điều chỉnh công thuộc kỳ `LOCKED` trả 409; mở lại yêu cầu lý do, ghi audit và cho phép điều chỉnh trở lại; trạng thái chốt trả về trong báo cáo. | Planned |
| `TST-BE-036` | Kiểm thử Rút Consent & Yêu cầu Dữ liệu Cá nhân | Nhân viên rút Consent; kiểm tra loại khỏi gallery Kiosk, chặn sinh OTP mới, hạn tiêu hủy 7 ngày và luồng xử lý yêu cầu dữ liệu cá nhân của DPO. | `FR-BE-022` | `BLD-BE-032` | Sau khi rút Consent, gallery không còn nhân sự đó, OTP mới bị từ chối và hạn tiêu hủy là 7 ngày; yêu cầu dữ liệu cá nhân chuyển được `RECEIVED` → `FULFILLED` và sinh thông báo. | Planned |
| `TST-BE-037` | Kiểm thử Vòng đời Quyền, Thông báo & Tra cứu Tự phục vụ | ADMIN gán/thu hồi role (kể cả hai yêu cầu đồng thời hạ cấp hai ADMIN cuối); kiểm tra thông báo theo người nhận và nhân viên tự tra cứu lịch sử công. | `FR-BE-023`, `FR-BE-024`, `FR-BE-025` | `BLD-BE-033` | Thay đổi role ghi audit giá trị trước/sau; thu hồi ADMIN cuối cùng trả 409 và không thay đổi dữ liệu; người dùng chỉ thấy thông báo và lịch sử công của mình; đánh dấu đã đọc trả 200. | Planned |

---

## 3. Assumptions & Open Issues (Giả định & Vấn đề Chưa giải quyết)

* **Môi trường Testcontainers Docker**: Các ca kiểm thử tích hợp truy vấn JPA (`TST-BE-010`, `TST-BE-011`, `TST-BE-012`, `TST-BE-017`) yêu cầu môi trường có Docker Engine khả dụng để tự động kéo và khởi chạy container PostgreSQL 16 tạm thời.
* **Tách biệt Môi trường Load Test**: Ca kiểm thử ngập tải 500 RPS (`TST-BE-016`) được thực thi độc lập bằng kịch bản Gatling hoặc k6 trên môi trường lab riêng biệt để không làm sai lệch kết quả đo kiểm unit test thông thường.

