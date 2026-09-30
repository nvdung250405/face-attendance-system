# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
>
> - **Mã tài liệu**: BP-FAS-01
> - **Tên tài liệu**: Kế hoạch xây dựng phần mềm (Build Plan - BP)
> - **Phiên bản**: 1.0
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-09-30
> - **Tài liệu liên quan**: [README.md](../README.md), [PC.md](../initiation/PC.md), [PI.md](../initiation/PI.md), [TS.md](../initiation/TS.md), [PP.md](PP.md), [SRS.md](../requirements/SRS.md), [FR.md](../requirements/FR.md), [DDS.md](../design/DDS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-09-30)*: Xây dựng hoàn chỉnh kế hoạch xây dựng phần mềm (Build Plan) bao gồm cấu trúc Monorepo, môi trường phát triển VS Code, quy chuẩn lập trình, quy trình build, kiểm soát chất lượng CI/CD và chiến lược bảo trì mã nguồn cho cả 3 phân hệ.

---

## BP — Kế hoạch xây dựng phần mềm

**1. Cơ sở & Phạm vi xây dựng**

- 1.1. Phạm vi xây dựng

  - Kế hoạch này xác định toàn bộ quy trình, công cụ, cấu trúc tổ chức mã nguồn và các tiêu chuẩn kỹ thuật phục vụ việc hiện thực hóa mã nguồn (Implementation) cho Hệ thống Chấm công bằng Nhận diện Khuôn mặt (Face Attendance System - FAS).
  - Phạm vi bao phủ trọn vẹn 3 phân hệ cấu thành độc lập trong cấu trúc Monorepo tại thư mục `/app`:
    - `app/kiosk-app`: Ứng dụng Desktop Python chạy tại thiết bị biên (Edge Terminal), phụ trách thu nhận video, phát hiện khuôn mặt (YuNet), kiểm tra thực thể sống (MiniFASNet), trích xuất vector 512D (ArcFace), so khớp 1:N cục bộ (NumPy), bàn phím ảo PIN dự phòng và hàng đợi ngoại tuyến SQLite WAL.
    - `app/backend-service`: Dịch vụ máy chủ doanh nghiệp nền tảng Java 21 LTS / Spring Boot 4.x, xử lý nghiệp vụ chấm công, ca kíp, bộ đệm chống quẹt lặp Cooldown 120s, mã hóa vector AES-256-GCM, tiến trình tiêu hủy mẫu sau 20 ngày theo Luật 2025, WebSocket STOMP Broker và xuất báo cáo Excel an toàn.
    - `app/web-portal`: Ứng dụng Web SPA hiện đại nền tảng ReactJS 18+ / TypeScript / Vite / Tailwind CSS, cung cấp màn hình Live Dashboard thời gian thực, quản lý nhân sự, duyệt đơn giải trình công và cổng tự phục vụ ký cam kết Informed Consent.
  - Thiết lập hạ tầng đóng gói Docker Compose và kịch bản tự động hóa kiểm thử cục bộ chi phí 0 VNĐ.
- 1.2. Thành phần / module cần xây dựng

  - Bảng tổng hợp các thành phần mã nguồn cốt lõi cần xây dựng theo từng phân hệ:

| Phân hệ                         | Gói / Module Mã nguồn   | Trách nhiệm Kỹ thuật Cốt lõi                                                                                                      |
| :-------------------------------- | :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **`app/kiosk-app`**       | `core.vision`            | Đọc khung hình OpenCV, phát hiện khuôn mặt YuNet, liveness MiniFASNet, trích xuất ArcFace, so khớp ma trận RAM NumPy         |
|                                   | `core.offline`           | Quản lý kết nối SQLite WAL`kiosk_local.db`, ghi đệm `offline_punches`, đồng bộ bù ngầm                                   |
|                                   | `network.client`         | Client HTTP REST API (`httpx`) và WebSocket STOMP client (`stomp.py`) nhận bản tin nạp vector                                   |
|                                   | `ui.views`               | Giao diện PySide6 gồm MainWindow, LiveCanvasWidget viền oval 4 màu, VirtualPinDialog, EnrollmentDialog                              |
| **`app/backend-service`** | `web.controller`         | Tiếp nhận REST API cho Kiosk (`/punch`, `/sync-batch`, `/enroll-face`), Web Portal (`/auth`, `/employees`, `/timesheets`) |
|                                   | `service`                | Logic nghiệp vụ chấm công, tính giờ công (Late/Early/Grace), mã hóa AES-256-GCM, lập lịch Cron xóa sau 20 ngày             |
|                                   | `messaging`              | Cấu hình WebSocket STOMP Broker, bộ phát sóng sự kiện`StompEventDispatcher`                                                    |
|                                   | `repository`             | Tầng truy cập dữ liệu Spring Data JPA / Hibernate tương tác PostgreSQL 16                                                        |
| **`app/web-portal`**      | `components/dashboard`   | Màn hình Live Monitoring Dashboard, thẻ KPI quân số, bảng lượt quẹt động cập nhật STOMP real-time                          |
|                                   | `components/employees`   | Quản lý danh sách nhân sự, kích hoạt OTP 48h, chuyển trạng thái nhân viên nghỉ việc                                       |
|                                   | `components/timesheets`  | Lưới bảng công hàng tháng, bộ lọc phòng ban, modal duyệt giải trình                                                         |
|                                   | `components/selfservice` | Cổng tự phục vụ xem công cá nhân, nộp đơn giải trình và ký cam kết Informed Consent điện tử                           |
|                                   | `services`               | API client (Axios Interceptors) và WebSocket client (@stomp/stompjs) singleton                                                         |

- 1.3. Cơ sở thiết kế

  - Tài liệu xây dựng này kế thừa trực tiếp và hiện thực hóa chính xác các tài liệu tiền đề trong chuỗi SDLC:
    - [DDS.md](../design/DDS.md): Cung cấp kiến trúc hệ thống 3 tầng, 7 quyết định thiết kế cốt lõi (`DEC-01` đến `DEC-07`), 3 sơ đồ sequence luồng dữ liệu, mô hình CSDL ERD 3NF và đặc tả API/STOMP chi tiết.
    - [FR.md](../requirements/FR.md): Cung cấp đặc tả chi tiết 16 yêu cầu chức năng (`FR-01` đến `FR-16`) làm tiêu chí nghiệm thu mã nguồn.
    - [SRS.md](../requirements/SRS.md): Cung cấp các ràng buộc chất lượng phi chức năng về hiệu năng ($\le 350\text{ ms}$ tại biên, $\le 200\text{ ms}$ real-time), bảo mật (AES-256-GCM, Luật 2025, CWE-1236) và độ tin cậy (RPO = 0 qua SQLite WAL).
    - [TS.md](../initiation/TS.md): Cung cấp danh mục công nghệ, phiên bản runtime và cấu hình VS Code chuẩn mực.
    - [PP.md](PP.md): Định vị tiến độ thực hiện trong Sprint 2 và Sprint 3 của kế hoạch dự án 0 VNĐ.
- 1.4. Yêu cầu kỹ thuật cần tuân thủ

  - **Môi trường phát triển duy nhất**: Toàn bộ dự án phải được lập trình, gỡ lỗi và quản lý tập trung trên Visual Studio Code (VS Code); không sử dụng các IDE thương mại nặng nề như IntelliJ IDEA Ultimate hay PyCharm Professional.
  - **Chi phí bản quyền 0 VNĐ**: Sử dụng 100% công cụ mã nguồn mở miễn phí; toàn bộ hạ tầng chạy trực tiếp trên máy trạm cục bộ mà không thuê mượn máy chủ đám mây.
  - **Khả năng chạy trên phần cứng tiêu chuẩn**: Mã nguồn AI phải được tối ưu hóa để chạy trơn tru trên CPU máy tính văn phòng tiêu chuẩn (4 nhân, 8GB RAM, camera USB). Thông số máy trạm phát triển (Core i5-12450H, 16GB RAM, RTX 3050 Ti) chỉ đóng vai trò môi trường kiểm thử xác thực ban đầu.
  - **Tuân thủ pháp lý dữ liệu sinh trắc học 2025**: Mã nguồn backend bắt buộc phải kiểm tra cờ đồng thuận Informed Consent trước khi cho phép kích hoạt nhận diện và phải có tiến trình tự động xóa vĩnh viễn vector sau tối đa 20 ngày khi nhân viên thôi việc.

---

**2. Môi trường & Mã nguồn**

- 2.1. Repository & cấu trúc source code
  - Dự án được tổ chức theo mô hình Monorepo tại một kho lưu trữ duy nhất, phân định ranh giới rõ ràng giữa tài liệu, cấu hình hạ tầng và 3 phân hệ ứng dụng độc lập:

```text
face-attendance-system/
├── .vscode/                               # Cấu hình môi trường VS Code chung cho Monorepo
│   ├── extensions.json                    # Khuyến nghị các extension chuẩn hóa
│   ├── launch.json                        # Cấu hình Debug đa dịch vụ (Multi-target debugging)
│   ├── settings.json                      # Cấu hình định dạng code, tab size, linter
│   └── tasks.json                         # Tự động hóa các lệnh build, run test
├── app/                                   # Mã nguồn 3 phân hệ chính
│   ├── backend-service/                   # Phân hệ máy chủ Java 21 / Spring Boot 4.x
│   │   ├── src/main/java/com/fas/         # Mã nguồn nghiệp vụ phân tầng Clean Architecture
│   │   │   ├── config/                    # Cấu hình Spring Security, WebSocket, Cache
│   │   │   ├── controller/                # Tầng REST API Controller
│   │   │   ├── dto/                       # Đối tượng truyền dữ liệu Request/Response DTO
│   │   │   ├── entity/                    # Các thực thể JPA ánh xạ CSDL PostgreSQL
│   │   │   ├── exception/                 # Bộ xử lý ngoại lệ toàn cục GlobalExceptionHandler
│   │   │   ├── messaging/                 # Xử lý phát sóng sự kiện STOMP
│   │   │   ├── repository/                # Tầng truy xuất dữ liệu Spring Data JPA
│   │   │   └── service/                   # Tầng logic nghiệp vụ, bảo mật, crypto, scheduler
│   │   ├── src/main/resources/            # Cấu hình ứng dụng, migration SQL, mẫu email
│   │   │   ├── application.yml            # Cấu hình chung
│   │   │   ├── application-dev.yml        # Cấu hình môi trường phát triển cục bộ
│   │   │   └── db/migration/              # Kịch bản Flyway / DDL khởi tạo CSDL
│   │   ├── src/test/java/com/fas/         # Unit test & Integration test (JUnit 5, Mockito)
│   │   ├── Dockerfile                     # Multi-stage build tối ưu kích thước JAR
│   │   └── pom.xml                        # Khai báo dependency Maven
│   ├── kiosk-app/                         # Phân hệ trạm điểm danh Desktop Python 3.11
│   │   ├── core/                          # Module nghiệp vụ cốt lõi
│   │   │   ├── vision/                    # Pipeline thị giác: YuNet, MiniFASNet, ArcFace
│   │   │   ├── offline/                   # Quản lý hàng đợi SQLite WAL kiosk_local.db
│   │   │   └── crypto/                    # Xử lý giải mã vector, băm dữ liệu
│   │   ├── network/                       # Module giao tiếp REST API và WebSocket STOMP
│   │   ├── ui/                            # Giao diện người dùng PySide6 (Qt)
│   │   │   ├── views/                     # Các cửa sổ và hộp thoại MainWindow, PIN, OTP
│   │   │   └── widgets/                   # Custom widget: LiveCanvas viền oval động
│   │   ├── assets/                        # Trọng số mô hình ONNX, icon, âm thanh tít
│   │   ├── tests/                         # Unit test kiểm thử pipeline thị giác và hàng đợi
│   │   ├── requirements.txt               # Danh mục thư viện Python ghim phiên bản
│   │   └── main.py                        # Điểm khởi động ứng dụng Kiosk Desktop
│   └── web-portal/                        # Phân hệ Cổng Web ReactJS 18+ / TypeScript / Vite
│       ├── src/
│       │   ├── assets/                    # Hình ảnh, logo, CSS tĩnh
│       │   ├── components/                # React Components tái sử dụng theo module
│       │   │   ├── common/                # Button, Modal, Table, Input dùng chung
│       │   │   ├── dashboard/             # Thẻ KPI quân số, bảng Live Punches
│       │   │   ├── employees/             # Form nhân viên, quản lý OTP
│       │   │   ├── timesheets/            # Lưới bảng công, duyệt giải trình
│       │   │   └── selfservice/           # Xem công cá nhân, ký cam kết điện tử
│       │   ├── contexts/                  # Quản lý trạng thái toàn cục AuthContext, ThemeContext
│       │   ├── hooks/                     # Custom React Hooks (useStomp, useAuth, usePunch)
│       │   ├── services/                  # Đóng gói gọi API Axios và kết nối STOMPjs
│       │   ├── types/                     # Định nghĩa TypeScript interfaces / DTOs
│       │   ├── App.tsx                    # Định tuyến ứng dụng React Router v6
│       │   └── main.tsx                   # Điểm khởi chạy React DOM
│       ├── package.json                   # Khai báo dependency npm và scripts
│       ├── tailwind.config.js             # Cấu hình Tailwind CSS
│       ├── tsconfig.json                  # Cấu hình biên dịch TypeScript
│       └── vite.config.ts                 # Cấu hình Vite bundler và proxy dev server
├── docs/                                  # Toàn bộ tài liệu chuẩn hóa SDLC
│   ├── initiation/                        # PC, PI, TS
│   ├── planning/                          # PP, BP
│   ├── requirements/                      # SRS, FR
│   ├── design/                            # DDS
│   ├── testing/                           # TP (Test Plan)
│   └── deployment/                        # DP (Deployment Plan)
├── .env.example                           # Tệp biến môi trường mẫu
└── docker-compose.yml                     # Kịch bản triển khai toàn bộ máy chủ (Postgres, Backend, Web)
```

  - **Phương pháp Khởi tạo Scaffolding Đồng bộ 100% bằng Lệnh Dòng lệnh (CLI-Driven Scaffolding)**:
    - Để đảm bảo tính đồng bộ, tốc độ và khả năng tự động hóa cao nhất, cả 3 phân hệ đều được khởi tạo trực tiếp bằng các câu lệnh dòng lệnh (Terminal / PowerShell) mà không cần thao tác thủ công qua giao diện:
      - **1. Phân hệ Backend (`app/backend-service`) — Khởi tạo qua Spring Initializr API / cURL**:
        - Sử dụng lệnh gọi API chính thức từ `start.spring.io` qua `curl.exe` và giải nén bằng `tar` (tích hợp sẵn trên Windows 10/11 & Linux). Lệnh này cấu hình đầy đủ GroupId, ArtifactId, Java 21, Spring Boot 3.3.x và tích hợp sẵn 8 dependencies cốt lõi:
          ```powershell
          # Tải và giải nén dự án Spring Boot chuẩn hóa vào app/backend-service
          curl.exe -s "https://start.spring.io/starter.zip?type=maven-project&language=java&baseDir=backend-service&groupId=com.fas&artifactId=backend-service&name=backend-service&packageName=com.fas&packaging=jar&javaVersion=21&dependencies=web,websocket,security,data-jpa,postgresql,lombok,actuator,validation" -o backend-service.zip
          tar -xf backend-service.zip -C app/
          Remove-Item backend-service.zip
          ```
          *(Dự án được tự động tạo hoàn chỉnh với Maven Wrapper `./mvnw`, tệp `pom.xml`, cấu hình `com.fas.BackendServiceApplication` và bộ test JUnit 5).*
      - **2. Phân hệ Cổng Web (`app/web-portal`) — Khởi tạo qua Vite CLI**:
        - Sử dụng lệnh khởi tạo chính thức từ Vite để sinh khung ReactJS + TypeScript tối ưu:
          ```powershell
          npm create vite@latest app/web-portal -- --template react-ts
          cd app/web-portal
          npm install
          npm install -D tailwindcss postcss autoprefixer
          npx tailwindcss init -p
          npm install axios @stomp/stompjs lucide-react react-router-dom
          cd ../..
          ```
      - **3. Phân hệ Trạm Kiosk (`app/kiosk-app`) — Khởi tạo Python Virtual Environment**:
        - Khởi tạo môi trường ảo Python cô lập (sử dụng Python Launcher `py` trên Windows để đảm bảo dùng đúng CPython chính thức) và cài đặt các thư viện AI / GUI:
          ```powershell
          cd app/kiosk-app
          py -m venv .venv
          .\.venv\Scripts\Activate.ps1
          pip install PySide6 opencv-python-headless onnxruntime numpy httpx stomp.py
          pip freeze > requirements.txt
          cd ../..
          ```
      - **Kịch bản Khởi tạo Toàn bộ 3 Phân hệ 1 Lần Duy nhất (One-Click Monorepo Bootstrap Script)**:
        - Kỹ sư chỉ cần mở PowerShell tại thư mục gốc của dự án và chạy đoạn lệnh liên hoàn sau để khởi tạo đồng thời cả 3 phân hệ trong vòng dưới 1 phút:
          ```powershell
          # Tạo thư mục app nếu chưa có
          if (!(Test-Path -Path "app")) { New-Item -ItemType Directory -Path "app" }

          # 1. Khởi tạo Backend Spring Boot
          curl.exe -s "https://start.spring.io/starter.zip?type=maven-project&language=java&baseDir=backend-service&groupId=com.fas&artifactId=backend-service&name=backend-service&packageName=com.fas&packaging=jar&javaVersion=21&dependencies=web,websocket,security,data-jpa,postgresql,lombok,actuator,validation" -o backend.zip
          tar -xf backend.zip -C app/
          Remove-Item backend.zip

          # 2. Khởi tạo Web Portal ReactJS + Tailwind
          npx -y create-vite@latest app/web-portal --template react-ts
          cd app/web-portal
          npm install
          npm install -D tailwindcss postcss autoprefixer
          npx tailwindcss init -p
          npm install axios @stomp/stompjs lucide-react react-router-dom
          cd ../..

          # 3. Khởi tạo Kiosk App Python
          if (!(Test-Path -Path "app/kiosk-app")) { New-Item -ItemType Directory -Path "app/kiosk-app" }
          cd app/kiosk-app
          py -m venv .venv
          .\.venv\Scripts\Activate.ps1
          pip install PySide6 opencv-python-headless onnxruntime numpy httpx stomp.py
          pip freeze > requirements.txt
          cd ../..
          ```


- 2.2. Môi trường phát triển

  - **Hệ thống Phần cứng Khuyến nghị**:
    - CPU: Tối thiểu 4 nhân vật lý (hỗ trợ tập lệnh AVX2 tối ưu hóa tính toán ma trận AI).
    - RAM: Tối thiểu 8 GB (khuyến nghị 16 GB để chạy đồng thời Docker và các phân hệ).
    - Thiết bị ngoại vi: 01 Camera Webcam tích hợp hoặc gắn ngoài cổng USB chuẩn UVC.
    - Máy trạm thử nghiệm thực tế của kỹ sư: CPU Intel Core i5-12450H (8 nhân, 12 luồng), 16 GB RAM DDR4, GPU NVIDIA GeForce RTX 3050 Ti (dùng kiểm chứng tăng tốc, hệ thống chạy tốt trên CPU thuần), camera laptop 720p 30 FPS.
  - **Môi trường Phần mềm & Runtime**:
    - Hệ điều hành: Windows 11 64-bit hoặc Linux Ubuntu 22.04 LTS.
    - Java Runtime: OpenJDK 21 LTS (Eclipse Temurin hoặc Microsoft Build of OpenJDK).
    - Python Runtime: Python 3.11.x 64-bit (sử dụng môi trường ảo `.venv`).
    - Node.js Runtime: Node.js 20 LTS (bao gồm npm v10.x).
    - Trình quản lý container: Docker Desktop v4.28+ hoặc Docker Engine / Docker Compose v2.x.
  - **Môi trường Lập trình Tích hợp (IDE) — VS Code**:
    - Toàn bộ kỹ sư phát triển bắt buộc sử dụng Visual Studio Code (VS Code) và cài đặt bộ Extensions chuẩn hóa được khai báo trong `.vscode/extensions.json`:
      - `ms-python.python`, `ms-python.vscode-pylance`: Hỗ trợ gõ lệnh, phân tích tĩnh và gỡ lỗi Python.
      - `vscjava.vscode-java-pack`, `vmware.vscode-spring-boot`: Hỗ trợ quản lý dự án Maven, chạy ứng dụng Spring Boot và gỡ lỗi Java 21.
      - `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`: Tự động kiểm tra cú pháp và định dạng mã nguồn TypeScript/React.
      - `bradlc.vscode-tailwindcss`: Gợi ý class CSS của Tailwind tự động.
      - `ms-azuretools.vscode-docker`: Quản lý trực quan các container PostgreSQL, Backend và Web Nginx.
- 2.3. Công cụ & dependency

  - **1. Phân hệ Kiosk Desktop (`app/kiosk-app`)**:
    - Quản lý qua tệp `requirements.txt` ghim chính xác phiên bản thư viện:
      - `PySide6==6.7.0`: Thư viện giao diện đồ họa GUI chính thức từ The Qt Company.
      - `opencv-python-headless==4.9.0.80`: Xử lý hình ảnh và truy cập camera máy trạm.
      - `onnxruntime==1.17.3`: Động cơ thực thi mô hình trí tuệ nhân tạo (YuNet, MiniFASNet, ArcFace) tối ưu hóa đa luồng trên CPU máy tính.
      - `numpy==1.26.4`: Tính toán ma trận số học và tích vô hướng Cosine Similarity 1:N siêu tốc.
      - `httpx==0.27.0`: Thư viện HTTP Client hiện đại hỗ trợ gửi REST API đồng bộ và bất đồng bộ.
      - `stomp.py==8.1.0`: Client giao tiếp WebSocket STOMP với Backend.
  - **2. Phân hệ Máy chủ Doanh nghiệp (`app/backend-service`)**:
    - Quản lý qua Maven `pom.xml`:
      - `spring-boot-starter-web`: Framework RESTful API nền tảng Spring Boot.
      - `spring-boot-starter-websocket`: Triển khai máy chủ WebSocket STOMP Broker qua SockJS.
      - `spring-boot-starter-data-jpa`: Tầng ORM giao tiếp cơ sở dữ liệu qua Hibernate 6.x.
      - `spring-boot-starter-security`: Bảo vệ ứng dụng, lọc JWT và cấu hình phân quyền RBAC.
      - `org.postgresql:postgresql:42.7.3`: Trình điều khiển JDBC kết nối PostgreSQL 16.
      - `com.github.ben-manes.caffeine:caffeine:3.1.8`: Bộ đệm trong bộ nhớ RAM tốc độ cao phục vụ Cooldown 120s.
      - `org.apache.poi:poi-ooxml:5.2.5`: Thư viện kết xuất báo cáo bảng tính Microsoft Excel (`.xlsx`).
      - `org.bouncycastle:bcprov-jdk18on:1.78`: Thư viện bổ trợ mật mã học cho AES-256-GCM và Argon2id.
      - `org.projectlombok:lombok`: Tự động sinh getter/setter/builder giảm thiểu mã lặp.
  - **3. Phân hệ Cổng Web Quản trị (`app/web-portal`)**:
    - Quản lý qua `package.json` với npm:
      - `react: ^18.2.0`, `react-dom: ^18.2.0`: Thư viện xây dựng giao diện người dùng.
      - `typescript: ^5.2.2`: Ngôn ngữ kiểm soát kiểu dữ liệu tĩnh an toàn.
      - `vite: ^5.2.0`: Công cụ đóng gói mã nguồn và máy chủ dev siêu nhanh.
      - `tailwindcss: ^3.4.3`, `lucide-react: ^0.368.0`: Khung giao diện CSS tiện ích và bộ icon đồ họa hiện đại.
      - `axios: ^1.6.8`: Thư viện gọi HTTP REST API kèm Interceptor chèn JWT token tự động.
      - `@stomp/stompjs: ^7.0.0`: Thư viện quản lý kết nối STOMP thời gian thực qua WebSocket.
      - `react-router-dom: ^6.22.3`: Điều hướng phân trang phía Client (SPA Routing).
- 2.4. Cấu hình môi trường

  - Toàn bộ biến cấu hình nhạy cảm được quản lý theo nguyên tắc 12-Factor App thông qua tệp `.env` tại thư mục gốc, được ánh xạ vào các dịch vụ Docker Compose và ứng dụng cục bộ:

```env
# ==============================================================================
# CẤU HÌNH HỆ THỐNG CHẤM CÔNG FAS (BIẾN MÔI TRƯỜNG DÙNG CHUNG)
# ==============================================================================

# Cơ sở dữ liệu PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fas_db
DB_USER=fas_admin
DB_PASSWORD=SecurePassword_FAS_2026!

# Máy chủ Backend Spring Boot
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev

# Bảo mật & Mật mã học
JWT_SECRET=4a8f9c2d1e0b5a7c3e6d8f1a2b4c6e8d0f2a4b6c8e0d2f4a6b8c0d2e4f6a8b0c
ENCRYPTION_MASTER_KEY=9f8e7d6c5b4a3a2b1c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b

# Tham số Nghiệp vụ & AI
KIOSK_SECRET_TOKEN=Kiosk_Internal_Secret_Token_2026
LIVENESS_THRESHOLD=0.85
COSINE_SIMILARITY_THRESHOLD=0.50
COOLDOWN_SECONDS=120
COMPLIANCE_DATA_RETENTION_DAYS=20

# Cổng Web Portal
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=http://localhost:8080/ws
```

- 2.5. Khởi tạo & chạy dự án
  - **Bước 0: Khởi tạo Scaffolding Toàn bộ 3 Phân hệ (Chỉ chạy 1 lần duy nhất bằng lệnh CLI)**:
    - Kỹ sư chạy kịch bản *One-Click Monorepo Bootstrap Script* (được cung cấp chi tiết tại mục 2.1) để tải tự động Spring Boot qua `curl.exe`, khởi tạo Web Portal qua `create-vite`, và tạo Virtualenv cho Kiosk.
  - **Cách 1: Triển khai Nhanh Toàn bộ Hạ tầng qua Docker Compose**:
    1. Mở cửa sổ dòng lệnh tại thư mục gốc dự án:
       ```powershell
       cp .env.example .env
       docker-compose up -d --build
       ```
    2. Kiểm tra trạng thái các container:
       ```powershell
       docker-compose ps
       ```
    3. Truy cập Cổng Web Portal tại: `http://localhost:3000` (hoặc `http://localhost:80`).
    4. Giao diện Backend API Swagger (nếu bật) hoặc Endpoint Health tại: `http://localhost:8080/actuator/health`.
    5. Chạy ứng dụng Trạm Điểm danh Kiosk Desktop (chạy trực tiếp trên máy chủ để kết nối webcam phần cứng):
       ```powershell
       cd app/kiosk-app
       python -m venv .venv
       .venv\Scripts\activate
       pip install -r requirements.txt
       python main.py
       ```
  - **Cách 2: Chạy Từng Phân hệ Độc lập để Lập trình & Gỡ lỗi (Dev Mode trong VS Code)**:
    - *Khởi động CSDL PostgreSQL*:

      ```powershell
      docker run -d --name fas-postgres -p 5432:5432 -e POSTGRES_DB=fas_db -e POSTGRES_USER=fas_admin -e POSTGRES_PASSWORD=SecurePassword_FAS_2026! postgres:16-alpine
      ```
    - *Khởi động Backend Service (Java 21)*:

      - Trong VS Code, mở thư mục `app/backend-service`, nhấn tổ hợp phím `F5` hoặc chạy terminal:

      ```powershell
      ./mvnw spring-boot:run
      ```
    - *Khởi động Web Portal (ReactJS)*:

      ```powershell
      cd app/web-portal
      npm install
      npm run dev
      ```

      Ứng dụng Web sẽ hoạt động tại `http://localhost:5173` với tính năng Hot Module Replacement (HMR).
    - *Khởi động Kiosk App (Python)*:

      ```powershell
      cd app/kiosk-app
      .venv\Scripts\activate
      python main.py
      ```

---

**3. Quy trình phát triển**

- 3.1. Branching

  - Hệ thống áp dụng chiến lược phân nhánh rút gọn phù hợp với năng lực kỹ sư độc lập và nhóm tinh gọn (Trunk-based / Simplified Git-flow):
    - `main`: Nhánh sản phẩm chính thức (Production). Chỉ chứa các phiên bản mã nguồn đã vượt qua toàn bộ các bài kiểm thử và được gắn Tag phiên bản (Release Tags: `v1.0.0`, `v1.1.0`).
    - `develop`: Nhánh tích hợp chính trong quá trình phát triển (Nightly / Staging). Toàn bộ tính năng mới được hoàn thiện sẽ được gộp vào nhánh này.
    - `feature/FR-xx-short-name`: Nhánh phát triển tính năng cụ thể tương ứng với mã yêu cầu chức năng.
      - Ví dụ: `feature/FR-01-face-recognition`, `feature/FR-08-informed-consent`, `feature/FR-15-excel-export`.
    - `hotfix/issue-name`: Nhánh khắc phục khẩn cấp lỗi nghiêm trọng trên nhánh `main`.
- 3.2. Commit

  - Mọi commit bắt buộc phải tuân thủ chặt chẽ quy chuẩn **Conventional Commits** để tự động hóa việc theo dõi lịch sử thay đổi và sinh Changelog:
    - Cấu trúc: `<type>(<scope>): <subject> [#<ticket/FR-id>]`
    - Các tiền tố `<type>` được phép sử dụng:
      - `feat`: Bổ sung một tính năng hoặc nghiệp vụ mới.
      - `fix`: Sửa lỗi phát sinh trong mã nguồn.
      - `docs`: Cập nhật tài liệu kỹ thuật hoặc tài liệu SDLC (SRS, DDS, BP).
      - `refactor`: Tái cấu trúc mã nguồn mà không làm thay đổi hành vi nghiệp vụ.
      - `test`: Bổ sung hoặc chỉnh sửa các ca kiểm thử Unit test / Integration test.
      - `chore`: Nâng cấp dependency, chỉnh sửa cấu hình build, kịch bản CI/CD.
    - Ví dụ commit chuẩn:
      - `feat(kiosk): implement liveness check MiniFASNet #FR-02`
      - `feat(backend): add AES-256-GCM encryption for face vectors #FR-11`
      - `fix(web): prevent formula injection on excel download #FR-15`
      - `test(backend): add unit tests for cooldown validator 120s #FR-03`
- 3.3. Code → Review → Merge

  - Quy trình đưa mã nguồn vào nhánh chính:
    1. *Bước 1 (Lập trình & Tự kiểm thử)*: Lập trình viên hoàn thành tính năng trên nhánh `feature/`, chạy linter và bảo đảm 100% Unit test cục bộ thành công.
    2. *Bước 2 (Tạo Pull Request - PR)*: Mở PR từ nhánh `feature/` vào nhánh `develop`.
    3. *Bước 3 (Kiểm tra Tiêu chí Tự đánh giá - Self-Review Checklist)*:
       - [ ] Mã nguồn tuân thủ đúng kiến trúc đã thiết kế trong [DDS.md](../design/DDS.md).
       - [ ] Không có thông tin mật mã, khóa bảo mật tĩnh (hardcoded secrets) trong code.
       - [ ] Đã bổ sung Unit test cho các nhánh điều kiện chính và ngoại lệ.
       - [ ] Tỷ lệ bao phủ kiểm thử (Coverage) của module nghiệp vụ đạt $\ge 80\%$.
       - [ ] Kiểm tra linter không còn cảnh báo lỗi (0 error, 0 warning nghiêm trọng).
    4. *Bước 4 (Merge)*: Thực hiện thao tác `Squash and Merge` hoặc `Rebase and Merge` vào nhánh `develop` để duy trì lịch sử Git phẳng và rõ ràng.
- 3.4. Coding convention

  - **1. Phân hệ Python (`kiosk-app`)**:
    - Tuân thủ tiêu chuẩn quốc tế **PEP 8**.
    - Sử dụng kiểu dữ liệu định danh tường minh (Type Hints) cho tất cả tham số hàm và giá trị trả về (`def match_face(vector: np.ndarray) -> Optional[int]:`).
    - Quy tắc đặt tên: `snake_case` cho hàm và biến; `PascalCase` cho tên lớp (Class); `UPPER_SNAKE_CASE` cho hằng số.
    - Tài liệu hóa hàm theo chuẩn Google Python Style Docstrings.
  - **2. Phân hệ Java (`backend-service`)**:
    - Tuân thủ tiêu chuẩn **Google Java Style Guide**.
    - Đặt tên gói theo tên miền đảo ngược: `com.fas.<layer>.<module>`.
    - Phân tách rõ ràng giữa DTO (Data Transfer Object) và Entity JPA; không để lộ trực tiếp Entity ra tầng Web Controller.
    - Tận dụng Project Lombok (`@Getter`, `@Setter`, `@Builder`, `@RequiredArgsConstructor`) để giảm thiểu mã lặp Boilerplate.
    - Đặt tên theo chuẩn CamelCase: `camelCase` cho biến và phương thức; `PascalCase` cho lớp và interface.
  - **3. Phân hệ TypeScript/React (`web-portal`)**:
    - Tuân thủ hướng dẫn chuẩn của **Airbnb JavaScript/TypeScript Style Guide**.
    - 100% React Components được viết dưới dạng Hàm (Functional Components) kết hợp với React Hooks; không sử dụng Class Components cũ.
    - Khai báo kiểu dữ liệu rõ ràng qua `interface` hoặc `type`; cấm lạm dụng kiểu `any`.
    - Tên tệp component đặt theo `PascalCase.tsx` (VD: `LiveDashboard.tsx`); tệp tiện ích đặt theo `kebab-case.ts` hoặc `camelCase.ts`.
- 3.5. Error handling / logging

  - **1. Chiến lược Xử lý Ngoại lệ (Exception Handling)**:
    - *Backend*: Áp dụng mẫu thiết kế Centralized Exception Handling thông qua `@RestControllerAdvice`. Mọi ngoại lệ nghiệp vụ (`ResourceNotFoundException`, `CooldownViolationException`, `SpoofDetectedException`) đều được ánh xạ về cấu trúc vỏ bọc JSON chuẩn hóa với mã lỗi tương ứng.
    - *Kiosk*: Tuyệt đối không để xảy ra hiện tượng Crash ứng dụng khi camera mất kết nối hoặc khi không nhận diện được mặt. Luôn bọc các khối đọc phần cứng và giao tiếp mạng trong các khối `try ... except` kèm log chi tiết.
  - **2. Chiến lược Ghi Nhật ký (Logging)**:
    - Không sử dụng `System.out.println()` (Java) hay `print()` (Python) trong môi trường sản phẩm. Bắt buộc sử dụng khung ghi log chuẩn (SLF4J/Logback cho Java, `logging` cho Python).
    - Phân định rõ mức độ log:
      - `DEBUG`: Dành riêng cho môi trường phát triển (chi tiết ma trận điểm ảnh, thời gian từng bước AI).
      - `INFO`: Ghi nhận các sự kiện nghiệp vụ thành công (Điểm danh thành công, Ký cam kết thành công, Đồng bộ hoàn tất).
      - `WARN`: Cảnh báo có thể khắc phục (Cooldown bị kích hoạt, lệch góc mặt, mạng chậm).
      - `ERROR`: Lỗi hệ thống nghiêm trọng cần xử lý (Mất kết nối CSDL, camera bị ngắt, lỗi giải mã Bad Tag).
    - Mọi log nghiệp vụ liên quan đến dữ liệu cá nhân phải tuân thủ nguyên tắc che mờ (Masking) dữ liệu nhạy cảm, không ghi log chuỗi vector sinh trắc học thô.
- 3.6. Dependency / configuration management

  - **Quản lý Phiên bản Phụ thuộc (Lockfile Enforcement)**:
    - Bắt buộc lưu trữ các tệp khóa phiên bản vào Git repository (`package-lock.json` cho Web, `pom.xml` ghim version cụ thể cho Java, `requirements.txt` ghim `==` cho Python).
    - Định kỳ hàng tháng quét kiểm tra lỗ hổng bảo mật của các dependency bên thứ ba bằng lệnh `npm audit` và plugin `dependency-check-maven`.

---

**4. Build & Kiểm soát chất lượng**

- 4.1. Quy trình build
  - Bảng tổng hợp lệnh thực thi build đóng gói sản phẩm cho từng phân hệ:

| Phân hệ                         | Lệnh Kiểm tra Cú pháp / Linter | Lệnh Chạy Kiểm thử Tự động | Lệnh Đóng gói Bản dựng (Build Artifact)        |
| :-------------------------------- | :--------------------------------- | :-------------------------------- | :--------------------------------------------------- |
| **`app/backend-service`** | `./mvnw checkstyle:check`        | `./mvnw test`                   | `./mvnw clean package -DskipTests=false`           |
| **`app/kiosk-app`**       | `ruff check .`                   | `pytest tests/ -v`              | `pyinstaller --noconsole --name=FAS_Kiosk main.py` |
| **`app/web-portal`**      | `npm run lint`                   | `npm run test`                  | `npm run build` (Tạo thư mục `dist/`)         |
| **Toàn bộ hệ thống**    | -                                  | -                                 | `docker-compose build --no-cache`                  |

- 4.2. Lint / static analysis

  - **Python**: Sử dụng công cụ `Ruff` (hoặc `Flake8` + `Black`) để kiểm tra cú pháp và định dạng mã nguồn siêu tốc. Cấu hình kiểm tra độ dài dòng tối đa 100 ký tự.
  - **Java**: Tích hợp plugin `maven-checkstyle-plugin` cấu hình theo chuẩn Google Checks, bắt buộc mã nguồn không có cảnh báo vi phạm chuẩn đặt tên và import dư thừa.
  - **TypeScript**: Sử dụng `ESLint` kết hợp plugin `@typescript-eslint/recommended` để phát hiện các biến không sử dụng, cú pháp bất đồng bộ không an toàn và lỗi kiểu dữ liệu.
- 4.3. Unit test

  - **Chiến lược Kiểm thử Đơn vị theo Từng Phân hệ**:
    - *Backend Service*: Sử dụng **JUnit 5**, **Mockito** và **AssertJ**. Tập trung kiểm thử 100% các ca xử lý biên của `AttendanceServiceImpl` (tính giờ muộn với ân hạn 15 phút), `BiometricCryptoServiceImpl` (kiểm tra mã hóa/giải mã AES-256-GCM, bắt ngoại lệ `AEADBadTagException` khi bị sửa byte dữ liệu), và `CooldownValidator` (chặn lượt quẹt trong vòng 120s).
    - *Kiosk Desktop*: Sử dụng **pytest** và **pytest-mock**. Mô phỏng (Mock) đầu vào video và kiểm thử tính đúng đắn của logic so khớp ma trận NumPy Cosine Similarity, cơ chế ghi đệm và khôi phục giao dịch của SQLite WAL khi mất mạng.
    - *Web Portal*: Sử dụng **Vitest** và **React Testing Library**. Kiểm thử render giao diện các thẻ KPI, hành vi hiển thị dòng mới khi nhận dữ liệu STOMP giả lập và modal xác thực chữ ký Informed Consent.
- 4.4. Quality gate / coverage

  - **Ngưỡng Chất lượng Bắt buộc (Quality Gate Standards)**:
    - *Tỷ lệ Bao phủ Mã nguồn (Code Coverage)*:
      - Tầng Dịch vụ Nghiệp vụ Lõi (`service`): Đạt tối thiểu **80% Line Coverage**.
      - Tầng Mật mã & Bảo mật Dữ liệu (`crypto`, `compliance`): Đạt tối thiểu **90% Line Coverage**.
      - Toàn bộ dự án: Đạt mức bình quân $\ge 75\%$.
    - *Tiêu chuẩn Lỗi Biên dịch*: 0 lỗi biên dịch (Compilation Error), 0 cảnh báo bảo mật mức High/Critical từ công cụ quét mã tĩnh.
- 4.5. Build artifact

  - **Sản phẩm Đóng gói Đầu ra**:
    - `fas-backend`: Tệp thực thi `target/backend-service-1.0.0.jar` dung lượng khoảng 45 MB, và Docker image `fas-backend:latest` được xây dựng qua Multi-stage build dựa trên nền `eclipse-temurin:21-jre-alpine`.
    - `fas-web`: Thư mục tĩnh `dist/` chứa mã HTML/CSS/JS đã được nén và tối ưu hóa tài nguyên (Gzip/Brotli), được đóng gói vào Docker image `fas-web:latest` chạy trên nền Nginx Alpine siêu nhẹ ($pprox 25\text{ MB}$).
    - `kiosk-app`: Gói mã nguồn Python chuẩn hóa với môi trường ảo hoặc tệp thực thi độc lập `FAS_Kiosk.exe` được đóng gói qua PyInstaller phục vụ cài đặt nhanh trên các máy trạm Kiosk Windows.
- 4.6. CI pipeline

  - Kịch bản tích hợp liên tục (CI Pipeline) tự động thực thi cục bộ qua Git Hook (Pre-commit / Pre-push) hoặc thông qua GitHub Actions khi có Pull Request:
    - **Giai đoạn 1 (Lint & Static Analysis)**: Chạy Ruff cho Python, Checkstyle cho Java, ESLint cho TypeScript. Nếu có bất kỳ lỗi cú pháp nào, pipeline lập tức dừng lại.
    - **Giai đoạn 2 (Test & Coverage)**: Thực thi toàn bộ test suite của 3 phân hệ song song. Thu thập báo cáo độ phủ mã nguồn qua Jacoco (Java) và pytest-cov (Python).
    - **Giai đoạn 3 (Build & Containerize)**: Thực hiện build các gói sản phẩm và chạy thử nghiệm lệnh `docker-compose config` để đảm bảo tệp cấu hình triển khai hoàn toàn hợp lệ.

---

**5. Bảo trì & Thay đổi mã nguồn**

- 5.1. Versioning mã nguồn

  - Toàn bộ hệ thống tuân thủ nghiêm ngặt quy tắc định danh phiên bản **Semantic Versioning 2.0.0 (SemVer)**:
    - Cấu trúc phiên bản: `MAJOR.MINOR.PATCH` (Ví dụ: `v1.0.0`)
      - `MAJOR`: Thay đổi lớn phá vỡ tính tương thích ngược (Breaking Changes), thay đổi toàn bộ cấu trúc API hoặc mô hình dữ liệu sinh trắc học.
      - `MINOR`: Bổ sung tính năng mới nhưng vẫn tương thích ngược (Backward Compatible), ví dụ thêm báo cáo chấm công mới, hỗ trợ thêm phương thức xác thực.
      - `PATCH`: Các bản vá lỗi nhỏ (Bug fixes), tối ưu hóa hiệu năng, cập nhật bản vá bảo mật thư viện bên thứ ba.
  - Quản lý phiên bản thống nhất trên cả 3 phân hệ Monorepo; khi phát hành một bản Release chính thức, cả 3 phân hệ đều được gắn cùng một Git Tag.
- 5.2. Quản lý thay đổi

  - **Quy trình Quản lý Yêu cầu Thay đổi (Change Request - CR)**:
    1. *Đề xuất*: Mọi yêu cầu thay đổi logic nghiệp vụ chấm công, thuật toán AI hay mô hình CSDL đều phải được ghi nhận dưới dạng một Issue/Ticket kèm lý do cụ thể.
    2. *Đánh giá Tác động (Impact Analysis)*: Phân tích ảnh hưởng của sự thay đổi đối với 16 yêu cầu chức năng [FR.md](../requirements/FR.md), các ràng buộc pháp lý trong [SRS.md](../requirements/SRS.md) và thiết kế kiến trúc trong [DDS.md](../design/DDS.md).
    3. *Phê duyệt*: Được phê duyệt bởi Trưởng dự án (`nvdung`) trước khi tiến hành phân nhánh lập trình.
    4. *Hiện thực hóa & Kiểm thử*: Thực hiện code, viết test case hồi quy và kiểm thử lại toàn bộ luồng nghiệp vụ liên quan trước khi merge vào nhánh chính.
- 5.3. Cập nhật tài liệu khi code thay đổi

  - **Nguyên tắc Đồng bộ Tài liệu - Mã nguồn (Code-Doc Synchronization Policy)**:
    - Mọi Pull Request làm thay đổi cấu trúc bảng CSDL, thêm/sửa/xóa Endpoint API RESTful, thay đổi định dạng bản tin WebSocket STOMP hoặc thay đổi thuật toán AI **bắt buộc phải cập nhật đồng thời các tài liệu SDLC tương ứng trong cùng một PR**:
      - Thay đổi mô hình dữ liệu hoặc API $\rightarrow$ Cập nhật Phần 4 của [DDS.md](../design/DDS.md).
      - Thay đổi quy tắc nghiệp vụ chấm công $\rightarrow$ Cập nhật [FR.md](../requirements/FR.md) và Phần 3 của [DDS.md](../design/DDS.md).
      - Thay đổi cấu hình môi trường hoặc dependency $\rightarrow$ Cập nhật [TS.md](../initiation/TS.md) và [BP.md](BP.md).
    - Tuyệt đối cấm tình trạng "Code một đằng, tài liệu một nẻo", bảo đảm tài liệu SDLC luôn phản ánh trung thực hiện trạng vận hành của hệ thống.
- 5.4. Refactoring & technical debt

  - **Kế hoạch Quản lý Nợ Kỹ thuật (Technical Debt Management)**:
    - Dành định kỳ 10% đến 15% thời gian trong mỗi chu kỳ phát triển để rà soát mã nguồn, loại bỏ mã chết (Dead Code), tối ưu hóa các câu lệnh truy vấn CSDL chậm và tái cấu trúc các phương thức quá dài.
    - Duy trì tính tách biệt độc lập giữa các module thị giác AI để khi cần nâng cấp mô hình nhận diện khuôn mặt mới trong tương lai (Ví dụ: ArcFace thế hệ kế tiếp) chỉ cần thay thế tệp trọng số ONNX và cập nhật lớp `ArcFaceFeatureExtractor` mà không làm ảnh hưởng đến tầng giao diện hay tầng giao tiếp mạng của trạm Kiosk.
