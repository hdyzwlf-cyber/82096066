#!/usr/bin/env python3
"""
Validate a Dify intent-recognition JSON payload against the contract schema.

Usage:
    python validate_dify_json.py '{"optimized_prompt":"...","aspect_ratio":"1:1",...}'
    python validate_dify_json.py < payload.json
    echo '{"optimized_prompt":"test"}' | python validate_dify_json.py

Exit codes:
    0 = valid
    1 = invalid (prints error details)
"""

import json
import sys

ALLOWED_RATIOS = {"1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16"}
ALLOWED_SIZES = {"1024x1024", "1024x1536", "1536x1024", "2048x2048"}
ALLOWED_STYLES = {"photo", "illustration", "3d", "design", "anime", "mixed"}

RATIO_TO_SIZE = {
    "1:1": "1024x1024",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
    "4:3": "1536x1024",
    "3:4": "1024x1536",
    "16:9": "1536x1024",
    "9:16": "1024x1536",
}


def validate(payload: dict) -> tuple[bool, list[str], dict]:
    """
    Validate and normalize a Dify JSON payload.

    Returns:
        (is_valid, errors, normalized_payload)
    """
    errors = []

    # Required field: optimized_prompt
    prompt = payload.get("optimized_prompt", "")
    if not isinstance(prompt, str) or not prompt.strip():
        errors.append("Missing or empty 'optimized_prompt'")
    elif len(prompt.split()) > 250:
        errors.append(f"optimized_prompt too long ({len(prompt.split())} words, max 250)")

    # aspect_ratio
    ratio = payload.get("aspect_ratio", "1:1")
    if ratio not in ALLOWED_RATIOS:
        errors.append(f"Invalid aspect_ratio '{ratio}'. Allowed: {sorted(ALLOWED_RATIOS)}")
        ratio = "1:1"

    # size_hint
    size = payload.get("size_hint", "")
    if not size or size not in ALLOWED_SIZES:
        # Auto-derive from aspect_ratio
        size = RATIO_TO_SIZE.get(ratio, "1024x1024")

    # style_tag
    style = payload.get("style_tag", "photo")
    if style not in ALLOWED_STYLES:
        errors.append(f"Invalid style_tag '{style}'. Allowed: {sorted(ALLOWED_STYLES)}")
        style = "photo"

    # reasoning_short (optional, truncate if too long)
    reasoning = str(payload.get("reasoning_short", ""))[:200]

    normalized = {
        "optimized_prompt": prompt.strip() if isinstance(prompt, str) else "",
        "aspect_ratio": ratio,
        "size_hint": size,
        "style_tag": style,
        "reasoning_short": reasoning,
    }

    return (len(errors) == 0, errors, normalized)


def main():
    # Read from argument or stdin
    if len(sys.argv) > 1:
        raw = sys.argv[1]
    else:
        raw = sys.stdin.read()

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[FAIL] Invalid JSON: {e}")
        sys.exit(1)

    if not isinstance(payload, dict):
        print("[FAIL] Payload must be a JSON object")
        sys.exit(1)

    is_valid, errors, normalized = validate(payload)

    if is_valid:
        print("[OK] Payload is valid")
        print(json.dumps(normalized, indent=2, ensure_ascii=False))
        sys.exit(0)
    else:
        print("[FAIL] Validation errors:")
        for err in errors:
            print(f"  - {err}")
        print("\nNormalized (with fallbacks):")
        print(json.dumps(normalized, indent=2, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
