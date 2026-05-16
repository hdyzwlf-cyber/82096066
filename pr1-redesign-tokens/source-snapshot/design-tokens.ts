/**
 * 🎨 沈翔学校 - 设计令牌系统 (Design Tokens)
 * 
 * 整个项目的设计系统基础，包含颜色、间距、圆角、阴影、字体、动效等。
 */

// ============================================
// 1. 颜色系统 (Colors)
// ============================================

/** 品牌主色 - 深森林绿色阶 */
export const brandColors = {
  950: '#052e16',
  900: '#14532d',
  800: '#166534',
  700: '#15803d',
  600: '#16a34a',
  500: '#22c55e',
  400: '#4ade80',
  300: '#86efac',
  200: '#bbf7d0',
  100: '#dcfce7',
  50: '#f0fdf4',
} as const

/** 中性色 - 带暖调的灰色系 */
export const slateColors = {
  950: '#0f0f0f',
  900: '#1a1a1a',
  800: '#2d2d2d',
  700: '#404040',
  600: '#525252',
  500: '#6b6b6b',
  400: '#8a8a8a',
  300: '#b0b0b0',
  200: '#d4d4d4',
  100: '#ebebeb',
  50: '#f8f8f8',
} as const

/** 米色/奶油色系 - 温暖的背景色 */
export const creamColors = {
  900: '#8B7355',
  800: '#A08060',
  700: '#B8956B',
  600: '#C9A876',
  500: '#D4B896',
  400: '#E5D4B8',
  300: '#F0E6D6',
  200: '#F5EDE0',
  100: '#FAF7F2',
  50: '#FDFCFA',
} as const

/** 语义色 */
export const semanticColors = {
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const

/** AI 渐变色 */
export const gradients = {
  ai: 'linear-gradient(135deg, #14532d 0%, #7c3aed 50%, #ec4899 100%)',
} as const

/** 完整颜色系统 */
export const colors = {
  brand: brandColors,
  slate: slateColors,
  semantic: semanticColors,
  gradients,
} as const

// ============================================
// 2. 间距系统 (Spacing) - 基于 8px 基准
// ============================================

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const

// ============================================
// 3. 圆角系统 (Border Radius)
// ============================================

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const

// ============================================
// 4. 阴影系统 (Shadows)
// ============================================

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.05)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.03)',
  '2xl': '0 25px 50px -12px rgba(0,0,0,0.15)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  glow: '0 0 20px rgba(20,83,45,0.15)',
  input: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)',
  inputFocus: '0 4px 12px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.12), 0 0 0 3px rgba(20,83,45,0.1)',
} as const

// ============================================
// 5. 字体系统 (Typography)
// ============================================

/** 字体家族 */
export const fontFamily = {
  sans: '"Inter", "PingFang SC", "Noto Sans SC", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
} as const

/** 字号/行高/字重组合 */
export const typography = {
  display: {
    fontSize: '48px',
    lineHeight: '1.1',
    fontWeight: '700',
  },
  h1: {
    fontSize: '36px',
    lineHeight: '1.2',
    fontWeight: '700',
  },
  h2: {
    fontSize: '28px',
    lineHeight: '1.3',
    fontWeight: '600',
  },
  h3: {
    fontSize: '22px',
    lineHeight: '1.4',
    fontWeight: '600',
  },
  h4: {
    fontSize: '18px',
    lineHeight: '1.5',
    fontWeight: '600',
  },
  bodyLg: {
    fontSize: '17px',
    lineHeight: '1.7',
    fontWeight: '400',
  },
  body: {
    fontSize: '15px',
    lineHeight: '1.7',
    fontWeight: '400',
  },
  bodySm: {
    fontSize: '14px',
    lineHeight: '1.6',
    fontWeight: '400',
  },
  caption: {
    fontSize: '13px',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  small: {
    fontSize: '12px',
    lineHeight: '1.4',
    fontWeight: '400',
  },
} as const

// ============================================
// 6. 动效时长 (Duration)
// ============================================

export const duration = {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  slower: '600ms',
} as const

// ============================================
// 7. 缓动函数 (Easing)
// ============================================

export const easing = {
  out: 'cubic-bezier(0.33, 1, 0.68, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.34, 1.8, 0.64, 1)',
} as const

// ============================================
// 类型定义
// ============================================

export type BrandColor = keyof typeof brandColors
export type SlateColor = keyof typeof slateColors
export type SemanticColor = keyof typeof semanticColors
export type Spacing = keyof typeof spacing
export type BorderRadius = keyof typeof borderRadius
export type Shadow = keyof typeof shadows
export type Typography = keyof typeof typography
export type Duration = keyof typeof duration
export type Easing = keyof typeof easing

// ============================================
// 默认导出
// ============================================

const designTokens = {
  colors,
  spacing,
  borderRadius,
  shadows,
  fontFamily,
  typography,
  duration,
  easing,
} as const

export default designTokens



// ============================================
// 🖌 v2 「墨砚」设计系统 (沈翔智学 v2)
// ----------------------------------------------------------------
// 与现有 brandColors / slateColors / creamColors 并存。
// 新组件必须使用 v2 token，老组件保留不动。
// 迁移路径：PR1 引入 token → PR2 改 UI 组件 → PR3-PR8 改业务页面。
// ============================================

/** 墨砚绿系（v2 主品牌色） */
export const inkColors = {
  50: '#F4F8F4',
  100: '#E2EBE3',
  200: '#B8C9BB',
  300: '#98AE9B',
  400: '#6E8270',
  500: '#557158',
  600: '#3F5A42',
  700: '#2E4731',
  800: '#1F3322',
  900: '#0E1B11',
} as const

/** 朱印红系（仅用于关键 CTA / 评分 / 印章 / 错误） */
export const sealColors = {
  50: '#FAEAE6',
  100: '#F4D2C9',
  300: '#E27262',
  500: '#B23A2C',
  600: '#8E2D22',
} as const

/** 宣纸米色系（背景层级） */
export const paperColors = {
  50: '#FBF9F4',
  100: '#F5F1E6',
  200: '#EBE4D1',
  300: '#D9CFB6',
  400: '#B5A881',
} as const

/** v2 字体家族（Google Fonts 由 layout.tsx 加载） */
export const v2FontFamily = {
  display: 'var(--font-display)',
  sans: 'var(--font-sans-v2)',
  mono: 'var(--font-mono-v2)',
  hand: 'var(--font-hand)',
} as const

/** v2 字号 / 行高 / 字重组合（响应式） */
export const v2Typography = {
  hero: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(40px, 6vw, 88px)',
    lineHeight: '1.05',
    fontWeight: '900',
    letterSpacing: '-0.02em',
  },
  display: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(32px, 4.5vw, 56px)',
    lineHeight: '1.1',
    fontWeight: '800',
    letterSpacing: '-0.015em',
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(28px, 3.5vw, 36px)',
    lineHeight: '1.2',
    fontWeight: '800',
    letterSpacing: '-0.01em',
  },
  h2: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(24px, 3vw, 28px)',
    lineHeight: '1.3',
    fontWeight: '700',
  },
  h3: {
    fontFamily: 'var(--font-sans-v2)',
    fontSize: '22px',
    lineHeight: '1.4',
    fontWeight: '600',
  },
  h4: {
    fontFamily: 'var(--font-sans-v2)',
    fontSize: '18px',
    lineHeight: '1.5',
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily: 'var(--font-sans-v2)',
    fontSize: '17px',
    lineHeight: '1.75',
    fontWeight: '400',
  },
  body: {
    fontFamily: 'var(--font-sans-v2)',
    fontSize: '15px',
    lineHeight: '1.7',
    fontWeight: '400',
  },
  bodySm: {
    fontFamily: 'var(--font-sans-v2)',
    fontSize: '14px',
    lineHeight: '1.6',
    fontWeight: '400',
  },
  caption: {
    fontFamily: 'var(--font-sans-v2)',
    fontSize: '13px',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  num: {
    fontFamily: 'var(--font-mono-v2)',
    fontFeatureSettings: '"tnum" 1, "lnum" 1',
    fontWeight: '700',
  },
} as const

/** v2 圆角（按"是什么"决定） */
export const v2Radius = {
  sharp: '2px',
  soft: '4px',
  card: '12px',
  pill: '9999px',
  circle: '50%',
} as const

/** v2 三段式间距 */
export const v2Spacing = {
  paper: '12px',
  section: '64px',
  page: '120px',
} as const

/** v2 阴影（墨色调） */
export const v2Shadow = {
  paper: '0 1px 0 var(--paper-200), 0 8px 24px -8px rgba(14, 27, 17, 0.06)',
  elevated: '0 4px 16px -4px rgba(14, 27, 17, 0.12)',
  modal: '0 24px 60px -16px rgba(14, 27, 17, 0.18)',
  seal: '0 2px 0 var(--seal-500)',
  focus: '0 0 0 3px var(--ink-200)',
} as const

/** v2 缓动函数 */
export const v2Easing = {
  paperFold: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inkSpread: 'cubic-bezier(0.22, 1, 0.36, 1)',
  sealStamp: 'cubic-bezier(0.34, 1.6, 0.64, 1)',
} as const

/** v2 动画时长 */
export const v2Duration = {
  inkSpread: '600ms',
  paperFold: '700ms',
  sealStamp: '600ms',
  brushStroke: '1400ms',
} as const

/** 类型导出 */
export type InkColor = keyof typeof inkColors
export type SealColor = keyof typeof sealColors
export type PaperColor = keyof typeof paperColors
export type V2Typography = keyof typeof v2Typography
export type V2Radius = keyof typeof v2Radius
export type V2Shadow = keyof typeof v2Shadow
export type V2Easing = keyof typeof v2Easing

/** v2 完整命名空间（默认导入入口） */
export const v2DesignTokens = {
  colors: {
    ink: inkColors,
    seal: sealColors,
    paper: paperColors,
  },
  fontFamily: v2FontFamily,
  typography: v2Typography,
  radius: v2Radius,
  spacing: v2Spacing,
  shadow: v2Shadow,
  easing: v2Easing,
  duration: v2Duration,
} as const
