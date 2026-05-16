# 沈翔智学 ai-essay-editor — 不合理点 & 改进建议（汇总报告）

> 整合 `docs/_audit_pages.md` / `_audit_api.md` / `_audit_lib.md` / `_audit_components.md` / `_audit_services.md` 五份审计的**全部问题**，按风险与影响排序。
>
> 每条问题给出：**问题** → **位置** → **影响** → **建议**。

---

## P0 — 上线前必须修复（安全 / 资金 / 数据完整性）

### P0-1. 多个核心 API 把客户端传来的 `userId` 当鉴权来源
- **位置**：`app/api/chat/route.ts`、`app/api/suno/route.ts`、`app/api/share/route.ts`、`app/api/share/claim-reward/route.ts`、`app/api/referral/get-code/route.ts`、`app/api/referral/process/route.ts`、`app/api/stripe/checkout-session/route.ts`、`app/api/essay-grade/route.ts`、`app/api/essay-review/route.ts`、`app/api/sparkpage/route.ts`、`app/api/ocr/route.ts`、`app/api/document-process/route.ts`、`app/api/web-search/route.ts`、`app/api/voice/{stt,tts}/route.ts`、`app/api/tts/route.ts`、`app/api/presentation/route.ts`、`app/api/user/update/route.ts`。
- **影响**：匿名调用者可：
  1. 通过 `body.userId` 让别人扣分跑 AI；
  2. 给任意人刷推荐 / 分享奖励（每条 1000 积分，referrer 最高 50000）；
  3. **任意修改他人昵称 / 头像**（`/api/user/update` 还内置「全网通缉」用手机号子串模糊匹配）；
  4. 烧 GPT-4o / Claude Opus / Gemini token 成本。
- **建议**：所有上述路由必须 `const auth = await requireUser(request); if (auth.response) return auth.response;`，再用 `auth.user!.id` 替代 body 里的 userId；同时 `lib/supabase/middleware.ts` 的 `PROTECTED_API_ROUTES` 把这些路径都列入。

### P0-2. `/api/openclaw-media-sign/[...path]` 公开签发任意路径的签名 URL
- **位置**：`app/api/openclaw-media-sign/[...path]/route.ts`。
- **影响**：签名机制完全无效——攻击者可对任意 OpenClaw media path 调此接口拿到合法签名，直接绕开 `/api/openclaw-media/[...path]` 的「未签名时要登录」分支。配合 `app/api/openclaw-media/[...path]/route.ts` 第二条 P0 漏洞（仅校验「是否登录」，不校验 owner），任何注册用户即可越权读取所有用户生成的 PPT / 媒体。
- **建议**：`/api/openclaw-media-sign` 加 `requireUser`，并把 `userId` 编码进签名 payload；服务端再校验访问者 = 资源 owner。

### P0-3. `/slides/[...path]` 公开 + `text/html` 直出
- **位置**：`app/slides/[...path]/route.ts`。
- **影响**：在 `https://shenxiang.school/slides/<谁的 path>/index.html` 下渲染**用户生成的 HTML**——stored XSS / 钓鱼托管 / 偷同站 cookie 风险。
- **建议**：要求登录 + owner 校验；HTML 可改为 `Content-Disposition: attachment` 或必须同站 iframe 嵌入（`X-Frame-Options: SAMEORIGIN` + 严格 CSP）。

### P0-4. `/api/auth/verify-email-otp` 把 magiclink action_link 直接返回前端
- **位置**：`app/api/auth/verify-email-otp/route.ts`。
- **影响**：前端会把这个一次性 magiclink 通过 `window.location.href` 跳转执行——意味着该链接一旦被中间网络截获 / Network 面板截图泄露，攻击者立即接管账号。
- **建议**：服务端用 `auth.admin.generateLink('magiclink')` 后**直接 setSession + 写 httpOnly cookie**，前端只收到 `{ success: true }`，不再传递 magiclink。

### P0-5. `lib/email-otp-store.ts` 把整张 OTP 表 `console.log`
- **位置**：`lib/email-otp-store.ts:set/get` + `app/api/auth/verify-email-otp/route.ts` 多处。
- **影响**：日志聚合（Sentry / 后端日志）会保留所有正在生效的邮件验证码，任何持有日志读权限的人即可盗号。
- **建议**：删除 `console.log("[v0] 当前存储: ...")`、`console.log("[v0] 找到验证码: ${data.code}")` 等敏感日志；用 `crypto.randomInt(100000, 1000000)` 代替 `Math.random()`；切换到 Redis / Supabase 表（多实例）。

### P0-6. 微信支付链路是占位 demo（收钱不到货）
- **位置**：`lib/wechat-pay.ts`、`app/payment/wechat/[orderNo]/page.tsx`、`app/api/payment/wechat/create`（如真实存在）。
- **影响**：`createOrder` 没有真正调微信 unifiedorder API，`weixin://wxpay/bizpayurl?pr=${out_trade_no}` 是伪二维码——用户无法完成微信支付；前端却仍在 `/payment/wechat/[orderNo]` 路径上轮询。
- **建议**：要么完整对接微信支付 v3（X.509 + AES）+ 实现 webhook，要么从前端入口删除微信支付按钮（`beta-config.wechatPay = false` 已经开关，但路径仍可达）。

### P0-7. Stripe 缺少 webhook 处理（收钱不发积分）
- **位置**：仓库内**没有** `app/api/stripe/webhook/route.ts`。
- **影响**：用 Stripe 通道支付的用户在 `checkout.session.completed` 后无法把积分写到 `user_credits` 表。
- **建议**：新建 `/api/stripe/webhook/route.ts`：
  1. 验签 `Stripe-Signature` 头（用 `stripe.webhooks.constructEvent`）；
  2. 处理 `checkout.session.completed` → 用 `client_reference_id` 找 user → 调 `addCredits` + 更新 `orders.status='paid'`；
  3. 幂等表（`processed_webhook_events`）防止重放。

### P0-8. `/api/debug/init-tables` 与 `/api/debug/orders` 仅靠 `NODE_ENV` 判断
- **位置**：两个 debug route。
- **影响**：`/api/debug/init-tables` 调 `supabaseAdmin.rpc('exec_sql')`，含任意 SQL 入口；只要 `NODE_ENV !== 'production'`（如 staging / preview）就放行。
- **建议**：删除 / 用 `process.env.ENABLE_DEBUG_ROUTES === 'true'` 显式开关，并叠加 `verifyAdminToken`。

### P0-9. 管理员 token 是非密码学随机
- **位置**：`lib/admin-auth.ts:generateAdminToken`。
- **影响**：`Date.now() + Math.random() + btoa` 可被预测；并且 `localStorage` 存储 → XSS 即被偷。
- **建议**：改 `crypto.randomBytes(32).toString('base64url')`；写 `httpOnly` `Secure` `SameSite=Strict` cookie，并给 admin 路由独立子域（避免与主站共享 cookie 域）。

### P0-10. 结构化数据漏洞：`auth.uid()::text = user_id` 对 Authing 用户全部失效
- **位置**：`scripts/006/008/014/018_*.sql` 等所有 RLS 策略 + `scripts/015_remove_fk_constraint.sql`。
- **影响**：把 `user_credits.user_id` 从 UUID + FK auth.users 改为 TEXT 无 FK 后，`auth.uid()::text = user_id` 对 Authing TEXT id 永远 false。结果：**所有数据访问只能依赖应用层的 service_role**——一处缺 `requireUser` 即整库可读写（这就是 P0-1 的根本原因）。
- **建议**：长期方案是把 Authing 用户也写到 `auth.users` 表（用 Supabase 的 Custom JWT 模式 / `signInWithIdToken`），让 RLS 重新生效；中期方案是强制所有写表 helper 接收 `VerifiedUser`（lib/auth/verified-user 的类型）而不是 raw string，从类型系统层面阻断身份伪造。

### P0-11. `printWindow.document.write(htmlContent)` 渲染用户内容
- **位置**：`app/share/[id]/page.tsx:exportPDF`、`components/chat/MessageBubble.tsx` 同款打印逻辑。
- **影响**：用户分享对话内可注入 `<img src=x onerror=...>` —— 在新窗口（与主站同 origin）执行任意 JS。
- **建议**：改用 `jspdf` + `html2canvas`（仓库已经依赖）或 `printWindow.document.write` 前用 `DOMPurify.sanitize`。

### P0-12. `lib/cos.ts uploadToCos(sourceUrl)` 不做白名单 → SSRF
- **位置**：`lib/cos.ts`。
- **影响**：服务端 `fetch(sourceUrl)` 后写 COS。若 sourceUrl 控制权落到用户输入路径（Suno / Banana 失败兜底），可访问内网 `http://169.254.169.254/...` / 内部服务。
- **建议**：限制 `sourceUrl` 必须是已知供应商 hostname 列表（`*.suno.ai`、`*.dify.ai`、`*.shenxiang.school`、`*.cos-internal...`）。

### P0-13. `/api/tts` 与 `/api/voice/tts` 用 `Cache-Control: public, max-age=...`
- **位置**：`app/api/tts/route.ts`、`app/api/voice/tts/route.ts`。
- **影响**：CDN / 中间代理会用 (method, URL) 当 cache key，不同 user 不同 body 的 POST 请求其实通常不缓存——但这两个路由响应却带 `public` 缓存指令。某些 CDN（Cloudflare 默认）会对带 body 的 POST 不缓存，但**配置不当会导致缓存中毒，A 用户拿到 B 用户的语音**。
- **建议**：改 `private, no-store`；或把请求文本 hash 拼到 URL，改成 GET 真正可缓存。

---

## P1 — 高风险但有缓解 / 可降级

### P1-1. 凭据全部存 `localStorage`
- **位置**：`admin_token`、`idToken`、`authingToken`、`accessToken`、`currentUser`，散落在 `app/login/page.tsx`、`app/auth/email-login/page.tsx`、`app/admin/page.tsx`、`app/checkout/[productId]/page.tsx`、`components/app-sidebar.tsx`、3 个 chat-interface、`app/settings/page.tsx`、`app/invite/page.tsx`、`app/history/page.tsx`。
- **影响**：任何 XSS（含 P0-3 的 `/slides` 漏洞、P0-11 的 print XSS）均可读取所有凭据。
- **建议**：迁移到 httpOnly cookie；前端只保留非敏感的 user 显示信息（昵称、头像 URL）。

### P1-2. `/login?redirect=` 开放重定向 + `auth/callback?next=` 开放重定向
- **位置**：`app/login/page.tsx`、`app/auth/callback/route.ts`、`app/auth/confirm/route.ts`。
- **影响**：`?redirect=https%3A%2F%2Fevil.com` → `router.replace(decoded)` 可钓鱼。
- **建议**：白名单（仅允许同域 `/` 开头或 `next.config redirects` 显式列表）。

### P1-3. `/api/auth/sync` 用 `referer.includes('vercel.app' / 'shenxiang.school')` 校验来源
- **位置**：`app/api/auth/sync/route.ts`。
- **影响**：`evilvercel.app.attacker.com` / `evilshenxiang.school` 子串匹配可绕过。
- **建议**：`new URL(referer).host === appUrlHost` 严格比较。

### P1-4. 鉴权 token 复用：`DIFY_IMAGE_GATEWAY_TOKEN` 与 Dify text key 共享 fallback
- **位置**：`app/api/dify-upload/route.ts`、`app/api/dify-chat/route.ts`、`lib/openclaw-media-server.ts:getSigningSecret`。
- **影响**：图片网关 token 默认值 = Dify text API key；OpenClaw 签名 secret 默认值 = `SUPABASE_SERVICE_ROLE_KEY`。一处泄漏即旁路其他系统。
- **建议**：每个秘密独立配置，不共享 fallback；启动时校验关键 secret 必须独立。

### P1-5. 文件上传 MIME 仅看声明 + 公网 HTTP gateway URL
- **位置**：`app/api/dify-upload/route.ts`。
- **影响**：用户改扩展名为 `.png` 即可塞 PDF / SVG / 恶意文件；`IMAGE_GATEWAY_PUBLIC_URL` 默认 `http://43.154.111.156:8001` 是明文公网 IP。
- **建议**：用 magic bytes 校验（`file-type` 包）；网关换 HTTPS 域名（如 `https://gateway.shenxiang.school`）。

### P1-6. 积分相关无原子事务
- **位置**：`lib/credits.ts:addCredits / handleReferralSignup` / `lib/credits.ts:recordTransaction`。
- **影响**：
  - `addCredits` 无 `eq(credits, oldValue)` 条件，并发回调会丢更新（最后写者胜）；
  - `handleReferralSignup` 先 INSERT referrals 再调 addCredits，两步不在事务，断电会出现 referrer 已记 referrals + 积分未发。
- **建议**：写 PostgreSQL function（PL/pgSQL）封装 `add_credits(user_id, amount, reason)` 在 DB 内事务；或用 Supabase RPC + `with row lock`。

### P1-7. `/api/payment/xunhupay/notify` 在 console 打印整 body（含 sign）
- **位置**：`app/api/payment/xunhupay/notify/route.ts:24` 与 `lib/xunhupay.ts:verifyXunhupaySign` 的 console。
- **影响**：日志泄露第三方支付 sign + 商户号 + 金额。
- **建议**：只 log `orderNo` + `status` + `verified=true/false`。

### P1-8. `/api/admin/users` N+1 查询 + ilike 搜索
- **位置**：`app/api/admin/users/route.ts`。
- **影响**：每页 50 用户 × 2 子查询（lastTransaction + transactionCount）= 100 次往返；`ilike('user_id', '%${search}%')` 不能搜邮箱/手机。
- **建议**：用 SQL 视图 / 单条 GROUP BY 查询；建 `users_admin_view` materialized view + Trigger 刷新；或加 Postgres FTS。

### P1-9. CSP 仍开 `unsafe-inline` + `unsafe-eval` + 含 X-User-Id Allow-Headers
- **位置**：`next.config.mjs:headers().Content-Security-Policy`、`lib/cors.ts:Access-Control-Allow-Headers`。
- **影响**：CSP 形同虚设；`X-User-Id` 暴露给前端反而暗示「可以靠这个鉴权」（虽然后端不读）。
- **建议**：去掉 `unsafe-eval`；用 nonce / hash 替代 `unsafe-inline`；删 `X-User-Id` allowed-headers。

### P1-10. `validateEssayCorrectionResponse` 用文本正则判断「是否扣费」
- **位置**：`app/api/dify-chat/route.ts:validateEssayCorrectionResponse`。
- **影响**：用户在 prompt 注入「您尚未提供作文」「未提供内容」等关键字即可让 AI 回复包含这些词，**反推出去免费薅羊毛**。
- **建议**：删除该函数；改为以「Dify 工作流是否真的成功执行」（基于结构化字段而非用户文本）作为扣费条件。

### P1-11. service_role 路径泛滥（系统性架构妥协）
- **位置**：所有 `app/api/**/route.ts`（共 30+ 处 `createClient(URL, SERVICE_ROLE_KEY)`）。
- **影响**：因 Authing 用户绕过 RLS 不可避免，但缺 `requireUser` 即整库可读写。
- **建议**：抽 `lib/supabase/admin.ts` 单一封装；导出函数签名要求 `VerifiedUser` 入参；编译期阻止 raw string userId。

### P1-12. SQL schema 重复定义 + 备份表残留
- **位置**：`scripts/006` vs `scripts/011/017`；`scripts/013_enterprise_database_migration.sql`（DROP 注释，留 `*_backup` 表）。
- **影响**：生产库实际跑哪份取决于运维记忆；`*_backup` 表占空间无人清理。
- **建议**：把 `scripts/00X_*.sql` 全部迁到 `supabase/migrations/`，按 timestamp 命名；标准 Supabase CLI 工作流（`supabase db push`）；把 backup 表归档到 `archived_*` schema 或删除。

### P1-13. 预置邀请码进入 git
- **位置**：`scripts/008_create_invite_codes.sql:INSERT INTO invite_codes`。
- **影响**：`BETA2024 / WELCOME / TEST123` 全部 `max_uses=999999` 公开。
- **建议**：删除 INSERT；改在 `seed/` 目录提供示例并写入文档说明「请在 Supabase Studio 自行创建」。

### P1-14. 手机号 / 用户 ID 入文件名
- **位置**：`scripts/add-credits-13868308109.mjs`、`scripts/fix-user-13868308109-membership.mjs`、`scripts/query-user-15058755728.mjs`、`scripts/diagnose-user-13868308109.mjs`、`scripts/fix-order-692e60a37c4e42e6fde5c506.mjs` 等 6+ 文件。
- **影响**：用户 PII 永久留 git history；不可撤销。
- **建议**：`git filter-repo` 清理历史；以后所有运维 hotfix 用 generic 文件名（如 `manual-credits-adjustment.mjs --user $env`）。

### P1-15. Sonner toast 不显示
- **位置**：仓库内多处 `import { toast } from 'sonner'`，但 `app/layout.tsx` 与 `components/client-boot.tsx` 都没有渲染 `<Toaster />`。
- **影响**：所有 `toast.success / toast.error` 调用 silently 失败，用户看不到任何反馈。
- **建议**：在 `app/layout.tsx body` 内加 `<Toaster richColors position="top-right" />`。

### P1-16. KaTeX 渲染走 `dangerouslySetInnerHTML` 无 trust=false
- **位置**：`lib/latex-constants.ts:renderLatex`、`components/chat/UltimateRenderer.tsx`。
- **影响**：`\href{javascript:...}{x}` 在 katex >= 0.16 默认禁，但若引入旧版本或 `trust:true` 会触发 XSS。
- **建议**：显式 `katex.renderToString(formula, { trust: false, strict: 'ignore', macros: LATEX_MACROS })`。

### P1-17. `lib/storage.ts` Vercel Blob 路径仍被 `save-message` 引用
- **位置**：`lib/storage.ts`、`app/api/save-message/route.ts:uploadBase64File`。
- **影响**：项目已迁腾讯云 COS，但 chat 消息附件仍走 Vercel Blob——若 `BLOB_READ_WRITE_TOKEN` 没配会抛；运维上是个隐藏依赖。
- **建议**：把附件上传改走 `lib/cos.uploadBufferToCos`，删除 `lib/storage.ts`。

---

## P2 — 一致性 / 可维护性 / 性能

### P2-1. 模型注册表分散在 5 处
- **位置**：
  1. `lib/pricing.ts:MODEL_COSTS`
  2. `lib/dify-credentials.ts` switch
  3. `lib/chat-session-routes.ts:normalizeChatSessionModel`
  4. `app/chat/[model]/page.tsx:SUPPORTED_MODELS`
  5. `components/chat/enhanced-chat-interface.tsx:MODEL_DISPLAY_NAMES`
- **影响**：新增一个 model 要改 5 个文件；漏改即「能选不能跑 / 能跑但显示错误」。
- **建议**：抽 `lib/model-registry.ts`，单一对象提供 `{key, name, displayName, dify_app_id_env, group, mode, fixedCredits, ...}`；其他文件全部从这里 import。

### P2-2. 鉴权 / supabase client 复制粘贴
- **位置**：`getVerifiedAuthHeaders` + `createClient(NEXT_PUBLIC_SUPABASE_URL!, NEXT_PUBLIC_SUPABASE_ANON_KEY!)` 出现在 8+ 文件。
- **建议**：抽 `lib/auth/client.ts:getClientAuthHeaders()` 与 `lib/supabase/browser.ts:getBrowserSupabase()`。

### P2-3. 跨组件状态用 `window.dispatchEvent` 而非 zustand
- **位置**：`components/app-sidebar.tsx:SIDEBAR_COLLAPSE_EVENT / SIDEBAR_EXPAND_EVENT / CREDITS_REFRESH_EVENT / SESSION_LIST_REFRESH_EVENT`。
- **影响**：不可测；不可序列化；React 无法基于事件做 effect 调度。
- **建议**：迁到 `useSelectedModelStore` 同款 zustand pattern。

### P2-4. 三大 chat 入口 6120 行 client + 重复
- **位置**：`enhanced-chat-interface.tsx` (3530)、`gpt-image2-chat-interface.tsx` (1615)、`banana-chat-interface.tsx` (975)。
- **建议**：抽出共享 hooks：
  - `hooks/useDifySSE.ts`（SSE chunk 解析、jsonBuffer 跨 chunk 处理）
  - `hooks/useChatHistory.ts`
  - `hooks/useImageWorkspace.ts`
  - `components/chat/ChatHeaderBar.tsx`
  - `components/chat/sse-stream-parser.ts`
  把 3 个入口压到 < 500 行各自。

### P2-5. 双源 / 多源 Markdown 渲染器
- **位置**：`UltimateRenderer.tsx`（自实现）+ `EnhancedMarkdown.tsx`（react-markdown）+ `MessageBubble.tsx`（简易）+ `app/share/[id]/page.tsx`（第 4 套）。
- **建议**：保留 `EnhancedMarkdown`（基于 react-markdown）作为单一来源，删除 `UltimateRenderer`。

### P2-6. `'use client'` 滥用
- **位置**：`about / privacy / terms / refund-policy / wechat-login / icon-lab / help` 等纯静态条款页。
- **建议**：删 'use client'，改服务端渲染；FAQItem 等需要交互的拆成小 client 子组件。

### P2-7. 同名重复组件
- **位置**：5 个 `hero` / 3 个 `footer` / 2 个 `EmptyState`。
- **建议**：统一目录命名规范：营销页用 `components/marketing/<page>/Hero.tsx`，UI 库用 `components/ui/EmptyState.tsx`。

### P2-8. 死代码
- **位置**：`components/AsyncStylesheet.tsx`、`components/beta-banner.tsx`、`components/wechat-dialog.tsx`、`components/SunoProFormDemo.tsx`、`components/chat/analysis-stages.backup.tsx`、`components/chat/WorkflowVisualizer.backup.tsx`、`components/{hero,cta,process,features,footer,pricing}.tsx` 老一代营销组件、`app/ai-writing/paper/page.tsx`、`app/api/web-search/route.ts`、`app/api/document-process/route.ts`、`app/api/presentation/route.ts`。
- **建议**：批量删除；从 git 分支清理。

### P2-9. 内存型限流 / OTP store 多实例不共享
- **位置**：`lib/rate-limit.ts`、`lib/email-otp-store.ts`、`lib/admin-auth.ts:memoryTokenStore`。
- **建议**：迁到 Redis（Upstash 也行）。

### P2-10. 速率限制 IP 取值容易被伪造
- **位置**：`lib/rate-limit.ts:getClientIP`。
- **影响**：仅信 `x-forwarded-for` 第一段，反代未做 PROXY 头校验时可伪造。
- **建议**：在 OpenResty / Nginx / Cloudflare 层把 client IP 写到 `X-Real-IP` 后，后端只读它；且把上游可信代理列入白名单。

### P2-11. 测试覆盖偏「字符串/metadata 防腐」
- **位置**：`__tests__/admin-api-guards.test.ts` 等 31 个测试。
- **影响**：缺真实集成测试，不会捕获 P0-1 的「userId 伪造」漏洞。
- **建议**：补 e2e（Playwright）+ contract test（用 `next-test-api-route-handler`）跑每个 API：
  - 匿名→401
  - userId=A 伪造 userId=B → 403
  - 速率超限→429
  - 余额不足→402

### P2-12. 错误未上报到 Sentry / 监控
- **位置**：`app/error.tsx`、`app/global-error.tsx`、`components/ErrorBoundary.tsx`。
- **建议**：把 `error` 通过 `Sentry.captureException(error)` 上报；`error.tsx` 与 `global-error.tsx` 重复 90% 抽 `components/error/ErrorScreen.tsx`。

### P2-13. `payment/wechat` 3 秒轮询 / `payment/success` 仅一次 fetch
- **位置**：`app/payment/wechat/[orderNo]/page.tsx`、`app/payment/success/page.tsx`。
- **建议**：用 SSE / WebSocket（Supabase Realtime 也可监听 orders 表）；`/payment/success` 加自动轮询 + 退避。

### P2-14. `app/admin/page.tsx` 945 行单文件 + 无分页
- **建议**：拆 `LoginCard.tsx / OverviewTab.tsx / UsersTable.tsx / OrdersTable.tsx`；列表加虚拟滚动。

### P2-15. `app/settings/page.tsx` 头像每次新建文件名 + upsert 无意义
- **建议**：用固定路径 `avatars/{userId}.jpg`，每次覆盖；旧头像自然被替换；真正需要的 `cacheControl` 是设 `revalidate` query 参数。

### P2-16. `admin/stats` 把「今日 updated_at」当「今日新增用户」
- **位置**：`app/api/admin/stats/route.ts`。
- **影响**：用户消费积分都会 update updated_at，会被错算成新用户。
- **建议**：直接 `select count from auth.users where created_at >= today`。

### P2-17. `pricing` 套餐前后端双源
- **位置**：`lib/billing-config.ts:PRODUCT_CATALOG` + `components/pricing.tsx` 自行写一套套餐。
- **建议**：`components/pricing.tsx` import `PRODUCT_CATALOG`。

### P2-18. SEO / Metadata 偏差
- **位置**：`app/chat/[model]/layout.tsx` 的 canonical 全指 `/chat`；多个页面 `description: "...".`截断；`/ai-writing/paper`、`/chat/creative-image-banana`、`/chat/creative-image-gpt2` 缺 metadata；`/auth/error`、`/icon-lab`、`/test`、`/health` 缺 noindex。
- **建议**：`generateMetadata({ params })` 动态产出；用单一 SoT `lib/site-config.ts`。

### P2-19. sitemap / robots 不一致
- **位置**：`app/robots.ts`、`app/sitemap.ts`。
- **建议**：sitemap 移除 redirect 路径 `/ai-writing`；robots 加 disallow `/icon-lab`、`/test`、`/health`、`/share`、`/payment`、`/invite`；sitemap URL 改读 env。

### P2-20. 死路由 / 路径冗余
- **位置**：`/ai-writing/paper`（不可达）、`/chat/creative-image-banana / banana-2-pro / chat?model=banana-2-pro` 三条等价路径、`/chat/creative-image-gpt2 / gpt-image-2 / chat?model=gpt-image-2` 三条等价路径、`/auth/login → /login` 二级跳转。
- **建议**：next.config redirects 收敛；canonical 收口。

### P2-21. 大量 framer-motion 无 `prefers-reduced-motion`
- **位置**：`app/help/page.tsx`、`app/invite/page.tsx`、`components/home/*Section.tsx`、各种 ui 装饰组件。
- **建议**：用 `framer-motion` 自带的 `useReducedMotion()` hook；或在 `lib/motion.ts` 提供包装。

### P2-22. `viewport` `maximumScale=1 + userScalable=true`
- **位置**：`app/layout.tsx:viewport`。
- **建议**：删除 `maximumScale`，无障碍优先。

### P2-23. `scripts/startup.sh` 强制改写 OpenResty 配置
- **位置**：`scripts/startup.sh:第 2 步`。
- **建议**：把改 OpenResty 这步从启动脚本剥离，放部署一次性脚本（Ansible / 手动）。

### P2-24. Sentry 配置矛盾
- **位置**：`next.config.mjs withSentryConfig` 同时设 `widenClientFileUpload: true` 和 `sourcemaps.disable: true`；`transpileClientSDK: true` 是已弃用选项。
- **建议**：清理选项；按 Next 16 + Turbopack 实际能力关闭非必需开关。

### P2-25. `tsconfig.json exclude services/`
- **位置**：`tsconfig.json:exclude`。
- **影响**：`services/essay-ai-suite/` 和 `services/voice-gateway/` 不被主项目类型检查。
- **建议**：建立 npm workspaces / pnpm workspaces，让两个子项目独立 build；CI 跑两遍 typecheck。

### P2-26. 日志噪音
- **位置**：仓库内 `console.log` ≥ 200 处；`logger.ts` 已存在但无人调用。
- **建议**：lint 规则禁用 `no-console`（除 logger）；批量替换为 `logger.info/warn/error`；同时 `logger` 加 PII 脱敏。

### P2-27. TS `any` 滥用
- **位置**：几乎所有 client 组件。
- **建议**：开启 `noImplicitAny: true` + `strictNullChecks`（已 strict）+ ESLint `@typescript-eslint/no-explicit-any: error`。

### P2-28. 文档膨胀（13+ 份 markdown）
- **位置**：`README.md` `CLAUDE.md` `AGENTS.md` `BETA_TESTING_GUIDE.md` `DEPLOYMENT_GUIDE.md` `VERCEL_DEPLOYMENT.md` `DATABASE_MIGRATION_GUIDE.md` `API-INTEGRATION-GUIDE.md` `API配置说明.md` `SUNO_CONFIG.md` `TESTING_GUIDE.md` `CUSTOM_API_GUIDE.md` `CLAUDE-P0-FIX.md` `公测部署指南-小白版.md` `网站评估.md`。
- **建议**：保留 `README.md`（用户）+ `docs/` 子目录（架构 / 运维 / API / 部署 / 测试，每类一份）；其余作为 `docs/legacy/` 归档。

### P2-29. 多个 AI 助手元数据目录
- **位置**：`.claude/` `.Codex/` `.superpowers/`。
- **建议**：合并到 `.kiro/` 或文档中明确「目前主用 X」。

### P2-30. `nohup.out` 入仓
- **建议**：加到 `.gitignore` 并 `git rm --cached nohup.out`。

---

## P3 — UX / a11y / 小问题

- `alert(...)` 错误提示散落（admin/sign-up/checkout/login）。
- 错误反馈缺 `role="alert"` / `aria-live`。
- 移动菜单按钮无 `aria-expanded`。
- `<img>` 缺 width/height（CLS）。
- `header.tsx` 链向不存在的 `/primary /middle /high /university /subjects/*`。
- `WxGuard` 修改 body.style.overflow 没有 cleanup。
- `email-login/page.tsx` 倒计时 setTimeout 无 cleanup。
- 多个 page useEffect 内 fetch 无 AbortController。
- `app/credits/page.tsx` referralEarnings = `referralCount * 1000` 前端硬算。
- `'https://your-domain.com'` 占位符 fallback（`app/credits/page.tsx`）。
- `process.env.NEXT_PUBLIC_*` 在 client 模块顶层执行 + `!` 断言，env 漏配即 boot crash（多个 chat-interface 文件）。

---

## 一张图：按主题归类

```
┌────────────────────────────────────────────────────────────┐
│ 🛡 鉴权 / 身份                                                │
│  • P0-1 userId 伪造 (15+ 路由)                               │
│  • P0-9 admin token 弱熵                                    │
│  • P0-10 RLS 对 Authing 失效 → service_role 滥用             │
│  • P1-1 localStorage 存所有凭据                              │
│  • P1-2 open redirect (/login, /auth/callback, /auth/confirm) │
│  • P1-3 referer.includes 子串校验                            │
│  • P1-4 token 共享 fallback                                  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 💰 资金 / 计费                                                 │
│  • P0-6 微信支付占位 (收钱不到货)                              │
│  • P0-7 Stripe webhook 缺失 (收钱不到货)                       │
│  • P1-6 积分无原子事务                                         │
│  • P1-7 xunhupay/notify 日志泄露 sign                         │
│  • P1-10 validate 文本正则可被 prompt 注入绕开扣费              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🗂 数据 / Schema                                              │
│  • P0-10 + P1-12 双 schema 定义、FK 删除、备份表残留           │
│  • P1-13 邀请码进 git                                         │
│  • P1-14 手机号入文件名                                        │
│  • P2-25 services/ 不在 typecheck                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🌐 SSRF / 文件 / 媒体                                          │
│  • P0-2 openclaw-media-sign 公开                             │
│  • P0-3 /slides 公开 + text/html                             │
│  • P0-12 cos.uploadToCos SSRF                                │
│  • P1-5 上传 MIME 校验弱 + HTTP gateway                       │
│  • P0-11 print XSS                                           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🔄 性能 / 一致性                                              │
│  • P1-8 admin/users N+1                                      │
│  • P2-1 模型注册表 5 处                                        │
│  • P2-4 chat-interface 6120 行单文件                          │
│  • P2-5 双源 Markdown                                         │
│  • P2-11 测试缺 e2e                                           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 💬 用户体验                                                    │
│  • P1-15 sonner Toaster 缺失                                  │
│  • P2-13 支付状态轮询不当                                       │
│  • P2-15 头像永不清理                                          │
│  • P2-21 framer-motion 不尊重 reduced-motion                  │
│  • P3 多处 alert / role=alert 缺失                             │
└────────────────────────────────────────────────────────────┘
```
