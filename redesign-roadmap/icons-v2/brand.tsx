/**
 * 🖌 v2 图标 · 第 5 组：品牌 / 装饰（4 个）
 */

import type { InkIconProps } from "./types"

function wrap(props: InkIconProps, children: React.ReactNode) {
  const { size = 24, className, ...rest } = props
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

/** 品牌标记（砚台） */
export function IconLogoMark(props: InkIconProps) {
  return wrap(props, <>
    <ellipse cx="12" cy="14" rx="8" ry="5" />
    <path d="M4 14V10c0-3.3 3.6-6 8-6s8 2.7 8 6v4" />
    <ellipse cx="12" cy="10" rx="3" ry="1.5" fill="currentColor" opacity={0.3} />
  </>)
}

/** 加载毛笔横扫 — 作为静态 SVG（动画由 CSS / InkBrush 处理） */
export function IconBrushLoading(props: InkIconProps) {
  return wrap(props, <>
    <path d="M3 12Q8 8 12 12T21 12" strokeWidth={2.5} />
    <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
  </>)
}

/** 翻页 — 纸张右下角翻起 */
export function IconPaperFold(props: InkIconProps) {
  return wrap(props, <>
    <path d="M4 3h16a1 1 0 0 1 1 1v13l-5 5H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M16 17v5l5-5h-5" fill="currentColor" opacity={0.15} />
    <path d="M16 17v5l5-5h-5" />
  </>)
}

/** 水印文字 — "沈翔"竖排（极小装饰用） */
export function IconWatermark(props: InkIconProps) {
  const { size = 24, className, ...rest } = props
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" {...rest}>
      <text x="12" y="8" textAnchor="middle" fontSize="6" fontFamily="var(--font-display)" fill="currentColor" opacity="0.25" writingMode="vertical-rl">
        沈翔智学
      </text>
    </svg>
  )
}
