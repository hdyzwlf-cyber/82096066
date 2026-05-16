# 沈翔智学 ai-essay-editor — 网站帮助文档

> 版本：基于当前仓库源码状态整理（生产部署：`https://shenxiang.school` / `https://www.shenxiang.school`）。
> 适用对象：终端用户（学生/家长/教师）、运营客服、内部开发者。
> 配套审计文档：[`docs/ISSUES.md`](./ISSUES.md)、`docs/_audit_*.md`。

---

## 0. 一图看懂沈翔智学

```
                                     ┌─────────────────────┐
                                     │     用户访问入口     │
                                     │ shenxiang.school    │
                                     └──────────┬──────────┘
                                                │
                ┌───────────────────────────────┼───────────────────────────────┐
                │                               │                               │
        ┌───────▼────────┐              ┌───────▼────────┐              ┌───────▼────────┐
        │   营销/落地页   │              │   AI 工作台    │              │   账户中心     │
        │ /  /about      │              │ /chat/<model>  │              │ /settings      │
        │ /pricing       │              │ /chat/gpt-image│              │ /credits       │
        │ /parent /teach │              │ /chat/banana   │              │ /history       │
        │ /help /privacy │              │ /essay /analyze│              │ /invite        │
        └────────────────┘              │ (作文批改/分析) │              └────────────────┘
                                        └────────┬───────┘                       │
                                                 │                               │
                          ┌──────────────────────┼─────────────────────┐         │
                          │                      │                     │         │
                ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌────────▼─────────▼┐
                │   Next.js 16      │  │  支付通道         │  │  数据存储          │
                │   API 层           │  │ • xunhupay (支付宝│  │ • Supabase Auth    │
                │ /api/dify-chat    │  │   /微信)          │  │ • Authing OIDC     │
                │ /api/dify-upload  │  │ • Stripe (国际)   │  │ • PostgreSQL       │
                │ /api/chat-session │  │ • 微信支付 (占位)  │  │ • 腾讯云 COS       │
                │ /api/payment/*    │  └───────────────────┘  └────────────────────┘
                │ /api/admin/*      │           │                      │
                └─────────┬─────────┘           │                      │
                          │                     │                      │
       ┌──────────────────┼─────────────────────┘                      │
       │                  │                                            │
┌──────▼──────┐  ┌────────▼─────────┐  ┌──────────────┐  ┌────────────▼─────────┐
│ Dify        │  │ Suno 音乐        │  │ OpenClaw     │  │ Voice Gateway         │
│ (作文批改/  │  │ (服务器:8080)    │  │ (PPT/HTML 生 │  │ (OpenAI/Minimax/      │
│ 通用对话/   │  │ Suno V5 模型     │  │ 成；HMAC 签名│  │ SiliconFlow TTS+STT)  │
│ 教学/写作   │  │                  │  │ 鉴权)        │  │                       │
│ 等 22 模型) │  │                  │  │              │  │                       │
└─────────────┘  └──────────────────┘  └──────────────┘  └───────────────────────┘
```

---

## 1. 你能在这个网站上做什么

| 功能 | 入口 | 说明 |
|---|---|---|
| 🤖 与 22 个 AI 智能体对话 | `/chat/<model>` | 标准、教学 Pro、GPT-5.4、Claude、Gemini、Grok、OpenClaw、全学段数学/英语、词境记忆卡、备课助手、班主任助手、论文写作、读书报告、留学文书、简历优化、演讲答辩等 |
| 📝 作文批改 | `/essay`（短入口）、`/chat/standard` | 上传图片或贴文本，AI 按「起承转合 + 字数 + 修辞」打分并润色 |
| 🔍 作文分析 | `/analyze` | 单纯诊断，不重写 |
| 🍌 Banana 2 Pro 4K 图像生成 | `/chat/banana-2-pro` 或 `/chat/creative-image-banana` | 文本→图、参考图→图 |
| 🎨 GPT Image 生成（V11） | `/chat/gpt-image-2` | 多模型/多比例/多质量；支持图生图、mask 修图 |
| 🎵 Suno 音乐生成 | `/chat/suno-v5`（在 ModelSelector 选 Suno V5） | 灵感/自定义/续写/翻唱模式，双轨独立流式 |
| 📄 OpenClaw PPT/HTML | `/chat/open-claw` | 长任务（最长 15 分钟），生成幻灯片/网页 |
| 📚 词境记忆卡 | `/chat/vocab-card` | 单词卡片：发音、词根、记忆故事、TTS 音频 |
| 🎓 家长/教师专区 | `/parent`、`/teacher` | 落地页，介绍各自场景 |
| 👤 账户中心 | `/settings` | 头像、昵称、积分流水、会员状态 |
| 💎 积分 / 邀请 | `/credits`、`/invite` | 查看积分余额、推荐码、邀请奖励 |
| 🛒 套餐购买 | `/pricing` → `/checkout/<productId>` | 微信/支付宝（xunhupay）/ Stripe |
| 📜 历史记录 | `/history` | 对话与作文批改记录 |
| 🔗 内容分享 | `/share/<id>` | 把对话/单条 AI 结果做成公开链接（含 PDF 导出） |
| 🛠 管理后台 | `/admin` | 用户/订单/数据分析（仅密码登录） |

---

## 2. 注册与登录

### 2.1 邮箱 OTP 登录（推荐 / 已开放）

1. 访问 `/auth/email-login`。
2. 输入邮箱 → 点「发送验证码」。
3. 60 秒内会收到一封 6 位验证码邮件（生产用 Resend 发送，开发模式直接显示在页面上）。
4. 输入验证码 → 自动登录或注册。

> ✅ 后端流程：`/api/auth/send-email-otp` → `/api/auth/verify-email-otp` → 调 Supabase Admin `createUser({ email_confirm: true })` + 生成 magiclink → 自动跳转。新用户会自动分配 1000 积分 + 推荐码。

### 2.2 邮箱 + 密码注册（备选）

- 访问 `/auth/sign-up`。
- 至少 6 位密码 + 可选填昵称、手机号、推荐码。
- 注册后会收到一封验证邮件。
- 注册成功跳到 `/auth/sign-up-success`，再点「去登录」。

### 2.3 Authing Guard 登录

- 访问 `/login`（**主推登录入口**）。
- 由 Authing 平台提供登录 UI（短信、第三方登录等都在这里集中）。
- 登录成功后浏览器持有 Authing 的 idToken / accessToken；后端用 RS256 + JWKS 验签后视为合法用户。

> ⚠ 三套身份并存：Supabase Auth、Authing、`localStorage.currentUser`。前端在 `getVerifiedAuthHeaders()` 里**先尝试 Supabase session，再 fallback 到 Authing token**。两套身份在数据库表里都用 TEXT user_id 表示。

### 2.4 微信登录

- 入口 `/auth/wechat-login`，但目前是「开发中」占位页，请使用邮箱或 Authing 登录。

### 2.5 退出登录

- 在 `/settings` 右上角「退出登录」。会清空所有 localStorage 凭据并跳到 `/login`。

---

## 3. 积分与计费

### 3.1 积分基础规则

- 新用户注册自动赠送 **1000 积分**。
- 邀请好友注册：**双方各得 1000 积分**（邀请者最高累计 50000 积分）。
- 分享对话给好友：每天最多 5 次奖励，每次 **1000 积分**；好友点击后再次双方各 1000。

### 3.2 文本类智能体扣费

- 默认计费规则（生产价格版本：`text-split-v2026-05-03`）：
  - **输入**：5 积分 / 1K tokens
  - **输出**：20 积分 / 1K tokens
  - **每次最低收费**：5 积分
  - **每次最低余额要求**：20 积分（普通） / 100 积分（作文批改、长写作）
- 模型分组：
  - **default_text** (`general-chat` 等)：最低 20 积分，最高 4000 输出 tokens
  - **short_agent** (`vocab-card`, `quanquan-math`, `quanquan-english`)：最低 20，3000 tokens
  - **ordinary_writing** (`resume-optimize`, `speech-defense`, `school-wechat`)：最低 20，8000 tokens
  - **essay_correction** (`standard` 作文批改)：最低 100，25000 tokens
  - **long_writing** (`teaching-pro`, `beike-pro`, `ai-writing-paper`, `zhongying-essay`, `reading-report`, `experiment-report`, `study-abroad`)：最低 100，20000 tokens
- 真正扣费基于 Dify 返回的 `prompt_tokens` + `completion_tokens`；取不到则按输出文本估算（中文按 1 字 ≈ 0.67 token）。

### 3.3 媒体类固定扣费

| 模型 | 单次扣费 | 备注 |
|---|---|---|
| GPT Image 2 | 260 积分 | 仅订阅会员可用 |
| GPT Image 1.5 | 200 积分 | 任何登录用户 |
| GPT Image 1 | 150 积分 | 任何登录用户 |
| GPT Image 1 Mini | 80 积分 | 任何登录用户 |
| Banana 2 Pro 4K | 165 积分（150 × 1.1 风险系数） | 任何登录用户 |
| Suno V5 | 100 积分基础 | + 文本 token 费 |

### 3.4 套餐与积分包

- **基础版**：28 元/月，2000 积分/月。
- **专业版**：68 元/月，5000 积分/月（推荐）。
- **豪华版**：128 元/月，12000 积分/月。
- 年付一律打 8 折（×12 × 0.8）。
- **积分充值包**（仅订阅用户可买）：
  - 500 积分包 5 元
  - 1000 积分包 10 元
  - 5000 积分包 48 元（仅 Pro 及以上）
  - 10000 积分包 108 元（仅豪华及以上）
- **企业版 / 校园版**：联系商务，定制。

### 3.5 支付渠道

- **xunhupay**（迅虎）：覆盖支付宝 + 微信，通过聚合支付链接跳转。**主推渠道**。
- **Stripe**：国际卡支付，使用 embedded checkout。⚠ 当前缺 webhook，付款成功后**积分不会自动到账**——若有 Stripe 用户支付，运维需手动跑 `scripts/manual-add-credits.mjs` 补登。
- **微信支付独立接口**：仅占位，未真正接入；建议忽略 `/payment/wechat` 路径。

### 3.6 查询积分 / 流水

- `/credits`：查看积分余额、邀请统计、邀请链接。
- `/settings`：积分流水（最近 50 条），支持下拉。
- `/api/user/credits`、`/api/user/membership`、`/api/user/transactions`：JSON 接口（需登录）。

---

## 4. 各业务模块详细使用说明

### 4.1 通用 AI 对话（智能体专区）

- 入口：`/chat`（无 model 时从 ModelSelector 选）；或直接访问 `/chat/<model>`。
- 操作：
  1. 在底部输入框打字（支持 Markdown、@ 文件、🎤 录音）。
  2. 在左下角 ModelSelector 切换模型。
  3. 上传文件（图片 / PDF / Word / TXT；最大 100 MB）。
  4. 发送后右侧显示 AI 流式回复（Markdown + 代码高亮 + LaTeX）。
- 历史会话保存在 `/history`，「继续对话」可恢复。
- 工具栏：复制 / 朗读（TTS） / 分享 / 打印 / 导出 PDF。

### 4.2 作文批改（核心功能）

- 入口：`/essay` 或 `/chat/standard`。
- 上传方式：
  - 拍照 / 上传图片（最多 100MB），AI 自动识别文字。
  - 直接粘贴作文文本。
- 可选填：学生姓名、年级（小学/初中/高中）、题目、字数要求、文体（记叙/议论/说明/散文）、写作背景。
- 输出（单次大约 1-3 分钟）：
  1. 原文识别呈现（修正明显 OCR 错误）
  2. 规范性诊断（年级适配 / 题目符合度 / 字数 / 文体）
  3. 结构诊断（起承转合表）
  4. 分层进阶润色（规范化 → 结构优化 → 风格提升 → 精细打磨）
  5. 最终定稿
  6. 学习要点总结
- 字数控制硬规则：
  - 小学考场：650 字以内
  - 初中考场：890-900 字以内
  - 高中考场：800-1100 字以内

### 4.3 论文写作 / 中英文作文 / 留学文书 / 简历优化等长文本

- 入口：`/chat/ai-writing-paper` / `/chat/zhongying-essay` / `/chat/study-abroad` / `/chat/resume-optimize` / `/chat/speech-defense` / `/chat/school-wechat`。
- 这些都属于 long_writing 分组，输出可达 20000 tokens；最低需 100 积分余额。

### 4.4 GPT Image 工作台

- 入口：`/chat/gpt-image-2`。
- 模式：
  - **生成**：纯文本 prompt → 图片
  - **编辑**：上传 1-10 张参考图 + 可选 mask → 局部修改
- 参数：宽高比（1:1 / 16:9 / 9:16 / 4:3 ...）、尺寸（1024×1024 / 2048×2048 / 4K）、质量（auto/low/medium/high）、输出格式（png/jpeg/webp）、压缩、背景（auto/opaque/transparent）、内容审核（auto/low）、生成数量（1-4）。
- 模型选择（Image V11）：`gpt-image-2 / gpt-image-1.5 / gpt-image-1 / gpt-image-1-mini`。
- ⚠ GPT Image 2 仅订阅会员（basic 及以上）可用；其他模型登录即可用。
- 异步任务：超大尺寸/4K/高质量会切换到异步模式，进度保存在 `localStorage` 里，刷新页面可继续等待。

### 4.5 Banana 2 Pro 4K 工作台

- 入口：`/chat/banana-2-pro` 或 `/chat/creative-image-banana`。
- 比 GPT Image 更专注 Banana 模型；支持参考图（init_image）。
- 单次 165 积分，会同时返回多张候选图。

### 4.6 Suno V5 音乐生成

- 入口：`/chat/suno-v5`。
- 两种模式：
  - **简单模式**：直接打字描述，AI 自动写歌。
  - **专业模式（推荐）**：手动填表单 — 标题、风格描述（prompt）、歌词（lyrics）、风格标签（style_tags）、否定标签、模型版本（chirp-v5）、男/女声、续写时间点、结束时间点。
- 提交后异步等待（最长 5 分钟，每 5 秒轮询）；返回**双轨道**：每首独立显示「生成中 → 完成」状态。
- 完成后：在线播放 + 下载 + 显示歌词。
- 文件：音频/封面会被服务端转存到沈翔自己的腾讯云 COS（`cdn.shenxiang.school`），保证长期可访问。

### 4.7 OpenClaw（PPT / HTML 生成）

- 入口：`/chat/open-claw`。
- 描述需求 → AI 生成完整幻灯片 / 网页（最长 15 分钟）。
- 生成结果以「文件卡片」形式展示，可点开预览（HTML 直接 iframe，PPT 直接下载）。
- 媒体资源（图片/字体）由 `/api/openclaw-media-sign/[...]` 签名后通过 `/api/openclaw-media/[...]` 鉴权访问。

### 4.8 词境记忆卡

- 入口：`/chat/vocab-card`。
- 输入：单词 + 自定义参数（学段：primary/middle/high/cet4/cet6/postgraduate/ielts/toefl；卡片风格：minimal/colorful/academic/comic/exam/story/root；语言：zh-CN/en）。
- 输出：图文并茂的卡片，包含：
  - 中文意义 + 简单英文释义
  - IPA 音标 + 嘴型提示 + 常见错读
  - 拼写公式 + 词根分解 + 易错点
  - 记忆故事（带视觉场景）
  - 例句（含考试场景）
  - 复习卡（正反面 + 完形填空 + 自检题）
  - 三秒钩子 / 一句话记忆 / 押韵口诀
  - 自动生成 TTS 发音音频

### 4.9 全学段数学 / 英语

- 入口：`/chat/quanquan-math` / `/chat/quanquan-english`。
- 短智能体（最低 20 积分），每次输出 ≤ 3000 tokens；适合解一道题、翻译一段话。

### 4.10 教学评智能助手 / 备课 Pro / 班主任助手

- 入口：`/chat/teaching-pro` / `/chat/beike-pro` / `/chat/banzhuren`。
- 长写作分组，最低 100 积分；可生成完整教案、点评报告、班级公告等。

---

## 5. 文件 / 媒体

### 5.1 上传文件

- 在任何 chat 工作台点 📎 / 拖拽上传。
- 限制：
  - 图片：jpg / png / gif / webp / svg
  - 文档：pdf / txt / docx
  - 音频：webm / mp3 / wav / ogg / m4a
  - 单文件 ≤ 100 MB
- 流程：
  1. 浏览器先做 size + MIME 校验。
  2. POST 到 `/api/dify-upload`；后端再校验 MIME + 重命名为 `${uuid}.${ext}` 防路径穿越。
  3. 普通模型：上传到 Dify 自带 `/files/upload`，得到 `upload_file_id` 跟随后续对话发送。
  4. GPT Image 工作台：上传到自建图片网关（`dify-image-gateway:8001`），得到公开 URL 返回。

### 5.2 录音与语音

- 在底部输入框点 🎤 录音（webm / opus）。
- 录音后通过 `/api/voice/stt`（自建 voice-gateway 8080，OpenAI 语音模型）转文字 → 自动填到输入框。
- AI 回复支持 🔊 朗读（TTS）：`/api/voice/tts` 调 voice-gateway，可切换 OpenAI / Minimax / SiliconFlow 三家提供商。

### 5.3 图片代理 / OpenClaw 媒体

- 所有 AI 生成的外部图片 URL 走 `/api/image-proxy?url=...&raw=1` 代理，避免 CSP / Mixed Content 问题。
- OpenClaw 生成的媒体在浏览器看到的是 `/api/openclaw-media-sign/<path>` 形式（自动 307 跳到签名 URL），后端用 HMAC-SHA256 签 1 小时有效。

---

## 6. 历史记录 / 分享 / 数据导出

### 6.1 历史会话

- `/history`：列出近期对话 + 作文批改。
- 点「继续对话」按钮自动跳到对应模型的 chat 工作台并加载上下文。
- 历史最长保留时间未硬编码，但默认查询返回最近 30 条会话。

### 6.2 内容分享

- 在任意 AI 回复消息卡的右上角点「分享」按钮：
  1. 服务端生成一个 8 位短码（如 `abCDEf12`）写到 `shared_content` 表。
  2. 复制链接 `https://www.shenxiang.school/share/<id>`。
  3. 当天最多 5 次分享奖励（每次 1000 积分）。
- 别人点击分享链接：
  - 看到完整对话或单条内容（带导出 PDF / 复制按钮）。
  - 如果访客也是注册用户，触发 `/api/share/claim-reward` 给访客发 1000 积分（同一访客对同一分享只能领一次；每天最多 5 次）。

### 6.3 导出 PDF

- 消息卡右上角点 🖨 「打印 / 导出 PDF」。
- 浏览器原生打印对话框 → 选「保存为 PDF」。

---

## 7. 账户中心 (`/settings`)

可以做：
- 修改昵称
- 上传头像（JPG / PNG / WebP）
- 查看会员等级（免费 / 基础 / 专业 / 豪华 / 企业 / 校园）
- 查看积分余额 + 流水
- 查看邀请码 + 邀请人数
- 退出登录
- 数据导出 / 删除账户（**当前是占位按钮，请联系客服**）

---

## 8. 邀请 / 推荐系统 (`/invite`)

- 每个注册用户都有自己的推荐码 `SXxxxXXXXXX`（前缀 SX + 3 位随机 + 用户 ID 后 6 位）。
- 邀请链接：`https://www.shenxiang.school/?ref=<code>`。
- 邀请方式：
  1. 复制链接 / 二维码分享给好友。
  2. 微信浏览器内会提示长按复制（因为微信不允许直接 `navigator.share`）。
  3. 桌面端可调用系统分享（如果浏览器支持 Web Share API），否则降级为复制。
- 奖励：
  - 被邀请人注册成功：双方各得 1000 积分。
  - 邀请者累计上限 50000 积分；超过上限不再发放。
  - 邀请关系记在 `referrals` 表（含 status='completed' + reward_credits）。

---

## 9. 套餐购买 (`/pricing` → `/checkout/<productId>`)

- 在 `/pricing` 点选套餐 → 跳到 `/checkout/<productId>`。
- 选择支付方式：
  - **支付宝**：xunhupay 通道
  - **微信**：xunhupay 通道（注意不是「微信支付独立接口」）
- 点击支付：
  1. 后端 `GET /api/payment/xunhupay/create?productId=...&billing=monthly` 创建订单（status='pending'）。
  2. 拿到迅虎返回的支付 URL。
  3. 浏览器跳到迅虎页面 → 完成扫码支付。
  4. 迅虎回调 `POST /api/payment/xunhupay/notify` → 验签 + 金额比对 + 升级订单为 `paid` + 加积分 + 升级会员状态。
  5. 跳回 `/payment/success?orderNo=ORDER_xxx` 显示「支付成功」。
- 支付未到账时如何排查：
  1. 在 `/payment/success` 点「刷新查询」。
  2. 或访问 `/api/payment/status/<orderNo>` 查看实际状态。
  3. 联系客服 / 在管理后台 `/admin` 查看订单。

---

## 10. 管理后台 (`/admin`)

- 访问：`/admin`。
- 登录方式：仅密码（环境变量 `ADMIN_PASSWORD`），通过后拿到 24 小时 token，存 localStorage。
- 标签页：
  - **概览**：总用户、付费会员数、今日新增、今日活跃、订单总数、已支付订单、总营收、今日营收。
  - **用户**：列表 + 搜索 + 点击查看详情（积分流水 + 订单 + 统计）。
  - **订单**：列表 + 状态筛选 + 总收入。
  - **数据分析**：（待扩展）
- 客服在这里可以：
  - 查看用户支付记录 → 手动确认入账
  - 查看用户积分变动审计日志
- ⚠ 详细安全注意见 [`docs/ISSUES.md`](./ISSUES.md) P0-9。

---

## 11. 法律 / 服务条款页面

- `/about`：公司简介、价值观、联系方式。
- `/privacy`：隐私政策（含 Cookie / 数据收集说明）。
- `/terms`：服务条款。
- `/refund-policy`：退款政策。
- `/help`：FAQ（学生 / 教师 / 家长 / 付费 4 大类）。
- 客服联系方式：
  - 电话：`19132896773`（工作日 9:00-21:00）
  - 邮箱：`support@shenxiang.school`
  - 微信公众号：扫描页内二维码

---

## 12. 客户常见问题（FAQ）

### Q1：我充值了但积分没到账？
- 检查 `/payment/success`，如果显示「等待支付结果确认」就 30 秒后再点刷新。
- 如果使用 Stripe：联系客服，**当前 Stripe webhook 未启用，需要人工补登**。
- xunhupay 失败时，迅虎会重试回调，最多等 5 分钟。

### Q2：为什么我看不到积分变动提示？
- 当前版本 `<Toaster />` 组件**未在 layout 里渲染**（已知 Bug，见 ISSUES P1-15）。所有 toast.success / toast.error 不会显示。
- 临时解决：刷新页面查看 `/credits` 真实余额。

### Q3：登录后页面闪一下还是显示未登录？
- 项目使用 Authing + Supabase 双身份；token 存 localStorage。
- 如果浏览器禁用了 localStorage（隐私模式 / 第三方 cookie 限制），登录会失败。
- 建议用 Chrome / Edge 标准模式。

### Q4：作文批改不出结果，扣了积分？
- AI 在判断回复是否「实际有效」上会做正则检测；若文本内含「您尚未提供作文 / 未提供内容」等关键词，会跳过扣费。
- 如确实未生成内容却扣费，请截图客服 + 提供订单号 / requestId。
- 后端审计日志保存在 `ai_task_runs` 表，可由管理员查询。

### Q5：上传文件失败 / 413？
- 单文件 100MB 上限；超过会直接返回 413。
- 仅允许：jpg / png / gif / webp / pdf / txt / docx / mp3 / wav / webm / ogg / m4a。
- 改扩展名伪装会通过浏览器层但被服务端 MIME 校验拦截。

### Q6：微信浏览器打开网站显示「请用浏览器打开」？
- 是 `WxGuard` 组件强制提示。
- 微信 / QQ 浏览器在长链接、外跳支付等场景常被运营商劫持，因此强制要求外部浏览器。
- 解决：右上角菜单 → 「在浏览器打开」。

### Q7：移动端有没有 App？
- 暂时没有；本网站是 PWA（渐进式 Web 应用），可以「添加到主屏幕」。
- 在 iOS Safari：分享 → 添加到主屏幕。
- 在 Android Chrome：菜单 → 安装应用。

### Q8：分享链接里的数据会被搜索引擎索引吗？
- robots.txt 当前**没有 disallow `/share`**（已知 SEO 问题，见 ISSUES P2-19）。
- 客户敏感对话的分享链接建议自己控制传播；后续会修。

### Q9：我能删除自己生成的内容 / 注销账号吗？
- 当前 `/settings` 有「数据导出 / 删除账户」按钮，但仅是占位提示「联系客服」。
- 如需 GDPR / 个人信息保护法相关数据主体权利，邮件 `support@shenxiang.school`。

### Q10：哪些功能仅会员可用？
| 功能 | 免费用户 | 会员 |
|---|---|---|
| 通用对话 / 作文批改 | ✅ 按积分扣费 | ✅ |
| GPT Image 1 / 1.5 / 1 Mini | ✅ | ✅ |
| GPT Image 2 (4K) | ❌ | ✅ basic 及以上 |
| Suno V5 | ✅ | ✅ |
| OpenClaw PPT | ✅ | ✅ |
| 积分充值包 | ❌（仅订阅可购买） | ✅ |
| 5000 / 10000 积分包 | ❌ | ✅ pro / 豪华 及以上 |

### Q11：邀请奖励的上限是多少？
- 单个邀请者累计奖励上限 50000 积分。达到后再邀请仍然给被邀请人 1000 积分，但邀请者不再奖励。

### Q12：积分会过期吗？
- **不会**——所有积分（注册赠送、邀请、分享、充值）都永久有效。
- 充值套餐如「2000/月」会按月发放。

---

## 13. 开发者快速参考

> 此节给到内部开发 / 合作开发者。

### 13.1 技术栈

- **框架**：Next.js 16（App Router + Turbopack）+ React 18.3 + TypeScript 5
- **样式**：Tailwind CSS 4 + shadcn UI + framer-motion
- **后端**：Next.js API routes（Node 运行时） + 自建 Node services（voice-gateway / essay-ai-suite）
- **AI 服务**：Dify（多 API Key 按模型分流）、自建 GPT Image 网关、Suno gateway、voice gateway
- **数据库**：Supabase（PostgreSQL + Auth）；多个表手动 schema，详见 `scripts/00X_*.sql`
- **身份**：Supabase Auth（邮箱）+ Authing OIDC（微信/手机/第三方）；后端用 `lib/auth/verified-user.ts:requireUser` 双校验
- **支付**：xunhupay（聚合支付宝/微信）、Stripe（embedded checkout）；微信支付独立接口为占位
- **存储**：腾讯云 COS（cdn.shenxiang.school）；遗留 Vercel Blob 仍被 `save-message` 使用
- **监控**：Sentry（生产 10% 采样；开发不上报）
- **部署**：Docker + 1Panel + OpenResty 反代；蓝绿部署脚本 `scripts/deploy-blue-green.sh`

### 13.2 启动开发

```bash
npm install
cp .env.example .env
# 填入 NEXT_PUBLIC_SUPABASE_URL / *_ANON_KEY / SERVICE_ROLE_KEY / Dify keys / xunhupay / SUNO 等
npm run dev   # 默认 http://localhost:3000
```

### 13.3 部署到生产

```bash
# 1. 在 Supabase Studio 按顺序跑 scripts/00X_*.sql（核心 schema）
# 2. 配置 .env.production
node scripts/check-env.js   # 必须通过才能部署
# 3. 构建 + 推容器
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
# 4. 蓝绿切换
./scripts/deploy-blue-green.sh latest
```

### 13.4 关键路由速查

| 类型 | 路径 | 说明 |
|---|---|---|
| 鉴权根 | `lib/auth/verified-user.ts` | `requireUser(req)` |
| 计费配置 | `lib/billing-config.ts` | `PRODUCT_CATALOG` + `MEDIA_BILLING` |
| 模型路由 | `lib/dify-credentials.ts` | model → API Key |
| 模型展示 | `lib/pricing.ts:MODEL_COSTS` | model → 显示名 + 计费 |
| 客户端鉴权头 | `getVerifiedAuthHeaders()` | 复制粘贴在 6+ 文件，待重构 |
| AI 任务追踪 | `lib/ai-task-trace.ts` + `ai_task_runs` 表 | requestId / traceId / artifacts |
| 受保护 API 列表 | `lib/supabase/middleware.ts:PROTECTED_API_ROUTES` | ⚠ 当前仅 5 条，与实际不符 |

### 13.5 主要 API 端点

```
GET  /api/health
POST /api/auth/send-email-otp
POST /api/auth/verify-email-otp
POST /api/auth/sync               # 登录后同步用户档案
POST /api/dify-chat               # 主 AI 对话入口（22 模型）
POST /api/dify-upload             # 文件上传到 Dify / 图片网关
POST /api/chat                    # 标准 standard chat（含长文本→essay-grade 路由）
POST /api/essay-grade             # 作文批改 SSE
POST /api/essay-review            # 直走 AI SDK（OpenAI / Claude / Gemini / xAI / Fireworks）
GET  /api/chat-session            # 历史会话列表 / 单会话消息
POST /api/save-message            # 保存消息 + 附件
POST /api/save-essay-review       # 保存作文批改结果
GET  /api/user/credits            # 用户积分
GET  /api/user/membership         # 会员状态
GET  /api/user/transactions       # 积分流水
POST /api/user/update             # 更新昵称/头像 ⚠ 当前漏洞，见 ISSUES P0-1
POST /api/share                   # 创建分享
POST /api/share/claim-reward      # 领分享奖励
POST /api/referral/get-code       # 取/创建推荐码
POST /api/referral/process        # 处理推荐注册
POST /api/payment/xunhupay/create # 创建 xunhupay 订单
POST /api/payment/xunhupay/notify # xunhupay 回调
GET  /api/payment/status/[orderNo]
POST /api/stripe/checkout-session # 创建 Stripe checkout
POST /api/suno                    # Suno 音乐（generate/query/fetch）
POST /api/tts                     # Dify TTS
POST /api/voice/tts               # voice-gateway TTS
POST /api/voice/stt               # voice-gateway STT
POST /api/ocr                     # 图片 OCR (gpt-4o)
GET  /api/admin/stats|users|orders|user-details
POST /api/admin/auth|verify
GET  /api/openclaw-media/[...path]      # 鉴权媒体
GET  /api/openclaw-media-sign/[...path] # 签名重定向
GET  /slides/[...path]                  # OpenClaw HTML
```

### 13.6 数据库表（实际 schema 来自 `scripts/00X_*.sql`）

- `auth.users`（Supabase 内置）
- `profiles`（user 主档；与 `user_profiles` 双表并存，建议合并）
- `user_credits`（user_id TEXT 无 FK；credits / is_pro）
- `credit_transactions`（user_id TEXT；amount/type/billing_metadata）
- `orders`（user_id UUID FK；status enum-like TEXT）
- `referrals` / `referral_codes`（user_id TEXT）
- `shared_content` / `share_reward_claims`
- `chat_sessions` / `chat_messages` / `uploaded_files`
- `essay_reviews`
- `invite_codes` / `invite_code_usage`
- `ai_task_runs`（任务追踪）
- `admin_tokens` / `admin_actions`
- 备份表 `*_backup`（来自 013 未执行的重构计划）—— 建议清理

### 13.7 测试

```bash
npm test                              # 跑全部
npx jest credits.test                 # 单测
npx jest --testPathPattern admin      # 路径过滤
node scripts/stress-test-critical-endpoints.mjs   # 简单压测（默认 100 req / 20 并发）
```

### 13.8 故障排查

| 现象 | 可能原因 | 排查 |
|---|---|---|
| 用户积分应到账但没到账 | Stripe webhook 缺失 / xunhupay 验签失败 / `addCredits` 不在事务 | 看 `ai_task_runs` + `credit_transactions` + `admin_actions` 三表；用 `scripts/manual-add-credits.mjs` 补登 |
| 用户登录后切到另一台浏览器又要登录 | localStorage 不同步；Supabase Cookie 也是 per-browser | 期望行为；若想跨设备 → Supabase Auth 多设备已支持 |
| 调 Dify 超时 | OpenClaw / GPT Image 4K 任务长 | 默认首字节超时 120 秒；OpenClaw 15 分钟；GPT Image blocking 5 分钟；async task 走 `/api/dify-chat?async_image_task=true` |
| 头像上传后旧头像残留 | settings 用 `avatar_${Date.now()}` 文件名 + upsert，不会删旧 | 当前已知问题；运维可定期清理 `avatars/` 桶 |
| `/admin` 按钮重复 / 闪 | localStorage admin_token 已过期但前端未感知 | 退出后重新登录 |

### 13.9 关键环境变量

最少需要的生产 env：
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
NEXT_PUBLIC_AUTHING_APP_ID / AUTHING_ISSUER / AUTHING_AUDIENCE / AUTHING_JWKS_URL
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
DIFY_BASE_URL / DIFY_API_KEY / DIFY_API_KEY_GPT5 / ... / DIFY_BANANA_API_KEY / DIFY_VOCAB_CARD_API_KEY
ESSAY_CORRECTION_API_KEY / ESSAY_CORRECTION_BASE_URL
DIFY_IMAGE_GATEWAY_URL / DIFY_IMAGE_GATEWAY_TOKEN
SUNO_API_BASE_URL / SUNO_GENERATE_API_KEY / SUNO_QUERY_API_KEY
XUNHUPAY_APPID / XUNHUPAY_APPSECRET / XUNHUPAY_API_URL
STRIPE_SECRET_KEY (Stripe)
RESEND_API_KEY / EMAIL_FROM
TENCENT_COS_SECRET_ID / TENCENT_COS_SECRET_KEY / TENCENT_COS_BUCKET / TENCENT_COS_REGION
TENCENT_COS_INTERNAL_ENDPOINT / TENCENT_COS_CDN_DOMAIN
VOICE_GATEWAY_URL / OPENAI_API_KEY / MINIMAX_API_KEY / SILICONFLOW_API_KEY
SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_APP_URL = https://www.shenxiang.school
```

---

## 14. 已知问题与改进路线图

详见 [`docs/ISSUES.md`](./ISSUES.md)。最关键的 P0 项概览：

1. 多个 API 接受前端 `userId` → 已有用户身份伪造可能（涉及 15+ 路由）。
2. `/api/openclaw-media-sign` 公开签发 + `/api/openclaw-media` 横向越权。
3. `/slides/[...path]` 公开 + text/html 直出 → stored XSS。
4. `/api/auth/verify-email-otp` 把 magiclink 直接返回前端。
5. `email-otp-store` 把整张 OTP 表打到 console.log。
6. 微信支付 / Stripe webhook 缺失 → 收钱不到货。
7. `/api/debug/*` 仅靠 NODE_ENV 兜底。
8. 管理员 token 弱熵；存 localStorage。
9. RLS `auth.uid()::text = user_id` 对 Authing 用户失效。
10. share / MessageBubble 用 `printWindow.document.write` 渲染用户内容。
11. `lib/cos.uploadToCos` SSRF 风险。
12. `/api/tts` `/api/voice/tts` `Cache-Control: public` → CDN 缓存中毒。

---

## 15. 联系方式

- **客户支持**：support@shenxiang.school（工作日 9:00-21:00）
- **客服电话**：19132896773
- **微信公众号 / 客户经理**：扫描 `/help` 页内二维码
- **官网**：https://www.shenxiang.school
- **GitHub**（内部仓库 / 同步给合作开发者）：https://github.com/zhangyufei820/ai-essay-editor

---

> 文档版本：基于代码扫描自动整理，最后更新 `2026-05-16`。
> 如有出入，以最新代码为准。建议把 `docs/HELP.md` 作为终端用户「帮助中心」的 SoT，并由产品经理同步更新到 `app/help/page.tsx` 的 FAQ 数据源。
