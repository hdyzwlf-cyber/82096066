/**
 * 🖌 沈翔智学 v2「墨砚」Tooltip
 */

"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

export const TooltipV2Provider = TooltipPrimitive.Provider
export const TooltipV2 = TooltipPrimitive.Root
export const TooltipV2Trigger = TooltipPrimitive.Trigger

export function TooltipV2Content({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-v2-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-[var(--radius-soft)] px-3 py-1.5",
          "bg-[var(--ink-900)] text-[var(--paper-50)]",
          "font-[var(--font-sans-v2)] text-[12px] font-medium leading-[1.5]",
          "shadow-[var(--shadow-elevated)]",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
