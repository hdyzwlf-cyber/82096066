/**
 * 🖌 沈翔智学 v2「墨砚」Popover
 */

"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

export const PopoverV2 = PopoverPrimitive.Root
export const PopoverV2Trigger = PopoverPrimitive.Trigger
export const PopoverV2Anchor = PopoverPrimitive.Anchor

export function PopoverV2Content({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-v2-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 p-4 outline-none",
          "rounded-[var(--radius-card)] bg-[var(--paper-50)] text-[var(--ink-900)]",
          "border border-[var(--paper-200)] shadow-[var(--shadow-elevated)]",
          "font-[var(--font-sans-v2)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
