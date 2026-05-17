/**
 * 🖌 沈翔智学 v2「墨砚」朱印章组件
 *
 * 应用场景：
 *   - 已批阅 / 已审核 角标
 *   - 评分数字红印（"8.5/10"）
 *   - 成就章
 *
 * 风格：
 *   - 红方框（朱印）：宋体竖排或横排，朱印红边 + 朱印红字
 *   - 圆形章：圆形红印（用于评分头像角标）
 *
 * 变体：rect / circle / score
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const sealVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-[var(--font-display)] font-bold",
    "border-2",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      shape: {
        rect: "rounded-[var(--radius-sharp)]",
        circle: "rounded-full",
        score: "rounded-full aspect-square",
      },
      orientation: {
        horizontal: "",
        vertical: "[writing-mode:vertical-rl]",
      },
      size: {
        xs: "size-8 text-[10px]",
        sm: "size-12 text-[12px]",
        md: "size-16 text-[14px]",
        lg: "size-20 text-[16px]",
        // score sizes 不限制 size，由调用方控制
        none: "",
      },
      tone: {
        seal: cn(
          "border-[var(--seal-500)] text-[var(--seal-500)]",
          "bg-[var(--seal-50)]/80",
          "shadow-[0_2px_0_var(--seal-500)]"
        ),
        ink: cn(
          "border-[var(--ink-700)] text-[var(--ink-700)]",
          "bg-[var(--ink-50)]/80"
        ),
      },
    },
    defaultVariants: {
      shape: "rect",
      orientation: "vertical",
      size: "md",
      tone: "seal",
    },
  }
)

export interface SealStampProps
  extends Omit<React.ComponentProps<"div">, "color">,
    VariantProps<typeof sealVariants> {
  /** 印章文字（建议 2-4 字） */
  label?: string
  /** 倾斜角度（度），默认 -6 */
  rotate?: number
}

export function SealStamp({
  className,
  shape,
  orientation,
  size,
  tone,
  label,
  rotate = -6,
  children,
  style,
  ...props
}: SealStampProps) {
  return (
    <div
      className={cn(sealVariants({ shape, orientation, size, tone }), className)}
      style={{
        transform: `rotate(${rotate}deg)`,
        letterSpacing: orientation === "vertical" ? "0.2em" : "0.05em",
        ...style,
      }}
      aria-label={typeof label === "string" ? label : undefined}
      {...props}
    >
      {children ?? label}
    </div>
  )
}

/**
 * 评分朱印（圆形大印）
 * 用法：<ScoreSeal score="8.5" total="10" />
 */
export function ScoreSeal({
  score,
  total,
  size = 80,
  className,
}: {
  score: string | number
  total?: string | number
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center",
        "rounded-full border-2 border-[var(--seal-500)]",
        "bg-[var(--seal-50)]/70 shadow-[0_2px_0_var(--seal-500)]",
        "font-[var(--font-display)]",
        className
      )}
      style={{ width: size, height: size, transform: "rotate(-4deg)" }}
      aria-label={`评分 ${score}${total ? ` / ${total}` : ""}`}
    >
      <span className="font-mono text-[var(--seal-600)] font-bold leading-none" style={{ fontSize: size * 0.32 }}>
        {score}
      </span>
      {total !== undefined ? (
        <span className="font-mono text-[var(--seal-500)] leading-none mt-1" style={{ fontSize: size * 0.14 }}>
          / {total}
        </span>
      ) : null}
    </div>
  )
}

export { sealVariants }
