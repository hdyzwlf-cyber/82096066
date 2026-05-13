#!/usr/bin/env python3
"""
Render a Manim scene from generated Python code.

This script:
1. Validates the code (AST parse + forbidden import check)
2. Writes it to a temp file
3. Invokes `manim render` in a subprocess
4. Returns the path to the generated video (or error details)

Usage:
    # From a file
    python render_manim.py --file scene.py --scene LinearFunction

    # From stdin (Codex pipes generated code directly)
    echo '<code>' | python render_manim.py --scene LinearFunction

    # With options
    python render_manim.py --file scene.py --scene MyScene --quality medium --format mp4

Environment:
    Requires `manim` (community edition) installed in the Python environment.
    Typically runs inside a Docker container with manim pre-installed.

Exit codes:
    0 = success (prints JSON with video_path)
    1 = validation error
    2 = render error
"""

import ast
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# ─── Configuration ───────────────────────────────────────────────────────────

FORBIDDEN_MODULES = {
    "os", "subprocess", "socket", "requests", "urllib", "http",
    "shutil", "pathlib", "glob", "ftplib", "smtplib", "telnetlib",
    "ctypes", "multiprocessing", "threading", "signal",
    "importlib", "runpy", "code", "codeop", "compile",
    "webbrowser", "antigravity",
}

ALLOWED_IMPORTS = {
    "manim", "numpy", "np", "math", "random", "itertools",
    "functools", "operator", "collections", "typing",
}

MAX_CODE_LENGTH = 50_000  # chars
MAX_RENDER_TIMEOUT = 120  # seconds

QUALITY_MAP = {
    "low": "-ql",
    "medium": "-qm",
    "high": "-qh",
    "preview": "-ql",
}

FORMAT_MAP = {
    "mp4": "--format=mp4",
    "webm": "--format=webm",
    "gif": "--format=gif",
}


# ─── Validation ──────────────────────────────────────────────────────────────

def validate_code(code: str) -> "tuple[bool, list[str]]":
    """
    Validate Manim code for safety and correctness.

    Returns:
        (is_valid, list_of_errors)
    """
    errors = []

    # Length check
    if len(code) > MAX_CODE_LENGTH:
        errors.append(f"Code too long: {len(code)} chars (max {MAX_CODE_LENGTH})")
        return False, errors

    # AST parse check
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        errors.append(f"Syntax error at line {e.lineno}: {e.msg}")
        return False, errors

    # Check for forbidden imports
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                module_root = alias.name.split(".")[0]
                if module_root in FORBIDDEN_MODULES:
                    errors.append(f"Forbidden import: '{alias.name}' (line {node.lineno})")
                elif module_root not in ALLOWED_IMPORTS:
                    errors.append(f"Disallowed import: '{alias.name}' (line {node.lineno}). Allowed: {sorted(ALLOWED_IMPORTS)}")

        elif isinstance(node, ast.ImportFrom):
            if node.module:
                module_root = node.module.split(".")[0]
                if module_root in FORBIDDEN_MODULES:
                    errors.append(f"Forbidden import: 'from {node.module}' (line {node.lineno})")
                elif module_root not in ALLOWED_IMPORTS:
                    errors.append(f"Disallowed import: 'from {node.module}' (line {node.lineno}). Allowed: {sorted(ALLOWED_IMPORTS)}")

    # Check for dangerous function calls
    dangerous_calls = {"exec", "eval", "compile", "__import__", "open", "input"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in dangerous_calls:
                errors.append(f"Forbidden function call: '{node.func.id}()' (line {node.lineno})")
            elif isinstance(node.func, ast.Attribute) and node.func.attr in {"system", "popen", "exec"}:
                errors.append(f"Forbidden method call: '.{node.func.attr}()' (line {node.lineno})")

    # Check that at least one Scene subclass exists
    has_scene = False
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for base in node.bases:
                base_name = ""
                if isinstance(base, ast.Name):
                    base_name = base.id
                elif isinstance(base, ast.Attribute):
                    base_name = base.attr
                if "Scene" in base_name:
                    has_scene = True
                    break

    if not has_scene:
        errors.append("No Scene subclass found. Code must contain a class inheriting from Scene (or MovingCameraScene, ThreeDScene, etc.)")

    # Check for `from manim import *`
    has_manim_import = False
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module == "manim":
            has_manim_import = True
            break
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "manim":
                    has_manim_import = True
                    break
    if not has_manim_import:
        errors.append("Missing 'from manim import *' — required for all Manim scripts")

    return len(errors) == 0, errors


def find_scene_classes(code: str) -> list[str]:
    """Extract all Scene subclass names from code."""
    tree = ast.parse(code)
    scenes = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for base in node.bases:
                base_name = ""
                if isinstance(base, ast.Name):
                    base_name = base.id
                elif isinstance(base, ast.Attribute):
                    base_name = base.attr
                if "Scene" in base_name:
                    scenes.append(node.name)
                    break
    return scenes


# ─── Rendering ───────────────────────────────────────────────────────────────

def render_manim(
    code: str,
    scene_class: str,
    quality: str = "medium",
    output_format: str = "mp4",
    output_dir=None,
) -> dict:
    """
    Render a Manim scene and return result info.

    Returns dict with keys:
        success: bool
        video_path: str (if success)
        duration_seconds: float (render time)
        error: str (if failed)
    """
    start_time = time.time()

    # Create temp script file
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", prefix="manim_", delete=False
    ) as f:
        f.write(code)
        script_path = f.name

    # Determine output directory
    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="manim_output_")

    # Build command
    quality_flag = QUALITY_MAP.get(quality, "-qm")
    format_flag = FORMAT_MAP.get(output_format, "--format=mp4")

    cmd = [
        "manim", "render",
        script_path,
        scene_class,
        quality_flag,
        format_flag,
        f"--media_dir={output_dir}",
        "--disable_caching",
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=MAX_RENDER_TIMEOUT,
            cwd=os.path.dirname(script_path),
        )
    except subprocess.TimeoutExpired:
        _cleanup(script_path)
        return {
            "success": False,
            "error": f"Render timed out after {MAX_RENDER_TIMEOUT}s",
            "duration_seconds": time.time() - start_time,
        }
    except FileNotFoundError:
        _cleanup(script_path)
        return {
            "success": False,
            "error": "manim command not found. Ensure Manim Community is installed.",
            "duration_seconds": time.time() - start_time,
        }

    # Clean up temp script
    _cleanup(script_path)

    if result.returncode != 0:
        # Extract useful error message
        stderr = result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr
        return {
            "success": False,
            "error": f"Manim render failed (exit {result.returncode}): {stderr}",
            "duration_seconds": time.time() - start_time,
        }

    # Find the output video file
    video_path = _find_output_video(output_dir, output_format)
    if not video_path:
        return {
            "success": False,
            "error": f"Render completed but no .{output_format} file found in {output_dir}",
            "duration_seconds": time.time() - start_time,
        }

    return {
        "success": True,
        "video_path": str(video_path),
        "duration_seconds": round(time.time() - start_time, 2),
    }


def _find_output_video(output_dir: str, fmt: str):
    """Recursively find the rendered video file."""
    output_path = Path(output_dir)
    ext = f".{fmt}"
    videos = list(output_path.rglob(f"*{ext}"))
    if videos:
        # Return the most recently modified one
        return max(videos, key=lambda p: p.stat().st_mtime)
    return None


def _cleanup(path: str):
    """Remove temp file safely."""
    try:
        os.unlink(path)
    except OSError:
        pass


# ─── CLI Interface ───────────────────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate and render Manim code safely.",
    )
    parser.add_argument("--file", "-f", help="Path to .py file with Manim code")
    parser.add_argument("--scene", "-s", help="Scene class name to render")
    parser.add_argument("--quality", "-q", default="medium",
                        choices=["low", "medium", "high", "preview"],
                        help="Render quality (default: medium)")
    parser.add_argument("--format", default="mp4",
                        choices=["mp4", "webm", "gif"],
                        help="Output format (default: mp4)")
    parser.add_argument("--output-dir", "-o", help="Output directory (default: temp)")
    parser.add_argument("--validate-only", action="store_true",
                        help="Only validate, do not render")

    args = parser.parse_args()

    # Read code from file or stdin
    if args.file:
        try:
            code = Path(args.file).read_text()
        except FileNotFoundError:
            print(json.dumps({"success": False, "error": f"File not found: {args.file}"}))
            sys.exit(1)
    else:
        code = sys.stdin.read()

    if not code.strip():
        print(json.dumps({"success": False, "error": "Empty code input"}))
        sys.exit(1)

    # Validate
    is_valid, errors = validate_code(code)
    if not is_valid:
        print(json.dumps({
            "success": False,
            "stage": "validation",
            "errors": errors,
        }, indent=2))
        sys.exit(1)

    if args.validate_only:
        scenes = find_scene_classes(code)
        print(json.dumps({
            "success": True,
            "stage": "validation",
            "scene_classes": scenes,
            "message": "Code is valid and safe to render",
        }, indent=2))
        sys.exit(0)

    # Determine scene class
    scene_class = args.scene
    if not scene_class:
        scenes = find_scene_classes(code)
        if len(scenes) == 1:
            scene_class = scenes[0]
        elif len(scenes) > 1:
            print(json.dumps({
                "success": False,
                "error": f"Multiple Scene classes found: {scenes}. Specify one with --scene.",
            }))
            sys.exit(1)
        else:
            print(json.dumps({"success": False, "error": "No Scene class found in code"}))
            sys.exit(1)

    # Render
    result = render_manim(
        code=code,
        scene_class=scene_class,
        quality=args.quality,
        output_format=args.format,
        output_dir=args.output_dir,
    )

    print(json.dumps(result, indent=2))
    sys.exit(0 if result["success"] else 2)


if __name__ == "__main__":
    main()
