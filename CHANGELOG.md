# dsh-session-id 变更记录

面向 agent。最新在上。每版写「改了什么、影响哪个文件、怎么验证」。

## 2026-10-25 22:41 — 1.8.0 版本号对齐（1.7.0 后无代码改动） · c233da0
- 2026-10-26 15:22 文档补正（代码无改动）：README「回收站视图」段改为选择栏 `[全选][清空][彻底删除] … [清空回收站]` 与隐藏区同行结构；「面板设置」表默认显示档位「全部」→「含归档」。

## 1.7.0 — 2026-10-19
- **修：深色主题下「当前」徽章白底白字看不见**。`styles.ts` 的 `.sid-badge-current` 原来写死 `color:#fff`，
  而深色主题下 `--dsw-alias-brand-primary` = `#f9fafb`（近白）⇒ 白字盖白底。
  新增变量 `--sid-on-brand: var(--dsw-alias-label-primary-foreground, #fff)`（浅色=白、深色=近黑），
  徽章前景改用它。**全量复查 `styles.ts`**：其余颜色字面量全部位于 `var(…, 兜底)` 位置，无第二处写死前景。
- **勾选列上下不再误触**：`.sid-row-check` 由 `label` 改 `div`，CSS 加 `align-self: stretch` + `cursor: default`，
  整列撑满行高（实测 78px 行 → 列高 60px = 行高−padding−border）；点上下空白既不跳转也不勾选。
- **回收站布局与隐藏区统一**：新增 `TrashRow`（复用 `.sid-row` / `.sid-row-check` / `.sid-row-info` / `.sid-row-actions`），
  删掉 `.sid-trash-item` / `.sid-trash-name` / `.sid-trash-meta` 三条样式与旧结构。
  回收站新增常驻选择栏 `[全选][清空][彻底删除] … [清空回收站]`（后者 `sid-batch-tail` 钉最右）。
  勾选态是独立 state `trashSelected`（存条目名，不是会话 id）；`trashBusy` 控制忙碌禁用。
- **「路径」改为复制会话目录绝对路径**（原：工作目录 cwd）。host 新增 `POST /api/session-id/paths`
  （一次扫 `sessions/` 两层建索引，入参 `sessionIds`，返 id→目录；回收站条目返回收站目录）。
  client 新增 `PanelActions.paths`；`copyToClipboard` 改 async，`kind='path'` 先取路径再写剪贴板，取不到退回会话 id。
  删掉本次改动造成的死代码 `CwdResolver` / `copyText` / `cwdOf`。
- **归档行可点开**：`SessionRow` 的 `clickable` 去掉 `!isArchived`。
  注意：官方 `ui-workspace` 的 `clearArchivedCurrent()` 会在 sessions/workspaces 快照变动时清掉「当前会话已归档」，
  故打开归档会话后若列表变动可能被踢回空白——这是官方行为，未做规避。
- **文案**：`panel.filter.all`「全部」→「含归档」（中英）；`panel.copyPathTitle` → 「复制会话目录的绝对路径」。
- **自检探针扩容**（现场排查用，不影响功能）：
  - 新增 `probeLook()`：主题 `dark`、徽章计算色、勾选列 vs 行高、`--sid-blue`/`--sid-on-brand`、`archivedClickable`、`batchPeek()`；
  - 新增 `batchPeek()`：选择栏每键文字/宽度/右偏移/`tailText`；
  - 新增 `probeTrash()` + 指令 `probe-trash`（`?command=probe-trash` → 面板切回收站视图后上报 `trash-probe`）；
  - `probeRowHit` 采样列新增 `fx=0.02`（验勾选列）；host `summarize` 增补 `look` / `items` / `first`；
  - `openPanelFromHost` 签名改 `(view?: PanelView) => void`；`SessionIdPanel` 新增 `initialView`；
    `SessionIdEntry` 用 `openSeq` 作 key 强制重挂载（面板已开时切视图才生效）。
- 版本：`package.json` 1.7.0、client `VERSION` 1.7.0、`BUILD` 25、style `data-rev` 1.7.0。
- **验证（experiment 实例 3084，深色主题，全部实测）**：
  - `npm run build` ✓ 含 `check.mjs` 求值闸；reload 后 `status`：`plugin=@1.7.0 build=25 styleRev=1.7.0 entryMounted=true`。
  - `probe-row-hit`：`look.dark=true`；`badge` color `rgb(15,17,21)` / bg `rgb(249,250,251)`；`archivedClickable=14`；
    `check` 60/78；`samples` 中 `0.02/*` 三点全命中 `sid-row-check` 且 `cursor=default`。
  - `probe-trash`（临时造 1 条假回收站条目，验完已删）：`first.hasCheck=true`、`actions=["恢复","彻底删除"]`；
    `batch` 4 键，`清空回收站（1）` 的 `right=11`（最右）、`彻底删除` 紧贴 `清空` 右侧。
  - `/api/session-id/paths`：真实会话→`sessions\<编码cwd>\<id>`、回收站条目→`sessions-trash\<时间戳>-<id>`、不存在→无 key。

## 1.6.0 — 2026-10-15
- **新增「搜索范围」下拉**（SESSION_ID_PART.searchScope，紧贴搜索框右侧，宽 84px）：全部 / ID / 名称。
  设置项 searchScope: 'all' | 'id' | 'name'（默认 ll，持久化）。
  过滤逻辑：ll = 名称或 ID 命中；id = 只比 ID；
ame = 只比名称（大小写不敏感，均为 includes）。
- 新词条 panel.searchScope.{label,all,id,name}（中英）。
- 实测（探针 	oolbar.items）：工具栏仍单行（高 30），搜索范围下拉 84px，其余四个下拉 108px。
## 1.5.16 — 2026-10-15
- **「归档」不再与「取消归档」等宽**：删掉 .sid-action[data-tone=archive|unarchive] { min-width: 64px }，
  改为按各自文字宽度（实测「归档」60px；「取消归档」4 字约 84px）。
- **搜索框恢复弹性宽度**：删掉 1.5.15 加的 max-width: 240px，回到 lex: 1 1 90px（实测 494px），
  由其占据左侧剩余空间、把右侧按钮顶到最右。
- 探针 	oolbar 增加 owButtons（行内动作按钮的文字与宽度），可自验按钮宽度关系。
## 1.5.15 — 2026-10-15
- 搜索框加上限 max-width: 240px（其它控件收窄后它会一路 flex-grow 到 494px）。

## 1.5.14 — 2026-10-15
- **批量条与工具栏统一为「同高同字号」**：--sid-h-top 32→30，.sid-select 字号 12→13，
  .sid-batch .sid-action { height:30px; padding:0 7px; gap:0; font-size:13px }。
- **批量条按钮去掉图标**（只留文字）：13px 字号下图标会把这行挤到溢出。
- 探针 probe-row-hit 的 	oolbar 增加 heights 与 onts 字段（工具栏/下拉/按钮/批量条各自的高度与字号），
  可从终端自验"两行一致"。
- 实测：工具栏 30 / 下拉 30 / 工具栏按钮 30 / 批量条按钮 30；字号三者均 13px。
## 1.5.13 — 2026-10-15
- 「面板宽度」两行各是一个**模式按钮**（不再是勾选框）：第 1 行「自适应」、第 2 行「固定宽」，
  点它即切到该模式（data-on 高亮当前模式）。
- **点 chip 直接连模式一起切**：点 70/80/90 → {autoWidth:true, autoWidthPercent:preset}；
  点 700/860/1080 → {autoWidth:false, panelWidth:preset}。改输入框的值同样会切到对应模式。
  不再需要"先切模式再点值"，也去掉了 disabled 灰态。
- 新词条 panel.width.fixed（固定宽 / Fixed）；两个 title 文案改为"点这里切到 X 模式"。
## 1.5.12 — 2026-10-15
- 设置面板「默认显示」行末尾放回「打开会话后关闭面板」（该行空间足够，不再单独占一行）。
- 「面板宽度」改为**组内两行**：第 1 行 = 自适应（开关 + 百分比输入 + 单位 + chip 70/80/90）；
  第 2 行 = 固定宽（像素输入 + 单位 + chip 700/860/1080）。
  结构 = .sid-settings-group.sid-settings-stack（纵向）+ 两个 .sid-settings-line（横向）。
- 数字输入框收窄：.sid-num { width: 58px; padding: 0 4px; text-align: center }（只放 4 位数）。
## 1.5.11 — 2026-10-15
- **修「工具栏/批量条被压扁」**：面板是**固定高度**的纵向 flex 容器，工具栏、批量条、设置条默认 lex: 0 1 auto，
  空间不足时会被按比例压缩 → 控件只剩上半截、文字被裁。
  改为 .sid-toolbar / .sid-batch / .sid-settings 全部 lex: none；只有
  .sid-list { flex: 1 1 auto; min-height: 0 } 吸收收缩并自行滚动。
- 设置面板：「打开会话后关闭面板」从「默认显示」那行移出，独立成行（空标签位），使「默认显示」整行放下。

## 1.5.10 — 2026-10-15
- **工作区下拉撑歪界面的真因**：select 作为 flex item 默认 min-width: auto（= 最长 option 的 min-content 宽度），
  只写 width 会被它反过来撑开 → 必须三者一起锁：.sid-toolbar .sid-select { width: 108px; min-width: 0; max-width: 108px }。
- **工具栏强制一行**：.sid-toolbar { flex-wrap: nowrap; overflow-x: auto }；搜索框 lex: 1 1 90px; min-width: 44px
  （唯一可压缩项）；工具栏内按钮 padding: 0 7px。
- 「打开时定位到当前会话」文案改「定位当前会话」。
- **探针增强**：probe-row-hit additionally 返回 	oolbar{ toolbarWidth, toolbarHeight, selectWidths, items[] }
  （每个子控件的 tag/宽度/类名/文本）→ 可从终端自验「一行 + 下拉等宽」，不必靠肉眼。
- **新增源码 lint**：scripts/check.mjs 先扫 src/client/styles.ts，CSS 模板内出现反引号即判失败（本会话第三次踩该坑）。
## 1.5.9 — 2026-10-15
- **「全选」按钮：文案固定、行为切换**。已全选时再点一次 = 全部取消选择（llSelected）；未全选时点 = 选中当前筛选结果的全部。
  文案始终显示「全选」，不切成「全不选」。

## 1.5.8 — 2026-10-15
- **工具栏下拉统一固定宽度**：`.sid-toolbar .sid-select { width: 118px; max-width: none }`。
  此前只设了 `max-width: 150px`，工作区名/路径较长时会撑到上限，导致选中某项后整行被撑歪
  （其它下拉都按内容收缩成窄框）。设置面板里的下拉不受影响（仍用 `max-width: 150px`）。
- **「全选」文案固定**：不再切换成「全不选」。点击 = 选中当前筛选结果的全部；取消用右侧「清空」。
  同时删掉 `allSelected` 变量与 `panel.deselectAll` 词条（中英）。

## 1.5.7 — 2026-10-15
- **子代理行不再显示「父：…」**：删掉 `.sid-row-parent` 渲染、`SessionIdPanel` 里的 `parentTitleOf()` helper、
  `SessionRow` 的 `parentTitle` prop、对应 CSS 与词条 `panel.parentPrefix`。子代理身份靠青色「子代理」徽标即可。
- 结果：子代理行与普通行都是三行（标题 / 会话 ID / 更新时间），高度与排版完全一致。

## 1.5.6 — 2026-10-15
- **批量条右端标签**：未选中时**不显示任何文字**；选中后显示「已选 N 项」；有操作结果时同一处显示结果
  （合并成一个 span，不再额外占位）。删掉原先未选中时显示的「全选」占位文字。
- **批量条不再换行**：`flex-wrap: nowrap` + `overflow-x: auto`；条内按钮收一号
  （`.sid-batch .sid-action { height:24px; padding:0 6px; font-size:12px }`），保证全部按钮 + 右端计数挤在一行。

## 1.5.5 — 2026-10-15
- **标题行省掉一行**：会话数/显示数从独立副标题挪到「会话 ID」同行右侧（`.sid-title` 改 flex + `.sid-count-inline`）。
- **工具栏一行放下**：搜索框 `flex: 1 1 110px; min-width: 88px`；下拉收窄（`max-width:150px; padding:0 6px; font-size:12px`）；
  文案缩短（`定位当前`、`最近更新`、`最早更新`）；工具栏里的计数移除（已在标题行）。
- **新增「按工作区筛选」下拉**（`SESSION_ID_PART.workspace`）：选项 = 全部工作区 / 未分组 / 各工作区；
  设置项 `workspaceFilter`（`''` = 全部，`__ungrouped__` = 未分组）。归属判定 `workspaceKeyOf()`：
  先看工作区的 `sessionIds`，再退到 `cwd === workspace.path`。
  原先工具栏上的「分组」按钮**移除**（它被误当成筛选）；分组能力仍在设置里（「按工作区分组查看」）。
- **设置面板重排**：`display:grid; grid-template-columns:72px 1fr`（标签列 + 控件组列），
  删除 datalist 原生下拉（难看），宽度项改为「数字输入框（可手输）+ 预设 chip（点一下填入）」，
  自适应 chip = 70/80/90，固定 chip = 700/860/1080；chip 随模式禁用。

## 1.5.4 — 2026-10-15

**面板宽度：两种互斥模式，都能手输任意值**（`panel.tsx` / `styles.ts` / `locales.ts`）
- 设置项：`autoWidth: boolean`（默认 `false`）、`panelWidth: number`（固定 px，默认 **860**）、
  `autoWidthPercent: number`（自适应百分比，默认 **80**）。
- 固定：区间 560–4000，预设 `PANEL_WIDTH_PRESETS = [700, 786, 860, 960, 1080, 1280, 1440]`。
- 自适应：区间 40–100（% 视口宽），预设 `AUTO_WIDTH_PRESETS = [60, 70, 80, 86, 92, 100]`。
- 互斥：勾「自适应」→ 固定输入框 `disabled`；取消勾选 → 自适应输入框 `disabled`。
- UI 两处 hint 均注明默认值（`% 视口宽（默认 80）` / `px 固定（默认 860）`）。
- 两个输入框都是 `type=number` + `datalist`：可点下拉选预设，也可直接敲任意数字。
- 取值在**渲染时**夹取（`panelWidthCss()`），输入过程中的中间值不会被强行改写；越界值不会把面板搞坏。
- 旧数据兼容：上一版的 `panelWidth: 0` 表示"自适应"的语义已由 `autoWidth` 开关取代；非 0 的旧值照常生效。

**去掉刻意留白**（`styles.ts` / `panel.tsx`）
- 删除 `.sid-row-jump` 跳转热区元素与 CSS，删除 `.sid-row-info { max-width: 64% }`。
- `.sid-row-info` 改 `flex: 1 1 auto`：左列文字一直铺到右侧按钮为止（标题/ID 各自单行省略）。
- 之所以不再需要热区：文字节点已不拦截点击（1.5.1），整行（勾选框与按钮区之外）本来就可点。

验证：命中探针 12/12 采样点 `cursor: pointer`（无 `text`），`rowWidth=659`（固定宽 700 − 行内边距）。

## 1.5.3 — 2026-10-15（**修致命 bug：整页 import 失败**）

**根因**：`src/client/styles.ts` 的 **CSS 模板字符串内部**写了反引号（注释里的 `` `.sid-row-info` ``）→
反引号提前结束模板字符串 → 后面的 CSS 文本被当成 JS 表达式 → 产物里出现 `.sid - row - info`（减法）→
运行时 `ReferenceError: row is not defined` → 宿主页面 **`web boot: 1 entry did not activate` /
`Failed to load plugins`** → 界面报废；重启后重复同一过程，表现为「桌面版起不来」。

**为什么之前没拦住**：这类错误的产物**语法完全合法**（`.sid - row - info` 是合法表达式），
`node --check` 查不出来；而我的隔离验证只探了 host 路由 200，没检查页面侧 `entryMounted`。

**修复与防回归**
- 去掉该注释里的反引号，并在同处写明「CSS 注释内禁止出现反引号」。
- 新增 `scripts/check.mjs`：把 `lib/client.js` 放进最小 DOM/模块系统里**真求值一次**
  （模块顶层 + factory），按 `window.__ModuleLoader__.load` 捕获 factory，`require` 用可链式 stub 顶替。
- 接入构建：`scripts/build.mjs` 末尾 `spawnSync` 跑 check，**不过即构建失败**。
- 闸有效性已实证：对含 bug 的旧产物报 `✗ factory 求值失败：row is not defined`（与线上报错一字不差），
  对修复后产物 `✓ 通过`。
- 隔离实例完整验证（新判据）：`entryMounted=true`、`build=10`、reports 22；坏版本为 `reports=0`。

## 1.5.2 — 2026-10-15
- **面板宽度可设**：`PANEL_WIDTHS = [700, 786, 860, 960, 1080, 0]`，`0` = 自适应（86vw）；默认 **860**。
  实现：`.sid-panel { width: var(--sid-panel-width, 86vw) }`，面板根元素按设置写该 CSS 变量。
- `.sid-row-parent` / `.sid-row-time` 加 **`align-self: flex-start`**：它们原先是 `.sid-row-info`（纵向 flex）
  的直接子项，被 stretch 撑满整列 ⇒ 命中宽度 ≠ 文字宽度、右侧空白也是 I 型光标。**（本版因上面那个反引号 bug 而连带报废，1.5.3 一并修复。）**

## 1.5.1 — 2026-10-15

**行的可点性（`panel.tsx` / `styles.ts`）—— 根因修**
- 去掉 `title` / `id` / `time` / `parent` / 徽标上的 `onClick={stop}`：它们把点击全拦在文字节点里，而左侧几乎全是文字 ⇒ 表现为「点空白没反应、光标是 I 型」。
- `handleRowClick` 加**选区判定**：`window.getSelection().toString() !== ''` 时不跳转（保住"拖选 ID 复制"）。其余情况点行内任何非按钮区域都跳转。
- 只有 `.sid-row-check`（勾选框）与 `.sid-row-actions`（按钮区）继续 `stopPropagation`。

**会话 ID 单行（`styles.ts`）**
- `.sid-row-id`：`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`（去掉 `overflow-wrap: anywhere`）→ 永远一行，超出显示省略号。完整 ID 用行内「ID」键复制。
- 面板宽度 800 → `min(1120px, 92vw)`；`.sid-row-info` 加 `max-width: 64%`；`.sid-row-jump` 提到 `flex: 1 1 120px; min-width: 120px`（保证右侧 ≥120px 可点空白）。

**批量条（`panel.tsx` / `styles.ts`）**
- 「已选 N 项 / 全选」标签从最左**移到最右**（`.sid-batch-tail { margin-left: auto }`），操作按钮排前。

**自检新增「命中探针」（`index.tsx` / `src/index.ts`）**
- `GET /api/session-id/selftest?command=probe-row-hit`：页面会**先确保面板打开**，再对某一行 12 个坐标做 `elementFromPoint` 采样，回报每个位置命中的元素类名与 `cursor`。
- host 的 `summarize` 透传 `samples` / `rowWidth` / `rows`。
- 实测（面板宽 1120，行宽 1079）：12/12 采样点 `cursor: pointer`，中部命中 `sid-row-jump`、右侧命中 `sid-row` / `sid-action` —— **没有再出现 `cursor: text` 的可点区域**。
- 注意：host 的待下发指令是**单槽**，连着发 `open-panel` + `probe-row-hit` 时前一条会被顶掉；所以探针指令自带打开步骤，调用方只发一条即可。

## 1.5.0 — 2026-10-15

**行内按钮（`panel.tsx` / `styles.ts`）**
- 三键改为 `[ID] [名称] [路径]`（**去掉「复制」键**）。路径 = 会话工作目录 `cwd`；子代理行自身可能没有 `cwd`，回落到父会话（`cwdOf`）。
- 按钮高度 `--sid-h-row` 26 → 30px，字号 13px；归档/取消归档仍锁同宽（min-width 64px）。

**子代理（`panel.tsx` / `styles.ts` / `icons.tsx`）**
- 判定只能用 `row.origin === 'subagent'`（**裸 uuid 不是判据**：本机 45 个裸 uuid 里 13 个是普通会话）。
- 行上：青色「子代理」徽标 + 小字 `父：<父会话标题>` + 行左侧青线。
- 跳转：直接 `ctx.uiWorkspace.openSession(id)`（实测子代理可直接打开）。
- 新增工具栏下拉 `子代理：含子代理 / 隐藏子代理 / 仅子代理`，与归档筛选正交（存在 `settings.subagentFilter`）。

**面板几何（`styles.ts`）**
- **固定尺寸**：宽 800、高 `calc(100vh - var(--dsh-windows-titlebar-height,0px) - 48px)`、min-height 480。切隐藏区/回收站时面板不再缩成小框。
- overlay 加 `padding-top: var(--dsh-windows-titlebar-height, 0px)`：绕开桌面版顶部 **40px 高、z-index 1100** 的窗口标题栏（我的浮层是 1000）。**修「顶部按钮上半部分点不到」**。

**行的可点区域（`panel.tsx` / `styles.ts`）**
- 新增 `.sid-row-jump`（`flex:1` 热区）吸收行内剩余空白 → 点空白即跳转，命中面积足够。
- `.sid-row-info` 改 `flex: 0 1 auto` 不再铺满；`cursor:text` 只留在文字节点上。**修「点空白打不开 + 空白处是输入光标」**。

**多选（`panel.tsx`）**
- 全选 = 选中**当前筛选的全部**（不只已渲染的 60 行）；已全选时按钮变「全不选」；文案 `全选` / `清空`。

**颜色（`styles.ts`）**
- 当前会话行加常驻蓝色左边框（`box-shadow: inset 3px 0`）；隐藏徽标改灰色（与子代理青色区分）；按钮仍只在悬停时上色。

**host（`src/index.ts`）**
- 会话 id 校验放宽：`/^(?:session-)?[0-9a-fA-F][0-9a-fA-F-]{7,63}$/`（回收站条目名同步放宽）。**子代理会话（裸 uuid）现在可以删除 / 进回收站 / 恢复**。

验证：`styleRev`/`build` 自检字段见 `/api/session-id/status`；面板渲染事实看上报里的 `panel-mounted`。

## 1.4.1 — 2026-10-14
- **修 installStyles 幂等 bug**：热重载时旧 `<style>` 残留 → 新样式永不生效（表现为「改了 CSS 页面纹丝不动」）。改为**先删旧再插新**，并加 `data-rev` 与自检字段 `styleRev`。

## 1.4.0 — 2026-10-14
- 批量操作条常驻；行内三键复制；新增隐藏集合（localStorage）+ 隐藏区视图；按工作区分组；定位当前会话按钮；按钮按语义上色。

## 1.3.0 — 2026-10-14
- 删除容忍残缺会话（目录已删、只剩回收站条目或投影缓存）；当前会话不再豁免删除；新增设置「打开后关闭面板」。

## 1.2.0 — 2026-10-14
- 回收站（列表 / 恢复 / 彻底删除 / 清空）；彻底删除连带清投影缓存、归档、置顶、定时任务、第三方 per-session 状态；两个免确认开关。

## 1.1.0 — 2026-10-14
- 排序（最近/最早/标题）；归档筛选三档；跳转 `openSession`；删除（移入回收站 / 彻底删除）；修「打开后立刻点关闭没反应」（分页渲染 + pointerdown + content-visibility）。

## 1.0.0 — 2026-10-13
- 首版：侧边栏底部入口 + 会话 ID 面板（复制 / 搜索）+ host 自检路由（report / status / selftest）。
