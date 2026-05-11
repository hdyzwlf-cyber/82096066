# Image Prompt Optimizer — Two Independent Dify Workflows

Optimizer LLM: **OpenAI GPT-5**.
Two independent workflows, one per downstream image model:

| Workflow file | For downstream model | Outputs |
|---|---|---|
| `dify/workflow-gpt-image-2.yml` | OpenAI `gpt-image-2` | `optimized_prompt`, `aspect_ratio`, `size_hint`, `style_tag`, `reasoning_short` |
| `dify/workflow-nano-banana-2.yml` | Google Nano Banana 2 / Pro (`gemini-3.1-flash-image`, `gemini-3-pro-image`) | `optimized_prompt`, `aspect_ratio`, `resolution`, `model_suggestion`, `style_tag`, `reasoning_short` |

Each workflow has its own API key inside Dify. The frontend must never see
those keys — proxy through your own backend (see `examples/next-api-route.ts`).

## Repo layout

```
prompts/
  gpt-image-2.system.md        full System Prompt (reference / editable)
  nano-banana-2.system.md      full System Prompt (reference / editable)

dify/
  workflow-gpt-image-2.yml     import into Dify: Studio -> Create App -> Import DSL
  workflow-nano-banana-2.yml   same

frontend/
  optimize-gpt-image-2.ts      server-side helper to call workflow 1
  optimize-nano-banana-2.ts    server-side helper to call workflow 2

examples/
  next-api-route.ts            Next.js App Router route, picks workflow by target_app
  browser-call.ts              how the browser calls your own /api/optimize
```

## Each workflow has 4 nodes

```
Start  ->  LLM (GPT-5, JSON mode)  ->  Code (validate & normalize)  ->  End
```

- **Start**: accepts `raw_prompt` plus optional `style_preset`,
  `aspect_ratio_hint`, and (Nano Banana only) `quality_tier`.
- **LLM**: GPT-5 with a model-specific system prompt + few-shot.
  `response_format = json_object`, `temperature = 0.4`.
- **Code**: parses the LLM JSON, enforces the schema, honors user
  overrides, falls back to the raw prompt if the LLM output is
  unparseable. For gpt-image-2 it also maps aspect ratio to a concrete
  pixel size.
- **End**: returns structured fields to the caller.

## Quick deploy

1. In Dify: **Studio → Create App → Import DSL**, upload the YAML file.
   Do this once per workflow, so you get **two separate apps** with
   **two separate API keys**.
2. In each app's **Overview → API Access**, copy the API key.
3. Set env vars on your backend:

   ```
   DIFY_BASE_URL=https://api.dify.ai/v1
   DIFY_API_KEY_GPT_IMAGE_2=app-xxxxxxxxxxxxxxxx
   DIFY_API_KEY_NANO_BANANA_2=app-xxxxxxxxxxxxxxxx
   ```

4. Drop `frontend/*.ts` into your server (e.g. `lib/`) and
   `examples/next-api-route.ts` into `app/api/optimize/route.ts`.
5. In the browser, call `/api/optimize` with `target_app` set to
   either `gpt-image-2` or `nano-banana-2`. See
   `examples/browser-call.ts`.

## UX recommendation

- Show the optimized prompt in an editable textarea before the user
  clicks Generate. Transparency beats a black box and gives users a
  fast way to iterate.
- Surface `reasoning_short` under the textarea as a one-line
  explanation of why the optimizer made those choices.
- For Nano Banana, use `model_suggestion` to route between
  `nano-banana-2` (fast) and `nano-banana-pro` (hero quality), or let
  the user override with the `quality_tier` input.

## Safety

Both system prompts refuse unsafe intents (real private people, minors
in unsafe contexts, sexual content, self-harm, weapons manufacture,
copyrighted characters). When refused, the workflow still returns a
well-formed JSON with `optimized_prompt = ""` and
`reasoning_short = "Request rejected by safety policy."` — so the
frontend can show a friendly message instead of crashing.
