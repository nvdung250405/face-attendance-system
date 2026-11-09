# Requirements Traceability Matrix (RTM)

> **Document type:** Canonical Artifact Contract  
> **Artifact:** Requirements Traceability Matrix (RTM)  
> **Primary Owner Skill:** `spec-driven-development`  
> **Canonical Destination Path:** `docs/specs/RTM.md`  
> **Status:** Approved  
> **Last updated:** 2026-11-08  

---

## 1. Bi-directional Traceability Matrix

Ma trận truy vết hai chiều liên kết từ Yêu cầu hệ thống ([`docs/specs/SRS.md`](SRS.md)) $\rightarrow$ Tính năng Cốt lõi ([`docs/features/`](../features/)) $\rightarrow$ Thiết kế Kiến trúc & Hợp đồng ([`docs/architecture.md`](../architecture.md), [`contracts/`](../../contracts/README.md)) $\rightarrow$ Bằng chứng Kiểm thử Thực nghiệm ([`acceptance-report.md`](../features/)):

| Mã Yêu Cầu (SRS) | Nội Dung Yêu Cầu Tóm Tắt | Lát Cắt Tính Năng (Feature Slice) | Ranh Giới Thiết Kế / Hợp Đồng | Minh Chứng Kiểm Thử Nghiệm Thu |
| :--- | :--- | :--- | :--- | :--- |
| **FR-SYS-001** | Phát hiện mặt YuNet $\le 25\text{ ms}$ | `FEAT-ATTEND-001` | `docs/architecture.md` §3 | `FEAT-ATTEND-001/acceptance-report.md` |
| **FR-SYS-002** | Chống giả mạo MiniFASNet $S \ge 0.85$ | `FEAT-ATTEND-001` | `docs/architecture.md` §4.2 | `FEAT-ATTEND-001/acceptance-report.md` |
| **FR-SYS-003** | So khớp ArcFace 512D RAM $\le 2\text{ ms}$ | `FEAT-ATTEND-001` | `ADR-001`, `data-contract.json` | `FEAT-ATTEND-001/acceptance-report.md` |
| **FR-SYS-004** | Gửi điểm danh `POST /kiosk/punch` | `FEAT-ATTEND-001` | `contracts/openapi.yaml` | `FEAT-ATTEND-001/acceptance-report.md` |
| **FR-SYS-005** | Giãn cách Cooldown 120 giây | `FEAT-ATTEND-001` | `docs/architecture.md` §3 | `FEAT-ATTEND-001/acceptance-report.md` |
| **FR-SYS-006** | Bàn phím số ảo PIN Pad dự phòng | `FEAT-FALLBACK-001` | `ADR-005`, `contracts/openapi.yaml` | `FEAT-FALLBACK-001/acceptance-report.md` |
| **FR-SYS-007** | Ký cam kết Informed Consent | `FEAT-ENROLL-001` | `data-contract.json`, `openapi.yaml` | `FEAT-ENROLL-001/acceptance-report.md` |
| **FR-SYS-008** | Cấp mã Onboarding OTP 48 giờ | `FEAT-ENROLL-001` | `contracts/openapi.yaml` | `FEAT-ENROLL-001/acceptance-report.md` |
| **FR-SYS-009** | Chụp 3 tư thế (Front, Left, Right) Kiosk | `FEAT-ENROLL-001` | `ADR-001`, `docs/architecture.md` | `FEAT-ENROLL-001/acceptance-report.md` |
| **FR-SYS-010** | Mã hóa 3 vector AES-256-GCM | `FEAT-ENROLL-001` | `ADR-003`, `data-contract.json` | `FEAT-ENROLL-001/acceptance-report.md` |
| **FR-SYS-011** | Thông báo hoàn tất STOMP qua OTP | `FEAT-ENROLL-001` | `contracts/stomp-websocket.yaml` | `FEAT-ENROLL-001/acceptance-report.md` |
| **FR-SYS-012** | Đệm SQLite WAL khi mất mạng ($\text{RPO}=0$) | `FEAT-OFFLINE-001` | `ADR-002`, `docs/architecture.md` | `FEAT-OFFLINE-001/acceptance-report.md` |
| **FR-SYS-013** | Tự động gửi bù theo lô tối đa 50 bản ghi | `FEAT-OFFLINE-001` | `ADR-002`, `contracts/openapi.yaml` | `FEAT-OFFLINE-001/acceptance-report.md` |
| **FR-SYS-014** | Đối soát ca kíp, ân hạn 15 phút | `FEAT-SHIFT-001` | `docs/architecture.md` §3 | `FEAT-SHIFT-001/acceptance-report.md` |
| **FR-SYS-015** | Phát sóng STOMP $\le 200\text{ ms}$ | `FEAT-LIVE-001` | `ADR-004`, `stomp-websocket.yaml` | `FEAT-LIVE-001/acceptance-report.md` |
| **FR-SYS-016** | Live Dashboard chớp sáng & cập nhật KPI | `FEAT-LIVE-001` | `docs/architecture.md` §3 | `FEAT-LIVE-001/acceptance-report.md` |
| **FR-SYS-017** | Giải trình chấm công trong 30 ngày | `FEAT-EXCUSE-001` | `contracts/openapi.yaml` | `FEAT-EXCUSE-001/acceptance-report.md` |
| **FR-SYS-018** | Khóa cứng kỳ công tháng bất biến | `FEAT-EXCUSE-001` | `contracts/openapi.yaml` | `FEAT-EXCUSE-001/acceptance-report.md` |
| **FR-SYS-019** | Xuất Excel an toàn chống CSV Injection | `FEAT-EXCUSE-001` | `contracts/openapi.yaml` | `FEAT-EXCUSE-001/acceptance-report.md` |
| **FR-SYS-020** | Tự động Hard Delete vector sau 20 ngày | `FEAT-COMPLY-001` | `docs/architecture.md` §4.1 | `FEAT-COMPLY-001/acceptance-report.md` |
| **FR-SYS-021** | Thực thi quyền rút Informed Consent | `FEAT-COMPLY-001` | `data-contract.json`, `openapi.yaml` | `FEAT-COMPLY-001/acceptance-report.md` |
| **FR-SYS-022** | Lưu vết nhật ký kiểm toán bất biến | `FEAT-COMPLY-001` | `docs/security/threat-model-fas.md` | `FEAT-COMPLY-001/acceptance-report.md` |

---

## 2. Traceability Verification Command

Toàn bộ hợp đồng liên kết trong ma trận được kiểm tra tính hợp lệ bằng lệnh:

```powershell
python scripts/verify_contracts.py --dir contracts
```

