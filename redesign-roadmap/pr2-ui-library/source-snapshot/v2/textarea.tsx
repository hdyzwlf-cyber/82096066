/**
 * 🖌 沈翔智学 v2「墨砚」Textarea
 * 视觉同 InputV2，支持 field-sizing-content 自适应高度
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaV2Props extends React.ComponentProps<"textarea"> {
  invalid?: boolean
}

export function TextareaV2({ className, invalid, ...props }: TextareaV2Props) {
  return (
    <textarea
      data-slot="textarea-v2"
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-24 w-full rounded-[var(--radius-soft)] px-3 py-2",
        "font-[var(--font-sans-v2)] text-[15px] text-[var(--ink-900)] leading-[1.7]",
        "bg-[var(--paper-100)] border border-[var(--paper-300)]",
        "placeholder:text-[var(--ink-400)]",
        "outline-none transition-[border-color,background-color,box-shadow] duration-200",
        "field-sizing-content",
        "hover:border-[var(--ink-300)]",
        "focus-visible:bg-white focus-visible:border-[var(--ink-600)] focus-visible:[box-shadow:var(--shadow-focus-ink)]",
        "aria-[invalid=true]:border-[var(--seal-500)] aria-[invalid=true]:[box-shadow:0_0_0_3px_var(--seal-100)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        className
      )}
      {...props}
    />
  )
}
