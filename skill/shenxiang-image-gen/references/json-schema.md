# Dify Intent-Recognition JSON Contract

This document defines the JSON schema that the Dify 2-node workflow outputs and that this skill consumes.

## Schema

```json
{
  "optimized_prompt": "string (required)",
  "aspect_ratio": "string (required)",
  "size_hint": "string (required)",
  "style_tag": "string (required)",
  "reasoning_short": "string (optional)"
}
```

## Field Definitions

### optimized_prompt (required)

- **Type**: string
- **Length**: 60–200 words, single natural-language paragraph in English
- **Content**: Fully rewritten image prompt optimized for gpt-image-2
- **Rules**:
  - Must be a descriptive paragraph, not comma-separated tags
  - On-image text wrapped in straight double quotes with font/weight/placement
  - Negative guidance included inline ("no watermark, no extra limbs")
  - If safety policy blocks the request, this field is empty string `""`

### aspect_ratio (required)

- **Type**: enum string
- **Allowed values**: `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `16:9`, `9:16`
- **Default**: `1:1`
- **Selection logic**:
  - Portrait / story / reels → `9:16`
  - Landscape / banner / thumbnail → `16:9`
  - Avatar / square post → `1:1`
  - Poster / book cover → `2:3`

### size_hint (required)

- **Type**: enum string
- **Allowed values**: `1024x1024`, `1024x1536`, `1536x1024`, `2048x2048`
- **Mapping from aspect_ratio**:

| aspect_ratio | size_hint |
|---|---|
| 1:1 | 1024x1024 |
| 3:2 | 1536x1024 |
| 2:3 | 1024x1536 |
| 4:3 | 1536x1024 |
| 3:4 | 1024x1536 |
| 16:9 | 1536x1024 |
| 9:16 | 1024x1536 |

- `2048x2048` is only used when explicitly requested for ultra-high quality square output.

### style_tag (required)

- **Type**: enum string
- **Allowed values**: `photo`, `illustration`, `3d`, `design`, `anime`, `mixed`
- **Default**: `photo`
- **Purpose**: Informational tag for logging/analytics; does not change generation behavior directly (the optimized_prompt already encodes style).

### reasoning_short (optional)

- **Type**: string
- **Max length**: 200 characters (truncated if longer)
- **Purpose**: One-line explanation of why the optimizer made these choices. Displayed to the user for transparency.
- **Safety refusal value**: `"Request rejected by safety policy."`

## Example: Valid Payload

```json
{
  "optimized_prompt": "A close-up portrait of a fluffy ginger kitten with large amber eyes and soft pink paw pads, sitting alert on a pale linen blanket near a sunlit window. Shot on an 85mm lens at f/1.8, shallow depth of field, eye-level angle, rule-of-thirds composition. Warm late-afternoon side light with gentle rim light on the fur and soft falloff into the background. Creamy neutral palette with touches of peach. Photorealistic, fine fur detail, natural catchlights in the eyes. No watermark, no text, no distorted anatomy, no extra limbs.",
  "aspect_ratio": "1:1",
  "size_hint": "1024x1024",
  "style_tag": "photo",
  "reasoning_short": "Simple cute-pet portrait; square works on any feed."
}
```

## Example: Safety Refusal

```json
{
  "optimized_prompt": "",
  "aspect_ratio": "1:1",
  "size_hint": "1024x1024",
  "style_tag": "photo",
  "reasoning_short": "Request rejected by safety policy."
}
```

## Validation

Run `scripts/validate_dify_json.py` to check any payload:

```bash
echo '{"optimized_prompt":"...","aspect_ratio":"1:1","size_hint":"1024x1024","style_tag":"photo"}' | python scripts/validate_dify_json.py
```

The validator normalizes invalid fields to safe defaults rather than crashing.
