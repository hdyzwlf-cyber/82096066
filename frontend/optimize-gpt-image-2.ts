/**
 * Frontend call to the "Prompt Optimizer - gpt-image-2" Dify workflow.
 *
 * IMPORTANT: never put the Dify API key in the browser.
 * Put this behind your own backend route (Next.js API route, Express, etc.)
 * and forward the call. The example below assumes it runs on your server.
 */

export type OptimizedGptImage2 = {
  optimized_prompt: string;
  aspect_ratio:
    | '1:1' | '3:2' | '2:3' | '4:3' | '3:4' | '16:9' | '9:16';
  size_hint:
    | '1024x1024' | '1024x1536' | '1536x1024' | '2048x2048';
  style_tag: 'photo' | 'illustration' | '3d' | 'design' | 'anime' | 'mixed';
  reasoning_short: string;
};

export type OptimizeInput = {
  raw_prompt: string;
  style_preset?: 'auto' | 'photo' | 'illustration' | '3d' | 'design' | 'anime';
  aspect_ratio_hint?: 'auto' | '1:1' | '3:2' | '2:3' | '4:3' | '3:4' | '16:9' | '9:16';
  user_id?: string;
};

const DIFY_BASE = process.env.DIFY_BASE_URL ?? 'https://api.dify.ai/v1';
const DIFY_KEY = process.env.DIFY_API_KEY_GPT_IMAGE_2!;

export async function optimizeForGptImage2(
  input: OptimizeInput,
): Promise<OptimizedGptImage2> {
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
    size_hint: o.size_hint ?? '1024x1024',
    style_tag: o.style_tag ?? 'photo',
    reasoning_short: o.reasoning_short ?? '',
  };
}
