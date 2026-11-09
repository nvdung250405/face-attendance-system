# Tasks: Quản trị Quyền Dữ liệu Cá nhân & Tiêu hủy 20 Ngày (FEAT-COMPLY-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-COMPLY-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-COMPLY-001`
- **Inputs:** `docs/features/FEAT-COMPLY-001/spec.md`, `docs/security/threat-model-fas.md`, `contracts/openapi.yaml`

---

## 1. Task List

- [x] `T-001` [US-COMPLY-001] Xây dựng tác vụ định kỳ tự động Hard Delete vector sau 20 ngày nhân viên thôi việc
  - **Depends on:** None
  - **Target Files:** `app/backend-service/src/main/java/com/fas/scheduler/BiometricRetentionScheduler.java`
  - **Acceptance:** Tác vụ quét chạy hàng đêm lúc 02:00 AM; xóa vĩnh viễn 100% bản ghi `biometric_templates` của nhân viên có `termination_date <= now() - 20 days`.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=BiometricRetentionSchedulerTest` (Exit 0)

- [x] `T-002` [US-COMPLY-002] Xây dựng luồng thực thi quyền rút Informed Consent trong vòng 7 ngày
  - **Depends on:** `T-001`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/service/ConsentRevocationService.java`
  - **Acceptance:** Nhân viên rút consent trên Web Portal; chuyển trạng thái `WITHDRAWN`; kích hoạt xóa vector trong 7 ngày và chuyển sang điểm danh mã PIN bắt buộc.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=ConsentRevocationServiceTest` (Exit 0)

- [x] `T-003` [US-COMPLY-003] Thiết lập bảng kiểm toán bất biến (Immutable Audit Log) cho DPO
  - **Depends on:** `T-002`
  - **Target Files:** `app/backend-service/src/main/java/com/fas/service/AuditLogService.java`, `app/web-portal/src/views/DpoAuditView.tsx`
  - **Acceptance:** Ghi nhận mọi sự kiện tạo mẫu, truy cập, giải mã, thu hồi và tiêu hủy vector; DPO có giao diện tra cứu chỉ đọc không thể chỉnh sửa.
  - **Verify Command:** `./mvnw -pl app/backend-service test -Dtest=AuditLogServiceTest` (Exit 0)

---

## 2. Execution Contract & Completion Gate
- [x] Tuân thủ 100% Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-COMPLY-001/acceptance-report.md`.

