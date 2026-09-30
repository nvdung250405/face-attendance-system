# Bộ tài liệu SDLC — Cấu trúc chuẩn hóa

> **Quy ước chung cho mọi tài liệu:**
> - **Mã tài liệu**: TS-FAS-01
> - **Tên tài liệu**: Công nghệ & Công cụ (Technology Stack - TS)
> - **Phiên bản**: 3.2
> - **Trạng thái**: Đã phê duyệt (Approved)
> - **Chủ sở hữu**: nvdung
> - **Người phê duyệt**: nvdung
> - **Ngày hiệu lực**: 2026-09-29
> - **Tài liệu liên quan**: [README.md](../README.md), [PC.md](PC.md), [PI.md](PI.md), [PP.md](../planning/PP.md), [SRS.md](../requirements/SRS.md), [DDS.md](../design/DDS.md)
> - **Lịch sử thay đổi**:
>   - *v1.0 (2026-09-25)*: Khởi tạo danh mục công nghệ ban đầu.
>   - *v2.0 (2026-09-29)*: Nâng cấp Java 21 LTS, Spring Boot 4.x và kiến trúc 3 phân hệ.
>   - *v3.0 (2026-09-29)*: Chuẩn hóa theo khung SDLC.
>   - *v3.1 (2026-09-29)*: Tinh gọn nội dung đúng trọng tâm, xác lập VS Code làm IDE duy nhất.
>   - *v3.2 (2026-09-29)*: Tinh gọn triệt để các phân tích kiến trúc sâu (để dành cho DDS/SRS), bổ sung xác nhận môi trường thực tế trên máy và các extension đã cài sẵn trong VS Code.

---

## TS — Công nghệ & Công cụ (Tech Stack)

**1. Tổng quan**

- 1.1. Mục đích tài liệu
  - Xác lập danh mục chính thức về ngôn ngữ, framework, cơ sở dữ liệu, thư viện và công cụ được sử dụng trong dự án `face-attendance-system`.
  - Định hình phạm vi công nghệ áp dụng cho 3 phân hệ độc lập tại thư mục monorepo `/app`, đảm bảo tính tương thích với môi trường Laptop cá nhân của **nvdung**.

- 1.2. Phạm vi công nghệ
  - Áp dụng xuyên suốt toàn bộ vòng đời phát triển dự án:
    - Kiosk Desktop (`app/kiosk-app`): Ứng dụng client nhận diện khuôn mặt tại điểm danh.
    - Backend Service (`app/backend-service`): Dịch vụ máy chủ xử lý logic, nghiệp vụ, API và quản trị dữ liệu.
    - Web Portal (`app/web-portal`): Cổng thông tin web quản trị hệ thống và tự phục vụ của nhân viên.
  - Công cụ lập trình, môi trường dòng lệnh (Terminal), công cụ kiểm thử và đóng gói phần mềm.

- 1.3. Liên kết với DDS
  - Tài liệu này đóng vai trò là "danh mục tiêu chuẩn công nghệ đầu vào".
  - Các chi tiết sâu về kiến trúc chi tiết, sơ đồ thành phần, luồng xử lý dữ liệu và thiết kế schema cơ sở dữ liệu sẽ được quy định cụ thể tại [DDS.md](../design/DDS.md).

---

**2. Công nghệ hệ thống**

- 2.1. Kiến trúc / nền tảng
  - Mô hình Monorepo tổ chức 3 phân hệ độc lập trong thư mục `/app`.
  - Giao tiếp giữa các phân hệ: REST API (JSON qua HTTP/HTTPS) và WebSocket STOMP (thông báo thời gian thực).

- 2.2. Ngôn ngữ & framework
  - **Kiosk Desktop (`app/kiosk-app`)**:
    - Ngôn ngữ: Python (tương thích Python 3.10+, môi trường máy: Python 3.14.3).
    - Framework GUI: PySide6 (Qt for Python).
    - Thị giác máy tính & AI: OpenCV, ONNX Runtime (chạy trên CPU với các mô hình YuNet, MiniFASNet, ArcFace).
  - **Backend Service (`app/backend-service`)**:
    - Ngôn ngữ: Java 21 LTS (môi trường máy: OpenJDK Temurin 21.0.11).
    - Framework: Spring Boot 4.x (Spring Web, Spring Security, Spring Data JPA, Spring WebSocket).
  - **Web Portal (`app/web-portal`)**:
    - Ngôn ngữ: TypeScript, HTML5, CSS3.
    - Nền tảng / Thư viện UI: ReactJS, Vite (Build Tool & Dev Server).
    - Framework CSS: Tailwind CSS.

- 2.3. Cơ sở dữ liệu & lưu trữ
  - CSDL Quan hệ Trung tâm: PostgreSQL 16+ (quản lý người dùng, điểm danh, phân quyền và dữ liệu vector).
  - CSDL Cục bộ tại Kiosk: SQLite 3 (lưu trữ offline tạm thời khi mất kết nối mạng).
  - Bộ nhớ đệm (Cache): Caffeine Cache tại Backend.

- 2.4. Hạ tầng / cloud
  - Môi trường phát triển & vận hành cục bộ: Laptop cá nhân Windows 11 64-bit (Intel Core i5-12450H, 16GB RAM, GPU NVIDIA GeForce RTX 3050 Ti Laptop GPU 4GB, webcam tích hợp sẵn).
  - Ảo hóa & Container: Docker Desktop 29.7.2 (Docker Compose) dùng để chạy container PostgreSQL và kiểm thử đóng gói.

- 2.5. Công nghệ tích hợp
  - RESTful API (chuẩn OpenAPI 3.0 / Swagger).
  - WebSocket STOMP (kênh giao tiếp hai chiều thời gian thực giữa Backend, Web Portal và Kiosk).
  - Mã hóa & Bảo mật: AES-256-GCM (bảo vệ vector khuôn mặt), BCrypt/Argon2 (mật khẩu/PIN).

---

**3. Công cụ phát triển & vận hành**

- 3.1. Source control
  - Git 2.54+ (Windows), quản lý phiên bản mã nguồn trên GitHub theo mô hình Git Feature Branch.

- 3.2. IDE & Môi trường phát triển
  - **Môi trường làm việc duy nhất**: Sử dụng **Visual Studio Code (VS Code)** cho toàn bộ quá trình phát triển (không sử dụng thêm IDE nào khác).
  - **Môi trường ngôn ngữ & Runtime (đã cài đặt sẵn trực tiếp trên Laptop cá nhân, kiểm tra qua Terminal)**:
    - `Python 3.14.3`: Môi trường thực thi cho Kiosk app và AI inference.
    - `Java 21.0.11 LTS (OpenJDK Temurin)` & `Apache Maven 3.9.16`: Môi trường build và chạy Backend Spring Boot.
    - `Node.js v24.16.0` & `npm`: Môi trường phát triển Web Portal (Vite/React).
    - `Docker 29.7.2`: Môi trường chạy CSDL PostgreSQL container.
  - **Các Extensions đã cài đặt sẵn trong VS Code phục vụ dự án**:
    - *Lập trình Java / Spring Boot*: `vscjava.vscode-java-pack`, `redhat.java`, `vscjava.vscode-maven`, `vmware.vscode-spring-boot`, `vmware.vscode-boot-dev-pack`, `vscjava.vscode-lombok`.
    - *Lập trình Python / AI*: `ms-python.python`, `ms-python.vscode-pylance`, `ms-python.debugpy`, `ms-python.vscode-python-envs`.
    - *Lập trình Web Frontend*: `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `bradlc.vscode-tailwindcss`, `rodrigovallades.es7-react-js-snippets`.
    - *Quản lý Container & CSDL*: `ms-azuretools.vscode-containers`, `cweijan.vscode-database-client2`.
    - *Tài liệu & Tiện ích*: `davidanson.vscode-markdownlint`, `shd101wyy.markdown-preview-enhanced`, `eamodio.gitlens`, `postman.postman-for-vscode`.

- 3.3. Build / package
  - Kiosk Desktop: `PyInstaller` (đóng gói file thực thi `.exe`).
  - Backend Service: `Apache Maven 3.9.16` (đóng gói file `jar`).
  - Web Portal: `Vite` (build bundle tĩnh HTML/JS/CSS).
  - Containerization: `Docker` (Multi-stage build Dockerfile).

- 3.4. CI/CD
  - GitHub Actions: Tự động hóa kiểm tra mã nguồn (Linting), chạy Unit Test và xác thực bản build khi tạo Pull Request.

- 3.5. Testing tools
  - Python: `pytest`, `pytest-qt`.
  - Java: `JUnit 5`, `Mockito`, `Testcontainers`.
  - Frontend: `Vitest`, `React Testing Library`.

- 3.6. Monitoring / logging
  - Backend: SLF4J với Logback.
  - Kiosk: Thư viện `logging` chuẩn của Python (xoay vòng file log).
  - Giám sát trạng thái: Spring Boot Actuator (`/actuator/health`).

- 3.7. Documentation / collaboration
  - Soạn thảo tài liệu theo định dạng Markdown (GFM) trực tiếp trong VS Code.
  - Quản lý tiến độ cá nhân thông qua bảng công việc gắn với các gói WBS trong [PP.md](../planning/PP.md).

---

**4. Danh mục & phiên bản**

| STT | Thành phần | Công nghệ / Công cụ | Phiên bản áp dụng | Mục đích sử dụng |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **IDE** | Visual Studio Code | Mới nhất | Môi trường soạn thảo, biên dịch, debug duy nhất |
| 2 | **Ngôn ngữ** | Python | 3.14.x (tương thích $\ge 3.10$) | Ứng dụng Kiosk & thị giác máy tính |
| 3 | **Ngôn ngữ** | Java (OpenJDK Temurin) | 21.0.11 LTS | Dịch vụ máy chủ Backend |
| 4 | **Ngôn ngữ** | TypeScript | 5.x | Cổng thông tin Web Portal |
| 5 | **Runtime Web**| Node.js | v24.16.x | Môi trường build Web Portal |
| 6 | **GUI Framework** | PySide6 | 6.6+ | Giao diện máy tính để bàn cho Kiosk |
| 7 | **Computer Vision** | OpenCV & ONNX Runtime | 4.9+ / 1.17+ | Xử lý khung hình và suy luận mô hình AI trên CPU |
| 8 | **Backend Framework** | Spring Boot | 4.x | Khung phát triển ứng dụng máy chủ và REST API |
| 9 | **Build Tool Java** | Apache Maven | 3.9.16 | Quản lý thư viện và đóng gói Backend |
| 10 | **Frontend Framework** | ReactJS | 18.3+ | Xây dựng giao diện người dùng Web |
| 11 | **Bundler Web** | Vite | 5.2+ | Máy chủ phát triển cục bộ và đóng gói Web |
| 12 | **CSS Framework** | Tailwind CSS | 3.4+ | Tạo kiểu giao diện người dùng hiện đại |
| 13 | **CSDL Chính** | PostgreSQL | 16+ | Lưu trữ quan hệ tập trung và dữ liệu người dùng |
| 14 | **CSDL Cục bộ** | SQLite | 3.x | Bộ nhớ lưu tạm ngoại tuyến trên Kiosk |
| 15 | **Container** | Docker Desktop | 29.7.x | Điều phối môi trường container cục bộ |
| 16 | **Quản lý mã nguồn** | Git | 2.54+ | Quản lý phiên bản mã nguồn |

---

**5. Quyết định lựa chọn**

- 5.1. Công nghệ / công cụ được chọn
  - Lựa chọn bộ công nghệ phân định rõ ràng theo chức năng: Python cho Kiosk (thế mạnh về AI/Computer Vision), Java/Spring Boot cho Backend (bảo mật, hiệu năng đa luồng cao), React/TypeScript cho Web Portal (giao diện hiện đại, phản hồi nhanh).
  - Chọn duy nhất **VS Code** làm IDE phát triển xuyên suốt cho cả 3 ngôn ngữ và 3 phân hệ.

- 5.2. Lý do lựa chọn
  - Tối ưu hóa trên phần cứng có sẵn (Laptop Intel Core i5, không cần GPU rời): Mô hình AI dạng ONNX chạy tốt trên CPU với tốc độ phản hồi nhanh.
  - Tận dụng hệ sinh thái phong phú và tính ổn định cao của Java 21 LTS và Spring Boot trong việc quản trị dữ liệu và tích hợp hệ thống.
  - Sử dụng VS Code giúp tiết kiệm tối đa tài nguyên RAM của Laptop so với việc mở đồng thời nhiều IDE cồng kềnh, đồng thời hệ thống Extension của VS Code hỗ trợ đầy đủ và mạnh mẽ cho cả Python, Java, React và Docker.

- 5.3. Phương án đã xem xét
  - Không sử dụng thêm các IDE riêng biệt (như IntelliJ IDEA, PyCharm) để tránh lãng phí RAM và đơn giản hóa thao tác làm việc.
  - Không sử dụng các framework GUI Python hạn chế về hiệu năng đồ họa (như Tkinter) hoặc vướng vấn đề giấy phép thương mại (như PyQt).

- 5.4. Trade-off / hạn chế
  - Dự án sử dụng đa ngôn ngữ đòi hỏi người thực hiện (**nvdung**) nắm vững cả ba môi trường Python, Java và TypeScript.
  - AI suy luận trên CPU có thông lượng xử lý giới hạn hơn so với máy chủ trang bị GPU chuyên dụng, tuy nhiên hoàn toàn đáp ứng tốt nhu cầu điểm danh đơn lẻ tại máy Kiosk.

- 5.5. Điều kiện hoặc ràng buộc khi sử dụng
  - Máy tính phát triển cần mở Docker Desktop khi chạy Backend để kết nối CSDL PostgreSQL.
  - Kiosk yêu cầu camera USB hoặc webcam tích hợp trên laptop hoạt động ổn định.

---

**6. Quản lý công nghệ**

- 6.1. Quy tắc nâng cấp phiên bản
  - Giữ cố định các phiên bản runtime chính (Java 21, Python 3.14, Node.js 24, Maven 3.9) trong suốt quá trình phát triển để đảm bảo tính ổn định.
  - Chỉ cập nhật các bản vá lỗi (patch) cho các thư viện khi phát hiện lỗ hổng bảo mật nghiêm trọng.

- 6.2. Quản lý dependency
  - Kiosk Python: Quản lý thư viện qua file `requirements.txt`.
  - Backend Java: Khai báo phụ thuộc tập trung qua file `pom.xml` của Maven.
  - Web Portal: Khai báo thư viện qua `package.json` và cố định phiên bản bằng `package-lock.json`.

- 6.3. Công nghệ / công cụ không còn sử dụng
  - Không sử dụng các phiên bản Java cũ (Java 8, 11, 17), các công cụ build cũ (Ant), hoặc các IDE thương mại nặng.

- 6.4. Quy trình thay đổi stack
  - Nếu phát sinh nhu cầu thay đổi hoặc bổ sung thư viện/công cụ mới: Thử nghiệm độc lập $\rightarrow$ Đánh giá tính tương thích trên máy $\rightarrow$ Cập nhật tài liệu TS $\rightarrow$ Áp dụng vào mã nguồn.

