/**
 * 🖌 沈翔智学 v2「墨砚」Progress
 *
 * 灵感：毛笔从左到右扫过纸面
 */

"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

export function ProgressV2({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress-v2"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-[var(--paper-200)]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-v2-indicator"
        className="h-full w-full flex-1 rounded-full bg-[var(--ink-600)] transition-transform duration-500 ease-[var(--ease-ink-spread)]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
