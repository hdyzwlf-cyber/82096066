/**
 * 🖌 沈翔智学 v2「墨砚」UI 组件总出口
 *
 * 用法：
 *   import { ButtonV2, CardV2, InputV2 } from "@/components/ui/v2"
 *
 * 命名规约：所有 v2 组件统一加 `V2` 后缀，避免与老组件冲突。
 */

// 按钮
export { ButtonV2, buttonV2Variants, type ButtonV2Props } from "./button"

// 卡片
export {
  CardV2,
  CardV2Header,
  CardV2Title,
  CardV2Description,
  CardV2Content,
  CardV2Footer,
  cardV2Variants,
  type CardV2Props,
} from "./card"

// 表单
export { InputV2, type InputV2Props } from "./input"
export { TextareaV2, type TextareaV2Props } from "./textarea"
export { LabelV2 } from "./label"
export { CheckboxV2 } from "./checkbox"
export { RadioGroupV2, RadioGroupV2Item } from "./radio"
export { SwitchV2 } from "./switch"
export {
  SelectV2,
  SelectV2Group,
  SelectV2Value,
  SelectV2Trigger,
  SelectV2Content,
  SelectV2Item,
  SelectV2Label,
  SelectV2Separator,
} from "./select"

// 反馈
export { AlertV2, AlertV2Title, AlertV2Description, type AlertV2Props } from "./alert"
export { BadgeV2, badgeV2Variants, type BadgeV2Props } from "./badge"
export { SkeletonV2 } from "./skeleton"
export { ProgressV2 } from "./progress"
export { LoadingStateV2, BrushDots, type LoadingStateV2Props } from "./loading-state"
export { EmptyStateV2, type EmptyStateV2Props } from "./empty-state"
export { ErrorStateV2, type ErrorStateV2Props } from "./error-state"
export { SealStamp, ScoreSeal, sealVariants, type SealStampProps } from "./seal"

// 布局 / 装饰
export { SeparatorV2, type SeparatorV2Props } from "./separator"
export { ScrollAreaV2, ScrollBarV2 } from "./scroll-area"

// 弹层
export {
  DialogV2,
  DialogV2Trigger,
  DialogV2Portal,
  DialogV2Close,
  DialogV2Overlay,
  DialogV2Content,
  DialogV2Header,
  DialogV2Footer,
  DialogV2Title,
  DialogV2Description,
} from "./dialog"
export {
  SheetV2,
  SheetV2Trigger,
  SheetV2Close,
  SheetV2Portal,
  SheetV2Overlay,
  SheetV2Content,
  SheetV2Header,
  SheetV2Footer,
  SheetV2Title,
  SheetV2Description,
  type SheetV2ContentProps,
} from "./sheet"
export {
  PopoverV2,
  PopoverV2Trigger,
  PopoverV2Anchor,
  PopoverV2Content,
} from "./popover"
export {
  TooltipV2Provider,
  TooltipV2,
  TooltipV2Trigger,
  TooltipV2Content,
} from "./tooltip"

// 菜单 / 导航
export { TabsV2, TabsV2List, TabsV2Trigger, TabsV2Content } from "./tabs"
export {
  DropdownMenuV2,
  DropdownMenuV2Trigger,
  DropdownMenuV2Group,
  DropdownMenuV2Portal,
  DropdownMenuV2Sub,
  DropdownMenuV2RadioGroup,
  DropdownMenuV2Content,
  DropdownMenuV2Item,
  DropdownMenuV2CheckboxItem,
  DropdownMenuV2RadioItem,
  DropdownMenuV2Label,
  DropdownMenuV2Separator,
  DropdownMenuV2Shortcut,
  DropdownMenuV2SubTrigger,
  DropdownMenuV2SubContent,
} from "./dropdown-menu"

// 头像
export { AvatarV2, AvatarV2Image, AvatarV2Fallback } from "./avatar"
