# Centralized Machine-Executable Contracts (`contracts/`)

> **SDLC Stage**: 3. Architecture & Centralized Contracts (`workflows/full-sdlc.md`)  
> **Quy chuẩn thực thi**: Native formats (OpenAPI 3.1, STOMP 1.2 WebSocket, JSON Schema Draft 2020-12)  
> **Lệnh kiểm định tự động**: `python scripts/verify_contracts.py --dir contracts`

---

## 1. Danh mục Hợp đồng Tập trung

| Tệp Hợp Đồng | Định Dạng Chuẩn | Phạm Vi Nghiệp Vụ | Công Nghệ Giao Tiếp |
| :--- | :--- | :--- | :--- |
| [**`openapi.yaml`**](openapi.yaml) | OpenAPI 3.1.0 (`.yaml`) | 44 REST API Endpoints (Auth, Kiosk Punch, Sync, Admin, Excuse, Reports) | HTTP REST, RFC 7807 Problem Details |
| [**`stomp-websocket.yaml`**](stomp-websocket.yaml) | STOMP 1.2 Protocol (`.yaml`) | Kênh phát sóng sự kiện thời gian thực `/topic/live-attendance`, `/topic/enrollment/{otp}`, `/topic/kiosk-gallery` | SockJS / WebSocket STOMP |
| [**`data-contract.json`**](data-contract.json) | JSON Schema 2020-12 (`.json`) | Thực thể miền cốt lõi: Mẫu sinh trắc 3 tư thế ArcFace 512D, Bản ghi điểm danh, Cam kết Informed Consent | Wire serialization, DB DDL mapping |

---

## 2. Hướng dẫn Kiểm định Hợp đồng

Kiểm tra cú pháp và cấu trúc toàn bộ hợp đồng trong thư mục này bằng script kiểm định tự động:

```powershell
python scripts/verify_contracts.py --dir contracts
```

