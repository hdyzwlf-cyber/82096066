/**
 * 🖌 沈翔智学 v2「墨砚」Separator
 *
 * 三种风格：
 *   - default 普通分隔线（paper-200）
 *   - ink     墨色实线（重点分隔）
 *   - dashed  虚线（柔和分组）
 */

"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const separatorVariants = cva("shrink-0", {
  variants: {
    variant: {
      default: "bg-[var(--paper-200)]",
      ink: "bg-[var(--ink-300)]",
      dashed: "bg-transparent border-dashed border-[var(--paper-300)]",
    },
  },
  defaultVariants: { variant: "default" },
})

export interface SeparatorV2Props
  extends React.ComponentProps<typeof SeparatorPrimitive.Root>,
    VariantProps<typeof separatorVariants> {}

export function SeparatorV2({
  className,
  variant,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorV2Props) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-v2"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        separatorVariants({ variant }),
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        variant === "dashed" &&
          (orientation === "horizontal" ? "border-t" : "border-l"),
        className
      )}
      {...props}
    />
  )
}
