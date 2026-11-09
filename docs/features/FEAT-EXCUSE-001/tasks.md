# Tasks: Quản lý Đơn Giải trình Công & Khóa Kỳ Công (FEAT-EXCUSE-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-EXCUSE-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-EXCUSE-001`
- **Inputs:** `docs/features/FEAT-EXCUSE-001/spec.md`, `contracts/openapi.yaml`

---

## 1. Task List

- [x] `T-001` [US-EXCUSE-001] Xây dựng quy trình nộp đơn giải trình công trực tuyến trong vòng 30 ngày
  - **Depends on:** None
  - **Target Files:** `app/backend-service/src/main/java/com/fas/service/ExcuseService.java`, `app/web-portal/src/views/ExcuseSubmissionModal.tsx`
  - **Acceptance:** Nhân viên nộp giải trình kèm lý do; hệ thống chặn nộp nếu quá 30 ngày kể từ ngày chấm công phát sinh.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=ExcuseServiceTest` (Exit 0)

- [x] `T-002` [US-EXCUSE-002] Xây dựng cơ chế khóa cứng kỳ công tháng bất biến (`LOCKED`)
  - **Depends on:** `T-001`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/service/PayrollPeriodService.java`
  - **Acceptance:** Khi kỳ công chuyển trạng thái `LOCKED`, chặn 100% mọi thao tác điều chỉnh công hoặc duyệt đơn giải trình của kỳ đó.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=PayrollPeriodServiceTest` (Exit 0)

- [x] `T-003` [US-EXCUSE-003] Xây dựng bộ xuất tệp Excel an toàn phòng chống Formula Injection (CWE-1236)
  - **Depends on:** `T-002`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/export/SecureExcelExporter.java`
  - **Acceptance:** Khử độc tự động các ký tự nguy hiểm (`=`, `+`, `-`, `@`) bằng tiền tố dấu nháy đơn `'` trước khi ghi cell Apache POI.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=SecureExcelExporterTest` (Exit 0)

---

## 2. Execution Contract & Completion Gate
- [x] Toàn bộ 3 nhiệm vụ đã hoàn thành và kiểm chứng an toàn.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-EXCUSE-001/acceptance-report.md`.

