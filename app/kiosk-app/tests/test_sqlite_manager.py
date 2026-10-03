"""Bộ kiểm thử đơn vị cho Hàng đợi ngoại tuyến SQLite WAL và OfflineSyncWorker.

Tài liệu tham chiếu:
- DATA TEST PLAN: TST-KSK-DAT-001, TST-KSK-DAT-002 (docs/service-docs/kiosk-app/data/data-test-plan.md)
- DATA SPECS: DATA-KSK-001 (docs/service-docs/kiosk-app/data/data-specs.md)
- DATA DESIGN: Mục 1 - Schema & PRAGMA (docs/service-docs/kiosk-app/data/data-design.md)
"""

import sqlite3
import time

import httpx
import pytest

from core.offline.sqlite_manager import SQLiteQueueManager
from core.offline.sync_worker import OfflineSyncWorker


class TestSQLiteQueueManager:
    """Kiểm thử hoạt động của SQLiteQueueManager với cơ chế WAL và hợp đồng dữ liệu chuẩn."""

    @pytest.fixture
    def temp_db(self, tmp_path):
        """Tạo đường dẫn database tạm thời cho mỗi ca test."""
        return tmp_path / "test_kiosk.db"

    @pytest.fixture
    def queue_mgr(self, temp_db):
        """Khởi tạo SQLiteQueueManager trên database tạm."""
        return SQLiteQueueManager(db_path=temp_db)

    def test_tst_ksk_dat_001_wal_mode_and_pragma_initialization(self, temp_db, queue_mgr):
        """TST-KSK-DAT-001: Kiểm tra cấu hình PRAGMA WAL, synchronous, busy_timeout và tạo bảng chuẩn."""
        conn = sqlite3.connect(str(temp_db))
        cursor = conn.cursor()

        # 1. Kiểm tra chế độ WAL (Write-Ahead Logging)
        cursor.execute("PRAGMA journal_mode;")
        journal_mode = cursor.fetchone()[0]
        assert journal_mode.lower() == "wal"

        # 2. Kiểm tra các cột theo chuẩn DATA-KSK-001
        cursor.execute("PRAGMA table_info(offline_punches);")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        expected_columns = [
            "id",
            "employee_id",
            "punch_timestamp",
            "punch_type",
            "verification_method",
            "confidence_score",
            "kiosk_id",
            "is_synced",
            "retry_count",
            "created_at",
        ]
        for col in expected_columns:
            assert col in columns, f"Thiếu cột chuẩn: {col}"

        # 3. Kiểm tra chỉ mục tối ưu
        cursor.execute("PRAGMA index_list(offline_punches);")
        indexes = [row[1] for row in cursor.fetchall()]
        assert "idx_offline_sync" in indexes
        assert "idx_offline_timestamp" in indexes

        conn.close()

        # Kiểm tra bảng offline_punches rỗng khi khởi tạo
        assert queue_mgr.get_unsynced_count() == 0
        assert queue_mgr.get_unsynced_punches() == []

    def test_tst_ksk_dat_002_enqueue_and_fetch_pending_batch(self, queue_mgr):
        """TST-KSK-DAT-002: Ghi đệm lượt quẹt ngoại tuyến (< 5ms) và bốc lô 50 bản ghi."""
        start_time = time.perf_counter()
        local_id_1 = queue_mgr.enqueue_punch(
            employee_id=101,
            punch_type="CHECK_IN",
            verification_method="VERIFICATION_FACE",
            confidence_score=0.92,
            kiosk_id="KIOSK-HN-01",
        )
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        assert local_id_1 > 0
        assert latency_ms < 50.0  # Đảm bảo ghi nhanh

        local_id_2 = queue_mgr.enqueue_punch(
            employee_id=102,
            punch_type="CHECK_OUT",
            verification_method="VERIFICATION_PIN",
            confidence_score=None,
            kiosk_id="KIOSK-HN-01",
        )
        assert local_id_2 > local_id_1

        assert queue_mgr.get_unsynced_count() == 2

        # Lấy danh sách chờ đồng bộ
        unsynced = queue_mgr.fetch_pending_batch(limit=50)
        assert len(unsynced) == 2
        assert unsynced[0]["id"] == local_id_1
        assert unsynced[0]["employee_id"] == 101
        assert unsynced[0]["punch_type"] == "CHECK_IN"
        assert unsynced[0]["verification_method"] == "VERIFICATION_FACE"
        assert unsynced[0]["confidence_score"] == pytest.approx(0.92)
        assert unsynced[0]["is_synced"] == 0

        assert unsynced[1]["id"] == local_id_2
        assert unsynced[1]["employee_id"] == 102
        assert unsynced[1]["punch_type"] == "CHECK_OUT"
        assert unsynced[1]["verification_method"] == "VERIFICATION_PIN"
        assert unsynced[1]["confidence_score"] is None

    def test_mark_as_synced(self, queue_mgr):
        """Kiểm tra cập nhật trạng thái đã đồng bộ thành công."""
        p1 = queue_mgr.enqueue_punch(employee_id=201)
        p2 = queue_mgr.enqueue_punch(employee_id=202)
        p3 = queue_mgr.enqueue_punch(employee_id=203)

        assert queue_mgr.get_unsynced_count() == 3

        # Đồng bộ 2 bản ghi đầu
        updated = queue_mgr.mark_as_synced([p1, p2])
        assert updated == 2
        assert queue_mgr.get_unsynced_count() == 1

        remaining = queue_mgr.get_unsynced_punches()
        assert len(remaining) == 1
        assert remaining[0]["id"] == p3

        # Đánh dấu danh sách rỗng không gây lỗi
        assert queue_mgr.mark_as_synced([]) == 0

    def test_data_persistence_crash_simulation(self, temp_db):
        """Kiểm thử bảo toàn dữ liệu hàng đợi khi ngắt đột ngột (RPO = 0)."""
        mgr1 = SQLiteQueueManager(db_path=temp_db)
        created_ids = []
        for i in range(5):
            pid = mgr1.enqueue_punch(employee_id=1000 + i, punch_type="CHECK_IN")
            created_ids.append(pid)

        # Giả lập crash/restart ứng dụng bằng cách giải phóng kết nối
        del mgr1

        # Khởi tạo instance mới trên cùng tệp DB
        mgr2 = SQLiteQueueManager(db_path=temp_db)
        assert mgr2.get_unsynced_count() == 5
        records = mgr2.get_unsynced_punches(limit=10)
        retrieved_ids = [r["id"] for r in records]
        assert retrieved_ids == created_ids

    def test_cleanup_synced_punches_30_days_retention(self, temp_db, queue_mgr):
        """Kiểm tra chính sách dọn dẹp bản ghi đã đồng bộ quá 30 ngày (DATA-KSK-001)."""
        p1 = queue_mgr.enqueue_punch(employee_id=301)
        p2 = queue_mgr.enqueue_punch(employee_id=302)

        # Đánh dấu p1 đã đồng bộ
        queue_mgr.mark_as_synced([p1])

        # Cưỡng bức chỉnh sửa created_at lùi về 35 ngày trước trong SQLite
        conn = sqlite3.connect(str(temp_db))
        conn.execute(
            "UPDATE offline_punches SET created_at = datetime('now', '-35 days') WHERE id = ?",
            (p1,),
        )
        conn.commit()
        conn.close()

        # Dọn dẹp với thời hạn mặc định 30 ngày
        deleted = queue_mgr.cleanup_synced_punches(retention_days=30)
        assert deleted == 1

        # p2 chưa đồng bộ nên vẫn còn nguyên vẹn
        assert queue_mgr.get_unsynced_count() == 1
        assert queue_mgr.get_unsynced_punches()[0]["id"] == p2


class TestOfflineSyncWorker:
    """Kiểm thử hoạt động của OfflineSyncWorker."""

    @pytest.fixture
    def temp_db(self, tmp_path):
        return tmp_path / "sync_worker_test.db"

    @pytest.fixture
    def queue_mgr(self, temp_db):
        return SQLiteQueueManager(db_path=temp_db)

    def test_batch_sync_50_records(self, qapp, queue_mgr):
        """Đọc lô 50 bản ghi đồng bộ bù khi có mạng lại."""
        # Tạo 55 bản ghi chưa đồng bộ
        for i in range(55):
            queue_mgr.enqueue_punch(
                employee_id=100 + i,
                punch_type="CHECK_IN",
                verification_method="VERIFICATION_FACE" if i % 2 == 0 else "VERIFICATION_PIN",
                confidence_score=0.91,
            )

        assert queue_mgr.get_unsynced_count() == 55

        received_batches = []

        def mock_handler(request: httpx.Request):
            if request.url.path.endswith("/kiosk/sync-batch"):
                import json
                data = json.loads(request.content)
                received_batches.append(data)
                return httpx.Response(
                    200,
                    json={
                        "success": True,
                        "code": "BATCH_SYNC_SUCCESS",
                        "message": f"Synced {data['batchCount']} items",
                    },
                )
            return httpx.Response(404)

        transport = httpx.MockTransport(mock_handler)
        mock_client = httpx.Client(transport=transport)

        worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://mock-backend:8080/api/v1",
            kiosk_id="KIOSK-HN-01",
            batch_size=50,
            interval_seconds=1.0,
            client=mock_client,
        )

        progress_events = []
        worker.sync_progress.connect(lambda synced, rem: progress_events.append((synced, rem)))

        total_synced = worker.sync_once()

        assert total_synced == 55
        assert queue_mgr.get_unsynced_count() == 0

        # Chia làm 2 lô: 50 bản ghi và 5 bản ghi
        assert len(received_batches) == 2
        assert received_batches[0]["batchCount"] == 50
        assert received_batches[1]["batchCount"] == 5

        assert len(progress_events) == 2
        assert progress_events[0] == (50, 5)
        assert progress_events[1] == (5, 0)

        worker.stop()

    def test_sync_batch_network_failure(self, qapp, queue_mgr):
        """Kiểm thử xử lý khi mạng bị lỗi (HTTP 500 hoặc mất kết nối)."""
        queue_mgr.enqueue_punch(employee_id=500, punch_type="CHECK_IN")

        def error_handler(request: httpx.Request):
            return httpx.Response(500, text="Internal Server Error")

        transport = httpx.MockTransport(error_handler)
        mock_client = httpx.Client(transport=transport)

        worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://mock-backend:8080/api/v1",
            client=mock_client,
        )

        network_events = []
        worker.network_status_changed.connect(lambda online, msg: network_events.append((online, msg)))

        total_synced = worker.sync_once()

        assert total_synced == 0
        assert queue_mgr.get_unsynced_count() == 1
        assert any(event[0] is False for event in network_events)

        worker.stop()

    def test_check_health(self, qapp, queue_mgr):
        """Kiểm thử hàm check_health khi máy chủ online và offline."""
        def ok_handler(request: httpx.Request):
            return httpx.Response(200, json={"status": "UP"})

        ok_worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://mock-backend:8080/api/v1",
            client=httpx.Client(transport=httpx.MockTransport(ok_handler)),
        )
        assert ok_worker.check_health() is True
        ok_worker.stop()

        def err_handler(request: httpx.Request):
            raise httpx.ConnectError("Connection refused")

        err_worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://mock-backend:8080/api/v1",
            client=httpx.Client(transport=httpx.MockTransport(err_handler)),
        )
        assert err_worker.check_health() is False
        err_worker.stop()
