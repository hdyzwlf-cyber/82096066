import fs from "fs"
import path from "path"

const root = path.resolve(__dirname, "..")

describe("InkMotion v2 motion library", () => {
  const inkMotionPath = path.join(root, "components/motion/InkMotion.tsx")
  const src = fs.readFileSync(inkMotionPath, "utf8")

  it("exports the four sanctioned v2 motion primitives", () => {
    for (const name of ["InkReveal", "InkStagger", "InkStaggerItem", "InkBrush", "InkSeal"]) {
      expect(src).toContain(`export function ${name}`)
    }
  })

  it("respects useReducedMotion in InkReveal / InkStagger / InkStaggerItem / InkSeal", () => {
    expect(src).toContain("useReducedMotion")
    const occurrences = (src.match(/useReducedMotion\(\)/g) || []).length
    expect(occurrences).toBeGreaterThanOrEqual(4)
  })

  it("does not introduce infinite-repeat motion in framer-motion paths", () => {
    expect(src).not.toMatch(/repeat:\s*Infinity/)
  })

  it("uses v2 design token CSS variables (--seal-500 / --font-display) instead of hardcoded brand colors", () => {
    expect(src).toContain("--seal-500")
    expect(src).toContain("--font-display")
    expect(src).not.toMatch(/#22c55e|#16a34a|#10A37F/)
  })

  it("re-exports a unified InkMotion namespace", () => {
    expect(src).toMatch(/export const InkMotion[\s=:]/)
    for (const key of ["Reveal", "Stagger", "StaggerItem", "Brush", "Seal"]) {
      expect(src).toMatch(new RegExp(`${key}:`))
    }
  })
})

describe("v2 design tokens are exported alongside legacy tokens", () => {
  const tokensSrc = fs.readFileSync(path.join(root, "lib/design-tokens.ts"), "utf8")

  it("exports inkColors / sealColors / paperColors", () => {
    expect(tokensSrc).toMatch(/export const inkColors/)
    expect(tokensSrc).toMatch(/export const sealColors/)
    expect(tokensSrc).toMatch(/export const paperColors/)
  })

  it("preserves legacy brandColors / slateColors / creamColors exports for backward compatibility", () => {
    expect(tokensSrc).toMatch(/export const brandColors/)
    expect(tokensSrc).toMatch(/export const slateColors/)
    expect(tokensSrc).toMatch(/export const creamColors/)
  })

  it("exports v2 typography scale", () => {
    expect(tokensSrc).toMatch(/export const v2Typography/)
    expect(tokensSrc).toContain("hero:")
    expect(tokensSrc).toContain("display:")
  })
})

describe("globals.css contains v2 ink/seal/paper tokens", () => {
  const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8")

  it("declares ink/seal/paper CSS variables in :root", () => {
    expect(css).toContain("--ink-600: #3F5A42")
    expect(css).toContain("--seal-500: #B23A2C")
    expect(css).toContain("--paper-50:  #FBF9F4")
  })

  it("preserves legacy --color-primary / --brand variables", () => {
    expect(css).toContain("--color-primary-500: #4CAF50")
    expect(css).toContain("--brand-600")
  })

  it("declares v2 utility classes", () => {
    expect(css).toContain("@utility text-hero")
    expect(css).toContain("@utility shadow-paper")
    expect(css).toContain("@utility animate-ink-spread")
  })

  it("declares v2 fonts in :root", () => {
    expect(css).toContain('--font-display: "Noto Serif SC"')
    expect(css).toContain('--font-sans-v2: "Noto Sans SC"')
  })

  it("declares v2 dark mode overrides in .dark", () => {
    const darkBlock = css.split(".dark {")[1]?.split("@theme inline")[0] || ""
    expect(darkBlock).toContain("--paper-50:  #14181A")
    expect(darkBlock).toContain("--ink-600:   #87B98C")
  })
})

describe("layout.tsx loads v2 fonts via Google Fonts", () => {
  const layoutSrc = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8")

  it("includes Noto Serif SC + Noto Sans SC + JetBrains Mono + Ma Shan Zheng", () => {
    expect(layoutSrc).toContain("Noto+Serif+SC")
    expect(layoutSrc).toContain("Noto+Sans+SC")
    expect(layoutSrc).toContain("JetBrains+Mono")
    expect(layoutSrc).toContain("Ma+Shan+Zheng")
  })

  it("uses display=swap to avoid blocking render", () => {
    expect(layoutSrc).toContain("display=swap")
  })

  it("does not change body className font setting (legacy pages stay on Inter/system-ui)", () => {
    expect(layoutSrc).toMatch(/<body className=\{`font-sans antialiased`\}/)
  })
})
