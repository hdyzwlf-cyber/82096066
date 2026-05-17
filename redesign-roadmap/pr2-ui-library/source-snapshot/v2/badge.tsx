/**
 * 🖌 沈翔智学 v2「墨砚」Badge
 *
 * 4 种 variant：
 *   - ink   主标签（墨绿）
 *   - paper 中性标签（米色）
 *   - seal  朱印标签（强调 / 价格 / 时间敏感）
 *   - ghost 轻量标签（描边）
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeV2Variants = cva(
  [
    "inline-flex items-center justify-center gap-1 w-fit shrink-0 whitespace-nowrap",
    "px-2 py-0.5 rounded-[var(--radius-pill)]",
    "font-[var(--font-sans-v2)] text-[12px] font-semibold leading-[1.5]",
    "transition-colors duration-200",
    "[&>svg]:size-3 [&>svg]:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        ink: "bg-[var(--ink-100)] text-[var(--ink-700)] border border-[var(--ink-200)]",
        paper: "bg-[var(--paper-100)] text-[var(--ink-700)] border border-[var(--paper-300)]",
        seal: "bg-[var(--seal-50)] text-[var(--seal-600)] border border-[var(--seal-100)]",
        ghost: "bg-transparent text-[var(--ink-600)] border border-[var(--ink-300)]",
      },
    },
    defaultVariants: { variant: "ink" },
  }
)

export interface BadgeV2Props
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeV2Variants> {
  asChild?: boolean
}

export function BadgeV2({ className, variant, asChild = false, ...props }: BadgeV2Props) {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge-v2"
      className={cn(badgeV2Variants({ variant }), className)}
      {...props}
    />
  )
}

export { badgeV2Variants }
