# Tasks: Quản lý Ca kíp & Tự động Đánh giá Công (FEAT-SHIFT-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-SHIFT-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-SHIFT-001`
- **Inputs:** `docs/features/FEAT-SHIFT-001/spec.md`, `docs/architecture.md`, `contracts/openapi.yaml`

---

## 1. Task List

- [x] `T-001` [US-SHIFT-001] Thiết kế CSDL ca kíp (`shifts`, `schedules`) và thuật toán chống chồng lấn ca (`isOverlapping`)
  - **Depends on:** None
  - **Target Files:** `app/backend-service/src/main/resources/db/migration/V2__create_shifts.sql`, `com/fas/service/ShiftService.java`
  - **Acceptance:** Không cho phép phân 2 ca có thời gian chồng chéo cho cùng một nhân viên trong ngày.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=ShiftServiceTest` (Exit 0)

- [x] `T-002` [US-SHIFT-002] Xây dựng công cụ đối soát điểm danh tự động với thời gian ân hạn 15 phút
  - **Depends on:** `T-001`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/service/AttendanceEvaluator.java`
  - **Acceptance:** Tự động gán trạng thái `ON_TIME` (trong thời gian ca + 15p ân hạn), `LATE` (sau 15p), `EARLY_LEAVE`, `ANOMALOUS`.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=AttendanceEvaluatorTest` (Exit 0)

- [x] `T-003` [US-SHIFT-003] Xây dựng giao diện cấu hình ca kíp và bảng phân ca trên Web Portal
  - **Depends on:** `T-002`
  - **Target Files:** `app/web-portal/src/views/ShiftManagementView.tsx`, `app/web-portal/src/api/shifts.ts`
  - **Acceptance:** HR có thể tạo ca làm việc, gán ca cho phòng ban, và xem lịch làm việc tháng của nhân viên.
  - **Verify Command:** `npm --prefix app/web-portal run test` (Exit 0)

---

## 2. Execution Contract & Completion Gate
- [x] Toàn bộ 3 nhiệm vụ đã hoàn thành và kiểm chứng thực nghiệm.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-SHIFT-001/acceptance-report.md`.

