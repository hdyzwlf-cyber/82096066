/**
 * 🖌 沈翔智学 v2「墨砚」DropdownMenu
 */

"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export const DropdownMenuV2 = DropdownMenuPrimitive.Root
export const DropdownMenuV2Trigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuV2Group = DropdownMenuPrimitive.Group
export const DropdownMenuV2Portal = DropdownMenuPrimitive.Portal
export const DropdownMenuV2Sub = DropdownMenuPrimitive.Sub
export const DropdownMenuV2RadioGroup = DropdownMenuPrimitive.RadioGroup

export function DropdownMenuV2Content({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-v2-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden p-1",
          "rounded-[var(--radius-card)] bg-[var(--paper-50)] text-[var(--ink-900)]",
          "border border-[var(--paper-200)] shadow-[var(--shadow-elevated)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuV2Item({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-v2-item"
      data-variant={variant}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2",
        "rounded-[var(--radius-soft)] px-2.5 py-2",
        "font-[var(--font-sans-v2)] text-[14px] leading-none",
        "outline-none transition-colors duration-150",
        variant === "default" && "text-[var(--ink-800)]",
        variant === "destructive" && "text-[var(--seal-600)]",
        "data-[highlighted]:bg-[var(--ink-50)] data-[highlighted]:text-[var(--ink-900)]",
        "data-[variant=destructive]:data-[highlighted]:bg-[var(--seal-50)] data-[variant=destructive]:data-[highlighted]:text-[var(--seal-600)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuV2CheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-v2-checkbox-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2",
        "rounded-[var(--radius-soft)] py-2 pl-8 pr-2",
        "font-[var(--font-sans-v2)] text-[14px] text-[var(--ink-800)] leading-none",
        "outline-none transition-colors duration-150",
        "data-[highlighted]:bg-[var(--ink-50)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="size-3.5 text-[var(--ink-700)]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export function DropdownMenuV2RadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-v2-radio-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2",
        "rounded-[var(--radius-soft)] py-2 pl-8 pr-2",
        "font-[var(--font-sans-v2)] text-[14px] text-[var(--ink-800)] leading-none",
        "outline-none transition-colors duration-150",
        "data-[highlighted]:bg-[var(--ink-50)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="size-2 fill-[var(--seal-500)] text-[var(--seal-500)]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

export function DropdownMenuV2Label({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-v2-label"
      className={cn(
        "px-2.5 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-500)]",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuV2Separator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-v2-separator"
      className={cn("my-1 h-px bg-[var(--paper-200)]", className)}
      {...props}
    />
  )
}

export function DropdownMenuV2Shortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-v2-shortcut"
      className={cn(
        "ml-auto text-[12px] tracking-wide text-[var(--ink-400)] font-[var(--font-mono-v2)]",
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuV2SubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-v2-sub-trigger"
      className={cn(
        "flex cursor-default select-none items-center gap-2",
        "rounded-[var(--radius-soft)] px-2.5 py-2",
        "font-[var(--font-sans-v2)] text-[14px] text-[var(--ink-800)]",
        "outline-none transition-colors duration-150",
        "data-[highlighted]:bg-[var(--ink-50)]",
        "data-[state=open]:bg-[var(--ink-50)]",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-4 text-[var(--ink-500)]" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

export function DropdownMenuV2SubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-v2-sub-content"
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden p-1",
        "rounded-[var(--radius-card)] bg-[var(--paper-50)] text-[var(--ink-900)]",
        "border border-[var(--paper-200)] shadow-[var(--shadow-elevated)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}
