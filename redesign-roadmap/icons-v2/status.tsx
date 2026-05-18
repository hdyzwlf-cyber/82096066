/**
 * 🖌 v2 图标 · 第 4 组：状态 / 反馈（6 个）
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

/** 已批阅印章 — 方印 + 勾 */
export function IconSealCheck(props: InkIconProps) {
  return wrap(props, <>
    <rect x="3" y="3" width="18" height="18" rx="1" fill="currentColor" opacity={0.12} />
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M8 12.5l3 3 5.5-6.5" strokeWidth={2} />
  </>)
}

/** 成就 / 精选 — 方印 + 星 */
export function IconSealStar(props: InkIconProps) {
  return wrap(props, <>
    <rect x="3" y="3" width="18" height="18" rx="1" fill="currentColor" opacity={0.12} />
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M12 7l1.5 3h3l-2.5 2 1 3L12 13.5 9 15l1-3-2.5-2h3L12 7z" fill="currentColor" stroke="none" />
  </>)
}

/** 错误 / 警告 — 墨点 */
export function IconInkDot(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="12" r="7" fill="currentColor" opacity={0.15} />
    <circle cx="12" cy="12" r="7" />
    <path d="M12 8v4" strokeWidth={2} />
    <circle cx="12" cy="15" r="0.5" fill="currentColor" stroke="none" />
  </>)
}

/** 连续学习 — 竹节 */
export function IconStreak(props: InkIconProps) {
  return wrap(props, <>
    <path d="M12 2v20" strokeWidth={2} />
    <path d="M9 6h6M9 10h6M9 14h6M9 18h6" strokeWidth={1} />
    <path d="M8 4c2 1 3 2 4 2s2-1 4-2" />
    <path d="M8 20c2-1 3-2 4-2s2 1 4 2" />
  </>)
}

/** 进度 — 圆环 */
export function IconProgress(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="12" r="9" strokeWidth={1} opacity={0.3} />
    <path d="M12 3a9 9 0 0 1 9 9" strokeWidth={2.5} />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </>)
}

/** 空态 — 卷轴 */
export function IconEmpty(props: InkIconProps) {
  return wrap(props, <>
    <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <ellipse cx="6" cy="4" rx="2" ry="1.5" />
    <ellipse cx="6" cy="20" rx="2" ry="1.5" />
    <ellipse cx="18" cy="4" rx="2" ry="1.5" />
    <ellipse cx="18" cy="20" rx="2" ry="1.5" />
    <path d="M9 10h6M9 13h4" opacity={0.4} />
  </>)
}
