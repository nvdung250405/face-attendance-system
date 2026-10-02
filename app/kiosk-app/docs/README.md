# Phân hệ Trạm Điểm danh Kiosk Desktop (FAS Kiosk)

> **Mã phân hệ:** `SVC-KSK`  
> **Cấp độ:** Cấp Dịch vụ (Service-Level)  
> **Vị trí tài liệu chính thức:** [`docs/service-docs/kiosk-app/`](../../../docs/service-docs/kiosk-app/README.md)  
> **Quy chuẩn Quản trị:** Tuân thủ tiêu chuẩn SDLC chuẩn hóa quy định tại [`docs/sdlc-docs.md`](../../../docs/sdlc-docs.md) và [`docs/meta.md`](../../../docs/meta.md).

---

## 📌 Thông báo Chuyển giao Hệ thống Tài liệu (Canonical Location)

Hệ thống tài liệu kỹ thuật của phân hệ Kiosk đã được chuẩn hóa và chuyển đổi hoàn toàn sang mô hình phân tầng chuẩn 4 facet tại thư mục trung tâm của dự án:

👉 **[Bấm vào đây để truy cập Bộ Tài liệu Chuẩn hóa Phân hệ Kiosk](../../../docs/service-docs/kiosk-app/README.md)**

### Cấu trúc 4 Nhánh Facet Tài liệu Kiosk:
1. **Core Business & Vision**:
   - [Kế hoạch Thiết lập Nền tảng (FSP)](../../../docs/service-docs/kiosk-app/core/fsp.md)
   - [Đặc tả Yêu cầu Chức năng & Phi chức năng (Specs)](../../../docs/service-docs/kiosk-app/core/fr-nfr-specs.md)
   - [Thiết kế Kỹ thuật & Pipeline Thị giác (Design)](../../../docs/service-docs/kiosk-app/core/fr-nfr-design.md)
   - [Kế hoạch Thi công Cốt lõi (Build Plan)](../../../docs/service-docs/kiosk-app/core/fr-nfr-build-plan.md)
   - [Kế hoạch & Ma trận Kiểm thử Nội bộ (Test Plan)](../../../docs/service-docs/kiosk-app/core/test-plan.md)
2. **Giao diện Người dùng (UI/UX 9:16 Portrait)**:
   - [Đặc tả Trải nghiệm & Trạng thái Oval](../../../docs/service-docs/kiosk-app/ui-ux/ui-ux-specs.md)
   - [Thiết kế Bố cục QML & Design Tokens](../../../docs/service-docs/kiosk-app/ui-ux/ui-ux-design.md)
   - [Kế hoạch Thi công Giao diện QML](../../../docs/service-docs/kiosk-app/ui-ux/ui-ux-build-plan.md)
3. **Giao tiếp Truyền thông (API & WebSocket)**:
   - [Đặc tả Interface & STOMP Events](../../../docs/service-docs/kiosk-app/api/api-specs.md)
   - [Thiết kế HTTP Client & Subscriber Worker](../../../docs/service-docs/kiosk-app/api/api-design.md)
   - [Kế hoạch Thi công Tầng Mạng](../../../docs/service-docs/kiosk-app/api/api-build-plan.md)
4. **Lưu trữ Cục bộ (Local Data & RAM Matrix)**:
   - [Đặc tả Dữ liệu Cục bộ & Hàng đợi SQLite](../../../docs/service-docs/kiosk-app/data/data-specs.md)
   - [Thiết kế Lược đồ SQLite WAL & NumPy RAM](../../../docs/service-docs/kiosk-app/data/data-design.md)
   - [Kế hoạch Thi công Tầng Lưu trữ Biên](../../../docs/service-docs/kiosk-app/data/data-build-plan.md)

---

## 🖼️ Thư viện Ảnh Chụp Giao diện Thực tế (Screenshots Gallery)

Thư mục cục bộ `screenshots/` lưu trữ các hình ảnh chụp thực tế màn hình hoạt động của ứng dụng trạm Kiosk:

* [Màn hình chờ Chào mừng (Standby)](screenshots/01_standby_welcome.png)
* [Khung quét Camera trực tiếp (Active Scanning)](screenshots/02_active_scanning.png)
* [Thẻ kết quả nổi khi nhận diện thành công (Success Result Card)](screenshots/03_active_success_card.png)
* [Hộp thoại Bàn phím số ảo PIN Pad (PIN Pad Dialog)](screenshots/04_pin_dialog.png)
* [Hộp thoại Tự đăng ký khuôn mặt 3 bước (Enrollment Dialog)](screenshots/05_enrollment_dialog.png)
* [Hộp thoại Hướng dẫn sử dụng (Help Dialog)](screenshots/06_help_dialog.png)
