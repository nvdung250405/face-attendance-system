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
from core.vision.gallery_matcher import GalleryCacheManager
from network.http_client import (
    KioskCooldownConflict,
    KioskHttpClient,
    KioskNetworkError,
    KioskOtpError,
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
            assert body["kioskId"] == "KIOSK-HN-01"
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
    assert req.headers["Authorization"] == "Bearer ksk_secret_123"
    assert "application/json" in req.headers["Content-Type"]


def test_tst_ksk_api_001_send_punch_cooldown_conflict():
    """Kiểm tra phản hồi 409 COOLDOWN_ACTIVE ném KioskCooldownConflict."""
    def mock_handler(request: httpx.Request):
        return httpx.Response(409, json={"code": "COOLDOWN_ACTIVE", "message": "Bạn vừa điểm danh rồi!"})

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
        assert body["batchSize"] == 2
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
