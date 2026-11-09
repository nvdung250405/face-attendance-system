# ADR-004: Truyền tải Sự kiện Điểm danh Thời gian thực qua STOMP WebSocket

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Architecture Decision Record (ADR)  
> **Primary Owner Skill:** `documentation-and-adrs`  
> **Canonical Destination Path:** `docs/adr/ADR-004-stomp-websocket-realtime-feed.md`  
> **Status:** Accepted  
> **Last updated:** 2026-11-08  

---

## 1. Context & Problem Framing
- **Decision Owners:** Solution Architect & Frontend UI Lead
- **Related Requirements / Features:** `FR-SYS-011`, `FR-SYS-015`, `NFR-SYS-002`, `FEAT-LIVE-001`
- **Vấn đề kỹ thuật**: Bộ phận Nhân sự (HR) cần theo dõi sĩ số nhân viên có mặt tại các cửa ra vào theo thời gian thực (Live Attendance Dashboard) vào đầu giờ sáng để kịp thời điều chuyển nhân lực cho các dây chuyền sản xuất thiếu hụt.
- Ngoài ra, khi nhân viên hoàn tất nạp 3 tư thế khuôn mặt tại trạm Kiosk, màn hình Web Portal của nhân viên đó cần tự động nhận biết ngay lập tức để đóng hộp thoại hướng dẫn và phát hiệu ứng hoàn tất (*Confetti*).
- Hệ thống cần một giải pháp truyền tải sự kiện thời gian thực hai chiều giữa Backend, Web Portal và Kiosk với độ trễ $\le 200\text{ ms}$, chịu tải tốt và tương thích hoàn hảo với Spring Boot và React.

---

## 2. Decision Drivers & Quality Attributes
- **Driver 1 (Độ trễ thấp)**: Độ trễ truyền phát sự kiện $\le 200\text{ ms}$ từ khi Kiosk gửi punch đến khi Web Portal render dòng mới.
- **Driver 2 (Tiết kiệm Băng thông & Tài nguyên Máy chủ)**: Tránh lãng phí hàng nghìn request HTTP vô nghĩa khi không có lượt quẹt mới.
- **Driver 3 (Hỗ trợ Định tuyến Kênh & Bảo mật Phân quyền)**: Hỗ trợ kênh phát sóng chung (`/topic/**`) và kênh riêng theo phiên (`/topic/enrollment/{otp}`).

---

## 3. Options Considered

### Option A — HTTP Short Polling (Gọi API định kỳ mỗi 1-2 giây)
- **Benefits:** Dễ triển khai nhất, không cần WebSocket.
- **Costs & Risks:** Gây lãng phí tài nguyên CPU và băng thông mạng cực lớn; 95% request trả về dữ liệu rỗng; độ trễ cập nhật tối đa lên tới 2 giây.
- **Rejected.**

### Option B — Server-Sent Events (SSE)
- **Benefits:** Chuẩn HTTP đơn giản, tiết kiệm hơn polling, hỗ trợ tự động kết nối lại.
- **Costs & Risks:** Chỉ hỗ trợ 1 chiều (Server $\rightarrow$ Client); không hỗ trợ giao tiếp 2 chiều giữa Kiosk và Backend; quản lý phân kênh phức tạp hơn khi mở rộng cụm Kiosk.
- **Rejected.**

### Option C — WebSocket STOMP Protocol (Spring WebSocket + SockJS)
- **Benefits:**
  - Giao thức STOMP 1.2 là chuẩn giao vận tin nhắn hướng khung hình (frame-based) phổ biến nhất trên WebSocket.
  - Hỗ trợ mô hình Pub/Sub (Publish/Subscribe) mạnh mẽ với các kênh phân biệt rõ ràng:
    - `/topic/live-attendance`: Phát sóng sự kiện điểm danh cho Live Dashboard.
    - `/topic/enrollment/{otp}`: Phát sóng trạng thái hoàn tất nạp mẫu cho từng nhân viên.
    - `/topic/kiosk-gallery`: Phát sóng vector mới cho toàn bộ trạm Kiosk.
  - Tích hợp nguyên bản trong hệ sinh thái Spring Boot (`spring-boot-starter-websocket`) và thư viện `@stomp/stompjs` trên React 19.
  - SockJS cung cấp cơ chế fallback tự động nếu môi trường mạng chặn kết nối WebSocket thuần.
- **Costs & Risks:** Cần duy trì các kết nối TCP thường trực (persistent connections); cần cấu hình heartbeat để phát hiện rớt mạng.

---

## 4. Chosen Decision
**Lựa chọn Option C**: Sử dụng giao thức **STOMP 1.2 over WebSocket** kết hợp SockJS tại endpoint `/ws-attendance`. Định nghĩa chi tiết hợp đồng tin nhắn tại [`contracts/stomp-websocket.yaml`](../../contracts/stomp-websocket.yaml).

---

## 5. Consequences & Impact
- **Positive Impacts:** Đạt độ trễ truyền phát cực nhanh $\le 200\text{ ms}$; loại bỏ $100\%$ polling thừa; giao diện Live Dashboard phản hồi mượt mà với hiệu ứng chớp sáng ngọc bích 1.5s.
- **Negative Impacts:** Cần cấu hình reverse proxy Nginx (hoặc Docker gateway) hỗ trợ nâng cấp header `Upgrade: websocket`.

---

## 6. Validation, Revisit Conditions & Review Gate
- **Empirical Validation Plan:** Đo kiểm thời gian từ lúc Kiosk gửi bản ghi punch thành công đến khi Web Portal nhận STOMP frame qua công cụ Network DevTools; kết quả đạt $45 - 85\text{ ms}$ (vượt xa chỉ tiêu $\le 200\text{ ms}$).
- **Revisit Triggers:** Khi lượng kết nối đồng thời vượt quá 10,000 clients (cân nhắc chuyển sang RabbitMQ Broker Relay ngoài).

