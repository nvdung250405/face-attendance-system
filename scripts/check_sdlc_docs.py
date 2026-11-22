#!/usr/bin/env python3
"""SDLC Documentation and Contract Integrity Gate.

Validates:
1. Markdown Link Integrity: scans all .md files in docs/, extracts relative links,
   ignores external/anchor links, and verifies target files exist.
2. SRS to RTM Traceability: verifies all 22 FR-SYS-001 through FR-SYS-022 in
   docs/analysis/srs.md exist in docs/analysis/rtm.md.
3. Feature Specifications Integrity: verifies all 8 feature directories
   FEAT-001-attend to FEAT-008-shift exist and each has a non-empty spec.md.
4. Machine-Executable Contracts: verifies openapi.yaml, stomp-websocket.yaml,
   and data-contract.json exist and are valid.

Usage:
    python scripts/check_sdlc_docs.py
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import unquote

# Optional PyYAML support if installed; fallback to standard library structure checks
try:
    import yaml  # type: ignore
    HAVE_YAML = True
except ImportError:
    HAVE_YAML = False


def check_markdown_links(docs_dir: Path) -> bool:
    """Scan all .md files in docs_dir and verify relative links exist."""
    print("Checking Markdown Link Integrity...")
    if not docs_dir.is_dir():
        print(f"  [FAIL] Docs directory does not exist: {docs_dir}")
        return False

    md_files = sorted(docs_dir.rglob("*.md"))
    if not md_files:
        print(f"  [FAIL] No markdown files found in {docs_dir}")
        return False

    # Regex matching [text](url) and ![alt](url)
    link_pattern = re.compile(r"!?\[([^\]]*)\]\(([^)]+)\)")
    total_links = 0
    broken_links = []

    for md_file in md_files:
        try:
            content = md_file.read_text(encoding="utf-8")
        except Exception as e:
            print(f"  [FAIL] Failed reading {md_file}: {e}")
            broken_links.append((str(md_file), "<read-error>", str(e)))
            continue

        for match in link_pattern.finditer(content):
            raw_url = match.group(2).strip()
            # Split out optional title e.g. (url "title")
            url = raw_url.split()[0].strip("<>")
            if not url:
                continue

            # Ignore external schemes and in-page anchors
            if url.startswith(("http://", "https://", "mailto:", "ftp://", "tel:", "data:", "#")):
                continue

            # Strip target file from query params and anchors
            clean_url = url.split("#")[0].split("?")[0]
            if not clean_url:
                continue

            clean_url = unquote(clean_url)
            target = (md_file.parent / clean_url).resolve()
            total_links += 1

            if not target.exists():
                broken_links.append((str(md_file.relative_to(docs_dir.parent)), url, str(target)))

    if broken_links:
        print(f"  [FAIL] Found {len(broken_links)} broken relative link(s):")
        for src, href, target in broken_links:
            print(f"    - In '{src}': '{href}' -> '{target}' (not found)")
        return False

    print(f"  [PASS] Scanned {len(md_files)} markdown files, validated {total_links} relative links (0 broken)")
    return True


def check_srs_rtm_traceability(srs_file: Path, rtm_file: Path) -> bool:
    """Verify all 22 FR-SYS-001 through FR-SYS-022 in srs_file exist in rtm_file."""
    print("Checking SRS to RTM Traceability...")
    if not srs_file.is_file():
        print(f"  [FAIL] SRS file not found: {srs_file}")
        return False
    if not rtm_file.is_file():
        print(f"  [FAIL] RTM file not found: {rtm_file}")
        return False

    try:
        srs_content = srs_file.read_text(encoding="utf-8")
        rtm_content = rtm_file.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  [FAIL] Error reading SRS/RTM files: {e}")
        return False

    fr_pattern = re.compile(r"FR-SYS-\d{3}")
    srs_frs = set(fr_pattern.findall(srs_content))
    rtm_frs = set(fr_pattern.findall(rtm_content))

    expected_frs = {f"FR-SYS-{i:03d}" for i in range(1, 23)}

    missing_in_srs = expected_frs - srs_frs
    if missing_in_srs:
        print(f"  [FAIL] Expected 22 FR-SYS requirements in SRS. Missing in SRS: {sorted(missing_in_srs)}")
        return False

    missing_in_rtm = srs_frs - rtm_frs
    if missing_in_rtm:
        print(f"  [FAIL] Untraced requirements missing in RTM: {sorted(missing_in_rtm)}")
        return False

    print(f"  [PASS] All {len(expected_frs)} requirements (FR-SYS-001..FR-SYS-022) fully traced between SRS and RTM")
    return True


def check_features_integrity(features_dir: Path) -> bool:
    """Verify all 8 feature directories FEAT-001-attend to FEAT-008-shift exist with non-empty spec.md."""
    print("Checking Feature Specifications Integrity...")
    if not features_dir.is_dir():
        print(f"  [FAIL] Features directory not found: {features_dir}")
        return False

    feature_names = [
        "FEAT-001-attend",
        "FEAT-002-comply",
        "FEAT-003-enroll",
        "FEAT-004-excuse",
        "FEAT-005-fallback",
        "FEAT-006-monitor",
        "FEAT-007-offline",
        "FEAT-008-shift",
    ]

    failed = False
    for feat in feature_names:
        feat_path = features_dir / feat
        spec_path = feat_path / "spec.md"

        if not feat_path.is_dir():
            print(f"  [FAIL] Missing feature directory: {feat}")
            failed = True
            continue

        if not spec_path.is_file():
            print(f"  [FAIL] Missing spec.md in {feat}")
            failed = True
            continue

        if spec_path.stat().st_size == 0:
            print(f"  [FAIL] Empty spec.md in {feat}")
            failed = True
            continue

    if failed:
        return False

    print(f"  [PASS] All {len(feature_names)} feature specifications exist and are non-empty")
    return True


def check_contracts_integrity(contracts_dir: Path) -> bool:
    """Verify openapi.yaml, stomp-websocket.yaml, and data-contract.json exist and are valid."""
    print("Checking Machine Contracts Integrity...")
    if not contracts_dir.is_dir():
        print(f"  [FAIL] Contracts directory not found: {contracts_dir}")
        return False

    required_manifests = {
        "openapi.yaml": "yaml",
        "stomp-websocket.yaml": "yaml",
        "data-contract.json": "json",
    }

    success = True
    for fname, ftype in required_manifests.items():
        fpath = contracts_dir / fname
        if not fpath.is_file():
            print(f"  [FAIL] Missing contract manifest: {fname}")
            success = False
            continue

        if fpath.stat().st_size == 0:
            print(f"  [FAIL] Contract manifest is empty: {fname}")
            success = False
            continue

        try:
            content = fpath.read_text(encoding="utf-8")
            if ftype == "json":
                data = json.loads(content)
                if not isinstance(data, (dict, list)):
                    print(f"  [FAIL] {fname}: Root element must be an object/dict or array")
                    success = False
                    continue
                print(f"  [PASS] {fname}: Valid JSON schema/contract")
            elif ftype == "yaml":
                if HAVE_YAML:
                    data = yaml.safe_load(content)
                    if not isinstance(data, dict):
                        print(f"  [FAIL] {fname}: Root element must be a YAML mapping")
                        success = False
                        continue
                    if fname == "openapi.yaml":
                        version = data.get("openapi", "unknown")
                        paths_count = len(data.get("paths", {}))
                        print(f"  [PASS] {fname}: Valid OpenAPI v{version} ({paths_count} paths)")
                    else:
                        print(f"  [PASS] {fname}: Valid YAML manifest")
                else:
                    # Fallback validation without external dependencies
                    if fname == "openapi.yaml" and ("openapi:" not in content or "paths:" not in content):
                        print(f"  [FAIL] {fname}: Missing standard OpenAPI keys (openapi:, paths:)")
                        success = False
                        continue
                    if fname == "stomp-websocket.yaml" and "protocol:" not in content and "info:" not in content:
                        print(f"  [FAIL] {fname}: Missing expected STOMP contract structure")
                        success = False
                        continue
                    print(f"  [PASS] {fname}: Valid YAML structure (std-lib fallback)")
        except Exception as e:
            print(f"  [FAIL] {fname}: Parse error: {e}")
            success = False

    return success


def main() -> int:
    parser = argparse.ArgumentParser(description="SDLC Documentation and Contract Integrity Gate")
    parser.add_argument("--docs-dir", help="Path to docs directory (default: repo root / docs)")
    parser.add_argument("--contracts-dir", help="Path to contracts directory (default: repo root / contracts)")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent

    docs_dir = Path(args.docs_dir).resolve() if args.docs_dir else (repo_root / "docs")
    contracts_dir = Path(args.contracts_dir).resolve() if args.contracts_dir else (repo_root / "contracts")
    srs_file = docs_dir / "analysis" / "srs.md"
    rtm_file = docs_dir / "analysis" / "rtm.md"
    features_dir = docs_dir / "features"

    print("======================================================================")
    print("SDLC Documentation & Contract Gate: Quality Verification")
    print("======================================================================")

    results = [
        check_markdown_links(docs_dir),
        check_srs_rtm_traceability(srs_file, rtm_file),
        check_features_integrity(features_dir),
        check_contracts_integrity(contracts_dir),
    ]

    print("======================================================================")
    if all(results):
        print("Verification Result: ALL GATES PASSED [PASS]")
        print("======================================================================")
        return 0
    else:
        print("Verification Result: VERIFICATION FAILED [FAIL]")
        print("======================================================================")
        return 1


if __name__ == "__main__":
    sys.exit(main())
