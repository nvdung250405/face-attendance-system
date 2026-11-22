# Requirements Traceability Matrix (RTM)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Requirements Traceability Matrix (RTM)  
> **Canonical Destination Path:** `docs/analysis/rtm.md`  
> **Status:** Approved  
> **Last updated:** 2026-11-22  

---

## 1. Bi-directional Traceability Matrix

Ma trận truy vết hai chiều liên kết từ Yêu cầu hệ thống ([`docs/analysis/srs.md`](srs.md)) $\rightarrow$ Tính năng Cốt lõi ([`docs/features/`](../README.md#3-danh-muc-8-lat-cat-tinh-nang-cuc-bo-docsfeatures)) $\rightarrow$ Thiết kế Kiến trúc & Hợp đồng ([`docs/design/architecture.md`](../design/architecture.md), [`contracts/`](../../contracts/README.md)) $\rightarrow$ Minh chứng Đặc tả Tính năng:

| Mã Yêu Cầu (SRS) | Nội Dung Yêu Cầu Tóm Tắt | Lát Cắt Tính Năng (Feature Slice) | Ranh Giới Thiết Kế / Hợp Đồng | Đặc Tả & Tiêu Chí Nghiệm Thu |
| :--- | :--- | :--- | :--- | :--- |
| **FR-SYS-001** | Phát hiện mặt YuNet $\le 25\text{ ms}$ | `FEAT-001-attend` | `docs/design/architecture.md` §3 | `docs/features/FEAT-001-attend/spec.md` |
| **FR-SYS-002** | Chống giả mạo MiniFASNet $S \ge 0.85$ | `FEAT-001-attend` | `docs/design/security.md` | `docs/features/FEAT-001-attend/spec.md` |
| **FR-SYS-003** | So khớp ArcFace 512D RAM $\le 2\text{ ms}$ | `FEAT-001-attend` | `ADR-001`, `data-contract.json` | `docs/features/FEAT-001-attend/spec.md` |
| **FR-SYS-004** | Gửi điểm danh `POST /kiosk/punch` | `FEAT-001-attend` | `contracts/openapi.yaml` | `docs/features/FEAT-001-attend/spec.md` |
| **FR-SYS-005** | Giãn cách Cooldown 120 giây | `FEAT-001-attend` | `docs/design/architecture.md` §3 | `docs/features/FEAT-001-attend/spec.md` |
| **FR-SYS-006** | Bàn phím số ảo PIN Pad dự phòng | `FEAT-005-fallback` | `ADR-005`, `contracts/openapi.yaml` | `docs/features/FEAT-005-fallback/spec.md` |
| **FR-SYS-007** | Ký cam kết Informed Consent | `FEAT-003-enroll` | `data-contract.json`, `openapi.yaml` | `docs/features/FEAT-003-enroll/spec.md` |
| **FR-SYS-008** | Cấp mã Onboarding OTP 48 giờ | `FEAT-003-enroll` | `contracts/openapi.yaml` | `docs/features/FEAT-003-enroll/spec.md` |
| **FR-SYS-009** | Chụp 3 tư thế (Front, Left, Right) Kiosk | `FEAT-003-enroll` | `ADR-001`, `docs/design/architecture.md` | `docs/features/FEAT-003-enroll/spec.md` |
| **FR-SYS-010** | Mã hóa 3 vector AES-256-GCM | `FEAT-003-enroll` | `ADR-003`, `data-contract.json` | `docs/features/FEAT-003-enroll/spec.md` |
| **FR-SYS-011** | Thông báo hoàn tất STOMP qua OTP | `FEAT-003-enroll` | `contracts/stomp-websocket.yaml` | `docs/features/FEAT-003-enroll/spec.md` |
| **FR-SYS-012** | Đệm SQLite WAL khi mất mạng ($\text{RPO}=0$) | `FEAT-007-offline` | `ADR-002`, `docs/design/architecture.md` | `docs/features/FEAT-007-offline/spec.md` |
| **FR-SYS-013** | Tự động gửi bù theo lô tối đa 50 bản ghi | `FEAT-007-offline` | `ADR-002`, `contracts/openapi.yaml` | `docs/features/FEAT-007-offline/spec.md` |
| **FR-SYS-014** | Đối soát ca kíp, ân hạn 15 phút | `FEAT-008-shift` | `docs/design/architecture.md` §3 | `docs/features/FEAT-008-shift/spec.md` |
| **FR-SYS-015** | Phát sóng STOMP $\le 200\text{ ms}$ | `FEAT-006-monitor` | `ADR-004`, `contracts/stomp-websocket.yaml` | `docs/features/FEAT-006-monitor/spec.md` |
| **FR-SYS-016** | Live Dashboard chớp sáng & cập nhật KPI | `FEAT-006-monitor` | `docs/design/architecture.md` §3 | `docs/features/FEAT-006-monitor/spec.md` |
| **FR-SYS-017** | Giải trình chấm công trong 30 ngày | `FEAT-004-excuse` | `contracts/openapi.yaml` | `docs/features/FEAT-004-excuse/spec.md` |
| **FR-SYS-018** | Khóa cứng kỳ công tháng bất biến | `FEAT-004-excuse` | `contracts/openapi.yaml` | `docs/features/FEAT-004-excuse/spec.md` |
| **FR-SYS-019** | Xuất Excel an toàn chống CSV Injection | `FEAT-004-excuse` | `contracts/openapi.yaml` | `docs/features/FEAT-004-excuse/spec.md` |
| **FR-SYS-020** | Tự động Hard Delete vector sau 20 ngày | `FEAT-002-comply` | `docs/design/architecture.md` §4.1 | `docs/features/FEAT-002-comply/spec.md` |
| **FR-SYS-021** | Thực thi quyền rút Informed Consent | `FEAT-002-comply` | `data-contract.json`, `openapi.yaml` | `docs/features/FEAT-002-comply/spec.md` |
| **FR-SYS-022** | Lưu vết nhật ký kiểm toán bất biến | `FEAT-002-comply` | `docs/design/security.md` | `docs/features/FEAT-002-comply/spec.md` |

---

## 2. Traceability Verification Command

Toàn bộ hợp đồng liên kết trong ma trận được kiểm tra tính hợp lệ bằng lệnh:

```powershell
python scripts/verify_contracts.py --dir contracts
```

