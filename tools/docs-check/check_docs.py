#!/usr/bin/env python3
"""Kiểm tra tính toàn vẹn của hệ thống tài liệu SDLC (docs-check).

Hiện thực các kiểm tra structural mà `docs/sdlc-docs.md` (v3.x) và `.github/github-docs.md`
yêu cầu:

* Mục 3.1  — conventions, front matter, version, tập giá trị Status theo loại item.
* Mục 9.3  — trace field và target hợp lệ của `Basis`.
* Mục 10   — prefix/ID scheme, ID bất biến và không trùng.
* Mục 11.3 — artifact structural rules: design có `Realizes`, work item có `Covers`,
             `TASK-` có `Derived from`, requirement có design + test item,
             BLD/FND của service phải được phân rã thành `TASK-`,
             `BLD-` của facet không `Depends on` facet khác.
* Mục 12.4 — CI invariants: blocking structural checks (FM, ID, REF, STR)
             và các tiêu chí semantic/coverage thuộc warning/allowlist.
* Mục 2    — cấu trúc cây tài liệu `specs/`, `plans/` ở System và Subsystem.

Sáu phép thử chất lượng ở mục 11.2 là human review, script này KHÔNG thay thế.

Cách dùng:
    python tools/docs-check/check_docs.py [--matrix <đường dẫn>] [--baseline]

Biến môi trường:
    DOCS_CHECK_BASE_REF   Git ref của nhánh nền (ví dụ sha base của pull
                          request). Khi có, bật kiểm tra change control:
                          leaf `Baselined` bị sửa phải tăng `version`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Registry theo sdlc-docs.md mục 3.1, 10, 11.3
# ---------------------------------------------------------------------------

LEAF_STATUSES = {"Draft", "In Review", "Approved", "Baselined", "Deprecated"}

SCOPED_TYPES = {"FR", "NFR", "UI", "API", "DATA", "SOL", "UXD", "APD", "DTD", "DD", "APC",
                "FND", "BLD", "TASK", "TST", "DPL"}
UNSCOPED_TYPES = {"RQ", "SRC", "INF", "ANL", "GAP", "PD", "STK", "ACT", "EXT", "SRS",
                  "PRJ", "ROL", "RSK", "ARC"}
KNOWN_SCOPES = {"SYS", "BE", "WEB", "KSK"}

STATUS_BY_TYPE = {
    "RQ": {"Draft", "Open", "In progress", "In Progress", "Resolved", "Closed", "Obsolete"},
    "GAP": {"Draft", "Open", "In progress", "In Progress", "Resolved", "Closed", "Obsolete"},
    "ANL": {"Draft", "Reviewed", "Accepted", "Superseded", "Rejected", "Deprecated"},
    "SRC": {"Unverified", "Verified", "Obsolete"},
    "INF": {"Draft", "Reviewed", "Unverified", "Verified", "Superseded", "Rejected", "Obsolete"},
    "PD": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Superseded", "Deprecated"},
    "DD": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Implemented", "Superseded", "Deprecated"},
    "APC": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Superseded", "Deprecated"},
    "STK": {"Proposed", "Approved", "Adopted", "Superseded", "Deprecated"},
    "ARC": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Implemented", "Superseded", "Deprecated"},
    "SOL": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Implemented", "Superseded", "Deprecated"},
    "UXD": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Implemented", "Superseded", "Deprecated"},
    "APD": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Implemented", "Superseded", "Deprecated"},
    "DTD": {"Draft", "In Review", "Proposed", "Accepted", "Approved", "Implemented", "Superseded", "Deprecated"},
    "FND": {"Planned", "Ready", "In progress", "In Progress", "Blocked", "Done", "Cancelled"},
    "BLD": {"Planned", "Ready", "In progress", "In Progress", "Blocked", "Done", "Cancelled"},
    "TST": {"Planned", "Ready", "In progress", "In Progress", "Passed", "Failed", "Blocked", "Done", "Cancelled"},
    "DPL": {"Planned", "Ready", "In progress", "In Progress", "Blocked", "Done", "Cancelled"},
    "PRJ": {"Planned", "Ready", "In progress", "In Progress", "Blocked", "Done", "Cancelled"},
    "TASK": {"Planned", "Ready", "In progress", "In Progress", "Blocked", "Done", "Cancelled"},
    "RSK": {"Open", "In progress", "In Progress", "Mitigating", "Mitigated", "Accepted", "Closed"},
}
SPEC_TYPES = {"SRS", "FR", "NFR", "UI", "API", "DATA"}
INFO_TYPES = {"RQ", "GAP", "SRC", "INF", "ANL"}
SPEC_ITEM_STATUS = {"Draft", "In Review", "Approved", "Implemented", "Verified", "Deferred", "Rejected", "Superseded", "Deprecated"}

DESIGN_TYPES = {"ARC", "SOL", "UXD", "APD", "DTD"}
WORK_TYPES = {"FND", "BLD", "TST", "DPL"}
TEST_TYPES = {"TST"}
REQUIREMENT_TYPES = {"SRS", "FR", "NFR", "UI", "API", "DATA"}
SERVICE_INTERFACE_TYPES = {"API"}

TRACE_COLUMNS = ("Basis", "Realizes", "Covers", "Uses", "Requires", "Derived from",
                 "Depends on", "Decisions", "Includes")

# Target hợp lệ của `Basis` theo sdlc-docs.md mục 9.3 (chỉ áp cho item type được quy định rõ)
BASIS_FORBIDDEN = {
    "PD": {"SRS", "FR", "NFR", "UI", "API", "DATA", "ARC", "SOL", "UXD", "APD", "DTD",
           "DD", "FND", "BLD", "TASK", "TST", "DPL", "PRJ", "APC"},
    "DD": {"FND", "BLD", "TASK", "TST", "DPL", "PRJ", "APC"},
    "STK": {"SRS", "FR", "NFR", "UI", "API", "DATA", "ARC", "SOL", "UXD", "APD", "DTD",
            "DD", "FND", "BLD", "TASK", "TST"},
    "ARC": {"FND", "BLD", "TASK", "TST", "DPL", "PRJ", "APC"},
    "SOL": {"FND", "BLD", "TASK", "TST", "DPL", "PRJ", "APC"},
    "UXD": {"FND", "BLD", "TASK", "TST", "DPL", "PRJ", "APC"},
    "APD": {"FND", "BLD", "TASK", "TST", "DPL", "PRJ", "APC"},
    "DTD": {"FND", "BLD", "TASK", "TST", "DPL", "PRJ", "APC"},
}
BASIS_SPEC_ALLOWED = {"SRC", "INF", "ANL", "PD", "SRS", "FR", "NFR", "UI", "API", "DATA", "ARC", "STK", "RSK", "RQ", "GAP", "ACT", "EXT", "DD"}

MOSCOW = {"Must", "Should", "Could", "Won't"}

FACET_BY_PREFIX = {
    "SOL": "core",
    "DTD": "data",
    "DATA": "data",
    "APD": "api",
    "API": "api",
    "UXD": "ui-ux",
    "UI": "ui-ux",
}

ID_RE = re.compile(r"`([A-Z]{2,4}(?:-[A-Z]{2,4})?-\d{3})`")
ID_STRICT_RE = re.compile(r"^(?P<type>[A-Z]{2,4})(?:-(?P<scope>[A-Z]{2,5}))?-(?P<num>\d{3})$")
VERSION_RE = re.compile(r"^\d+\.\d+$")
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
SEPARATOR_RE = re.compile(r"^:?-{2,}:?$")

# ---------------------------------------------------------------------------
# Mô hình dữ liệu
# ---------------------------------------------------------------------------


@dataclass
class Item:
    item_id: str
    leaf: str
    columns: dict[str, str]
    line: int
    status: str = ""
    name: str = ""

    @property
    def type(self) -> str:
        m = ID_STRICT_RE.match(self.item_id)
        return m.group("type") if m else self.item_id.split("-")[0]


@dataclass
class Leaf:
    path: Path
    rel: str
    front: dict[str, str] = field(default_factory=dict)
    items: list[Item] = field(default_factory=list)


@dataclass
class Problem:
    code: str
    message: str
    item_id: str | None = None

    def key(self) -> tuple[str, str]:
        return (self.code, self.item_id or self.message)


def type_of(item_id: str) -> str:
    m = ID_STRICT_RE.match(item_id)
    return m.group("type") if m else item_id.split("-")[0]


# ---------------------------------------------------------------------------
# Đọc tài liệu
# ---------------------------------------------------------------------------


def parse_front_matter(text: str) -> dict[str, str] | None:
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return None
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, val = line.split(":", 1)
        meta[key.strip().lower()] = val.strip().strip("'\"")
    return meta


def split_row(line: str) -> list[str]:
    """Tách một dòng bảng markdown, tôn trọng escape `\\|` bên trong ô (GFM)."""
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    cells: list[str] = []
    current: list[str] = []
    i = 0
    while i < len(line):
        if line[i] == "\\" and i + 1 < len(line) and line[i + 1] == "|":
            current.append("|")
            i += 2
            continue
        if line[i] == "|":
            cells.append("".join(current).strip())
            current = []
            i += 1
            continue
        current.append(line[i])
        i += 1
    cells.append("".join(current).strip())
    return cells


def parse_tables(text: str):
    """Sinh (line_number, header, cells) cho mọi dòng dữ liệu của bảng markdown."""
    header: list[str] | None = None
    for idx, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line.startswith("|"):
            header = None
            continue
        cells = split_row(line)
        if header is None:
            header = cells
            continue
        if all(SEPARATOR_RE.match(c) for c in cells if c):
            continue
        yield idx, header, cells


def normalize_header(header: str) -> str:
    """Chuẩn hóa tiêu đề cột về dạng canonical (hỗ trợ song ngữ và format Markdown)."""
    h = header.strip()
    h_lower = h.lower()
    if "covers" in h_lower or "bao phủ" in h_lower:
        return "Covers"
    if "depends on" in h_lower or "phụ thuộc" in h_lower:
        return "Depends on"
    if "realizes" in h_lower or "hiện thực" in h_lower:
        return "Realizes"
    if "basis" in h_lower or "cơ sở" in h_lower:
        return "Basis"
    if "decisions" in h_lower or "quyết định" in h_lower:
        return "Decisions"
    if "derived from" in h_lower or "nguồn gốc" in h_lower:
        return "Derived from"
    if "done when" in h_lower or "tiêu chí" in h_lower or "criteria" in h_lower:
        return "Done when"
    if "status" in h_lower or "trạng thái" in h_lower:
        return "Status"
    if "name" in h_lower or "tên" in h_lower:
        return "Name"
    if "wave" in h_lower:
        return "Wave"
    if "priority" in h_lower or "ưu tiên" in h_lower:
        return "Priority"
    if "owner" in h_lower or "chủ sở hữu" in h_lower:
        return "Owner"
    if "includes" in h_lower or "bao gồm" in h_lower:
        return "Includes"
    return h


def load_leaves(docs_dir: Path) -> dict[str, Leaf]:
    leaves: dict[str, Leaf] = {}
    for path in sorted(docs_dir.rglob("*.md")):
        if path.name in ("sdlc-docs.md",):
            continue
        rel = path.relative_to(docs_dir.parent).as_posix()
        text = path.read_text(encoding="utf-8")
        leaf = Leaf(path=path, rel=rel, front=parse_front_matter(text) or {})
        for lineno, header, cells in parse_tables(text):
            m = ID_RE.fullmatch(cells[0])
            if not m:
                continue
            columns = {normalize_header(header[i]) if i < len(header) else f"col{i}": cell
                       for i, cell in enumerate(cells)}
            item = Item(item_id=m.group(1), leaf=rel, columns=columns, line=lineno,
                        status=columns.get("Status", ""), name=columns.get("Name", ""))
            leaf.items.append(item)
        leaves[rel] = leaf
    return leaves


def build_index(leaves: dict[str, Leaf]):
    defines: dict[str, list[Item]] = defaultdict(list)
    for leaf in leaves.values():
        for item in leaf.items:
            defines[item.item_id].append(item)
    incoming: dict[str, list[tuple[str, str, str]]] = defaultdict(list)  # dst -> (src, col, leaf)
    for leaf in leaves.values():
        for item in leaf.items:
            for col, cell in item.columns.items():
                if col not in TRACE_COLUMNS:
                    continue
                for ref in ID_RE.finditer(cell):
                    if ref.group(1) != item.item_id:
                        incoming[ref.group(1)].append((item.item_id, col, leaf.rel))
    return defines, incoming


# ---------------------------------------------------------------------------
# Các kiểm tra
# ---------------------------------------------------------------------------


def check_front_matter(leaves, problems):
    for leaf in leaves.values():
        if leaf.path.name.lower() == "readme.md":
            continue
        if not leaf.front:
            problems.append(Problem("FM001", f"{leaf.rel}: thiếu khối YAML front matter"))
            continue
        for field_name in ("title", "version", "status", "owner"):
            if not leaf.front.get(field_name):
                problems.append(Problem("FM001", f"{leaf.rel}: thiếu trường '{field_name}'"))
        status = leaf.front.get("status", "")
        if status and status not in LEAF_STATUSES:
            problems.append(Problem("FM002", f"{leaf.rel}: status '{status}' không hợp lệ"))
        version = leaf.front.get("version", "")
        if version and not VERSION_RE.match(version):
            problems.append(Problem("FM003", f"{leaf.rel}: version '{version}' không đúng MAJOR.MINOR"))


def check_ids(defines, problems):
    for item_id, items in defines.items():
        m = ID_STRICT_RE.match(item_id)
        if not m:
            problems.append(Problem("ID001", f"ID sai định dạng: {item_id}", item_id))
            continue
        item_type, scope = m.group("type"), m.group("scope")
        if item_type not in SCOPED_TYPES and item_type not in UNSCOPED_TYPES:
            problems.append(Problem("ID001", f"{item_id}: prefix '{item_type}' không có trong registry (§11)", item_id))
            continue
        if item_type in SCOPED_TYPES and not scope:
            problems.append(Problem("ID001", f"{item_id}: prefix '{item_type}' bắt buộc có SCOPE (§11)", item_id))
        if item_type in UNSCOPED_TYPES and scope:
            problems.append(Problem("ID001", f"{item_id}: prefix '{item_type}' không dùng SCOPE (§11)", item_id))
        if scope and scope not in KNOWN_SCOPES:
            problems.append(Problem("ID001", f"{item_id}: SCOPE '{scope}' không thuộc {sorted(KNOWN_SCOPES)}", item_id))
        leaves = {i.leaf for i in items}
        if len(leaves) > 1:
            problems.append(Problem("ID003", f"{item_id}: định nghĩa ở nhiều leaf: {sorted(leaves)}", item_id))


def check_references(defines, incoming, problems):
    for dst, edges in incoming.items():
        if dst not in defines:
            srcs = sorted({src for src, _, _ in edges})
            problems.append(Problem("REF001", f"tham chiếu tới ID không tồn tại: {dst} (từ {srcs})", dst))
    for item_id, items in defines.items():
        item_type = type_of(item_id)
        for item in items:
            basis = item.columns.get("Basis", "")
            for ref in ID_RE.finditer(basis):
                target_type = type_of(ref.group(1))
                forbidden = BASIS_FORBIDDEN.get(item_type)
                if forbidden and target_type in forbidden:
                    problems.append(Problem(
                        "REF002", f"{item_id}: Basis trỏ tới '{ref.group(1)}' ({target_type}) — không hợp lệ theo §10.2", item_id))
                if item_type in SPEC_TYPES and target_type not in BASIS_SPEC_ALLOWED:
                    problems.append(Problem(
                        "REF002", f"{item_id}: Basis trỏ tới '{ref.group(1)}' ({target_type}) — spec chỉ Basis tới {sorted(BASIS_SPEC_ALLOWED)}", item_id))


def check_item_status(defines, problems):
    for item_id, items in defines.items():
        item_type = type_of(item_id)
        allowed = STATUS_BY_TYPE.get(item_type)
        if item_type in SPEC_TYPES:
            allowed = SPEC_ITEM_STATUS
        if not allowed:
            continue
        for item in items:
            status = (item.status or "").strip().strip("`")
            if not status or status in ("-", "—"):
                continue
            if status.startswith("Superseded"):
                continue
            if status not in allowed:
                problems.append(Problem("STA001", f"{item_id}: Status '{status}' không thuộc {sorted(allowed)}", item_id))
            if item_type in SPEC_TYPES and item_type not in INFO_TYPES:
                priority = (item.columns.get("Priority", "") or "").strip()
                if priority and priority not in MOSCOW:
                    problems.append(Problem("PRIO001", f"{item_id}: Priority '{priority}' không thuộc MoSCoW", item_id))


def check_markdown(leaves, problems):
    for leaf in leaves.values():
        if leaf.path.name.lower() == "readme.md":
            continue
        text = leaf.path.read_text(encoding="utf-8")
        header = None
        for lineno, raw in enumerate(text.splitlines(), start=1):
            line = raw.strip()
            if not line.startswith("|"):
                header = None
                continue
            cells = split_row(line)
            if header is None:
                header = len(cells)
                continue
            if all(SEPARATOR_RE.match(c.strip()) for c in cells if c.strip()):
                continue
            if len(cells) != header:
                problems.append(Problem("MD001", f"{leaf.rel}:{lineno}: bảng có {len(cells)} cột, header {header} cột"))
        for m in LINK_RE.finditer(text):
            target = m.group(1).strip()
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target_path = (leaf.path.parent / target.split("#")[0]).resolve()
            if not target_path.exists():
                problems.append(Problem("MD002", f"{leaf.rel}: link hỏng -> {target}"))


def check_orphans(defines, incoming, leaves, problems):
    design_of = defaultdict(set)
    for item_id, items in defines.items():
        for item in items:
            realizes = item.columns.get("Realizes", "")
            for ref in ID_RE.finditer(realizes):
                design_of[ref.group(1)].add(item_id)

    refinement_of = defaultdict(set)
    for item_id, items in defines.items():
        for item in items:
            basis = item.columns.get("Basis", "")
            for ref in ID_RE.finditer(basis):
                refinement_of[ref.group(1)].add(item_id)

    def origins(item_id: str, depth: int = 3):
        yield item_id
        if depth == 0:
            return
        for child in list(design_of.get(item_id, ())) + list(refinement_of.get(item_id, ())):
            if type_of(child) in REQUIREMENT_TYPES | DESIGN_TYPES | SERVICE_INTERFACE_TYPES:
                yield from origins(child, depth - 1)

    def covered_by(req: str, prefixes) -> bool:
        for origin in origins(req):
            for src, col, _ in incoming.get(origin, []):
                if type_of(src) in prefixes and col in ("Covers", "Realizes", "Derived from"):
                    return True
        return False

    for item_id, items in defines.items():
        item_type = type_of(item_id)
        if item_type in DESIGN_TYPES:
            for item in items:
                if not ID_RE.search(item.columns.get("Realizes", "")):
                    problems.append(Problem("ORP001", f"{item_id}: design element thiếu 'Realizes' (§12.2)", item_id))
        if item_type in WORK_TYPES - {"TST"}:
            for item in items:
                if "gate" in (item.name or "").lower():
                    continue
                if not ID_RE.search(item.columns.get("Covers", "")):
                    problems.append(Problem("ORP002", f"{item_id}: work item thiếu 'Covers' (§12.2)", item_id))
        if item_type == "TST":
            for item in items:
                if not ID_RE.search(item.columns.get("Covers", "")):
                    problems.append(Problem("ORP002", f"{item_id}: test item thiếu 'Covers' (§12.2)", item_id))
        if item_type == "TASK":
            for item in items:
                derived = item.columns.get("Derived from", "")
                refs = [r.group(1) for r in ID_RE.finditer(derived)]
                if len(refs) != 1 or type_of(refs[0]) not in ("BLD", "FND"):
                    problems.append(Problem("ORP003", f"{item_id}: 'Derived from' phải trỏ đúng một BLD-/FND- (§10.1)", item_id))
        if item_type in REQUIREMENT_TYPES:
            if not covered_by(item_id, DESIGN_TYPES):
                problems.append(Problem("ORP004", f"{item_id}: requirement chưa có design element 'Realizes' (§12.2)", item_id))
            if not covered_by(item_id, TEST_TYPES):
                problems.append(Problem("ORP005", f"{item_id}: requirement chưa có test item 'Covers' (§12.2)", item_id))


def check_task_decomposition(defines, incoming, problems):
    derived = defaultdict(set)
    for item_id, items in defines.items():
        if type_of(item_id) != "TASK":
            continue
        for item in items:
            for ref in ID_RE.finditer(item.columns.get("Derived from", "")):
                derived[ref.group(1)].add(item_id)
    for item_id, items in defines.items():
        if type_of(item_id) not in ("BLD", "FND"):
            continue
        if not any(item.leaf.startswith("docs/subsystem-docs/") for item in items):
            continue
        if derived.get(item_id):
            continue
        problems.append(Problem(
            "ORP006", f"{item_id}: BLD-/FND- của subsystem chưa được phân rã thành 'TASK-' trong task-plan.md (§12.2)", item_id))


def check_facet_dependencies(defines, problems):
    facet_of: dict[str, str] = {}
    subsystem_of: dict[str, str] = {}
    for item_id, items in defines.items():
        if type_of(item_id) != "BLD":
            continue
        for item in items:
            parts = item.leaf.split("/")
            # docs / subsystem-docs / <subsystem> / plans / build-plan.md
            if len(parts) >= 4 and parts[1] == "subsystem-docs":
                subsystem_of[item_id] = parts[2]
                covers_types = {type_of(m.group(1)) for m in ID_RE.finditer(item.columns.get("Covers", ""))}
                facets = {FACET_BY_PREFIX[t] for t in covers_types if t in FACET_BY_PREFIX}
                if len(facets) == 1:
                    facet_of[item_id] = next(iter(facets))
                elif len(facets) > 1 or "ARC" in covers_types:
                    facet_of[item_id] = "integration"

    for item_id, items in defines.items():
        if type_of(item_id) != "BLD" or item_id not in facet_of or facet_of[item_id] == "integration":
            continue
        for item in items:
            for ref in ID_RE.finditer(item.columns.get("Depends on", "")):
                other = ref.group(1)
                if other in facet_of and subsystem_of.get(other) == subsystem_of.get(item_id) \
                        and facet_of[other] != facet_of[item_id]:
                    problems.append(Problem(
                        "DEP001", f"{item_id} ({facet_of[item_id]}) Depends on {other} ({facet_of[other]}) — dependency xuyên facet phải giải quyết ở task-plan.md (§12.2)", item_id))


def check_waves(defines, problems):
    waves: dict[str, int] = {}
    for item_id, items in defines.items():
        if type_of(item_id) != "TASK":
            continue
        for item in items:
            raw = (item.columns.get("Wave", "") or "").strip()
            if not raw or raw in ("-", "—"):
                problems.append(Problem("WAV001", f"{item_id}: thiếu 'Wave'", item_id))
                continue
            digits = re.fullmatch(r"(?:[Ww]ave\s*)?(\d+)", raw)
            if not digits or int(digits.group(1)) < 1:
                problems.append(Problem("WAV001", f"{item_id}: Wave '{raw}' không phải số tự nhiên", item_id))
                continue
            waves[item_id] = int(digits.group(1))
    for item_id, items in defines.items():
        if item_id not in waves:
            continue
        for item in items:
            for ref in ID_RE.finditer(item.columns.get("Depends on", "")):
                dep = ref.group(1)
                if dep in waves and waves[dep] >= waves[item_id]:
                    problems.append(Problem(
                        "WAV002", f"{item_id} (Wave {waves[item_id]}) phải có Wave lớn hơn {dep} (Wave {waves[dep]}) (§13.4)", item_id))


def check_tree_structure(leaves, problems):
    system_files: set[str] = set()
    subsystems: dict[str, set[str]] = defaultdict(set)
    for leaf in leaves.values():
        parts = leaf.rel.split("/")
        # docs / system-docs / ...
        if len(parts) >= 3 and parts[1] == "system-docs":
            system_files.add("/".join(parts[2:]))
        # docs / subsystem-docs / <subsystem> / ...
        elif len(parts) >= 4 and parts[1] == "subsystem-docs":
            subsystems[parts[2]].add("/".join(parts[3:]))

    # Kiểm tra system-docs (§2)
    required_system = (
        "info.md", "pi.md", "tech-tool-stack.md",
        "specs/spec.md",
        "plans/project-plan.md", "plans/foundation-setup-plan.md",
        "plans/test-plan.md", "plans/deploy-plan.md"
    )
    for req in required_system:
        if req not in system_files:
            problems.append(Problem("STR001", f"system-docs: thiếu {req} (§2)"))

    # Kiểm tra từng subsystem (§2, §7.2)
    required_subsystem = (
        "specs/spec.md",
        "plans/foundation-setup-plan.md", "plans/build-plan.md",
        "plans/test-plan.md", "plans/task-plan.md"
    )
    allowed_optional_specs = {"specs/data.md", "specs/api.md", "specs/ui-ux.md"}

    for sub, rel_files in sorted(subsystems.items()):
        for req in required_subsystem:
            if req not in rel_files:
                problems.append(Problem("STR001", f"{sub}: thiếu {req} (§2)"))

        # Chặn thư mục cũ srs/ và dds/
        legacy_files = [f for f in rel_files if f.startswith("srs/") or f.startswith("dds/")]
        for leg in legacy_files:
            problems.append(Problem("STR001", f"{sub}: chứa tệp cấu trúc cũ không hợp lệ '{leg}' (SDLC v3.x dùng specs/) (§2)"))

        # Các tệp specs/ chỉ được nằm trong danh mục hợp lệ
        for f in rel_files:
            if f.startswith("specs/") and f not in required_subsystem and f not in allowed_optional_specs:
                problems.append(Problem("STR001", f"{sub}: tệp spec không chuẩn '{f}' (§2, §7.2)"))


def check_structural_constraints(defines, problems):
    """Kiểm tra structural constraints có tính xác định cao theo §12.4."""
    for item_id, items in defines.items():
        itype = type_of(item_id)
        for item in items:
            # TASK- và BLD- chỉ ở Subsystem
            if itype in ("TASK", "BLD"):
                if not item.leaf.startswith("docs/subsystem-docs/"):
                    problems.append(Problem("STR002", f"{item_id}: '{itype}' chỉ được xuất hiện ở Subsystem (§12.4)", item_id))

            # System FND- không có TASK- và TASK- phải trỏ đúng subsystem
            if itype == "TASK":
                derived = item.columns.get("Derived from", "")
                for ref in ID_RE.finditer(derived):
                    target = ref.group(1)
                    if target.startswith("FND-SYS"):
                        problems.append(Problem("STR004", f"{item_id}: 'FND-SYS-*' không có TASK- (§12.4)", item_id))
                    task_parts = item_id.split("-")
                    target_parts = target.split("-")
                    task_scope = task_parts[1] if len(task_parts) > 2 else ""
                    target_scope = target_parts[1] if len(target_parts) > 2 else ""
                    if task_scope and target_scope and task_scope != target_scope:
                        problems.append(Problem("STR004", f"{item_id} ({task_scope}) không được Derived from {target} ({target_scope}) khác subsystem (§12.2)", item_id))

            # Gate không có Covers
            if "gate" in (item.name or "").lower():
                covers_val = item.columns.get("Covers", "").strip()
                if covers_val and covers_val not in ("-", "—") and ID_RE.search(covers_val):
                    problems.append(Problem("STR003", f"{item_id}: Gate không được có 'Covers' (§12.4)", item_id))

            # Includes chỉ xuất hiện trên Phase / Milestone / Checkpoint trong Project Plan (PRJ-) (§9.1, §9.2, §12.4)
            if "Includes" in item.columns and itype != "PRJ":
                problems.append(Problem("STR005", f"{item_id}: 'Includes' chỉ được khai báo trên PRJ- trong Project Plan (§9.1, §12.4)", item_id))


def check_change_control(leaves, problems, base_ref: str | None):
    if not base_ref:
        return
    try:
        out = subprocess.run(["git", "diff", "--name-only", f"{base_ref}...HEAD"],
                             capture_output=True, text=True, check=True).stdout
    except Exception as exc:  # pragma: no cover - CI không có git
        print(f"⚠ Không đọc được git diff cho change control: {exc}")
        return
    changed = {line.strip() for line in out.splitlines() if line.strip().endswith(".md")}
    for leaf in leaves.values():
        if leaf.rel not in changed:
            continue
        if leaf.front.get("status") != "Baselined":
            continue
        try:
            previous = subprocess.run(["git", "show", f"{base_ref}:{leaf.rel}"],
                                      capture_output=True, text=True, check=True).stdout
        except Exception:
            continue
        prev_front = parse_front_matter(previous) or {}
        if prev_front.get("version") == leaf.front.get("version"):
            problems.append(Problem(
                "CHG001", f"{leaf.rel}: leaf 'Baselined' bị sửa nhưng 'version' chưa tăng (§13.3)"))
        if "change request" not in previous and "change request" not in leaf.path.read_text(encoding="utf-8"):
            problems.append(Problem(
                "CHG002", f"{leaf.rel}: leaf 'Baselined' bị sửa — cần issue change request kèm impact analysis (§13.3)"))


# ---------------------------------------------------------------------------
# Allowlist các gap đã biết
# ---------------------------------------------------------------------------


def load_allowlist(path: Path):
    if not path.exists():
        return {}, None, []
    data = json.loads(path.read_text(encoding="utf-8"))
    allowed: dict[str, set[str]] = {}
    for entry in data.get("exceptions", []):
        allowed.setdefault(entry["check"], set()).update(entry.get("ids", []))
        allowed.setdefault(entry["check"], set()).update(["*"] if entry.get("all") else [])
    notes = data.get("exceptions", [])
    return allowed, data.get("expires"), notes


def write_baseline(path: Path, problems: list[Problem], expiry_days: int = 60):
    grouped: dict[str, set[str]] = defaultdict(set)
    for problem in problems:
        key = problem.item_id or problem.message
        grouped[problem.code].add(key)
    payload = {
        "expires": (date.today() + timedelta(days=expiry_days)).isoformat(),
        "issue": 35,
        "note": "Gap đã biết của bộ tài liệu; mỗi mục phải được đóng theo issue tương ứng trước ngày hết hạn.",
        "exceptions": [
            {
                "check": code,
                "reason": "Gap đã biết — theo dõi và đóng theo issue #35 (audit traceability).",
                "issue": 35,
                "ids": sorted(ids),
            }
            for code, ids in sorted(grouped.items())
        ],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="Kiểm tra toàn vẹn tài liệu SDLC")
    parser.add_argument("--matrix", help="Xuất ma trận traceability ra tệp markdown")
    parser.add_argument("--baseline", action="store_true", help="Ghi lại allowlist gap đã biết")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent.parent
    docs_dir = root / "docs"
    allowlist_path = root / "tools" / "docs-check" / "known-gaps.json"

    if not docs_dir.exists():
        print(f"❌ Không tìm thấy thư mục docs: {docs_dir}")
        return 1

    leaves = load_leaves(docs_dir)
    defines, incoming = build_index(leaves)

    problems: list[Problem] = []
    check_front_matter(leaves, problems)
    check_ids(defines, problems)
    check_references(defines, incoming, problems)
    check_item_status(defines, problems)
    check_markdown(leaves, problems)
    check_orphans(defines, incoming, leaves, problems)
    check_task_decomposition(defines, incoming, problems)
    check_facet_dependencies(defines, problems)
    check_waves(defines, problems)
    check_tree_structure(leaves, problems)
    check_structural_constraints(defines, problems)
    check_change_control(leaves, problems, os.environ.get("DOCS_CHECK_BASE_REF"))

    if args.baseline:
        write_baseline(allowlist_path, problems)
        print(f"📝 Đã ghi allowlist gap đã biết: {allowlist_path.relative_to(root)} ({len(problems)} vấn đề)")
        return 0

    allowed, expires, entries = load_allowlist(allowlist_path)
    expiry_ok = True
    if expires:
        try:
            expiry_ok = date.fromisoformat(expires) >= date.today()
        except ValueError:
            expiry_ok = False

    unexpected: list[Problem] = []
    suppressed: set[tuple[str, str]] = set()
    for problem in problems:
        codes = allowed.get(problem.code, set())
        if "*" in codes or (problem.item_id and problem.item_id in codes) or problem.message in codes:
            suppressed.add(problem.key())
            continue
        unexpected.append(problem)

    matched = {(p.code, p.item_id or p.message) for p in problems}
    stale = [e for e in entries
             if not (set(e.get("ids", [])) & {i for _, i in matched}) and not e.get("all")]

    print(f"🔍 Kiểm tra {len(leaves)} leaf, {len(defines)} ID, {len(incoming)} đích tham chiếu")
    by_code: dict[str, list[Problem]] = defaultdict(list)
    for problem in unexpected:
        by_code[problem.code].append(problem)

    for code in sorted(by_code):
        print(f"\n❌ [{code}] {len(by_code[code])} vấn đề")
        for problem in by_code[code][:40]:
            print(f"   - {problem.message}")
        if len(by_code[code]) > 40:
            print(f"   ... và {len(by_code[code]) - 40} vấn đề khác")

    if suppressed:
        print(f"\n⏭  Bỏ qua {len(suppressed)} vấn đề nằm trong allowlist (hết hạn: {expires or 'không đặt'})")
    for entry in entries:
        ids = entry.get("ids", [])
        print(f"   - [{entry['check']}] {len(ids)} ID — {entry.get('reason', '')}")
    if stale:
        print("\n⚠ Allowlist có mục không còn tương ứng vấn đề nào (nên dọn):")
        for entry in stale:
            print(f"   - [{entry['check']}] {entry.get('reason', '')}")

    if args.matrix:
        matrix_path = Path(args.matrix)
        lines = ["# Ma trận Traceability (sinh tự động)", "",
                 f"- Leaf: {len(leaves)} | ID: {len(defines)}",
                 f"- Sinh ngày: {date.today().isoformat()}", "",
                 "| ID | Leaf | Status | Tham chiếu vào | Tham chiếu ra |",
                 "| :--- | :--- | :--- | :---: | :---: |"]
        for item_id in sorted(defines):
            item = defines[item_id][0]
            out_edges = sum(len(ID_RE.findall(c)) for col, c in item.columns.items() if col in TRACE_COLUMNS)
            lines.append(f"| `{item_id}` | {item.leaf} | {item.status or '-'} | {len(incoming.get(item_id, []))} | {out_edges} |")
        matrix_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"\n📊 Đã xuất ma trận traceability: {matrix_path}")

    print("\n" + "=" * 70)
    if not expiry_ok:
        print(f"❌ Allowlist đã hết hạn ({expires}). Phải đóng gap hoặc gia hạn có lý do.")
        return 1
    if unexpected:
        print(f"❌ docs-check thất bại: {len(unexpected)} vấn đề ngoài allowlist "
              f"(đã bỏ qua {len(suppressed)} gap đã biết).")
        return 1
    print(f"✅ docs-check đạt: không có vấn đề ngoài allowlist "
          f"({len(suppressed)} gap đã biết được theo dõi, hết hạn {expires or '—'}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
