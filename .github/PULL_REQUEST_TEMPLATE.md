## 1. Loại thay đổi
- [ ] Tài liệu (`docs/`)
- [ ] Hệ thống tài liệu (`.github/`, `tools/`)
- [ ] Code sản phẩm

## 2. ID liên quan
<!-- 
  - Tài liệu: ID item bị đổi (ví dụ FR-BKE-001, DD-SYS-001).
  - Code: work item (ví dụ BLD-BKE-001, TST-KSK-001, DPL-001).
  - Hệ thống tài liệu: ghi "none". 
-->
ID: 

Closes #

## 3. Phân hệ bị ảnh hưởng
- [ ] `app/backend-service`
- [ ] `app/kiosk-app`
- [ ] `app/web-portal`
- [ ] `infrastructure` / `docker`
- [ ] `docs`

## 4. Tóm tắt nội dung thay đổi kỹ thuật
- Tóm tắt các thay đổi cốt lõi trong PR:
  1. 
  2. 

## 5. Phân tích tác động (Impact Analysis - Áp dụng khi sửa tài liệu)
- Item trỏ tới ID thay đổi (`Basis`, `Realizes`, `Covers`, `Uses`, `Requires`): 
- Downstream đã đồng bộ cập nhật: 

## 6. Tiêu chí Tự đánh giá & Tuân thủ SDLC (Definition of Done)
*Vui lòng tích chọn toàn bộ các mục trước khi yêu cầu review hoặc merge:*
- [ ] **Quy chuẩn Tiêu đề**: Tiêu đề PR đúng định dạng `<type>(<SCOPE>): <subject> [<ID>]`.
- [ ] **Single Source of Truth**: Sửa tại owner, không sao chép nội dung (`sdlc-docs.md` 11.1).
- [ ] **Đồng bộ Code-Doc**: Tài liệu liên quan đã được cập nhật trong cùng PR; `Status` và `version` đã cập nhật.
- [ ] **Change Request**: Nếu sửa item `Baselined`, đã tham chiếu Issue Change Request (#...).
- [ ] **Plan Update**: Nếu hoàn thành work item, `Status` của work item đã chuyển thành `Done` trong Plan tương ứng.
- [ ] **Bốn Phép thử**: Đạt 4 phép thử: *Correct* (đúng tên), *Complete* (đủ nội dung), *Abstract* (trừu tượng), *Reusable* (tái sử dụng).
- [ ] **Bảo mật**: Tuyệt đối không có mật mã tĩnh (hardcoded secrets / keys) trong mã nguồn.
- [ ] **Kiểm thử tự động**: Toàn bộ pipeline CI (`ci-passed`) và `docs-check` đã xanh.
