/**
 * Example: how the browser calls your own backend route.
 * Your backend route hits Dify and returns the optimized prompt.
 */

export async function optimizePrompt(params: {
  raw_prompt: string;
  target_app: 'gpt-image-2' | 'nano-banana-2';
  style_preset?: string;
  aspect_ratio_hint?: string;
  quality_tier?: 'auto' | 'draft' | 'standard' | 'hero';
}) {
  const res = await fetch('/api/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Optimize failed: ${res.status}`);
  return res.json();
}

// Usage in a React handler:
//
// const onGenerate = async () => {
//   const { optimized_prompt, aspect_ratio, size_hint } = await optimizePrompt({
//     raw_prompt: userInput,
//     target_app: 'gpt-image-2',
//   });
//   // Show the optimized_prompt to the user (editable), then call your image
//   // generation backend with optimized_prompt + size_hint.
// };
