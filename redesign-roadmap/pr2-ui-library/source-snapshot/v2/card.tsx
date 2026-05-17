/**
 * 🖌 沈翔智学 v2「墨砚」Card
 *
 * 三种且仅三种 variant：
 *   - paper    内容、产物、报告（米白 + 1px 墨边 + shadow-paper + radius-sharp）
 *   - elevated 模态、抽屉、悬浮卡（无边框 + shadow-elevated + radius-card）
 *   - inset    表单组、信息盒（paper-100 底 + 无阴影 + radius-soft）
 *
 * 子组件保持 shadcn Card 同款 API：
 *   <CardV2><CardHeader><CardTitle/><CardDescription/></CardHeader>
 *     <CardContent/><CardFooter/></CardV2>
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardV2Variants = cva(
  [
    "flex flex-col bg-[var(--paper-50)] text-[var(--ink-900)]",
    "transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-paper-fold)]",
  ].join(" "),
  {
    variants: {
      variant: {
        paper: [
          "rounded-[var(--radius-sharp)]",
          "border border-[var(--paper-200)]",
          "shadow-[var(--shadow-paper)]",
        ].join(" "),
        elevated: [
          "rounded-[var(--radius-card)]",
          "border-0",
          "shadow-[var(--shadow-elevated)]",
        ].join(" "),
        inset: [
          "rounded-[var(--radius-soft)]",
          "border border-[var(--paper-200)]/60",
          "bg-[var(--paper-100)]",
          "shadow-none",
        ].join(" "),
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:border-[var(--ink-300)]",
          "hover:shadow-[var(--shadow-elevated)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        false: "",
      },
    },
    defaultVariants: {
      variant: "paper",
      interactive: false,
    },
  }
)

export interface CardV2Props
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardV2Variants> {}

export function CardV2({ className, variant, interactive, ...props }: CardV2Props) {
  return (
    <div
      data-slot="card-v2"
      data-variant={variant ?? "paper"}
      className={cn(cardV2Variants({ variant, interactive }), className)}
      {...props}
    />
  )
}

export function CardV2Header({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-v2-header"
      className={cn(
        "flex flex-col gap-2 px-5 pt-5 sm:px-6 sm:pt-6 [.has-action_&]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

export function CardV2Title({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-v2-title"
      className={cn(
        "font-[var(--font-display)] text-[20px] font-bold leading-tight tracking-[-0.01em] text-[var(--ink-800)]",
        className
      )}
      {...props}
    />
  )
}

export function CardV2Description({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-v2-description"
      className={cn(
        "font-[var(--font-sans-v2)] text-[14px] leading-[1.6] text-[var(--ink-500)]",
        className
      )}
      {...props}
    />
  )
}

export function CardV2Content({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-v2-content"
      className={cn("px-5 py-4 sm:px-6 sm:py-5 flex-1", className)}
      {...props}
    />
  )
}

export function CardV2Footer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-v2-footer"
      className={cn(
        "flex items-center gap-3 px-5 pb-5 pt-2 sm:px-6 sm:pb-6 [.with-divider_&]:border-t [.with-divider_&]:border-[var(--paper-200)] [.with-divider_&]:pt-4",
        className
      )}
      {...props}
    />
  )
}

export { cardV2Variants }
