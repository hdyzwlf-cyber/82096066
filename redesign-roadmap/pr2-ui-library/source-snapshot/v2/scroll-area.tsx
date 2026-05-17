/**
 * 🖌 沈翔智学 v2「墨砚」ScrollArea
 */

"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

export function ScrollAreaV2({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area-v2"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-v2-viewport"
        className="size-full rounded-[inherit] outline-none focus-visible:[box-shadow:var(--shadow-focus-ink)]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBarV2 />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

export function ScrollBarV2({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-v2-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-1.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" && "h-1.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-v2-thumb"
        className="relative flex-1 rounded-full bg-[var(--paper-300)] hover:bg-[var(--ink-300)] transition-colors"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}
