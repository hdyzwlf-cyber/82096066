/**
 * 🖌 沈翔智学 v2「墨砚」Dialog
 *
 * 视觉灵感：笔记本翻开（radius-card 12px）
 *   - radial 米白底
 *   - shadow-modal 重叠墨色阴影
 *   - 入场用 InkMotion paper-fold（rotateY 微转）
 *   - 关闭按钮 ghost icon-sm
 */

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const DialogV2 = DialogPrimitive.Root
export const DialogV2Trigger = DialogPrimitive.Trigger
export const DialogV2Portal = DialogPrimitive.Portal
export const DialogV2Close = DialogPrimitive.Close

export function DialogV2Overlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-v2-overlay"
      className={cn(
        "fixed inset-0 z-50",
        "bg-[rgba(14,27,17,0.4)] backdrop-blur-[2px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "duration-300 ease-[var(--ease-paper-fold)]",
        className
      )}
      {...props}
    />
  )
}

export function DialogV2Content({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogV2Portal>
      <DialogV2Overlay />
      <DialogPrimitive.Content
        data-slot="dialog-v2-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-[calc(100%-2rem)] max-w-lg",
          "bg-[var(--paper-50)] text-[var(--ink-900)]",
          "rounded-[var(--radius-card)] shadow-[var(--shadow-modal)]",
          "p-6 grid gap-4",
          "border border-[var(--paper-200)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "duration-300 ease-[var(--ease-paper-fold)]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center",
              "rounded-full text-[var(--ink-500)]",
              "transition-colors duration-200",
              "hover:bg-[var(--paper-200)] hover:text-[var(--ink-800)]",
              "focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus-ink)]"
            )}
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">关闭</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogV2Portal>
  )
}

export function DialogV2Header({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-v2-header"
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
}

export function DialogV2Footer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-v2-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-2",
        className
      )}
      {...props}
    />
  )
}

export function DialogV2Title({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-v2-title"
      className={cn(
        "font-[var(--font-display)] text-[20px] font-bold leading-tight tracking-[-0.01em] text-[var(--ink-800)]",
        className
      )}
      {...props}
    />
  )
}

export function DialogV2Description({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-v2-description"
      className={cn(
        "font-[var(--font-sans-v2)] text-[14px] leading-[1.6] text-[var(--ink-500)]",
        className
      )}
      {...props}
    />
  )
}
