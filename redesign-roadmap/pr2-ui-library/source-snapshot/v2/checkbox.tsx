/**
 * 🖌 沈翔智学 v2「墨砚」Checkbox
 *
 * 视觉：朱印红勾（关键确认场景） / 墨绿勾（普通场景）
 */

"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export function CheckboxV2({
  className,
  variant = "ink",
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  variant?: "ink" | "seal"
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox-v2"
      className={cn(
        "peer size-4 shrink-0 rounded-[var(--radius-sharp)]",
        "border-2 border-[var(--ink-300)] bg-[var(--paper-50)]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus-ink)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "ink" &&
          "data-[state=checked]:border-[var(--ink-700)] data-[state=checked]:bg-[var(--ink-700)] data-[state=checked]:text-white",
        variant === "seal" &&
          "data-[state=checked]:border-[var(--seal-500)] data-[state=checked]:bg-[var(--seal-500)] data-[state=checked]:text-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-v2-indicator"
        className="flex items-center justify-center text-current"
      >
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" />
        ) : (
          <Check className="size-3" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
