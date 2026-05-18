/**
 * 🖌 沈翔智学 v2「墨砚」图标系统 — 总出口
 *
 * 42 个自绘图标，按 6 组分类：
 *   navigation (10) · agents (12) · toolbar (8) · status (6) · brand (4) · account (4)
 *
 * 用法：
 *   import { IconEssay, IconSend, IconSealCheck } from "@/components/icons/v2"
 *
 * 规格：24×24 · 1.5px stroke · round cap/join · currentColor
 *
 * 不含的 5 个官方 logo（保留原件）：
 *   ChatGPT (OpenAI) / Gemini (Google) / Suno / Claude (Anthropic) / Grok (xAI)
 */

// 类型
export type { InkIconProps } from "./types"

// 第 1 组：导航侧栏
export {
  IconChat,
  IconDiagnosis,
  IconFlashcard,
  IconLab,
  IconDashboard,
  IconHistory,
  IconFolder,
  IconCredits,
  IconExplore,
  IconInvite,
} from "./navigation"

// 第 2 组：智能体
export {
  IconEssay,
  IconWriting,
  IconMath,
  IconEnglish,
  IconVocab,
  IconProblem,
  IconOpenClaw,
  IconMusic,
  IconTeaching,
  IconAllInOne,
  IconBeike,
  IconBanzhuren,
} from "./agents"

// 第 3 组：操作工具栏
export {
  IconCopy,
  IconExportPdf,
  IconShare,
  IconListen,
  IconFollowup,
  IconUpload,
  IconMic,
  IconSend,
} from "./toolbar"

// 第 4 组：状态 / 反馈
export {
  IconSealCheck,
  IconSealStar,
  IconInkDot,
  IconStreak,
  IconProgress,
  IconEmpty,
} from "./status"

// 第 5 组：品牌 / 装饰
export {
  IconLogoMark,
  IconBrushLoading,
  IconPaperFold,
  IconWatermark,
} from "./brand"

// 第 6 组：用户 / 账户
export {
  IconUser,
  IconMember,
  IconLogout,
  IconSettings,
} from "./account"
