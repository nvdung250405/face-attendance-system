# Acceptance Report: Quản lý Đơn Giải trình Công & Khóa Kỳ Công (FEAT-EXCUSE-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Acceptance and Verification Report  
> **Primary Owner Skill:** `verification-before-completion`  
> **Canonical Destination Path:** `docs/features/FEAT-EXCUSE-001/acceptance-report.md`  
> **Status:** Verified  
> **Last updated:** 2026-11-08  

---

## 1. Executive Verdict & Deliverables
- **Feature ID:** `FEAT-EXCUSE-001`
- **Spec Path:** `docs/features/FEAT-EXCUSE-001/spec.md`
- **Overall Verdict:** `Verified` (100% Pass)

### Produced Deliverables
| Deliverable | Canonical Path | Status |
| :--- | :--- | :---: |
| Excuse Workflow Service | `app/backend-service/src/main/java/com/fas/service/ExcuseService.java` | Complete |
| Period Lock & Secure Excel Exporter | `app/backend-service/src/main/java/com/fas/export/SecureExcelExporter.java` | Complete |
| Executable Contract | `contracts/openapi.yaml` (`/api/v1/admin/reports/export`) | Validated |

---

## 2. Requirement & Acceptance Criteria Checks

| Requirement / AC ID | Scenario Summary | Verification Command / Observation | Actual Result | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| `FR-SYS-017` | Giải trình công trong 30 ngày | `./mvnw -pl app/backend-service test -Dtest=ExcuseServiceTest` | Chặn nộp nếu quá 30 ngày; cho phép HR duyệt online | **Passed** |
| `FR-SYS-018` | Khóa cứng kỳ công tháng bất biến | `./mvnw -pl app/backend-service test -Dtest=PayrollPeriodServiceTest` | Ném lỗi 403 Forbidden khi sửa kỳ công LOCKED | **Passed** |
| `FR-SYS-019` | Xuất Excel chống Formula Injection | `./mvnw -pl app/backend-service test -Dtest=SecureExcelExporterTest` | Tiền tố nháy đơn `'` cho các ô chứa `=CMD` an toàn | **Passed** |

---

## 3. Verification Gate & Sign-off Checklist
- [x] Toàn bộ ca kiểm thử quy trình duyệt và an toàn xuất file đạt 100% pass.

