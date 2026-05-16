# services / scripts / supabase / hooks / types / 测试 / 容器化 审计报告

---

## 一、`services/` —— 旁路服务

### 1.1 `services/voice-gateway/`

- **目的**：对外提供 `/voice/stt`、`/voice/tts` HTTP 接口；抽象 OpenAI / Minimax / SiliconFlow 三家提供商；多媒体网关由 `app/api/voice/{stt,tts}` 反向代理。
- **形态**：Node 20 + 单文件 `src/server.mjs`，依赖原生 `node:http`，无 Express。
- **端口**：8080；`docker-compose` 内部 `voice-gateway` hostname。
- **环境变量**：`VOICE_TTS_PROVIDER / VOICE_STT_PROVIDER / VOICE_TTS_MODEL / VOICE_STT_MODEL / OPENAI_API_KEY / MINIMAX_API_KEY / SILICONFLOW_API_KEY`，`MAX_TTS_CHARS=600`、`MAX_AUDIO_BYTES=25MB`。
- **⚠ 问题**：
  - 该服务的 source 在主项目 `tsconfig.json` 的 `exclude` 中——意思是它**完全不被主项目类型检查或打包**。维护时容易掉队。
  - 单一服务支持 3 个上游 TTS、2 个上游 STT，开关在环境变量；若 env 拼错（如 `siliconflow` 拼成 `silicon-flow`）会回退到 OpenAI 默认而不报错。
  - 写在 `.mjs`（无 TypeScript），与项目主语言不一致，与 `services/essay-ai-suite/` 的 TS 风格也不一致。

### 1.2 `services/essay-ai-suite/`

- **目的**：从仓库内可见，是一个**独立的、可被 1Panel 应用商店一键安装**的「作文批改 AI 套件」（含 grader / OCR / queue / storage / docker-compose / 1panel manifest）。
- **结构**：完整的 TS 项目（`src/server.ts` `grader.ts` `document-extractor.ts` `ocr-service.ts` `queue.ts` `storage.ts` 等），独立 `package.json` + `tsconfig.json` + `Dockerfile`（Node 22-alpine 多阶段构建）+ docker-compose；EXPOSE 3100。
- **关系**：理论上是 `app/api/essay-grade/route.ts` 之外的另一种实现路径——但当前 web 端实际调的是 Dify 的 `ESSAY_CORRECTION_API_KEY`，并未走这个 essay-ai-suite。
- **⚠ 问题**：
  - **悬空模块**：仓库根 `package.json` 没有任何 `workspace` 配置（且不是 monorepo），但子目录有自己 `package.json` + `package-lock.json` + `node_modules`（潜在）。**两套依赖图，版本极易漂移**。
  - 用户在 README 路径里出现「AGENTS.md / CLAUDE.md / .claude / .Codex」等多个 AI 助手元数据目录，反映该仓库被多个 AI 工具反复改过，导致服务边界混乱。
  - 1Panel manifest（`releases/essay-ai-suite-1panel-local-app-0.1.0.tar.gz`）入了 git，是二进制 binary blob，应单独发布。

---

## 二、`scripts/` —— 数据库迁移 + 一次性运维脚本

### 2.1 SQL 迁移（19 + 1 修复脚本，**真正的 schema 来源**）

> 之前在 supabase/migrations/ 只看到 `003_admin_tables.sql`，**误以为没有迁移**——实际上完整 schema 都在 `scripts/00X_*.sql`。

| 文件 | 表/字段 | 关键 RLS / 字段问题 |
|---|---|---|
| `001_create_profiles.sql` | `profiles` | RLS 策略完整；FK auth.users(id) ✅ |
| `002_profile_trigger.sql` | trigger 自动建 profile | OK |
| `003_add_wechat_fields.sql` | profile.wechat_id | OK |
| `004_create_orders_table.sql` | `orders` | FK `auth.users(id) ON DELETE CASCADE`；status 用 TEXT 而非 enum；只允许 SELECT；INSERT/UPDATE 全部依赖 service_role |
| `005_create_chat_tables.sql` | `chat_sessions` / `chat_messages` / `uploaded_files` | 未读但应类似 |
| `006_create_credits_system.sql` | `user_credits` `credit_transactions` `referrals` `referral_codes` | RLS 全部 SELECT only；初始 1000 积分；`UNIQUE(referee_id)` 防止一个用户被多次邀请 ✅ |
| `007_create_credits_trigger.sql` | trigger 让新用户自动得 1000 积分 | OK |
| `008_create_invite_codes.sql` | `invite_codes` `invite_code_usage` | **预置三个 hardcoded 邀请码 'BETA2024' 'WELCOME' 'TEST123'，max_uses=999999** —— 等于无限制公开邀请码，进入仓库等于公开发布 |
| `009_create_shares_table.sql` | `shared_content` | 未读 |
| `010_add_music_metadata.sql` | metadata 列 | OK |
| `011_create_credit_transactions.sql` | **重复定义** `credit_transactions`（user_id 这次是 TEXT 不是 UUID） | **与 006 冲突**——006 用 UUID + FK auth.users，011 用 TEXT 无 FK，两份 schema 同时存在；运行哪个取决于谁后跑 |
| `012_fix_orders_table.sql` | 修 orders | 通常是补字段 |
| `013_enterprise_database_migration.sql` | "企业级重构" 备份 + 新 `users` 表 + 显示了准备 DROP 旧表的注释 | **这是一份未真正执行的"未来计划"**，包含 backup 命令但 DROP 被注释；仅创建 `*_backup` 副本表，加重了数据库的混乱（每张主表都有一份 backup） |
| `014_share_reward_claims.sql` | `share_reward_claims` `UNIQUE(share_id, viewer_id)` | RLS 完整 ✅ |
| `015_remove_fk_constraint.sql` | **DROP** `user_credits.user_id_fkey` 外键 | **关键决策**——为支持 Authing TEXT id 而**移除了 FK 完整性**；同时**硬编码给特定用户 `6968c52fee5fbd3da1da9f7c` 充值 2000 积分**（运维捷径污染了 schema 文件） |
| `016_fix_user_subscriptions.sql` | 修订订阅 | 未读 |
| `017_create_referral_tables.sql` | **再次重复定义** `referrals` `referral_codes`（这次 user_id 是 TEXT，无 FK） | **与 006 冲突**：006 是 UUID + FK，017 是 TEXT + 无 FK；RLS 改成「Allow public read」「Allow service role 写」——`USING (true)` 等于无策略 |
| `018_create_ai_task_runs.sql` | `ai_task_runs`（user_id TEXT，含 node_events / artifacts JSONB） | RLS only SELECT auth.uid::text=user_id ✅ |
| `019_add_billing_metadata_to_credit_transactions.sql` | `credit_transactions.billing_metadata JSONB` | 幂等 ALTER TABLE，安全 ✅ |
| `fix_missing_credits.sql` | 补救 | hotfix |

#### 关键发现

1. **schema 与 supabase/migrations/ 不一致**：仓库实际使用 `scripts/`，而 Supabase 的标准 `supabase/migrations/` 只有 admin_tables。说明运维流程是「在 Supabase Studio 手动跑 scripts/00X.sql」，没有走 Supabase CLI。出现新成员部署项目时找不到完整 schema。
2. **Authing 与 Supabase Auth 双身份导致的破坏**：`006`/`017`/`011` 三波 schema 修订，最终把 `user_id` 从 UUID + FK 改为 TEXT + 无 FK。这意味着：
   - `auth.uid()::text = user_id` 的 RLS 策略对 Authing 用户**完全无效**（因为 `auth.uid()` 在 Authing 用户上下文里为 NULL）；
   - 意味着 Authing 用户**只能通过 service_role 访问数据库**，所以前面 lib/api 审计里大量 service_role 路径不是「过度授权」，而是**唯一可行的方案**。这不是 bug，而是系统性架构妥协。
3. **重复定义**：`referrals` `referral_codes` `credit_transactions` 都被定义两次（UUID 版 + TEXT 版）。无 `DROP TABLE IF EXISTS` 兜底。线上实际跑哪个未知。
4. **预置邀请码进入版本控制**：`BETA2024 / WELCOME / TEST123` 全部 `is_active=true, max_uses=999999`——**任何人 fork 仓库即拥有无限邀请权**（虽然代码当前没有真实校验邀请码作为注册门槛，但仍是公关风险）。
5. **特定用户硬编码**：`015` 给 `6968c52fee5fbd3da1da9f7c` 加 2000 积分。这种运维操作不应进 schema migration 文件，应放 scripts/seed/ 或 oneoff hotfix scripts。
6. **企业级重构 13** 含 DROP 注释 + 备份表，处于「准备但未执行」状态——这种半成品迁移应在 PR 阶段拒绝。

### 2.2 一次性运维脚本（.mjs / .ts）

主要是给指定用户加积分、查订单、修订阅之类。**全部直接读 `process.env.SUPABASE_SERVICE_ROLE_KEY` 操作生产库**。

- `add-credits-13868308109.mjs`、`add-credits-15858565338.mjs`、`add-credits-17857853785.mjs`、`add-credits-695cf6ea8bde54caeb7f5ba1.mjs`：**手机号/UUID 硬编码进文件名**——客户隐私进入 git 历史。
- `fix-user-13868308109-membership.mjs`、`query-user-15058755728.mjs` 同上。
- `fix-three-users-credits.mjs`、`fix-all-paid-users.mjs`、`fix-all-subscriptions.mjs`、`fix-all-users-final.mjs`、`fix-database-issues.mjs`：**多次"全量修"脚本**，一遍一遍叠加，没有版本号或 timestamp。
- `diagnose-token-mismatch.mjs`、`diagnose-referral.mjs`、`diagnose-user-13868308109.mjs`：诊断脚本，可保留但应剥离用户标识符。
- `monitor-image-unified.sh`、`startup.sh`、`deploy-blue-green.sh`：运维脚本。
  - `startup.sh` 第 3 步 `fuser -k 3000/tcp` —— 启动前直接杀 3000 端口任何进程，**对蓝绿部署是反操作**；同时操作 `/usr/local/openresty/nginx/conf/conf.d` 和 `/etc/nginx/sites-enabled/`，等于服务启动时强制改变运维基础设施配置。
- `stress-test-critical-endpoints.mjs`：压测脚本，期望 `dify-chat-auth-guard` 返回 401（已通过 requireUser 校验），证明设计意图是 401，但前面 API 审计发现一些路由实际没接入 requireUser。压测不会捕获到这点（它只测 401 响应是否到达）。
- `check-env.js`：✅ **唯一规范的脚本**——读 `.env.production` 校验必需变量，找到 `DIFY_BASE_URL=https://api.dify.ai/v1` 这种 fallback 也会拒部署。是好习惯。
- `manual-add-credits.mjs / .ts`：**两个重复版本**（mjs + ts），同一功能两实现。
- `test_cos_smoke.py`：唯一 Python 文件，一次性烟测。
- `test-banana-api.mjs`：Banana API 烟测；包含真实 token 风险（需检查是否 hardcoded）。

### 2.3 ⚠ scripts/ 的横向问题

1. **SQL 迁移不走 Supabase CLI**，缺 `supabase db push` 工作流；
2. 19 个 SQL 文件仅在 `scripts/`，与 `supabase/migrations/003_admin_tables.sql` 不一致；
3. **手机号入 git**——多个 `add-credits-13868308109.mjs`、`fix-user-13868308109-membership.mjs` 等文件名直接是手机号，PII 永久留在 git history；
4. 半执行的 `013_enterprise_database_migration.sql` + 已执行的 `015_remove_fk_constraint.sql` 让数据库结构进入「半新半旧 + 备份表满桌」状态；
5. 预置邀请码 `BETA2024 / WELCOME / TEST123` 入 git 仓库；
6. `startup.sh` 直接 `fuser -k`、改 `/usr/local/openresty/...` 配置，应作为部署一次性步骤而非启动脚本。

---

## 三、`hooks/`

| 文件 | 用途 | 备注 |
|---|---|---|
| `useMediaQuery.ts` | media query | 标准 |
| `use-mobile.ts` | 是否移动端 | OK |
| `usePerformance.ts` | 性能监控 | 未读，可能上报 web-vitals |
| `useSelectedModelStore.ts` | zustand 模型选择 store | OK，唯一一处 zustand 使用，但与 `enhanced-chat-interface` 内部 useState(selectedModel) 状态分裂 |
| `useSunoMusic.ts` | Suno 音乐生成轮询 hook | 包含 `extractTaskId / removeTaskIdFromText` |
| `useWorkflowVisualizer.ts` | Dify 工作流节点展示 | OK |

⚠ 命名风格不统一：`use-mobile.ts`（kebab）vs `useMediaQuery.ts`（camel）——同目录混用。

## 四、`types/`

只有 `react-syntax-highlighter.d.ts`（npm 类型补丁），其他自定义类型散落在各 lib 文件里，未集中。

---

## 五、`__tests__/` —— Jest 测试覆盖

仓库**有 31 个测试文件**（共 ~2546 行），**比迁移 SQL 还多**！覆盖：
- `admin-api-guards.test.ts`：static text 检查所有 admin route 都包含 `verifyAdminToken`
- `payment-guards.test.ts`：检查 xunhupay 验签、金额比对
- `credits.test.ts` / `pricing.test.ts`（296 行）：计费正确性
- `authing-jwt.test.ts`：JWT 验签
- `dify-credentials.test.ts` / `chat-session-routes.test.ts`：模型路由 / API key 选择
- `image-generation-config.test.ts` / `image-generation-routing.test.ts` / `gpt-image-v11.test.ts`：图片工作流
- `vocab-card-workflow.test.ts` / `word-card-normalizer.test.ts`：词境记忆卡
- `text-sanitizer.test.ts` / `voice-tts-request.test.ts` / `health-routes.test.ts` / `ai-task-trace.test.ts` / `openclaw-*.test.ts`：lib 工具测试
- `metadata.test.ts` / `legal-footer.test.ts` / `growth-conversion.test.ts` / `monitoring-docs.test.ts` / `operations-pages.test.ts`：**用 grep / static 字符串检查 page metadata、文档存在性**——属于「文档防腐测试」

⚠ 测试基本是 **静态字符串包含检查 + lib 单元测试**，**没有 e2e**，**没有针对 `/api/*` 集成测试**——意味着 `/api/chat` userId 伪造、`/api/openclaw-media-sign` 公开签发、`/api/share` 任意 userId 等漏洞**测试不会捕获**。

---

## 六、`middleware.ts` 与 `instrumentation*.ts`

已在任务 1 详细分析。补充注意点：

- `middleware.ts` 把所有带 `next-action` header 或路径含 `_next/server-actions` 的请求直接 410——这条对 Next.js 16 是过激措施，因为 RSC 在 `next/link` prefetch 时也可能携带类似 header，会偶现 410。
- `instrumentation.ts` / `instrumentation-client.ts` 仅初始化 Sentry，没有 OpenTelemetry。

---

## 七、容器化 / 部署

### 7.1 `Dockerfile` & `docker-compose.yml` & `docker-compose.prod.yml`

- **`docker-compose.yml`** 在 `args` 里**硬编码**了：
  ```yaml
  NEXT_PUBLIC_SUPABASE_URL: "https://rnujdnmxufmzgjvmddla.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_J6ZjOA1cvNVJE0msWjvJEA_Y3MHr9LH"
  ```
  虽然 anon key 设计上是公开的，但**仓库里直接写死生产 supabase 项目 ID**等于把基础设施暴露到公网。
- `DIFY_INTERNAL_URL=http://docker-api-1:5001/v1`、`DIFY_IMAGE_GATEWAY_URL=http://dify-image-gateway:8001`、`DIFY_IMAGE_GATEWAY_PUBLIC_URL=http://43.154.111.156:8001` 也在 compose 里写死——与 lib/openclaw-media.ts、suno-config.ts、.env.example 多处冗余。
- `read_only: true`、`mem_limit: 512m`、`pids_limit: 256`、`tmpfs` 挂载——**容器层硬约束良好**。
- `mem_limit: 512m` 对 Next.js 16 + Sentry + 大量动态 import 偏紧，构建生产内存占用通常 ≥ 700MB。
- `docker-compose.prod.yml` 用 `${VAR}` 占位符走 .env.production，是合理做法。

### 7.2 `Dockerfile`

- 多阶段构建（builder + runtime）。
- `ARG NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` 嵌入到构建产物——必要的，因为 Next.js 会把 `NEXT_PUBLIC_*` inline 进 JS bundle。
- 显式 `RUN node -e "if (!process.env[key]) ..."` 校验必需 ARG，✅ 部署前预检。

### 7.3 `.gitignore` / `.env.example` / `.env.production.example`

- `.env.example` 已审：内含真实 IP `43.154.111.156:8001`、生产 hostname `cdn.shenxiang.school`、内网 endpoint `media-shenxiang-1394034082.cos-internal...`。
- 是「教学型」而非「占位型」配置——把生产基础设施细节都暴露给任何 fork 此仓库的人。

---

## 八、其他根级文件

| 文件 | 用途 / 状态 |
|---|---|
| `nohup.out` | 日志文件入了 git 仓库（应在 .gitignore 里） |
| `.vercel-rebuild` | 触发 Vercel 重建的 marker |
| `test-admin-api.sh` | 一次性 admin API 烟测脚本 |
| `公测部署指南-小白版.md` `网站评估.md` | 中文运维文档；正常 |
| `BETA_TESTING_GUIDE.md` `DEPLOYMENT_GUIDE.md` `VERCEL_DEPLOYMENT.md` `DATABASE_MIGRATION_GUIDE.md` `API-INTEGRATION-GUIDE.md` `API配置说明.md` `SUNO_CONFIG.md` `TESTING_GUIDE.md` `CUSTOM_API_GUIDE.md` `CLAUDE-P0-FIX.md` 等 | **十多份重叠 / 半冗余的 markdown 指南**——文档膨胀，没有单一 SoT |
| `.claude/` `.Codex/` `.superpowers/` `.vscode/` | 多个 AI 工具 / IDE 配置 | 可见多个 AI 助手参与过开发，导致风格混杂 |
| `.github/` | GitHub Actions / 配置 | 未读 |

---

## 九、横向总结

1. **schema 由 `scripts/` 管，Supabase CLI 体系空运行**：唯一在 `supabase/migrations/` 的 003 是后期补的「admin tables」，其他 18 个迁移留在 `scripts/`，跨人协作时迷路概率极高。
2. **数据库历史叠加导致 schema 混乱**：006 vs 011/017 多处定义同一张表；015 删除 FK；013 留了备份表却没 DROP，让生产数据库充满 `*_backup` 残留。
3. **PII 入仓**：手机号文件名、特定 user_id 的硬编码 SQL、预置邀请码。
4. **services/ 是隔离的 monorepo 子项目，但没有 workspace 配置**——两套依赖图，类型检查 / 编译边界模糊。
5. **运维侧**：Docker compose 把 supabase 项目 URL + anon key + IP 全部 commit 到仓库；`startup.sh` 强制改写 OpenResty 配置；`fuser -k` 启动；多个手动 `fix-*-credits.mjs` 是数据库正确性的 last resort。
6. **测试方向偏「文档/字符串保护」而非「行为」**：31 个 test 主要保 page metadata、route 是否包含 `verifyAdminToken` 等关键字；缺真实 e2e 鉴权 / 计费回归测试。
7. **多个 AI 助手痕迹**：`.claude/` `.Codex/` `.superpowers/` 三套，AGENTS.md / CLAUDE.md / 多份 *.md 文档，风格混杂 → 维护者切换时 onboarding 困难。
