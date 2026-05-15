# Manim Community API Reference & Animation Patterns

This document provides the essential Manim Community (v0.18+) API knowledge for generating math visualization animations. Codex reads this when the user requests a math animation.

## Table of Contents

1. [Core Imports & Scene Structure](#core-imports--scene-structure)
2. [Coordinate System & NumberPlane](#coordinate-system--numberplane)
3. [Function Graphs](#function-graphs)
4. [Dynamic Animations with ValueTracker](#dynamic-animations-with-valuetracker)
5. [Text & LaTeX](#text--latex)
6. [Common Animation Methods](#common-animation-methods)
7. [Color & Styling](#color--styling)
8. [K12 Math Patterns](#k12-math-patterns)
9. [Safety & Constraints](#safety--constraints)

---

## Core Imports & Scene Structure

```python
from manim import *

class MyScene(Scene):
    def construct(self):
        # All animation code goes here
        pass
```

- Every script MUST start with `from manim import *`
- One Scene subclass per animation
- All visuals built inside `construct(self)`
- Default canvas: 14.2 × 8 units, centered at origin

## Coordinate System & NumberPlane

```python
# Basic number plane (grid + axes)
plane = NumberPlane(
    x_range=[-5, 5, 1],      # [min, max, step]
    y_range=[-4, 4, 1],
    x_length=10,              # screen width in units
    y_length=7,
    background_line_style={"stroke_opacity": 0.4},
)

# Axes only (no grid)
axes = Axes(
    x_range=[-5, 5, 1],
    y_range=[-4, 4, 1],
    x_length=10,
    y_length=7,
    axis_config={"include_numbers": True, "font_size": 24},
)

# Add axis labels
x_label = axes.get_x_axis_label("x")
y_label = axes.get_y_axis_label("y")
```

## Function Graphs

```python
# Static function graph
graph = axes.plot(lambda x: 2*x + 1, color=BLUE, x_range=[-4, 4])

# With label
label = axes.get_graph_label(graph, label="y=2x+1", x_val=2, direction=UR)

# Parametric curve
curve = axes.plot_parametric_curve(
    lambda t: np.array([np.cos(t), np.sin(t), 0]),
    t_range=[0, TAU],
    color=GREEN,
)

# Implicit curve (circle, ellipse, etc.)
circle = ImplicitFunction(
    lambda x, y: x**2 + y**2 - 4,
    color=RED,
)
```

## Dynamic Animations with ValueTracker

The most important pattern for interactive math visualization:

```python
# Create a tracker for a parameter
k = ValueTracker(1)  # slope starts at 1

# always_redraw: re-creates the mobject every frame
graph = always_redraw(lambda: axes.plot(
    lambda x: k.get_value() * x + 1,
    color=BLUE,
    x_range=[-4, 4],
))

# Animate the parameter change
self.play(k.animate.set_value(3), run_time=2)  # slope goes from 1 to 3
self.wait(0.5)
self.play(k.animate.set_value(-2), run_time=2)  # slope goes to -2
```

### Multiple trackers

```python
a = ValueTracker(1)
b = ValueTracker(0)
c = ValueTracker(0)

parabola = always_redraw(lambda: axes.plot(
    lambda x: a.get_value()*x**2 + b.get_value()*x + c.get_value(),
    color=YELLOW,
    x_range=[-4, 4],
))
```

## Text & LaTeX

```python
# Plain text (supports Chinese with font parameter)
title = Text("一次函数", font="Noto Sans CJK SC", font_size=36)

# LaTeX math
formula = MathTex(r"y = kx + b", font_size=48)

# LaTeX with color highlights
formula = MathTex(r"y = ", r"k", r"x + ", r"b")
formula[1].set_color(RED)    # k in red
formula[3].set_color(GREEN)  # b in green

# Dynamic LaTeX label (updates with ValueTracker)
label = always_redraw(lambda: MathTex(
    f"k = {k.get_value():.1f}",
    font_size=32,
).to_corner(UR))

# Positioning
title.to_edge(UP)
formula.next_to(graph, RIGHT)
text.move_to(ORIGIN)
text.shift(LEFT * 2 + UP * 1)
```

### Chinese Font Support

```python
# Always specify font for Chinese text
Text("一次函数 y=kx+b", font="Noto Sans CJK SC")
Text("二次函数", font="Source Han Sans CN")

# Or use MarkupText for mixed content
MarkupText(
    '<span font_family="Noto Sans CJK SC">斜率</span> k=2',
    font_size=28,
)
```

## Common Animation Methods

### Creating / Showing

```python
self.play(Create(mobject))          # draw stroke then fill
self.play(Write(text))              # handwriting effect for text/LaTeX
self.play(FadeIn(mobject))          # fade in
self.play(GrowFromCenter(mobject))  # scale from 0 at center
self.play(DrawBorderThenFill(mob))  # outline first, then fill
```

### Transforming

```python
self.play(Transform(mob_a, mob_b))              # morph A into B (A reference kept)
self.play(ReplacementTransform(mob_a, mob_b))   # morph A into B (B reference kept)
self.play(mob.animate.shift(RIGHT * 2))         # move
self.play(mob.animate.scale(1.5))               # scale
self.play(mob.animate.set_color(RED))           # recolor
```

### Removing

```python
self.play(FadeOut(mobject))
self.play(Uncreate(mobject))        # reverse of Create
```

### Timing

```python
self.play(animation, run_time=2)    # 2 seconds
self.wait(1)                        # pause 1 second
self.play(anim1, anim2)             # simultaneous
self.play(anim1)
self.play(anim2)                    # sequential
```

### Camera

```python
# For MovingCameraScene
class MyScene(MovingCameraScene):
    def construct(self):
        self.camera.frame.animate.scale(1.5)  # zoom out
        self.camera.frame.animate.move_to(point)  # pan
```

## Color & Styling

### Built-in Colors

```
RED, GREEN, BLUE, YELLOW, ORANGE, PURPLE, PINK, TEAL, GOLD
WHITE, BLACK, GREY (GRAY)
BLUE_A through BLUE_E (light to dark)
Same for RED, GREEN, etc.
```

### Custom Colors

```python
custom = ManimColor("#FF6B35")
mob.set_color(custom)
mob.set_fill(BLUE, opacity=0.3)
mob.set_stroke(WHITE, width=2)
```

## K12 Math Patterns

### Pattern 1: Linear Function y = kx + b (一次函数)

```python
class LinearFunction(Scene):
    def construct(self):
        axes = Axes(x_range=[-5, 5, 1], y_range=[-4, 4, 1],
                    x_length=10, y_length=7,
                    axis_config={"include_numbers": True, "font_size": 20})
        axes_labels = axes.get_axis_labels(x_label="x", y_label="y")

        k = ValueTracker(1)
        b = ValueTracker(0)

        graph = always_redraw(lambda: axes.plot(
            lambda x: k.get_value() * x + b.get_value(),
            color=BLUE, x_range=[-5, 5],
        ))

        formula = always_redraw(lambda: MathTex(
            f"y = {k.get_value():.1f}x {'+' if b.get_value() >= 0 else ''}{b.get_value():.1f}",
            font_size=36,
        ).to_corner(UR))

        title = Text("一次函数", font="Noto Sans CJK SC", font_size=32).to_edge(UP)

        self.play(Write(title))
        self.play(Create(axes), Write(axes_labels))
        self.play(Create(graph), Write(formula))
        self.wait(0.5)

        # Animate slope change
        self.play(k.animate.set_value(2), run_time=2)
        self.wait(0.3)
        self.play(k.animate.set_value(-1), run_time=2)
        self.wait(0.3)

        # Animate intercept change
        self.play(k.animate.set_value(1), run_time=1)
        self.play(b.animate.set_value(2), run_time=2)
        self.wait(0.3)
        self.play(b.animate.set_value(-2), run_time=2)
        self.wait(1)
```

### Pattern 2: Quadratic Function y = ax² + bx + c (二次函数)

```python
class QuadraticFunction(Scene):
    def construct(self):
        axes = Axes(x_range=[-5, 5, 1], y_range=[-5, 8, 1],
                    x_length=10, y_length=7,
                    axis_config={"include_numbers": True, "font_size": 20})

        a = ValueTracker(1)
        b_val = ValueTracker(0)
        c = ValueTracker(0)

        parabola = always_redraw(lambda: axes.plot(
            lambda x: a.get_value()*x**2 + b_val.get_value()*x + c.get_value(),
            color=YELLOW, x_range=[-5, 5],
        ))

        # Vertex dot
        vertex_dot = always_redraw(lambda: Dot(
            axes.c2p(
                -b_val.get_value() / (2*a.get_value()),
                -(b_val.get_value()**2 - 4*a.get_value()*c.get_value()) / (4*a.get_value()),
            ),
            color=RED, radius=0.08,
        ))

        # Axis of symmetry
        sym_line = always_redraw(lambda: axes.plot(
            lambda x: axes.p2c(axes.c2p(0, x))[1],  # vertical line placeholder
            color=RED_A, x_range=[-5, 5],
        ) if False else DashedLine(
            axes.c2p(-b_val.get_value()/(2*a.get_value()), -5),
            axes.c2p(-b_val.get_value()/(2*a.get_value()), 8),
            color=RED_A, dash_length=0.1,
        ))

        title = Text("二次函数", font="Noto Sans CJK SC", font_size=32).to_edge(UP)
        formula = always_redraw(lambda: MathTex(
            f"y = {a.get_value():.1f}x^2",
            font_size=32,
        ).to_corner(UR))

        self.play(Write(title))
        self.play(Create(axes))
        self.play(Create(parabola), Write(formula))
        self.play(Create(vertex_dot))
        self.wait(0.5)

        # Show opening direction change
        self.play(a.animate.set_value(2), run_time=1.5)
        self.play(a.animate.set_value(0.5), run_time=1.5)
        self.play(a.animate.set_value(-1), run_time=2)
        self.wait(0.5)
        self.play(a.animate.set_value(1), run_time=1.5)

        # Show vertical shift
        self.play(c.animate.set_value(3), run_time=2)
        self.play(c.animate.set_value(-2), run_time=2)
        self.wait(1)
```

### Pattern 3: Trigonometric Functions (三角函数)

```python
class TrigFunction(Scene):
    def construct(self):
        axes = Axes(x_range=[-2*PI, 2*PI, PI/2], y_range=[-2, 2, 0.5],
                    x_length=12, y_length=5,
                    axis_config={"include_numbers": False})

        sin_graph = axes.plot(lambda x: np.sin(x), color=BLUE)
        cos_graph = axes.plot(lambda x: np.cos(x), color=RED)

        sin_label = axes.get_graph_label(sin_graph, label="\\sin x", x_val=PI)
        cos_label = axes.get_graph_label(cos_graph, label="\\cos x", x_val=PI/2)

        self.play(Create(axes))
        self.play(Create(sin_graph), Write(sin_label), run_time=2)
        self.wait(0.5)
        self.play(Create(cos_graph), Write(cos_label), run_time=2)
        self.wait(1)
```

### Pattern 4: Geometry (几何)

```python
class GeometryDemo(Scene):
    def construct(self):
        # Triangle with labels
        triangle = Polygon(
            [-2, -1, 0], [2, -1, 0], [0, 2, 0],
            color=BLUE, fill_opacity=0.2,
        )
        vertices = VGroup(*[Dot(p, color=WHITE) for p in triangle.get_vertices()])
        labels = VGroup(
            MathTex("A").next_to(triangle.get_vertices()[0], DL, buff=0.2),
            MathTex("B").next_to(triangle.get_vertices()[1], DR, buff=0.2),
            MathTex("C").next_to(triangle.get_vertices()[2], UP, buff=0.2),
        )

        self.play(Create(triangle), FadeIn(vertices), Write(labels))
        self.wait(1)
```

## Safety & Constraints

### Forbidden imports (sandbox security)

```python
# NEVER use these in generated Manim code:
import os
import subprocess
import socket
import requests
import shutil
import sys  # (except sys.exit in scripts)
```

### Code generation rules

1. Only `from manim import *` and `import numpy as np` are allowed
2. No file system access beyond the rendering temp directory
3. No network calls
4. No infinite loops — all animations must terminate
5. Total animation duration should be 5–30 seconds (user can specify)
6. Use `self.wait()` sparingly — 0.3–1 second pauses between sections

### Rendering parameters

| Quality | Flag | Resolution | FPS | Use case |
|---|---|---|---|---|
| low | `-ql` | 480p | 15 | Quick preview |
| medium | `-qm` | 720p | 30 | Standard delivery |
| high | `-qh` | 1080p | 60 | Final output |

Default to **medium quality** (`-qm`) unless user specifies otherwise.

### Output format

- Default: MP4 (H.264, widely compatible)
- Alternative: WebM (VP9, smaller for web)
- GIF only for very short (<5s) loops
