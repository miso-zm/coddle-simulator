# 项目上下文

## 产品简介
「哄哄模拟器」—— 情侣趣味互动小游戏。AI 扮演生气的对象，用户通过选择题的方式哄对方，在 10 轮内把好感度从 20 提升到 80 即获胜。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI 能力**: coze-coding-dev-sdk（LLM 对话 + TTS 语音合成）

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/chat/       # 对话生成 API (LLM + TTS)
│   │   ├── api/tts/        # 纯 TTS 语音合成 API
│   │   ├── globals.css     # 全局样式 + 自定义动画
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页（游戏入口）
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   ├── game-app.tsx    # 游戏主组件（所有游戏逻辑）
│   │   ├── avatar.tsx      # 头像组件（SVG 卡通风格）
│   │   ├── affinity-bar.tsx # 好感度进度条
│   │   ├── chat-bubble.tsx # 聊天气泡 + 打字机效果
│   │   ├── option-buttons.tsx # 选项按钮组
│   │   └── best-records-panel.tsx # 本地战绩面板
│   ├── hooks/              # 自定义 Hooks
│   └── lib/                # 工具库
│       ├── types.ts        # 核心类型定义
│       ├── constants.ts    # 场景、声音、游戏常量
│       ├── prompt.ts       # LLM System Prompt 构建 + JSON 解析
│       ├── storage.ts      # localStorage 本地存储
│       └── utils.ts        # 通用工具函数 (cn)
├── DESIGN.md               # 设计规范
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 核心模块说明

### 游戏流程
首页 → 性别选择 → 场景选择 → 声音设置 → 游戏界面 → 结束页（成功/失败）
所有状态在客户端 `GameApp` 组件中管理，单页应用模式。

### LLM 对话
- **接口**: `POST /api/chat`
- 使用 `coze-coding-dev-sdk` 的 `LLMClient.invoke()` 非流式调用
- 默认模型: `doubao-seed-2-0-lite-260215`
- 内置 2 次重试机制，JSON 解析失败自动追加格式提醒后重试
- 返回格式: `{ message, scoreChange, options: [{text, type}], audioUri? }`

### TTS 语音
- **接口**: `POST /api/tts`
- 5 种声音可选，对应不同性格
- 聊天对话中默认随 LLM 一起生成语音
- 用户点击播放按钮才播放，不自动播放

### 好感度系统
- 初始值: 20 分，范围 -50 ~ 100
- 胜利: ≥ 80 分；失败: ≤ -50 分 或 10 轮用完未达标
- 分数对用户展示（有进度条和具体数值）
- 加分绿色发光动画，减分红色抖动动画

### 博客模块
- **列表页** `/blog`：Server Component，从 `blog_posts` 数据库表读取，按创建时间倒序
- **详情页** `/blog/[slug]`：Server Component，按 `slug` 字段查询单篇文章
- **AI 生成** `POST /api/blog/generate`：调用 LLM 生成恋爱沟通技巧文章，自动生成 slug 并存入数据库
- 博客列表页右上角有"AI写新文章"按钮，点击触发生成

### 数据库层
- 使用 Supabase（通过 `coze-coding-dev-sdk` 内置凭证）
- **`src/storage/database/supabase-client.ts`**：Supabase 客户端封装（服务端使用，含凭证加载）
- **`src/storage/database/blog-repo.ts`**：blog_posts 表数据访问层
- **`src/storage/database/user-repo.ts`**：users 表数据访问层
- **`src/storage/database/auth.ts`**：认证工具（bcrypt 密码哈希 + JWT + HttpOnly Cookie）
- **`src/storage/database/shared/schema.ts`**：Drizzle schema 定义

### 用户系统
- **注册** `POST /api/auth/register`：用户名+密码注册，bcrypt 加密，注册成功自动登录
- **登录** `POST /api/auth/login`：用户名+密码登录，返回 JWT 存入 HttpOnly Cookie
- **登出** `POST /api/auth/logout`：清除登录 Cookie
- **当前用户** `GET /api/auth/me`：获取当前登录用户信息
- **注册页** `/register`：注册表单页
- **登录页** `/login`：登录表单页
- 首页右上角展示用户状态（未登录显示登录/注册按钮，已登录显示用户名+退出）

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 所有游戏逻辑集中在 `game-app.tsx`，按子组件拆分 UI

### LLM SDK 使用注意
- `LLMClient` 和 `TTSClient` 只能在后端 API Route 中使用
- Message 只支持 `system` 和 `user` 两种 role，**不支持 `assistant` role**
- 多轮对话通过在 user message 中拼接历史对话实现
- 必须通过 `HeaderUtils.extractForwardHeaders()` 转发请求头

### Hydration 问题防范
- 客户端组件（所有带状态和交互的组件）必须加 `'use client'`
- localStorage 访问必须在 useEffect 或事件回调中
- 随机数（选项打乱等）必须在客户端计算

### 设计规范
详见 `DESIGN.md`。主色调：粉色 #FF6B9D，微信绿气泡 #95EC69，浅粉背景 #FFF5F7。
