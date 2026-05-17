/**
 * 🖌 沈翔智学 v2「墨砚」EmptyState
 *
 * 视觉：卷起的卷轴 SVG + 文字 + 可选 CTA
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ButtonV2 } from "@/components/ui/v2/button"

export interface EmptyStateV2Props {
  title: string
  description?: string
  /** 自定义图标，不传则用默认卷轴 SVG */
  icon?: React.ReactNode
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

function ScrollIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-[var(--ink-400)]"
    >
      <rect
        x="9"
        y="11"
        width="30"
        height="26"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="var(--paper-100)"
      />
      <path
        d="M14 18h20M14 24h20M14 30h13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 11c-2 0-3 1-3 3s1 3 3 3M39 11c2 0 3 1 3 3s-1 3-3 3M9 31c-2 0-3 1-3 3s1 3 3 3M39 31c2 0 3 1 3 3s-1 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function EmptyStateV2({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateV2Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        "font-[var(--font-sans-v2)]",
        className
      )}
    >
      <div className="mb-2">{icon ?? <ScrollIcon />}</div>
      <h3 className="font-[var(--font-display)] text-[18px] font-bold text-[var(--ink-800)]">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-[14px] leading-[1.7] text-[var(--ink-500)]">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-3">
          {action.href ? (
            <ButtonV2 asChild variant="primary" size="sm">
              <a href={action.href}>{action.label}</a>
            </ButtonV2>
          ) : (
            <ButtonV2 variant="primary" size="sm" onClick={action.onClick}>
              {action.label}
            </ButtonV2>
          )}
        </div>
      ) : null}
    </div>
  )
}
