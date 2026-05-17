/**
 * 🖌 沈翔智学 v2「墨砚」Input
 *
 * 视觉灵感：学生考卷答题框
 *   - radius-soft (4px)
 *   - paper-100 底色
 *   - focus 时墨绿描边 + shadow-focus-ink 光晕
 *   - error 状态用朱印红墨点
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputV2Props extends React.ComponentProps<"input"> {
  /** 设为 true 时显示 invalid 视觉（朱印红边） */
  invalid?: boolean
}

export function InputV2({ className, type, invalid, ...props }: InputV2Props) {
  return (
    <input
      type={type}
      data-slot="input-v2"
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full min-w-0 rounded-[var(--radius-soft)] px-3 py-2",
        "font-[var(--font-sans-v2)] text-[15px] text-[var(--ink-900)] leading-normal",
        "bg-[var(--paper-100)] border border-[var(--paper-300)]",
        "placeholder:text-[var(--ink-400)]",
        "selection:bg-[var(--ink-200)] selection:text-[var(--ink-900)]",
        "outline-none transition-[border-color,background-color,box-shadow] duration-200",
        "hover:border-[var(--ink-300)]",
        "focus-visible:bg-white focus-visible:border-[var(--ink-600)] focus-visible:[box-shadow:var(--shadow-focus-ink)]",
        "aria-[invalid=true]:border-[var(--seal-500)] aria-[invalid=true]:[box-shadow:0_0_0_3px_var(--seal-100)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // 文件输入框继承字体
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--ink-700)]",
        className
      )}
      {...props}
    />
  )
}
