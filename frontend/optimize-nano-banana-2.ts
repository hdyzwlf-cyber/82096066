/**
 * Frontend call to the "Prompt Optimizer - Nano Banana 2" Dify workflow.
 *
 * IMPORTANT: never put the Dify API key in the browser.
 * Put this behind your own backend route and forward the call.
 */

export type OptimizedNanoBanana2 = {
  optimized_prompt: string;
  aspect_ratio:
    | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4'
    | '9:16' | '16:9' | '9:21' | '21:9' | '2:1' | '1:2' | '5:7';
  resolution: '1K' | '2K' | '4K';
  model_suggestion: 'nano-banana-2' | 'nano-banana-pro';
  style_tag:
    | 'photo' | 'illustration' | '3d' | 'design' | 'anime' | 'infographic' | 'mixed';
  reasoning_short: string;
};

export type OptimizeInput = {
  raw_prompt: string;
  style_preset?:
    | 'auto' | 'photo' | 'illustration' | '3d' | 'design' | 'anime' | 'infographic';
  aspect_ratio_hint?: OptimizedNanoBanana2['aspect_ratio'] | 'auto';
  quality_tier?: 'auto' | 'draft' | 'standard' | 'hero';
  user_id?: string;
};

const DIFY_BASE = process.env.DIFY_BASE_URL ?? 'https://api.dify.ai/v1';
const DIFY_KEY = process.env.DIFY_API_KEY_NANO_BANANA_2!;

export async function optimizeForNanoBanana2(
  input: OptimizeInput,
): Promise<OptimizedNanoBanana2> {
  const res = await fetch(`${DIFY_BASE}/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DIFY_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        raw_prompt: input.raw_prompt,
        style_preset: input.style_preset ?? 'auto',
        aspect_ratio_hint: input.aspect_ratio_hint ?? 'auto',
        quality_tier: input.quality_tier ?? 'auto',
      },
      response_mode: 'blocking',
      user: input.user_id ?? 'anonymous',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Dify workflow failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const o = data?.data?.outputs ?? {};

  return {
    optimized_prompt: o.optimized_prompt ?? input.raw_prompt,
    aspect_ratio: o.aspect_ratio ?? '1:1',
    resolution: o.resolution ?? '2K',
    model_suggestion: o.model_suggestion ?? 'nano-banana-2',
    style_tag: o.style_tag ?? 'photo',
    reasoning_short: o.reasoning_short ?? '',
  };
}
