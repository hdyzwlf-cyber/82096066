/**
 * 🖌 v2 图标 · 第 1 组：导航侧栏（10 个）
 */

import type { InkIconProps } from "./types"

function wrap(props: InkIconProps, children: React.ReactNode) {
  const { size = 24, className, ...rest } = props
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** 对话 — 两张重叠纸片 + 右上笔尖 */
export function IconChat(props: InkIconProps) {
  return wrap(props, <>
    <path d="M4 6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-3 3v-3H5a1 1 0 0 1-1-1V6z" />
    <path d="M8 5V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1" />
    <path d="M18 4l1.5-1.5" strokeWidth={2} />
  </>)
}

/** 拍卷诊断 — 试卷 + 放大镜 */
export function IconDiagnosis(props: InkIconProps) {
  return wrap(props, <>
    <rect x="4" y="3" width="12" height="16" rx="1" />
    <path d="M7 7h6M7 10h4M7 13h3" />
    <circle cx="17" cy="17" r="3.5" />
    <path d="M19.5 19.5L22 22" strokeWidth={2} />
  </>)
}

/** 闪卡复习 — 两张卡重叠 + 翻转箭头 */
export function IconFlashcard(props: InkIconProps) {
  return wrap(props, <>
    <rect x="3" y="5" width="14" height="10" rx="1" />
    <rect x="7" y="9" width="14" height="10" rx="1" />
    <path d="M17 5c2 0 3 1 3 2" />
    <path d="M19 5l1 2" />
  </>)
}

/** 互动实验室 — 烧瓶 */
export function IconLab(props: InkIconProps) {
  return wrap(props, <>
    <path d="M9 3h6M10 3v6l-4 8a1 1 0 0 0 .9 1.4h10.2a1 1 0 0 0 .9-1.4l-4-8V3" />
    <path d="M8 15h8" strokeWidth={1} opacity={0.5} />
  </>)
}

/** 学习看板 — 田字格仪表盘 */
export function IconDashboard(props: InkIconProps) {
  return wrap(props, <>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="4" rx="1" />
    <rect x="13" y="9" width="8" height="12" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
  </>)
}

/** 历史记录 — 时钟 + 逆时针箭头 */
export function IconHistory(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
    <path d="M4.5 7.5L3 5" />
    <path d="M3 9l1.5-1.5" />
  </>)
}

/** 资料夹 — 文件夹 */
export function IconFolder(props: InkIconProps) {
  return wrap(props, <>
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />
    <path d="M8 13h8" opacity={0.5} />
  </>)
}

/** 积分 — 古铜钱（方孔圆钱） */
export function IconCredits(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="12" r="9" />
    <rect x="10" y="10" width="4" height="4" rx="0.5" />
  </>)
}

/** 创作广场 — 四人围圆 + 中心星 */
export function IconExplore(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <path d="M12 9l1 2h2l-1.5 1.5.5 2L12 13.5l-2 1 .5-2L9 11h2l1-2z" fill="currentColor" stroke="none" />
  </>)
}

/** 邀请好友 — 信封 + 小人 */
export function IconInvite(props: InkIconProps) {
  return wrap(props, <>
    <rect x="3" y="6" width="14" height="12" rx="1" />
    <path d="M3 6l7 5 7-5" />
    <circle cx="19" cy="7" r="2.5" />
    <path d="M16.5 14c0-1.5 1.2-2.5 2.5-2.5s2.5 1 2.5 2.5" />
  </>)
}
