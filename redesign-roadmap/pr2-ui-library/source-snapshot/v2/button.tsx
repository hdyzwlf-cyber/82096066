/**
 * 🖌 沈翔智学 v2「墨砚」Button
 *
 * 五种且仅五种 variant（详见 docs/REDESIGN.md）：
 *   - primary  墨绿底 + 米白字（每页最多 1 个）
 *   - seal     朱印红底 + 米白字（关键操作）
 *   - outline  米白底 + 墨绿边
 *   - ghost    透明底 + 墨绿字（工具栏）
 *   - link     文字链接
 *
 * 三种且仅三种 size：sm / default / lg
 *
 * 按下交互：
 *   - 不使用 active:scale-95（取消传统 SaaS 弹性）
 *   - primary / seal: translateY(1px) + 阴影内陷 = 印章按下感
 *   - outline / ghost: 仅微调底色
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonV2Variants = cva(
  [
    // 基础排版
    "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
    "font-[var(--font-sans-v2)] font-semibold leading-none tracking-normal",
    // 交互
    "select-none cursor-pointer",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus-ink)]",
    // 禁用
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    // 图标
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // 主 CTA — 墨绿底 + 米白字（每页最多 1 个）
        primary: [
          "rounded-[var(--radius-pill)]",
          "bg-[var(--ink-600)] text-white",
          "border border-[var(--ink-700)]/30",
          "shadow-[0_1px_0_var(--ink-700)]",
          "hover:bg-[var(--ink-700)]",
          "active:translate-y-[1px] active:shadow-[inset_0_1px_2px_rgba(14,27,17,0.3)]",
        ].join(" "),

        // 朱印 — 关键操作（支付 / 下载 / 分享）
        seal: [
          "rounded-[var(--radius-pill)]",
          "bg-[var(--seal-500)] text-white",
          "border border-[var(--seal-600)]/40",
          "shadow-[0_1px_0_var(--seal-600)]",
          "hover:bg-[var(--seal-600)]",
          "active:translate-y-[1px] active:shadow-[inset_0_1px_2px_rgba(142,45,34,0.45)]",
        ].join(" "),

        // 次要操作 — 米白底 + 墨绿边
        outline: [
          "rounded-[var(--radius-pill)]",
          "bg-[var(--paper-50)] text-[var(--ink-700)]",
          "border border-[var(--ink-300)]/60",
          "hover:bg-[var(--paper-100)] hover:border-[var(--ink-500)]",
          "active:translate-y-[1px]",
        ].join(" "),

        // 工具栏 — 透明底 + 墨绿字
        ghost: [
          "rounded-[var(--radius-pill)]",
          "bg-transparent text-[var(--ink-600)]",
          "border border-transparent",
          "hover:bg-[var(--ink-50)]",
          "active:bg-[var(--ink-100)]",
        ].join(" "),

        // 文字链接
        link: [
          "rounded-none",
          "bg-transparent text-[var(--ink-600)]",
          "underline-offset-[3px] decoration-[var(--ink-300)]",
          "hover:underline hover:text-[var(--ink-700)] hover:decoration-[var(--ink-600)]",
          "px-0 py-0",
        ].join(" "),
      },
      size: {
        sm: "h-9 px-3 text-[13px] gap-1.5",
        default: "h-10 px-4 text-[14px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 p-0 [&_svg]:size-5",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 p-0 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
    compoundVariants: [
      // link 变体不应用 size 的 padding
      { variant: "link", size: "sm", class: "h-auto px-0 py-0" },
      { variant: "link", size: "default", class: "h-auto px-0 py-0" },
      { variant: "link", size: "lg", class: "h-auto px-0 py-0" },
    ],
  }
)

export interface ButtonV2Props
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonV2Variants> {
  asChild?: boolean
}

export function ButtonV2({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonV2Props) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button-v2"
      data-variant={variant ?? "primary"}
      type={asChild ? undefined : type ?? "button"}
      className={cn(buttonV2Variants({ variant, size }), className)}
      {...props}
    />
  )
}

export { buttonV2Variants }
