# META — Metadata & Quy ước Quản trị Bộ tài liệu SDLC

> **Vị trí tài liệu:** `docs/meta.md`  
> **Phiên bản:** 1.0  
> **Ngày hiệu lực:** 2026-10-02  
> **Trạng thái:** Active / Canonical  
> **Mục đích:** Định nghĩa cấu trúc cây tài liệu, danh mục đăng ký (Registry), quy ước định danh (Conventions), hệ thống schema chuẩn hóa, quy tắc kiểm tra (Quality Gates) và cơ chế truy vết (Traceability) cho toàn bộ hệ thống tài liệu SDLC ở cả hai cấp độ: **System-level** và **Service-level**.

---

## 1. Document Tree (Cây Cấu trúc Tài liệu)

Hệ thống tài liệu được tổ chức phân cấp rõ ràng theo hai cấp độ: Cấp Hệ thống (`system-docs`) và Cấp Dịch vụ (`service-docs`):

```text
docs/
│
├── meta.md                                      # Metadata và quy ước quản lý của toàn bộ bộ tài liệu.
│                                                # Lớp quản trị document system, không phải artifact trong SDLC.
│
├── system-docs/                                 # TÀI LIỆU CẤP HỆ THỐNG (SYSTEM-LEVEL)
│   ├── info.md                                  # Kho nghiên cứu, sự thật và bằng chứng về đề tài.
│   ├── tech-tool-stack.md                       # Công nghệ, framework, runtime, nền tảng và công cụ dự án.
│   ├── pi.md                                    # Khởi tạo dự án: mục tiêu, phạm vi, định hướng và quyết định khởi tạo.
│   │
│   ├── srs/                                     # Phân hệ Đặc tả Yêu cầu Hệ thống
│   │   ├── srs.md                               # Yêu cầu tổng thể, ngữ cảnh hệ thống (ACT, EXT) và cross-cutting.
│   │   ├── fr-nfr-specs.md                      # Đặc tả chức năng (FR) và phi chức năng (NFR) toàn hệ thống.
│   │   ├── ui-ux-specs.md                       # Đặc tả trải nghiệm người dùng, luồng tương tác cấp hệ thống.
│   │   ├── api-specs.md                         # Đặc tả giao diện/interface truyền thông liên hệ thống.
│   │   └── data-specs.md                        # Đặc tả thực thể dữ liệu, tính toàn vẹn và chính sách bảo vệ dữ liệu.
│   │
│   ├── dds/                                     # Phân hệ Thiết kế Chi tiết Hệ thống
│   │   ├── dds.md                               # Thiết kế kiến trúc tổng thể (ARC), ranh giới service và cross-cutting.
│   │   ├── fr-nfr-design.md                     # Thiết kế hiện thực các giải pháp chức năng & phi chức năng (SOL).
│   │   ├── ui-ux-design.md                      # Thiết kế chi tiết hệ thống giao diện, design system, tokens (UXD).
│   │   ├── api-design.md                        # Thiết kế chi tiết giao thức, schema API REST/WebSocket (APD).
│   │   └── data-design.md                       # Thiết kế mô hình dữ liệu quan hệ, lưu trữ và luồng đồng bộ (DTD).
│   │
│   └── plans/                                   # Phân hệ Kế hoạch Hệ thống
│       ├── project-plan.md                      # Kế hoạch tổng thể, các giai đoạn (Phase), mốc (Milestone) và rủi ro.
│       ├── foundation-setup-plan.md             # Kế hoạch chuẩn bị nền tảng chung toàn hệ thống trước khi build.
│       ├── build-plan.md                        # Kế hoạch xây dựng & tích hợp xuyên phân hệ.
│       ├── test-plan.md                         # Kế hoạch kiểm thử tích hợp và nghiệm thu toàn hệ thống.
│       └── deploy-plan.md                       # Kế hoạch phát hành, triển khai môi trường và dự phòng rollback.
│
└── service-docs/                                # TÀI LIỆU CẤP DỊCH VỤ (SERVICE-LEVEL)
    │                                            # Áp dụng cho từng service độc lập (kiosk-app, backend-service, web-portal)
    ├── <service-name>/
    │   ├── core/                                # [Bắt buộc] Khối nghiệp vụ cốt lõi của service
    │   │   ├── fsp.md                           # Kế hoạch thiết lập nền tảng riêng của service (Foundation Setup Plan).
    │   │   ├── fr-nfr-specs.md                  # Yêu cầu chức năng và phi chức năng thuộc trách nhiệm service.
    │   │   ├── fr-nfr-design.md                 # Thiết kế chi tiết hiện thực giải pháp của service.
    │   │   ├── fr-nfr-build-plan.md             # Kế hoạch xây dựng thành phần nghiệp vụ cốt lõi.
    │   │   └── test-plan.md                     # Kế hoạch kiểm thử nội bộ service.
    │   │
    │   ├── ui-ux/                               # [Tùy chọn] Chỉ có khi service có tương tác trực tiếp với người dùng
    │   │   ├── ui-ux-specs.md                   # Đặc tả luồng tương tác và trải nghiệm người dùng của service.
    │   │   ├── ui-ux-design.md                  # Thiết kế chi tiết giao diện, layout và visual behavior của service.
    │   │   └── ui-ux-build-plan.md              # Kế hoạch thi công thành phần giao diện của service.
    │   │
    │   ├── api/                                 # [Tùy chọn] Chỉ có khi service cung cấp hoặc tiêu thụ interface bên ngoài
    │   │   ├── api-specs.md                     # Đặc tả interface, hợp đồng dữ liệu vào/ra của service.
    │   │   ├── api-design.md                    # Thiết kế chi tiết endpoint, schema, serialization và security.
    │   │   └── api-build-plan.md                # Kế hoạch triển khai tích hợp giao tiếp của service.
    │   │
    │   └── data/                                # [Tùy chọn] Chỉ có khi service chịu trách nhiệm lưu trữ bền vững (DB/Cache)
    │       ├── data-specs.md                    # Đặc tả thực thể dữ liệu và ràng buộc thuộc quyền sở hữu của service.
    │       ├── data-design.md                   # Thiết kế chi tiết lược đồ bảng, chỉ mục và lưu trữ của service.
    │       └── data-build-plan.md               # Kế hoạch khởi tạo CSDL, migration và cấu hình lưu trữ.
```

> **Nguyên tắc kích hoạt nhánh service:**  
> Các nhánh `ui-ux/`, `api/`, `data/` không bắt buộc hiện diện ở mọi service. Chúng chỉ được tạo lập khi service có trách nhiệm kỹ thuật thực tế tương ứng.

---

## 2. Document Registry (Sổ Đăng ký Tài liệu)

Bảng phân công vai trò, nguồn dữ liệu đầu vào (Upstream), đầu ra (Downstream) và điều kiện áp dụng cho từng tệp tài liệu:

| Mã Leaf | Tên Tệp | Cấp độ | Mục đích Kỹ thuật & Trách nhiệm | Upstream | Downstream | Điều kiện Áp dụng |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `INFO` | `info.md` | System | Kho dữ liệu nghiên cứu, khảo sát thực tế và phân tích | Nguồn khảo sát ngoài | PI, SRS, Specs | Bắt buộc |
| `STACK` | `tech-tool-stack.md` | System | Lựa chọn công nghệ, runtime, thư viện và công cụ | INFO, PI | DDS, FSP, Plans | Bắt buộc |
| `PI` | `pi.md` | System | Khởi tạo dự án: mục tiêu, phạm vi và quyết định nền tảng | INFO | SRS, STACK, PP | Bắt buộc |
| `SRS` | `srs/srs.md` | System | Ngữ cảnh hệ thống, actor, external system và cross-cutting | PI, INFO | Specs, DDS | Bắt buộc |
| `SPEC-FR` | `srs/fr-nfr-specs.md` | System | Danh mục yêu cầu chức năng (FR) và phi chức năng (NFR) | SRS, PI | DDS, Test Plan | Bắt buộc |
| `SPEC-UI` | `srs/ui-ux-specs.md` | System | Đặc tả hành trình người dùng và trải nghiệm cấp hệ thống | SRS, SPEC-FR | UI Design, Test Plan | Bắt buộc nếu có UI |
| `SPEC-API`| `srs/api-specs.md` | System | Đặc tả giao diện truyền thông trung lập công nghệ | SRS, SPEC-FR | API Design, Test Plan | Bắt buộc nếu có API |
| `SPEC-DAT`| `srs/data-specs.md` | System | Đặc tả thực thể dữ liệu, quy tắc toàn vẹn và vòng đời | SRS, SPEC-FR | Data Design, Test Plan| Bắt buộc nếu có data |
| `DDS` | `dds/dds.md` | System | Kiến trúc tổng thể, ranh giới phân rã service và cross-cutting | SRS, STACK | Service Docs, Plans | Bắt buộc |
| `DES-FR` | `dds/fr-nfr-design.md` | System | Thiết kế giải pháp hiện thực hóa yêu cầu chức năng | SPEC-FR, DDS | Build Plan | Bắt buộc |
| `DES-UI` | `dds/ui-ux-design.md` | System | Thiết kế chi tiết UI, thông số design token và layout | SPEC-UI, DDS | UI Build Plan | Có UI |
| `DES-API`| `dds/api-design.md` | System | Thiết kế hợp đồng API REST, WebSocket STOMP cụ thể | SPEC-API, DDS | API Build Plan | Có API |
| `DES-DAT`| `dds/data-design.md` | System | Thiết kế lược đồ CSDL PostgreSQL, SQLite WAL, migration | SPEC-DAT, DDS | Data Build Plan | Có CSDL bền vững |
| `PLN-PRJ`| `plans/project-plan.md`| System | Lịch trình mốc thời gian, quản lý phân bổ và rủi ro | PI, DDS | Toàn bộ kế hoạch | Bắt buộc |
| `PLN-FND`| `plans/foundation-setup-plan.md`| System | Kế hoạch chuẩn bị hạ tầng, repo, công cụ chung | STACK, DDS | Build Plans, FSP | Bắt buộc |
| `PLN-BLD`| `plans/build-plan.md` | System | Kế hoạch xây dựng và tích hợp xuyên suốt hệ thống | DDS, Design leaves | Quá trình Build | Bắt buộc |
| `PLN-TST`| `plans/test-plan.md` | System | Kế hoạch kiểm thử tích hợp và ma trận kiểm thử hệ thống | Specs (trực tiếp) | Quá trình Test | Bắt buộc |
| `PLN-DPL`| `plans/deploy-plan.md` | System | Kế hoạch đóng gói, triển khai và kiểm soát vận hành | DDS (Topology), STACK | Quá trình Deploy | Bắt buộc |
| `SVC-FSP`| `<service>/core/fsp.md`| Service | Kế hoạch thiết lập nền tảng cục bộ của service | PLN-FND, STACK | Service Build | Bắt buộc cho service |
| `SVC-SPEC`| `<service>/*/*-specs.md`| Service | Yêu cầu chi tiết thuộc phạm vi trách nhiệm của service | System Specs, DDS | Service Design, Test | Theo facet của service |
| `SVC-DES` | `<service>/*/*-design.md`| Service | Thiết kế kỹ thuật chi tiết của service | Service Specs, STACK | Service Build | Theo facet của service |
| `SVC-BLD` | `<service>/*/*-build-plan.md`| Service| Kế hoạch phân rã công việc thi công của service | Service Design | Code | Theo facet của service |
| `SVC-TST` | `<service>/core/test-plan.md`| Service| Ma trận kiểm thử đơn vị và kiểm thử thành phần service | Service Specs | Kiểm thử mã nguồn | Bắt buộc cho service |

---

## 3. Conventions & Standards (Quy chuẩn Định danh & Schema)

### 3.1. Cú pháp Mã Định danh (ID Scheme)

Mỗi phần tử trong bộ tài liệu bắt buộc phải có mã định danh duy nhất theo cấu trúc:

* **Cấp Hệ thống (System-Level)**: `<TYPE>-<NNN>` (Ví dụ: `INF-001`, `STK-003`, `ARC-002`, `FR-SYS-001`)
* **Cấp Dịch vụ (Service-Level)**: `<TYPE>-<SCOPE>-<NNN>` (Ví dụ: `FR-KSK-001`, `SOL-BE-002`, `CBL-WEB-003`)

#### Bảng Prefix Chuẩn hóa Toàn Hệ thống:

| Prefix | Phân loại Phần tử | Vị trí Tài liệu Quy định | Diễn giải |
| :--- | :--- | :--- | :--- |
| `SRC-` | Nguồn bằng chứng | `info.md` | Báo cáo, khảo sát, tiêu chuẩn nghiên cứu |
| `INF-` | Phát hiện nghiên cứu | `info.md` | Sự thật, kết quả phân tích thị trường/kỹ thuật |
| `PD-` | Quyết định dự án | `pi.md` | Quyết định khởi tạo, mục tiêu, ranh giới dự án |
| `STK-` | Công nghệ / Công cụ | `tech-tool-stack.md` | Thành phần trong Tech Stack hoặc Tool Stack |
| `ACT-` | Tác nhân người dùng | `srs/srs.md` | Vai trò người dùng tương tác với hệ thống |
| `EXT-` | Hệ thống bên ngoài | `srs/srs.md` | Thiết bị phần cứng, dịch vụ bên ngoài |
| `SRS-` | Yêu cầu xuyên suốt | `srs/srs.md` | Quy chuẩn bảo mật, tuân thủ pháp lý toàn cục |
| `FR-` | Yêu cầu chức năng | `*/fr-nfr-specs.md` | Năng lực nghiệp vụ và quy tắc nghiệp vụ |
| `NFR-` | Yêu cầu phi chức năng | `*/fr-nfr-specs.md` | Thuộc tính chất lượng đo được (hiệu năng, độ tin cậy) |
| `UI-` | Đặc tả tương tác UI/UX | `*/ui-ux-specs.md` | Tác vụ, luồng trải nghiệm, thông tin hiển thị |
| `API-` | Đặc tả giao diện/hợp đồng | `*/api-specs.md` | Hợp đồng giao tiếp dữ liệu vào/ra |
| `DATA-`| Đặc tả dữ liệu | `*/data-specs.md` | Khái niệm thực thể, quy tắc toàn vẹn dữ liệu |
| `ARC-` | Thiết kế kiến trúc | `dds/dds.md` | Cấu trúc phân tầng, ranh giới service, topology |
| `SOL-` | Thiết kế giải pháp | `*/fr-nfr-design.md` | Thành phần phần mềm, logic và cơ chế xử lý |
| `UXD-` | Thiết kế giao diện | `*/ui-ux-design.md` | Cấu trúc màn hình, token giao diện, behavior |
| `APD-` | Thiết kế API chi tiết | `*/api-design.md` | Endpoint, schema JSON, sequence giao tiếp |
| `DTD-` | Thiết kế dữ liệu chi tiết | `*/data-design.md` | Lược đồ CSDL, bảng, chỉ mục, migration |
| `DD-` | Quyết định thiết kế | `*/*-design.md` | Design Decision ghi nhận rationale và trade-off |
| `APC-` | Quyết định cách tiếp cận | `*/*-plan.md` | Approach Decision trong kế hoạch thực hiện |
| `PRJ-` | Hạng mục dự án | `plans/project-plan.md` | Giai đoạn, mốc mốc hoàn thành |
| `RSK-` | Rủi ro | `plans/project-plan.md` | Rủi ro dự án, mức độ ảnh hưởng và biện pháp |
| `FND-` | Công việc chuẩn bị nền tảng | `*/foundation-setup-plan.md` | Cài đặt môi trường, công cụ, cấu hình repo |
| `BLD-` | Công việc build hệ thống | `plans/build-plan.md` | Hạng mục tích hợp cấp hệ thống |
| `CBL-` | Công việc build Core service | `<service>/core/fr-nfr-build-plan.md` | Hạng mục thi công nghiệp vụ service |
| `UBL-` | Công việc build UI service | `<service>/ui-ux/ui-ux-build-plan.md` | Hạng mục thi công giao diện service |
| `ABL-` | Công việc build API service | `<service>/api/api-build-plan.md` | Hạng mục thi công giao tiếp service |
| `DBL-` | Công việc build Data service | `<service>/data/data-build-plan.md` | Hạng mục thi công CSDL service |
| `TST-` | Hạng mục kiểm thử | `*/test-plan.md` | Ca kiểm thử chức năng/phi chức năng/tích hợp |
| `DPL-` | Hạng mục triển khai | `plans/deploy-plan.md` | Đóng gói, triển khai và xác minh môi trường |

---

### 3.2. Vòng đời Trạng thái (Status Lifecycle)

Mỗi phần tử (Requirement, Design, Plan Item) bắt buộc phải phản ánh trạng thái chuẩn:

* **Draft**: Mới soạn thảo, chưa qua kiểm định hoặc đang cập nhật.
* **In Review**: Đang trong quá trình đánh giá và phản biện kỹ thuật.
* **Approved**: Đã phê duyệt chính thức làm chuẩn baseline.
* **Implemented**: Đã hoàn tất cài đặt trong mã nguồn.
* **Verified**: Đã vượt qua các ca kiểm thử tương ứng.
* **Deprecated / Superseded**: Không còn sử dụng hoặc đã được thay thế bằng ID mới.

### 3.3. Mức độ Ưu tiên (Priority Levels)

* **P1 (Must-Have)**: Bắt buộc phải có để hệ thống hoạt động; không thể release nếu thiếu.
* **P2 (Should-Have)**: Rất quan trọng, có thể chấp nhận giải pháp thay thế tạm thời trong ngắn hạn.
* **P3 (Could-Have)**: Tính năng hữu ích nhưng có thể trì hoãn nếu nguồn lực giới hạn.
* **P4 (Won't-Have)**: Chưa thực hiện trong phiên bản phát hành hiện tại.

---

### 3.4. Hệ thống Bảng Schema Chuẩn mực (Canonical Schemas)

#### A. Schema STACK (`tech-tool-stack.md`)
```text
| ID | Category | Name & Version | Applies to | Role | Basis | Requires | Status |
```
* *Basis*: Trỏ về `PD-` hoặc `INF-`.
* *Requires*: Ghi nhận các điều kiện tương thích phần cứng/runtime.

#### B. Schema SPEC (`*-specs.md`)
```text
| ID | Statement | Category | Priority | Basis | Acceptance | Status |
```
* *Statement*: Phát biểu yêu cầu ngắn gọn, rõ ràng, độc lập.
* *Basis*: Trỏ về `INF-`, `PD-` hoặc Spec cấp trên.
* *Acceptance*: Tiêu chí nghiệm thu định lượng, có thể kiểm chứng được.

#### C. Schema DESIGN — Structure & Behavior (`*-design.md`)
```text
| ID | Name | Definition | Uses | Realizes | Decisions | Status |
```
* *Definition*: Trách nhiệm của thành phần hoặc diễn biến hành vi.
* *Uses*: Trỏ tới phần tử kỹ thuật khác, `STK-` hoặc `EXT-`.
* *Realizes*: Trỏ về ID Spec mà thành phần này giải quyết.
* *Decisions*: Trỏ về `DD-` chi phối.

#### D. Schema DESIGN — Decisions (`*-design.md`)
```text
| ID | Decision | Rationale | Basis | Status |
```
* *Rationale*: Lý do lựa chọn, các phương án đã loại trừ và phân tích đánh đổi (trade-off).
* *Basis*: Trỏ về Spec, `STK-`, `INF-` hoặc `PD-`.

#### E. Schema PLAN — Work Items (`*-plan.md`)
```text
| ID | Name | Description | Covers | Depends on | Done when | Status |
```
* *Covers*: Trỏ về ID của Design Element (`ARC-`, `SOL-`, `UXD-`, `APD-`, `DTD-`) hoặc Spec.
* *Depends on*: Danh sách các ID công việc phải hoàn thành trước.
* *Done when*: Tiêu chí nghiệm thu hoàn thành công việc cụ thể.

#### F. Schema TEST — Test Items (`*-test-plan.md`)
```text
| ID | Name | Description | Covers | Level | Done when | Status |
```
* *Covers*: Trỏ trực tiếp về ID của Spec (`FR-`, `NFR-`, `UI-`, `API-`, `DATA-`).
* *Done when*: Tiêu chí pass kiểm thử cụ thể hóa từ trường `Acceptance` của Spec.

---

## 4. Traceability & Ownership (Nguyên tắc Truy vết & Quyền sở hữu)

### 4.1. Nguyên tắc Vàng: Single Ownership
> **Mỗi nội dung chỉ có một tài liệu duy nhất làm Owner; tất cả các tài liệu khác chỉ được phép tham chiếu bằng mã ID, tuyệt đối không sao chép nguyên văn.**

### 4.2. Chuỗi Truy vết Kỹ thuật Xuyên suốt (End-to-End Traceability)

```text
       [info.md]              Kho bằng chứng, sự thật
          │ (INF-)
          ▼
       [pi.md]                Quyết định khởi tạo dự án
          │ (PD-)
          ├──────────────────────────┐
          ▼                          ▼
[tech-tool-stack.md]         [srs/ & specs/]     Đặc tả yêu cầu hệ thống & dịch vụ
   (STK-)                          │ (FR-, NFR-, DATA-...)
     │                             ├──────────────────────────┐
     ▼                             ▼                          │
[dds/ & design/] ◄─────────── (Realizes)                      │
   (ARC-, SOL-, DTD-...)           │                          │
     │                             │                          │
     ▼ (Covers)                    │                          ▼ (Covers)
[plans/ & build-plans/]            │                   [test-plans/]
   (BLD-, CBL-, UBL-...)           │                      (TST-)
     │                             │                          │
     ▼                             │                          ▼
 Mã nguồn thực thi (Code) ─────────┴──────────────────► Kiểm chứng nghiệm thu (Test Execution)
```

### 4.3. Quy tắc Refinement giữa System-level và Service-level
1. Tài liệu cấp hệ thống định nghĩa ranh giới và phân bổ trách nhiệm thông qua kiến trúc `ARC-` trong `dds.md`.
2. Tài liệu cấp dịch vụ không được sao chép nguyên văn yêu cầu hệ thống; mỗi dòng trong Service Spec là sự cụ thể hóa (refinement) từ System Spec và kiến trúc `ARC-` liên quan.

---

## 5. Quality Gates (Quy tắc Đánh giá Chất lượng Tài liệu)

Mỗi phần tử và mục tài liệu chỉ được phê duyệt khi vượt qua đầy đủ **4 bài kiểm tra chuẩn mực**:

1. **Correct (Đúng đắn)**: Có trả lời chính xác câu hỏi cốt lõi mà loại tài liệu đó chịu trách nhiệm hay không? (Spec trả lời *Cần gì*, Design trả lời *Làm như thế nào*, Plan trả lời *Làm theo thứ tự nào*).
2. **Complete (Đầy đủ)**: Nếu lược bỏ phần tử này đi, câu hỏi đó có còn được trả lời trọn vẹn và kiểm chứng được không?
3. **Non-overlapping (Không chồng chéo)**: Nội dung này đã được sở hữu ở một leaf khác chưa? (Nếu đã có, bắt buộc phải thay bằng ID tham chiếu).
4. **Abstract (Đúng mức độ trừu tượng)**: Tài liệu có bị lộ chi tiết thi công không cần thiết hay không? (Spec không chứa URL REST cụ thể, Design không ghi số dòng code, Plan không ghi ngày giờ cá nhân).

---

## 6. Terms & Glossary (Thuật ngữ SDLC)

* **SDLC (Software Development Life Cycle)**: Vòng đời phát triển phần mềm toàn diện.
* **SRS (System Requirements Specification)**: Tài liệu đặc tả yêu cầu cấp hệ thống.
* **DDS (Detailed Design Specification)**: Tài liệu đặc tả thiết kế kỹ thuật chi tiết.
* **FSP (Foundation Setup Plan)**: Kế hoạch thiết lập nền tảng và môi trường ban đầu của service.
* **Leaf Document**: Một tệp markdown độc lập đóng vai trò sở hữu chuyên biệt một nhóm nội dung kỹ thuật.
* **Traceability**: Khả năng lần vết hai chiều giữa yêu cầu, thiết kế, công việc triển khai và ca kiểm thử.
* **RTM (Requirements Traceability Matrix)**: Ma trận truy xuất từ yêu cầu sang kiểm thử.
