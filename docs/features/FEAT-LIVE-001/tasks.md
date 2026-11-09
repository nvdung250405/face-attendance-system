# Tasks: Giám sát Sĩ số Trực tiếp Thời gian thực (FEAT-LIVE-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-LIVE-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-LIVE-001`
- **Inputs:** `docs/features/FEAT-LIVE-001/spec.md`, `docs/adr/ADR-004-stomp-websocket-realtime-feed.md`, `contracts/stomp-websocket.yaml`

---

## 1. Task List

- [x] `T-001` [US-LIVE-001] Thiết lập Spring WebSocket STOMP MessageBroker tại Backend
  - **Depends on:** None
  - **Target Files:** `app/backend-service/src/main/java/com/fas/config/WebSocketConfig.java`, `com/fas/service/StompBroadcaster.java`
  - **Acceptance:** Kích hoạt endpoint `/ws-attendance` với SockJS fallback; hỗ trợ phát sóng tới `/topic/live-attendance`.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=WebSocketConfigTest` (Exit 0)

- [x] `T-002` [US-LIVE-002] Tích hợp Client STOMP trên React 19 và luồng nhận diện dòng mới
  - **Depends on:** `T-001`
  - **Target Files:** `app/web-portal/src/hooks/useAttendanceSocket.ts`, `app/web-portal/src/views/LiveDashboardView.tsx`
  - **Acceptance:** Đăng ký nhận luồng sự kiện; tự động kết nối lại khi mất mạng; cập nhật mảng state điểm danh.
  - **Verify Command:** `npm --prefix app/web-portal run test` (Exit 0)

- [x] `T-003` [US-LIVE-003] Xây dựng hiệu ứng Green Flash ($1.5\text{ s}$) và cập nhật tức thì 5 thẻ chỉ số KPI
  - **Depends on:** `T-002`
  - **Target Files:** `app/web-portal/src/components/LiveAttendanceTable.tsx`, `app/web-portal/src/components/KpiCards.tsx`
  - **Acceptance:** Dòng mới chèn đầu bảng chớp sáng ngọc bích `emerald-50` trong 1.5s; 5 thẻ KPI cập nhật tức thời không giật lag.
  - **Verify Command:** `npm --prefix app/web-portal run test` (Exit 0)

---

## 2. Execution Contract & Completion Gate
- [x] Độ trễ phát sóng toàn trình $T_{\text{stomp}} \le 200\text{ ms}$.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-LIVE-001/acceptance-report.md`.

