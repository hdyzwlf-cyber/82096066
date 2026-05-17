/**
 * 🖌 沈翔智学 v2「墨砚」Skeleton
 *
 * 不用闪烁亮光 shimmer，用墨色脉冲（更克制）。
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export function SkeletonV2({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-v2"
      className={cn(
        "animate-pulse rounded-[var(--radius-soft)]",
        "bg-[var(--paper-200)]/60",
        className
      )}
      {...props}
    />
  )
}
