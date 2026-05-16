# Pages 路由审计报告 (Next.js 16 / App Router)

> 范围：`app/` 下的页面级路由（page.tsx / layout.tsx / error.tsx / not-found.tsx / robots.ts / sitemap.ts），不含 `app/api/`。
> 审计目标：摸清每个页面的运行时类型、数据来源、鉴权依赖与潜在缺陷。

---

### `app/about/page.tsx`  →  URL `/about`
- **类型**: client (`'use client'`)
- **作用**: 公司介绍 / 价值观 / 发展历程 / 联系方式静态展示页。
- **数据来源**: 静态硬编码（含客服电话、邮箱）。
- **关键依赖**: `next/link`、`lucide-react` 图标、`@/lib/design-tokens` 中的 `brandColors / slateColors / creamColors`。
- **状态管理**: 无。
- **鉴权与权限**: 公开页面，无鉴权。
- **主要行为**:
  1. 渲染顶部 hero（含 SVG 波浪装饰）。
  2. 4 张价值观卡片 + 3 项技术架构卡片。
  3. 3 步发展历程时间线。
  4. 列出客服电话 / 邮箱 / 工作时间。
  5. 底部链接到 pricing/help/privacy/terms。
- **⚠ 潜在问题**:
  - 完全无交互却被强制 `'use client'`，**应该是 RSC**——白白增加 hydration cost、阻止静态预渲染。
  - 大量 inline `style={{ color: ... }}`，与 Tailwind 类名混用，难维护；这些颜色完全可以预设到 Tailwind config。
  - `new Date().getFullYear()` 在客户端跑会触发 hydration mismatch（如果服务端时区不同会出现 SSR 警告，因为本页是 client 组件，SSR 阶段 React 也会渲染一次然后再 hydrate）；最佳实践是 server 渲染。
  - 客服电话 / 邮箱硬编码在多处页面（about / privacy / terms / refund-policy / help / error.tsx 等），未抽取成单一常量。
  - 页面没有 `metadata` 导出，标题 / 描述退化为根布局默认（缺 SEO）。

---

### `app/admin/layout.tsx`  →  URL `/admin/*`
- **类型**: server (无 `'use client'`)
- **作用**: 给 `/admin` 子树注入 `robots: noindex/nofollow` 元信息。
- **数据来源**: 静态。
- **关键依赖**: `next/Metadata`。
- **状态管理**: 无。
- **鉴权与权限**: 仅设定 robots，**没有做服务端会话校验**——真正的鉴权落在 `app/admin/page.tsx` 内部。
- **主要行为**: pass-through children。
- **⚠ 潜在问题**:
  - layout 没有任何鉴权，全部依赖前端 token 校验，存在“看到 UI 闪一下后才被踢出”的体验问题。生产建议在 layout 里调用 `getUser()` 服务端拦截。

---

### `app/admin/page.tsx`  →  URL `/admin`
- **类型**: client (945 行单文件)
- **作用**: 管理员仪表盘：登录 → 概览 / 用户 / 订单 / 数据分析 4 个 Tab。
- **数据来源**: 客户端 fetch `/api/admin/auth`、`/api/admin/verify`、`/api/admin/stats`、`/api/admin/users`、`/api/admin/orders`、`/api/admin/user-details`。
- **关键依赖**: shadcn UI（Card/Tabs/Sheet/Badge/Button/Input）、`lucide-react`。
- **状态管理**: 大量 `useState`（stats / users / orders / userDetails / authToken / loading / errorMessage / searchQuery / activeTab …），无 store。
- **鉴权与权限**: 自定义弱鉴权——纯密码 + 后端返回 token，存到 `localStorage.admin_token`，所有请求 `Authorization: Bearer <token>`。
- **主要行为**:
  1. 进入页面 → 读 `localStorage.admin_token` → POST `/api/admin/verify`，valid 则 `fetchAllData()`。
  2. 未认证显示登录卡片，提交后调 `/api/admin/auth`。
  3. `fetchAllData` 用 `Promise.all` 并行拉 stats/users/orders。
  4. 用户搜索框 → `/api/admin/users?search=...`。
  5. 点用户行 → `/api/admin/user-details?userId=...` 打开 Sheet。
  6. 退出登录 → 清 localStorage + setIsAuthenticated(false)。
- **⚠ 潜在问题**:
  - **管理员 token 放在 `localStorage`**，XSS 即被窃取；应放 httpOnly cookie。
  - 整页强制 client，且导入了 `Sheet/Tabs/Card/Badge/Button/Input` 等十几个 shadcn 组件，bundle 巨大；应拆分（登录卡 client，列表 server fetch + RSC）。
  - 大量 `any` 与未做空判断的字段（`data.data?.totalUsers ?? 0` 至少做了 fallback；但表格里的 `user.user_id.slice(0, 8)` 万一 `user_id` 为 null 直接崩）。
  - 用 `alert(...)` 做错误提示——非可访问、非现代化体验。
  - 表格列直接 `<table><tr>`，没有 `<caption>`、没有 sticky header、没有 row 选择无障碍标签。
  - userDetails Sheet 在加载下次详情前没清理上一个用户的内容（已 setUserDetails(null)，但 Sheet 关闭与新打开切换体验仍需检查）。
  - 没有任何分页 / 虚拟滚动；当用户表 / 订单表上万行会 OOM。
  - 用 `router` 风格的状态管理、Tab 切换不写入 URL（刷新就跳回 overview）。
  - useEffect 内 fetch 没有 `AbortController`，组件卸载有 race condition。
  - 时间戳格式化用 `toLocaleString('zh-CN')`，会受 SSR 时区影响（本页 client OK，但若 SSR 渲染就坏）。

---

### `app/ai-writing/page.tsx`  →  URL `/ai-writing`
- **类型**: server
- **作用**: 旧地址重定向到 `/chat/ai-writing-paper`。
- **数据来源**: 无。
- **关键依赖**: `next/navigation:redirect`。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 直接 `redirect('/chat/ai-writing-paper')`。
- **⚠ 潜在问题**:
  - 用 307 redirect 没问题，但如果意图是“永久迁移”，应该用 `permanentRedirect` 或在 `next.config.js` 里写 `redirects` 以便搜索引擎转移权重。
  - `/ai-writing` 已被 sitemap 列为可索引页（priority 0.8）——这与 `redirect` 冲突，会导致 sitemap 中出现死链。

---

### `app/ai-writing/paper/page.tsx`  →  URL `/ai-writing/paper`
- **类型**: server
- **作用**: 占位页，文案“论文写作 Agent 接入中”。
- **数据来源**: 静态文本。
- **关键依赖**: 无。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 渲染一段提示文案。
- **⚠ 潜在问题**:
  - 但 `/ai-writing` 又会重定向到 `/chat/ai-writing-paper`，本路径 `/ai-writing/paper` 实际上没人会访问到——**死路由**，应删除或合并。
  - 没有 metadata、没有 noindex，可能被搜索引擎抓到“接入中”页面影响 SEO。

---

### `app/analyze/page.tsx`  →  URL `/analyze`
- **类型**: server
- **作用**: 作文分析入口，渲染 `<EssayAnalyzer />`。
- **数据来源**: 子组件内部处理。
- **关键依赖**: `@/components/essay-analyzer`。
- **状态管理**: 无（组件内部）。
- **鉴权与权限**: 页面层无校验（依赖子组件）。
- **主要行为**: 输出 metadata（含 canonical & openGraph）后渲染分析器组件。
- **⚠ 潜在问题**:
  - URL 写死 `https://shenxiang.school`，应该来自 env（`process.env.NEXT_PUBLIC_SITE_URL`），不便于多环境。
  - openGraph description 截断成 “...” 会被搜索引擎当作低质量内容。

---

### `app/auth/email-login/page.tsx`  →  URL `/auth/email-login`
- **类型**: client
- **作用**: 邮箱 OTP 登录（发送 + 验证）。
- **数据来源**: `/api/auth/send-email-otp`、`/api/auth/verify-email-otp`、`@/lib/supabase/client`。
- **关键依赖**: shadcn UI、`lucide-react`。
- **状态管理**: 多个 `useState`（email/otp/loading/error/otpSent/countdown/devCode）。
- **鉴权与权限**: 此页就是登录入口。
- **主要行为**:
  1. 输入邮箱 → POST `send-email-otp` → 进入“输入验证码”态。
  2. countdown 倒计时 60s 用 `useEffect + setTimeout` 实现。
  3. 输入 6 位 OTP → POST `verify-email-otp` → 若返回 `redirectUrl` 直接 `window.location.href` 跳转，否则 `supabase.auth.refreshSession()` + `router.push(redirect)`。
  4. 返回修改邮箱 / 重发验证码。
- **⚠ 潜在问题**:
  - **`devCode` 字段直接渲染到 UI**——开发模式下展示 OTP，但如果 `/api/auth/send-email-otp` 在生产环境也错误返回该字段，就是把验证码漏给前端了；这是高风险，应在前端做 `process.env.NODE_ENV` 拦截。
  - `useEffect(() => { if (countdown > 0) ... })` 缺漏：依赖数组是 `[countdown]`，每次 tick 后会创建新的 timeout 链，**没有 abort 早期 timeout 的 cleanup**；当组件卸载且 countdown>0 时会 console warn “update unmounted component”。
  - `err: any` 全部 `any`，TS 滥用。
  - `/auth/email-login` 路径被 `robots.ts` 的 `/auth` disallow 覆盖，OK；但 layout 已 noindex，重复保护可以。
  - 未对 email 做 client-side 格式校验（仅依赖 input type="email"）。
  - 错误提示用红色 div，无 `role="alert"` / `aria-live`，屏幕阅读器拿不到。

---

### `app/auth/error/page.tsx`  →  URL `/auth/error`
- **类型**: server (`async` page，`searchParams: Promise<...>`，是 Next 15+ 的写法)
- **作用**: 登录失败/链接过期错误展示页。
- **数据来源**: searchParams（`error / message / description`）。
- **关键依赖**: shadcn UI、`lucide-react`。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 显示错误码 + 描述，列出 4 条可能原因 + 4 条管理员 Supabase 配置说明，提供“重新发送登录邮件 / 返回首页”按钮。
- **⚠ 潜在问题**:
  - 直接把后端配置说明 / Supabase 控制台 URL 暴露给终端用户——**对终端用户没用，对攻击者反而是侦察情报**（虽然信息算公开知识，但暗示了用 Supabase）。建议这部分仅在 admin 调试时显示。
  - `errorDescription` 直接渲染未做 sanitize（`<p>{errorDescription}</p>`）。React 默认会做 escape，所以不会 XSS，但仍要注意如果切换到 dangerouslySetInnerHTML 就会出问题。

---

### `app/auth/layout.tsx`  →  `/auth/*`
- **类型**: server
- **作用**: 给 `/auth` 子树注入 `robots: noindex/nofollow`。
- **数据来源**: 静态。
- **关键依赖**: 无。
- **状态管理**: 无。
- **鉴权与权限**: 无。
- **主要行为**: pass-through children。
- **⚠ 潜在问题**: 无明显问题。

---

### `app/auth/login/page.tsx`  →  URL `/auth/login`
- **类型**: server
- **作用**: 旧路径重定向到 `/login`。
- **数据来源**: 无。
- **关键依赖**: `next/navigation:redirect`。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: `redirect('/login')`。
- **⚠ 潜在问题**:
  - 同 `ai-writing`：应使用 `permanentRedirect` 或 next.config 的 redirects（带 301），有助于搜索引擎权重迁移。

---

### `app/auth/sign-up/page.tsx`  →  URL `/auth/sign-up`
- **类型**: client
- **作用**: 邮箱+密码注册（含昵称、可选手机号、推荐码）。
- **数据来源**: `@/lib/supabase/client`、`/api/referral/process`。
- **关键依赖**: shadcn UI、`lucide-react`。
- **状态管理**: 多个 `useState`。
- **鉴权与权限**: 公开。
- **主要行为**:
  1. 校验密码一致 + 长度 ≥ 6。
  2. 取 `window.location.origin || 'https://shenxiang.school'` 拼 emailRedirectTo。
  3. `supabase.auth.signUp({...})`，附带 `data: { display_name, phone?, referral_code? }`。
  4. 注册成功 + 有 referralCode → POST `/api/referral/process`。
  5. 显示“注册成功，去邮箱确认”界面。
- **⚠ 潜在问题**:
  - 注册接口直连 Supabase（`createClient()`），未通过统一封装，违反“在 page.tsx 里直接连 Supabase”禁忌。建议封装到 `/api/auth/sign-up`，由后端统一发推荐码处理 + 反作弊。
  - 调 `/api/referral/process` **不带任何鉴权**——刚注册用户的 idToken 还没拿到，攻击者只要构造 `{ userId, referralCode }` 就能任意刷推荐奖励。
  - `error: any`、`error: unknown` 混用。
  - 密码最短 6 位，弱标准。
  - `console.log("[v0] ...")` 残留 debug 日志（多个文件出现）。
  - 没有显示密码强度提示、没有 disabled 时的 spinner。

---

### `app/auth/sign-up-success/page.tsx`  →  URL `/auth/sign-up-success`
- **类型**: server
- **作用**: 注册成功后的提示页。
- **数据来源**: 静态文案。
- **关键依赖**: shadcn UI。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 显示“去登录 / 返回首页”按钮。
- **⚠ 潜在问题**:
  - 内容与 `sign-up/page.tsx` 内的 `emailSent` 子页重复（重复维护）。
  - 文案里直接写“如果您在 Supabase 后台关闭了邮箱验证…”——**给最终用户解释后端配置项**，应改为运营友好的话术。

---

### `app/auth/wechat-login/page.tsx`  →  URL `/auth/wechat-login`
- **类型**: client
- **作用**: 微信登录“开发中”占位页。
- **数据来源**: 静态文案。
- **关键依赖**: shadcn UI。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 提示用户改用邮箱登录 / 注册。
- **⚠ 潜在问题**:
  - 完全无客户端逻辑，被强制 `'use client'`，应改为 server。
  - 没有 `metadata`、没有 noindex（仅依赖 `/auth/layout.tsx`）。

---

### `app/chat/page.tsx`  →  URL `/chat`
- **类型**: client
- **作用**: 通用 chat 入口；如果 query 中带 `model=banana-2-pro|gpt-image-2` 则自动跳到专用工作台。
- **数据来源**: `useSearchParams()`。
- **关键依赖**: `dynamic(EnhancedChatInterface, { ssr: false })`、`@/components/ui/LoadingStateCard`、`@/lib/chat-session-routes`（`buildChatSessionRoute / normalizeChatSessionModel`）。
- **状态管理**: 无（依赖子组件）。
- **鉴权与权限**: 页面层无校验。
- **主要行为**:
  1. 在 `<Suspense>` 里渲染 `ChatPageContent`。
  2. `useEffect` 监听 searchParams，匹配 banana-2-pro / gpt-image-2 直接 `router.replace`。
  3. 否则渲染 `<EnhancedChatInterface />`。
- **⚠ 潜在问题**:
  - 残留中文 emoji 注释 + `console.log('🔍 [ChatPage] URL 参数 model:', model)`，生产应清理。
  - `dynamic(..., { ssr: false })`：好处是避免 SSR mismatch；坏处是首屏空白，丢失 SEO，已被 chat layout 静态 metadata 兜底。
  - useEffect 依赖 `searchParams, router`，未 cleanup（无副作用，但若 model 频繁变化会产生 redirect loop 风险）。

---

### `app/chat/layout.tsx`  →  `/chat/*`
- **类型**: server
- **作用**: 统一 metadata（chat 入口 SEO）。
- **数据来源**: 静态。
- **关键依赖**: 无。
- **状态管理**: 无。
- **鉴权与权限**: 无。
- **主要行为**: pass-through。
- **⚠ 潜在问题**:
  - `description` 截断 `...`、`canonical` 写死域名（同 analyze）。

---

### `app/chat/[model]/layout.tsx`  →  `/chat/[model]/*`
- **类型**: server
- **作用**: 给具体智能体子树注入 metadata。
- **数据来源**: 静态。
- **⚠ 潜在问题**:
  - `canonical: 'https://shenxiang.school/chat'` 把所有 model 子页 canonical 全指到了 `/chat`——**SEO 风险**，应该是 `/chat/${model}` 或 dynamic。

---

### `app/chat/[model]/page.tsx`  →  URL `/chat/<model>`
- **类型**: client
- **作用**: 通用智能体路由 + Banana 图像工作台特化。
- **数据来源**: `useParams()`，`SUPPORTED_MODELS` 白名单（22 个）：standard / general-chat / teaching-pro / gpt-5 / claude-opus / gemini-pro / banana-2-pro / suno-v5 / grok-4.2 / open-claw / quanquan-math / quanquan-english / vocab-card / beike-pro / banzhuren / ai-writing-paper / zhongying-essay / reading-report / experiment-report / study-abroad / resume-optimize / speech-defense / school-wechat。
- **关键依赖**: `dynamic(EnhancedChatInterface, { ssr: false })`、`dynamic(BananaImageWorkspace, { ssr: false })`、`notFound`。
- **状态管理**: 无。
- **鉴权与权限**: 无。
- **主要行为**:
  1. 校验 `params.model` 是否在白名单，不在则 `notFound()`。
  2. `model === 'banana-2-pro'` → 渲染 BananaImageWorkspace，其它走 EnhancedChatInterface。
- **⚠ 潜在问题**:
  - 将本来可以 `generateStaticParams`+ server 校验的白名单写成 client 校验，**白白把 22 个 model 名都打进 JS bundle**。
  - `notFound()` 在 client 组件里会触发 not-found 页，但失去 SSR 404 状态码，对 SEO 不友好。
  - `gpt-image-2` **不在白名单**——也就是说 `/chat/gpt-image-2` 不会走这里（通过专用 `app/chat/gpt-image-2/page.tsx` 命中），但 `/chat/page.tsx` 又有 normalize 跳转逻辑——架构不一致，banana-2-pro 在白名单中（被特殊渲染），gpt-image-2 不在白名单（必须走专用静态路由）。
  - 大量 `console.log('🔍 [ModelChatPage] ...')` 残留。

---

### `app/chat/creative-image-banana/page.tsx`  →  URL `/chat/creative-image-banana`
- **类型**: server
- **作用**: 旧路径，渲染 Banana 图像工作台。
- **数据来源**: 无。
- **关键依赖**: `@/components/chat/gpt-image2-chat-interface`。
- **状态管理**: 无（在子组件）。
- **鉴权与权限**: 无。
- **主要行为**: `<GptImage2ChatInterface workspaceModel="banana-2-pro" />`。
- **⚠ 潜在问题**:
  - 子组件本身可能是 client 组件（用 hooks），**而当前 page 是 server**，OK；但路径冗余：`/chat/creative-image-banana`、`/chat/banana-2-pro`、`/chat?model=banana-2-pro` 三条路径都指向同一界面，需要 canonical 收敛。
  - 没有 `metadata`。

---

### `app/chat/creative-image-gpt2/page.tsx`  →  URL `/chat/creative-image-gpt2`
- **类型**: server
- **作用**: 旧路径，渲染 GPT Image 2 工作台。
- **数据来源**: 无。
- **关键依赖**: `GptImage2ChatInterface`。
- **状态管理**: 无。
- **鉴权与权限**: 无。
- **主要行为**: 直接渲染。
- **⚠ 潜在问题**:
  - 同上，路径冗余。
  - 缺 metadata。

---

### `app/chat/gpt-image-2/page.tsx`  →  URL `/chat/gpt-image-2`
- **类型**: server
- **作用**: 主推路径，GPT Image 2 全屏对话。
- **数据来源**: 无。
- **关键依赖**: `GptImage2ChatInterface`。
- **状态管理**: 无。
- **鉴权与权限**: 无。
- **主要行为**: 渲染。
- **⚠ 潜在问题**:
  - 三个 image 工作台 page 文件几乎一模一样，**应抽到一个组件 + props**。

---

### `app/checkout/[productId]/page.tsx`  →  URL `/checkout/<productId>`
- **类型**: client
- **作用**: 购买商品确认页 + 调用 xunhupay 创建订单 + 跳转支付。
- **数据来源**: `PRODUCTS`（本地常量）、`/api/user/membership`、`/api/payment/xunhupay/create`、`@/lib/supabase/client`、`localStorage.currentUser`。
- **关键依赖**: shadcn UI、`@/lib/products`、`@/lib/beta-config`、`lucide-react`。
- **状态管理**: 多个 `useState`；用 `use(params)` 解 promise。
- **鉴权与权限**: 客户端层判断登录（混合 Supabase Session + localStorage Authing token），未登录推到 `/login?redirect=...`。
- **主要行为**:
  1. `checkAuth()` 同时尝试 Supabase getUser 和 localStorage.currentUser；调 `/api/user/membership` 拿会员状态。
  2. `requiresMembership(productId) && !hasActiveMembership(membershipStatus)` → 显示锁，按钮禁用。
  3. 点击支付 → fetch 创建订单 → 取 `data.url || data.pay_url || data.link` → 用动态 `<a>` 模拟点击跳转 → 2s 还在原页则展示“手动跳转”按钮。
  4. 支付方式硬编码：alipay / wechat 两个 SVG 按钮。
- **⚠ 潜在问题**:
  - **双源用户身份**（Supabase user 与 localStorage user）混用，逻辑混乱、易出现 user 信息不一致。
  - `getVerifiedAuthHeaders` 同时尝试 supabase token 和 localStorage idToken / authingToken / accessToken——把 Authing token 用 `Authorization: Bearer` 直接发给后端，**等于把 OAuth 的不同体系混到同一接口**，后端校验会变得脆弱。
  - 跳转策略用 `setTimeout(2000)` 兜底——若网络/支付平台稍慢就会同时显示“手动支付”和已经在跳转，UX 紊乱；并且 setTimeout 没有 cleanup。
  - 大量 `console.log` 残留（生产泄露用户/订单信息）。
  - 用 `alert(...)`、`alert("无法获取用户信息，请重新登录")` 做错误提示，非可访问。
  - `user: any`，缺类型。
  - 价格依赖前端硬编码 `PRODUCTS`，结合后端校验固然 OK，但前端 sticker 价格被恶意改不会影响最终金额（依赖后端），需明确说明。
  - 未对 `productId` 做白名单校验前就直接 fetch；只有 PRODUCTS 找不到才 `notFound()`，但 useEffect 已经先发了 membership 请求。
  - `useEffect(() => {...}, [])` 依赖数组省掉了 `loginRedirectUrl`，无 lint warning 但概念上不严谨。

---

### `app/credits/page.tsx`  →  URL `/credits`
- **类型**: server (`export const dynamic = 'force-dynamic'`)
- **作用**: 我的积分 / 推荐码 / 邀请链接 / 积分使用说明。
- **数据来源**: `createServerClient()` + `getUserCredits` + `getUserReferralCode` + `supabase.from('referrals').select('*').eq('referrer_id', user.id).eq('status', 'completed')`。
- **关键依赖**: shadcn UI、`@/lib/supabase/server`、`@/lib/credits`、`@/components/credits/copy-button`、`ShenxiangInterfaceIcon`。
- **状态管理**: 无（RSC）。
- **鉴权与权限**: server 端 `supabase.auth.getUser()` 拿不到则 `redirect('/auth/login')`。
- **主要行为**:
  1. 强制服务端校验登录。
  2. 取积分、推荐码、已完成推荐数。
  3. 拼分享 URL：`process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'`。
  4. 渲染三张卡 + 邀请链接 + 积分规则。
- **⚠ 潜在问题**:
  - `'https://your-domain.com'` 这种**占位符域名**作为 fallback，生产若 env 漏配会泄露给用户。
  - `referrals` 查询是 N+1 风险的反模式——这里只是 count，可改为 `select('id', { count: 'exact', head: true })` 节省网络。
  - referralEarnings = `referralCount * 1000` 是前端硬算，应统一以服务端记录为准，否则邀请上限/活动调整时不一致。
  - 直接在 page.tsx 中写 `supabase.from('referrals')`——违反“page.tsx 不直接连 supabase”的原则；应抽到 `lib/referrals.ts`。
  - 重定向到 `/auth/login`，但全站新登录入口是 `/login`（`/auth/login` 又是 redirect 到 `/login`），多一跳。

---

### `app/essay/page.tsx`  →  URL `/essay`
- **类型**: server
- **作用**: 作文批改入口（渲染 EssayGrader）。
- **数据来源**: 子组件。
- **关键依赖**: `@/components/essay-grader`。
- **状态管理**: 无。
- **鉴权与权限**: 页面层无。
- **主要行为**: 输出 metadata + 渲染 grader。
- **⚠ 潜在问题**:
  - 同 analyze：硬编码 URL、description 截断 `...`。

---

### `app/health/page.tsx`  →  URL `/health`
- **类型**: server
- **作用**: 运维健康检查说明页（指向 `/api/health` JSON 接口）。
- **数据来源**: 静态文本数组。
- **关键依赖**: `next/link`、`lucide-react`。
- **状态管理**: 无。
- **鉴权与权限**: 公开（但内容仅写运维提示，**不展示真实 env / 连接串**，描述清楚——做得比较规范）。
- **主要行为**: 渲染说明 + 进入 `/api/health` 链接。
- **⚠ 潜在问题**:
  - 该页公开访问，搜索引擎可索引；建议 `metadata.robots = noindex`。
  - sitemap 没收录该页（OK），但 robots.ts 也没 disallow `/health`，会被爬虫抓到。

---

### `app/help/layout.tsx`  →  `/help/*`
- **类型**: server
- **作用**: 注入 metadata + 注入 FAQPage JSON-LD（`<script type="application/ld+json">`）。
- **数据来源**: 静态。
- **关键依赖**: 无。
- **状态管理**: 无。
- **鉴权与权限**: 无。
- **主要行为**: 渲染 schema script + children。
- **⚠ 潜在问题**:
  - 把 FAQ 内容硬编码在 layout，与 page 中的 `faqCategories` 重复维护——两边数据不同步会导致 SEO 与 UI 不一致。
  - 用 `dangerouslySetInnerHTML` 注入 schema 是常规做法，没问题；但 schema 里的 phone/email 等敏感联系方式硬编码。

---

### `app/help/page.tsx`  →  URL `/help`
- **类型**: client (`'use client'`)
- **作用**: FAQ 帮助中心，含动画。
- **数据来源**: 静态 `faqCategories` 数组、`contactInfo` 常量、本地 `/images/design-mode/站长微信.jpg`。
- **关键依赖**: `next/image`、`framer-motion`、`@/components/icons/ShenxiangInterfaceIcons`、`@/lib/design-tokens`。
- **状态管理**: 每个 FAQItem 内 `useState(isOpen)`。
- **鉴权与权限**: 公开。
- **主要行为**:
  1. 渲染 hero（带 5 个 motion 漂浮光斑）。
  2. 三个 QuickLink 卡片。
  3. 4 个 FAQ 分类，每条问答可折叠。
  4. ContactSection（二维码 + 电话 + 在线客服按钮）。
- **⚠ 潜在问题**:
  - **极重的 framer-motion 使用**：5 个无限循环光斑 + 标题文字 textShadow 无限闪烁 + 每个 FAQItem 入场动画——CPU/GPU 持续工作；移动端电耗与可访问性差，**应尊重 `prefers-reduced-motion`**。
  - 整页可以是 server + 仅 FAQItem 是 client 子组件，目前直接 client 全页面。
  - JSON-LD 的 FAQ 与本页 UI FAQ 数据是两份独立文案。
  - `contactInfo` 写死。
  - `motion.path` 用 pathLength 动画但波浪 SVG 已经被 fill，pathLength 无效。
  - hero 区文字阴影 `textShadow` 用 `animate` 写在 motion.div 上但实际不会被 framer-motion 真正动画化（CSS 属性 textShadow framer-motion 支持，OK，但作用范围错误，加在 wrapper div 不在文字上）。
  - 3 张 QuickLinks 每张 `whileHover={{ scale: 1.03 }}` + 内部 motion.div 旋转，过度交互。

---

### `app/history/page.tsx`  →  URL `/history`
- **类型**: client
- **作用**: 我的历史：聊天会话 + 作文批改记录。
- **数据来源**: `/api/chat-session`、`/api/save-essay-review`、`localStorage.currentUser`。
- **关键依赖**: shadcn UI、`@/lib/chat-session-routes`。
- **状态管理**: `sessions / reviews / loading / isLoggedIn`。
- **鉴权与权限**: 通过 `localStorage.idToken / authingToken / accessToken` 取 token；后端 401 → 显示“请先登录”。
- **主要行为**:
  1. mount 时读 localStorage，并发 fetch 两个接口。
  2. 401 显示登录引导；ok 显示卡片列表。
  3. 每个 session 有“继续对话”按钮跳到对应 chat 路由。
- **⚠ 潜在问题**:
  - 用户身份从 `localStorage.currentUser` 推断（`user.id || user.sub || user.userId || user.user_id`），却没真正用 userId 发请求——纯靠 token；这意味着 localStorage 没被改时仍然显示登录态。
  - `console.log("[v0] ...")` debug 残留。
  - 没有分页，可能拉回全量历史。
  - `Promise.all` 并发但任一接口 401 时分支处理不一致（可能 `setSessions([])`，但 reviews 401 直接落到 catch）。
  - `e: any`、隐式 any。
  - 不关心 unmount race condition。
  - 整页应该 server-render（带 SSR 鉴权），目前 hydration 闪烁。

---

### `app/icon-lab/page.tsx`  →  URL `/icon-lab`
- **类型**: client
- **作用**: 内部图标设计实验室（H 方案预览）。
- **数据来源**: `SHENXIANG_ICON_CATALOG`、`SHENXIANG_INTERFACE_ICON_CATALOG`。
- **关键依赖**: 自定义 icon 组件。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 全套图标矩阵渲染（深色压力测试 + 小尺寸可读性测试）。
- **⚠ 潜在问题**:
  - **本质是开发者内部工具，不应该暴露在生产路由**（且无 auth、无 noindex），应放到 `/admin` 子树或在生产 build 中排除。
  - 整页静态内容却 `'use client'`——浪费 hydration。
  - `robots.ts` 没 disallow `/icon-lab`。

---

### `app/invite/page.tsx`  →  URL `/invite`
- **类型**: client
- **作用**: 邀请好友页面 + 拉取/生成推荐码 + Web Share / 复制。
- **数据来源**: `/api/referral/get-code`、`/api/user/membership`、`supabase.from('referrals')` **直连**、`localStorage.currentUser`。
- **关键依赖**: `@supabase/supabase-js`（**直接 createClient**！）、`framer-motion`、`sonner`、`next/image`、自定义 icons。
- **状态管理**: 多个 `useState`。
- **鉴权与权限**: localStorage 用户判断；未登录 `router.push('/login')`。
- **主要行为**:
  1. mount 加载用户：拿 referralCode（API 失败时本地 generate）；查 referrals 累计奖励；遍历多种 userId 候选 (`id/sub/userId/user_id/_id/phone/email/...`) 调 `/api/user/membership` 找会员状态。
  2. 渲染邀请链接 + 立即分享按钮（微信内复制提示，桌面用 `navigator.share` 否则复制）。
- **⚠ 潜在问题**:
  - **`process.env.NEXT_PUBLIC_SUPABASE_URL!` + `NEXT_PUBLIC_SUPABASE_ANON_KEY!` 在客户端初始化 supabase**——本身合法（anon key 是 public），但**直接在 page 中查 referrals 表**违反“统一封装”原则，且如果 RLS 配置错误会泄露其它人的数据。
  - **遍历 user.phone / user.email 当作 userId 调 `/api/user/membership`**——这是一个非常脆弱的反模式，正确做法是后端通过 token 认证；现在等于把任意 phone/email 当 userId 发出去，给了枚举他人会员状态的入口。
  - 大量 emoji + console.log，泄露用户对象（`JSON.stringify(parsedUser, null, 2)`）。
  - `generateReferralCode` 在 referralCode API 失败时本地随机生成，**与服务端不一致**会导致用户邀请链接成为孤儿。
  - `e: any`、`user: any`。
  - 多个长时间无限循环 framer-motion 光斑动画（同 help）。
  - `inviteLink` 用 `typeof window !== 'undefined' ? window.location.origin : ''`，SSR 阶段为空，需注意闪烁。
  - 微信浏览器检测靠 UA `MicroMessenger`——粗糙但够用。

---

### `app/login/layout.tsx`  →  `/login/*`
- **类型**: server
- **作用**: 注入 noindex/nofollow。
- **数据来源**: 静态。
- **⚠ 潜在问题**: 无。

---

### `app/login/page.tsx`  →  URL `/login`
- **类型**: client (`'use client'`)
- **作用**: Authing Guard 登录组件（动态加载 npm 包 + CDN 样式）。
- **数据来源**: `process.env.NEXT_PUBLIC_AUTHING_APP_ID`、Authing CDN。
- **关键依赖**: `@authing/guard`（动态 import）、`next/navigation`。
- **状态管理**: `useRef(guardRef)`、`isLoaded`、`loadError`。
- **鉴权与权限**: 此页就是登录入口。
- **主要行为**:
  1. 先看 localStorage 已有用户 + token，是则 `router.replace(redirectPath || '/')`。
  2. 注入 `<link rel="stylesheet" href="https://cdn.authing.co/...">`（**外部 CDN**）。
  3. 10s 超时保护。
  4. 动态 `import('@authing/guard')` → `new Guard({ appId, mode: 'normal' })` → 监听 `login` 事件 → 把 user / token 写 localStorage → POST `/api/auth/sync` → router.replace(redirect)。
- **⚠ 潜在问题**:
  - **加载第三方 CDN CSS** + 动态 npm 包，攻击面大；如果 cdn.authing.co 被劫持可注入 XSS。建议本地打包样式或用 SRI。
  - **token 全部存 localStorage**（idToken/accessToken/authingToken），XSS 即被偷。
  - useEffect 依赖数组里包含 `isLoaded`——但 `isLoaded` 在内部又会被 setIsLoaded(true) 修改，可能触发 effect 多次执行；当前 `if (guardRef.current) return` 兜底，但仍是反模式。
  - `link` 标签插入 head 后没有 cleanup（页面被卸载样式残留全局）。
  - `setTimeout(timeoutId)` 在 guard 初始化失败的 catch 里 clear 了，但在“成功初始化但 onload 未触发”路径里没保护好。
  - 用 inline style 大量 hardcoded 颜色（#10A37F、#fee 等）。
  - `error: any`，TS 滥用。
  - redirect 的解码 `decodeURIComponent` 没做白名单校验，**开放重定向风险**：`/login?redirect=https%3A%2F%2Fevil.com`，attacker 钓鱼。

---

### `app/parent/page.tsx`  →  URL `/parent`
- **类型**: server
- **作用**: 家长落地页（hero / features / interaction / growth / ai-learning + footer）。
- **数据来源**: 静态组件。
- **关键依赖**: `@/components/parent/*`、`@/components/footer`。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 拼装 5 个 section + footer。
- **⚠ 潜在问题**:
  - description 截断 `...`、URL 硬编码（与 analyze 同）。

---

### `app/payment/page.tsx`  →  URL `/payment`
- **类型**: server
- **作用**: 旧 payment 路径 redirect 到 `/pricing`。
- **⚠ 潜在问题**: 同其它 redirect 页：建议 `permanentRedirect`/next.config 做 301。

---

### `app/payment/success/page.tsx`  →  URL `/payment/success`
- **类型**: client
- **作用**: 支付结果确认页（轮询订单状态）。
- **数据来源**: `/api/payment/status/[orderNo]`。
- **关键依赖**: shadcn UI、`lucide-react`。
- **状态管理**: `status / order / message`。
- **鉴权与权限**: 401 → 提示需要登录。
- **主要行为**:
  1. 取 query `orderNo` 或 `trade_order_id`。
  2. fetch status，根据 status `paid/pending/failed/error/not_found/unauthorized` 切换 UI 状态。
  3. 提供刷新按钮（`window.location.reload()`）。
- **⚠ 潜在问题**:
  - **没有自动轮询** 仅一次 fetch，pending 用户必须手动刷新；并且“刷新”用了整页 reload，应改为重新调用 fetch。
  - 使用 `cancelled` flag 取消，OK；但 setStatus("error") 在 unmount 后被调用还是没 effect 因为有 `if (cancelled) return`。
  - 支付金额、订单号直接展示——OK，但应避免在分享/截图场景泄露。
  - `formatTime` 用 `toLocaleString('zh-CN')`，时区差异；client OK。

---

### `app/payment/wechat/[orderNo]/page.tsx`  →  URL `/payment/wechat/<orderNo>`
- **类型**: client
- **作用**: 微信扫码支付页：生成二维码 + 3s 轮询订单状态。
- **数据来源**: `/api/payment/wechat/create`、`/api/payment/status/[orderNo]`。
- **关键依赖**: `qrcode` 库、shadcn UI。
- **状态管理**: `status / order / qrCodeUrl / error`。
- **鉴权与权限**: 接口层处理。
- **主要行为**:
  1. 进入页面先 `checkStatus()` 一次。
  2. 然后 POST `/api/payment/wechat/create` 拿 codeUrl → QRCode.toDataURL 生成 png base64。
  3. 启动 `setInterval(checkStatus, 3000)`，paid 时 router.push 到 success 页。
  4. unmount cleanup `clearInterval`。
- **⚠ 潜在问题**:
  - **每 3 秒轮询**而非 SSE/WebSocket，浪费请求；并且无指数退避，超长 pending 会持续打接口。
  - QR 二维码图片用 `<img src={dataURL}>`，加了 eslint-disable 注释保留 native img；OK 但 alt 说明可加 `aria-describedby`。
  - 进入页面发了两个串行请求（先 status 再 create），实际上 create 应该幂等且可以并行。
  - `redirectOnPaid=true` 在 paid 时 push 到 success——若用户多次 push，浏览器历史会乱（可改 `replace`）。
  - `error` 显示在 description 里没 `role="alert"`。
  - cancelled flag 与 pollTimer 双重保护，可读性还行。
  - useEffect cleanup 完整，比许多其他页好。

---

### `app/pricing/layout.tsx`  →  `/pricing/*`
- **类型**: server (`export const dynamic = 'force-dynamic'`)
- **作用**: 定价页统一 metadata + 强制不缓存。
- **⚠ 潜在问题**:
  - `force-dynamic` + `revalidate = 0`：定价页本应是相对静态（套餐变动不频繁），全 dynamic 会丢 CDN 缓存收益；只为“RSC/action 引用”而牺牲性能不划算。

---

### `app/pricing/page.tsx`  →  URL `/pricing`
- **类型**: client
- **作用**: 拉取当前用户会员状态后渲染 `<Pricing />` 组件。
- **数据来源**: `/api/user/membership?user_id=...` + localStorage.currentUser。
- **关键依赖**: `@/components/pricing`、`@/components/footer`。
- **状态管理**: `useState(currentSubscription)`。
- **鉴权与权限**: 软鉴权（无 user 时不显示订阅状态）。
- **主要行为**: useEffect 取 user → fetch membership → setCurrentSubscription。
- **⚠ 潜在问题**:
  - **把 userId 当 query 发给 `/api/user/membership`**——同 invite 页问题：后端正确做法应基于 token 而非客户端传 userId（否则可枚举）。
  - 整页可以 server render（用 cookies 拿 user，避免 hydration 闪烁）。
  - useEffect 没 abort。
  - `e: any`、`error: unknown` 混用。
  - `currentSubscription === undefined` 与 `=== "免费"` 特殊处理——逻辑分散。

---

### `app/privacy/page.tsx`  →  URL `/privacy`
- **类型**: client
- **作用**: 隐私政策静态条款。
- **数据来源**: 静态。
- **关键依赖**: `next/link`、`lucide-react`、`design-tokens`。
- **状态管理**: 无。
- **鉴权与权限**: 公开。
- **主要行为**: 8 个章节 + 底部导航。
- **⚠ 潜在问题**:
  - 完全静态却 `'use client'`，应 server。
  - `new Date().getFullYear()...getMonth() + 1...getDate()` 每次渲染计算，意义不大（“更新日期”应是真实编辑日期）。
  - 缺 `metadata`。

---

### `app/refund-policy/page.tsx`  →  URL `/refund-policy`
- **类型**: client
- **作用**: 退款政策静态条款。
- **同 privacy 的问题**：'use client' 滥用、缺 metadata、用动态日期当“更新日期”。

---

### `app/settings/page.tsx`  →  URL `/settings`
- **类型**: client
- **作用**: 用户中心：头像 / 昵称 / 会员 / 邀请统计 / 积分流水 / 隐私入口。
- **数据来源**: `@supabase/supabase-js` 直连（`createClient`）+ `/api/user/credits`、`/api/user/membership`、`/api/user/transactions`、`/api/user/update`、`supabase.from('invite_codes')` 直查。
- **关键依赖**: shadcn UI、`sonner`、自定义 icons。
- **状态管理**: 大量 `useState`。
- **鉴权与权限**: 通过 supabase getSession 或 localStorage authing token 拿 Authorization header。
- **主要行为**:
  1. 初始化用户：从 localStorage 拿 user，并发拉积分 / 会员 / 邀请码 / 积分流水。
  2. 上传头像：`supabase.storage.from('avatars').upload(...)` → getPublicUrl → setAvatarUrl。
  3. 保存修改：POST `/api/user/update`。
  4. 退出登录：`supabase.auth.signOut()` + 清 localStorage + push `/login`。
- **⚠ 潜在问题**:
  - **直接在 page.tsx 创建 supabase client 并查 invite_codes 表**——违反“统一封装”，且依赖前端 RLS。
  - localStorage 直接信任：`localStorage.getItem('currentUser')` parse 后立即 setUser，无 token 校验，刷新即过期但仍显示用户名。
  - `cacheControl: '3600', upsert: true`：upload 用 `avatar_${Date.now()}.${ext}` 文件名，每次上传都是新文件，**永远不会复用 cache**——但又设 `upsert: true` 没意义，且**老头像不会被删除**，存储泄漏。
  - `setTimeout(window.location.reload, 800)` 强刷整页——粗暴。
  - 大量 `console.error("初始化用户失败:", e)` 信息丢失。
  - `eslint-disable @next/next/no-img-element` 的注释用了，但其实头像可以直接用 `<Image>`。
  - 表格行无分页（最多 slice(0,10)），但 `/api/user/transactions` 没有 limit/offset 参数。
  - “导出 / 删除账户”按钮只是弹一个让用户联系客服的对话框——是 placeholder，严格说不符合 GDPR 等数据主体权利。
  - 头像上传之前没做大小 / 类型校验。
  - useEffect 空依赖数组里调用了带 `setUser/setCredits/...` 的 async 函数，无 abort。
  - `getVerifiedAuthHeaders` 与 checkout/page 重复实现，应抽到 `lib/`。

---

### `app/share/[id]/page.tsx`  →  URL `/share/<id>`
- **类型**: client
- **作用**: 公开分享页：渲染分享内容（对话或单条 markdown），打印 PDF。
- **数据来源**: `supabase.from('shared_content').select('content, title, view_count, created_at').eq('share_id', shareId).single()` + 同表 update view_count。
- **关键依赖**: `@supabase/supabase-js`、自实现 markdown 渲染（InlineText / TableBlock / ContentRenderer / MessageItem）、`sonner`。
- **状态管理**: `loading / error / shareData / parsedData`。
- **鉴权与权限**: 公开。
- **主要行为**:
  1. fetch shared_content；解析 content 为 JSON（type=conversation/single）；增加 view_count。
  2. 渲染头部 + 内容（对话气泡 or markdown）。
  3. 复制 / 导出 PDF（开新窗口写入 HTML 后调 print）。
- **⚠ 潜在问题**:
  - **手写 markdown 渲染器**——复杂又不安全。`convertMarkdownToHTML` 后**直接 `printWindow.document.write(htmlContent)`**——尽管 source 来自 supabase，但分享内容是用户输入文本，**这是 XSS 风险**：用户可写 `<img src=x onerror=...>` 之类，由于 markdown 转换没有 escape，会被原样写入新窗口。
  - 同时 `ContentRenderer` 用 React 渲染 `<InlineText text={...} />` 文本会被 escape，相对安全。但 `convertMarkdownToHTML` 走的是非受控 HTML 注入路径。
  - view_count 增加放在 fetch 后异步更新，没鉴权——任何人刷接口都能刷计数。
  - 直接连 supabase + 读 anon 表，违反统一封装。
  - 错误处理粗糙：`catch { return null }`、`catch (e) { return null }` 隐藏问题。
  - useEffect 没 abort。
  - 没有 loading skeleton，仅 spinner。
  - 缺 `metadata`，分享出去时 OG 不友好。

---

### `app/teacher/page.tsx`  →  URL `/teacher`
- **类型**: server
- **作用**: 教师落地页。
- **同 parent**：description 截断、URL 硬编码。

---

### `app/terms/page.tsx`  →  URL `/terms`
- **类型**: client
- **同 privacy/refund-policy**：纯静态却 `'use client'`、缺 metadata、动态日期当“更新日期”。

---

### `app/test/page.tsx`  →  URL `/test`
- **类型**: server
- **作用**: 测试仪表盘 `<TestDashboard />`。
- **数据来源**: 子组件。
- **⚠ 潜在问题**:
  - **测试页直接放在生产路由**且无 auth、无 noindex。robots.ts 没 disallow `/test`。强烈建议下线或环境隔离。
  - 缺 metadata。

---

### `app/error.tsx`  →  全局 page-level 错误边界
- **类型**: client (`'use client'` 必须)
- **作用**: server 渲染异常时显示。提供 reset / 返回首页 / 帮助页 + 客服联系方式。
- **数据来源**: 静态。
- **⚠ 潜在问题**:
  - `error` 参数未使用（仅 reset），不上报到日志服务（Sentry/PostHog 等），生产难定位。
  - 无障碍：跳过 nav、focus 样式做得不错；但客服二维码是占位 div，没真实图。

---

### `app/global-error.tsx`  →  根布局级错误边界
- **类型**: client
- **作用**: 根布局崩溃时降级显示（含 `<html>` `<body>`）。
- **⚠ 潜在问题**:
  - 与 `app/error.tsx` 内容**几乎完全重复**——应抽组件。
  - 同样未上报错误。

---

### `app/not-found.tsx`  →  404
- **类型**: client
- **作用**: 404 页面 + 搜索框 + 热门链接。
- **关键依赖**: `next/link`、`lucide-react`、`useRouter`。
- **状态管理**: `searchQuery`。
- **主要行为**: 输入 query → push `/chat/standard?query=...`。
- **⚠ 潜在问题**:
  - “搜索”实际上是把关键词塞到 chat 的 standard 模型——容易让用户误以为是站内搜索。
  - 不报告 404 给监控，有助于发现死链就不到。
  - sitemap.ts 内已经把 redirect 类页面（如 /ai-writing）当作正常页输出，配合本 404 容易出现 inconsistent state。

---

### `app/robots.ts`  →  `/robots.txt`
- **类型**: server (Next metadata route)
- **作用**: 生成 robots.txt。
- **数据来源**: 静态。
- **主要行为**:
  ```
  User-agent: *
  Allow: /
  Disallow: /admin /login /auth /settings /credits /checkout
  Sitemap: https://shenxiang.school/sitemap.xml
  ```
- **⚠ 潜在问题**:
  - **没 disallow `/icon-lab`、`/test`、`/health`、`/share`、`/payment`、`/invite`**——这些都是要么内部、要么用户私域、要么动态结果，应该被 noindex。
  - 仅一条规则块，未区分爬虫；可针对 GPTBot / CCBot 做更精细控制。
  - sitemap URL 硬编码，应改为 `process.env.NEXT_PUBLIC_SITE_URL`。

---

### `app/sitemap.ts`  →  `/sitemap.xml`
- **类型**: server (Next metadata route)
- **作用**: 生成站点地图。
- **数据来源**: 静态数组。
- **主要行为**: 输出 12 条静态 URL。
- **⚠ 潜在问题**:
  - **`/ai-writing` 实际重定向到 `/chat/ai-writing-paper`，仍被列入 sitemap**——爬虫会拿到 redirect 链路。
  - 缺 `/about`、`/chat/<model>`（每个 supported model）。
  - 全部 URL 硬编码 `https://shenxiang.school`，应来自 env。
  - `lastModified: new Date()` 每次构建都是新时间，搜索引擎会以为内容刚更新；应使用真实变更时间或干脆省略。

---

## 🌐 全局横向问题（跨页面反模式）

1. **`'use client'` 滥用**
   `about / privacy / terms / refund-policy / wechat-login / icon-lab / help` 等纯静态条款 / 内部工具页全部被打成 client 组件。这些页面没有任何状态或事件，完全可以 server-render，能减少 hydration 成本与 JS bundle，并改善 SEO。

2. **`localStorage` 存敏感凭据**
   `admin_token / authingToken / idToken / accessToken / currentUser` 全部存 localStorage——XSS 一发即被偷。整个鉴权体系应改为 httpOnly cookie + server middleware 校验。

3. **双源 / 多源用户身份系统**
   Supabase Auth + Authing Guard + localStorage.currentUser 三套体系并存，多个页面有 fallback 链：`user.id || user.sub || user.userId || user.user_id || user._id || user.phone || user.email`。导致鉴权脆弱、可枚举（见 invite/page.tsx 用 phone/email 当 userId 调接口）。建议统一为单一身份源。

4. **page.tsx 直接连 Supabase**
   违反“统一封装”原则的页面：`credits/page.tsx (server)`、`invite/page.tsx (client)`、`settings/page.tsx (client)`、`share/[id]/page.tsx (client)`，且都使用 anon key 直查 referrals/invite_codes/shared_content 表，强依赖 RLS 配置。建议全部走 `/api/...` 或 `lib/supabase/server.ts` + RSC。

5. **生产域名 / 联系电话 / 邮箱硬编码**
   `https://shenxiang.school` 出现在 metadata 多处、`19132896773` 与 `support@shenxiang.school` 出现在 about / privacy / terms / help / refund-policy / error / global-error / not-found 等十余处。应抽离 `lib/site-config.ts`。`'https://your-domain.com'` 占位符 fallback（credits/page.tsx）有泄露风险。

6. **大量 console.log / debug 注释残留**
   `[v0]`、`🔍 [ChatPage]`、`🔍 [邀请页] 完整用户对象: JSON.stringify(parsedUser, null, 2)` 等在生产会泄露用户信息到 devtools / 上报系统。需在 lint 规则上禁用或包到 `if (process.env.NODE_ENV !== 'production')`。

7. **`useEffect` 副作用无 cleanup**
   - `email-login/page.tsx` 倒计时 setTimeout 链；
   - `history/page.tsx`、`settings/page.tsx`、`pricing/page.tsx`、`invite/page.tsx`、`checkout/[productId]/page.tsx`、`admin/page.tsx` 多处 fetch 无 AbortController，组件卸载时 race condition。
   - 仅 `payment/wechat/[orderNo]/page.tsx` 与 `payment/success/page.tsx` 使用了 cancelled flag，质量较好。

8. **错误提示用 `alert(...)`**
   `admin / sign-up / checkout / login` 等页面用 native alert 提示错误，违反可访问性 + 现代化 UI 规范。应统一换成 `toast` 或 `Alert` 组件。同时多数错误反馈缺 `role="alert"` / `aria-live`。

9. **TS 滥用 `any`**
   `user: any`、`err: any`、`error: any`、`data: any`、`e: any`——几乎所有客户端页面都有，丧失类型保护。

10. **Open Redirect 风险（login）**
    `/login?redirect=...` 直接 `decodeURIComponent` 后 `router.replace`，攻击者可构造外站链接做钓鱼。需要白名单（仅允许同域或 `/` 开头）。

11. **'devCode' 在前端可见**
    `email-login/page.tsx` 把后端返回的 `devCode` 直接渲染。如生产环境后端误开 dev 模式，OTP 立刻泄露。前端应仅在 `process.env.NEXT_PUBLIC_ENV !== 'production'` 时显示。

12. **canonical / metadata 错误**
    - `chat/[model]/layout.tsx` 把所有动态 model 的 canonical 全设到 `/chat`，SEO 风险；
    - 多个 `description: "...".` 截断；
    - `ai-writing/paper`、`creative-image-banana`、`creative-image-gpt2` 等无 metadata；
    - `auth/error`、`icon-lab`、`test`、`health` 缺 noindex。

13. **死路由 / 路径冗余**
    - `/ai-writing/paper` 实际上没人能到达（`/ai-writing` 已 redirect 到 `/chat/ai-writing-paper`）；
    - `/chat/creative-image-banana`、`/chat/banana-2-pro`、`/chat?model=banana-2-pro` 三条路径指向同一界面；
    - `/chat/creative-image-gpt2`、`/chat/gpt-image-2`、`/chat?model=gpt-image-2` 三条路径指向同一界面。
    - 应通过 next.config redirects 收敛或加 canonical。

14. **sitemap 与 robots 不匹配**
    - sitemap 包含会重定向的 `/ai-writing`；
    - 缺 `/about`、`/chat/<model>` 等可索引页；
    - robots disallow 漏掉 `/icon-lab`、`/test`、`/health`、`/share`、`/payment`、`/invite`。

15. **过度的 framer-motion 动画**
    `help / invite` 页都有持续无限循环的光斑、阴影、形变动画，CPU/GPU 持续运转，移动端电耗大。需要尊重 `prefers-reduced-motion`。

16. **错误监控缺失**
    `error.tsx`、`global-error.tsx` 都没把 error 上报到监控平台（Sentry / 自家 `/api/log` 等）。生产事故难溯源；并且 `error.tsx` 与 `global-error.tsx` 内容重复 90%，缺组件抽取。

17. **轮询而非订阅**
    `payment/wechat/[orderNo]/page.tsx` 3 秒轮询 + `payment/success` 仅一次 fetch（无轮询）——订单确认体验不一致；建议改 SSE/WebSocket 或至少在 success 页也加自动轮询。

18. **资源浪费**
    - `settings/page.tsx` 头像每次新建文件名 + upsert 永不复用 cache，旧头像永不清理；
    - `admin` 用户表 / 订单表无分页，潜在 OOM；
    - `chat/[model]/page.tsx` 把 22 个 model 名打进 client bundle。

19. **可访问性**
    - `admin` 表格无 caption；
    - 多页错误提示用 `<div className="text-red...">{error}</div>` 缺 `role="alert"`；
    - 部分非语义 div 当按钮（FAQItem 用 button 较好，但卡片整块点击有的用 div）；
    - 浮动光斑 + 无限闪烁标题对低视力 / 前庭障碍用户不友好。

20. **价格 / 套餐数据双源**
    `credits/page.tsx` 把 `referralCount * 1000` 当作 `referralEarnings`；`pricing` 通过 `/api/user/membership?user_id=...` 拿订阅状态——前端业务规则散落多处，调整价格/活动时容易不一致。建议把套餐、积分规则、邀请奖励上限等抽到单一 source of truth（已有 `@/lib/products` `@/lib/credits`，但未统一使用）。
