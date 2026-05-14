# 沈翔智学 · 创作广场（Content Sharing Community）

## 项目概述

将平台所有 AI 生成内容（作文批改、图像、闪卡、数学动画、PPT 摘要、智能体对话）转化为可分享、可浏览、可互动的社区资产，形成"使用→分享→获客→付费"飞轮。

## 核心指标

| 指标 | 目标 |
|---|---|
| 分享率（生成内容中被分享的比例） | > 15% |
| 分享页面访问→注册转化率 | > 8% |
| 日均新增分享内容 | > 50 条 |
| 社区页面平均停留时间 | > 3 分钟 |
| 积分激励成本（每获客积分消耗） | < ¥0.5 |

---

## 总体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                      创作广场 系统架构                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  已有生成能力                   分享层                  展示层        │
│  ┌──────────┐                 ┌────────┐             ┌──────────┐  │
│  │作文批改  │─── 一键分享 ───→│ 分享API │────────────→│/explore  │  │
│  │AI绘画   │    +积分奖励     │ 积分引擎│             │ 社区浏览  │  │
│  │闪卡生成  │                 │ 审核系统│             │          │  │
│  │数学动画  │                 └────────┘             │/share/xxx│  │
│  │PPT摘要  │                                        │ 独立详情  │  │
│  │智能体对话│                                        └──────────┘  │
│  └──────────┘                                             │        │
│                                                           ▼        │
│                                                    ┌──────────┐    │
│                                                    │ 转化入口  │    │
│                                                    │ CTA按钮   │    │
│                                                    │ → 注册    │    │
│                                                    │ → 付费    │    │
│                                                    └──────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 数据表关系

```
auth.users
    │
    ├── 1:N → shared_contents（用户发布的分享）
    │              │
    │              ├── 1:N → content_likes（点赞）
    │              ├── 1:N → content_comments（评论）
    │              └── 1:N → share_rewards（奖励记录）
    │
    └── 已有表（user_progress, flashcards, user_files...）
```

---

## 数据库 Schema

### shared_contents（分享内容表）

```sql
CREATE TABLE IF NOT EXISTS shared_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  content_data JSONB NOT NULL,
  thumbnail_url TEXT,
  preview_text TEXT,
  subject VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  ai_model_used VARCHAR(50),
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  share_out_count INT DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  share_code VARCHAR(12) UNIQUE NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'under_review', 'hidden')),
  credits_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### content_likes（点赞表）

```sql
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES shared_contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, user_id)
);
```

### content_comments（评论表）

```sql
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES shared_contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (char_length(comment_text) >= 2 AND char_length(comment_text) <= 500),
  like_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### share_rewards（奖励记录表）

```sql
CREATE TABLE IF NOT EXISTS share_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES shared_contents(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  credits_awarded INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id, reward_type)
);
```

### 索引

```sql
CREATE INDEX IF NOT EXISTS idx_shared_contents_browse ON shared_contents(content_type, created_at DESC) WHERE status = 'published' AND visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_shared_contents_popular ON shared_contents(like_count DESC, created_at DESC) WHERE status = 'published' AND visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_shared_contents_featured ON shared_contents(created_at DESC) WHERE is_featured = TRUE AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_shared_contents_user ON shared_contents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_contents_code ON shared_contents(share_code);
CREATE INDEX IF NOT EXISTS idx_content_likes_content ON content_likes(content_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_user_content ON content_likes(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_id, created_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_share_rewards_user_content ON share_rewards(user_id, content_id);
```

### RLS 策略

```sql
ALTER TABLE shared_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view public shared content" ON shared_contents FOR SELECT USING (status = 'published' AND (visibility = 'public' OR visibility = 'unlisted'));
CREATE POLICY "Users manage own shared content" ON shared_contents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Logged in users manage likes" ON content_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone view likes" ON content_likes FOR SELECT USING (true);
CREATE POLICY "Anyone view published comments" ON content_comments FOR SELECT USING (status = 'published');
CREATE POLICY "Logged in users create comments" ON content_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own comments" ON content_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own rewards" ON share_rewards FOR SELECT USING (auth.uid() = user_id);
```

---

## 内容类型矩阵

| content_type | 来源 | 缩略图方式 | 详情展示方式 |
|---|---|---|---|
| `essay_review` | 作文批改功能 | 文字截取前 100 字 | 原文+批注+得分 |
| `image` | gpt-image-2 / Gemini 图像 | 生成的图片本身 | 大图+prompt |
| `flashcard_deck` | 闪卡生成功能 | 卡片数量+学科标签 | 可翻转的闪卡预览 |
| `manim_video` | Manim 数学动画 | 视频第一帧截图 | 内嵌视频播放 |
| `ppt_summary` | PPT 摘要功能 | 要点列表前 3 条 | 完整摘要+要点 |
| `agent_conversation` | 教师智能体对话 | 对话精华片段 | 对话气泡展示 |
| `quiz_result` | 出题练习结果 | 得分+正确率 | 题目+答案+解析 |

### content_data 结构定义

```typescript
// 作文批改
type EssayReviewContent = {
  original_text: string;
  score: number;
  overall_comment: string;
  paragraph_comments: { paragraph: string; comment: string }[];
  suggestions: string[];
  model: string;
};

// AI 图像
type ImageContent = {
  image_url: string;
  prompt_used: string;
  aspect_ratio: string;
  style_tag: string;
};

// 闪卡集
type FlashcardDeckContent = {
  deck_name: string;
  cards: { question: string; answer: string; difficulty: number }[];
  source_notes_preview: string;
  total_cards: number;
};

// 数学动画
type ManimVideoContent = {
  video_url: string;
  topic: string;
  functions: string[];
  thumbnail_url: string;
};

// PPT 摘要
type PPTSummaryContent = {
  original_filename: string;
  summary: string;
  key_points: string[];
  slide_count: number;
};

// 智能体对话精华
type AgentConversationContent = {
  agent_name: string;
  agent_template: string;
  highlights: { role: string; content: string }[];
  total_messages: number;
};

// 练习/测验结果
type QuizResultContent = {
  total_questions: number;
  correct_count: number;
  score: number;
  questions: { question: string; user_answer: string; correct_answer: string; is_correct: boolean }[];
};
```

---

## 积分激励体系

### 奖励规则

| 行为 | 积分奖励 | 限制 |
|---|---|---|
| 首次分享内容 | +5 | 每条内容只奖一次 |
| 分享到微信/朋友圈 | +3 | 每条每天限 1 次 |
| 获得 10 个赞 | +5 | 里程碑，不可重复 |
| 获得 50 个赞 | +15 | 里程碑 |
| 获得 100 个赞 | +30 | 里程碑 |
| 被站长精选 | +20 | 不可重复 |
| 首次收到评论 | +2 | 每条内容限 1 次 |
| 给别人点赞 | +1 | 每天限 10 次 |
| 写评论 | +2 | 每天限 5 次 |
| **每日社交积分上限** | — | **30** |

### 防刷机制

| 风控规则 | 实现方式 |
|---|---|
| 同一内容不重复奖励 | share_rewards 表 UNIQUE 约束 |
| 每日积分上限 | 每天通过社交行为最多获得 30 积分 |
| 自赞无效 | API 层校验 user_id != content.user_id |
| 内容审核 | 站长可随时 hide |
| 评论长度 | 最少 2 字，最多 500 字 |

---

## API 路由清单

| 方法 | 路径 | 功能 | 认证 |
|---|---|---|---|
| POST | `/api/share` | 创建分享 | 必须 |
| GET | `/api/share` | 我的分享列表 | 必须 |
| GET | `/api/share/[shareCode]` | 分享详情（公开） | 不需要 |
| DELETE | `/api/share/[shareCode]` | 删除分享 | 必须(本人) |
| POST | `/api/share/[shareCode]/like` | 点赞/取消赞 | 必须 |
| GET | `/api/share/[shareCode]/comments` | 评论列表 | 不需要 |
| POST | `/api/share/[shareCode]/comments` | 发表评论 | 必须 |
| POST | `/api/share/[shareCode]/external-share` | 记录外部分享 | 必须 |
| GET | `/api/share/[shareCode]/og-image` | OG 卡片图 | 不需要 |
| GET | `/api/explore` | 社区浏览（分类/排序/分页） | 不需要 |
| GET | `/api/explore/leaderboard` | 排行榜 | 不需要 |
| PUT | `/api/admin/share/[shareCode]` | 站长管理（精选/隐藏/置顶） | Admin |

---

## 页面清单

| 路径 | 类型 | 认证 | 说明 |
|---|---|---|---|
| `/explore` | CSR | 不需要 | 社区浏览（游客可看，互动需登录） |
| `/share/[shareCode]` | **SSR** | 不需要 | 独立详情页（SEO + OG + 公开） |
| `/my/shares` | CSR | 必须 | 我的分享管理 |

---

## 页面设计

### /explore 社区探索页

```
┌────────────────────────────────────────────────────────────────┐
│  🔥 创作广场                                    [分享我的作品]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  分类标签栏（横向滚动）：                                       │
│  [全部] [作文批改] [AI绘画] [闪卡集] [数学动画] [PPT] [智能体] │
│                                                                │
│  排序：[最新] [最热] [精选]                                     │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 📸 缩略图    │  │ 📸 缩略图    │  │ 📸 缩略图    │        │
│  │              │  │              │  │              │        │
│  │ 标题...      │  │ 标题...      │  │ 标题...      │        │
│  │ @用户 · 3h   │  │ @用户 · 1d   │  │ @用户 · 2d   │        │
│  │ ❤️ 45 💬 12  │  │ ❤️ 23 💬 5   │  │ ❤️ 67 💬 20  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  [加载更多]                                                    │
└────────────────────────────────────────────────────────────────┘

布局：桌面 3 列 / 平板 2 列 / 手机 1-2 列
```

### /share/[shareCode] 独立详情页

```
┌────────────────────────────────────────────────────────────────┐
│  ← 返回社区                              [分享到微信] [复制链接]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  类型徽章 · 学科                                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ [根据 content_type 不同的内容渲染区域]                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  @用户 · 时间 · 👁️ XX 次查看                                  │
│  ❤️ XX 赞 · 💬 XX 评论                                        │
│                                                                │
│  [点赞按钮]                                                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 评论区（评论列表 + 发表评论框）                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🚀 想让 AI 帮你 [动态文案]？              [立即体验 →]    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

CTA 文案映射：
- essay_review → "想让 AI 帮你批改作文？"
- image → "想用 AI 生成精美图片？"
- flashcard_deck → "想用 AI 自动生成复习闪卡？"
- manim_video → "想用 AI 制作数学动画？"
- 默认 → "想体验 AI 学习助手？"
```

### 一键分享弹窗（ShareDialog）

```
┌──────────────────────────────────┐
│  ✨ 分享到创作广场                │
│                                  │
│  标题：[自动生成/可编辑]          │
│  分享语：[可选文本框]             │
│  可见性：○公开  ○仅链接可见       │
│                                  │
│  分享后获得 +5 积分 🎉           │
│                                  │
│  [取消]              [分享]      │
└──────────────────────────────────┘
```

---

## 实施步骤

### 第 1 步：数据库建表

- 创建 shared_contents、content_likes、content_comments、share_rewards 4 张表
- 创建 9 个索引
- 配置 RLS 策略
- 验收：4 张表存在 + 索引存在 + RLS 启用

### 第 2 步：核心分享 API

- lib/sharing.ts（工具函数：generateShareCode、generatePreviewText、generateAutoTitle、常量）
- POST /api/share（创建分享 + 首次分享积分奖励）
- GET /api/share（我的分享列表）
- GET /api/share/[shareCode]（分享详情，公开）
- DELETE /api/share/[shareCode]（软删除）
- GET /api/explore（社区浏览，分类/排序/分页）
- POST /api/share/[shareCode]/external-share（外部分享积分）
- 验收：所有路由状态码正确 + TypeScript/lint 通过

### 第 3 步：独立分享详情页

- app/share/[shareCode]/page.tsx（SSR，公开）
- generateMetadata（动态 OG meta）
- 内容渲染组件（7 种 content_type 各一个渲染器）
- CTA 转化区域
- 404 友好页面
- middleware 排除 /share/ 路径
- 验收：SSR 渲染 + OG meta 存在 + 未登录可访问 + CTA 展示

### 第 4 步：社区探索页

- app/explore/page.tsx（CSR，公开）
- 分类标签栏 + 排序切换
- ContentCard 组件
- 分页（加载更多）
- 导航集成（"创作广场"入口）
- 时间格式化工具
- 验收：/explore 可访问 + 分类切换正常 + 导航入口存在

### 第 5 步：互动功能

- POST /api/share/[shareCode]/like（点赞/取消赞 + 里程碑积分）
- GET/POST /api/share/[shareCode]/comments（评论列表/发表）
- LikeButton 组件（乐观更新）
- CommentSection 组件（列表 + 输入框）
- 集成到 /share/[shareCode] 详情页
- 验收：点赞切换正常 + 自赞拒绝 + 评论发表正常 + 积分发放正确

### 第 6 步：已有功能接入分享

- ShareDialog 通用弹窗组件
- 作文批改结果页接入"分享"按钮
- 闪卡生成成功接入"分享"按钮
- 图像生成结果接入"分享"按钮（如位置明确）
- 其他功能留 TODO 标记
- 验收：至少 2 个功能点有分享入口 + 弹窗交互正常

### 第 7 步：增长优化

- GET /api/share/[shareCode]/og-image（OG 卡片图生成）
- GET /api/explore/leaderboard（排行榜）
- PUT /api/admin/share/[shareCode]（站长精选/隐藏/置顶）
- app/explore/sitemap.ts（动态 sitemap）
- JSON-LD 结构化数据
- app/my/shares/page.tsx（我的分享管理页）
- "本周热门"区域集成到 /explore
- 验收：OG 图可生成 + 排行榜返回正常 + sitemap 存在 + 我的分享可访问

---

## 最终验收标准

### A. 代码质量
- [ ] npx tsc --noEmit 通过
- [ ] npm run lint 通过
- [ ] npm run build 通过

### B. 数据库
- [ ] 4 张新表存在
- [ ] 9 个索引已创建
- [ ] RLS 已启用
- [ ] 不影响已有表

### C. API 路由
- [ ] POST /api/share → 未登录 401
- [ ] GET /api/share/不存在的code → 404
- [ ] GET /api/explore → 200
- [ ] GET /api/explore?category=image&sort=popular → 200
- [ ] GET /api/explore/leaderboard?period=week → 200
- [ ] POST /api/share/xxx/like → 未登录 401
- [ ] GET /api/share/xxx/comments → 200
- [ ] POST /api/share/xxx/comments → 未登录 401
- [ ] POST /api/share/xxx/external-share → 未登录 401
- [ ] PUT /api/admin/share/xxx → 未登录 401

### D. 页面
- [ ] /explore → 200（公开）
- [ ] /share/存在的code → 200（SSR，公开）
- [ ] /share/不存在的code → 404
- [ ] /my/shares → 需登录
- [ ] middleware 不拦截 /share/ 和 /explore

### E. 功能集成
- [ ] 至少 2 个功能有"分享到广场"按钮
- [ ] ShareDialog 弹出正常
- [ ] 分享成功显示链接和积分
- [ ] 点赞交互正常（乐观更新）
- [ ] 评论发表和展示正常
- [ ] 自赞被拒绝
- [ ] 评论长度限制生效
- [ ] 每日积分上限 30

### F. SEO & 增长
- [ ] /share/[code] 包含 og:title, og:description, og:image
- [ ] JSON-LD 结构化数据存在
- [ ] sitemap.ts 存在
- [ ] CTA 按钮引导注册/使用

### G. 导航
- [ ] "创作广场" 出现在 Header / Sidebar / 移动导航
- [ ] "我的分享" 可达

---

## 转化漏斗

```
外部流量（微信/搜索引擎/朋友分享）
     │
     ▼
/share/abc123（看到 AI 生成的优质内容）
     │
     ▼
"我也想用" → 点击 CTA 按钮
     │
     ▼
注册/登录 → 免费试用
     │
     ▼
体验到价值 → 积分用完 → 充值
     │
     ▼
持续使用 → 生成内容 → 分享 → 引入新用户
     │
     └── 飞轮 ♻️
```

---

## 技术决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| 分享详情页渲染 | SSR (dynamic) | OG meta + SEO |
| 社区列表页渲染 | CSR + 分页 | 数据实时性高 |
| 缩略图生成 | 按类型自动截取 | 不依赖额外服务 |
| 微信分享卡片 | next/og (Satori) | HTML→PNG，快且免费 |
| 评论楼中楼 | parent_id 自引用 | 简单实现 |
| 分享码 | crypto.randomUUID().slice(0,10) | 够短够随机 |

## 与已有系统的集成点

| 已有系统 | 集成方式 |
|---|---|
| 积分系统 (addCredits) | 分享/点赞/评论成功后调用 |
| 认证 (requireUser) | 复用已有中间件 |
| Supabase RLS | 公开内容匿名读，写操作需登录 |
| OpenResty 缓存 | /share/[code] 缓存 5min |
| Cloudflare | OG 图片走 CDN |
| MinIO | 分享卡片图存储 |

## 风险与 TODO

| 风险 | 应对 |
|---|---|
| 刷赞/刷评论 | 每日上限 + 后期加 IP 频率限制 |
| 不当内容 | 默认发布，站长可隐藏；后期加 AI 审核 |
| 性能 | 分页 + 索引 + 缓存 |
| 图片存储成本 | 仅图像类存原图，其余用文本 |
| 用户隐私 | 作文默认匿名化姓名（TODO） |
