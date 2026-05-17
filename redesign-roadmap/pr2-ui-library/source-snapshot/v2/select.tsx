/**
 * 🖌 沈翔智学 v2「墨砚」Select
 */

"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export const SelectV2 = SelectPrimitive.Root
export const SelectV2Group = SelectPrimitive.Group
export const SelectV2Value = SelectPrimitive.Value

export function SelectV2Trigger({
  className,
  children,
  size = "default",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default" | "lg"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-v2-trigger"
      className={cn(
        "flex w-full items-center justify-between gap-2",
        "rounded-[var(--radius-soft)] px-3",
        "font-[var(--font-sans-v2)] text-[15px] text-[var(--ink-900)]",
        "bg-[var(--paper-100)] border border-[var(--paper-300)]",
        "outline-none transition-[border-color,background-color,box-shadow] duration-200",
        "hover:border-[var(--ink-300)]",
        "focus-visible:bg-white focus-visible:border-[var(--ink-600)] focus-visible:[box-shadow:var(--shadow-focus-ink)]",
        "data-[placeholder]:text-[var(--ink-400)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-9 text-[14px]",
        size === "default" && "h-10",
        size === "lg" && "h-12",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 text-[var(--ink-500)]" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectV2Content({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-v2-content"
        position={position}
        className={cn(
          "relative z-50 max-h-[--radix-select-content-available-height]",
          "min-w-[8rem] overflow-hidden",
          "rounded-[var(--radius-card)] bg-[var(--paper-50)] text-[var(--ink-900)]",
          "border border-[var(--paper-200)] shadow-[var(--shadow-elevated)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-[var(--ink-500)]">
          <ChevronUp className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[--radix-select-trigger-height] w-full min-w-[--radix-select-trigger-width]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-[var(--ink-500)]">
          <ChevronDown className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectV2Item({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-v2-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2",
        "rounded-[var(--radius-soft)] px-2.5 py-2",
        "font-[var(--font-sans-v2)] text-[14px] text-[var(--ink-800)] leading-none",
        "outline-none transition-colors duration-150",
        "data-[highlighted]:bg-[var(--ink-50)] data-[highlighted]:text-[var(--ink-900)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="ml-auto flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-[var(--ink-700)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

export function SelectV2Label({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-v2-label"
      className={cn(
        "px-2.5 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-500)]",
        className
      )}
      {...props}
    />
  )
}

export function SelectV2Separator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-v2-separator"
      className={cn("-mx-1 my-1 h-px bg-[var(--paper-200)]", className)}
      {...props}
    />
  )
}
