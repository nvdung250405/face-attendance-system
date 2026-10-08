# Hướng dẫn Kỹ thuật dành cho AI Coding Assistant (github-docs.md mục 15)

Tài liệu này định hình cách trợ lý AI (GitHub Copilot / Antigravity / Claude / Cursor) làm việc trong kho lưu trữ FAS Monorepo.

---

## 1. Nguyên tắc Trọng yếu

1. **Đọc Registry trước khi hành động**:
   - Tham chiếu [docs/meta.md](file:///d:/workspace/VSCode/nvdung/face-attendance-system/docs/meta.md) và [docs/sdlc-docs.md](file:///d:/workspace/VSCode/nvdung/face-attendance-system/docs/sdlc-docs.md) để xác định đúng leaf tài liệu sở hữu thông tin.
   - Nạp ngữ cảnh theo mã ID (`FR-`, `ARC-`, `SOL-`, `DD-`, `BLD-`, `TST-`), không nạp toàn bộ cây tài liệu vào ngữ cảnh ([sdlc-docs.md](file:///d:/workspace/VSCode/nvdung/face-attendance-system/docs/sdlc-docs.md) §12.5).
2. **Tôn trọng Single Source of Truth**:
   - Không tự ý định nghĩa lại requirement hoặc kiến trúc thuộc phạm vi của leaf khác.
   - Sửa đổi trực tiếp tại owner, không copy nội dung.
3. **Quy chuẩn Định danh ID**:
   - Sử dụng đúng scheme định danh (`PREFIX-SCOPE-NNN`). Tuyệt đối không tự ý phát minh prefix hay format mới.
4. **Quy trình Nhánh, Commit & Pull Request**:
   - **Nhánh**: Tạo nhánh ngắn từ `develop` theo định dạng: `<type>/<ID>-<slug>` (ví dụ: `feat/BLD-BE-001-user-entity`).
   - **Commit**: Tuân thủ Conventional Commits: `<type>(<SCOPE>): <subject>`.
   - **Tiêu đề PR**: Bắt buộc mang ID: `<type>(<SCOPE>): <subject> [<ID>]`.
5. **Kỷ luật CI/CD & Testing**:
   - Tuyệt đối không vô hiệu hóa kiểm thử, bỏ qua linter, hoặc sửa workflow CI để "lách" qua lỗi.
   - Khi sửa lỗi, phải xác minh bằng kiểm thử tự động tại local trước khi đẩy PR.
