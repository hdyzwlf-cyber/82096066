/**
 * 🖌 v2 UI 组件库形状契约测试
 *
 * 守住关键设计纪律：
 *   - 5 种且仅 5 种 button variant
 *   - 3 种且仅 3 种 card variant
 *   - 朱印组件存在
 *   - index.ts 出口完整
 */

import fs from "fs"
import path from "path"

const root = path.resolve(__dirname, "..")
const v2Dir = path.join(root, "components/ui/v2")

function read(rel: string) {
  return fs.readFileSync(path.join(v2Dir, rel), "utf8")
}

describe("v2 UI library — directory structure", () => {
  it("contains all required component files", () => {
    const required = [
      "button.tsx",
      "card.tsx",
      "input.tsx",
      "textarea.tsx",
      "label.tsx",
      "badge.tsx",
      "alert.tsx",
      "checkbox.tsx",
      "radio.tsx",
      "switch.tsx",
      "select.tsx",
      "tabs.tsx",
      "dialog.tsx",
      "sheet.tsx",
      "popover.tsx",
      "tooltip.tsx",
      "dropdown-menu.tsx",
      "scroll-area.tsx",
      "separator.tsx",
      "skeleton.tsx",
      "progress.tsx",
      "avatar.tsx",
      "loading-state.tsx",
      "empty-state.tsx",
      "error-state.tsx",
      "seal.tsx",
      "index.ts",
    ]
    for (const file of required) {
      expect(fs.existsSync(path.join(v2Dir, file))).toBe(true)
    }
  })
})

describe("v2 Button — five and only five variants", () => {
  const src = read("button.tsx")

  it("declares variant: primary / seal / outline / ghost / link", () => {
    for (const variant of ["primary", "seal", "outline", "ghost", "link"]) {
      expect(src).toMatch(new RegExp(`${variant}:`))
    }
  })

  it("does not introduce non-sanctioned variants (destructive/secondary/...)", () => {
    // 在 variants 块里禁止出现这些名字
    const variantBlock = src.split("variants: {")[1]?.split("defaultVariants")[0] || ""
    for (const banned of ["destructive:", "secondary:"]) {
      expect(variantBlock).not.toContain(banned)
    }
  })

  it("uses ink/seal CSS variables instead of hardcoded brand colors", () => {
    expect(src).toContain("--ink-600")
    expect(src).toContain("--seal-500")
    expect(src).not.toMatch(/#10A37F|#16a34a/)
  })

  it("does not use active:scale-95 (replaces with translateY for stamp feel)", () => {
    expect(src).not.toMatch(/active:scale-9[58]/)
    expect(src).toContain("active:translate-y-[1px]")
  })
})

describe("v2 Card — three and only three variants", () => {
  const src = read("card.tsx")
  it("declares variant: paper / elevated / inset", () => {
    for (const variant of ["paper:", "elevated:", "inset:"]) {
      expect(src).toMatch(variant)
    }
  })

  it("uses paper/ink CSS tokens", () => {
    expect(src).toContain("--paper-50")
    expect(src).toContain("--ink-900")
  })
})

describe("v2 Input / Textarea — error visual via aria-invalid + seal-500", () => {
  const inputSrc = read("input.tsx")
  it("uses paper background with ink focus border", () => {
    expect(inputSrc).toContain("--paper-100")
    expect(inputSrc).toContain("focus-visible:border-[var(--ink-600)]")
  })
  it("provides invalid prop and aria-invalid red border", () => {
    expect(inputSrc).toContain("invalid")
    expect(inputSrc).toContain("--seal-500")
  })
})

describe("v2 Seal stamp module exists", () => {
  const sealSrc = read("seal.tsx")
  it("exports SealStamp + ScoreSeal", () => {
    expect(sealSrc).toContain("export function SealStamp")
    expect(sealSrc).toContain("export function ScoreSeal")
  })
  it("uses seal-500 with shadow", () => {
    expect(sealSrc).toContain("--seal-500")
    expect(sealSrc).toContain("rotate")
  })
})

describe("v2 LoadingState uses InkBrush, not spinner", () => {
  const loadSrc = read("loading-state.tsx")
  it("imports InkBrush from motion library", () => {
    expect(loadSrc).toContain('from "@/components/motion/InkMotion"')
    expect(loadSrc).toContain("InkBrush")
  })
})

describe("v2 index.ts — re-exports surface", () => {
  const indexSrc = fs.readFileSync(path.join(v2Dir, "index.ts"), "utf8")
  const required = [
    "ButtonV2",
    "CardV2",
    "InputV2",
    "TextareaV2",
    "LabelV2",
    "BadgeV2",
    "AlertV2",
    "DialogV2",
    "SheetV2",
    "TabsV2",
    "DropdownMenuV2",
    "ScrollAreaV2",
    "SwitchV2",
    "SelectV2",
    "PopoverV2",
    "TooltipV2",
    "AvatarV2",
    "LoadingStateV2",
    "EmptyStateV2",
    "ErrorStateV2",
    "SealStamp",
    "ScoreSeal",
    "ProgressV2",
    "SeparatorV2",
    "SkeletonV2",
    "CheckboxV2",
    "RadioGroupV2",
  ]
  for (const sym of required) {
    it(`re-exports ${sym}`, () => {
      expect(indexSrc).toMatch(new RegExp(`\\b${sym}\\b`))
    })
  }
})

describe("v2 components do not import legacy shadcn equivalents", () => {
  const allFiles = fs
    .readdirSync(v2Dir)
    .filter((f) => f.endsWith(".tsx"))
  for (const file of allFiles) {
    it(`${file} does not import @/components/ui/[...] (legacy)`, () => {
      const src = fs.readFileSync(path.join(v2Dir, file), "utf8")
      // 允许：@/components/ui/v2/...
      // 禁止：@/components/ui/button、@/components/ui/card 等
      const legacyImports = src.match(/from\s+["']@\/components\/ui\/(?!v2)[^"']+["']/g) || []
      expect(legacyImports).toEqual([])
    })
  }
})
