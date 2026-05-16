# PR1 · 沈翔智学 v2「墨砚」设计系统底层

> 这是给 `zhangyufei820/ai-essay-editor` 仓库的 PR1。
> 因为 Kiro 网关 push 到该仓库时持续 502，先把成品落到此备份仓库，等网关恢复或你本地拉取后应用。
>
> 基线：`1de200a fix(learning): restore Authing Supabase user bridge`
> 目标分支：`feat/redesign-pr1-tokens`

---

## 这个 PR 做了什么

**只做加法，不动任何业务组件**。生产视觉零变化。

5 个独立 commit：

```
604f18a  feat(design-system): introduce ink/seal/paper color tokens and serif font variables
240f0d5  feat(design-system): export v2 ink/seal/paper tokens for typed access
3dfb3ac  feat(design-system): preload Noto Serif/Sans SC + JetBrains Mono + Ma Shan Zheng
efcbee6  feat(motion): add InkReveal/Stagger/Brush/Seal v2 motion primitives
802142b  docs: add v2 redesign master spec
```

涉及文件（6 个，全部为新增或追加）：

| 文件 | 改动 |
|---|---|
| `app/globals.css` | 末尾追加 v2 token + utility class（不删任何现有 CSS） |
| `lib/design-tokens.ts` | 末尾追加 `inkColors / sealColors / paperColors / v2*` 命名空间（不删任何 export） |
| `app/layout.tsx` | 在 `<head>` 加 Google Fonts 链接（不修改 body className） |
| `components/motion/InkMotion.tsx` | **新文件** · 4 种动画原语 |
| `__tests__/ink-motion-shape.test.ts` | **新文件** · 5 个测试套件 / 19 条断言 |
| `docs/REDESIGN.md` | **新文件** · 248 行总宪法 |

**v2 与旧 token 完全并存**。后续 PR2-PR8 才开始迁移业务组件。

---

## 怎么把它应用到 `zhangyufei820/ai-essay-editor`

有 3 种方式，任选一种。

### 方式 A · 用 patch 文件（推荐）

```bash
cd /path/to/ai-essay-editor
git checkout 1de200a
git checkout -b feat/redesign-pr1-tokens
git am pr1-redesign-tokens/patches/*.patch
git push origin feat/redesign-pr1-tokens
```

5 个 commit 会按顺序应用，commit 信息和作者信息都保留。`git am` 失败的极小概率场景是 `1de200a` 之后 main 又有新 commit 改动了 `app/globals.css`、`app/layout.tsx`、`lib/design-tokens.ts`，到时手动解一下冲突即可。

### 方式 B · 直接把成品文件覆盖过去

```bash
cd /path/to/ai-essay-editor
git checkout 1de200a
git checkout -b feat/redesign-pr1-tokens

# 全文覆盖（已被验证为 base 1de200a 上的最终态）
cp pr1-redesign-tokens/source-snapshot/globals.css        app/globals.css
cp pr1-redesign-tokens/source-snapshot/layout.tsx         app/layout.tsx
cp pr1-redesign-tokens/source-snapshot/design-tokens.ts   lib/design-tokens.ts

# 全新文件直接放
mkdir -p components/motion && cp pr1-redesign-tokens/source-snapshot/InkMotion.tsx components/motion/
cp pr1-redesign-tokens/source-snapshot/ink-motion-shape.test.ts __tests__/
mkdir -p docs && cp pr1-redesign-tokens/source-snapshot/REDESIGN.md docs/

# 一次性合成 1 个 commit（若想要多 commit 历史用方式 A）
git add app/globals.css app/layout.tsx lib/design-tokens.ts \
        components/motion/InkMotion.tsx \
        __tests__/ink-motion-shape.test.ts \
        docs/REDESIGN.md
git commit -m "feat(design-system): redesign v2 PR1 — ink/seal/paper tokens + InkMotion + master spec"
git push origin feat/redesign-pr1-tokens
```

### 方式 C · Cherry-pick（如果你已经把这个仓 fork 到了别处）

如果有任何远程仓拿到了上面 5 个 commit hash，`git cherry-pick 604f18a..802142b`。

---

## 验收清单

应用完后跑：

```bash
npm install                                              # 不需要新增依赖
npm run build                                            # 必须通过
npm test -- ink-motion-shape                             # 5 个套件 / 19 条断言全过
```

视觉验收：

```
- 桌面 / 移动 任何页面打开后视觉与改前 100% 一致 ✅
- DevTools Network 看到 fonts.googleapis.com 字体请求 ✅
- DevTools Computed style 任何元素的 font-family 仍是 Inter / system-ui（v2 字体已加载但未启用）✅
- :root 中 --ink-600 / --seal-500 / --paper-50 已可在 DevTools 看到 ✅
```

---

## v2 设计系统快速参考

详细规约见 `docs/REDESIGN.md`，简版：

| 维度 | v2 token | 用途 |
|---|---|---|
| 主色 | `--ink-600` (#3F5A42) | 按钮 / 链接 / CTA |
| 强调色 | `--seal-500` (#B23A2C) | 评分 / 印章 / 错误 |
| 背景 | `--paper-50` (#FBF9F4) | 主背景 |
| 标题字体 | `--font-display` | 思源宋体 |
| 正文字体 | `--font-sans-v2` | 思源黑体 |
| 数字字体 | `--font-mono-v2` + `tnum` | JetBrains Mono |
| 圆角 | `radius-sharp/soft/card/pill` | 内容/输入/模态/按钮 |
| 阴影 | `shadow-paper/elevated/modal/seal` | 纸/悬浮/模态/印章 |
| 动画 | `InkReveal/Stagger/Brush/Seal` | 入场/列表/加载/盖章 |

---

## 后续 PR 路线

PR1（本 PR）合并后，依次：

| PR | 范围 | Codex 工时 |
|---|---|---|
| PR2 | UI 35 个基础组件 v2 variant | 6 h |
| PR3 | Header / Sidebar / Footer 框架升级 | 4 h |
| PR4 | 首页 5 段重构 | 6 h |
| PR5 | chat 工作台 + 批改稿模板 | 8 h |
| PR6 | 拍卷诊断海报 + 闪卡卡片 | 6 h |
| PR7 | 创作广场作品长廊 + 个人中心档案柜 | 6 h |
| PR8 | 支付 / 账号系统对齐 | 4 h |

---

## 状态

- [x] PR1 commit 1：globals.css 注入 v2 token
- [x] PR1 commit 2：design-tokens.ts 导出 v2 命名空间
- [x] PR1 commit 3：layout.tsx 加载 Google Fonts
- [x] PR1 commit 4：InkMotion.tsx 4 种动画原语
- [x] PR1 commit 5：REDESIGN.md 总宪法
- [ ] 应用到 zhangyufei820/ai-essay-editor 并 push（等网关恢复或手动 apply）
- [ ] 合并 PR1
- [ ] 启动 PR2

---

> 完成于 2026-05-17 02:50（沙箱 UTC+8）
> 共 5 commit · 6 文件 · 998 行追加 · 0 行修改
