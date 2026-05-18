/**
 * 🖌 v2 图标 · 第 3 组：操作工具栏（8 个）
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

/** 复制 — 两张重叠纸 */
export function IconCopy(props: InkIconProps) {
  return wrap(props, <>
    <rect x="8" y="8" width="12" height="12" rx="1" />
    <path d="M16 4H5a1 1 0 0 0-1 1v11" />
  </>)
}

/** 导出 PDF — 纸 + 下箭头 */
export function IconExportPdf(props: InkIconProps) {
  return wrap(props, <>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M15 3v4h4" />
    <path d="M12 11v6M9 14l3 3 3-3" strokeWidth={1.8} />
  </>)
}

/** 分享 — 三个节点 */
export function IconShare(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="M8.5 13.2l7 4.3M15.5 6.8l-7 4.3" />
  </>)
}

/** 朗读 TTS — 嘴 + 声波 */
export function IconListen(props: InkIconProps) {
  return wrap(props, <>
    <path d="M3 10v4a2 2 0 0 0 2 2h2l4 4V6L7 10H5a2 2 0 0 0-2 0z" />
    <path d="M14 8c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4" />
    <path d="M16 5c3 2 4.5 4.5 4.5 7s-1.5 5-4.5 7" opacity={0.5} />
  </>)
}

/** 继续追问 — 气泡 + 加号 */
export function IconFollowup(props: InkIconProps) {
  return wrap(props, <>
    <path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-3 3v-3H5a1 1 0 0 1-1-1V6z" />
    <path d="M12 8v5M9.5 10.5h5" strokeWidth={1.8} />
  </>)
}

/** 上传文件 — 向上箭头 + 托盘线 */
export function IconUpload(props: InkIconProps) {
  return wrap(props, <>
    <path d="M12 15V3M8 7l4-4 4 4" strokeWidth={1.8} />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </>)
}

/** 录音 — 麦克风 */
export function IconMic(props: InkIconProps) {
  return wrap(props, <>
    <rect x="9" y="2" width="6" height="10" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <path d="M12 17v4M9 21h6" />
  </>)
}

/** 发送 — 毛笔一划 */
export function IconSend(props: InkIconProps) {
  return wrap(props, <>
    <path d="M4 18L20 6" strokeWidth={2.5} />
    <path d="M14 5l6 1-1 6" strokeWidth={1.5} />
    <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
  </>)
}
