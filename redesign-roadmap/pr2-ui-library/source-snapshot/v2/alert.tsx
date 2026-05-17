/**
 * 🖌 沈翔智学 v2「墨砚」Alert
 *
 * 4 种 variant：
 *   - info     墨色信息（中性）
 *   - success  墨绿成功
 *   - warning  朱印浅色警告
 *   - error    朱印红错误
 *
 * 不用 toast 弹层 — 那是 sonner 的事。这里是页面内的提示块。
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertV2Variants = cva(
  [
    "relative w-full rounded-[var(--radius-soft)] px-4 py-3",
    "font-[var(--font-sans-v2)]",
    "border",
    "[&>svg]:size-4 [&>svg]:shrink-0",
    "[&>[data-icon]]:absolute [&>[data-icon]]:left-4 [&>[data-icon]]:top-3.5",
    "[&>[data-icon]+*]:pl-7",
  ].join(" "),
  {
    variants: {
      variant: {
        info: "bg-[var(--paper-100)] text-[var(--ink-800)] border-[var(--paper-300)]",
        success: "bg-[var(--ink-50)] text-[var(--ink-800)] border-[var(--ink-200)]",
        warning: "bg-[var(--seal-50)] text-[var(--seal-600)] border-[var(--seal-100)]",
        error: "bg-[var(--seal-50)] text-[var(--seal-600)] border-[var(--seal-300)]",
      },
    },
    defaultVariants: { variant: "info" },
  }
)

export interface AlertV2Props
  extends React.ComponentProps<"div">,
    VariantProps<typeof alertV2Variants> {}

export function AlertV2({ className, variant, role = "alert", ...props }: AlertV2Props) {
  return (
    <div
      data-slot="alert-v2"
      role={role}
      className={cn(alertV2Variants({ variant }), className)}
      {...props}
    />
  )
}

export function AlertV2Title({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-v2-title"
      className={cn("font-semibold text-[14px] leading-[1.5] mb-1", className)}
      {...props}
    />
  )
}

export function AlertV2Description({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-v2-description"
      className={cn("text-[13px] leading-[1.6] opacity-90", className)}
      {...props}
    />
  )
}
