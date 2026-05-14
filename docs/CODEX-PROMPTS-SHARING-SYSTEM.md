# 创作广场 — Codex 分步执行提示词

> 以下每段提示词独立使用，按顺序逐步给 Codex 执行。每完成一步确认无误后再执行下一步。

---

## 第 1 步：数据库建表

```
任务：创建内容分享社区系统的数据库表。

项目背景：
我们正在为 shenxiang.school 添加"创作广场"功能——用户可以将 AI 生成的内容（作文批改、图像、闪卡、数学动画等）一键分享到社区，其他用户可以浏览、点赞、评论。分享行为奖励积分，形成增长飞轮。

已有数据库：Supabase，已有 user_progress、flashcards、user_files 等表，已有 RLS 和索引规范。

请在 Supabase 中执行以下 SQL，创建 4 张新表 + 索引 + RLS 策略：

-- 1. 分享内容表
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

-- 2. 点赞表
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES shared_contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, user_id)
);

-- 3. 评论表
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

-- 4. 奖励记录表
CREATE TABLE IF NOT EXISTS share_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES shared_contents(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  credits_awarded INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id, reward_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_shared_contents_browse ON shared_contents(content_type, created_at DESC) WHERE status = 'published' AND visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_shared_contents_popular ON shared_contents(like_count DESC, created_at DESC) WHERE status = 'published' AND visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_shared_contents_featured ON shared_contents(created_at DESC) WHERE is_featured = TRUE AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_shared_contents_user ON shared_contents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_contents_code ON shared_contents(share_code);
CREATE INDEX IF NOT EXISTS idx_content_likes_content ON content_likes(content_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_user_content ON content_likes(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_id, created_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_share_rewards_user_content ON share_rewards(user_id, content_id);

-- RLS
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

验证：
1. SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('shared_contents', 'content_likes', 'content_comments', 'share_rewards') ORDER BY table_name;
2. SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE 'idx_shared_%' OR indexname LIKE 'idx_content_%' OR indexname LIKE 'idx_share_rewards%' ORDER BY tablename, indexname;
3. SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('shared_contents', 'content_likes', 'content_comments', 'share_rewards');
4. 确认没有影响已有表。
```

---

## 第 2 步：核心分享 API

```
任务：创建内容分享系统的核心 API 路由。

前置条件：第 1 步 4 张表已存在。已有 requireUser、supabaseAdmin、addCredits。

创建以下文件：

1. lib/sharing.ts — 分享系统工具函数：
   - generateShareCode(): string — 10 位随机码（crypto.randomUUID().slice(0,10)）
   - generatePreviewText(contentType, contentData): string — 根据类型自动截取预览文本（最多200字）
   - generateAutoTitle(contentType, contentData): string — 根据类型自动生成标题
   - SHARE_REWARDS 常量（first_share:5, external_share:3, like_milestone_10:5, like_milestone_50:15, like_milestone_100:30, featured:20, first_comment_received:2）
   - DAILY_SOCIAL_CREDITS_LIMIT = 30
   - CONTENT_TYPES 数组

2. app/api/share/route.ts：
   - POST: 创建分享（验证登录→校验content_type→生成title/preview/code→写入shared_contents→发放首次分享积分→返回share_code+share_url）
   - GET: 我的分享列表（验证登录→查询user_id的分享→分页返回）

3. app/api/share/[shareCode]/route.ts：
   - GET: 分享详情（公开，不需登录→查share_code→view_count+1→如有登录态返回is_liked→返回完整数据）
   - DELETE: 删除分享（验证登录+验证本人→UPDATE status='hidden'）

4. app/api/explore/route.ts：
   - GET: 社区浏览（公开，不需登录→查询published+public→支持category/sort/page/limit参数→返回items+total+has_more，不返回完整content_data只返回preview字段）

5. app/api/share/[shareCode]/external-share/route.ts：
   - POST: 外部分享积分（验证登录→验证是本人内容→检查今日是否已领→检查每日上限→发放积分→返回credits_earned）

通用要求：复用 requireUser、supabaseAdmin、addCredits；TypeScript 类型安全；try-catch 错误处理；风格和现有 API 一致。

验收标准：
- npx tsc --noEmit 通过
- npm run lint 通过
- POST /api/share 未登录→401
- GET /api/share/nonexistent→404
- GET /api/explore→200（空数组）
- DELETE /api/share/xxx 未登录→401
- POST /api/share/xxx/external-share 未登录→401
```

---

## 第 3 步：独立分享详情页

```
任务：创建 /share/[shareCode] 独立展示页面（SSR，公开可访问，含 OG meta 标签和 CTA）。

前置条件：GET /api/share/[shareCode] 已存在。

创建以下文件：

1. app/share/[shareCode]/page.tsx — SSR 服务端组件：
   - generateMetadata: 动态生成 title、description、og:title、og:description、og:image、og:url
   - 服务端直接查 Supabase（不走 /api），获取分享数据
   - 如果 share_code 不存在或 status != published → notFound()（Next.js 404）

2. 页面内容区域（从上到下）：
   - 简化导航栏（← 返回社区 + 分享/复制链接按钮）
   - 内容类型徽章 + 学科
   - 主体内容区（根据 content_type 渲染不同组件）
   - 作者信息 + 社交数据（@昵称 · 时间 · 浏览数 · 赞数 · 评论数）
   - 互动占位区（LikeButton + CommentSection，第 5 步实现，本步用静态占位）
   - CTA 底部区域（动态文案 + "立即体验"按钮 → 链接到首页/chat）

3. components/share/content-renderers.tsx — 7 种内容渲染器：
   - EssayReviewRenderer: 显示得分圆环+总评+原文（可折叠）+批注+建议
   - ImageRenderer: 大图展示+prompt信息
   - FlashcardDeckRenderer: 卡片网格（正面文字，静态展示）
   - ManimVideoRenderer: video 标签播放
   - PPTSummaryRenderer: 要点列表+摘要
   - AgentConversationRenderer: 对话气泡
   - QuizResultRenderer: 得分+题目列表

4. 确认 middleware 不拦截 /share/ 路径。如果 middleware.ts 有 matcher 配置，排除 /share/:path*。

验收标准：
- npx tsc --noEmit 通过
- npm run lint 通过
- /share/[code] 是 SSR（build 输出中标记为 dynamic）
- 不存在的 code → 404
- 未登录可访问
- HTML 包含 og:title, og:description meta 标签
- CTA 按钮存在
- 7 种渲染器组件已创建
```

---

## 第 4 步：社区探索页

```
任务：创建 /explore 社区探索页面（分类/排序/分页/卡片网格）。

前置条件：GET /api/explore 已存在。

创建以下文件：

1. app/explore/page.tsx — 客户端组件（'use client'）：
   - 分类标签栏（全部/作文批改/AI绘画/闪卡集/数学动画/PPT/智能体），横向滚动
   - 排序切换（最新/最热/精选）
   - 内容网格：桌面 3 列，平板 2 列，手机 1 列
   - 加载更多按钮（点击加载下一页）
   - 空状态："暂无内容，成为第一个分享者！"
   - 加载中：骨架屏卡片

2. components/share/content-card.tsx — ContentCard 组件：
   - 缩略图区域（图片类显示图，文字类显示 preview_text 截取）
   - 类型徽章 + 学科
   - 标题（max 2 行 truncate）
   - @用户 · 相对时间
   - ❤️ 赞数  💬 评论数
   - 点击跳转 /share/[shareCode]

3. lib/time-format.ts — 相对时间格式化：
   - 1分钟内→"刚刚"，1小时内→"X分钟前"，24小时内→"X小时前"，7天内→"X天前"，超过→"MM-DD"

4. 导航集成：在 Header / Sidebar / MobileNav 添加"创作广场"入口。

5. 将 /explore 加入 app-chrome-routes（显示应用导航框架）。

验收标准：
- npx tsc --noEmit 通过
- npm run lint 通过
- /explore 可访问（不需登录）
- 分类点击切换正常
- 排序切换正常
- 点击卡片跳转到 /share/[code]
- 加载更多按钮正常
- 空状态正常显示
- 导航中有"创作广场"入口
- 响应式布局正确（桌面3列/手机1列）
```

---

## 第 5 步：互动功能（点赞 + 评论）

```
任务：创建点赞和评论的 API 路由及前端组件。

前置条件：content_likes 和 content_comments 表已存在。/share/[shareCode] 详情页已存在。

创建以下文件：

1. app/api/share/[shareCode]/like/route.ts：
   - POST: 点赞/取消赞（toggle）
     - 验证登录
     - 防止自赞（user_id != content.user_id）
     - 已赞→DELETE+like_count-1；未赞→INSERT+like_count+1
     - 触发里程碑奖励（10/50/100赞给作者发积分）
     - 给点赞者发+1积分（每天限10次）
     - 返回 { liked: bool, like_count: number }

2. app/api/share/[shareCode]/comments/route.ts：
   - GET: 评论列表（公开，分页，ORDER BY created_at ASC）
   - POST: 发表评论
     - 验证登录
     - 校验 comment_text 2-500字
     - INSERT content_comments + comment_count+1
     - 首条评论给作者发 first_comment_received 奖励+2
     - 给评论者发+2积分（每天限5次）
     - 返回新评论对象

3. components/share/like-button.tsx — LikeButton 客户端组件：
   - Props: { shareCode, initialLiked, initialCount }
   - 乐观更新（先变UI，失败回滚）
   - 未赞：空心心+灰色；已赞：实心红心+红色+scale弹跳动画
   - 未登录点击→提示登录

4. components/share/comment-section.tsx — CommentSection 客户端组件：
   - Props: { shareCode }
   - 加载评论列表
   - 显示评论（头像占位+昵称+时间+内容；parent_id有值则缩进）
   - 底部输入框+发送按钮
   - 未登录→"登录后参与评论"

5. 集成到 /share/[shareCode] 详情页：替换第 3 步的互动占位区为 LikeButton + CommentSection。

验收标准：
- npx tsc --noEmit 通过
- npm run lint 通过
- POST /api/share/xxx/like 未登录→401
- POST /api/share/xxx/comments 未登录→401
- GET /api/share/xxx/comments 无需登录→200
- 点赞按钮状态切换正常
- 自赞被拒绝
- 评论发表后出现在列表中
- 积分发放逻辑正确
```

---

## 第 6 步：已有功能接入分享

```
任务：在平台已有的 AI 生成功能页面中，添加"分享到创作广场"入口。

前置条件：POST /api/share API 已存在。

创建以下文件：

1. components/share/share-dialog.tsx — 通用分享弹窗组件：
   - Props: { open, onClose, contentType, contentData, defaultTitle?, subject?, tags?, thumbnailUrl? }
   - 弹窗内容：标题输入框（预填autoTitle）+分享语textarea+可见性选择
   - 点击"分享"→调用POST /api/share→成功后显示链接+积分
   - 成功状态：显示share_url+复制链接按钮+关闭按钮

2. 在作文批改结果展示位置添加分享按钮：
   - 搜索项目中作文批改/评估结果展示的组件
   - 添加"分享这篇批改 ✨"按钮
   - 点击打开ShareDialog，contentType='essay_review'

3. 在 /flashcards 页面生成闪卡成功后添加分享按钮：
   - 在生成成功的状态区域添加"分享这组闪卡"按钮
   - contentType='flashcard_deck'

4. 在图像生成结果添加分享按钮（如果位置明确）：
   - contentType='image'
   - 如果位置不明确，留 TODO 注释

5. 其他功能（智能体对话、PPT摘要等）：如果位置不明确，留 TODO 注释标记。

查找策略：搜索代码中包含"score"/"批改"/"evaluation"/"generated"等关键词的结果展示组件。

验收标准：
- npx tsc --noEmit 通过
- npm run lint 通过
- ShareDialog 组件已创建
- 至少作文批改和闪卡生成两个位置有分享按钮
- 点击按钮→弹出对话框→确认→调用API→显示成功+链接
```

---

## 第 7 步：增长优化

```
任务：添加微信分享卡片图、排行榜、站长精选管理、SEO 优化、我的分享页面。

前置条件：第 1-6 步全部完成。

创建以下文件：

1. app/api/share/[shareCode]/og-image/route.tsx：
   - GET: 生成 OG 卡片图（PNG）
   - 使用 next/og (ImageResponse) 或项目中已有的图片生成方式
   - 模板：标题+预览文本+赞数评论数+作者+品牌logo（1200x630）
   - 如果 next/og 不可用，留 TODO 并返回默认图片 redirect
   - 更新 /share/[code] 的 generateMetadata 中 og:image 指向此路由

2. app/api/explore/leaderboard/route.ts：
   - GET: 本周/本月热门排行（?period=week|month&limit=10）
   - 公开，不需登录
   - 查询 published+public，按 like_count DESC

3. app/api/admin/share/[shareCode]/route.ts：
   - PUT: 站长管理（body: { action: 'feature'|'unfeature'|'hide'|'unhide'|'pin'|'unpin' }）
   - 验证 ADMIN_USER_IDS
   - feature 时给作者发 +20 精选奖励

4. app/explore/sitemap.ts：
   - 动态 sitemap，列出最近 1000 条公开分享的 URL

5. 在 /share/[shareCode] 页面添加 JSON-LD 结构化数据（Article schema）

6. app/my/shares/page.tsx：
   - 需要登录
   - 调用 GET /api/share 获取我的分享列表
   - 显示每条分享的状态（public/unlisted/hidden）+赞数+积分收益
   - 支持删除操作
   - 统计：总分享数、总获赞、总积分

7. 在 /explore 页面顶部添加"本周热门 TOP"区域（调用 leaderboard API）

8. 导航中添加"我的分享"入口（用户菜单或设置中）

验收标准：
- npx tsc --noEmit 通过
- npm run lint 通过
- GET /api/share/xxx/og-image → 200（image/png 或 redirect 到默认图）
- GET /api/explore/leaderboard?period=week → 200
- PUT /api/admin/share/xxx 未登录→401，非admin→403
- /explore 有"本周热门"区域
- app/explore/sitemap.ts 存在
- /share/[code] 包含 JSON-LD script 标签
- /my/shares 需登录可访问
- 构建通过
```

---

## 最终验收（第 7 步完成后执行）

```
任务：创作广场全部 7 步完成后的最终集成检查和部署。

执行：
1. npx tsc --noEmit
2. npm run lint
3. npm run build（确认无构建错误）
4. docker compose build shenxiang-nextjs
5. docker compose up -d shenxiang-nextjs
6. 等待 healthy

验证清单（curl 检查）：
- curl http://127.0.0.1:3000/api/health → 200
- curl http://127.0.0.1:3000/explore → 200
- curl http://127.0.0.1:3000/share/nonexistent → 404
- curl -X POST http://127.0.0.1:3000/api/share → 401
- curl http://127.0.0.1:3000/api/explore → 200
- curl http://127.0.0.1:3000/api/explore/leaderboard?period=week → 200
- curl -X POST http://127.0.0.1:3000/api/share/xxx/like → 401
- curl http://127.0.0.1:3000/api/share/xxx/comments → 200 或 404
- curl -X PUT http://127.0.0.1:3000/api/admin/share/xxx → 401
- curl http://127.0.0.1:3000/my/shares → 302 或 200

Git 提交（分 3 个 commit）：
1. "feat(sharing): add database schema and core sharing APIs"
2. "feat(sharing): add explore page, share detail page, and interactions"
3. "feat(sharing): integrate sharing into features, add SEO and growth tools"

输出部署总结：新增文件列表 + 修改文件列表 + API 清单 + 页面清单 + TODO 列表。
```
