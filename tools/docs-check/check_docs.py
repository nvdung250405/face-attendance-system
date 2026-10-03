#!/usr/bin/env python3
"""Script kiểm tra tính toàn vẹn của hệ thống tài liệu SDLC (docs-check).

Tuân thủ quy tắc tại:
- .github/github-docs.md mục 10.3
- docs/sdlc-docs.md mục 3.4
"""

import sys
from pathlib import Path
import re

VALID_STATUSES = {
    "Draft",
    "In Review",
    "Approved",
    "Baselined",
    "Deprecated",
}

REQUIRED_FRONTMATTER_FIELDS = ["title", "version", "status", "owner"]


def parse_frontmatter(content: str) -> dict[str, str] | None:
    """Trích xuất YAML front matter ở đầu file markdown."""
    pattern = r"^---\s*\n(.*?)\n---\s*\n"
    match = re.match(pattern, content, re.DOTALL)
    if not match:
        return None

    yaml_block = match.group(1)
    metadata = {}
    for line in yaml_block.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            metadata[key.strip().lower()] = val.strip().strip("'\"")
    return metadata


def validate_doc_file(file_path: Path) -> list[str]:
    """Kiểm tra tính hợp lệ của một tệp tài liệu markdown."""
    errors = []
    
    # Bỏ qua README.md và tài liệu chuẩn khung gốc sdlc-docs.md
    if file_path.name.lower() in ["readme.md", "sdlc-docs.md"]:
        return errors

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        return [f"Không thể đọc file: {e}"]

    # 1. Kiểm tra Front Matter
    metadata = parse_frontmatter(content)
    if metadata is None:
        errors.append("Thiếu khối YAML Front Matter (--- ... ---) ở đầu tệp.")
        return errors

    # 2. Kiểm tra các trường bắt buộc
    for field in REQUIRED_FRONTMATTER_FIELDS:
        if field not in metadata or not metadata[field]:
            errors.append(f"Thiếu trường bắt buộc trong front matter: '{field}'.")

    # 3. Kiểm tra tính hợp lệ của trường status
    status = metadata.get("status")
    if status and status not in VALID_STATUSES:
        errors.append(
            f"Trạng thái '{status}' không hợp lệ. Phải thuộc: {sorted(VALID_STATUSES)}"
        )

    return errors


def main() -> int:
    workspace_root = Path(__file__).resolve().parent.parent.parent
    docs_dir = workspace_root / "docs"

    if not docs_dir.exists():
        print(f"❌ Thư mục docs không tồn tại tại: {docs_dir}")
        return 1

    md_files = list(docs_dir.rglob("*.md"))
    print(f"🔍 Bắt đầu kiểm tra {len(md_files)} tệp tài liệu markdown trong docs/...")

    has_errors = False
    checked_count = 0
    passed_count = 0

    for file_path in sorted(md_files):
        # Bỏ qua tệp mẫu hoặc README
        if file_path.name.lower() == "readme.md":
            continue

        checked_count += 1
        rel_path = file_path.relative_to(workspace_root)
        errors = validate_doc_file(file_path)

        if errors:
            has_errors = True
            print(f"\n❌ [LỖI] {rel_path}:")
            for err in errors:
                print(f"   - {err}")
        else:
            passed_count += 1

    print("\n============================================================")
    print(f"KẾT QUẢ KIỂM TRA TÀI LIỆU (DOCS-CHECK):")
    print(f"  - Tổng số tệp kiểm tra: {checked_count}")
    print(f"  - Hợp lệ (Passed):      {passed_count}")
    print(f"  - Không hợp lệ:         {checked_count - passed_count}")
    print("============================================================")

    if has_errors:
        print("❌ docs-check thất bại! Vui lòng khắc phục các lỗi front matter ở trên.")
        return 1

    print("✅ Toàn bộ tài liệu hợp lệ đạt chuẩn SDLC Front Matter!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
