/**
 * Example: Next.js App Router API route.
 * File path in your project: app/api/optimize/route.ts
 *
 * Keeps the Dify key on the server, picks the right workflow by
 * `target_app`, returns the optimized prompt JSON to the browser.
 */

import { NextResponse } from 'next/server';
import { optimizeForGptImage2 } from '@/lib/optimize-gpt-image-2';
import { optimizeForNanoBanana2 } from '@/lib/optimize-nano-banana-2';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const raw_prompt = String(body?.raw_prompt ?? '').trim();
    if (!raw_prompt) {
      return NextResponse.json(
        { error: 'raw_prompt is required' },
        { status: 400 },
      );
    }
    if (raw_prompt.length > 2000) {
      return NextResponse.json(
        { error: 'raw_prompt too long (max 2000 chars)' },
        { status: 400 },
      );
    }

    const target_app = body?.target_app;
    if (target_app !== 'gpt-image-2' && target_app !== 'nano-banana-2') {
      return NextResponse.json(
        { error: 'target_app must be "gpt-image-2" or "nano-banana-2"' },
        { status: 400 },
      );
    }

    if (target_app === 'gpt-image-2') {
      const out = await optimizeForGptImage2({
        raw_prompt,
        style_preset: body?.style_preset,
        aspect_ratio_hint: body?.aspect_ratio_hint,
        user_id: body?.user_id,
      });
      return NextResponse.json({ target_app, ...out });
    }

    const out = await optimizeForNanoBanana2({
      raw_prompt,
      style_preset: body?.style_preset,
      aspect_ratio_hint: body?.aspect_ratio_hint,
      quality_tier: body?.quality_tier,
      user_id: body?.user_id,
    });
    return NextResponse.json({ target_app, ...out });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
