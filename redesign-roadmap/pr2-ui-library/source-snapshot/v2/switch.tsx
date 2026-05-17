/**
 * 🖌 沈翔智学 v2「墨砚」Switch
 *
 * 关闭态 paper-200，开启态 ink-600；滑块米白。
 */

"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

export function SwitchV2({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch-v2"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full",
        "border border-transparent transition-colors duration-200",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus-ink)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=unchecked]:bg-[var(--paper-300)]",
        "data-[state=checked]:bg-[var(--ink-600)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-v2-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(14,27,17,0.3)]",
          "transition-transform duration-200 ease-[var(--ease-paper-fold)]",
          "data-[state=unchecked]:translate-x-0.5",
          "data-[state=checked]:translate-x-[1.375rem]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}
