# 沈翔智学 ai-essay-editor — 全站代码审计 & 帮助文档

> 审计目标：https://github.com/zhangyufei820/ai-essay-editor
> 生产部署：https://www.shenxiang.school
> 审计日期：2026-05-16

## 文件清单

| 文件 | 行数 | 内容 |
|---|---|---|
| [HELP.md](./HELP.md) | 645 | **网站帮助文档**（用户 + 开发者）：22 个智能体、注册登录、积分计费、各模块教程、12 条 FAQ、开发者快速参考 |
| [ISSUES.md](./ISSUES.md) | 391 | **改进点汇总**（P0/P1/P2/P3 分级 60+ 项），按主题归类一图（鉴权 / 资金 / Schema / SSRF / 性能 / UX） |
| [_audit_pages.md](./_audit_pages.md) | 845 | 47 个页面级路由（page.tsx / layout / error / sitemap）逐一分析 + 20 项全局反模式 |
| [_audit_api.md](./_audit_api.md) | 467 | 50 个 API 路由（功能 / 鉴权 / 速率限制 / 下游 / 副作用 / 问题）+ 鉴权矩阵 |
| [_audit_lib.md](./_audit_lib.md) | 345 | lib/ 49 个模块 + supabase migrations + 依赖关系 Mermaid 图 |
| [_audit_components.md](./_audit_components.md) | 228 | 132 个组件分析（含 6120 行 chat-interface 三件套）+ 横向反模式 |
| [_audit_services.md](./_audit_services.md) | 192 | services/ + scripts/ 19 个 SQL + 测试 + Docker + 部署 |

## 最严重 5 个发现（P0）

1. **`/api/user/update`、`/api/chat`、`/api/suno`、`/api/share`、`/api/referral/*`、`/api/stripe/checkout-session` 等 15+ 路由**接受前端 `userId` → 任意人可改他人昵称、扣他人积分、刷推荐奖励。
2. **`/api/openclaw-media-sign/[...path]` 完全公开**签发任意 path 签名 URL → 配合 `/api/openclaw-media` 不查 owner，**任意注册用户可读所有人的 PPT/媒体**。
3. **`/slides/[...path]` 公开 + `text/html` 直出** → 任意人可在主域名下渲染用户上传的 HTML，stored XSS。
4. **`/api/auth/verify-email-otp` 把 magiclink action_link 直接返给前端** + **`email-otp-store` 把整张 OTP 表 console.log**。
5. **微信支付占位 + Stripe 缺 webhook** → 部分支付通道收钱不到货。

## 致命体验 Bug

仓库使用 `sonner` toast 但 `app/layout.tsx` 没有渲染 `<Toaster />` —— **所有 toast 提示均不显示**。

## Schema 灾难

`scripts/00X_*.sql` 19 个迁移文件里 schema 重复定义、015 显式 DROP `auth.users` FK 以兼容 Authing TEXT id、013 留下未执行的「企业级重构」+ 一堆 `*_backup` 表、008 预置 `BETA2024 / WELCOME / TEST123` 邀请码进 git；`supabase/migrations/` 仅 003 一份。
