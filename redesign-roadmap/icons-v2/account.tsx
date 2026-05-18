/**
 * 🖌 v2 图标 · 第 6 组：用户 / 账户（4 个）
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

/** 用户头像占位 — 简笔人形 */
export function IconUser(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.5 3-6 8-6s8 2.5 8 6" />
  </>)
}

/** 会员 — 玉佩造型 */
export function IconMember(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="10" r="6" />
    <circle cx="12" cy="10" r="2.5" />
    <path d="M12 4V2" strokeWidth={2} />
    <path d="M9 18l-1 4M15 18l1 4" />
    <path d="M8 20h8" />
  </>)
}

/** 退出 — 门 + 箭头 */
export function IconLogout(props: InkIconProps) {
  return wrap(props, <>
    <path d="M9 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>)
}

/** 设置 — 砚台盖（圆 + 凸起把手） */
export function IconSettings(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="13" r="8" />
    <circle cx="12" cy="13" r="3" />
    <path d="M12 5V3" strokeWidth={2} />
    <path d="M5.5 8L4 6.5M18.5 8L20 6.5" />
    <path d="M4 13H2M22 13h-2" />
    <path d="M5.5 18L4 19.5M18.5 18L20 19.5" />
  </>)
}
