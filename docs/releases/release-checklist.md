# Release Checklist & Pre-flight Gate

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Release Checklist  
> **Primary Owner Skill:** `shipping-and-launch`  
> **Canonical Destination Path:** `docs/releases/release-checklist.md`  
> **Status:** Approved  
> **Last updated:** 2026-11-08  

---

## 1. Quality & Test Gates
- [x] Kiểm thử toàn bộ unit tests và integration tests của Backend hoàn tất không lỗi (`./mvnw test` -> 0 failures).
- [x] Kiểm thử toàn bộ AI pipeline và Kiosk UI tests kết thúc với exit code 0 (`pytest app/kiosk-app/tests/` -> 42 passed).
- [x] Kiểm thử Web Portal build và unit tests thành công (`npm run build` -> Exit 0).
- [x] Kiểm tra hợp đồng máy đọc tập trung đạt 100% hợp lệ: `python scripts/verify_contracts.py --dir contracts`.

## 2. Security & Compliance Gates
- [x] Quét SAST không phát hiện lỗ hổng nghiêm trọng (High/Critical: 0).
- [x] Kiểm tra khóa master mã hóa `APP_ENCRYPTION_SECRET`: Không bị hardcode trong mã nguồn hoặc git history.
- [x] Cơ chế Formula Injection (CWE-1236) đã được bọc tiền tố nháy đơn `'` cho tệp xuất Excel.
- [x] Kiểm toán pháp lý: Cơ chế tiêu hủy vector sau 20 ngày và cam kết Informed Consent tuân thủ Luật 2025.

## 3. Database & Migration Readiness
- [x] Toàn bộ các migration script Flyway (`V1`..`V5`) đã được kiểm thử tính thuận nghịch và chạy thử nghiệm trên PostgreSQL 16.
- [x] Quyền truy cập bảng `biometric_templates` được hạn chế chỉ cho user ứng dụng backend.

## 4. Operational & Rollback Readiness
- [x] Script quản trị dịch vụ `manage-services.ps1` hỗ trợ đầy đủ các lệnh: `status`, `start`, `stop`, `restart`, `logs`, `seed`.
- [x] Kế hoạch khôi phục khi gặp sự cố được ghi nhận chi tiết tại [`docs/runbooks/disaster-recovery.md`](../runbooks/disaster-recovery.md).
- [x] Ký duyệt nghiệm thu phát hành: Lead Architect & DevOps Release Lead (2026-11-08).

