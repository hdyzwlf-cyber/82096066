/**
 * 🖌 沈翔智学 v2「墨砚」Sheet（侧拉抽屉）
 */

"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const SheetV2 = SheetPrimitive.Root
export const SheetV2Trigger = SheetPrimitive.Trigger
export const SheetV2Close = SheetPrimitive.Close
export const SheetV2Portal = SheetPrimitive.Portal

export function SheetV2Overlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-v2-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[rgba(14,27,17,0.4)] backdrop-blur-[2px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "duration-300",
        className
      )}
      {...props}
    />
  )
}

const sheetContentVariants = cva(
  cn(
    "fixed z-50 flex flex-col gap-4 bg-[var(--paper-50)] text-[var(--ink-900)]",
    "shadow-[var(--shadow-modal)] border-[var(--paper-200)]",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "duration-400 ease-[var(--ease-paper-fold)]"
  ),
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        right:
          "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      },
    },
    defaultVariants: { side: "right" },
  }
)

export interface SheetV2ContentProps
  extends React.ComponentProps<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetContentVariants> {
  showCloseButton?: boolean
}

export function SheetV2Content({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetV2ContentProps) {
  return (
    <SheetV2Portal>
      <SheetV2Overlay />
      <SheetPrimitive.Content
        data-slot="sheet-v2-content"
        className={cn(sheetContentVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
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
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetV2Portal>
  )
}

export function SheetV2Header({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-v2-header"
      className={cn("flex flex-col gap-1.5 px-6 pt-6", className)}
      {...props}
    />
  )
}

export function SheetV2Footer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-v2-footer"
      className={cn("mt-auto flex flex-col gap-2 px-6 pb-6", className)}
      {...props}
    />
  )
}

export function SheetV2Title({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-v2-title"
      className={cn(
        "font-[var(--font-display)] text-[20px] font-bold leading-tight tracking-[-0.01em] text-[var(--ink-800)]",
        className
      )}
      {...props}
    />
  )
}

export function SheetV2Description({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-v2-description"
      className={cn(
        "font-[var(--font-sans-v2)] text-[14px] leading-[1.6] text-[var(--ink-500)]",
        className
      )}
      {...props}
    />
  )
}
