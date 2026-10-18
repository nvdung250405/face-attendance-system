"""Module máy khách HTTP REST (KioskHttpClient) cho phân hệ Kiosk Desktop.

Tài liệu tham chiếu:
- API SPECS: API-KSK-001 đến API-KSK-005 (docs/service-docs/kiosk-app/api/api-specs.md)
- API DESIGN: APD-KSK-001 - KioskHttpClient (docs/service-docs/kiosk-app/api/api-design.md)
- API BUILD PLAN: ABL-KSK-001 (docs/service-docs/kiosk-app/api/api-build-plan.md)
"""

from datetime import UTC, datetime
from typing import Any

import httpx
import numpy as np

from config.logger import get_logger
from config.settings import settings

logger = get_logger("http_client")


class KioskNetworkError(Exception):
    """Lỗi mạng (timeout, mất kết nối, lỗi máy chủ 5xx)."""

    pass


class KioskOtpError(Exception):
    """Lỗi xác thực mã OTP kích hoạt (không hợp lệ, đã hết hạn, đã dùng)."""

    def __init__(self, message: str, code: str = "OTP_INVALID") -> None:
        super().__init__(message)
        self.code = code


class KioskPinError(Exception):
    """Lỗi xác thực mã PIN dự phòng (sai mã PIN, mã PIN bị khóa)."""

    def __init__(self, message: str, code: str = "PIN_INVALID", locked_until: str | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.locked_until = locked_until


class KioskCooldownConflict(Exception):
    """Lỗi trùng lặp quẹt thẻ trong khoảng Cooldown (409 Conflict)."""

    pass


class KioskHttpClient:
    """Đóng gói httpx.Client thực hiện gọi REST API với tự động tiêm Header và xử lý lỗi chuẩn."""

    def __init__(
        self,
        base_url: str | None = None,
        kiosk_id: str | None = None,
        secret_token: str | None = None,
        timeout: float = 3.0,
        client: httpx.Client | None = None,
    ) -> None:
        """Khởi tạo KioskHttpClient.

        Args:
            base_url: URL gốc của REST API (mặc định lấy từ settings: http://localhost:8080/api/v1).
            kiosk_id: Mã định danh trạm Kiosk (mặc định từ settings).
            secret_token: Khóa bảo mật Bearer token của Kiosk.
            timeout: Thời gian chờ tối đa cho mỗi request (mặc định 3.0s theo API Specs).
            client: Tuỳ chọn nạp client bên ngoài (hữu ích cho mock testing).
        """
        self.base_url: str = (base_url or settings.backend_url).rstrip("/")
        self.kiosk_id: str = kiosk_id or settings.kiosk_id
        self.secret_token: str = secret_token or settings.kiosk_secret_token
        self.timeout: float = timeout

        self._custom_client = client
        self._internal_client: httpx.Client | None = None

    def _get_headers(self) -> dict[str, str]:
        """Tạo các header bắt buộc theo chuẩn API SPECS Mục 1."""
        return {
            "Content-Type": "application/json; charset=UTF-8",
            "X-Kiosk-Id": self.kiosk_id,
            "Authorization": f"Bearer {self.secret_token}",
        }

    def _get_client(self) -> httpx.Client:
        """Lấy client hiện hành hoặc khởi tạo client mới với connection pooling."""
        if self._custom_client is not None:
            return self._custom_client
        if self._internal_client is None or self._internal_client.is_closed:
            self._internal_client = httpx.Client(
                timeout=self.timeout,
                headers=self._get_headers(),
            )
        return self._internal_client

    def close(self) -> None:
        """Đóng kết nối client nội bộ an toàn."""
        if self._internal_client is not None and not self._internal_client.is_closed:
            try:
                self._internal_client.close()
            except Exception:
                pass
            self._internal_client = None

    def check_health(self) -> bool:
        """Kiểm tra độ sẵn sàng của máy chủ backend."""
        client = self._get_client()
        candidates = [
            f"{self.base_url}/kiosk/health",
            f"{self.base_url}",
        ]
        for url in candidates:
            try:
                resp = client.get(url, timeout=self.timeout)
                if resp.status_code in (200, 204):
                    return True
            except (httpx.RequestError, httpx.HTTPStatusError):
                continue
        return False

    def send_punch(
        self,
        employee_id: int,
        verification_method: str = "VERIFICATION_FACE",
        confidence_score: float | None = None,
        punch_timestamp: str | None = None,
    ) -> dict[str, Any]:
        """Gửi điểm danh trực tiếp lên máy chủ trung tâm (API-KSK-001).

        Args:
            employee_id: Mã ID nhân viên khớp từ Gallery RAM.
            verification_method: 'VERIFICATION_FACE' hoặc 'VERIFICATION_PIN'.
            confidence_score: Điểm tương đồng Cosine (null nếu dùng PIN).
            punch_timestamp: Mốc thời gian ISO-8601 kèm múi giờ.

        Returns:
            dict[str, Any]: Dữ liệu phản hồi từ backend khi ghi nhận thành công.

        Raises:
            KioskCooldownConflict: Khi máy chủ trả về 409 COOLDOWN_ACTIVE.
            KioskNetworkError: Khi lỗi mạng hoặc timeout.
        """
        url = f"{self.base_url}/kiosk/punch"
        p_time = punch_timestamp or datetime.now(UTC).isoformat()
        payload = {
            "employeeId": employee_id,
            "punchTimestamp": p_time,
            "verificationMethod": verification_method,
            "confidenceScore": confidence_score,
            "kioskId": self.kiosk_id,
        }

        client = self._get_client()
        try:
            resp = client.post(url, json=payload, headers=self._get_headers(), timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                logger.info("send_punch thành công: emp_id=%d, score=%s", employee_id, confidence_score)
                return data
            elif resp.status_code == 409:
                err_data = resp.json() if resp.text else {}
                logger.warning("send_punch gặp 409 Conflict: %s", err_data)
                raise KioskCooldownConflict(err_data.get("message", "Nhân viên đang trong thời gian Cooldown"))
            else:
                msg = f"Máy chủ trả về HTTP {resp.status_code}: {resp.text}"
                logger.warning("send_punch thất bại: %s", msg)
                raise KioskNetworkError(msg)
        except (httpx.RequestError, httpx.TimeoutException) as exc:
            logger.warning("Lỗi mạng khi gọi send_punch: %s", exc)
            raise KioskNetworkError(str(exc)) from exc

    def sync_batch(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        """Đồng bộ bù danh sách bản ghi điểm danh ngoại tuyến (API-KSK-002).

        Args:
            records: Danh sách tối đa 50 bản ghi ngoại tuyến từ SQLite.

        Returns:
            dict[str, Any]: Dữ liệu phản hồi gồm syncedLocalIds, failedLocalIds.
        """
        url = f"{self.base_url}/kiosk/sync-batch"
        formatted_records = []
        for r in records:
            item = {
                "localQueueId": r.get("id") or r.get("localQueueId") or r.get("localId"),
                "employeeId": r.get("employee_id") or r.get("employeeId"),
                "punchTimestamp": r.get("punch_timestamp") or r.get("punchTimestamp") or r.get("punch_time"),
                "verificationMethod": r.get("verification_method") or r.get("verificationMethod") or "VERIFICATION_FACE",
                "confidenceScore": r.get("confidence_score") if r.get("confidence_score") is not None else r.get("confidenceScore"),
            }
            formatted_records.append(item)

        payload = {
            "kioskId": self.kiosk_id,
            "batchSize": len(formatted_records),
            "records": formatted_records,
        }

        client = self._get_client()
        try:
            resp = client.post(url, json=payload, headers=self._get_headers(), timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                logger.info("sync_batch thành công: gửi %d bản ghi", len(formatted_records))
                return data
            else:
                raise KioskNetworkError(f"HTTP {resp.status_code}: {resp.text}")
        except (httpx.RequestError, httpx.TimeoutException) as exc:
            raise KioskNetworkError(str(exc)) from exc

    def fetch_gallery(self) -> dict[str, Any]:
        """Tải toàn bộ danh mục vector 512D của nhân viên ACTIVE khi khởi động (API-KSK-003).

        Returns:
            dict[str, Any]: Dữ liệu gồm galleryVersion, totalCount, items.
        """
        url = f"{self.base_url}/kiosk/gallery"
        client = self._get_client()
        try:
            resp = client.get(url, headers=self._get_headers(), timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                logger.info("fetch_gallery thành công: %s", data.get("code", "GALLERY_FETCHED"))
                return data
            else:
                raise KioskNetworkError(f"HTTP {resp.status_code}: {resp.text}")
        except (httpx.RequestError, httpx.TimeoutException) as exc:
            raise KioskNetworkError(str(exc)) from exc

    def verify_otp(self, otp: str) -> dict[str, Any]:
        """Xác minh mã OTP 6 số để kích hoạt phiên đăng ký khuôn mặt (API-KSK-004).

        Args:
            otp: Chuỗi 6 chữ số.

        Returns:
            dict[str, Any]: Dữ liệu phiên đăng ký (sessionToken, employeeId, fullName, dept).

        Raises:
            KioskOtpError: Khi mã OTP sai hoặc hết hạn.
            KioskNetworkError: Khi lỗi mạng.
        """
        url = f"{self.base_url}/kiosk/verify-otp"
        payload = {
            "otp": otp,
            "kioskId": self.kiosk_id,
        }
        client = self._get_client()
        try:
            resp = client.post(url, json=payload, headers=self._get_headers(), timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                logger.info("verify_otp thành công: otp=%s", otp)
                return data
            elif resp.status_code in (400, 404):
                err = resp.json() if resp.text else {}
                msg = err.get("message", "Mã OTP không chính xác hoặc đã hết hạn")
                raise KioskOtpError(msg, code=err.get("code", "OTP_INVALID"))
            elif resp.status_code == 409:
                err = resp.json() if resp.text else {}
                msg = err.get("message", "Mã OTP này đã được sử dụng")
                raise KioskOtpError(msg, code="OTP_ALREADY_USED")
            else:
                raise KioskNetworkError(f"HTTP {resp.status_code}: {resp.text}")
        except (httpx.RequestError, httpx.TimeoutException) as exc:
            raise KioskNetworkError(str(exc)) from exc

    def enroll_face(
        self,
        otp: str,
        session_token: str,
        vector512: list[float] | np.ndarray,
    ) -> dict[str, Any]:
        """Nạp vector đặc trưng 512D mới lên máy chủ trung tâm (API-KSK-005).

        Args:
            otp: Mã OTP đã xác minh.
            session_token: Token phiên nhận được từ verify_otp.
            vector512: Vector 512D chuẩn hóa L2 = 1.0.

        Returns:
            dict[str, Any]: Dữ liệu hoàn tất đăng ký (employeeId, templateId, status).
        """
        url = f"{self.base_url}/kiosk/enroll-face"
        flat_vec = np.asarray(vector512, dtype=np.float32).flatten()
        if flat_vec.shape[0] != 512:
            raise ValueError(f"Vector phải có đúng 512 chiều, hiện tại: {flat_vec.shape[0]}D")

        # Chuẩn hóa L2
        norm = float(np.linalg.norm(flat_vec))
        if norm > 1e-6:
            flat_vec = flat_vec / norm

        payload = {
            "otp": otp,
            "sessionToken": session_token,
            "vector512": flat_vec.tolist(),
            "kioskId": self.kiosk_id,
        }
        client = self._get_client()
        try:
            resp = client.post(url, json=payload, headers=self._get_headers(), timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                logger.info("enroll_face thành công: session=%s", session_token[:8])
                return data
            else:
                raise KioskNetworkError(f"HTTP {resp.status_code}: {resp.text}")
        except (httpx.RequestError, httpx.TimeoutException) as exc:
            raise KioskNetworkError(str(exc)) from exc

    def verify_pin(self, employee_code: str, pin: str) -> dict[str, Any]:
        """Xác thực mã PIN 6 số qua Backend trước khi ghi nhận điểm danh (API-KSK-007).

        Args:
            employee_code: Mã nhân viên (ví dụ: 'NV-1042').
            pin: Chuỗi mã PIN 6 số.

        Returns:
            dict[str, Any]: Dữ liệu thẩm định (employeeId, employeeCode, fullName, department).

        Raises:
            KioskPinError: Khi mã PIN sai (401) hoặc đang bị khóa (423).
            KioskNetworkError: Khi gặp sự cố mạng hoặc timeout.
        """
        url = f"{self.base_url}/kiosk/verify-pin"
        payload = {
            "employeeCode": employee_code,
            "pin": pin,
        }
        client = self._get_client()
        try:
            resp = client.post(url, json=payload, headers=self._get_headers(), timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                logger.info("verify_pin thành công cho mã NV: %s", employee_code)
                return data
            elif resp.status_code == 401:
                err = resp.json() if resp.text else {}
                msg = err.get("message", "Mã PIN không chính xác")
                raise KioskPinError(msg, code=err.get("code", "PIN_INVALID"))
            elif resp.status_code == 423:
                err = resp.json() if resp.text else {}
                msg = err.get("message", "Mã PIN đang bị khóa do nhập sai nhiều lần")
                locked_until = err.get("data", {}).get("lockedUntil") if isinstance(err.get("data"), dict) else None
                raise KioskPinError(msg, code=err.get("code", "PIN_LOCKED"), locked_until=locked_until)
            else:
                raise KioskNetworkError(f"HTTP {resp.status_code}: {resp.text}")
        except (httpx.RequestError, httpx.TimeoutException) as exc:
            raise KioskNetworkError(str(exc)) from exc

