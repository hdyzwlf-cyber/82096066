# gpt-image-2 Parameters Reference

This document describes the parameters and best practices for calling gpt-image-2 natively within Codex.

## Model Overview

- **Name**: `gpt-image-2` (a.k.a. ChatGPT Images 2.0)
- **Type**: Reasoning image model (not diffusion)
- **Key trait**: Plans scene layout, physics, text placement, and spatial relationships before rendering
- **Text rendering**: Excellent multilingual text-in-image capability

## Generation Parameters

### prompt (required)

- **Type**: string
- **Best length**: 60–180 words
- **Format**: Natural-language paragraph (NOT comma-separated tags)
- **Language**: English (translate user intent; keep on-image text in original language)

### size (required)

- **Allowed values**:
  - `1024x1024` — square (default)
  - `1024x1536` — portrait / vertical
  - `1536x1024` — landscape / horizontal
  - `2048x2048` — ultra-high quality square (use sparingly, slower)

### quality (optional)

- **Values**: `auto` (default), `high`
- **When to use `high`**: Only for 2048x2048 or when user explicitly requests maximum quality
- **Default behavior**: `auto` provides excellent quality for standard sizes

## Prompt Engineering for gpt-image-2

### Structure (in order)

1. **Subject** — who/what, specific identity traits, named characters
2. **Action** — pose, expression, movement
3. **Environment** — setting, time of day, weather, background
4. **Camera** — lens focal length, aperture, angle, distance, depth of field
5. **Lighting** — source, direction, quality, color temperature
6. **Palette** — color scheme and mood
7. **Text** — exact string in straight quotes + font/weight/color/placement
8. **Negatives** — inline ("no watermark, no extra limbs, no blurred text")

### Key Rules

| Rule | Why |
|---|---|
| Use paragraphs, not tags | The model reasons over natural language; tags confuse it |
| Be explicit and literal | It follows instructions literally; vague = unpredictable |
| Wrap on-image text in `"quotes"` | Triggers the text-rendering pipeline |
| State font details for text | weight, color, size, position — all matter |
| Include negative guidance inline | No separate negative prompt field exists |
| Specify camera language for photos | Lens (85mm, 35mm), aperture (f/1.8), angle, DoF |
| Use medium language for non-photo | "flat vector, 2px stroke, isometric cutaway" |

### What to Avoid

- Real names of living artists (use descriptive style words instead)
- Copyrighted characters (describe the visual traits generically)
- Real private individuals (unless user confirms they have rights)
- Minors in unsafe or suggestive contexts
- Weapons manufacture details, self-harm, sexual content
- Real brand logos the user does not own

### Photography Vocabulary Cheat Sheet

| Category | Examples |
|---|---|
| Lens | 24mm (wide), 35mm (street), 50mm (standard), 85mm (portrait), 135mm (compressed), macro |
| Aperture | f/1.4 (dreamy bokeh), f/2.8 (sharp subject), f/8 (landscape sharp), f/16 (deep DoF) |
| Angle | eye-level, low angle, bird's eye, dutch angle, over-the-shoulder |
| Lighting | softbox, rim light, golden hour, blue hour, hard sunlight, overcast diffused |
| Film stock | Kodak Portra 400 (warm skin), Fujifilm Superia (punchy), Cinestill 800T (tungsten halation) |

### Non-Photo Style Vocabulary

| Style | Key descriptors |
|---|---|
| Illustration | flat color, cel-shaded, ink wash, gouache texture, editorial illustration |
| 3D | smooth matte vinyl, subsurface scatter, Nendoroid proportions, isometric, low-poly |
| Design | vector, bold typography, negative space, gradient mesh, brutalist |
| Anime | cel-shaded, large expressive eyes, sakura petals, dynamic speed lines |

## Size Selection Logic

```
User intent          → aspect_ratio → size_hint
─────────────────────────────────────────────────
Avatar / square post → 1:1          → 1024x1024
Portrait / story     → 9:16         → 1024x1536
Poster / book cover  → 2:3          → 1024x1536
Product (vertical)   → 3:4          → 1024x1536
Banner / thumbnail   → 16:9         → 1536x1024
Landscape / scene    → 3:2          → 1536x1024
Product (horizontal) → 4:3          → 1536x1024
Ultra-high quality   → 1:1          → 2048x2048
```

## Codex-Native Generation

When generating within Codex, call the image generation tool directly:

1. Set `prompt` to the `optimized_prompt` from the JSON contract
2. Set `size` to the `size_hint` value
3. Set `quality` to `high` only if size is `2048x2048`
4. The image is returned inline — no external API gateway needed

This is the key advantage: Codex has native gpt-image-2 access, eliminating the need for `dify-image-gateway` or any intermediate proxy.
