/**
 * 🖌 沈翔智学 v2「墨砚」LoadingState
 *
 * 主加载组件：毛笔横扫一笔 + 可选文字
 * 子组件：BrushDots（更小的内联加载，用在按钮里）
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { InkBrush } from "@/components/motion/InkMotion"

export interface LoadingStateV2Props {
  label?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingStateV2({
  label = "AI 正在思考...",
  className,
  size = "md",
}: LoadingStateV2Props) {
  const brushSize = size === "sm" ? "h-4 w-16" : size === "lg" ? "h-6 w-32" : "h-5 w-24"
  const textSize = size === "sm" ? "text-[12px]" : size === "lg" ? "text-[15px]" : "text-[13px]"
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-10",
        "font-[var(--font-sans-v2)]",
        className
      )}
    >
      <div className="text-[var(--ink-500)]">
        <InkBrush className={brushSize} />
      </div>
      {label ? (
        <p className={cn("text-[var(--ink-500)] tracking-[0.05em]", textSize)}>
          {label}
        </p>
      ) : null}
    </div>
  )
}

/**
 * 内联加载小点（用在 Button 内 / 输入区域内）
 * 三个墨点逐个闪烁
 */
export function BrushDots({
  className,
  color = "currentColor",
}: {
  className?: string
  color?: string
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label="加载中"
      role="status"
    >
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="block size-1.5 rounded-full"
          style={{
            backgroundColor: color,
            animation: "code-blink 0.9s ease-in-out infinite",
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </span>
  )
}
