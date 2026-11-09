# Tasks: Lưu đệm & Tự động Đồng bộ Ngoại tuyến (FEAT-OFFLINE-001)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Authoritative Task Breakdown  
> **Primary Owner Skill:** `planning-and-task-breakdown`  
> **Canonical Destination Path:** `docs/features/FEAT-OFFLINE-001/tasks.md`  
> **Status:** Completed  
> **Last updated:** 2026-11-08  

- **Feature ID:** `FEAT-OFFLINE-001`
- **Inputs:** `docs/features/FEAT-OFFLINE-001/spec.md`, `docs/adr/ADR-002-edge-sqlite-wal-offline-sync.md`, `contracts/openapi.yaml`

---

## 1. Task List

- [x] `T-001` [US-OFFLINE-001] Thiết lập CSDL SQLite WAL cục bộ `kiosk_local.db` và bảng `offline_punches`
  - **Depends on:** None
  - **Target Files:** `app/kiosk-app/services/database.py`, `app/kiosk-app/tests/test_database.py`
  - **Acceptance:** Kích hoạt chế độ `PRAGMA journal_mode=WAL;`; hỗ trợ ghi song song không chặn đọc.
  - **Verify Command:** `pytest app/kiosk-app/tests/test_database.py` (Exit 0)

- [x] `T-002` [US-OFFLINE-002] Xây dựng cơ chế bắt chặn lỗi mạng và lưu đệm tức thì
  - **Depends on:** `T-001`
  - **Target Files:** `app/kiosk-app/services/api_client.py`
  - **Acceptance:** Khi request HTTP timeout 3.0s hoặc lỗi mạng, tự động ghi bản ghi vào CSDL cục bộ và hiển thị thông báo "Đã lưu đệm thành công".
  - **Verify Command:** `pytest app/kiosk-app/tests/test_offline_fallback.py` (Exit 0)

- [x] `T-003` [US-OFFLINE-003] Xây dựng Worker đồng bộ bù theo lô (Batch Sync) với Exponential Backoff
  - **Depends on:** `T-002`
  - **Target Files:** `app/kiosk-app/services/sync_worker.py`, `app/backend-service/src/main/java/com/fas/controller/BatchSyncController.java`
  - **Acceptance:** Worker chạy nền quét các bản ghi `PENDING`, gửi lô tối đa 50 bản ghi/lần tới `POST /api/v1/kiosk/sync-batch`; cập nhật `SYNCED` khi nhận phản hồi 200 OK.
  - **Verify Command:** `pytest app/kiosk-app/tests/test_sync_worker.py` (Exit 0)

---

## 2. Execution Contract & Completion Gate
- [x] Đảm bảo $\text{RPO} = 0$, không làm mất bản ghi nào khi mất mạng.
- [x] Minh chứng nghiệm thu chi tiết được ghi nhận tại `docs/features/FEAT-OFFLINE-001/acceptance-report.md`.

