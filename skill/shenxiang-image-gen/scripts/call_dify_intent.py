#!/usr/bin/env python3
"""
Call the Dify intent-recognition workflow and return the JSON contract.

Usage:
    python call_dify_intent.py "画一只可爱的猫"
    python call_dify_intent.py "make a 618 poster with text '全场五折'" --style photo

Env vars required:
    DIFY_BASE_URL  (default: https://api.dify.ai/v1)
    DIFY_API_KEY_INTENT  (the API key for the intent-recognition Dify app)

Exit codes:
    0 = success (prints normalized JSON)
    1 = error
"""

import json
import os
import sys
import urllib.request
import urllib.error


DIFY_BASE = os.environ.get("DIFY_BASE_URL", "https://api.dify.ai/v1")
DIFY_KEY = os.environ.get("DIFY_API_KEY_INTENT", "")


def call_dify(raw_prompt: str, style_preset: str = "auto", aspect_ratio_hint: str = "auto") -> dict:
    """Call Dify workflow and return parsed output."""
    if not DIFY_KEY:
        raise RuntimeError("DIFY_API_KEY_INTENT env var not set")

    url = f"{DIFY_BASE}/workflows/run"
    payload = {
        "inputs": {
            "raw_prompt": raw_prompt,
            "style_preset": style_preset,
            "aspect_ratio_hint": aspect_ratio_hint,
        },
        "response_mode": "blocking",
        "user": "codex-skill",
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {DIFY_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Dify API error: {e.code} {e.read().decode()}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Dify connection error: {e.reason}")

    outputs = body.get("data", {}).get("outputs", {})
    return outputs


def main():
    if len(sys.argv) < 2:
        print("Usage: call_dify_intent.py <raw_prompt> [--style <preset>] [--ratio <hint>]")
        sys.exit(1)

    raw_prompt = sys.argv[1]
    style = "auto"
    ratio = "auto"

    # Simple arg parsing
    args = sys.argv[2:]
    i = 0
    while i < len(args):
        if args[i] == "--style" and i + 1 < len(args):
            style = args[i + 1]
            i += 2
        elif args[i] == "--ratio" and i + 1 < len(args):
            ratio = args[i + 1]
            i += 2
        else:
            i += 1

    try:
        result = call_dify(raw_prompt, style, ratio)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        sys.exit(0)
    except RuntimeError as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
