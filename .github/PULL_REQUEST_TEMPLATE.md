### 1. Tiêu đề Pull Request & Loại thay đổi
*Quy chuẩn tiêu đề: `<type>(<scope>): <mô tả ngắn> [#<mã-FR/Issue>]`*

Chọn loại thay đổi áp dụng:
- [ ] `feat`: Bổ sung tính năng mới
- [ ] `fix`: Sửa lỗi phát sinh
- [ ] `docs`: Cập nhật tài liệu kỹ thuật / SDLC
- [ ] `refactor`: Tái cấu trúc mã nguồn không đổi hành vi
- [ ] `test`: Bổ sung hoặc cập nhật ca kiểm thử
- [ ] `chore`: Cập nhật dependency, cấu hình môi trường, CI/CD

### 2. Liên kết Issue / Ticket
- Liên kết: Closes #... hoặc Refs #...
- Yêu cầu chức năng tham chiếu: `FR-xx` (trong `docs/requirements/FR.md`)

### 3. Phân hệ bị ảnh hưởng
- [ ] `app/kiosk-app`
- [ ] `app/backend-service`
- [ ] `app/web-portal`
- [ ] `infrastructure` / `docker`
- [ ] `docs`

### 4. Tóm tắt nội dung thay đổi kỹ thuật
- Tóm tắt 3-5 ý chính về các thay đổi trong PR này:
  1. ...
  2. ...
  3. ...

### 5. Tiêu chí Tự đánh giá Bắt buộc (Self-Review Checklist theo BP.md)
*Vui lòng tích chọn toàn bộ các mục trước khi yêu cầu review hoặc merge:*
- [ ] **Kiến trúc**: Mã nguồn tuân thủ đúng kiến trúc đã thiết kế trong `docs/design/DDS.md`.
- [ ] **Bảo mật**: Tuyệt đối không có thông tin mật mã, khóa bảo mật tĩnh (hardcoded secrets) trong code.
- [ ] **Kiểm thử**: Đã bổ sung Unit test cho các nhánh điều kiện chính và ngoại lệ.
- [ ] **Bao phủ mã**: Tỷ lệ bao phủ kiểm thử (Coverage) của module nghiệp vụ đạt $\ge 80\%$.
- [ ] **Chất lượng mã**: Kiểm tra linter không còn cảnh báo lỗi (0 error, 0 warning nghiêm trọng).
- [ ] **Đồng bộ tài liệu (Code-Doc Sync)**: Đã cập nhật tài liệu SDLC tương ứng trong cùng PR nếu có thay đổi cấu trúc bảng CSDL, thêm/sửa Endpoint API hoặc thay đổi quy tắc chấm công.
