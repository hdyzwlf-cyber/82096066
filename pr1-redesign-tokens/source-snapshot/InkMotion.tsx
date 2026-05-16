/**
 * 🖌 沈翔智学 v2「墨砚」动画原语库 (InkMotion)
 *
 * 提供 4 种且仅 4 种动画语言：
 *   1. InkReveal     — 渐显纸张：opacity + blur + y
 *   2. InkStagger    — 列表逐个渗出
 *   3. InkBrush      — 毛笔笔触加载
 *   4. InkSeal       — 朱印盖章
 *
 * 设计原则：
 *   - 全部尊重 prefers-reduced-motion（命中即直接降级为静态 div）
 *   - 缓动函数统一来自 lib/design-tokens v2Easing
 *   - 不使用 framer-motion 的 repeat: Infinity
 *   - 不引入任何粒子 / 光晕 / 脉冲
 *
 * 使用：
 *   import { InkReveal, InkStagger, InkStaggerItem, InkBrush, InkSeal } from "@/components/motion/InkMotion"
 */

"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { CSSProperties, ReactNode } from "react"

// ============================================
// 缓动曲线（与 lib/design-tokens.ts v2Easing 对齐）
// ============================================

const PAPER_FOLD_EASE = [0.16, 1, 0.3, 1] as const
const SEAL_STAMP_EASE = [0.34, 1.6, 0.64, 1] as const

// ============================================
// 1. InkReveal — 渐显纸张
//    用于：入场动画 / 板块标题 / 内容卡进入视口
// ============================================

interface InkRevealProps {
  children?: ReactNode
  className?: string
  /** 入场延迟（秒） */
  delay?: number
  /** Y 轴起点偏移（px） */
  y?: number
  style?: CSSProperties
  as?: "div" | "section" | "article" | "header" | "footer" | "main"
}

export function InkReveal({
  children,
  className,
  delay = 0,
  y = 16,
  style,
  as = "div",
}: InkRevealProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    const StaticTag = as as keyof JSX.IntrinsicElements
    return (
      <StaticTag className={className} style={style}>
        {children}
      </StaticTag>
    )
  }

  const MotionTag = motion[as as "div"]

  return (
    <MotionTag
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: PAPER_FOLD_EASE }}
      className={className}
      style={style}
    >
      {children}
    </MotionTag>
  )
}

// ============================================
// 2. InkStagger — 列表逐个渗出
//    用于：能力卡列表 / 功能网格 / 推荐位
// ============================================

interface InkStaggerProps {
  children?: ReactNode
  className?: string
  /** 子元素之间的延迟（秒） */
  stagger?: number
  /** 整体起始延迟（秒） */
  delayChildren?: number
}

export function InkStagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
}: InkStaggerProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface InkStaggerItemProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function InkStaggerItem({ children, className, style }: InkStaggerItemProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.5, ease: PAPER_FOLD_EASE },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// 3. InkBrush — 毛笔笔触加载
//    用于：流式输出过程 / 等待状态 / "AI 正在思考"
// ============================================

interface InkBrushProps {
  className?: string
  /** 颜色（默认继承 currentColor） */
  color?: string
  /** 笔触粗细 */
  strokeWidth?: number
}

export function InkBrush({
  className = "h-5 w-24",
  color = "currentColor",
  strokeWidth = 2.5,
}: InkBrushProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 20"
      preserveAspectRatio="xMidYMid meet"
      role="status"
      aria-label="加载中"
    >
      <path
        d="M 5 10 Q 25 4, 50 10 T 95 10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="180"
        strokeDashoffset="180"
        fill="none"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="180"
          to="0"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  )
}

// ============================================
// 4. InkSeal — 朱印盖章
//    用于：成就章 / 已批阅标记 / 关键操作完成提示
// ============================================

interface InkSealProps {
  /** 印章文字（建议 2-4 个汉字） */
  children?: ReactNode
  /** 默认显示文字 */
  label?: string
  className?: string
  /** 印章大小 */
  size?: "sm" | "md" | "lg"
  /** 旋转角度（度） */
  rotate?: number
  /** 是否在视口入场时盖章；false 则一直显示 */
  animateOnView?: boolean
}

const SEAL_SIZE_MAP = {
  sm: "size-12 text-[12px]",
  md: "size-16 text-[14px]",
  lg: "size-20 text-[16px]",
} as const

export function InkSeal({
  children,
  label = "已批阅",
  className,
  size = "md",
  rotate = -6,
  animateOnView = true,
}: InkSealProps) {
  const shouldReduceMotion = useReducedMotion()
  const sizeClass = SEAL_SIZE_MAP[size]

  const sealStyle: CSSProperties = {
    writingMode: "vertical-rl",
    letterSpacing: "0.2em",
    fontFamily: "var(--font-display)",
    color: "var(--seal-500)",
    backgroundColor: "color-mix(in srgb, var(--seal-50) 80%, transparent)",
    borderColor: "var(--seal-500)",
    boxShadow: "0 2px 0 var(--seal-500)",
  }

  const baseClass = `inline-flex items-center justify-center rounded-sm border-2 font-bold ${sizeClass} ${className || ""}`

  if (shouldReduceMotion || !animateOnView) {
    return (
      <div
        className={baseClass}
        style={{
          ...sealStyle,
          transform: `rotate(${rotate}deg)`,
          opacity: 0.92,
        }}
      >
        {children ?? label}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.6, rotate: rotate - 6 }}
      whileInView={{ opacity: 0.92, scale: 1, rotate }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: SEAL_STAMP_EASE, delay: 0.2 }}
      className={baseClass}
      style={sealStyle}
    >
      {children ?? label}
    </motion.div>
  )
}

// ============================================
// 工具：兼容静态导出
// ============================================

export const InkMotion = {
  Reveal: InkReveal,
  Stagger: InkStagger,
  StaggerItem: InkStaggerItem,
  Brush: InkBrush,
  Seal: InkSeal,
} as const
