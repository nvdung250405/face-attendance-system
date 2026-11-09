---
title: Đặc tả Tính năng Quản lý Ca kíp & Tự động Đánh giá Công (Shift Scheduling & Automated Attendance Evaluation)
version: 1.0
status: Approved
owner: Solution Architect & HR Systems Lead
type: spec
scope: SYS
---

# Feature Specification: Quản lý Ca kíp & Tự động Đánh giá Công (FEAT-SHIFT-001)

- **Mã tính năng**: `FEAT-SHIFT-001`
- **Phiên bản kiến trúc**: v1.0 (Flexible Shift Catalog, Overlap-Free Scheduling & Dynamic Evaluation Engine)
- **Phân loại**: Core Business Logic & Workforce Management Feature (Liên kết 2 phân hệ: Web Portal $\leftrightarrow$ Central Backend)
- **Truy vết Yêu cầu Cốt lõi**: `FR-SYS-012`, `FR-SYS-018`, `SOL-SYS-018`, `SOL-SYS-019`, `DATA-BE-004`, `API-BE-007`
- **Quy tắc Nghiệp vụ**: Thời gian ân hạn đi muộn mặc định **15 phút** (Grace Period), Tự động phân loại 4 trạng thái công (`ON_TIME`, `LATE`, `EARLY_LEAVE`, `ANOMALOUS`), và Ngăn chặn triệt để phân ca chồng lấn thời gian

---

## 1. Bối cảnh & Mục tiêu Sản phẩm (Problem & Objective)

### 1.1. Vấn đề thực tế (Problem Statement)
Trong các doanh nghiệp sản xuất và văn phòng quy mô từ vài trăm đến hàng nghìn nhân sự:
1. **Ca kíp phức tạp và linh hoạt**: Doanh nghiệp có nhiều loại hình ca làm việc khác nhau: Ca hành chính (08:00 - 17:00), Ca sản xuất 3 ca 4 kíp (Ca 1: 06:00 - 14:00, Ca 2: 14:00 - 22:00, Ca 3: 22:00 - 06:00 ngày hôm sau), Ca gãy của khối nhà hàng/bếp.
2. **Gánh nặng phân loại đi muộn/về sớm thủ công**: Chuyên viên HR mất hàng chục giờ mỗi kỳ công để so sánh từng mốc giờ quẹt thẻ với bảng phân ca excel, tính toán từng phút đi trễ trừ lương.
3. **Tranh chấp về thời gian ân hạn (Grace Period)**: Không có cơ chế tự động áp dụng thời gian cho phép đến muộn hợp lý (ví dụ: 15 phút do tắc đường hoặc xếp hàng quẹt thẻ), dẫn đến xung đột giữa người lao động và ban quản lý.
4. **Xung đột phân ca chồng lấn (Shift Overlapping)**: Nhân viên bị gán nhầm 2 ca làm việc có khung giờ giao thoa nhau trong cùng một ngày, gây lỗi không xác định được lượt quẹt thẻ thuộc về ca nào.

### 1.2. Mục tiêu & Nguyên tắc Thiết kế (Objective & Principles)
- **Quản lý Danh mục Ca Làm Việc Linh Hoạt (Dynamic Shift Catalog)**: Hỗ trợ cấu hình không giới hạn các mẫu ca làm việc: Giờ bắt đầu, giờ kết thúc, thời gian nghỉ giữa ca, và thời gian ân hạn riêng cho từng ca (0 - 60 phút, mặc định 15 phút).
- **Thuật Toán Kiểm Soát Chống Chồng Lấn Ca (Overlap-Free Assignment Engine)**: Tự động thẩm định giao khoảng thời gian (`isOverlapping`) trước khi lưu phân ca. Ngăn chặn triệt để việc gán 2 ca trùng giờ cho cùng một nhân sự.
- **Bộ Máy Đánh Giá Trạng Thái Công Tức Thì (Real-Time Punch Evaluation)**: Ngay khi nhận được một sự kiện điểm danh từ Kiosk, hệ thống lập tức tìm ca làm việc hợp lệ và phân loại chính xác thành 4 trạng thái:
  - `ON_TIME`: Quẹt thẻ trong khoảng `[Giờ bắt đầu, Giờ bắt đầu + Ân hạn]`.
  - `LATE`: Quẹt thẻ sau thời gian ân hạn, tự động tính số phút trễ chính xác.
  - `EARLY_LEAVE`: Quẹt thẻ ra trước giờ kết thúc ca làm việc.
  - `ANOMALOUS`: Quẹt thẻ hợp lệ nhưng nhân sự chưa được phân ca trước đó trong hệ thống.
- **Phân Ca Hàng Loạt Nhanh Chóng (Bulk Assignment)**: Hỗ trợ phân ca theo phòng ban, tổ đội sản xuất hoặc toàn bộ công ty cho một khoảng ngày tùy chọn chỉ với một thao tác.

---

## 2. Phạm vi Tính năng (Scope)

### 2.1. Trong phạm vi (In-Scope)
- **Web Portal (HR Admin Interface)**:
  - Màn hình quản lý danh mục ca làm việc: Tạo mới, sửa, xóa, kích hoạt/vô hiệu hóa ca (`AdminShiftManagementView.tsx`).
  - Màn hình lịch biểu phân ca trực quan theo dạng lưới (Grid View) theo ngày/tuần/tháng.
  - Công cụ phân ca hàng loạt theo phòng ban hoặc chọn danh sách nhân viên.
  - Cảnh báo trực quan màu đỏ khi phát hiện xung đột lịch làm việc.
- **Backend Service (Central Processing)**:
  - CRUD REST API quản lý ca làm việc (`/api/v1/admin/shifts`).
  - REST API phân ca cá nhân (`/api/v1/admin/shifts/assignments`) và phân ca hàng loạt (`/api/v1/admin/shifts/assignments/batch`).
  - Hàm kiểm tra toán học giao khoảng thời gian `isOverlapping(shift1, shift2)`.
  - Service đánh giá công `ShiftManagementService.evaluatePunch(employeeId, punchTime)` được tích hợp trực tiếp vào luồng xử lý điểm danh Kiosk.
  - Tự động gán nhãn `late_minutes = max(0, punch_time - shift_start)` tính từ mốc bắt đầu ca làm việc nếu quẹt vượt quá thời gian ân hạn.

### 2.2. Ngoài phạm vi (Out-of-Scope)
- Tính toán tiền phạt đi muộn hoặc quy đổi thành tiền lương (thuộc về phần mềm tính lương bên ngoài).
- Tự động đăng ký làm thêm giờ (Overtime / OT) — tính năng này được quản lý qua đơn từ riêng biệt.

---

## 3. Quy Tắc Nghiệp Vụ Đánh Giá Ca (Shift Evaluation Logic)

```
Ca làm việc: Bắt đầu lúc T_start, Thời gian ân hạn: Grace_Minutes (mặc định 15 phút)
Thời điểm nhân viên quẹt thẻ vào ca: T_punch

         T_start              T_start + Grace
            │                        │
────────────┼────────────────────────┼────────────────────────► Thời gian
  [QUẸT SỚM]│       [ĐÚNG GIỜ]       │       [ĐI MUỘN]
            │                        │
  Trạng thái: ON_TIME                │  Trạng thái: LATE
  late_minutes = 0                   │  late_minutes = (T_punch - T_start)
```

1. **Quy tắc Đúng giờ (`ON_TIME`)**:
   - Nếu $\text{T\_punch} \le \text{T\_start} + \text{Grace\_Minutes}$: Gán nhãn `status = 'ON_TIME'`, `late_minutes = 0`.
2. **Quy tắc Đi muộn (`LATE`)**:
   - Nếu $\text{T\_punch} > \text{T\_start} + \text{Grace\_Minutes}$: Gán nhãn `status = 'LATE'`, `late_minutes = \text{duration\_minutes}(\text{T\_punch} - \text{T\_start})$ (tính từ giờ bắt đầu ca).
3. **Quy tắc Về sớm (`EARLY_LEAVE`)**:
   - Nếu lượt quẹt ra $\text{T\_punch} < \text{T\_end}$: Gán nhãn `status = 'EARLY_LEAVE'`.
4. **Quy tắc Quẹt Bất thường (`ANOMALOUS`)**:
   - Nếu nhân viên có lượt quẹt tại Kiosk nhưng trong CSDL không tồn tại bất kỳ ca làm việc nào được phân công cho ngày đó: Gán nhãn `status = 'ANOMALOUS'`, cảnh báo cho HR để phân ca bổ sung.

---

## 4. User Stories & Tiêu chí Nghiệm thu (Acceptance Criteria - BDD)

### US-SHIFT-001 — Quản Lý Danh Mục Ca Làm Việc & Thiết Lập Thời Gian Ân Hạn
- **Actor**: Chuyên viên Nhân sự (`HR_MANAGER`).
- **Story**: Là chuyên viên nhân sự, tôi muốn tạo và cấu hình các ca làm việc với mốc giờ và thời gian ân hạn linh hoạt, để áp dụng chính sách kỷ luật lao động phù hợp cho từng khối phòng ban.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-SHIFT-001 (Happy Path — Tạo mới ca làm việc hợp lệ)**:
  - **Given**: HR đang ở màn hình Cấu hình Ca làm việc trên Web Portal.
  - **When**: HR nhập tên ca *"Ca Hành Chính Sáng"*, giờ bắt đầu `08:00`, giờ kết thúc `17:00`, thời gian ân hạn `15 phút` và nhấn *"Lưu ca làm việc"*.
  - **Then**: Hệ thống gửi `POST /api/v1/admin/shifts`, lưu bản ghi vào bảng `shifts` với trạng thái `ACTIVE` và hiển thị trong danh mục.
- **AC-SHIFT-002 (Validation — Chặn giờ kết thúc nhỏ hơn giờ bắt đầu cho ca trong ngày)**:
  - **Given**: HR tạo ca làm việc trong ngày (không phải ca đêm qua ngày).
  - **When**: HR nhập giờ bắt đầu `14:00` nhưng nhập giờ kết thúc `10:00`.
  - **Then**: Hệ thống từ chối lưu với thông báo lỗi: *"Giờ kết thúc ca làm việc phải lớn hơn giờ bắt đầu"*.

---

### US-SHIFT-002 — Phân Ca Nhân Sự & Kiểm Soát Chống Chồng Lấn Ca
- **Actor**: Chuyên viên Nhân sự (`HR_MANAGER`).
- **Story**: Là chuyên viên nhân sự, tôi muốn phân ca cho nhân viên hoặc hàng loạt phòng ban mà không sợ bị trùng giờ, để lịch làm việc của nhân sự luôn rõ ràng và chính xác.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-SHIFT-003 (Happy Path — Phân ca làm việc không chồng lấn)**:
  - **Given**: Nhân viên `EMP-001` chưa có lịch làm việc ngày `2026-11-05`.
  - **When**: HR gán ca *"Ca Sáng (06:00 - 14:00)"* cho nhân viên vào ngày `2026-11-05`.
  - **Then**: Hệ thống lưu thành công bản ghi vào bảng `shift_assignments`.
- **AC-SHIFT-004 (Conflict Guard — Chặn đứng phân ca chồng lấn thời gian)**:
  - **Given**: Nhân viên `EMP-001` đã được phân *"Ca Sáng (06:00 - 14:00)"* ngày `2026-11-05`.
  - **When**: HR cố tình gán thêm *"Ca Hành Chính (08:00 - 17:00)"* cho cùng nhân viên trong ngày đó.
  - **Then**:
    1. Thuật toán `isOverlapping` phát hiện khoảng thời gian `[08:00 - 14:00]` bị giao thoa giữa 2 ca.
    2. Backend từ chối với HTTP `409 Conflict` kèm thông báo: *"Xung đột lịch làm việc: Ca Hành Chính chồng lấn thời gian với Ca Sáng đã gán trước đó"*.
    3. Không có bản ghi nào bị ghi đè hay sinh trùng lặp.

---

### US-SHIFT-003 — Tự Động Đánh Giá Trạng Thái Công Khi Nhân Viên Điểm Danh
- **Actor**: Hệ thống tính công tự động (Backend Engine).
- **Story**: Là quản lý nhân sự, tôi muốn khi nhân viên quẹt mặt tại Kiosk, hệ thống tự động gán nhãn đúng giờ hoặc tính số phút đi muộn, để tôi không phải tính toán thủ công cuối tháng.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-SHIFT-005 (Happy Path — Quẹt thẻ trong thời gian ân hạn được tính đúng giờ)**:
  - **Given**: Ca làm việc quy định bắt đầu lúc `08:00`, ân hạn 15 phút (cho phép đến `08:15`).
  - **When**: Nhân viên quẹt thẻ lúc `08:12:30`.
  - **Then**: Bản ghi điểm danh được lưu với `status = 'ON_TIME'`, `late_minutes = 0`.
- **AC-SHIFT-006 (Business Rule — Quẹt thẻ sau thời gian ân hạn bị tính đi muộn)**:
  - **Given**: Ca làm việc bắt đầu lúc `08:00`, ân hạn 15 phút.
  - **When**: Nhân viên quẹt thẻ lúc `08:25:00` (sau ân hạn 10 phút).
  - **Then**: Bản ghi điểm danh được lưu với `status = 'LATE'`, `late_minutes = 25` (tính từ mốc bắt đầu 08:00).

---

## 5. Hợp đồng Giao tiếp & Lược Đồ CSDL (API & Data Contracts)

### 5.1. REST API Quản lý Ca & Phân Ca

#### 1. Tạo mới ca làm việc
- **Endpoint**: `POST /api/v1/admin/shifts`
- **Xác thực**: Bearer JWT (Role `HR_MANAGER` hoặc `ADMIN`)
- **Request Body (JSON)**:
```json
{
  "shiftCode": "CA-HC",
  "shiftName": "Ca Hành Chính Chuẩn",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "graceMinutes": 15,
  "description": "Áp dụng cho khối văn phòng"
}
```

#### 2. Phân ca hàng loạt theo danh sách nhân sự
- **Endpoint**: `POST /api/v1/admin/shifts/assignments/batch`
- **Request Body (JSON)**:
```json
{
  "shiftId": 1,
  "employeeIds": [101, 102, 103, 104],
  "startDate": "2026-11-01",
  "endDate": "2026-11-30"
}
```
- **Response `200 OK` (JSON)**:
```json
{
  "assignedCount": 120,
  "conflictCount": 0,
  "message": "Phân ca thành công cho 4 nhân sự trong tháng 11/2026"
}
```

### 5.2. Lược Đồ CSDL PostgreSQL 16
```sql
CREATE TABLE shifts (
    id BIGSERIAL PRIMARY KEY,
    shift_code VARCHAR(30) UNIQUE NOT NULL,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_minutes INTEGER NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shift_assignments (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES users(id),
    shift_id BIGINT NOT NULL REFERENCES shifts(id),
    work_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_date_shift UNIQUE (employee_id, work_date, shift_id)
);

CREATE INDEX idx_assignment_emp_date ON shift_assignments (employee_id, work_date);
```

---

## 6. Ma Trận Kiểm Thử Nghiệm Thu (Acceptance Test Matrix)

| Mã Ca Kiểm Thử | Mục Tiêu Kiểm Thử | Phân Hệ | Kịch Bản & Thao Tác | Kết Quả Kỳ Vọng (Pass Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SFT-001** | Tạo ca làm việc mới | `web-portal` & `backend-service` | Nhập thông tin ca chuẩn 08:00 - 17:00, ân hạn 15p. | HTTP 200, ca lưu vào CSDL, hiển thị trên Web. |
| **TC-SFT-002** | Chặn giờ kết thúc < giờ bắt đầu | `backend-service` | Giờ bắt đầu 17:00, kết thúc 08:00 không cờ qua đêm. | HTTP 400 `INVALID_TIME_RANGE`. |
| **TC-SFT-003** | Phân ca thành công | `backend-service` | Gán ca sáng cho nhân viên chưa có lịch. | Phân ca lưu vào `shift_assignments`. |
| **TC-SFT-004** | Chặn phân ca chồng lấn | `backend-service` | Gán tiếp ca trùng giờ trong cùng ngày. | HTTP 409 `SHIFT_OVERLAPPING_CONFLICT`. |
| **TC-SFT-005** | Đánh giá quẹt thẻ đúng giờ | `backend-service` | Quẹt thẻ lúc 08:14 cho ca 08:00 (ân hạn 15p). | `status = 'ON_TIME'`, `late_minutes = 0`. |
| **TC-SFT-006** | Đánh giá quẹt thẻ đi muộn | `backend-service` | Quẹt thẻ lúc 08:30 cho ca 08:00 (ân hạn 15p). | `status = 'LATE'`, `late_minutes = 30`. |

---

## 7. Tiêu Chí Sẵn Sàng & Phê Duyệt (Readiness & Approval Gate)

- [x] Quy tắc nghiệp vụ đánh giá ca và tính số phút đi muộn được định nghĩa toán học rõ ràng.
- [x] Thuật toán phát hiện xung đột chồng lấn ca được thiết kế an toàn.
- [x] Lược đồ CSDL và hợp đồng REST API đầy đủ.
- [x] Ma trận kiểm thử bao quát các tình huống hợp lệ, lỗi giờ, xung đột ca và đánh giá đúng giờ/đi muộn.

**Quyết định Phê duyệt (Approval Decision)**: **APPROVED**  
- **Đại diện Phê duyệt**: Solution Architect & HR Systems Lead  
- **Ngày Phê duyệt**: 2026-11-02

