/**
 * 🖌 沈翔智学 v2「墨砚」Tabs
 *
 * 视觉：墨色下划线，不用胶囊背景（更克制）。
 */

"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

export const TabsV2 = TabsPrimitive.Root

export function TabsV2List({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-v2-list"
      className={cn(
        "inline-flex items-center gap-2 border-b border-[var(--paper-200)]",
        "font-[var(--font-sans-v2)]",
        className
      )}
      {...props}
    />
  )
}

export function TabsV2Trigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-v2-trigger"
      className={cn(
        "relative px-3 py-2 text-[14px] font-medium leading-none",
        "text-[var(--ink-500)] transition-colors duration-200",
        "hover:text-[var(--ink-700)]",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus-ink)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // active state — 墨色下划线
        "data-[state=active]:text-[var(--ink-800)]",
        "data-[state=active]:font-semibold",
        "after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[2px]",
        "after:bg-transparent after:transition-colors after:duration-200",
        "data-[state=active]:after:bg-[var(--ink-700)]",
        className
      )}
      {...props}
    />
  )
}

export function TabsV2Content({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-v2-content"
      className={cn("mt-4 outline-none", className)}
      {...props}
    />
  )
}
