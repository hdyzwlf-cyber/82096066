/**
 * 🖌 沈翔智学 v2「墨砚」Avatar
 */

"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

export function AvatarV2({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar-v2"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        "bg-[var(--paper-100)] border border-[var(--paper-200)]",
        className
      )}
      {...props}
    />
  )
}

export function AvatarV2Image({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-v2-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

export function AvatarV2Fallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-v2-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full",
        "bg-[var(--paper-100)] text-[var(--ink-700)]",
        "font-[var(--font-sans-v2)] text-[13px] font-semibold",
        className
      )}
      {...props}
    />
  )
}
