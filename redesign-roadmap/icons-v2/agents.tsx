/**
 * 🖌 v2 图标 · 第 2 组：智能体图标（12 个）
 * 不含 ChatGPT / Gemini / Suno / Claude / Grok 官方 logo
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

/** 作文批改 — 纸页 + 朱红批注线 */
export function IconEssay(props: InkIconProps) {
  return wrap(props, <>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M15 3v4h4" />
    <path d="M8 10h7" stroke="var(--seal-500,#B23A2C)" strokeWidth={1.2} />
    <path d="M8 13h5" stroke="var(--seal-500,#B23A2C)" strokeWidth={1.2} />
    <path d="M8 16h3" stroke="var(--seal-500,#B23A2C)" strokeWidth={1.2} opacity={0.6} />
  </>)
}

/** 写作类通用 — 钢笔笔尖 + 书写轨迹 */
export function IconWriting(props: InkIconProps) {
  return wrap(props, <>
    <path d="M16 3l5 5-11 11H5v-5L16 3z" />
    <path d="M14 5l5 5" />
    <path d="M5 19h14" opacity={0.4} />
  </>)
}

/** 全学段数学 — 尺规组合 */
export function IconMath(props: InkIconProps) {
  return wrap(props, <>
    <path d="M3 21L12 3l9 18H3z" />
    <path d="M7.5 15h9" />
    <circle cx="18" cy="8" r="4" strokeDasharray="2 2" />
  </>)
}

/** 全学段英语 — A + a 叠加 */
export function IconEnglish(props: InkIconProps) {
  return wrap(props, <>
    <path d="M5 18L9 6h2l4 12" strokeWidth={2} />
    <path d="M7 14h6" />
    <circle cx="18" cy="15" r="3" />
    <path d="M21 12v6" />
  </>)
}

/** 词境记忆卡 — 卡片 + 首字母 */
export function IconVocab(props: InkIconProps) {
  return wrap(props, <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 9h6M12 9v7" strokeWidth={2} />
    <path d="M9 16h6" strokeWidth={1} opacity={0.4} />
  </>)
}

/** 题目解析 — 问号 + 灯泡 */
export function IconProblem(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="12" cy="11" r="7" />
    <path d="M10 9c0-1.5 1-2.5 2-2.5s2 1 2 2.5c0 1-1 1.5-2 2v1" strokeWidth={1.8} />
    <circle cx="12" cy="14.5" r="0.5" fill="currentColor" />
    <path d="M10 20h4M11 20v2M13 20v2" />
  </>)
}

/** OpenClaw — 幻灯片框 + 播放 */
export function IconOpenClaw(props: InkIconProps) {
  return wrap(props, <>
    <rect x="3" y="4" width="18" height="14" rx="1" />
    <path d="M10 9v6l5-3-5-3z" fill="currentColor" stroke="none" />
    <path d="M8 21h8" />
    <path d="M12 18v3" />
  </>)
}

/** Suno 音乐 — 音符 + 声波 */
export function IconMusic(props: InkIconProps) {
  return wrap(props, <>
    <path d="M9 18V6l9-3v12" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="15" cy="15" r="3" />
    <path d="M19 8c1 0 2 .5 2 2s-1 2-2 2" strokeWidth={1} />
    <path d="M20 6c1.5 0 3 1 3 3s-1.5 3-3 3" strokeWidth={1} opacity={0.5} />
  </>)
}

/** 教学类通用 — 讲台 + 黑板 */
export function IconTeaching(props: InkIconProps) {
  return wrap(props, <>
    <rect x="3" y="3" width="18" height="12" rx="1" />
    <path d="M8 7h8M8 10h5" />
    <path d="M6 19h12M9 15v4M15 15v4" />
  </>)
}

/** 全能超级智能体 — 六边形 + 闪电 */
export function IconAllInOne(props: InkIconProps) {
  return wrap(props, <>
    <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" />
    <path d="M13 7l-2 5h4l-2 5" strokeWidth={2} />
  </>)
}

/** 备课 Pro — 教案本 + 书签 */
export function IconBeike(props: InkIconProps) {
  return wrap(props, <>
    <rect x="4" y="3" width="14" height="18" rx="1" />
    <path d="M4 7h14" />
    <path d="M15 3v6l-1.5-1L12 9V3" fill="var(--seal-500,#B23A2C)" stroke="none" opacity={0.7} />
    <path d="M7 11h6M7 14h4" />
  </>)
}

/** 班主任助手 — 人形 + 爱心 */
export function IconBanzhuren(props: InkIconProps) {
  return wrap(props, <>
    <circle cx="10" cy="7" r="3.5" />
    <path d="M4 19c0-3 2.5-5 6-5s6 2 6 5" />
    <path d="M18 10c.5-.5 1.5-.5 2 0s.5 1.5 0 2.5L18 15l-2-2.5c-.5-1-.5-2 0-2.5s1.5-.5 2 0z" fill="var(--seal-500,#B23A2C)" stroke="none" />
  </>)
}
