# 超级提示词：让 Codex 自己创建 shenxiang.school 全部 Skill

> 将此提示词完整粘贴给 Codex，它会自动创建全部 6 个 Skill。
> 前提：Codex 已安装 `$skill-creator` 系统技能。

---

## 提示词正文（直接复制）

```
你是 shenxiang.school 的技术架构师。现在需要你用 $skill-creator 技能，为我的服务器创建 6 个完整的 Codex Skill。

## 项目背景

shenxiang.school 是一个 AI 教育平台，架构如下：
- 前端: Next.js 16 App Router (Docker, 127.0.0.1:3000)
- AI 编排: Dify (自建 Docker, docker-api-1:5001/v1)
- 数据库: Supabase (Auth + Postgres + REST)
- 支付: 迅虎支付
- CDN: Cloudflare + COS
- 语音: /api/tts
- 图片: Codex 原生 gpt-image-2
- 数学动画: Manim Community (Docker 渲染容器)

已有 Skill: `shenxiang-image-gen`（图片生成 + Manim 数学动画）

## 你要创建的 6 个 Skill

按以下顺序逐一创建，每个 Skill 都使用 `scripts/init_skill.py` 初始化，然后完善内容。

---

### Skill 1: `shenxiang-flashcard-gen`

**目的**: 将任何学习素材转化为结构化 AI 闪卡

**安装路径**: `~/.codex/skills/shenxiang-flashcard-gen`

**SKILL.md description**:
"Generate structured AI flashcards from any learning material. Use when a user uploads study content (PDF, PPT, notes, text, or a topic description) and wants flashcard sets for spaced repetition study. Also use when directly asked to create flashcards, study cards, or revision cards for any subject — supports Chinese and English."

**工作模式**:
- 模式 A: 接收 Dify 传来的 JSON 合约（含 key_concepts 数组），直接生成闪卡
- 模式 B: 用户直接描述主题（如 "帮我做牛顿三定律的闪卡"），Codex 自行理解并生成

**JSON 输入合约** (Dify 输出给 Codex):
```json
{
  "subject": "string — 学科/章节名",
  "source_summary": "string — 内容摘要（Dify 从 PDF/PPT 提取）",
  "key_concepts": [
    {"concept": "string", "definition": "string", "difficulty": 1-5}
  ],
  "total_cards_target": "number (10-50)",
  "language": "zh-CN | en",
  "card_types": ["definition", "fill_blank", "true_false", "mcq", "matching"]
}
```

**Codex 输出合约**:
```json
{
  "deck_title": "string",
  "deck_description": "string",
  "subject": "string",
  "language": "zh-CN | en",
  "cards": [
    {
      "id": "number",
      "front": "string — 问题面",
      "back": "string — 答案面",
      "type": "definition | fill_blank | true_false | mcq | matching",
      "difficulty": 1-5,
      "tags": ["string"],
      "hint": "string (optional)",
      "explanation": "string (optional)",
      "options": ["string"] // 仅 mcq 类型
    }
  ],
  "total_cards": "number",
  "estimated_study_minutes": "number"
}
```

**生成规则**:
1. 每个 key_concept 生成 2-3 张不同类型的卡片
2. 难度递进：先 definition → 再 fill_blank → 最后 mcq
3. front 面用疑问句或填空句，长度 10-50 字
4. back 面用陈述句，长度 10-100 字
5. mcq 类型必须有 4 个选项，干扰项要合理（同领域易混概念）
6. 中文内容保持中文，不要翻译成英文
7. 每张卡加 tags（学科、章节、知识点层级）
8. explanation 字段解释为什么这个答案是对的

**scripts/ 需要**:
- `validate_flashcard_json.py` — 校验输出 JSON 格式
- `estimate_difficulty.py` — 根据文本复杂度自动标注 difficulty

**references/ 需要**:
- `card-types.md` — 各种卡片类型的详细模板和示例
- `subject-templates.md` — 不同学科（数学/物理/英语/历史）的闪卡风格指南

**agents/openai.yaml**:
- display_name: "Flashcard Generator"
- short_description: "AI flashcards from any study material"
- default_prompt: "Use $shenxiang-flashcard-gen to create revision flashcards for: [topic]"

---

### Skill 2: `shenxiang-quiz-gen`

**目的**: 将学习材料转化为互动测验/试卷

**安装路径**: `~/.codex/skills/shenxiang-quiz-gen`

**SKILL.md description**:
"Generate complete interactive quizzes and practice exams from study material. Use when a user wants to test their knowledge with multiple-choice questions, fill-in-the-blank, true/false, short answer, or matching questions. Also use when asked to create a quiz, test, exam, practice paper, or assessment for any subject — supports Chinese and English with configurable difficulty, time limits, and scoring."

**工作模式**:
- 模式 A: 接收 Dify JSON（含 content_summary + quiz_config）
- 模式 B: 用户直接说 "给我出一套牛顿定律的测验"

**JSON 输入合约**:
```json
{
  "subject": "string",
  "content_summary": "string — 考查范围的内容摘要",
  "quiz_config": {
    "total_questions": 10-30,
    "question_types": ["mcq", "fill_blank", "true_false", "short_answer", "matching"],
    "difficulty_distribution": {"easy": 30, "medium": 50, "hard": 20},
    "time_limit_minutes": 15,
    "total_points": 100
  },
  "language": "zh-CN | en",
  "exam_style": "随堂测验 | 期中考试 | 高考模拟 | GCSE | SAT"
}
```

**Codex 输出合约**:
```json
{
  "quiz_title": "string",
  "quiz_description": "string",
  "subject": "string",
  "time_limit_minutes": "number",
  "total_points": "number",
  "pass_threshold": "number (百分比)",
  "questions": [
    {
      "id": "number",
      "type": "mcq | fill_blank | true_false | short_answer | matching",
      "question": "string",
      "options": ["string"],        // mcq/matching
      "correct_answer": "string | number | [string]",
      "explanation": "string — 详细解析",
      "difficulty": "easy | medium | hard",
      "points": "number",
      "knowledge_point": "string",
      "time_estimate_seconds": "number"
    }
  ],
  "answer_key": {
    "total_questions": "number",
    "by_difficulty": {"easy": "number", "medium": "number", "hard": "number"},
    "by_type": {"mcq": "number", "fill_blank": "number", ...}
  }
}
```

**生成规则**:
1. 题目覆盖内容摘要中所有主要知识点
2. 难度按 distribution 比例分配
3. mcq 干扰项具有迷惑性（常见错误理解）
4. 每题必须有 explanation（即使答对也显示以巩固理解）
5. short_answer 的 correct_answer 提供多个可接受答案
6. 分值按难度加权（easy=3, medium=5, hard=8-10）
7. 题目顺序：先易后难
8. exam_style 影响措辞风格和题型比例

**scripts/ 需要**:
- `validate_quiz_json.py` — 校验试卷结构完整性
- `score_calculator.py` — 根据用户答案计算得分

**references/ 需要**:
- `question-templates.md` — 各种题型的出题模板
- `exam-styles.md` — 不同考试风格（中考/高考/GCSE）的要求差异
- `bloom-taxonomy.md` — 布鲁姆认知层级指导出题深度

---

### Skill 3: `shenxiang-spaced-repetition`

**目的**: 管理用户的间隔重复复习调度

**安装路径**: `~/.codex/skills/shenxiang-spaced-repetition`

**SKILL.md description**:
"Manage spaced repetition scheduling for flashcard review using the SM-2 algorithm. Use when a user completes a flashcard review session and the system needs to calculate the next optimal review time for each card. Also use when asked to schedule reviews, optimize study plans, analyze forgetting curves, or determine which cards are due for review today."

**工作模式**: 不需要 Dify — Codex 直接执行算法

**JSON 输入** (用户答题结果):
```json
{
  "user_id": "string",
  "session_results": [
    {
      "card_id": "string",
      "quality": 0-5,  // 0=完全忘了 1=严重错误 2=错误 3=犹豫但答对 4=正确 5=秒答
      "response_time_ms": "number",
      "current_repetitions": "number",
      "current_ease_factor": "number (default 2.5)",
      "current_interval_days": "number"
    }
  ],
  "session_timestamp": "ISO 8601"
}
```

**Codex 输出**:
```json
{
  "user_id": "string",
  "updates": [
    {
      "card_id": "string",
      "next_review_at": "ISO 8601",
      "new_interval_days": "number",
      "new_ease_factor": "number",
      "new_repetitions": "number",
      "status": "learning | reviewing | mastered | lapsed"
    }
  ],
  "session_summary": {
    "total_cards": "number",
    "correct": "number",
    "incorrect": "number",
    "average_quality": "number",
    "mastered_today": "number",
    "lapsed_today": "number"
  },
  "next_session_recommendation": {
    "cards_due_tomorrow": "number",
    "estimated_minutes": "number",
    "focus_areas": ["string — 薄弱知识点"]
  }
}
```

**核心算法 (SM-2)**:
```
if quality >= 3:  # 答对
    if repetitions == 0: interval = 1
    elif repetitions == 1: interval = 6
    else: interval = round(interval * ease_factor)
    repetitions += 1
else:  # 答错
    repetitions = 0
    interval = 1

ease_factor = max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
```

**状态判定**:
- learning: repetitions < 2
- reviewing: repetitions >= 2 且 interval < 30
- mastered: interval >= 30
- lapsed: quality < 3 且之前是 reviewing/mastered

**scripts/ 需要**:
- `sm2_scheduler.py` — 完整 SM-2 算法实现（含批量处理）
- `daily_due_cards.py` — 计算某用户今日待复习卡片列表
- `study_analytics.py` — 生成学习统计（记忆保留率、每日学习量曲线）

**references/ 需要**:
- `sm2-algorithm.md` — SM-2 算法完整说明 + 参数调优指南
- `study-scheduling-strategies.md` — 新卡引入策略、每日上限、优先级规则

---

### Skill 4: `shenxiang-gamification`

**目的**: 游戏化引擎 — 管理 Streak、积分、成就、排行榜

**安装路径**: `~/.codex/skills/shenxiang-gamification`

**SKILL.md description**:
"Gamification engine for shenxiang.school. Manages daily streaks, XP points, achievement unlocking, leaderboards, and reward systems. Use when a user completes any learning action (flashcard review, quiz completion, animation view, content creation) and the system needs to update their gamification state. Also use when asked to check streak status, view achievements, compare with friends, or understand reward rules."

**JSON 输入** (学习事件):
```json
{
  "user_id": "string",
  "event_type": "card_reviewed | quiz_completed | animation_viewed | content_created | streak_checkin | share_completed | invite_accepted",
  "event_data": {
    "score": "number (optional)",
    "cards_count": "number (optional)",
    "time_spent_seconds": "number (optional)",
    "perfect_score": "boolean (optional)",
    "subject": "string (optional)"
  },
  "timestamp": "ISO 8601"
}
```

**Codex 输出**:
```json
{
  "user_id": "string",
  "xp_earned": "number",
  "total_xp": "number",
  "level": {"current": "number", "name": "string", "xp_to_next": "number"},
  "streak": {
    "current": "number",
    "longest": "number",
    "today_completed": "boolean",
    "streak_frozen": "boolean",
    "freeze_remaining": "number"
  },
  "achievements_unlocked": [
    {"id": "string", "name": "string", "description": "string", "icon": "string", "rarity": "common | rare | epic | legendary"}
  ],
  "leaderboard_update": {
    "daily_rank": "number",
    "weekly_rank": "number",
    "friends_rank": "number"
  },
  "rewards": [
    {"type": "badge | title | theme | freeze_token", "item": "string"}
  ],
  "notifications": [
    {"message": "string", "type": "celebration | reminder | social"}
  ]
}
```

**游戏化规则**:

XP 计算:
- card_reviewed: 5 XP/张
- quiz_completed: score * 0.5 XP
- perfect_score (quiz): +50 XP bonus
- animation_viewed: 10 XP
- content_created: 30 XP
- daily streak bonus: current_streak * 2 XP

Level 系统:
- Level 1-10: 每级 100 XP
- Level 11-30: 每级 300 XP
- Level 31+: 每级 500 XP
- 等级名: 新手→学徒→秀才→举人→进士→探花→榜眼→状元

Streak 规则:
- 每天至少完成 1 次学习动作算打卡
- 中断则重置为 0
- 冰冻道具(freeze_token)可保护 1 天不中断
- 每 7 天连续打卡送 1 个 freeze_token

成就系统 (示例):
- "初学者": 首次完成 10 张闪卡
- "坚持不懈": 连续打卡 7 天
- "学霸": 测验满分 3 次
- "百卡斩": 累计复习 100 张卡
- "千里之行": 累计学习 1000 分钟
- "社交达人": 邀请 3 位好友
- "全科王": 在 5 个不同学科创建闪卡

**scripts/ 需要**:
- `calculate_xp.py` — XP 计算引擎
- `check_achievements.py` — 成就解锁检查器
- `update_leaderboard.py` — 排行榜更新逻辑

**references/ 需要**:
- `achievement-catalog.md` — 完整成就列表（50+）含解锁条件
- `level-system.md` — 等级/经验值/称号对照表
- `engagement-rules.md` — 防刷规则、每日 XP 上限、反作弊

---

### Skill 5: `shenxiang-content-import`

**目的**: 将多种格式的学习素材统一转化为结构化知识数据

**安装路径**: `~/.codex/skills/shenxiang-content-import`

**SKILL.md description**:
"Import and structure learning content from multiple sources: PDF documents, PowerPoint presentations, YouTube videos (via transcript), audio recordings (via transcription), plain text notes, and images (via OCR). Use when a user uploads study material in any format and needs it converted into structured knowledge data that can feed into flashcard generation, quiz generation, or the spaced repetition system. Handles Chinese and English content."

**JSON 输入** (Dify 预处理后):
```json
{
  "source_type": "pdf | ppt | youtube | audio | text | image",
  "source_metadata": {
    "filename": "string (optional)",
    "url": "string (optional, for youtube)",
    "duration_seconds": "number (optional, for audio/video)",
    "page_count": "number (optional, for pdf/ppt)",
    "language_detected": "zh-CN | en | auto"
  },
  "extracted_text": "string — Dify 提取的全文本",
  "user_instructions": "string (optional) — 用户附加指令，如'重点关注第三章'"
}
```

**Codex 输出**:
```json
{
  "title": "string — 自动识别的标题",
  "subject": "string — 自动识别的学科",
  "language": "zh-CN | en",
  "structure": {
    "type": "textbook_chapter | lecture_notes | presentation | video_transcript | mixed",
    "chapters": [
      {
        "title": "string",
        "order": "number",
        "summary": "string (50-100字概要)",
        "key_terms": [
          {"term": "string", "definition": "string", "importance": "core | important | supplementary"}
        ],
        "key_concepts": [
          {"concept": "string", "explanation": "string", "difficulty": 1-5, "prerequisites": ["string"]}
        ],
        "formulas": [
          {"latex": "string", "description": "string", "usage_context": "string"}
        ],
        "facts": [
          {"statement": "string", "verifiable": true}
        ],
        "estimated_study_minutes": "number"
      }
    ]
  },
  "metadata": {
    "total_knowledge_points": "number",
    "total_key_terms": "number",
    "total_formulas": "number",
    "difficulty_overall": 1-5,
    "recommended_flashcard_count": "number",
    "recommended_quiz_questions": "number",
    "topics_for_animation": ["string — 适合用 Manim 可视化的主题"]
  },
  "downstream_actions": {
    "can_generate_flashcards": true,
    "can_generate_quiz": true,
    "can_generate_animation": true,
    "suggested_study_plan_days": "number"
  }
}
```

**处理规则**:
1. 自动识别文档结构（标题层级、章节分割）
2. 提取所有专业术语并给出定义
3. 识别公式/方程式并转为 LaTeX
4. 标注每个知识点的难度等级
5. 识别知识点之间的先后依赖关系（prerequisites）
6. 判断哪些内容适合做闪卡、哪些适合出题、哪些适合做动画
7. 中文内容保持中文处理，不翻译
8. 忽略页眉页脚、水印、目录页码等噪音

**scripts/ 需要**:
- `extract_structure.py` — 文本结构化提取（标题检测、章节分割）
- `extract_terms.py` — 术语/定义自动提取
- `detect_formulas.py` — 公式检测并转 LaTeX

**references/ 需要**:
- `source-type-handling.md` — 不同来源格式的处理策略
- `knowledge-taxonomy.md` — 知识点分类和难度评级标准
- `downstream-routing.md` — 如何决定输出路由到哪些下游 Skill

---

### Skill 6: `shenxiang-study-planner`

**目的**: 智能学习计划生成器（整合所有 Skill 的调度中心）

**安装路径**: `~/.codex/skills/shenxiang-study-planner`

**SKILL.md description**:
"Generate personalized study plans that orchestrate all other shenxiang skills. Use when a user wants to prepare for an exam, master a subject, or organize their learning over days/weeks. Creates a timeline of daily tasks combining flashcard reviews, quizzes, animations, and new content study — all optimized by spaced repetition principles and gamification incentives. Also use when asked to plan revision, create a study schedule, or optimize exam preparation."

**JSON 输入**:
```json
{
  "user_id": "string",
  "goal": {
    "type": "exam_prep | subject_mastery | daily_maintenance",
    "target_exam": "string (optional, e.g. '高一期中·物理')",
    "target_date": "ISO 8601 (optional)",
    "subjects": ["string"],
    "available_minutes_per_day": "number (default 30)"
  },
  "user_state": {
    "current_decks": [{"deck_id": "string", "title": "string", "total_cards": "number", "mastered_cards": "number"}],
    "current_streak": "number",
    "total_xp": "number",
    "weak_areas": ["string — 由 spaced-repetition 识别的薄弱知识点"],
    "study_history_days": "number"
  }
}
```

**Codex 输出**:
```json
{
  "plan_title": "string",
  "plan_duration_days": "number",
  "daily_target_minutes": "number",
  "daily_schedule": [
    {
      "day": "number",
      "date": "ISO 8601",
      "tasks": [
        {
          "order": "number",
          "type": "review_cards | new_cards | quiz | animation | rest",
          "description": "string",
          "target_deck": "string (optional)",
          "estimated_minutes": "number",
          "skill_to_invoke": "$shenxiang-flashcard-gen | $shenxiang-quiz-gen | $shenxiang-image-gen | $shenxiang-spaced-repetition",
          "xp_reward": "number"
        }
      ],
      "total_minutes": "number",
      "milestone": "string (optional, e.g. '完成第一章全部闪卡')"
    }
  ],
  "milestones": [
    {"day": "number", "achievement": "string", "reward": "string"}
  ],
  "exam_readiness_projection": {
    "current_mastery_percent": "number",
    "projected_mastery_at_target": "number",
    "confidence_level": "low | medium | high"
  }
}
```

**调度规则**:
1. 新内容学习不超过每天总时间的 40%
2. 复习（间隔重复到期卡）优先级最高
3. 每 3 天安排一次小测验检验掌握度
4. 每周安排 1 次 Manim 动画学习（数学/物理科目）
5. 考前 3 天只复习 + 模拟测验，不引入新内容
6. 每天任务量不超过 available_minutes_per_day
7. 加入 Streak 奖励提示（"连续打卡第 X 天，明天将解锁..."）
8. 根据 weak_areas 加大对应知识点的复习频率

**scripts/ 需要**:
- `generate_plan.py` — 学习计划生成算法
- `adaptive_replan.py` — 根据每日完成情况动态调整后续计划

**references/ 需要**:
- `planning-strategies.md` — 不同考试类型的备考策略
- `time-allocation.md` — 时间分配模型和最优比例

---

## 创建指令

对以上 6 个 Skill，请按顺序执行以下步骤：

1. 运行 `scripts/init_skill.py <skill-name> --path ~/.codex/skills --resources scripts,references --interface display_name="..." --interface short_description="..." --interface default_prompt="..."`
2. 完善 SKILL.md（写好 frontmatter description + 完整 body）
3. 实现 scripts/ 中的所有脚本（确保可执行、通过 AST 检查）
4. 编写 references/ 中的所有参考文档
5. 运行 `scripts/quick_validate.py` 校验
6. 每个 Skill 完成后报告状态

## 重要约束

- SKILL.md body 控制在 300 行以内
- description 必须 ≤ 1024 字符
- name 必须是 hyphen-case，≤ 64 字符
- 所有脚本必须是纯 Python（无外部依赖，只用标准库 + json/datetime/math）
- references 文件超过 100 行必须有目录（TOC）
- 不要创建 README.md、CHANGELOG.md 等多余文件
- 中文内容保持中文

现在开始创建第一个 Skill: `shenxiang-flashcard-gen`，然后依次完成剩余 5 个。
```

---

**使用方法**: 直接把上面 ``` 之间的内容完整粘贴给 Codex CLI 或 Codex App。
