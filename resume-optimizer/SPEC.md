# Resume Optimizer — AI 简历优化工具

## 1. Concept & Vision

**产品名称**: Resume Optimizer
**一句话描述**: 上传简历，AI 即时分析问题并生成优化建议，让求职者们快速提升简历竞争力。

产品调性：**专业、高效、可信赖**。界面干净利落，像一个靠谱的 HR 助手，而不是花哨的 AI玩具。

---

## 2. Design Language

- **Aesthetic**: 工具型工具站风格，参考 Linear/Vercel 的克制美学 — 深色主题为主，留白充足，内容层次分明。
- **Color Palette**:
  - Background: `#0a0a0f` (near-black)
  - Surface: `#111118` (card/panel)
  - Border: `#1e1e2e` (subtle separator)
  - Primary: `#6366f1` (indigo accent)
  - Primary Hover: `#818cf8`
  - Text Primary: `#f1f5f9`
  - Text Secondary: `#94a3b8`
  - Success: `#22c55e`
  - Warning: `#f59e0b`
  - Error: `#ef4444`
- **Typography**: Inter (Google Fonts), fallback `system-ui, sans-serif`
- **Spacing**: 4px base unit, multiples of 4/8/12/16/24/32
- **Motion**: Subtle entrance fade (200ms ease-out), button press scale (0.97), loading spinner
- **Icons**: Lucide React

---

## 3. Layout & Structure

```
┌──────────────────────────────────────────────────────┐
│  Header: Logo + 产品名 + GitHub链接                   │
├──────────────────────────────────────────────────────┤
│  Hero Section: 标题 + 一句话介绍 + CTA                 │
├──────────────────────────────────────────────────────┤
│  Main Content (2-column on desktop, stacked mobile): │
│  ┌─────────────────────┐  ┌─────────────────────────┐ │
│  │  Upload Zone        │  │  Analysis Result        │ │
│  │  - 拖拽上传区域      │  │  - 分析状态             │ │
│  │  - 文件格式说明      │  │  - 问题列表             │ │
│  │  - 已上传文件展示    │  │  - 优化建议             │ │
│  │  - 分析按钮          │  │  - 优化后简历下载       │ │
│  └─────────────────────┘  └─────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│  Footer: 版权 + 免责                                  │
└──────────────────────────────────────────────────────┘
```

- Responsive: mobile 单列堆叠，md+ 双列
- 最大内容宽度: 1200px，居中

---

## 4. Features & Interactions

### 核心功能

1. **简历上传**
   - 支持拖拽或点击上传
   - 支持格式: PDF, DOCX, DOC, TXT
   - 文件大小限制: 5MB
   - 上传后显示文件名和大小，可删除重新上传

2. **AI 简历分析**
   - 调用 MiniMax API（内部工具可直连）
   - 分析维度: 结构完整性、关键词密度、成就量化程度、表达清晰度、常见问题
   - 分析中显示 skeleton loading
   - 完成后展示评分(0-100) + 分项得分 + 详细问题列表

3. **优化建议 & 生成**
   - 基于分析结果给出具体改写建议
   - 提供优化后的简历文本（纯文本输出）
   - 支持一键复制优化结果

### 交互细节

- 拖拽时边框高亮为 primary 色
- 上传失败显示 error toast
- 分析按钮：上传文件后激活，分析中禁用显示 spinner
- 结果区域：进入时 fade-in 动画

---

## 5. Component Inventory

| Component | States |
|---|---|
| `UploadZone` | idle / drag-over / uploading / uploaded / error |
| `AnalysisPanel` | empty / loading / success / error |
| `ScoreCard` | animated fill on mount |
| `IssueList` | collapsible items |
| `OptimizedContent` | code-block style, copy button |
| `Button` | default / hover / active / disabled / loading |
| `Toast` | success / error / info |

---

## 6. Technical Approach

### 框架 & 工具
- **Next.js 15** (App Router)
- **TailwindCSS v4** (JIT, CSS variables)
- **TypeScript**
- **Lucide React** (icons)
- **shadcn/ui** (基础组件，基于 Radix)

### API 设计
- `POST /api/analyze` — 接收简历文本，返回分析结果
  - Request: `{ content: string, filename: string }`
  - Response: `{ score: number, dimensions: {...}, issues: string[], suggestions: string[], optimized: string }`

### 数据流
1. 用户上传文件 → 前端读取文本内容 (pdf-parse / mammoth)
2. 发送文本到 `/api/analyze`
3. 后端调用 MiniMax API 解析简历
4. 返回结构化结果，前端渲染

### 变现路径 (Phase 2+)
- 免费版: 每日 3 次分析
- 付费版: ¥9.9/次 或 ¥29/月无限用
- 收款: 微信支付 / 支付宝（通过收款二维码）

---

## 7. MVP Scope

**做**:
- [x] SPEC.md
- [x] Next.js 项目脚手架 + TailwindCSS
- [x] 简历上传区（支持 PDF/DOCX/TXT）
- [x] AI 分析调用（MiniMax API）
- [x] 结果展示区（评分 + 问题 + 优化建议）
- [ ] 优化后简历下载
- [ ] 收款功能

**后做**:
- 微信/支付宝收款
- 历史记录
- 多语言