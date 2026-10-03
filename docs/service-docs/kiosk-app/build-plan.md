---
title: Kiosk App Service Build Plan
version: 1.0
status: Approved
owner: Edge Vision Lead & UI Lead
---

# BUILD PLAN — Kế hoạch Xây dựng & Tích hợp Tổng thể Phân hệ Kiosk


## 1. Approach (Chiến lược Thực hiện)

Phân hệ `kiosk-app` áp dụng chiến lược gom nhóm và sắp xếp thứ tự thực thi theo mô hình **Slices to Integration** qua các đợt phát hành (Waves), tuân thủ Mục 9.4 của [docs/sdlc-docs.md](../../sdlc-docs.md).
* **Nguyên tắc Điều phối**: Hoàn thiện nền tảng phần cứng/môi trường (Foundation) và cơ chế lưu trữ đệm ngoại tuyến (Data Facet) trước. Sau đó phát triển song song chuỗi thị giác AI (FR/NFR Facet) và hệ thống giao diện cảm ứng QML (UI/UX Facet). Tiếp theo ghép nối tầng giao tiếp mạng (API Facet) và cuối cùng tích hợp toàn trình luồng chấm công tại biên (Integration).
* **Định nghĩa Hoàn thành Cấp Phân hệ (Definition of Done - DoD)**:
  * Mọi work item (`BLD-`, `FND-`) được chuẩn hóa thành 1 Task độc lập, hoàn thành trọn vẹn trong một Pull Request.
  * Tốc độ suy luận thị giác $\le 70\text{ ms}$, tốc độ đọc camera ổn định $\ge 15\text{ FPS}$.
  * Giao diện QML co giãn động mượt mà, phản hồi chạm $< 50\text{ ms}$, không rò rỉ bộ nhớ sau 8 giờ chạy ngâm tải.
  * Đạt tiêu chí nghiệm thu (`Done when`) kiểm chứng được và vượt qua toàn bộ ca kiểm thử trước khi sáp nhập vào nhánh `develop`.

---

## 2. Build Order (Thứ tự Xây dựng & Điều phối Xuyên Facet)

Bảng điều phối gom nhóm toàn bộ các work item từ các facet build plan (`foundation-setup-plan.md`, `data-build-plan.md`, `fr-nfr-build-plan.md`, `api-build-plan.md`, `ui-ux-build-plan.md`) thành các Wave có thứ tự thực thi tuần tự:

| Wave | Includes | Depends on | Done when |
| :--- | :--- | :--- | :--- |
| **Wave 1: Foundation Setup** | `FND-KSK-001`, `FND-KSK-002`, `FND-KSK-003`, `FND-KSK-004`, `FND-KSK-005` | — | Môi trường ảo Python, thư viện PySide6/OpenCV, kiểm định mã băm 3 mô hình ONNX và driver camera DirectShow hoạt động ổn định. |
| **Wave 2: Local Data Persistence** | `BLD-KSK-001`, `BLD-KSK-002`, `BLD-KSK-003` | Wave 1 | CSDL SQLite WAL cục bộ khởi tạo chuẩn; hàng đợi ngoại tuyến và ma trận NumPy RAM 1,000 vector so khớp $< 2\text{ ms}$. |
| **Wave 3: Vision Pipeline & UI Tokens** | `BLD-KSK-004`, `BLD-KSK-005`, `BLD-KSK-012`, `BLD-KSK-013`, `BLD-KSK-014`, `BLD-KSK-015`, `BLD-KSK-016` | Wave 2 | Camera worker đọc khung hình mượt mà; YuNet, Oval gate, Liveness, ArcFace trích xuất vector chuẩn; QML tokens và bố cục 9:16 sẵn sàng. |
| **Wave 4: UI Interaction & Offline Buffer**| `BLD-KSK-006`, `BLD-KSK-007`, `BLD-KSK-008`, `BLD-KSK-017` | Wave 3 | Khung Oval 4 màu đổi trạng thái nhạy bén; thẻ kết quả kính mờ phát âm thanh; 3 modal (PIN, Đăng ký, Trợ giúp) tích hợp hoàn tất. |
| **Wave 5: Network Communication & Sync** | `BLD-KSK-009`, `BLD-KSK-010`, `BLD-KSK-011` | Wave 4 | HTTP client httpx gửi punch/batch mượt mà; STOMP worker nhận nạp nóng vector mới; Offline sync worker đẩy bù tự động khi có mạng. |
| **Wave 6: Edge Full Integration** | `BLD-KSK-018` | Wave 5 | Luồng toàn trình từ Camera $\rightarrow$ AI $\rightarrow$ SQLite $\rightarrow$ QML $\rightarrow$ API vận hành trơn tru; tổng thời gian nhận diện $\le 100\text{ ms}$. |

---

## 3. Work Items (Hạng mục Tích hợp Phân hệ)

| ID | Name | Description | Covers | Depends on | Done when | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `BLD-KSK-018` | Tích hợp Toàn trình Luồng Điểm danh Biên | Ghép nối luồng video camera, máy trạng thái Oval QML, pipeline suy luận AI (YuNet + MiniFASNet + ArcFace), ghi đệm SQLite WAL và đồng bộ HTTP/STOMP. | `ARC-001`, `SOL-KSK-001`, `UXD-KSK-001`, `APD-KSK-001`, `DTD-KSK-001` | `BLD-KSK-008`, `BLD-KSK-011` | Điểm danh thành công hiển thị thẻ kết quả xanh trong $< 100\text{ ms}$; tự động lưu SQLite khi mất mạng và đồng bộ bù khi có mạng. | Planned |
