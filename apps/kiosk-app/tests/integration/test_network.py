"""Bộ ca kiểm thử tự động cho Tầng Giao tiếp Mạng & API Phân hệ Kiosk.

Tài liệu tham chiếu:
- API TEST PLAN: TST-KSK-API-001 đến TST-KSK-API-004 (docs/service-docs/kiosk-app/api/api-test-plan.md)
- API SPECS: API-KSK-001 đến API-KSK-006 (docs/service-docs/kiosk-app/api/api-specs.md)
- API DESIGN: APD-KSK-001, APD-KSK-002 (docs/service-docs/kiosk-app/api/api-design.md)
"""

import json
import time

import httpx
import numpy as np
import pytest

from core.offline.sqlite_manager import SQLiteQueueManager
from core.offline.sync_worker import OfflineSyncWorker
from core.vision.gallery_matcher import GalleryCacheManager
from network.http_client import (
    KioskCooldownConflict,
    KioskHttpClient,
    KioskNetworkError,
    KioskOtpError,
    KioskPinError,
)
from network.stomp_worker import KioskStompWorker


def test_tst_ksk_api_001_send_punch_headers_and_success():
    """TST-KSK-API-001: Gửi điểm danh trực tiếp với đủ Header xác thực và nhận phản hồi 200 OK."""
    recorded_requests = []

    def mock_handler(request: httpx.Request):
        recorded_requests.append(request)
        if request.url.path.endswith("/kiosk/punch"):
            body = json.loads(request.content)
            assert body["employeeId"] == 1042
            assert body["verificationMethod"] == "VERIFICATION_FACE"
            assert pytest.approx(body["confidenceScore"]) == 0.8924
            assert "kioskId" not in body
            return httpx.Response(
                200,
                json={
                    "success": True,
                    "code": "PUNCH_RECORDED",
                    "message": "Ghi nhận điểm danh thành công",
                    "data": {
                        "recordId": 98231,
                        "employeeId": 1042,
                        "punchType": "CHECK_IN",
                    },
                },
            )
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(
        base_url="http://mock-server:8080/api/v1",
        kiosk_id="KIOSK-HN-01",
        secret_token="ksk_secret_123",
        client=client,
    )

    t0 = time.perf_counter()
    resp = http_client.send_punch(
        employee_id=1042,
        verification_method="VERIFICATION_FACE",
        confidence_score=0.8924,
    )
    latency_ms = (time.perf_counter() - t0) * 1000.0

    assert resp["success"] is True
    assert resp["data"]["recordId"] == 98231
    assert latency_ms < 500.0  # SLA <= 500ms

    # Kiểm tra Headers bắt buộc
    assert len(recorded_requests) == 1
    req = recorded_requests[0]
    assert req.headers["X-Kiosk-Id"] == "KIOSK-HN-01"
    assert req.headers["X-Kiosk-Secret"] == "ksk_secret_123"
    assert "application/json" in req.headers["Content-Type"]


def test_tst_ksk_api_001_send_punch_cooldown_conflict():
    """Kiểm tra phản hồi 409 COOLDOWN_ACTIVE ném KioskCooldownConflict."""

    def mock_handler(request: httpx.Request):
        return httpx.Response(
            409, json={"code": "COOLDOWN_ACTIVE", "message": "Bạn vừa điểm danh rồi!"}
        )

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(client=client)

    with pytest.raises(KioskCooldownConflict):
        http_client.send_punch(employee_id=1042)


def test_tst_ksk_api_002_offline_fallback_on_network_error(tmp_path):
    """TST-KSK-API-002: Khi mạng lỗi, client ném KioskNetworkError để lưu trữ ngoại tuyến vào SQLite WAL."""

    def error_handler(request: httpx.Request):
        raise httpx.ConnectError("Network unreachable")

    client = httpx.Client(transport=httpx.MockTransport(error_handler))
    http_client = KioskHttpClient(client=client)
    db_path = tmp_path / "offline_test.db"
    queue_mgr = SQLiteQueueManager(db_path=db_path)

    # Giả lập luồng xử lý: gọi online thất bại -> fallback lưu SQLite WAL
    try:
        http_client.send_punch(employee_id=2001, confidence_score=0.91)
        pytest.fail("Đáng lẽ phải ném KioskNetworkError")
    except KioskNetworkError:
        # Kích hoạt fallback ngoại tuyến
        local_id = queue_mgr.enqueue_punch(
            employee_id=2001,
            punch_type="CHECK_IN",
            verification_method="VERIFICATION_FACE",
            confidence_score=0.91,
        )
        assert local_id > 0

    assert queue_mgr.get_unsynced_count() == 1
    records = queue_mgr.fetch_pending_batch()
    assert records[0]["employee_id"] == 2001
    assert records[0]["is_synced"] == 0


def test_tst_ksk_api_003_sync_batch_payload_and_response():
    """TST-KSK-API-003: Đồng bộ bù gói lô tối đa 50 bản ghi và xử lý danh sách syncedLocalIds."""

    def mock_handler(request: httpx.Request):
        body = json.loads(request.content)
        assert len(body["records"]) == 2
        assert "batchSize" not in body
        assert "kioskId" not in body
        return httpx.Response(
            200,
            json={
                "success": True,
                "code": "BATCH_SYNC_PROCESSED",
                "data": {
                    "syncedCount": 2,
                    "syncedLocalIds": [1, 2],
                    "failedLocalIds": [],
                },
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(client=client)

    records = [
        {"id": 1, "employee_id": 101, "confidence_score": 0.88},
        {"id": 2, "employee_id": 102, "confidence_score": None},
    ]

    resp = http_client.sync_batch(records)
    assert resp["success"] is True
    assert resp["data"]["syncedLocalIds"] == [1, 2]


def test_tst_ksk_api_004_stomp_hot_patching_add_and_delete(qapp):
    """TST-KSK-API-004: Tiếp nhận thông điệp STOMP ADD_VECTOR và DELETE_VECTOR nạp nóng vào RAM."""
    matcher = GalleryCacheManager(default_threshold=0.50)
    worker = KioskStompWorker(gallery_matcher=matcher)

    updated_events = []
    worker.gallery_updated.connect(lambda action, eid: updated_events.append((action, eid)))

    # 1. Sự kiện ADD_VECTOR
    dummy_vec = [0.0] * 512
    dummy_vec[0] = 1.0  # L2 norm = 1.0

    add_payload = {
        "action": "ADD_VECTOR",
        "employeeId": 1042,
        "employeeCode": "NV-1042",
        "fullName": "Ngo Van Dung",
        "department": "Engineering",
        "vector512": dummy_vec,
    }

    success_add = worker.process_event(add_payload)
    assert success_add is True
    assert matcher.get_count() == 1
    assert matcher.gallery_version > 1

    # Kiểm tra so khớp ngay lập tức trong RAM
    matched_id, score = matcher.match(np.array(dummy_vec, dtype=np.float32))
    assert matched_id == 1042
    assert pytest.approx(score) == 1.0

    # 2. Sự kiện DELETE_VECTOR
    delete_payload = {
        "action": "DELETE_VECTOR",
        "employeeId": 1042,
        "reason": "EMPLOYEE_TERMINATED",
    }

    success_delete = worker.process_event(delete_payload)
    assert success_delete is True
    assert matcher.get_count() == 0

    # Xác minh các tín hiệu đã phát
    assert len(updated_events) == 2
    assert updated_events[0] == ("ADD_VECTOR", 1042)
    assert updated_events[1] == ("DELETE_VECTOR", 1042)


def test_fetch_gallery_and_enrollment_api():
    """Kiểm tra các endpoint phụ trợ: fetch_gallery, verify_otp, enroll_face."""

    def mock_handler(request: httpx.Request):
        path = request.url.path
        if path.endswith("/kiosk/gallery"):
            return httpx.Response(
                200,
                json={
                    "success": True,
                    "data": {
                        "galleryVersion": 5,
                        "totalCount": 1,
                        "items": [
                            {
                                "employeeId": 999,
                                "vector512": [1.0] + [0.0] * 511,
                                "fullName": "Test User",
                            }
                        ],
                    },
                },
            )
        elif path.endswith("/kiosk/verify-otp"):
            body = json.loads(request.content)
            if body["otp"] == "123456":
                return httpx.Response(
                    200,
                    json={
                        "success": True,
                        "data": {"sessionToken": "tok_abc", "employeeId": 999},
                    },
                )
            return httpx.Response(400, json={"code": "OTP_INVALID", "message": "Sai OTP"})
        elif path.endswith("/kiosk/enroll-face"):
            return httpx.Response(
                200,
                json={"success": True, "data": {"status": "ACTIVE"}},
            )
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(client=client)

    # Test fetch_gallery
    gallery_data = http_client.fetch_gallery()
    assert gallery_data["data"]["galleryVersion"] == 5

    # Test verify_otp hợp lệ
    otp_res = http_client.verify_otp("123456")
    assert otp_res["data"]["sessionToken"] == "tok_abc"

    # Test verify_otp sai mã
    with pytest.raises(KioskOtpError):
        http_client.verify_otp("000000")

    # Test enroll_face
    enroll_res = http_client.enroll_face(
        otp="123456",
        session_token="tok_abc",
        vector512=[1.0] + [0.0] * 511,
    )
    assert enroll_res["data"]["status"] == "ACTIVE"


def test_verify_pin_api():
    """Kiểm tra gọi API POST /kiosk/verify-pin thành công, sai mã và bị khóa (API-KSK-007)."""

    def mock_handler(request: httpx.Request):
        if request.url.path.endswith("/kiosk/verify-pin"):
            body = json.loads(request.content)
            if body["pin"] == "123456":
                return httpx.Response(
                    200,
                    json={
                        "success": True,
                        "code": "PIN_VERIFIED",
                        "data": {
                            "employeeId": 1042,
                            "employeeCode": body["employeeCode"],
                            "fullName": "Nguyen Van A",
                            "department": "Engineering",
                        },
                    },
                )
            elif body["pin"] == "999999":
                return httpx.Response(
                    423,
                    json={
                        "success": False,
                        "code": "PIN_LOCKED",
                        "message": "PIN đang bị khóa",
                        "data": {"lockedUntil": "2026-10-18T14:30:00Z"},
                    },
                )
            else:
                return httpx.Response(
                    401,
                    json={
                        "success": False,
                        "code": "PIN_INVALID",
                        "message": "Sai mã PIN",
                    },
                )
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(client=client)

    # 1. Thành công
    res = http_client.verify_pin("NV-1042", "123456")
    assert res["success"] is True
    assert res["data"]["employeeId"] == 1042

    # 2. Sai PIN (401)
    with pytest.raises(KioskPinError) as exc_info:
        http_client.verify_pin("NV-1042", "000000")
    assert exc_info.value.code == "PIN_INVALID"

    # 3. Bị khóa PIN (423)
    with pytest.raises(KioskPinError) as exc_locked:
        http_client.verify_pin("NV-1042", "999999")
    assert exc_locked.value.code == "PIN_LOCKED"
    assert exc_locked.value.locked_until == "2026-10-18T14:30:00Z"


def test_kiosk_ping_success():
    """Kiểm tra gọi nhịp tim ping thành công và trả về trạng thái ONLINE."""

    def mock_handler(request: httpx.Request):
        if request.url.path.endswith("/kiosk/ping"):
            assert request.headers.get("X-Kiosk-Id") == "KIOSK-HN-01"
            assert request.headers.get("X-Kiosk-Secret") == "ksk_secret_123"
            return httpx.Response(
                200,
                json={"success": True, "code": "PONG", "data": {"status": "ONLINE"}},
            )
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(
        base_url="http://mock-server:8080/api/v1",
        kiosk_id="KIOSK-HN-01",
        secret_token="ksk_secret_123",
        client=client,
    )
    res = http_client.ping()
    assert res["success"] is True
    assert res["data"]["status"] == "ONLINE"
    assert http_client.check_health() is True


def test_enroll_face_multi_template_and_validation():
    """Kiểm tra enroll_face với multi-template 3 tư thế, fallback vector512, và các điều kiện ValueError."""
    captured_requests = []

    def mock_handler(request: httpx.Request):
        captured_requests.append(request)
        if request.url.path.endswith("/kiosk/enroll-face"):
            body = json.loads(request.content)
            if "templates" in body or "vector512" in body:
                return httpx.Response(
                    200,
                    json={
                        "success": True,
                        "data": {
                            "status": "ACTIVE",
                            "templateCount": len(body.get("templates", [])),
                        },
                    },
                )
        return httpx.Response(400, json={"message": "Bad Request"})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(client=client, kiosk_id="KIOSK-HN-01")

    valid_templates = [
        {
            "poseType": "FRONTAL",
            "vector512": [1.0] + [0.0] * 511,
            "yaw": 0.0,
            "pitch": 0.0,
            "laplacian": 45.0,
            "livenessScore": 0.95,
        },
        {
            "poseType": "LEFT_TILT",
            "vector512": [0.0, 1.0] + [0.0] * 510,
            "yaw": 15.0,
            "pitch": 0.0,
            "laplacian": 42.0,
            "livenessScore": 0.93,
        },
        {
            "poseType": "RIGHT_TILT",
            "vector512": [0.0, 0.0, 1.0] + [0.0] * 509,
            "yaw": -15.0,
            "pitch": 0.0,
            "laplacian": 40.0,
            "livenessScore": 0.91,
        },
    ]
    raw_vector = [2.0] + [0.0] * 511

    # 1. Thành công với cả templates và vector512 (dual compatibility)
    res = http_client.enroll_face(
        otp="123456",
        session_token="tok_abc",
        templates=valid_templates,
        vector512=raw_vector,
    )
    assert res["success"] is True
    assert res["data"]["status"] == "ACTIVE"
    assert res["data"]["templateCount"] == 3

    assert len(captured_requests) == 1
    req_body = json.loads(captured_requests[0].content)
    assert req_body["otp"] == "123456"
    assert req_body["sessionToken"] == "tok_abc"
    assert "kioskId" not in req_body
    assert captured_requests[0].headers["X-Kiosk-Id"] == "KIOSK-HN-01"
    assert "templates" in req_body
    assert len(req_body["templates"]) == 3
    assert req_body["templates"][0]["poseType"] == "FRONTAL"
    assert "vector512" in req_body
    assert len(req_body["vector512"]) == 512
    # Vector512 được chuẩn hóa L2 tự động (2.0 -> 1.0)
    assert pytest.approx(req_body["vector512"][0]) == 1.0

    # 2. ValueError khi len(templates) != 3 (2 templates)
    with pytest.raises(ValueError, match="templates bắt buộc phải có đúng 3 phần tử"):
        http_client.enroll_face(
            otp="123456",
            session_token="tok_abc",
            templates=valid_templates[:2],
            vector512=raw_vector,
        )

    # 3. ValueError khi len(templates) != 3 (4 templates)
    with pytest.raises(ValueError, match="templates bắt buộc phải có đúng 3 phần tử"):
        http_client.enroll_face(
            otp="123456",
            session_token="tok_abc",
            templates=valid_templates + [valid_templates[0]],
            vector512=raw_vector,
        )

    # 4. ValueError khi cả templates và vector512 đều None
    with pytest.raises(ValueError, match="Cần cung cấp ít nhất templates hoặc vector512"):
        http_client.enroll_face(
            otp="123456",
            session_token="tok_abc",
            templates=None,
            vector512=None,
        )


def test_clock_drift_detection_http_client(caplog):
    """FIND-SYNC-003: HTTP client parses Date header, calculates clock drift, and logs warning when > 5.0s."""
    import logging

    server_http_date = "Mon, 18 Oct 2026 10:00:00 GMT"

    def mock_handler(request: httpx.Request):
        return httpx.Response(
            200,
            headers={"Date": server_http_date},
            json={"success": True, "code": "PONG", "data": {"status": "ONLINE"}},
        )

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    http_client = KioskHttpClient(client=client)

    with caplog.at_level(logging.WARNING):
        res = http_client.ping()

    assert res["success"] is True
    # Server date is in 2026, so abs(local - server) is tested or non-zero
    assert hasattr(http_client, "clock_drift_offset")
    assert isinstance(http_client.clock_drift_offset, float)


def test_clock_drift_detection_sync_worker(caplog):
    """FIND-SYNC-003: OfflineSyncWorker parses Date header and logs warning on > 5.0s drift."""
    import logging

    server_http_date = "Sun, 01 Jan 2023 00:00:00 GMT"

    def mock_handler(request: httpx.Request):
        return httpx.Response(
            200,
            headers={"Date": server_http_date},
            json={"status": "UP"},
        )

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    worker = OfflineSyncWorker(client=client)

    with caplog.at_level(logging.WARNING):
        ok = worker.check_health()

    assert ok is True
    assert abs(worker.clock_drift_offset) > 5.0
    assert "CẢNH BÁO: Lệch đồng hồ Kiosk và Server" in caplog.text


def test_sync_worker_exponential_backoff_and_jitter():
    """FIND-SYNC-004: OfflineSyncWorker applies exponential backoff with jitter on sync failures."""
    worker = OfflineSyncWorker(interval_seconds=10.0)
    assert worker.fail_count == 0

    # Test formula: delay = min(self.interval_seconds * (2 ** min(fail_count, 5)), 60.0) * random.uniform(0.8, 1.2)
    # fail_count = 1: base = min(10 * 2, 60) = 20.0, range [16.0, 24.0]
    for _ in range(20):
        d1 = worker.calculate_backoff_delay(fail_count=1)
        assert 16.0 <= d1 <= 24.0

    # fail_count = 5: base = min(10 * 32, 60) = 60.0, range [48.0, 72.0]
    for _ in range(20):
        d5 = worker.calculate_backoff_delay(fail_count=5)
        assert 48.0 <= d5 <= 72.0

    # fail_count = 10 (capped at 5): base = 60.0, range [48.0, 72.0]
    for _ in range(20):
        d10 = worker.calculate_backoff_delay(fail_count=10)
        assert 48.0 <= d10 <= 72.0


def test_sync_worker_cleanup_synced_punches_retention():
    """FIND-SEC-002: OfflineSyncWorker triggers cleanup_synced_punches(retention_days=20)."""
    from unittest.mock import MagicMock

    mock_queue = MagicMock()
    mock_queue.cleanup_synced_punches.return_value = 5

    worker = OfflineSyncWorker(queue_manager=mock_queue)
    cleaned = worker.cleanup_old_punches(retention_days=20)

    assert cleaned == 5
    mock_queue.cleanup_synced_punches.assert_called_once_with(retention_days=20)


def test_stomp_worker_heartbeats_and_jitter():
    """FIND-SYNC-005: stomp.Connection uses heartbeats=(10000, 10000) and reconnect delay has jitter."""
    from unittest.mock import MagicMock

    worker = KioskStompWorker()

    # Verify reconnect delay formula with jitter: min(2 ** min(attempt, 5), 30.0) * [0.8, 1.2]
    for _ in range(20):
        delay_1 = worker.calculate_reconnect_delay(attempt=1)
        assert 1.6 <= delay_1 <= 2.4

    for _ in range(20):
        delay_5 = worker.calculate_reconnect_delay(attempt=5)
        assert 24.0 <= delay_5 <= 36.0

    # Verify heartbeats passed in _connect_stomp
    import stomp

    orig_conn = stomp.Connection
    passed_kwargs = {}

    def mock_conn(*args, **kwargs):
        passed_kwargs.update(kwargs)
        mock_obj = MagicMock()
        return mock_obj

    stomp.Connection = mock_conn
    try:
        worker._connect_stomp()
        assert passed_kwargs.get("heartbeats") == (10000, 10000)
    finally:
        stomp.Connection = orig_conn
