# Cockpit 设计规范

> 基于 Railway 设计哲学，为 Cockpit 定制的 UI/UX 规范文档  
> 版本 1.0 · 2026

---

## 目录

1. [设计哲学](#1-设计哲学)
2. [色彩系统](#2-色彩系统)
3. [间距与网格](#3-间距与网格)
4. [字体系统](#4-字体系统)
5. [组件规范](#5-组件规范)
6. [状态与反馈](#6-状态与反馈)
7. [图标规范](#7-图标规范)
8. [页面布局模板](#8-页面布局模板)
9. [深色模式](#9-深色模式)
10. [实施检查清单](#10-实施检查清单)

---

## 1. 设计哲学

### 核心原则：减法优先

Cockpit 是一个面向工程师的部署管理工具。用户在使用它时，往往处于高压状态（排查故障、紧急发布），因此界面必须做到**零认知负担**——用户的注意力应当完全集中在数据和操作上，而非界面本身。

**六条基本信条：**

| 信条 | 含义 |
|------|------|
| 克制色彩 | 颜色只用于传递状态信息，不用于装饰 |
| 慷慨空间 | 宁可空旷，不可拥挤；空白是设计的一部分 |
| 层级清晰 | 每个页面最多存在 3 个视觉权重层级 |
| 扁平无阴影 | 用细边框区分层级，不用 box-shadow |
| 信噪比最大化 | 每个像素都必须传递信息，装饰性元素一律删除 |
| 数据优先 | 服务状态、日志、指标是主角；UI 是背景 |

### 什么不应该出现

- ❌ 渐变背景块（除非用于表示物理属性如热度/进度）
- ❌ 插画、吉祥物、营销图形
- ❌ 多于 2px 的 box-shadow
- ❌ 超过 4 种以上的色相
- ❌ 字号小于 12px 的正文
- ❌ 没有功能的动效

---

## 2. 色彩系统

### 2.1 基础调色板

Cockpit 使用深色主题（dark-first），调色板极度克制。

#### 背景层级

```css
/* 从最深到最浅，形成 4 档层次 */
--bg-base:       #0B0D0F;   /* 页面底色 */
--bg-surface:    #141518;   /* 侧边栏、导航 */
--bg-elevated:   #1C1E21;   /* 卡片背景 */
--bg-overlay:    #242629;   /* 下拉菜单、Modal */
```

#### 文字层级

```css
--text-primary:   #EFEFEF;   /* 主要内容、标题 */
--text-secondary: #A3A3A3;   /* 辅助说明、副标题 */
--text-tertiary:  #636363;   /* 时间戳、元信息、占位符 */
--text-disabled:  #3D3F42;   /* 禁用状态 */
```

#### 边框

```css
--border-subtle:  rgba(255,255,255,0.06);   /* 默认分割线 */
--border-default: rgba(255,255,255,0.10);   /* 卡片边框 */
--border-strong:  rgba(255,255,255,0.16);   /* 交互 hover 边框 */
```

### 2.2 语义色（状态专用）

**规则：语义色只用于传递状态，绝不用于装饰。**

```css
/* 成功 / Running */
--color-success:       #4ADE80;
--color-success-muted: rgba(74, 222, 128, 0.12);
--color-success-text:  #86EFAC;

/* 警告 / Degraded */
--color-warning:       #FACC15;
--color-warning-muted: rgba(250, 204, 21, 0.12);
--color-warning-text:  #FDE047;

/* 错误 / Failed */
--color-error:         #F87171;
--color-error-muted:   rgba(248, 113, 113, 0.12);
--color-error-text:    #FCA5A5;

/* 信息 / Deploying */
--color-info:          #60A5FA;
--color-info-muted:    rgba(96, 165, 250, 0.12);
--color-info-text:     #93C5FD;

/* 中性 / Idle / Stopped */
--color-neutral:       #71717A;
--color-neutral-muted: rgba(113, 113, 122, 0.12);
--color-neutral-text:  #A1A1AA;
```

### 2.3 Accent 色（品牌色，极少使用）

```css
/* 仅用于：主要 CTA 按钮、选中状态、链接 */
--accent:       #A855F7;
--accent-hover: #9333EA;
--accent-muted: rgba(168, 85, 247, 0.15);
```

### 2.4 色彩使用规则

```
✅ 正确用法：
  - 服务状态 badge → 语义色
  - "Deploy" 按钮 → accent 色
  - 普通文字 → text-primary / secondary / tertiary
  - 卡片背景 → bg-elevated
  - 悬停状态 → border-strong（加深边框，不改变背景）

❌ 错误用法：
  - 用渐变色装饰页头
  - 用彩色区块区分模块（用边框代替）
  - 给每个服务随机分配颜色（只有状态才有颜色）
```

---

## 3. 间距与网格

### 3.1 基础单位：8px

所有间距都是 8 的倍数。

```
4px   — 图标与文字间距、badge 内边距
8px   — 列表项间距、内联元素间距
12px  — 小型卡片内边距
16px  — 标准卡片内边距（水平）
20px  — 标准卡片内边距（垂直）
24px  — 卡片之间的 gap
32px  — 区块内的子区域间距
48px  — Section 之间的间距（关键：呼吸感来源）
64px  — 页面顶部 padding、主要模块间距
```

### 3.2 实现方式（CSS）

```css
/* 间距 Token */
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### 3.3 页面布局网格

```
┌─ 侧边栏 240px ─┬──────────── 主内容区 ────────────┐
│                │  padding: 32px 40px              │
│   导航菜单      │                                  │
│   服务列表      │  最大内容宽度: 1200px             │
│                │  （超宽屏居中对齐）                │
└────────────────┴──────────────────────────────────┘
```

```css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.main-content {
  padding: var(--space-8) var(--space-10);
  max-width: 1200px;
}
```

### 3.4 卡片网格

```css
/* 服务卡片网格 */
.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6); /* 24px */
}

/* 统计指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3); /* 12px */
}
```

---

## 4. 字体系统

### 4.1 字体选择

```css
/* 优先级顺序 */
--font-sans: "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "Geist Mono", "JetBrains Mono", "Fira Code", monospace;
```

> **选型理由：** Geist 是 Vercel 专为开发者工具设计的字体，在小字号和深色背景下渲染极为清晰，与 Cockpit 定位高度吻合。如不想引入外部字体，系统字体栈同样足够。

### 4.2 字阶（Type Scale）

```css
:root {
  /* 5 档字号，通常只用其中 3 档 */
  --text-xs:   11px;   /* 标签、badge、uppercase 说明 */
  --text-sm:   13px;   /* 元信息、时间戳、次要文字 */
  --text-base: 14px;   /* 正文、卡片内容（主力字号） */
  --text-md:   16px;   /* 卡片标题、列表标题 */
  --text-lg:   20px;   /* 页面标题 */
  --text-xl:   28px;   /* 仅用于 Hero 区域 */

  /* 两档字重，不超过这两个 */
  --weight-regular: 400;
  --weight-medium:  500;
  /* 禁止使用 600 / 700（在深色背景下显得过重） */
}
```

### 4.3 视觉层级示例

```
28px / 500    Deploy completed            ← 页面主标题
16px / 500    my-api-service              ← 卡片标题、服务名
14px / 400    Provisioning infrastructure ← 正文描述
13px / 400    Last deployed 3 min ago     ← 辅助信息
11px / 500 / UPPERCASE   PRODUCTION       ← 环境标签
```

### 4.4 代码与日志

```css
/* 日志输出、命令行内容 */
.log-output {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* 行内代码 */
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--bg-overlay);
  border: 0.5px solid var(--border-default);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--text-primary);
}
```

---

## 5. 组件规范

### 5.1 卡片（Card）

**最核心的组件，所有服务条目都是卡片。**

```css
.card {
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-default);
  border-radius: 10px;
  padding: 20px;
  transition: border-color 0.15s ease;
}

.card:hover {
  border-color: var(--border-strong);
  /* 禁止：不加 box-shadow，不改变背景色 */
}
```

**卡片内部结构：**

```
┌──────────────────────────────────────┐  ← border: 0.5px
│  服务名（16px/500）   ● Running badge  │  ← 上区：标题 + 状态
│──────────────────────────────────────│  ← 分割线 0.5px
│  描述文字（14px/400, text-secondary） │  ← 中区：说明
│                                      │
│  最近部署: main · 2min ago （13px）   │  ← 下区：元信息
└──────────────────────────────────────┘
```

### 5.2 状态徽标（Status Badge）

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 20px;
  /* 只用 muted 背景色，不用纯色 */
}

/* 小圆点指示器 */
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* 变体 */
.badge--running  { background: var(--color-success-muted); color: var(--color-success-text); }
.badge--running::before  { background: var(--color-success); }

.badge--failed   { background: var(--color-error-muted);   color: var(--color-error-text);   }
.badge--failed::before   { background: var(--color-error);   }

.badge--deploying { background: var(--color-info-muted);   color: var(--color-info-text);    }
.badge--deploying::before { background: var(--color-info); animation: pulse 1.5s infinite; }

.badge--stopped  { background: var(--color-neutral-muted); color: var(--color-neutral-text); }
.badge--stopped::before  { background: var(--color-neutral); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

### 5.3 按钮（Button）

```css
/* 主要按钮（每页最多出现 1 次）*/
.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 7px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}
.btn-primary:hover  { background: var(--accent-hover); }
.btn-primary:active { transform: scale(0.98); }

/* 次要按钮 */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 0.5px solid var(--border-default);
  border-radius: 7px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.btn-secondary:hover { border-color: var(--border-strong); background: var(--bg-overlay); }

/* 危险操作（删除/停止）*/
.btn-danger {
  background: transparent;
  color: var(--color-error-text);
  border: 0.5px solid rgba(248,113,113,0.3);
  border-radius: 7px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}
.btn-danger:hover { background: var(--color-error-muted); border-color: var(--color-error); }
```

### 5.4 侧边栏导航（Sidebar）

```css
.sidebar {
  background: var(--bg-surface);
  border-right: 0.5px solid var(--border-subtle);
  width: 240px;
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border-radius: 7px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  /* 禁止：不加左侧彩色竖条、不加 box-shadow */
}

/* 项目分组标题 */
.nav-section-title {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-tertiary);
  padding: 12px 12px 4px;
}
```

### 5.5 输入框（Input）

```css
.input {
  background: var(--bg-overlay);
  border: 0.5px solid var(--border-default);
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-primary);
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}
.input::placeholder { color: var(--text-tertiary); }
.input:hover  { border-color: var(--border-strong); }
.input:focus  { border-color: rgba(168,85,247,0.5); box-shadow: 0 0 0 3px var(--accent-muted); }
/* 禁止：focus 时不改变背景色 */
```

### 5.6 数据表格（Table）

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  padding: 8px 12px;
  text-align: left;
  border-bottom: 0.5px solid var(--border-subtle);
}

.data-table td {
  padding: 12px 12px;
  color: var(--text-secondary);
  border-bottom: 0.5px solid var(--border-subtle);
  vertical-align: middle;
}

.data-table tr:hover td {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
/* 禁止：隔行换色（斑马纹），在深色背景下几乎看不出且显繁琐 */
```

### 5.7 日志输出面板（Log Panel）

```css
.log-panel {
  background: var(--bg-base);     /* 比卡片更深，制造下陷感 */
  border: 0.5px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  max-height: 400px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.7;
}

/* 日志行颜色 */
.log-line-info    { color: var(--text-secondary); }
.log-line-success { color: var(--color-success);  }
.log-line-warning { color: var(--color-warning);  }
.log-line-error   { color: var(--color-error);    }
.log-line-dim     { color: var(--text-tertiary);  }  /* 时间戳 */
```

### 5.8 指标卡（Metric Card）

```css
/* 用于 CPU、内存、请求数等关键指标 */
.metric-card {
  background: var(--bg-overlay);
  border-radius: 8px;
  padding: 16px;
  /* 不加边框，用更深的背景色与父级区分 */
}

.metric-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
}

.metric-change {
  font-size: 12px;
  margin-top: 4px;
}
.metric-change.up   { color: var(--color-success-text); }
.metric-change.down { color: var(--color-error-text);   }
```

---

## 6. 状态与反馈

### 6.1 服务状态对照表

| 状态 | 颜色变量 | 圆点动画 | 含义 |
|------|----------|----------|------|
| Running | `--color-success` | 静止 | 正常运行 |
| Deploying | `--color-info` | pulse 闪烁 | 部署中 |
| Degraded | `--color-warning` | 静止 | 运行但有异常 |
| Failed | `--color-error` | 静止 | 已失败 |
| Stopped | `--color-neutral` | 静止 | 已停止 |
| Building | `--color-info` | pulse 闪烁 | 构建中 |

### 6.2 Toast 通知

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  min-width: 280px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  border: 0.5px solid;
  backdrop-filter: blur(8px);   /* 唯一允许的特效 */
  z-index: 999;
}

.toast--success {
  background: rgba(20, 21, 24, 0.95);
  border-color: rgba(74, 222, 128, 0.3);
  color: var(--color-success-text);
}
.toast--error {
  background: rgba(20, 21, 24, 0.95);
  border-color: rgba(248, 113, 113, 0.3);
  color: var(--color-error-text);
}
```

### 6.3 空状态（Empty State）

```
┌──────────────────────────────┐
│                              │
│         （简单图标）           │
│                              │
│    No services deployed      │  ← 16px / 500
│    Deploy your first service │  ← 14px / text-secondary
│    to get started.           │
│                              │
│      [ Deploy Now ↗ ]        │  ← 主按钮
│                              │
└──────────────────────────────┘
```

规则：空状态不用插画，用简单的 SVG 线框图标即可；文案简洁，直接告诉用户下一步做什么。

---

## 7. 图标规范

### 7.1 选择标准

推荐使用 [Lucide Icons](https://lucide.dev/) —— 这是 Railway、Linear、Vercel 等工具普遍采用的图标库。特点：线条均匀（1.5px stroke）、形态克制、在深色背景下清晰。

### 7.2 尺寸规范

```
12px — 极小场景（badge 内图标）
14px — 表格行内图标
16px — 标准 UI 图标（导航、按钮、输入框）
20px — 卡片标题旁图标
24px — 页面级标题旁图标（谨慎使用）
```

### 7.3 颜色规则

```css
/* 图标颜色跟随文字层级 */
.icon-primary   { color: var(--text-primary);   }  /* 强调性图标 */
.icon-secondary { color: var(--text-secondary); }  /* 普通功能图标 */
.icon-tertiary  { color: var(--text-tertiary);  }  /* 辅助性图标 */
.icon-success   { color: var(--color-success);  }  /* 状态图标 */
.icon-error     { color: var(--color-error);    }  /* 错误图标 */
```

---

## 8. 页面布局模板

### 8.1 服务列表页（Dashboard）

```
┌─ Sidebar ─────┬─ Main Content ────────────────────┐
│               │                                    │
│ Projects      │  [Page Title]  [+ New Service]     │
│ ─────────     │  ─────────────────────────────     │
│ ▸ api-server  │                                    │
│   worker      │  ┌──────────┐ ┌──────────┐        │
│   cron        │  │ Service  │ │ Service  │  ...    │
│               │  │  Card    │ │  Card    │         │
│ Settings      │  └──────────┘ └──────────┘        │
│ Logs          │                                    │
│ Team          │  ┌──────────────────────────────┐  │
│               │  │  Recent Deployments (Table)  │  │
└───────────────┴──┴──────────────────────────────┴──┘
```

### 8.2 服务详情页

```
[← Back]  service-name  ● Running  [Redeploy]  [Settings]
─────────────────────────────────────────────────────────

[Overview] [Deployments] [Logs] [Metrics] [Variables]
─────────────────────────────────────────────────────────

┌── Metrics (4-column grid) ──────────────────────────┐
│ CPU 2.4%  │ Memory 128MB │ Requests 1.2k │ Uptime 99.9% │
└─────────────────────────────────────────────────────┘

                    ←── 48px gap ───→

┌── Latest Deployment ──────────────────────────────────┐
│  ● Success  main · a3f2c1d  Deployed 3 min ago        │
│  ─────────────────────────────────────────────────    │
│  [日志输出面板]                                         │
└───────────────────────────────────────────────────────┘
```

### 8.3 页面标题规范

```css
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-8);   /* 32px */
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 面包屑 */
.breadcrumb {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}
.breadcrumb a { color: var(--text-secondary); text-decoration: none; }
.breadcrumb a:hover { color: var(--text-primary); }
```

---

## 9. 深色模式

Cockpit 以深色模式为主，浅色模式可选。

### 9.1 CSS 变量切换

```css
/* 深色（默认）*/
:root {
  --bg-base:    #0B0D0F;
  --text-primary: #EFEFEF;
  /* ... 其他变量 */
}

/* 浅色（可选）*/
[data-theme="light"] {
  --bg-base:    #FAFAFA;
  --bg-surface: #F4F4F5;
  --bg-elevated: #FFFFFF;
  --bg-overlay: #F0F0F1;

  --text-primary:   #0F0F10;
  --text-secondary: #52525B;
  --text-tertiary:  #A1A1AA;

  --border-subtle:  rgba(0,0,0,0.06);
  --border-default: rgba(0,0,0,0.10);
  --border-strong:  rgba(0,0,0,0.16);
}
```

---

## 10. 实施检查清单

在每次 PR Review 或设计 Review 时，使用以下清单进行检查：

### 色彩

- [ ] 没有使用渐变色作为背景装饰
- [ ] 颜色只出现在状态 badge、主按钮、链接上
- [ ] 文字使用了正确的层级变量（primary/secondary/tertiary）
- [ ] 没有在深色背景上使用纯黑文字

### 间距

- [ ] 所有间距都是 8px 的倍数
- [ ] Section 之间的间距 ≥ 48px
- [ ] 卡片内部 padding ≥ 16px
- [ ] 没有文字贴边（至少 16px 内边距）

### 字体

- [ ] 没有使用 600 / 700 字重
- [ ] 没有字号小于 12px 的正文
- [ ] 每个页面的视觉层级不超过 3 档

### 组件

- [ ] 卡片边框为 0.5px（不是 1px）
- [ ] 没有使用 box-shadow 制造立体感（Toast 的 backdrop-filter 除外）
- [ ] 按钮 hover 状态有变化（边框加深 或 背景微变）
- [ ] 表格没有斑马纹
- [ ] 空状态有明确的 CTA

### 信噪比

- [ ] 页面上没有装饰性插画
- [ ] 没有无意义的动效（只有状态变化、Toast 进出有动效）
- [ ] 每个可见元素都承载信息

---

> 本规范基于 Railway 设计哲学提炼，结合 Cockpit 作为 DevOps 工具的具体场景定制。  
> 首要原则永远是：**让用户的注意力集中在部署状态和操作上，而非界面本身。**
