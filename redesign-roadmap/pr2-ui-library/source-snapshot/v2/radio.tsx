/**
 * 🖌 沈翔智学 v2「墨砚」Radio Group
 */

"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

export function RadioGroupV2({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group-v2"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

export function RadioGroupV2Item({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-v2-item"
      className={cn(
        "relative aspect-square size-4 shrink-0",
        "rounded-full border-2 border-[var(--ink-300)] bg-[var(--paper-50)]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus-ink)]",
        "data-[state=checked]:border-[var(--seal-500)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="flex items-center justify-center"
        data-slot="radio-group-v2-indicator"
      >
        <span className="block size-2 rounded-full bg-[var(--seal-500)]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
