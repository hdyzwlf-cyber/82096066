# 沈翔智学 v2 视觉重构总宪法

> 本文档是「墨砚」设计系统的宪法。任何 PR 触及 UI 视觉前必须先读这里。
> 起草：PR1（feat/redesign-pr1-tokens · commit `604f18a → 3dfb3ac → ...`）
> 基线：`1de200a`（fix(learning): restore Authing Supabase user bridge）

---

## 一、品牌叙事

### 一句话定位

> **上传材料，看见能拿走的学习成果。**

不是"AI 帮你学"（太空），不是"智能学习平台"（太通），是 **看见 → 拿走**。
所有视觉决策必须服务于这两个动词。

### 设计哲学

**Quiet Power（静水流深）—— 中式教研笔记本。**

| 维度 | 大多数 AI 站做的 | 沈翔智学应该做的 |
|---|---|---|
| 颜色 | 紫蓝渐变（OpenAI / Anthropic 套娃） | **墨绿 + 米白**（中式教研笔记本） |
| 排版 | Inter / SF Pro + 卡片 | **思源宋体 + 思源黑体** 双体系 |
| 动画 | 粒子 / 光晕 / 流体 | **手写笔触 / 翻页 / 印章** |
| 隐喻 | 太空、未来、芯片 | **作业本、印章、墨迹、纸张** |
| 信号 | "我有 AI" | "我懂教育" |

> 不靠视觉噪音赢得注意，靠每一个细节让用户感觉到——这家公司真的懂学习。

---

## 二、设计 Token v2「墨砚」

所有 v2 token 在 `app/globals.css` 与 `lib/design-tokens.ts` 中以 `ink-* / seal-* / paper-* / v2*` 命名，**与现有 `color-primary-* / brand-* / cream-*` 并存**。新组件必须使用 v2 token，老组件保留不动。

### 颜色

```css
/* 墨砚绿系（v2 主品牌色） */
--ink-50:  #F4F8F4;
--ink-100: #E2EBE3;
--ink-200: #B8C9BB;
--ink-300: #98AE9B;
--ink-400: #6E8270;
--ink-500: #557158;
--ink-600: #3F5A42;   /* 主品牌色 · 按钮 / 链接 / CTA */
--ink-700: #2E4731;
--ink-800: #1F3322;   /* 标题文字 */
--ink-900: #0E1B11;   /* 正文文字 */

/* 朱印红（强调色） */
--seal-50:  #FAEAE6;
--seal-100: #F4D2C9;
--seal-300: #E27262;
--seal-500: #B23A2C;  /* 主朱印 · 关键 CTA / 评分 / 印章 */
--seal-600: #8E2D22;

/* 宣纸米色（背景层级） */
--paper-50:  #FBF9F4;  /* 主背景 */
--paper-100: #F5F1E6;  /* 卡片底 */
--paper-200: #EBE4D1;  /* 分隔线 / 二级背景 */
--paper-300: #D9CFB6;
--paper-400: #B5A881;
```

### 颜色使用纪律（强制）

- **90%** 的页面只能看到 `paper-*` + `ink-*` 两族色
- **朱印红** 仅用于：
  1. 主 CTA（每页最多 1 个，例如"立即购买"、"上传作文"）
  2. 评分 / 数字红章（"AI 评分 8.5/10"）
  3. 错误提示墨点
  4. 成就章 / "已批阅"印章
- **不允许** 任何 emerald / hot pink / 紫色 / 渐变光斑出现在 v2 组件中

### 字体

```ts
--font-display: "Noto Serif SC"     // 标题 - 思源宋体
--font-sans-v2: "Noto Sans SC"      // 正文 - 思源黑体
--font-mono-v2: "JetBrains Mono"    // 数字 - 等宽
--font-hand:    "Ma Shan Zheng"     // 装饰 - 毛笔（极少用）
```

字号阶梯（响应式 `clamp()`）：

| Token | 桌面 | 移动 | 字重 | 字体 | 用途 |
|---|---|---|---|---|---|
| `text-hero` | 88px | 40px | 900 | display | 首页 H1 |
| `text-display` | 56px | 32px | 800 | display | 板块大标题 |
| `text-h1-v2` | 36px | 28px | 800 | display | 页面标题 |
| `text-h2-v2` | 28px | 24px | 700 | display | 区块标题 |
| `text-h3-v2` | 22px | 22px | 600 | sans | 卡片标题 |
| `text-h4-v2` | 18px | 18px | 600 | sans | 列表标题 |
| `text-body-lg-v2` | 17px | 17px | 400 | sans | 段落正文 |
| `text-body-v2` | 15px | 15px | 400 | sans | 默认正文 |
| `text-body-sm-v2` | 14px | 14px | 400 | sans | 辅助说明 |
| `text-caption-v2` | 13px | 13px | 400 | sans | 标签 / 时间戳 |
| `text-num` | tnum | tnum | 700 | mono | 所有数字 |

### 圆角（按"是什么"决定）

```ts
--radius-sharp: 2px      // 内容卡 / 文档 / 海报
--radius-soft:  4px      // 输入框 / 答题框
--radius-card:  12px     // 模态框 / 抽屉
--radius-pill:  9999px   // 按钮 / 标签
```

### 阴影（墨色调，不是紫黑）

```ts
--shadow-paper:    /* 纸张层 */
--shadow-elevated: /* 悬浮层 */
--shadow-modal:    /* 模态层 */
--shadow-seal:     /* 朱印按下 */
--shadow-focus-ink:/* 焦点 */
```

### 间距（三段式）

```ts
--space-paper:   12px    // 段内、纸面元素之间
--space-section: 64px    // 板块间
--space-page:    120px   // 整页大区分
```

---

## 三、组件级规约

### 按钮 — 五种且仅五种

| variant | 视觉 | 用法 |
|---|---|---|
| `primary` | 墨绿底 + 米白字，圆角胶囊 | 主要 CTA（每页最多 1 个） |
| `seal` | 朱印红底 + 米白字 | 关键操作（支付、下载、分享） |
| `outline` | 米白底 + 墨绿边 + 墨绿字 | 次要操作 |
| `ghost` | 透明底 + 墨绿字 | 工具栏 |
| `link` | 墨绿字 + hover 显示下划线 | 文字链接 |

尺寸只允许：`sm (h-9 px-3)` / `default (h-10 px-4)` / `lg (h-12 px-6)`。

按下交互：**禁止 active:scale-95**，改为 `translateY(1px)` + 阴影内陷 = 印章按下感。

### 卡片 — 三种且仅三种

| variant | 视觉 | 用法 |
|---|---|---|
| `paper` | 米白底 / 墨色 1px 边框 / shadow-paper / radius-sharp | 内容、产物、报告 |
| `elevated` | 米白底 / 无边框 / shadow-elevated / radius-card | 模态、抽屉、悬浮卡 |
| `inset` | paper-100 底 / 无阴影 / radius-soft | 表单组、信息盒 |

**禁用** glass-morphism / neon-border / animated gradient border。

### 动画 — 四种且仅四种

库：`@/components/motion/InkMotion`

| 原语 | 用途 | 缓动 |
|---|---|---|
| `InkReveal` | 渐显纸张：opacity + blur + y 入场 | paperFold |
| `InkStagger` + `InkStaggerItem` | 列表逐个渗出 | paperFold |
| `InkBrush` | 毛笔笔触 SVG，加载状态 | linear loop |
| `InkSeal` | 朱印盖章，成就 / 已批阅 | sealStamp |

**强制纪律**：
- 全部尊重 `prefers-reduced-motion`
- 禁止 `repeat: Infinity` 装饰动画
- 不引入新的粒子 / 光晕 / 渐变背景

---

## 四、迁移路径（8 个 PR）

每个 PR 独立可发布，**互不依赖**，生产环境零中断。

| PR | 范围 | 预计 Codex 工时 |
|---|---|---|
| **PR1** | 设计 token + 字体 + InkMotion + 文档（本 PR） | 1.5 h |
| PR2 | UI 35 个基础组件改 v2 variant（button / card / input / dialog / ...） | 6 h |
| PR3 | 通用页面 chrome（Header / Sidebar / Footer / Layout） | 4 h |
| PR4 | 首页 5 段重构 | 6 h |
| PR5 | chat 工作台 + 批改稿模板 | 8 h |
| PR6 | 拍卷诊断海报 + 闪卡复习卡片 | 6 h |
| PR7 | 创作广场作品长廊 + 个人中心档案柜 | 6 h |
| PR8 | 支付 / 账号系统对齐 | 4 h |

### 渐进迁移合同

- 老 token (`color-primary-* / brandColors / creamColors`) 与 v2 token **并存不删**
- 老组件视觉零修改
- 每个 PR 只迁移一类组件
- 每次合并视觉变化可见、可回滚
- 每个 PR 独立 PR，独立 review，独立 ship

---

## 五、PR1 完成清单

- [x] commit 1 · `app/globals.css` 注入墨砚 / 朱印 / 宣纸色系 + v2 字体 CSS 变量
- [x] commit 2 · `lib/design-tokens.ts` 导出 `inkColors / sealColors / paperColors / v2Typography / v2Radius / v2Shadow / v2Easing / v2DesignTokens`
- [x] commit 3 · `app/layout.tsx` 通过 Google Fonts 预加载思源宋体 / 黑体 / JetBrains Mono / Ma Shan Zheng
- [x] commit 4 · `components/motion/InkMotion.tsx` 新增四种动画原语
- [x] commit 5 · 本文档（`docs/REDESIGN.md`）

### PR1 部署影响

**零影响。** 老用户打开网站看到的视觉与改前 100% 一致。
- 现有 token 全部保留
- 现有 UI 组件未修改
- 仅新增 CSS 变量 / TypeScript 常量 / 动画原语 / 文档
- 新增 4 个测试套件（`ink-motion-shape.test.ts`）

### PR1 后续

PR2 起开始把现有 UI 组件迁移到 v2 variant，每次合并视觉会有可见变化。

---

## 六、品牌差异化总结

```
ChatGPT 像太空舱。
Claude 像图书馆。
Notion AI 像写字楼。
Gemini 像实验室。

沈翔智学应该像：
        ━━━━━━━━━━━━━━━━━━
        书房里的一方砚台
        ━━━━━━━━━━━━━━━━━━
        墨绿安静、朱印温热
        每一次输出都像批改完一本作业
        合上、收好、随时可拿走
```

---

## 七、贡献者注意

- 任何在本仓库提交涉及 UI 视觉的 PR，第一步必须读完本文档
- 视觉改动必须使用 `ink-* / seal-* / paper-*` token
- 动画必须使用 `InkMotion` 原语，禁止再写新的 framer-motion 装饰循环
- 引入新组件必须填写 PR 描述里的 "v2 设计语言对照"：颜色 / 字体 / 圆角 / 阴影 / 动画分别用了哪个 token
- 任何视觉破坏需要先经过本文档评审才能合并
