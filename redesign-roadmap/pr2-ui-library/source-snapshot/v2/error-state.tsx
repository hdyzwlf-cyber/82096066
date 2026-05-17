/**
 * 🖌 沈翔智学 v2「墨砚」ErrorState
 *
 * 视觉：朱印红墨点 + 错误信息 + 可选重试
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ButtonV2 } from "@/components/ui/v2/button"

export interface ErrorStateV2Props {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

function InkDot() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="14" fill="var(--seal-500)" opacity="0.92" />
      <circle cx="24" cy="24" r="14" fill="url(#ink-dot-grad)" />
      <circle cx="32" cy="14" r="3" fill="var(--seal-500)" opacity="0.6" />
      <circle cx="36" cy="34" r="2" fill="var(--seal-500)" opacity="0.5" />
      <defs>
        <radialGradient id="ink-dot-grad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--seal-300)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--seal-600)" stopOpacity="1" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export function ErrorStateV2({
  title = "出错了",
  description,
  onRetry,
  retryLabel = "重新加载",
  className,
}: ErrorStateV2Props) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        "font-[var(--font-sans-v2)]",
        className
      )}
    >
      <div className="mb-2">
        <InkDot />
      </div>
      <h3 className="font-[var(--font-display)] text-[18px] font-bold text-[var(--seal-600)]">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-[14px] leading-[1.7] text-[var(--ink-600)]">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <div className="mt-3">
          <ButtonV2 variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </ButtonV2>
        </div>
      ) : null}
    </div>
  )
}
