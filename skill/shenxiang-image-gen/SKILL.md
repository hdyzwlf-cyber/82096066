---
name: shenxiang-image-gen
description: Generate images and math visualization animations for shenxiang.school. Two modes — (1) Image generation using Codex's native gpt-image-2 tool based on structured JSON from a Dify intent-recognition workflow, and (2) Math animation generation using Manim to produce video of dynamic function graphs, geometry, and K12 math concepts. Use when a user asks to generate/create/draw an image, OR when they ask to visualize/animate a math function, equation, graph, or geometric concept.
---

# Shenxiang Image & Math Animation Generator

Dual-purpose skill for shenxiang.school:
- **Mode A — Image**: AI-optimized prompt → native gpt-image-2 generation
- **Mode B — Math Animation**: AI-parsed intent → Manim code generation → video rendering

## Architecture Overview

```
User request (any language)
       │
       ├── Image request? ──→ Mode A (gpt-image-2)
       │
       └── Math/animation? ──→ Mode B (Manim video)
```

### Mode A: Image Generation

```
User request → Dify 2-node workflow (intent only) → JSON contract → Codex gpt-image-2 → Image
```

### Mode B: Math Animation

```
User request → Dify 2-node workflow (math intent) → JSON contract → Codex generates Manim code → render_manim.py → Video
```

---

## Routing Decision

Determine mode from the user's request:

| Trigger keywords | Mode |
|---|---|
| 画图, 生成图片, create image, draw, poster, 海报, logo, 头像, product photo | **A — Image** |
| 函数, 图像, 动画, animate, graph, 可视化, 二次函数, sin, cos, 几何, 数学, plot, 坐标系 | **B — Math Animation** |
| Ambiguous (e.g. "画一个函数图") | **B — Math Animation** (math takes priority when "function/graph" detected) |

---

## Mode A — Image Generation

### When Dify JSON Is Provided

If the incoming message contains a JSON payload matching the image contract, skip optimization and generate directly.

#### Image JSON Contract

```json
{
  "optimized_prompt": "60-200 word English paragraph",
  "aspect_ratio": "1:1 | 3:2 | 2:3 | 4:3 | 3:4 | 16:9 | 9:16",
  "size_hint": "1024x1024 | 1024x1536 | 1536x1024 | 2048x2048",
  "style_tag": "photo | illustration | 3d | design | anime | mixed",
  "reasoning_short": "≤25 words"
}
```

#### Execution Steps

1. Validate JSON (run `scripts/validate_dify_json.py` if uncertain).
2. Call gpt-image-2: `prompt` = `optimized_prompt`, `size` = `size_hint`.
3. Return generated image + display `reasoning_short`.

### When No JSON Is Provided (Direct Image Request)

Optimize locally then generate:

1. Detect language → translate meaning to English; keep on-image text in original language.
2. Classify intent (portrait, product, scene, poster, etc.).
3. Compose one paragraph (60–180 words): Subject → Action → Environment → Camera → Lighting → Palette → Text → Negatives.
4. Pick aspect_ratio and map to size_hint (see `references/json-schema.md`).
5. Call gpt-image-2 with optimized prompt and size.

### Safety (Image)

Refuse: real private persons, minors in unsafe contexts, sexual content, self-harm, weapons, copyrighted characters. Return explanation: "Request rejected by safety policy."

For detailed image parameters: see `references/gpt-image-2-params.md`.
For JSON contract details: see `references/json-schema.md`.

---

## Mode B — Math Animation (Manim)

### When Dify Math JSON Is Provided

If the incoming message contains a JSON payload matching the math animation contract, use it directly to generate Manim code.

#### Math Animation JSON Contract

```json
{
  "topic": "string — math concept",
  "topic_category": "linear_function | quadratic_function | trigonometric | geometry | calculus | statistics | vectors | sequences | other",
  "functions": [
    {"expression": "2*x + 1", "label": "y = 2x + 1", "color": "BLUE"}
  ],
  "parameters_to_animate": [
    {"name": "k", "start_value": 1, "end_value": 3, "description": "slope change"}
  ],
  "axes_config": {"x_range": [-5, 5, 1], "y_range": [-4, 4, 1]},
  "annotations": [
    {"type": "dot|text|line|arrow", "content": "label", "position": "where"}
  ],
  "animation_style": "dynamic | static | step-by-step",
  "duration_seconds": 10,
  "quality": "low | medium | high",
  "title": "一次函数",
  "reasoning": "≤30 words"
}
```

### When No JSON Is Provided (Direct Math Request)

Generate Manim code directly from the user's description. Follow this procedure:

#### Step 1: Parse the math intent

- Identify the math topic (linear/quadratic/trig/geometry/etc.)
- Extract any explicit functions mentioned
- Determine what should be animated (parameter changes, comparisons, constructions)
- Decide appropriate axes range

#### Step 2: Generate Manim Python code

Write a complete, self-contained Manim script following these rules:

1. Start with `from manim import *` and `import numpy as np`
2. Create ONE Scene subclass with a descriptive name
3. Use `Axes` or `NumberPlane` for function visualizations
4. Use `ValueTracker` + `always_redraw` for dynamic parameter animations
5. Use `Text("中文", font="Noto Sans CJK SC")` for Chinese labels
6. Use `MathTex(r"y = kx + b")` for math formulas
7. Keep total duration 5–30 seconds
8. Add a Chinese title at the top with `Text`

Code structure template:

```python
from manim import *
import numpy as np

class [TopicName]Scene(Scene):
    def construct(self):
        # 1. Title
        title = Text("[中文标题]", font="Noto Sans CJK SC", font_size=32).to_edge(UP)
        self.play(Write(title))

        # 2. Axes
        axes = Axes(x_range=[...], y_range=[...], axis_config={"include_numbers": True})
        self.play(Create(axes))

        # 3. Function graph (static or dynamic)
        # For dynamic: use ValueTracker + always_redraw
        # For static: use axes.plot()

        # 4. Annotations (dots, labels, lines)

        # 5. Animations (parameter changes, transforms)

        # 6. Final wait
        self.wait(1)
```

#### Step 3: Validate the code

Before rendering, validate with:
```bash
python scripts/render_manim.py --validate-only <<< "$CODE"
```

This checks:
- Syntax correctness (AST parse)
- No forbidden imports (os, subprocess, socket, etc.)
- Scene subclass exists
- `from manim import *` present

#### Step 4: Render to video

```bash
python scripts/render_manim.py --scene [ClassName] --quality medium --format mp4 <<< "$CODE"
```

Or from file:
```bash
python scripts/render_manim.py --file scene.py --scene [ClassName] -q medium
```

Output is JSON:
```json
{"success": true, "video_path": "/tmp/manim_output_xxx/...", "duration_seconds": 8.5}
```

#### Step 5: Deliver

- Return the video file to the user
- Show the generated code (optional, for transparency)
- Display the reasoning/title

### Common Math Animation Patterns

For detailed Manim API reference and ready-to-use patterns, see `references/manim-params.md`. Key patterns:

- **Linear function (一次函数)**: Axes + ValueTracker for k and b + always_redraw graph
- **Quadratic function (二次函数)**: Parabola + vertex dot + axis of symmetry + animate a/b/c
- **Trigonometric (三角函数)**: Extended x_range with PI steps + sin/cos comparison
- **Geometry (几何)**: Polygon + Dot vertices + angle marks + transformations

### Safety (Math Animation)

- Only `manim` and `numpy` imports allowed
- No filesystem/network/system access in generated code
- Render timeout: 120 seconds max
- Code length limit: 50,000 characters

---

## Integration with shenxiang.school

```
┌─────────────────────────────────────────────────────────────┐
│ shenxiang.school Architecture                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser → /api/dify-chat → routes to Dify                  │
│                                                             │
│  Dify Workflow A: Image Intent (2 nodes)                    │
│    assets/dify-workflow-intent-only.yml                      │
│    → Returns image JSON contract                            │
│                                                             │
│  Dify Workflow B: Math Intent (2 nodes)                     │
│    assets/dify-workflow-math-intent.yml                      │
│    → Returns math animation JSON contract                   │
│                                                             │
│  Codex receives JSON and executes:                          │
│    Image → native gpt-image-2 (no gateway needed)           │
│    Math  → generate Manim code → render_manim.py → video    │
│                                                             │
│  Credits deducted per generation via /api/user/credits       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key simplifications vs. original architecture

| Original | With this skill |
|---|---|
| 4-node Dify workflow + Code validation node | 2-node Dify (intent only) + Codex handles logic |
| `dify-image-gateway:8001` for image gen | Eliminated — Codex has native gpt-image-2 |
| No math animation capability | Full Manim rendering pipeline added |
| Multiple API hops for one generation | Single Codex execution per request |

### Deployment checklist

1. **Dify**: Import both workflow YAMLs from `assets/`
2. **Docker**: Add manim-renderer container (for video rendering)
3. **Env vars**: `DIFY_API_KEY_INTENT` (image) + `DIFY_API_KEY_MATH_INTENT` (math)
4. **Codex**: Install skill to `~/.codex/skills/shenxiang-image-gen/`
5. **CDN**: Configure video output upload to `cdn.shenxiang.school`
