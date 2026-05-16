# API 路由审计报告（Next.js 16 / App Router）

> 范围：`app/api/**` 全部 47 个 route 文件，外加 `app/auth/callback/route.ts`、`app/auth/confirm/route.ts`、`app/slides/[...path]/route.ts`。
> 鉴权基线：`requireUser()`（`lib/auth/verified-user.ts`）会先用请求里的 Supabase Cookie / Bearer 调 `supabase.auth.getUser()`，失败再尝试 `verifyAuthingJwt`（RS256 + JWKS + iss/aud/exp 校验）。**任何一条接受 `userId` 字段、却没有先调 requireUser 的接口，都是用户身份可被伪造的高危接口。**

---

## 一、按端点逐条审计

### `POST /api/admin/auth` → `app/api/admin/auth/route.ts`
- 作用: 用 `ADMIN_PASSWORD` 换一个 24 小时管理员 token。
- 入参: body `{ password }`。
- 输出: `{ success, token, expiresIn }` 或 401/503。
- 鉴权: 仅密码比对，无 user。
- 速率限制: `rateLimiter.check('admin-auth:<ip>', 10/min)`。
- 调用下游: `generateAdminToken` → `admin_tokens` 表（service_role）；表不存在时 fallback 到内存 Map。
- 副作用: 写 `admin_tokens` + `admin_actions` 审计表。
- ⚠ 潜在问题:
  - **单一密码 + 无双因素**，被撞库即沦陷；token 形式 `admin_btoa(timestamp:random)`，**不是密码学随机**（`Math.random()` + `btoa`），可被预测/枚举；应改为 `crypto.randomUUID()` 或 `randomBytes(32)`。
  - 内存 fallback：`useMemoryFallback` 一旦命中就**全局粘住**，所有后续 token 都进 Map；多实例部署或重启会全部失效，且 `verifyAdminToken` 在 fallback 模式下永不查 DB，等于另一套未审计的鉴权路径。
  - 失败 token 也写 `admin_actions`，但成功登录仅写 `token.substring(0,20)`——前 16 字节的 base64 已经包含 timestamp，是可重放的。
  - 没有 IP/UA 锁定，无登录失败报警。

### `POST /api/admin/verify` → `app/api/admin/verify/route.ts`
- 作用: 校验前端传来的 admin token 是否还有效。
- 入参: header `Authorization: Bearer <token>`。
- 输出: `{ valid, timestamp }` 或 401/403/429。
- 鉴权: `verifyAdminToken`。
- 速率限制: 10/min。
- ⚠ 潜在问题: 把鉴权状态返回 `valid:true/false` + 时间戳给前端，但前端的 `localStorage.admin_token`本身就是 XSS 重灾区——Verify 只是“盖章”，没有缓解。

### `GET /api/admin/orders` / `users` / `stats` / `user-details` → `app/api/admin/*`
- 作用: 后台仪表盘数据（订单 / 用户 / 概览 / 用户详情）。
- 鉴权: 全部 `verifyAdminToken(authorization)`，未通过 401。
- 调用下游: `service_role` 直查 `orders / user_credits / credit_transactions`，绕过 RLS。
- 副作用: 写 `admin_actions`（审计）。
- ⚠ 潜在问题:
  - **`/api/admin/users` N+1 查询**：拿到第一页 50 个用户后又对每人各发 2 个 count + lastTransaction 查询（共 100 条 RPC），用户量上来直接打爆 Supabase。应改成 GROUP BY/JOIN 或 RPC 视图。
  - `search` 用 `ilike('user_id', '%${search}%')`：用户 ID 是 UUID，模糊搜根本搜不到“张三/邮箱”；并且没有 `escapeIlike`，`%`、`_`、`\` 可被注入扰乱模式。
  - `stats` 用 `updated_at >= 今天` 当“今日新增”近似，逻辑错误：用户充值/被扣分都会更新 `updated_at`，会把活跃用户当成新用户。
  - `orders` 全表扫 `select amount` 计算总收入：每次请求都拉所有 paid 订单进内存——应在数据库里 `sum`。
  - `pageSize` 没上限，`?pageSize=99999` 即可触发大查询。
  - 错误字符串既给客户端又写 console，部分 stack 直接泄露。

### `POST /api/auth/send-email-otp` → `app/api/auth/send-email-otp/route.ts`
- 作用: 给邮箱发 6 位 OTP。
- 入参: `{ email }`。
- 鉴权: 无（合理）。
- 速率限制: IP 10/min；同邮箱 60s 节流。
- 调用下游: Resend API；OTP 存 `lib/email-otp-store.ts` **进程内 Map**。
- ⚠ 潜在问题:
  - **`emailOTPStore` 是单进程内存**，多实例 / Docker 多副本部署下，A 节点发的 OTP 在 B 节点验不过。生产必须切 Redis/DB。
  - **开发模式 `devCode` 直接返回前端**——`if (process.env.NODE_ENV === 'development')` 是仅有的拦截，但若部署时 `NODE_ENV=development` 误进生产，OTP 直接泄露。`NEXT_PUBLIC_*` 任何泄露都更危险。
  - `Math.random()` 生成 6 位验证码，弱熵。应用 `crypto.randomInt(100000, 1000000)`。
  - HTML 邮件未做 email 转义（`<span>${code}</span>` 是数字 OK，但模板贴近一旦未来加用户输入容易 XSS）。
  - 没有“同一 IP 1h 内最多发 N 次”的二级风控。

### `POST /api/auth/verify-email-otp` → `app/api/auth/verify-email-otp/route.ts`
- 作用: 校验 OTP，调 `supabaseAdmin.auth.admin.listUsers()`/`createUser()`/`generateLink()` 完成 magiclink 登录。
- 鉴权: 无（业务上是登录入口）。
- 速率限制: IP 10/min。
- 调用下游: `supabase.auth.admin.*`，新用户初始化 1000 积分 + 推荐码。
- ⚠ 潜在问题:
  - **`supabaseAdmin.auth.admin.listUsers()` 一次拉所有用户**找匹配 email——用户量到几万就爆。应直接 `getUserByEmail`（v2.40+）或 `from('auth.users').select(...)`。
  - 5 次错码后 `delete(email)`，但 60 秒后又能重新发码，等于每分钟可暴破 5 次。建议引入“5 次封 1h”机制。
  - 密钥拼接：`process.env.SUPABASE_SERVICE_ROLE_KEY!` 只在 Node Runtime 运行 OK，但本路由没有显式 `runtime = 'nodejs'`。
  - 大量 `console.log("[v0] 当前存储: ${JSON.stringify([...otpStore.entries()])}")`——把所有正在生效的 OTP **整张表打印到日志**，运维或日志聚合即可读取。**严重日志泄露。**
  - 返回 `redirectUrl: linkData.properties?.action_link`：把 magiclink 直接返回前端，前端在 `window.location.href` 跳转——意味着这条链接在浏览器开发者工具的 Network 面板里是明文，**链接被截获即可登录他人账号**。

### `POST /api/auth/sync` → `app/api/auth/sync/route.ts`
- 作用: 登录后写 `user_profiles` 行 + 赠 1000 积分（仅新用户）。
- 鉴权: ✅ `requireUser`。
- 速率限制: IP 30/min。
- 调用下游: service_role 写 `user_profiles` / `user_credits`。
- ⚠ 潜在问题:
  - 通过 referer/origin 校验自定义白名单：**`referer.includes('vercel.app')` 形同虚设**——攻击者域名 `evilvercel.app.attacker.com` 即过；同样 `'shenxiang.school'` 子串匹配也可被 `evilshenxiang.school` 钓鱼。应严格 `=== appUrl` 或 URL parsing 后比 host。
  - “身份不可伪造”依赖 `requireUser`，referer 检查仅是 CSRF 防御层；可保留但要 host 精确匹配。

### `POST /api/chat` → `app/api/chat/route.ts`
- 作用: 通用 standard 模型聊天 + 长文本走 essay-grade。
- 入参: body `{ messages, files, extractedText, userId }`。
- 鉴权: ❌ **接受前端 `userId`**，没有调 `requireUser`，仅校验 `userId` 非空就拿来扣积分。**任何匿名调用方提供任意 userId 都能扣他人积分 + 跑 AI。**（middleware 没把 `/api/chat` 列入 PROTECTED_API_ROUTES。）
- 速率限制: IP 30 + 用户 60。
- 调用下游: Dify chat-messages（流式），命中长文则递归调 `/api/essay-grade`。
- 副作用: SSE → `deductCredit()` 扣分 + `recordBillingIssue` 记录失败。
- ⚠ 潜在问题:
  - **userId 伪造**（最严重）。把 `userId` 改成别人的 UUID 即可耗尽对方积分。**必须改用 `requireUser(req)`**。
  - 把 `req.url.replace("/api/chat", "/api/essay-grade")` 当内部跳转：相当于自己调自己的 HTTP 接口（多一跳网络 + middleware 也会再跑一次），还把上游响应直接 pipe 给 `createMeteredStreamResponse`，但 essay-grade **本身不返回 Vercel AI SDK 的 0:{...} 格式**，导致 `fullResponseText` 为空、`hasReceivedContent=false`、不扣分——逻辑漏洞。
  - 默认 model `standard` 用 `getAPIConfig(provider)` 拼 `/chat-messages`，但 `getAPIConfig` 由 `lib/ai-utils.ts` 决定，不一定走 `internalDifyFetch`，若 baseURL 是公网 HTTP 会走默认 `fetch`，TLS 校验仍开但会有 Mixed Content（仅服务端无浏览器 mixed）。
  - 流式扣费在 `void deductCredit(...).catch`，错误只 console，不会让流报错。
  - 解析 SSE 时 `buffer.split("\n")` 没处理 `\r\n`（Linux Dify 不会出问题，但是脆弱）。

### `POST /api/dify-chat` → `app/api/dify-chat/route.ts` (1975 行)
- 作用: 多模型统一入口（22 种 model + Banana workflow + GPT Image V11 工作台 + 词境记忆卡 + OpenClaw）。
- 鉴权: ✅ `requireUser`。
- 速率限制: IP 30/min。
- 调用下游: Dify `/chat-messages` 或 `/workflows/run`；GPT Image 走 `IMAGE_GATEWAY_URL` (`/api/image/unified` 同步 / `/api/image/tasks` 异步)。
- 副作用: 复杂——`spendCredits`、`recordBillingIssue`、`createTaskRun/updateTaskRun`、`replaceTaskNodeEvents`、写 `user_credits`、首次访问的用户**自动写 user_credits 1000 积分**（与 auth/sync 重复逻辑）。
- ⚠ 潜在问题:
  - **会话越权校验只在传了 `sessionId` 时做**。如果前端不传 `sessionId`，model 选 `gpt-image-2` 也照常算分；这本身不算漏洞，但 `taskRun.id = requestId` 由前端 `X-Request-Id` 直接接受，攻击者通过自定义 requestId 可碰撞他人任务（写新行成功，但在 GET 那条里有 `eq('user_id', userId).maybeSingle()` 的二次校验，所以读取受保护，写入不受保护——如果前端自带的 requestId 是别人正在跑的任务 ID，会触发 `updateTaskRun` 二次写入，**篡改他人 task 状态/扣积分备注**）。建议服务端用 `crypto.randomUUID()` 强制覆盖。
  - **GPT Image 直连 `IMAGE_GATEWAY_URL` 拼接 token**：`x-gateway-token` 与 `Authorization: Bearer` 都用同一个 token。token 在 `/api/image/tasks` 路径作为 user_id 一并传出，如果 gateway 的鉴权弱即可越权。
  - 调用 Dify 时把 `query` 经过 `appendTextOutputLimitInstruction`，可被 prompt injection 破坏指令。
  - 多处 `console.log` 把 prompt 长度、文件 ID、用户 ID 截前 8 位输出——info 级泄露相对克制，但生产仍噪音大。
  - `validateEssayCorrectionResponse` 的“若评分=0/没找到关键字则不扣费”策略——**形同业务侧的 try-not-to-charge**，但用正则匹配文案，**用户可在 prompt 里加“没有提供文本”这类字符串就不会扣费**。是逻辑漏洞。
  - `internalDifyFetch` 仅根据 host 命中私网就用 undici Agent；GPT Image gateway URL 来自 env，若被改成公网则走默认 fetch，超时控制不一致。
  - 所有错误都把 `errorText.slice(0, 1000)` 直接返回给前端，可能把 Dify 内部异常（含 internal hostname / stack）泄露。

### `POST /api/dify-upload` → `app/api/dify-upload/route.ts`
- 作用: 上传文件到 Dify 或 GPT Image gateway。
- 鉴权: ✅ `requireUser`。
- 速率限制: IP 10/min。
- 调用下游: Dify `/files/upload`（普通模型）；`IMAGE_GATEWAY_URL/api/files/upload`（GPT Image）。
- 副作用: 服务器内存中读取 `formData()` 100MB。
- ⚠ 潜在问题:
  - **MIME 校验只看前端声明 `file.type`**，没读 magic bytes。攻击者可改扩展名 `.png` 伪装恶意 PDF/SVG。
  - `safeFileName = ${randomUUID}${ext}` 后又把 `safeFile = new File([file], safeFileName)` 转发给 Dify/Gateway，但 **HTTP body 里还是把原始文件流连 metadata 一起发**，gateway 端如何处置文件名取决于上游，本地路径遍历仍依赖 gateway 防护。
  - `IMAGE_GATEWAY_PUBLIC_URL` 默认 `http://43.154.111.156:8001`（代码硬编码）：明文 HTTP + 公网 IP，意味着浏览器（或 Dify 模型回拉）会发明文 URL，存在中间人替换图片风险，且会在 `cdn`/`shenxiang.school` 域名 OG 图里暴露。
  - `gatewayToken = process.env.DIFY_IMAGE_GATEWAY_TOKEN || DEFAULT_DIFY_KEY`：**默认会用 Dify 文本 API key 作为 gateway token**，二者鉴权域共享。

### `POST /api/document-process` → `app/api/document-process/route.ts`
- 作用: 占位接口，返回伪造的 OCR 文本。
- 鉴权: ❌ 无 user 校验。
- 速率限制: IP 30/min。
- ⚠ 潜在问题: 整个文件实际上是 mock，但仍占用上传通道，且没限制 file size 进 memory。生产应直接 410。

### `POST /api/essay-grade` → `app/api/essay-grade/route.ts`
- 作用: 调 ESSAY_CORRECTION 专用 Dify app 进行作文批改，SSE 透传。
- 鉴权: ❌ 无 `requireUser`。
- 速率限制: IP 30/min。
- 调用下游: Dify `chat-messages` w/ `streaming`。
- ⚠ 潜在问题:
  - **匿名也能跑作文批改**——这是高 token 的长文本 API，没有用户身份则无法扣积分；只能靠 IP 限流，被 IP 池打 30 r/min 即可白嫖。
  - 返回 `text/event-stream`，但客户端如果直接用 `EventSource`，需要服务端发 `Last-Event-Id` 和注释心跳，目前没有。
  - 大量被注释掉的旧逻辑（generateText + Claude）保留在文件里 100+ 行，干扰阅读、增加 bundle 风险。

### `POST /api/essay-review` → `app/api/essay-review/route.ts`
- 作用: 直接走 AI SDK（OpenAI/Claude/Gemini/xAI/Fireworks）做作文点评。
- 鉴权: ❌ 无。
- 速率限制: IP 30/min。
- 调用下游: AI SDK `generateText`，`maxTokens=12000`。
- ⚠ 潜在问题:
  - **匿名调用 + 12K maxTokens**：每次调用花费可观；未做 prompt 长度限制，只判 `essay.trim()`。可导致成本爆炸。
  - `provider/model` 来自请求 header **任意指定**，攻击者可指定 `claude-opus-4`/`gpt-5` 跑高价模型；服务端无白名单。
  - 真正用到的密钥：`process.env.OPENAI_API_KEY/ANTHROPIC_API_KEY/...` 全部**在每个 provider 之间共享 fallback**。
  - 没有 SSE，整段返回；用户体验差。

### `GET /api/health` → `app/api/health/route.ts`
- 作用: 健康检查 JSON。
- 鉴权: 无。
- ⚠ 潜在问题: `buildHealthPayload` 内容若包含版本/commit 等基础信息一般 OK，仅暴露给搜索引擎/扫描者无危害。

### `GET /api/image-proxy[/...asset]` → `app/api/image-proxy/{,[...asset]}/route.ts`
- 作用: 图片代理（共享 `./proxy` 实现，未读但同名导出）。
- ⚠ 潜在问题: **仅读到了入口，需要核对 `proxy.ts` 的 SSRF 校验**——若按 `?url=` 透传 `dify-image-gateway`，未做 hostname 白名单，则成 SSRF 中继，可访问内网。`buildModelAccessibleImageUrl` 在 dify-upload 中已经会构造 `?url=...&raw=1` 调本接口，**任何携带 raw=1 的 URL 都会被服务端拉回并返回**，等同公开 SSRF。需要立刻做白名单。

### `POST /api/ocr` → `app/api/ocr/route.ts`
- 作用: 图片 OCR。
- 鉴权: ❌ 无。
- 速率限制: IP 30/min。
- 调用下游: `https://www.vivaapi.cn/v1/chat/completions` (gpt-4o)。
- ⚠ 潜在问题:
  - **匿名调用 GPT-4o** + `max_tokens=2000`，被刷可花光 viva 余额。
  - 把整个 base64 图片 dataURL 转发给 viva，未做大小校验。
  - `runtime = 'edge'`：Edge 没有 `internalDifyFetch` 复用，但本路由确实只调外网，OK。

### `GET /api/openclaw-media/[...path]` → `app/api/openclaw-media/[...path]/route.ts`
- 作用: 给本地 `/openclaw-media` 文件目录加签名/Cookie 鉴权后输出。
- 鉴权: 先校验 `?exp&sig` 签名，否则要 Supabase session（cookie）。
- ⚠ 潜在问题:
  - 鉴权降级路径：未带签名时只要登录任意账号即可访问全部 OpenClaw 媒体（无 owner 校验），存在**横向越权**——A 用户能看到 B 用户生成的 PPT。
  - `MIME_TYPES` 表偏窄，碰到 `.pptx/.docx` 直接 415（虽与媒体目录定位有关）。
  - 路径校验已防 `..`。

### `GET /api/openclaw-media-sign/[...path]` → 同名目录 route.ts
- 作用: 生成签名 URL 后 307 redirect 到 `/api/openclaw-media/...?sig=&exp=`。
- 鉴权: ❌ **没有任何登录校验**，任何人都能向这个签发器索要任意 path 的签名 URL，等于绕过了上面那条的鉴权。**严重漏洞**——签名机制完全失效。

### `GET /api/payment/status/[orderNo]` → 同上
- 作用: 查询订单状态。
- 鉴权: ✅ supabase.auth.getUser，并 `eq('user_id', user.id)` 隔离。
- ⚠ 潜在问题: 仅 supabase session（不接受 Authing）；Authing 用户拿不到自己的订单。

### `GET /api/payment/xunhupay/create` → 同上
- 作用: 调迅虎下单返回支付链接。
- 鉴权: ✅ `requireUser` + 拒绝跨用户传 userId。
- ⚠ 潜在问题:
  - 校验产品价格用 `getCatalogPriceInCents`（服务端），✅ 正确。
  - `tradeOrderId = ORDER_${Date.now()}_${userId}`：把用户 ID 拼进订单号——若 userId 是邮箱/UUID 且后续按子串搜（见 `/api/user/membership` 策略 4），会产生交叉匹配 bug。
  - notify_url 用 `getBaseUrl(request)` 推断：在 `host` header 被反代修改时可能拼出钓鱼回调地址。
  - 创建订单后直接发请求给迅虎（无超时），失败时不回滚刚插入的 pending 订单——产生“无支付链接的孤儿 pending 订单”。
  - 迅虎的 sign 用 MD5（行业惯例但脆弱）；附 secret 直接拼字符串，无 HMAC。

### `POST /api/payment/xunhupay/notify` → 同上
- 作用: 迅虎回调，幂等地完成扣分/发会员。
- 鉴权: ❌ 完全靠 `verifyXunhupaySign` 验签。✅ 关键校验都做了：状态 `OD`、签名、订单存在、状态从 pending → processing → paid 转移、金额比对（按 cent）、积分上限 1000w、抢占 `processing` 行避免并发回调。
- ⚠ 潜在问题:
  - **IP 限流**只有 10/min：迅虎服务器会重试，可能被自家阻断。Webhook 路径不应走 IP 限流。
  - `console.log("[迅虎支付] 收到回调:", JSON.stringify(body))` **把签名 + 商户号 + sign secret 衍生信息全部打印**。日志若集中收集会泄露。
  - JSON parse 顺序兜底容易混淆错误，但功能正常。
  - `if (status !== "OD") return fail/200`：返回 200 + “fail” body，可能让迅虎认为成功不重试；惯例应返回 200 + “success” 仅在确实处理成功时。

### `POST /api/presentation` / `POST /api/sparkpage`
- 作用: 占位实现（mock）。
- 鉴权: ❌。
- 速率限制: IP 30/min。
- ⚠ 潜在问题:
  - sparkpage 真的会调 OpenAI/Anthropic/Google/xAI/Fireworks，`maxTokens=8000`，**完全匿名**——和 essay-review 同款成本爆炸面。
  - presentation 是死路由，应删除或加 410。

### `GET /api/providers`
- 作用: 静态返回一个固定的 provider/model 列表（`gpt-5.4 / claude-opus-4.6 / grok-4 / gemini 2.5`...）。
- 鉴权: 无（合理）。
- ⚠ 潜在问题: 返回的版本号 `claude-sonnet-4.5 / Claude Opus 4.6` 这种**前端营销名 ≠ 真实 API name**，可能与下游 API 不一致。属信息一致性风险，不是安全。

### `POST /api/referral/get-code` / `POST /api/referral/process`
- 作用: 取/生成推荐码；处理推荐注册。
- 鉴权: ❌ 都直接接受 body `{ userId, referralCode }`。
- 速率限制: IP 30/min。
- 副作用: `handleReferralSignup` → 给 referrer + referee 各发 1000 积分。
- ⚠ 潜在问题:
  - **任意人都可对任意 userId 触发推荐奖励**，刷 50K/账号。`MAX_REFERRER_REWARD=50000` 有上限但没有 referee 上限：同一个 referrer 可以为成千上万“假 newUserId”刷。建议要求 newUserId 的真实 token + 注册时间不超过 N 分钟。

### `POST /api/save-essay-review`
- 作用: 保存批改结果。
- 鉴权: ✅ `supabase.auth.getUser()`（仅 supabase）。
- ⚠ 潜在问题: Authing 用户落空；缺少字段长度上限（用户可塞超大 JSON 进表）。

### `POST /api/save-message`
- 作用: 保存消息 + 上传附件到 Vercel Blob。
- 鉴权: ✅ `requireUser` + session.user_id 比对。
- ⚠ 潜在问题:
  - 上传走 `uploadBase64File`：未做 size/MIME 校验，可注入巨型/恶意文件。
  - `await supabase.from('chat_messages').insert(...)` **逐条写**，并不去重，也没 metadata。
  - 一次失败会跳过该文件继续 loop——好但日志只 `console.error`。

### `GET/POST /api/chat-session`
- 作用: 创建/查询用户 chat session（含 messages）。
- 鉴权: ✅ `requireUser`。
- ⚠ 潜在问题:
  - service_role 写入，相当于绕过 RLS；好处是不依赖客户端 RLS 设计，坏处是若代码有 bug 即直接漏数据。
  - `requestedId` 校验 UUID 后用作 insert id，攻击者可指定与他人同 ID 重复（但 unique 约束会拦）。
  - GET 列表没分页（`limit`），返回全部 session。

### `POST /api/share`
- 作用: 创建分享并奖励积分。
- 鉴权: ❌ 接受 `{ userId }`，无 token 校验。
- 速率限制: IP 30/min。
- 副作用: 写 `shared_content`；若 `userId` 提供则发 1000 积分（5 次/天）。
- ⚠ 潜在问题:
  - **前端任意 userId 即可领奖**——和 referral/process 一样可被刷。
  - 写表用 service_role；id 重试只 5 次。
  - 把整段聊天 messages JSON 序列化进单列，未做大小限制。

### `POST /api/share/claim-reward`
- 作用: 访客领分享奖励，与 share 同款。
- 鉴权: ❌ 接受 `{ shareId, viewerId }`。
- ⚠ 潜在问题: viewerId 可伪造 → 同一个浏览器换 viewerId 反复领（5 次/天上限是按 viewerId，不按 IP）。

### `GET /api/stripe/checkout-session` → `POST /api/stripe/checkout-session/route.ts`
- 作用: 创建 Stripe embedded session。
- 入参: body `{ productId, userId }`。
- 鉴权: ❌ 接受任意 userId。
- 速率限制: 10/min。
- 调用下游: `stripe.checkout.sessions.create`。
- ⚠ 潜在问题:
  - 因为最终扣款由 Stripe 处理，问题相对小，但 `client_reference_id` / `metadata.userId` 写错就会让付款挂在他人账户名下——如果有 Stripe webhook（仓库内未见 stripe webhook 路由！），意味着**支付完成无法回写积分**，存在“收钱不到货”风险。

### `POST /api/suno`
- 作用: Suno 音乐生成（简单/专业 / 流式 / 查询 / fetch）。
- 鉴权: ❌ 接受 `body.userId` 直接扣积分（`chargeSunoBaseCredits(userId, ...)`）。
- 速率限制: IP 30/min。
- 调用下游: 自建 Suno gateway `http://43.154.111.156/v1`；查询成功后把音频/封面**透过 `uploadToCos` 转存腾讯云 COS**。
- ⚠ 潜在问题:
  - 同样**用户可被伪造扣积分**。
  - SUNO_BASE_URL 默认就是公网 IP HTTP；token 直接 `Bearer` 走明文。
  - COS 转存：service_role 在浏览器/代理之间使用同一对象存储桶，命名由前端 `taskId` 控制——可被路径预测。

### `GET /api/task-status`
- 作用: 取用户 AI 任务运行状态。
- 鉴权: ✅ `requireUser`。
- ⚠ 潜在问题: `limit` 已截断。OK。

### `POST /api/tts`
- 作用: 用 Dify 的 TTS 接口合成语音。
- 鉴权: ❌ 无。
- 速率限制: IP 30/min。
- ⚠ 潜在问题:
  - 匿名调用 + `text.substring(0, 500)`——成本可控但 `Cache-Control: public, max-age=3600`** 把音频全网共享缓存**，意味着不同用户输入的同一段文本被同 URL 缓存？其实并不，URL 本身相同（`/api/tts`），缓存 key 是请求方法/URL，**会出现“后请求拿到前请求音频”** 的串数据问题。需要 `Vary: Authorization` 或改 GET + 文本 hash。

### `POST /api/voice/stt` / `POST /api/voice/tts`
- 作用: 走 voice-gateway 的 STT/TTS。
- 鉴权: ❌ 无；20-30/min IP 限流。
- ⚠ 潜在问题:
  - STT 接受 25MB 音频，匿名可消耗 voice gateway 资源。
  - TTS 缓存同 `/api/tts`：`Cache-Control: public, max-age=86400`，缓存中毒/串数据问题。

### `GET /api/user/credits`
- 作用: 取当前用户积分；不存在则补创 1000。
- 鉴权: ✅ `requireUser`。
- ⚠ 潜在问题: POST 已显式 405 拒绝。设计正确。

### `GET/POST /api/user/membership`
- 作用: 查会员状态。
- 鉴权: ✅ `requireUser`，并强制 query/body 的 userId 必须 = session userId。
- ⚠ 潜在问题:
  - 5 个 fallback 策略中策略 3/4 用 `auth.admin.listUsers({ perPage: 1000 })` + 子串匹配 —— 同样是 N 次 admin call、性能炸弹。
  - 策略 4：把所有 paid 订单 limit 100 拉回内存**对每个用户**做模糊匹配，等于 N 次客户端扫描。
  - 把订单 product_id 映射 membership status 的逻辑分散在前后端多处。

### `GET /api/user/transactions`
- 作用: 取积分流水（来自 credit_transactions 表，无则伪造一条 register-bonus）。
- 鉴权: ✅ `requireUser`。
- ⚠ 潜在问题:
  - 表不存在时**伪造一条记录**叫 register-bonus，金额 1000，create_at 来自 `profiles.created_at`——这条数据**不真实存在于流水表**，影响审计。
  - 没有分页参数。

### `POST /api/user/update`
- 作用: 更新用户昵称/头像（昵称写 `user_metadata`）。
- 鉴权: ❌ **完全无 token**，body `{ userId, name, avatarUrl }`，并且：
  > "如果不是 UUID，开启【全网通缉】模式"
  会调 `auth.admin.listUsers({ perPage: 1000 })` 用手机号子串匹配……然后把 `user_metadata.name` 替换。
- 速率限制: 30/min。
- ⚠ **致命漏洞**: 任何人发 `{ userId: '15881822773', name: 'pwn' }` 即可改任意手机号用户的昵称；同样 avatarUrl 可注入伪造头像（如外链触发请求）。**必须加 `requireUser`，并校验 userId === auth.user.id**。

### `POST /api/web-search`
- 作用: 占位 mock。
- 鉴权: ❌。
- ⚠ 潜在问题: 死接口，应删除。

### `GET /api/debug/init-tables` / `GET /api/debug/orders`
- 作用: 调试接口；`if (NODE_ENV === 'production') return 404`。
- ⚠ 潜在问题: 一旦 NODE_ENV 配错（例如部署用 `staging`/`preview`），即直接放行，**用 service_role 跑 `exec_sql` RPC**——一行 SQL 注入即可建任意表。建议改成显式白名单 `process.env.ENABLE_DEBUG_ROUTES === 'true'`，并放在 admin token 后面。

### `GET /api/health` 已述。

### `GET /api/openclaw-media-sign/[...path]` 已述。

### `GET /auth/callback/route.ts`
- 作用: PKCE code 兑换 session。
- 鉴权: 仅校验 query。
- ⚠ 潜在问题: `next` 来自 query，未做 same-origin 白名单——存在 **open redirect**（与 `/login?redirect` 同款问题）。`encodeURIComponent` 仅仅是为了拼 error 链接，不是白名单。

### `GET /auth/confirm/route.ts`
- 作用: token_hash 验证 magic link。
- ⚠ 潜在问题: 同样 `next` 没白名单。

### `GET /slides/[...path]/route.ts`
- 作用: 输出 OpenClaw `workspace` 内的 HTML/PPT 静态文件。
- 鉴权: ❌ 完全公开。
- ⚠ 潜在问题:
  - **任何人可读所有用户生成的 slides**，并且 `Content-Type` 包含 `text/html; charset=utf-8` —— 等于让 `slides/<猜测的 path>/index.html` 在 shenxiang.school 域名下渲染**用户内容 HTML**，是 stored XSS 重灾区（用户可借 OpenClaw 生成钓鱼页托管在主域），且会绕过本站 Cookie SameSite 拿同站 cookie。
  - 没有签名机制（与 openclaw-media 不同）。

---

## 二、全局横向问题

1. **「前端传 userId 即扣分」是这个仓库最危险的反模式**，命中以下接口：
   - `/api/chat`、`/api/share`、`/api/share/claim-reward`、`/api/referral/get-code`、`/api/referral/process`、`/api/stripe/checkout-session`、`/api/suno`、`/api/user/update`、`/api/essay-grade`、`/api/essay-review`、`/api/web-search`、`/api/document-process`、`/api/sparkpage`、`/api/ocr`、`/api/voice/stt`、`/api/voice/tts`、`/api/tts`、`/api/presentation`。
   匿名/伪造 userId 即可直接扣他人积分、刷推荐奖励、改他人昵称。建议**全部接入 `requireUser`**，userId 始终来自 session。
2. **localStorage 鉴权**：`admin_token` 存 localStorage、Authing token 存 localStorage、Supabase session cookie 与 Authing token 并存。建议：
   - admin_token 改 httpOnly cookie + same-site=strict；
   - Authing token 在 verify 后写 supabase session 或自家 httpOnly cookie，前端不再持有原始 JWT。
3. **debug / mock 接口在生产仍可达**：`/api/document-process`、`/api/web-search`、`/api/presentation` 是 mock，`/api/sparkpage` 是真调外网 LLM 但完全公开，`/api/debug/*` 仅靠 `NODE_ENV !== 'production'` 兜底；`/test`、`/icon-lab` 同。
4. **缓存中毒**：`/api/tts`、`/api/voice/tts` 用 `Cache-Control: public, max-age=...`——同一个 URL 不同请求体的响应会被 CDN 共享，**不同用户拿到他人音频**。需要 `Cache-Control: private` 或把请求文本 hash 拼进 URL。
5. **错误日志泄露**：`emailOTPStore` 直接打印整张 OTP 表；`/api/payment/xunhupay/notify` 打印整 body；`/api/auth/verify-email-otp` 打印 magiclink action_link 前缀。
6. **service_role key 路径泛滥**：所有 admin、积分、订单、share 路由都用 service_role，绕过 RLS——真正的安全策略移到了应用层。一处缺 `requireUser` 就直接放行 DB 任意写。
7. **N+1 / 全表扫描**：admin/users（50 用户 × 2 query）、admin/orders 求和、user/membership 5 策略 fallback、auth/verify-email-otp 全表 listUsers。
8. **Webhook 验签覆盖不全**：xunhupay 验签 ✅；Stripe **找不到 webhook 路由**——支付成功后无法回写积分。
9. **CSP 与 form-action**：`form-action 'self' https://api.xunhupay.com https://*.stripe.com`，但实际真正的支付跳转用动态 `<a href>` 模拟点击，不会触发 form-action。CSP 与代码现状有偏差。
10. **CORS**：`lib/cors.ts` 限制为 5 个固定 origin，OK；但 `Access-Control-Allow-Headers` 默认包含 `X-User-Id`，意味着前端可以伪造此 header（中间件并未读它，但保留误导）。建议移除。
11. **SSRF/路径遍历风险点**：`/api/image-proxy[?url=]`（未审）、`/api/dify-chat` 直连 IMAGE_GATEWAY、`/slides/[...path]`。需统一加上 hostname 白名单 + 路径 normalize。
12. **无幂等支付状态机的健壮性**：xunhupay/notify 自身做了 pending→processing→paid 抢占，但 xunhupay/create 失败时不会回滚 pending 行；前端需要补 `payment/cancel` 流程。
13. **TS `any` 与 `as any`**：admin/orders 等多处对 service_role 查询结果 `as any`，运行时类型与表结构 drift 不可见。

---

## 三、鉴权矩阵

> 列含义：
> - 应可访问：业务期望
> - 实际可访问：真实代码状态
> - 备注：差距 / 风险

| 端点 | 匿名应/实 | 登录用户应/实 | 管理员应/实 | 备注 |
|---|---|---|---|---|
| `POST /api/admin/auth` | ✅/✅（密码） | ✅/✅ | ✅/✅ | token 弱熵 |
| `POST /api/admin/verify` | ❌/❌ | ❌/❌ | ✅/✅ | OK |
| `GET /api/admin/orders` | ❌/❌ | ❌/❌ | ✅/✅ | N+1 |
| `GET /api/admin/users` | ❌/❌ | ❌/❌ | ✅/✅ | N+1 |
| `GET /api/admin/stats` | ❌/❌ | ❌/❌ | ✅/✅ | 今日新增逻辑错 |
| `GET /api/admin/user-details` | ❌/❌ | ❌/❌ | ✅/✅ | OK |
| `POST /api/auth/send-email-otp` | ✅/✅ | ✅/✅ | ✅/✅ | OTP 内存存 + log 泄露 |
| `POST /api/auth/verify-email-otp` | ✅/✅ | ✅/✅ | ✅/✅ | 返回 magiclink 给前端 |
| `POST /api/auth/sync` | ❌/❌ | ✅/✅ | ✅/✅ | referer 子串校验弱 |
| `POST /api/chat` | ❌/✅ | ✅/✅ | ✅/✅ | **匿名可扣他人积分** |
| `POST /api/dify-chat` | ❌/❌ | ✅/✅ | ✅/✅ | requestId 可碰撞他人任务 |
| `POST /api/dify-upload` | ❌/❌ | ✅/✅ | ✅/✅ | MIME 仅看声明 |
| `POST /api/document-process` | ❌/✅ | ✅/✅ | ✅/✅ | mock，应删除 |
| `POST /api/essay-grade` | ❌/✅ | ✅/✅ | ✅/✅ | **匿名跑长文 SSE** |
| `POST /api/essay-review` | ❌/✅ | ✅/✅ | ✅/✅ | **匿名调用 Claude/GPT** |
| `GET /api/health` | ✅/✅ | ✅/✅ | ✅/✅ | OK |
| `GET /api/image-proxy[/...]` | ✅/✅ | ✅/✅ | ✅/✅ | 需核 SSRF 白名单 |
| `POST /api/ocr` | ❌/✅ | ✅/✅ | ✅/✅ | **匿名调 GPT-4o** |
| `GET /api/openclaw-media/[...]` | ❌/❌（除签名） | ✅/✅（任意他人内容） | ✅/✅ | **横向越权** |
| `GET /api/openclaw-media-sign/[...]` | ❌/✅ | ✅/✅ | ✅/✅ | **签名机制完全失效** |
| `GET /api/payment/status/[orderNo]` | ❌/❌ | ✅（仅本人）/✅ | ✅/✅ | Authing 用户失效 |
| `GET /api/payment/xunhupay/create` | ❌/❌ | ✅/✅ | ✅/✅ | OK，但失败不回滚订单 |
| `POST /api/payment/xunhupay/notify` | ✅（迅虎）/✅ | n/a | n/a | 验签 ✅，IP 限流不当 |
| `POST /api/presentation` | ❌/✅ | ✅/✅ | ✅/✅ | mock 死接口 |
| `GET /api/providers` | ✅/✅ | ✅/✅ | ✅/✅ | OK |
| `POST /api/referral/get-code` | ❌/✅ | ✅/✅ | ✅/✅ | **可任意 userId 生成** |
| `POST /api/referral/process` | ❌/✅ | ✅/✅ | ✅/✅ | **可任意 userId 领奖** |
| `POST /api/save-essay-review` | ❌/❌ | ✅(仅本人)/✅ | ✅/✅ | 仅 supabase session |
| `POST /api/save-message` | ❌/❌ | ✅/✅ | ✅/✅ | 上传无 size/MIME 校验 |
| `GET/POST /api/chat-session` | ❌/❌ | ✅/✅ | ✅/✅ | 列表无分页 |
| `POST /api/share` | ❌/✅ | ✅/✅ | ✅/✅ | **任意 userId 领分享奖** |
| `POST /api/share/claim-reward` | ❌/✅ | ✅/✅ | ✅/✅ | **任意 viewerId 领奖** |
| `POST /api/sparkpage` | ❌/✅ | ✅/✅ | ✅/✅ | **匿名调高价 LLM** |
| `POST /api/stripe/checkout-session` | ❌/✅ | ✅/✅ | ✅/✅ | userId 可伪造 + 无 webhook |
| `POST /api/suno` | ❌/✅ | ✅/✅ | ✅/✅ | **userId 可伪造扣积分** |
| `GET /api/task-status` | ❌/❌ | ✅/✅ | ✅/✅ | OK |
| `POST /api/tts` | ❌/✅ | ✅/✅ | ✅/✅ | 缓存中毒 |
| `POST /api/voice/stt` | ❌/✅ | ✅/✅ | ✅/✅ | 匿名 + 25MB |
| `POST /api/voice/tts` | ❌/✅ | ✅/✅ | ✅/✅ | 缓存中毒 |
| `GET /api/user/credits` | ❌/❌ | ✅/✅ | ✅/✅ | OK |
| `GET/POST /api/user/membership` | ❌/❌ | ✅/✅ | ✅/✅ | fallback 性能炸弹 |
| `GET /api/user/transactions` | ❌/❌ | ✅/✅ | ✅/✅ | 无分页 |
| `POST /api/user/update` | ❌/✅ | ✅/✅ | ✅/✅ | **致命：任意改他人昵称/头像** |
| `POST /api/web-search` | ❌/✅ | ✅/✅ | ✅/✅ | mock，应删除 |
| `GET /api/debug/init-tables` | ❌/✅(NODE_ENV) | ❌/✅ | ❌/✅ | 仅 NODE_ENV 兜底 |
| `GET /api/debug/orders` | ❌/✅(NODE_ENV) | ❌/✅ | ❌/✅ | 同上 |
| `GET /auth/callback` | ✅/✅ | ✅/✅ | ✅/✅ | open redirect via `next` |
| `GET /auth/confirm` | ✅/✅ | ✅/✅ | ✅/✅ | open redirect via `next` |
| `GET /slides/[...path]` | ✅/✅ | ✅/✅ | ✅/✅ | **stored XSS / 任意他人 PPT** |

> 标 ✅/✅ 表示「应该可以 → 实际可以」；❌/✅ 即「不应该可以 → 实际可以」；后者就是漏洞。

---

## 四、修复优先级建议（高 → 低）

### P0（必须立刻改）
1. `/api/user/update`：加 `requireUser`，强制 `userId === auth.user.id`，删掉“全网通缉”模糊匹配。
2. `/api/openclaw-media-sign/[...path]`：加登录 + owner 校验，并把 owner 写进签名 payload。
3. `/api/openclaw-media/[...path]`：未带签名时按 owner 校验，不允许 A 用户读 B 用户内容。
4. `/api/chat`、`/api/suno`、`/api/share`、`/api/share/claim-reward`、`/api/referral/*`、`/api/stripe/checkout-session`：全部接入 `requireUser`。
5. `/api/auth/verify-email-otp`：不要把 `linkData.action_link` 返回前端；请改用 `setSession` 直接下发 cookie，或仅返回成功标志。
6. `/api/auth/send-email-otp`、`/api/auth/verify-email-otp`：去掉打印整张 OTP 表的 console.log；`Math.random` 改 `crypto.randomInt`。
7. `/slides/[...path]`：加签名 + owner 校验，且禁止 `text/html` 直出（改为下载或经中间件 sanitize）。
8. 新增 Stripe webhook 路由（`/api/stripe/webhook`）以闭环积分。

### P1
9. `/api/tts`、`/api/voice/tts` 去掉 `Cache-Control: public`，改 `private` 或加 `Vary: Authorization`。
10. `/api/dify-chat`：服务端 `crypto.randomUUID()` 强制覆盖 `requestId`；`validateEssayCorrectionResponse` 要么删除要么基于结构化字段而非用户文本判定。
11. `/api/dify-upload`：用 magic bytes 校验；公开 URL 改 HTTPS；`gatewayToken` 与 Dify text key 分离。
12. `/api/admin/users`：改用 SQL 视图避免 N+1；`search` 用全文检索或多列。
13. `/api/admin/stats`：今日新增改为 `select count from auth.users where created_at >= today`。
14. `/api/auth/sync`：把 referer 的 `includes` 改成精确 host 比对。

### P2
15. 删除 mock：`/api/document-process`、`/api/presentation`、`/api/web-search`。
16. `/api/debug/*` 改为 `if (process.env.ENABLE_DEBUG_ROUTES !== 'true')` 而不是仅看 NODE_ENV。
17. `email-otp-store` 切换到 Redis/Supabase 表（多实例可用）。
18. admin token 改 `crypto.randomBytes(32).toString('hex')`，存 `httpOnly` cookie。
19. 全仓库扫描 `console.log` → 替换为 logger.info/warn 并做 PII 脱敏。

