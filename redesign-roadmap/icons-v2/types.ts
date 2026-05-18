/**
 * 🖌 沈翔智学 v2「墨砚」图标系统 — 共享类型
 *
 * 规格：24×24 viewBox · 1.5px stroke · round linecap/linejoin
 * 默认 currentColor，继承父级文字色
 */

import type { SVGProps } from "react"

export interface InkIconProps extends SVGProps<SVGSVGElement> {
  /** 尺寸快捷方式（优先级低于 className 里的 size-*） */
  size?: number | string
}
