---
title: Đặc tả Tính năng Quản lý Đơn Giải trình Công & Chốt Báo cáo An toàn (Attendance Excuse Processing & Secure Report Export)
version: 1.0
status: Approved
owner: Solution Architect & HR Operations Lead
type: spec
scope: SYS
---

# Feature Specification: Quản lý Đơn Giải trình Công & Chốt Báo cáo An toàn (FEAT-EXCUSE-001)

- **Mã tính năng**: `FEAT-EXCUSE-001`
- **Phiên bản kiến trúc**: v1.0 (Digital Excuse Workflow, Immutable Period Lock & Anti-Formula Injection Export)
- **Phân loại**: Core HR Operations & Security Feature (Liên kết 2 phân hệ: Web Portal $\leftrightarrow$ Central Backend)
- **Truy vết Yêu cầu Cốt lõi**: `FR-SYS-016`, `FR-SYS-024`, `SRS-007`, `SOL-SYS-020`, `SOL-SYS-021`, `DATA-BE-007`, `API-BE-009`
- **Tiêu chuẩn An toàn & Pháp lý**: **Khóa kỳ công bất biến (Period Lock)** & Phòng chống mã độc macro bảng tính **Anti-Formula Injection** theo khuyến cáo bảo mật **CWE-1236**

---

## 1. Bối cảnh & Mục tiêu Sản phẩm (Problem & Objective)

### 1.1. Vấn đề thực tế (Problem Statement)
Trong chu trình tính công và chốt bảng lương hàng tháng của doanh nghiệp:
1. **Ngoại lệ chấm công là tất yếu**: Nhân viên quên quẹt thẻ do vội, đi công tác đột xuất, gặp sự cố kỹ thuật tại trạm Kiosk, hoặc gặp khách hàng ngoài văn phòng.
2. **Quy trình giải trình bằng giấy tờ phiền hà**: Nhân viên phải in phiếu giải trình, xin chữ ký trưởng bộ phận rồi nộp lên phòng nhân sự; HR mất nhiều ngày nhập liệu thủ công lại vào phần mềm tính lương, dễ xảy ra thất lạc và sai sót.
3. **Rủi ro sửa dữ liệu sau khi chốt sổ**: Sau khi kế toán đã tính lương và gửi ngân hàng, dữ liệu công cũ vẫn có nguy cơ bị can thiệp lén lút sửa đổi nếu không có cơ chế khóa cứng kỳ công bất biến.
4. **Hiểm họa mã độc Formula Injection (CWE-1236)**: Khi xuất báo cáo bảng công định dạng file Excel (`.xlsx` hoặc `.csv`), nếu trường ghi chú, họ tên hoặc lý do giải trình chứa các ký tự kích hoạt công thức (`=cmd|' /C calc'!A0`, `@SUM(...)`, `+`), bảng tính Microsoft Excel của chuyên viên HR có thể bị chiếm quyền điều khiển và thực thi mã độc từ xa.

### 1.2. Mục tiêu & Nguyên tắc Thiết kế (Objective & Principles)
- **Số Hóa 100% Quy Trình Giải Trình (Paperless Excuse Workflow)**: Nhân viên nộp đơn trực tuyến trên Web Portal trong vòng 30 ngày kể từ ngày phát sinh sự cố; Chuyên viên HR xem xét minh chứng và phê duyệt/từ chối chỉ bằng một cú nhấp chuột.
- **Tự Động Cập Nhật Trạng Thái Bảng Công**: Khi đơn giải trình được phê duyệt, hệ thống tự động điều chỉnh bản ghi điểm danh tương ứng thành trạng thái `MANUAL_EXCUSE` và ghi nhận rõ ràng người duyệt kèm mốc thời gian.
- **Cơ Chế Khóa Kỳ Công Bất Biến (Strict Period Lock)**: Sau khi HR thực hiện thao tác chốt kỳ công tháng (`LOCKED`), toàn bộ dữ liệu quẹt thẻ, phân ca và đơn giải trình trong khoảng ngày đó bị đóng băng hoàn toàn. Mọi API chỉnh sửa đều bị từ chối; chỉ tài khoản Quản trị viên cấp cao (`ADMIN`) có quyền mở khóa lại kèm lý do kiểm toán bắt buộc.
- **Vô Hiệu Hóa Tuyệt Đối Mã Độc Formula Injection**: 100% các ô dữ liệu văn bản xuất ra file Excel nếu bắt đầu bằng các ký tự nguy hiểm (`=`, `+`, `-`, `@`) bắt buộc phải được tự động chèn ký tự nháy đơn (`'`) ở đầu chuỗi để Excel coi đó là văn bản thuần túy, triệt tiêu mọi khả năng thực thi macro.

---

## 2. Phạm vi Tính năng (Scope)

### 2.1. Trong phạm vi (In-Scope)
- **Web Portal (Self-Service & Admin)**:
  - Form nộp đơn giải trình công cho nhân viên (`SubmitExcuseModal.tsx`): Chọn ngày cần giải trình, lý do (Quên quẹt thẻ, Đi công tác, Sự cố Kiosk, Lý do khác), đính kèm ghi chú.
  - Màn hình theo dõi lịch sử đơn của nhân viên (`EmployeeExcuseHistoryView.tsx`): Trạng thái `PENDING`, `APPROVED`, `REJECTED`.
  - Màn hình quản lý và xét duyệt đơn cho HR (`AdminExcuseManagementView.tsx`): Danh sách chờ duyệt, nút Duyệt / Từ chối kèm lý do phản hồi.
  - Màn hình quản lý kỳ công (`AdminPayrollPeriodView.tsx`): Khóa kỳ công (`Lock Period`), Mở khóa (`Unlock Period`).
  - Nút kết xuất báo cáo bảng công định dạng Excel (`.xlsx`) an toàn.
- **Backend Service (Central Processing)**:
  - CRUD REST API nộp và tra cứu đơn giải trình (`/api/v1/employee/excuses`).
  - REST API xét duyệt đơn của HR (`/api/v1/admin/excuses/{id}/decide`).
  - Service quản lý kỳ công `PayrollPeriodService` kiểm tra khóa cứng (`assertPeriodNotLocked`) trước mọi thao tác sửa đổi dữ liệu công.
  - Service xuất báo cáo `ReportExportService` tích hợp bộ lọc làm sạch chuỗi (Sanitizer) chống Formula Injection (CWE-1236).

### 2.2. Ngoài phạm vi (Out-of-Scope)
- Tự động chuyển đổi file Excel sang phần mềm ngân hàng để chi trả tiền lương (doanh nghiệp sử dụng file Excel chuẩn để nhập vào cổng ngân hàng theo quy trình riêng).

---

## 3. Quy Tắc Bảo Mật Chống Chèn Mã Độc Formula Injection (CWE-1236)

Mọi chuỗi ký tự trong các cột người dùng có thể tự nhập (Họ tên, Mã NV, Tên phòng ban, Lý do giải trình, Ghi chú kiểm toán) trước khi đưa vào tệp Excel `.xlsx` bắt buộc phải qua bộ lọc biến đổi:

$$\text{Sanitize}(S) = \begin{cases} 
\text{"'"} + S, & \text{nếu } S \ne \text{null} \text{ và } S \text{ bắt đầu bằng } \{'=', '+', '-', '@'\} \\ 
S, & \text{trong các trường hợp còn lại} 
\end{cases}$$

Ví dụ thực tế:
- Đầu vào: `=cmd|'/C calc'!A0` $\rightarrow$ Đầu ra trong Excel: `'=cmd|'/C calc'!A0` (Hiển thị như chuỗi ký tự thường, không kích hoạt thực thi chương trình `calc.exe`).
- Đầu vào: `@SUM(1+1)` $\rightarrow$ Đầu ra trong Excel: `'@SUM(1+1)`.

---

## 4. User Stories & Tiêu chí Nghiệm thu (Acceptance Criteria - BDD)

### US-EXCUSE-001 — Nộp Đơn Giải Trình Công Trực Tuyến & Phê Duyệt Tự Động
- **Actor**: Nhân viên quên quẹt thẻ (`EMPLOYEE`) và Chuyên viên Nhân sự (`HR_MANAGER`).
- **Story**: Là nhân viên bị quên quẹt thẻ hôm qua, tôi muốn gửi đơn giải trình trực tuyến trên Cổng Web, để HR xem xét duyệt công cho tôi mà không cần viết giấy.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-EXCUSE-001 (Happy Path — Nộp đơn giải trình hợp lệ)**:
  - **Given**: Nhân viên `EMP-001` bị thiếu giờ quẹt ngày hôm qua (chưa quá 30 ngày).
  - **When**: Nhân viên chọn ngày, chọn lý do *"Quên quẹt thẻ lúc về"*, nhập ghi chú và nhấn *"Nộp đơn"*.
  - **Then**: Hệ thống lưu đơn vào bảng `attendance_excuses` với trạng thái `PENDING`, hiển thị trong lịch sử đơn của nhân viên.
- **AC-EXCUSE-002 (Validation — Chặn nộp đơn quá 30 ngày)**:
  - **Given**: Nhân viên chọn ngày phát sinh đã cách đây 45 ngày.
  - **When**: Nhấn *"Nộp đơn"*.
  - **Then**: Hệ thống từ chối lưu với thông báo lỗi: *"Chỉ được phép gửi đơn giải trình trong vòng 30 ngày kể từ ngày phát sinh sự cố"*.
- **AC-EXCUSE-003 (Happy Path — HR duyệt đơn và tự động bù công)**:
  - **Given**: Đơn giải trình đang ở trạng thái `PENDING`.
  - **When**: Chuyên viên HR nhấn *"Phê duyệt"* trên màn hình quản lý đơn.
  - **Then**:
    1. Trạng thái đơn chuyển sang `APPROVED`, lưu rõ người duyệt và mốc thời gian.
    2. Bản ghi công ngày đó được cập nhật/bổ sung với `verification_method = 'MANUAL_EXCUSE'`.
    3. Trạng thái công ngày đó được tính toán lại thành hợp lệ.

---

### US-EXCUSE-002 — Khóa Kỳ Công Tháng & Kết Xuất Báo Cáo Excel An Toàn
- **Actor**: Chuyên viên Nhân sự (`HR_MANAGER`).
- **Story**: Là chuyên viên nhân sự vào ngày chốt sổ cuối tháng, tôi muốn khóa cứng kỳ công và xuất file Excel bảng công chuẩn xác không chứa mã độc, để chuyển sang phòng kế toán chi lương an toàn.
- **Độ ưu tiên**: P1 (Bắt buộc).

#### Acceptance Criteria
- **AC-EXCUSE-004 (Happy Path — Khóa kỳ công tháng thành công)**:
  - **Given**: Kỳ công tháng 10/2026 đang mở (`UNLOCKED`).
  - **When**: HR nhấn nút *"Chốt kỳ công tháng 10/2026"*.
  - **Then**:
    1. Bảng `payroll_periods` cập nhật `is_locked = true`.
    2. Bất kỳ thao tác nộp đơn giải trình hoặc chỉnh sửa công nào rơi vào tháng 10/2026 sau thời điểm này đều bị Backend từ chối với HTTP `400 PERIOD_LOCKED`.
- **AC-EXCUSE-005 (Security Guard — Xuất file Excel tự động khử mã độc Formula Injection)**:
  - **Given**: Trong danh sách nhân viên có nhân sự cố tình nhập tên hoặc ghi chú là `=2+5+cmd|' /C calc'!A0`.
  - **When**: HR bấm nút *"Xuất báo cáo bảng công Excel"*.
  - **Then**:
    1. Backend biên dịch file `.xlsx` qua Apache POI.
    2. Ô chứa chuỗi trên được tự động làm sạch thành `'=2+5+cmd|' /C calc'!A0`.
    3. Khi mở file trên Microsoft Excel, ô hiển thị dưới dạng văn bản bình thường, không có cảnh báo bảo mật nguy hiểm và không thực thi mã độc.

---

## 5. Hợp đồng Giao tiếp & Lược Đồ CSDL (API & Data Contracts)

### 5.1. REST API Endpoints

#### 1. Nộp đơn giải trình công
- **Endpoint**: `POST /api/v1/employee/excuses`
- **Request Body (JSON)**:
```json
{
  "targetDate": "2026-11-01",
  "reasonType": "FORGOT_CHECK_OUT",
  "explanation": "Hôm qua phải ở lại họp đột xuất với khách hàng nên quên quẹt thẻ về",
  "proposedTime": "18:30:00"
}
```

#### 2. HR phê duyệt hoặc từ chối đơn
- **Endpoint**: `POST /api/v1/admin/excuses/{id}/decide`
- **Request Body (JSON)**:
```json
{
  "decision": "APPROVED",
  "reviewNote": "Đã xác nhận với trưởng phòng kinh doanh"
}
```

#### 3. Khóa kỳ công tháng
- **Endpoint**: `POST /api/v1/admin/payroll/lock`
- **Request Body (JSON)**:
```json
{
  "year": 2026,
  "month": 10
}
```

---

## 6. Ma Trận Kiểm Thử Nghiệm Thu (Acceptance Test Matrix)

| Mã Ca Kiểm Thử | Mục Tiêu Kiểm Thử | Phân Hệ | Kịch Bản & Thao Tác | Kết Quả Kỳ Vọng (Pass Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| **TC-EXC-001** | Nộp đơn giải trình hợp lệ | `web-portal` & `backend-service` | Nộp đơn trong hạn 30 ngày. | HTTP 200, đơn lưu với trạng thái `PENDING`. |
| **TC-EXC-002** | Chặn nộp đơn quá 30 ngày | `backend-service` | Chọn ngày cách đây 45 ngày. | HTTP 400 `EXCUSE_SUBMISSION_EXPIRED`. |
| **TC-EXC-003** | HR duyệt đơn giải trình | `web-portal` & `backend-service` | Bấm duyệt đơn `PENDING`. | Đơn thành `APPROVED`, bảng công được cập nhật bù. |
| **TC-EXC-004** | Khóa kỳ công tháng | `backend-service` | Bấm khóa kỳ công tháng 10. | Kỳ công thành `LOCKED`, chặn mọi chỉnh sửa sau đó. |
| **TC-EXC-005** | Chặn sửa dữ liệu khi đã khóa | `backend-service` | Thử nộp đơn vào kỳ công đã khóa. | HTTP 400 `PERIOD_LOCKED_FOR_MODIFICATION`. |
| **TC-EXC-006** | Khử mã độc Formula Injection | `backend-service` | Xuất file Excel có ô dữ liệu bắt đầu bằng `=cmd...`. | Ô trong Excel có dấu `'` ở đầu, không chạy lệnh. |

---

## 7. Tiêu Chí Sẵn Sàng & Phê Duyệt (Readiness & Approval Gate)

- [x] Quy trình giải trình công không giấy tờ được thiết kế chặt chẽ, có giới hạn thời gian 30 ngày.
- [x] Cơ chế khóa kỳ công bất biến bảo vệ toàn vẹn số liệu bảng lương.
- [x] Biện pháp an ninh chống Formula Injection (CWE-1236) được chứng minh đầy đủ.
- [x] Ma trận kiểm thử bao quát từ nghiệp vụ nộp/duyệt đơn đến kiểm thử an toàn xuất file Excel.

**Quyết định Phê duyệt (Approval Decision)**: **APPROVED**  
- **Đại diện Phê duyệt**: Solution Architect & HR Operations Lead  
- **Ngày Phê duyệt**: 2026-11-02

