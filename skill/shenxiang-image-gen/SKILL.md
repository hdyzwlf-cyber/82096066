---
name: shenxiang-image-gen
description: Generate images using Codex's native gpt-image-2 tool based on structured JSON from a Dify intent-recognition workflow. Use when a user provides a raw image request (in any language) and the Dify backend has returned (or will return) a JSON payload with optimized_prompt, aspect_ratio, size_hint, and style_tag. Also use when directly asked to generate, create, or draw an image — in which case run the full pipeline locally: parse intent, optimize prompt, then generate with gpt-image-2.
---

# Shenxiang Image Generator

End-to-end image generation skill for shenxiang.school. Accepts user requests in any language, optimizes the prompt for gpt-image-2, and generates the image natively within Codex.

## Architecture

```
User request (any language)
       │
       ▼
┌─────────────────────────┐
│ Dify Workflow (2 nodes)  │  ← intent recognition only
│ Start → LLM → End       │
│ Returns JSON contract    │
└───────────┬─────────────┘
            │ JSON
            ▼
┌─────────────────────────┐
│ This Codex Skill         │  ← executes image generation
│ 1. Validate JSON         │
│ 2. Generate with         │
│    gpt-image-2 (native)  │
│ 3. Return image + meta   │
└─────────────────────────┘
```

## When Dify JSON Is Provided

If the incoming message contains a JSON payload matching the contract below, skip prompt optimization and proceed directly to generation.

### Expected JSON Contract

```json
{
  "optimized_prompt": "string, 60-200 words, English paragraph",
  "aspect_ratio": "1:1 | 3:2 | 2:3 | 4:3 | 3:4 | 16:9 | 9:16",
  "size_hint": "1024x1024 | 1024x1536 | 1536x1024 | 2048x2048",
  "style_tag": "photo | illustration | 3d | design | anime | mixed",
  "reasoning_short": "string, ≤25 words"
}
```

### Execution Steps (JSON provided)

1. Parse and validate the JSON against the contract (see `references/json-schema.md`).
2. Extract `optimized_prompt` and `size_hint`.
3. Call gpt-image-2 with:
   - `prompt`: the `optimized_prompt` value
   - `size`: map `size_hint` to the tool's size parameter
   - `quality`: `high` for sizes ≥ 2048, otherwise `auto`
4. Return the generated image to the user.
5. Display `reasoning_short` as a brief explanation.

## When No JSON Is Provided (Direct Request)

If the user gives a raw image request without pre-processed JSON, run the full pipeline locally within Codex:

### Prompt Optimization Procedure

1. **Detect language** — translate meaning to English; keep on-image text in original language if user wants it rendered.
2. **Classify intent** — portrait, product, scene, poster, infographic, logo/design, illustration, 3d-figurine, edit.
3. **Compose one paragraph** (60-180 words) following this order:
   - Subject (identity traits, specifics)
   - Action / pose / expression
   - Environment / setting / time
   - Camera language (lens, angle, DoF) OR medium language for non-photo
   - Lighting (source, direction, quality, color temperature)
   - Color palette and mood
   - On-image text in straight quotes with font/weight/placement
   - Negative clauses ("no watermark, no extra limbs, no distorted hands")
4. **Pick aspect ratio**:
   - Portrait/story/reels → 9:16
   - Landscape/banner/thumbnail → 16:9
   - Avatar/square → 1:1
   - Poster/book cover → 2:3
   - Default → 1:1
5. **Map to size_hint**:
   - 1:1 → 1024x1024
   - 3:2 or 4:3 or 16:9 → 1536x1024
   - 2:3 or 3:4 or 9:16 → 1024x1536
6. **Generate** — call gpt-image-2 with the optimized prompt and mapped size.

### Safety Rules

Refuse and return an empty result if the request involves:
- Real private individuals without consent
- Minors in unsafe contexts
- Sexual content
- Self-harm or weapons manufacture
- Copyrighted characters or real brand logos the user does not own

When refused, explain briefly: "Request rejected by safety policy."

## gpt-image-2 Best Practices

- Use natural-language paragraphs, not comma-separated tags.
- The model is a reasoning image model — it plans layout, physics, text before rendering.
- It renders in-image text extremely well (multilingual). Wrap text in straight double quotes.
- Negative guidance goes inside the paragraph (no separate negative field).
- Be explicit and literal; avoid vague adjectives.
- For detailed model parameters, see `references/gpt-image-2-params.md`.

## Integration with shenxiang.school

The skill integrates with the existing architecture:

- **Dify** handles only intent recognition (lightweight 2-node workflow)
- **Next.js /api/dify-chat** receives user message, routes to Dify, gets JSON back
- **Codex** receives the JSON and generates the image natively (no image-gateway needed)
- **Credits** are deducted per generation via `/api/user/credits`

This eliminates the need for `dify-image-gateway:8001` and simplifies the pipeline.
