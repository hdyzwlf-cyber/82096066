# 指令：让 Codex 嵌入 PhET 模拟实验模块

> 将此指令完整粘贴给 Codex，它会自动完成 PhET sim 嵌入集成。

---

## 提示词正文（直接复制给 Codex）

```
你是 shenxiang.school 的全栈工程师。现在需要你完成 PhET Interactive Simulations 的嵌入集成。

## 项目背景

shenxiang.school 是一个 AI 教育平台，技术栈：
- 前端: Next.js 16 App Router (TypeScript, Tailwind CSS)
- 部署: Docker (127.0.0.1:3000)
- 数据库: Supabase (Postgres + Auth + REST)
- CDN: Cloudflare

PhET (https://phet.colorado.edu/) 是科罗拉多大学开发的免费开源科学模拟实验，170+ 个 HTML5 sim，支持中文，可直接通过 iframe 嵌入。

## 你的任务

创建一个完整的 PhET 模拟实验嵌入模块，包括：
1. PhET sim 数据库（目录 + 元数据）
2. 嵌入组件（响应式 iframe）
3. 浏览/搜索页面
4. 与现有学习系统集成（积分、使用记录）

---

## 任务 1: 创建 PhET Sim 目录数据

在 `lib/phet/` 下创建 sim 目录数据文件。

### 文件: `lib/phet/sims-catalog.ts`

包含以下所有适合 K12 数学/物理的 PhET sim 条目：

```typescript
export interface PhetSim {
  id: string;                    // PhET 的 sim slug (如 "graphing-quadratics")
  name_en: string;               // 英文名
  name_zh: string;               // 中文名
  subject: "math" | "physics" | "chemistry" | "biology" | "earth-science";
  topics: string[];              // 知识点标签 (中文)
  grade_range: [number, number]; // 适用年级范围 [7, 12] 表示初一到高三
  description_zh: string;        // 中文简介 (50-100字)
  url_zh: string;                // 中文版 sim URL
  url_en: string;                // 英文版 URL (备用)
  thumbnail: string;             // 缩略图 URL
  difficulty: 1 | 2 | 3;        // 1=基础 2=进阶 3=挑战
  interactive_elements: string[]; // 交互元素描述 ["滑块调节斜率", "拖拽数据点"]
  learning_goals: string[];      // 学习目标 (中文)
  duration_minutes: number;      // 建议使用时长
}
```

必须包含以下 sim（至少）：

**数学类（15个）：**
| id | name_zh | topics | grade_range |
|---|---|---|---|
| graphing-quadratics | 二次函数图像 | ["二次函数","抛物线","顶点","对称轴"] | [8, 11] |
| graphing-lines | 一次函数图像 | ["一次函数","斜率","截距","线性方程"] | [7, 9] |
| graphing-slope-intercept | 斜截式 | ["斜率","y轴截距","直线方程"] | [7, 9] |
| function-builder | 函数机器 | ["函数概念","输入输出","函数组合"] | [6, 8] |
| function-builder-basics | 函数机器基础 | ["函数入门","规律发现"] | [5, 7] |
| calculus-grapher | 微积分画板 | ["导数","积分","函数图像","变化率"] | [10, 12] |
| curve-fitting | 曲线拟合 | ["数据拟合","线性回归","最小二乘法"] | [9, 12] |
| equation-grapher | 方程画图器 | ["多项式","系数","图像变换"] | [8, 11] |
| trig-tour | 三角函数之旅 | ["正弦","余弦","正切","单位圆"] | [9, 11] |
| unit-rates | 单位费率 | ["比例","速率","单位换算"] | [5, 7] |
| area-builder | 面积建造者 | ["面积","周长","矩形","组合图形"] | [4, 6] |
| fraction-matcher | 分数匹配 | ["分数","等价分数","分数比较"] | [4, 6] |
| make-a-ten | 凑十法 | ["加法","凑十","口算"] | [1, 3] |
| number-line-integers | 数轴整数 | ["正负数","数轴","绝对值"] | [6, 7] |
| proportion-playground | 比例游乐场 | ["比例","等比","缩放"] | [6, 8] |

**物理类（15个）：**
| id | name_zh | topics | grade_range |
|---|---|---|---|
| forces-and-motion-basics | 力和运动基础 | ["力","摩擦力","牛顿定律","加速度"] | [7, 9] |
| gravity-and-orbits | 万有引力与轨道 | ["引力","行星运动","开普勒定律"] | [9, 11] |
| energy-skate-park-basics | 能量滑板公园 | ["动能","势能","能量守恒"] | [8, 10] |
| projectile-motion | 抛体运动 | ["平抛","斜抛","初速度","角度"] | [9, 11] |
| circuit-construction-kit-dc | 直流电路 | ["电路","电阻","电流","电压","欧姆定律"] | [8, 10] |
| wave-on-a-string | 绳上的波 | ["横波","振幅","频率","波长"] | [9, 11] |
| pendulum-lab | 钟摆实验室 | ["单摆","周期","重力加速度"] | [9, 11] |
| hookes-law | 胡克定律 | ["弹簧","弹力","形变","弹性系数"] | [8, 10] |
| ohms-law | 欧姆定律 | ["电压","电流","电阻","欧姆定律"] | [8, 10] |
| density | 密度 | ["密度","质量","体积","浮力"] | [7, 9] |
| geometric-optics | 几何光学 | ["透镜","折射","成像","焦距"] | [8, 10] |
| masses-and-springs | 弹簧振子 | ["简谐运动","弹簧","振动","阻尼"] | [9, 11] |
| friction | 摩擦力 | ["静摩擦","动摩擦","摩擦系数"] | [8, 10] |
| vector-addition | 向量相加 | ["向量","合力","分力","平行四边形法则"] | [9, 11] |
| coulombs-law | 库仑定律 | ["电荷","静电力","库仑定律"] | [10, 12] |

每个 sim 的 URL 格式：
- 中文: `https://phet.colorado.edu/sims/html/{id}/latest/{id}_zh_CN.html`
- 英文: `https://phet.colorado.edu/sims/html/{id}/latest/{id}_en.html`
- 缩略图: `https://phet.colorado.edu/sims/html/{id}/latest/{id}-600.png`

---

## 任务 2: 创建嵌入组件

### 文件: `components/phet/PhetSimEmbed.tsx`

创建响应式 iframe 嵌入组件：

```typescript
interface PhetSimEmbedProps {
  simId: string;                          // sim 的 id (如 "graphing-quadratics")
  locale?: "zh_CN" | "en";               // 语言，默认 zh_CN
  width?: string;                         // 宽度，默认 "100%"
  height?: string;                        // 高度，默认 "600px"
  allowFullscreen?: boolean;              // 是否允许全屏，默认 true
  className?: string;                     // 自定义样式
  onLoad?: () => void;                    // 加载完成回调
  onError?: () => void;                   // 加载失败回调
  showControls?: boolean;                 // 是否显示控制栏（全屏、切换语言）
}
```

要求：
1. 外层 div 用 aspect-ratio: 4/3 保持比例
2. 加载时显示骨架屏 + 加载动画
3. 加载失败显示友好错误提示 + "重试"按钮
4. 控制栏包含：全屏按钮、语言切换（中/英）、返回按钮
5. 移动端自适应（小屏时高度自动调整）
6. iframe 加 sandbox="allow-scripts allow-same-origin" 安全限制
7. 加 loading="lazy" 延迟加载

### 文件: `components/phet/PhetSimCard.tsx`

sim 卡片组件（用于列表/网格展示）：

```typescript
interface PhetSimCardProps {
  sim: PhetSim;
  onClick: (sim: PhetSim) => void;
  showBadge?: boolean;  // 是否显示"已完成"/"推荐"等徽章
}
```

要求：
1. 展示缩略图、中文名、学科标签、难度星级、适用年级
2. hover 时显示简介和学习目标
3. 点击进入 sim 详情/嵌入页面
4. 右上角可显示状态徽章（"已学习"/"推荐"/"新"）
5. 底部显示预计时长

### 文件: `components/phet/PhetSimBrowser.tsx`

sim 浏览/搜索组件：

```typescript
interface PhetSimBrowserProps {
  subject?: "math" | "physics" | "all";
  gradeFilter?: number;           // 按年级筛选
  onSelectSim: (sim: PhetSim) => void;
}
```

要求：
1. 顶部搜索栏（支持中文搜索 sim 名称和知识点）
2. 筛选器：学科、年级、难度
3. 网格布局展示 sim 卡片（响应式 2/3/4 列）
4. 支持按"推荐"/"最热"/"最新使用"排序
5. 空状态提示

---

## 任务 3: 创建页面

### 文件: `app/lab/page.tsx`

PhET 实验室主页面：

- 页面标题："互动实验室"
- 顶部 Banner："170+ 免费互动模拟实验，浏览器即用，由科罗拉多大学开发"
- 下方嵌入 `PhetSimBrowser` 组件
- 推荐区域：根据用户年级/学科展示推荐 sim

### 文件: `app/lab/[simId]/page.tsx`

单个 sim 详情 + 嵌入页面：

- 嵌入 `PhetSimEmbed` 组件（占页面主体）
- 侧边栏/底部信息：
  - sim 中文名 + 简介
  - 学习目标列表
  - 交互元素说明
  - "相关闪卡"按钮（跳转到用该 sim 知识点生成闪卡）
  - "相关测验"按钮（跳转到用该 sim 知识点生成测验）
  - "相关动画"按钮（用 Manim 生成该知识点的动态动画）
- 底部"完成学习"按钮 → 触发积分奖励

---

## 任务 4: API Route — 使用记录 + 积分

### 文件: `app/api/lab/record/route.ts`

记录用户使用 sim 的行为：

```typescript
// POST /api/lab/record
// Body: { sim_id: string, duration_seconds: number, completed: boolean }
// 功能:
//   1. 记录到 Supabase 的 phet_usage 表
//   2. 如果 completed=true 且是首次完成，奖励 15 XP
//   3. 返回 { xp_earned, total_uses, first_completion }
```

### Supabase 表结构建议

```sql
CREATE TABLE phet_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  sim_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_phet_usage_user ON phet_usage(user_id);
CREATE INDEX idx_phet_usage_sim ON phet_usage(sim_id);
```

---

## 任务 5: 与现有系统集成

### 与闪卡系统联动

在 sim 详情页添加按钮：
- "为这个实验生成闪卡" → 调用 `/api/dify-chat` 传入 `raw_prompt = "生成关于{sim.topics}的闪卡"`
- 这样用户做完实验后可以立刻生成配套闪卡复习

### 与游戏化系统联动

- 每次完成一个 sim → 触发 gamification 事件 `{ event_type: "animation_viewed", ... }`
- 首次完成某学科所有 sim → 解锁成就"物理实验家"/"数学探索者"
- 连续 3 天使用实验室 → 解锁"科学家精神"徽章

### 与学习计划联动

- 学习计划中的 task 可以类型为 `"phet_sim"`
- planner 推荐相关 sim 时输出 `{ type: "phet_sim", sim_id: "forces-and-motion-basics" }`

---

## 文件清单（你需要创建的所有文件）

```
lib/phet/
├── sims-catalog.ts              ← 30+ sim 的完整数据目录
├── phet-utils.ts                ← URL 构建、筛选、搜索辅助函数

components/phet/
├── PhetSimEmbed.tsx             ← 响应式 iframe 嵌入组件
├── PhetSimCard.tsx              ← sim 卡片组件
├── PhetSimBrowser.tsx           ← 浏览/搜索组件
├── PhetSimControls.tsx          ← 控制栏（全屏/语言/返回）
├── PhetSimSkeleton.tsx          ← 加载骨架屏

app/lab/
├── page.tsx                     ← 实验室主页
├── [simId]/
│   └── page.tsx                 ← 单个 sim 详情+嵌入页

app/api/lab/
└── record/
    └── route.ts                 ← 使用记录 API
```

## 代码规范

1. 所有组件用 TypeScript + React Server/Client Components (适当 "use client")
2. 样式用 Tailwind CSS
3. 支持深色模式 (dark:)
4. 所有文本中文优先
5. 移动端优先响应式设计
6. 添加必要的类型定义
7. 组件内写简洁注释说明用途

## 开始

现在按顺序创建以上所有文件。从 `lib/phet/sims-catalog.ts` 开始。
```
