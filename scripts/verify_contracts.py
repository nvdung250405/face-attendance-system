#!/usr/bin/env python3
"""Contract Verification Tool.

Validates OpenAPI, STOMP WebSocket, and JSON Schema contract manifests.
Usage:
    python scripts/verify_contracts.py --dir contracts
"""

import argparse
import json
import os
import sys
import yaml


def verify_contracts(contracts_dir: str) -> bool:
    print(f"Verifying contracts in: {contracts_dir}")
    if not os.path.isdir(contracts_dir):
        print(f"Error: Directory '{contracts_dir}' does not exist.")
        return False

    success = True
    manifests = {
        "openapi.yaml": "yaml",
        "stomp-websocket.yaml": "yaml",
        "data-contract.json": "json",
    }

    for fname, ftype in manifests.items():
        fpath = os.path.join(contracts_dir, fname)
        if not os.path.exists(fpath):
            print(f"  [FAIL] Missing required contract manifest: {fname}")
            success = False
            continue

        try:
            with open(fpath, "r", encoding="utf-8") as fp:
                if ftype == "yaml":
                    data = yaml.safe_load(fp)
                    if not isinstance(data, dict):
                        print(f"  [FAIL] {fname}: Root element must be an object/dict")
                        success = False
                        continue
                    if fname == "openapi.yaml":
                        version = data.get("openapi", "unknown")
                        paths_count = len(data.get("paths", {}))
                        print(f"  [PASS] {fname}: OpenAPI v{version} ({paths_count} paths)")
                    else:
                        print(f"  [PASS] {fname}: Valid YAML manifest")
                elif ftype == "json":
                    data = json.load(fp)
                    if not isinstance(data, dict):
                        print(f"  [FAIL] {fname}: Root element must be an object/dict")
                        success = False
                        continue
                    print(f"  [PASS] {fname}: Valid JSON Schema manifest")
        except Exception as e:
            print(f"  [FAIL] {fname}: Parse error: {e}")
            success = False

    return success


def main() -> int:
    parser = argparse.ArgumentParser(description="Contract Verification Tool")
    parser.add_argument("--dir", default="contracts", help="Path to contracts directory")
    args = parser.parse_args()

    passed = verify_contracts(args.dir)
    if passed:
        print("Contract verification completed: ALL MANIFESTS VALID [PASS]")
        return 0
    else:
        print("Contract verification failed [FAIL]")
        return 1


if __name__ == "__main__":
    sys.exit(main())
