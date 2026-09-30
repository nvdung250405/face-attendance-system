"""Bộ kiểm thử đơn vị cho Hàng đợi ngoại tuyến SQLite WAL và OfflineSyncWorker.

Tài liệu tham chiếu:
- TP-KIOSK-01 (Mục 6.2 - TC-KIOSK-13, TC-KIOSK-14, TC-KIOSK-15)
- BP-KIOSK-01 (Mục 1.2, 4.3 & FR-05)
- DDS.md (Mục 2.1 & Quyết định DEC-04: SQLite WAL mode, Zero Data Loss RPO = 0)
"""

import sqlite3

import httpx
import pytest

from core.offline.sqlite_manager import SQLiteQueueManager
from core.offline.sync_worker import OfflineSyncWorker


class TestSQLiteQueueManager:
    """Kiểm thử hoạt động của SQLiteQueueManager với cơ chế WAL."""

    @pytest.fixture
    def temp_db(self, tmp_path):
        """Tạo đường dẫn database tạm thời cho mỗi ca test."""
        return tmp_path / "test_kiosk.db"

    @pytest.fixture
    def queue_mgr(self, temp_db):
        """Khởi tạo SQLiteQueueManager trên database tạm."""
        return SQLiteQueueManager(db_path=temp_db)

    def test_tc_kiosk_13_wal_mode_and_table_initialization(self, temp_db, queue_mgr):
        """TC-KIOSK-13: Kiểm tra chế độ WAL (Write-Ahead Logging) và khởi tạo bảng."""
        # Kiểm tra chế độ WAL được kích hoạt
        conn = sqlite3.connect(str(temp_db))
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode;")
        journal_mode = cursor.fetchone()[0]
        conn.close()

        assert journal_mode.lower() == "wal"

        # Kiểm tra bảng offline_punches tồn tại và rỗng
        assert queue_mgr.get_unsynced_count() == 0
        assert queue_mgr.get_unsynced_punches() == []

    def test_tc_kiosk_13_enqueue_and_retrieve_punches(self, queue_mgr):
        """TC-KIOSK-13: Ghi đệm lượt quẹt vào SQLite WAL và truy vấn danh sách chờ đồng bộ."""
        # Enqueue lượt điểm danh FACE
        punch_id_1 = queue_mgr.enqueue_punch(
            employee_id=101,
            punch_type="FACE",
            similarity_score=0.92,
            liveness_score=0.98,
            kiosk_id="KIOSK-GATE-01",
        )
        assert punch_id_1 is not None

        # Enqueue lượt điểm danh PIN
        punch_id_2 = queue_mgr.enqueue_punch(
            employee_id=102,
            punch_type="PIN",
            similarity_score=0.0,
            liveness_score=0.0,
            kiosk_id="KIOSK-GATE-01",
        )
        assert punch_id_2 is not None

        assert queue_mgr.get_unsynced_count() == 2

        # Lấy danh sách chờ đồng bộ
        unsynced = queue_mgr.get_unsynced_punches(limit=10)
        assert len(unsynced) == 2
        assert unsynced[0]["punch_id"] == punch_id_1
        assert unsynced[0]["employee_id"] == 101
        assert unsynced[0]["punch_type"] == "FACE"
        assert unsynced[0]["similarity_score"] == pytest.approx(0.92)
        assert unsynced[1]["punch_id"] == punch_id_2
        assert unsynced[1]["employee_id"] == 102
        assert unsynced[1]["punch_type"] == "PIN"

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
        assert remaining[0]["punch_id"] == p3

        # Đánh dấu danh sách rỗng không gây lỗi
        assert queue_mgr.mark_as_synced([]) == 0

    def test_tc_kiosk_14_data_persistence_crash_simulation(self, temp_db):
        """TC-KIOSK-14: Kiểm thử bảo toàn dữ liệu hàng đợi khi ngắt đột ngột (RPO = 0)."""
        # Bước 1: Khởi tạo và ghi 5 bản ghi
        mgr1 = SQLiteQueueManager(db_path=temp_db)
        created_ids = []
        for i in range(5):
            pid = mgr1.enqueue_punch(employee_id=1000 + i, punch_type="FACE")
            created_ids.append(pid)

        # Bước 2: Giả lập crash/restart ứng dụng bằng cách giải phóng kết nối
        del mgr1

        # Bước 3: Khởi tạo instance mới trên cùng tệp DB
        mgr2 = SQLiteQueueManager(db_path=temp_db)
        assert mgr2.get_unsynced_count() == 5
        records = mgr2.get_unsynced_punches(limit=10)
        retrieved_ids = [r["punch_id"] for r in records]
        assert retrieved_ids == created_ids

    def test_cleanup_synced_punches(self, temp_db, queue_mgr):
        """Kiểm tra dọn dẹp các bản ghi đã đồng bộ quá hạn."""
        p1 = queue_mgr.enqueue_punch(employee_id=301)
        p2 = queue_mgr.enqueue_punch(employee_id=302)

        # Đánh dấu đã đồng bộ
        queue_mgr.mark_as_synced([p1])

        # Cưỡng bức chỉnh sửa created_at lùi về 25 ngày trước trong SQLite
        conn = sqlite3.connect(str(temp_db))
        conn.execute(
            "UPDATE offline_punches SET created_at = datetime('now', '-25 days') WHERE punch_id = ?",
            (p1,),
        )
        conn.commit()
        conn.close()

        # Dọn dẹp với thời hạn 20 ngày
        deleted = queue_mgr.cleanup_synced_punches(retention_days=20)
        assert deleted == 1

        # p2 chưa đồng bộ nên vẫn còn nguyên vẹn
        assert queue_mgr.get_unsynced_count() == 1
        assert queue_mgr.get_unsynced_punches()[0]["punch_id"] == p2


class TestOfflineSyncWorker:
    """Kiểm thử hoạt động của OfflineSyncWorker."""

    @pytest.fixture
    def temp_db(self, tmp_path):
        return tmp_path / "sync_worker_test.db"

    @pytest.fixture
    def queue_mgr(self, temp_db):
        return SQLiteQueueManager(db_path=temp_db)

    def test_tc_kiosk_15_batch_sync_50_records(self, qapp, queue_mgr):
        """TC-KIOSK-15: Đọc lô 50 bản ghi đồng bộ bù khi có mạng lại."""
        # Tạo 55 bản ghi chưa đồng bộ
        for i in range(55):
            queue_mgr.enqueue_punch(
                employee_id=100 + i,
                punch_type="FACE" if i % 2 == 0 else "PIN",
                similarity_score=0.91,
                liveness_score=0.95,
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
            kiosk_id="KIOSK-LOBBY-01",
            batch_size=50,
            interval_seconds=1.0,
            client=mock_client,
        )

        progress_events = []
        worker.sync_progress.connect(lambda synced, rem: progress_events.append((synced, rem)))

        # Chạy 1 vòng đồng bộ toàn bộ (sync_once)
        total_synced = worker.sync_once()

        # Xác thực kết quả
        assert total_synced == 55
        assert queue_mgr.get_unsynced_count() == 0

        # Phải được chia làm 2 lô: lô 1 (50 bản ghi) và lô 2 (5 bản ghi)
        assert len(received_batches) == 2
        assert received_batches[0]["batchCount"] == 50
        assert received_batches[1]["batchCount"] == 5

        # Tín hiệu sync_progress được phát 2 lần
        assert len(progress_events) == 2
        assert progress_events[0] == (50, 5)
        assert progress_events[1] == (5, 0)

        # Dọn dẹp
        worker.stop()

    def test_sync_batch_network_failure(self, qapp, queue_mgr):
        """Kiểm thử xử lý khi mạng bị lỗi (HTTP 500 hoặc mất kết nối)."""
        queue_mgr.enqueue_punch(employee_id=500, punch_type="FACE")

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

        # Không bản ghi nào được đánh dấu là đồng bộ
        assert total_synced == 0
        assert queue_mgr.get_unsynced_count() == 1

        # Trạng thái mạng phát tín hiệu False
        assert any(event[0] is False for event in network_events)

        worker.stop()

    def test_check_health(self, qapp, queue_mgr):
        """Kiểm thử hàm check_health khi máy chủ online và offline."""
        # Máy chủ online
        def ok_handler(request: httpx.Request):
            return httpx.Response(200, json={"status": "UP"})

        ok_worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://mock-backend:8080/api/v1",
            client=httpx.Client(transport=httpx.MockTransport(ok_handler)),
        )
        assert ok_worker.check_health() is True
        ok_worker.stop()

        # Máy chủ offline (connection error)
        def err_handler(request: httpx.Request):
            raise httpx.ConnectError("Connection refused")

        err_worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://mock-backend:8080/api/v1",
            client=httpx.Client(transport=httpx.MockTransport(err_handler)),
        )
        assert err_worker.check_health() is False
        err_worker.stop()

    def test_sync_batch_empty_punches(self, qapp, queue_mgr):
        """Kiểm tra gọi sync_batch với danh sách rỗng trả về True ngay."""
        worker = OfflineSyncWorker(queue_manager=queue_mgr)
        assert worker.sync_batch([]) is True
        worker.stop()

    def test_sync_worker_thread_execution_and_stop(self, qapp, queue_mgr):
        """Kiểm thử vòng lặp thực thi của QThread khi start() và stop()."""
        def health_handler(request: httpx.Request):
            return httpx.Response(200, json={"status": "OK"})

        worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://mock-backend:8080/api/v1",
            interval_seconds=0.1,
            client=httpx.Client(transport=httpx.MockTransport(health_handler)),
        )

        worker.start()
        # Chờ luồng khởi động và xử lý ít nhất một chu kỳ
        worker.msleep(250)
        assert worker.isRunning() is True

        worker.stop()
        assert worker.isRunning() is False

    def test_sync_worker_default_client_lifecycle(self, qapp, queue_mgr):
        """Kiểm thử khởi tạo client mặc định và đóng an toàn."""
        worker = OfflineSyncWorker(
            queue_manager=queue_mgr,
            backend_url="http://localhost:8080/api/v1",
        )
        client = worker._get_client()
        assert isinstance(client, httpx.Client)
        assert not client.is_closed

        worker._close_client()
        assert worker._internal_client is None
        worker.stop()
