# dsh-session-id

给 DSH Web GUI 加一个「会话 ID」面板：**在侧边栏底部点一下，看到全部会话的完整 ID，逐行复制 / 打开 / 删除。**

装好之后的表现：

- 侧边栏底部（设置那一行的旁边）多出一个「会话 ID」入口：侧栏收起时是一个图标按钮，
  展开时是带文字的整行按钮。
- 点开是一个居中面板，列出会话：标题、完整会话 ID（等宽字体）、更新时间；当前会话带
  「当前」标记，归档会话带「归档」徽标（**归档会话同样点得开**，与官方侧栏一致）。
- **排序**：最近更新在前（默认）/ 最早更新在前 / 按标题。
- **归档筛选**三档：含归档（默认）/ 隐藏归档 / 仅归档；默认档位可在设置里改（含「跟随上次」）。
  归档集合取自官方权威来源 `ctx.workspaces.list.getSnapshot().archivedSessionIds`。
- **搜索**：按标题或 ID 本地过滤，不发任何 host 查询。
- **跳转**：**点行的空白处**即切到该会话（文字只占自身宽度、只有文字上是文本光标，
  按钮区各自处理）；工具栏有「定位当前会话」按钮，设置里可开「打开时自动定位到当前会话」。
  行左端那 24px 的**勾选列整列撑满行高**：点它上下的空白既不跳转也不勾选，只有方框本身能切换
  （否则想勾选、点偏一点就跳到别的会话）。
- **三键复制**：`[ID]` / `[名称]` / `[路径]`——路径是**会话目录的绝对路径**
  `$DSH_HOME/sessions/<编码cwd>/<sessionId>`（host 侧反查，client 拿不到磁盘布局）。
- **子代理会话**：官方侧边栏**完全不显示**子代理，只有本面板能看到。识别用 `origin === 'subagent'`；
  子代理行带青色「子代理」徽标、小字父会话标题、左侧青线；点击可直接打开（`openSession`）。
  工具栏有独立下拉「子代理：含子代理 / 隐藏子代理 / 仅子代理」。
- **归档 / 取消归档**：行内按钮 → 官方 `uiWorkspace.archiveSession(id, {stopActivity:true})`。
- **多选批量**：每行左侧勾选框；操作条常驻 —— `[ID][名称][路径]` / 归档 / 取消归档 / 隐藏 /
  删除 / 全选（已全选时变**全不选**）/ 清空。批量删除同样受设置里的删除方式与免确认约束。
- **删除 + 回收站**：行内「删除」→ 移入回收站或彻底删除（可设免确认，**当前会话也能删**）；
  面板右上「回收站」→ 与隐藏区同一套布局（同一条选择栏 + 同一种会话行）：
  `[全选][清空][彻底删除] … [清空回收站]`，批量彻底删除只清勾选的那些，清空回收站钉在最右端。
  两种删除**都清投影缓存**。
- **设置**（持久化）：默认显示档位、子代理可见性、删除方式、五个开关（自动定位 / 分组 /
  删除免确认 / 回收站免确认 / 打开后关闭面板）。
- **几何**：面板**固定尺寸**（宽 800、高 = 视口 − 顶部标题栏 − 边距，下限 480px），切换视图不跳动；
  overlay 用 `padding-top: var(--dsh-windows-titlebar-height)` 绕开桌面版顶部那条 **40px、z-index 1100**
  的窗口标题栏（否则浮层顶部的按钮上半部分会被它吃掉鼠标）。
- **配色**：按语义上色（复制=蓝、归档=橙、取消归档=绿、删除=红、定位=青、子代理=青），
  常态克制的黑白、悬停才亮；当前会话行有常驻蓝色左边框，归档/隐藏/子代理徽标常驻彩色。
- **不卡**：列表首屏只渲染 60 行、按需 +200（配合 CSS `content-visibility`）。
- 中英双语词条，跟随 DSH 的语言设置。

它**不**改 DSH 源码、不写任何配置文件、不读会话内容、不自动复制任何东西。

## 删除与回收站（1.2.0）

**背景事实**：DSH 官方**没有删除会话的功能**——UI 的删除只删工作区（会留下会话记录），
host 的会话 RPC 里没有 delete，持久化层 README 也写明「不删除会话文件，直到外部移除」。
官方与删除并列的操作是**归档**（只改 `storages/workspace.json` 里的一个 id 数组）。
所以本插件的删除是**自己在 host 侧删磁盘目录**。

### 两种删除方式

| 方式 | 行为 | 可恢复 |
|---|---|---|
| 移入回收站 | 目录 `rename` 到 `$DSH_HOME/sessions-trash/<时间戳>-<sessionId>/`，并写一份 `trash-meta.json` 记原路径 | ✅ 面板内一键恢复 |
| 彻底删除 | `rm -rf` 会话目录，**不可恢复** | ❌ |

**两种方式都清投影缓存**：`$DSH_HOME/storages/session_projcache/sessions/<id>.json`
（官方 README 原文：投影缓存**无淘汰接口**，清理属"带外维护"——也就是由外部删文件）。

### 彻底删除到底删了什么

按官方各服务的公开入口逐项清（拿不到服务时退到删文件）：

| 目标 | 清法 |
|---|---|
| 会话目录 `sessions/<编码cwd>/<id>/` | `rm -rf`（官方无 API，只能自己删） |
| 投影缓存 `storages/session_projcache/sessions/<id>.json` | 官方域 API `storageDomain.get('session_projcache').table('sessions').delete(id)` **+ 直接删文件兜底** |
| 归档记录 `archivedSessionIds` | 官方 `workspaceRegistry.unarchiveSession(id)` |
| 置顶记录 `pinnedSessionIds` | 官方 `workspaceRegistry.unpinSession(id)` |
| 工作区记账 `workspaces[].sessionIds` | 官方 `entity.detachSession(id)` |
| 定时任务 `storages/schedule.json` | 删目录前 `schedule.stopSessionTasks(id)`，删后逐条 `schedule.delete` |
| 第三方 per-session 状态 | 按已知布局删（如 `redteam-mode/state/sessions/<id>.json`） |

**为什么投影要"官方 API + 删文件"两条都走**：官方 `table.delete` 的实现里有一句
`if (!this.records.has(key)) return false`，只对本进程加载过的记录生效；**别的进程刚写入**
的记录不在本进程内存里，那时它返回"成功"但文件还在（实测踩到）。所以补一次直接删文件。

> 注意：**不要**把 `storages/session_projcache/sessions/` 清空——官方有个 legacy 整体文件
> `session_projcache.json`，该目录一旦一个记录不剩，下次启动会从它 bootstrap 重建全部旧记录。
> 本插件只删指定会话，不批量清空。

**移入回收站则只清投影，不动归档/置顶**——回收站是可恢复的，恢复后归档状态完好。

### 回收站视图（1.2.0）

面板右上「回收站」按钮 → 与隐藏区**同一套布局**：同一条选择栏 + 同一种会话行。
行内列出条目（会话 ID + 时间 + 原路径），每项「恢复 / 彻底删除」。
选择栏 `[全选][清空][彻底删除] … [清空回收站]`——批量彻底删除只清勾选的那些，
「清空回收站」钉在最右端。恢复时优先读条目里的 `trash-meta.json`；**没有元数据**
（老条目/元数据丢了）时从会话日志第一帧读 `cwd` 反推目录名——实测恢复路径与原路径完全一致。

### 面板设置（1.2.0，持久化在浏览器 localStorage）

| 设置 | 选项 | 默认 |
|---|---|---|
| 默认显示 | 含归档 / 隐藏归档 / 仅归档 / **跟随上次** | 含归档 |
| 打开时定位到当前会话 | 开 / 关 | 开 |
| 按工作区分组 | 开 / 关 | 关 |
| 删除方式 | 移入回收站 / 彻底删除 | 移入回收站 |
| 删除免二次确认 | 开 / 关 | 关 |
| 回收站彻底删除免二次确认 | 开 / 关 | 关 |
| 打开会话后关闭面板 | 开 / 关 | 开 |

> 「子代理」可见性是**工具栏上的独立下拉**（与归档筛选正交），不在设置里。

「跟随上次」= 面板每次打开都用你上次手动选的档位；选了具体档位则每次都按它。
「免二次确认」开启后，点删除/彻底删除**一步到位**（不再弹确认条）。
「打开会话后关闭面板」开启时，点行内「打开」跳到会话的同时面板自动收起。

### 删除能容忍「残缺」的会话（1.3.0）

会话可能处于三种不完整状态，删除逻辑都覆盖：

| 状态 | 移入回收站 | 彻底删除 |
|---|---|---|
| 目录在 `sessions/` 下（正常） | 移入回收站 | 删目录 + 清全部关联数据 |
| 目录已删过、只剩回收站条目 | 识别为「已在回收站」，只补清投影 | **连回收站条目一起删** + 清关联数据 |
| 目录和回收站都没有、只剩投影缓存 | 提示「已被删过，可用彻底删除清残留」 | **仍能清掉投影/归档/任务等残留** |

### 归档（1.2.0）

行内「归档 / 取消归档」按钮 → 官方 `uiWorkspace.archiveSession(id, { stopActivity: true })` /
`unarchiveSession(id)`。带 `stopActivity: true` 是必须的：官方默认拒绝归档「有活动」的会话，
不传会直接吃一个 active-session 错误。

### 安全护栏

- 所有 host 路由只接受**回环地址**（127.0.0.1 / ::1）；
- session id 必须匹配 `session-<uuid 形状>`、回收站条目名必须匹配 `<时间戳>-session-<uuid>`，
  **不接受调用方给路径**——目录一律按 id/条目名反查，操作前再校验前缀；
- **当前会话也可以删**（1.3.0 起不再豁免）：它正被主视图 retain，删掉目录后本页面可能仍显示它
  直到刷新，之后的写入也会落空——知道这点再删；
- 删掉的 id 记在页面内存里，本次页面会话内从面板隐藏。

### 已知副作用（删完要心里有数）

- 宿主的会话列表**要等下一次刷新**才会少掉这一条（官方 store 不知道目录没了）；
- 若该会话正在后台跑工作，删目录会让它的写入落空——本插件**不检查**这一点，
  删之前请自行确认该会话没在跑。

## 装到本机实例

### 方式一：运行时注入（免重启）

```
dev_inject_plugin {"dir": "<本插件目录绝对路径>"}
```

注入器会建立目标 profile 的 `node_modules` 链接并即时装载；它把本插件记进注入清单
（`dev_injected_list` 可见），下次启动时自动恢复。改动 `lib/` 后约 1.5 秒自动重载。

### 方式二：作为 profile bundle 正式安装（重启后由 profile 自己加载）

> **本机状态（2026-10-13）**：已用这种方式正式装在 `desktop` profile 上
> （`dependencies` 加 `link:`，`bundles` 加 `dsh-session-id`），并已从注入器清单里
> 摘除同一条目——两条装载来源只留一条。回滚：恢复
> `profiles/desktop/package.json.bak-sessionid-20261013` 后重启。

在目标 profile 的 `package.json` 里做两件事：

```jsonc
{
  "dependencies": {
    "dsh-session-id": "link:<本插件目录绝对路径>"
  },
  "dsh": {
    "profile": {
      "bundles": [
        // …原有 bundles…
        "dsh-session-id"   // ← 加这一行
      ]
    }
  }
}
```

本包的 `cordis.patch.yml` 会在被当作 bundle 层时插入插件行
（`id: session-id` / `name: dsh-session-id`）。改完重启 dsh 即可。

> 两种方式**选一种**即可：同时用会出现同一插件的两个装载来源。

## 自检（在终端确认它到底装没装上）

client 插件跑在页面里，从终端完全看不见它。为此本插件带一个 host 半边，
只做一件事：把页面里的自身状态暴露成回环 HTTP 路由。

```sh
BASE=http://127.0.0.1:<你的实例端口>      # 桌面版默认 19387

# 当前状态：最近一条上报 + 历史
curl $BASE/api/session-id/status

# 远程自检：让页面自己打开一次面板（下一次心跳 ≤30s 内执行）
curl $BASE/api/session-id/selftest

# 行内命中 + 外观探针：打开面板 → 采样行内各处命中元素与配色 → 上报 row-hit-probe
curl "$BASE/api/session-id/selftest?command=probe-row-hit"

# 回收站视图探针：切到回收站视图 → 读行结构与选择栏排布 → 上报 trash-probe
curl "$BASE/api/session-id/selftest?command=probe-trash"
```

`status` 里各字段怎么读：

| 字段 | 含义 |
|---|---|
| `reports` | 收到过多少条上报；`0` = 页面里根本没跑起来 |
| `phase` | 上报阶段：`applied` → `slot-registered` → `check-2s/8s/20s` → `tick`(30s) |
| `slotRegistered` | 席位注册调用是否成功（false 说明席位被别的插件占了或声明未到） |
| `slotDeclared` | `sidebar.footer.action` 席位是否已由外壳声明 |
| `slotEntries` | 该席位上当前有多少个占位者（含本插件，正常 ≥1） |
| `entryMounted` | **入口按钮是否真的渲染在页面里**（true = 界面上确实看得见） |
| `sessionCount` | 页面读到的会话数（-1 = 会话服务不可用） |
| `archivedCount` | 归档集合的大小（-1 = workspaces 服务不可用；0 也可能是真没有归档） |
| `hasJump` / `hasUiWorkspace` | 跳转能力是否就绪（`ctx.uiWorkspace.openSession` 存在） |
| `deletedLocally` | 本次页面会话内已被删除（内存里压掉）的会话数 |
| `localeRegistered` | 词条命名空间是否注册成功 |
| `phase` 里的 `panel-mounted` | 面板渲染过一次（配合 `selftest` 用） |
| `phase` 里的 `jumped` / `deleted-trash` / `deleted-purge` | 页面里点过跳转 / 删过会话 |
| `phase` = `row-hit-probe` 的 `samples[]` | 行内各坐标命中的元素类名与 `cursor`。左列（`at` 以 `0.02/` 开头）应命中 `sid-row-check` 且 `cursor: default` ⇒ 勾选列上下不可点 |
| 同上的 `toolbar` | 工具栏宽度、每个下拉/按钮的宽度、批量条与工具栏的高度与字号（防「下拉撑歪一行」「按钮被压扁」） |
| 同上的 `look.dark` | 页面当前是否深色主题（判据 `body[data-ds-dark-theme]`） |
| 同上的 `look.badge` | 「当前」徽章的实际 `color` / `background`。深色主题下应是近白底 + 近黑字；若两者都近白 ⇒ 又把前景写死成 `#fff` 了 |
| 同上的 `look.tokens` | `--sid-blue` / `--sid-on-brand` 的计算值 |
| 同上的 `look.archivedClickable` | 带「归档」徽标且 `data-clickable="true"` 的行数（>0 ⇒ 归档行可点开） |
| 同上的 `look.check` | 勾选列高度 vs 行高（应 = 行高 − 上下 padding ⇒ 整列撑满） |
| `phase` = `trash-probe` 的 `first` / `look.batch` | 回收站首行的尺寸、勾选列、右侧按钮文字，以及选择栏每个按钮的文字与右偏移（`清空回收站` 的 `right` 应最小 ⇒ 钉在最右端） |

一次典型的好结果（0.2.0-rc.2 桌面版实测）：

```json
{"ok":true,"plugin":"dsh-session-id","reports":24,
 "latest":{"phase":"tick","entryMounted":true,"slotEntries":2,"sessionCount":323,
           "archivedCount":126,"hasUiWorkspace":true,"localeRegistered":true}}
```

删除路由也可以直接命令行调（**危险，只在确实要删时用**）：

```sh
curl -X POST $BASE/api/session-id/delete \
     -H "content-type: application/json" \
     -d '{"sessionId":"session-xxxx","purge":false}'   # purge:true 才是彻底删除
```

批量解析会话目录（面板「路径」按钮走这里；回收站里的条目给回收站目录）：

```sh
curl -X POST $BASE/api/session-id/paths \
     -H "content-type: application/json" \
     -d '{"sessionIds":["session-xxxx"]}'
# → {"ok":true,"root":"...\\sessions","paths":{"session-xxxx":"...\\sessions\\<编码cwd>\\session-xxxx"}}
```

## 开发

```sh
npm install     # 只装 esbuild
npm run build   # 产出 lib/index.js（host 半边）+ lib/client.js（client 半边）
```

- `src/index.ts` —— host 半边（自检路由，无业务）。
- `src/client/index.tsx` —— client 半边入口：词条注册 + 席位注册 + 自检。
- `src/client/panel.tsx` —— 面板与行组件。
- `src/client/styles.ts` —— 插件样式（文本 + 一次性注入 `<style>`，作用域靠
  `[data-dsh-plugin="session-id"]`）。
- `src/client/report.ts` —— 自检上报。

client 半边的两个硬约束（改代码时别踩）：

1. `lib/client.js` 必须是 `window.__ModuleLoader__.load({ id, factory })` 形态的
   CJS bundle，`require` 只能取**平台基座**模块（`react` / `react-dom` /
   `@deepseek-ai/dsh-client-ui-primitives` 这类）；Dsh.client 声明的基座之外的东西
   要么打进 bundle，要么在 `dsh.client.external` 里声明。
2. `ctx.slots.register({` 与它的 `name:` 字段必须保持紧邻书写——本机注入器的注入前
   骨架预检用正则认这个形状，中间插换行会被误判为「坏骨架」而阻断注入。

## 与 `@linxin666/dsh-client-ui-session-id` 的关系

本插件是它的**重写版**：功能对齐（侧栏底部入口 + 会话 ID 列表 + 复制 + 搜索），
代码按 DSH 0.2.0-rc.2 的客户端契约重写，并补了上面那套自检机制。原插件只有编译
产物（`lib/client.js`），本插件保留可读源码与一键构建脚本。

### 原插件为什么「老了」——实测出来的三处硬伤

对比旧实例（包版本 0.1.0-rc.8，装在 `C:\dsh-homes\legacy`）与本机桌面版
（0.2.0-rc.2）后，真正会让它装不上 / 表现不对的只有下面三点，其余契约
（slots 席位、`sidebar.footer.action`、`locale.register` 签名、`{n}` 插值、
`writeClipboard` 导出）两版完全一致：

| # | 原插件的写法 | 在新版会发生什么 | 本插件怎么改 |
|---|---|---|---|
| 1 | `peerDependencies`：`@deepseek-ai/dsh-client-ui-primitives: ^0.1.1-rc.2` | 新版是 0.2.0-rc.2，`semver.satisfies` 不成立 → 启动时 `incompatible-version` **拒绝装载**（`link:` 本地安装同样不豁免）。`dsh.engines.dsh` 那个字段两版都无人读取，挡不住也放不开 | 不写 `peerDependencies` —— 本包无 peer 声明即直接放行；真要用版本门禁，就写 `>=0.2.0-rc.0` 这类范围或配 `compatibility.json` |
| 2 | `dsh.client.inject: ["@deepseek-ai/dsh-client-runtime"]` | 0.2.0-rc.2 **没有这个包**（它已拆成 `dsh-api-session-controller` / `dsh-client-ui-renderer` / `dsh-client-store`）。该声明本身不报错，但一旦 bundle 里 `require` 它，就抛 `missed the module table` | 不声明 `dsh.client.inject`：本插件只 `require` 三个平台基座模块（`react` / `react-dom` / `@deepseek-ai/dsh-client-ui-primitives`），都在 seed 表里 |
| 3 | 面板用 `sessions.list.getSnapshot().current` 标记「当前会话」 | 新版快照字段只剩 `ids / byId / phase / projectionsBySession`，`current` 已删除 → 该标记永远不亮 | 改用会话行的保留计数：`retainedBy.mainView > 0` 的那个会话即当前会话（旧字段仍作兜底，见 `currentSessionId`） |

（另有 `subagentsByParent` / `jobsBySession` / `currentAddress` 三个字段在新版同样消失；
原插件没用到，故不影响它，但迁移别的插件时要留意。）

## 本机验收记录（2026-10-13，桌面版实例 / 端口 19387）

```
GET /api/session-id/status
  latest: {"phase":"check-8s","entryMounted":true,"slotEntries":2,
           "sessionCount":301,"localeRegistered":true}

GET /api/session-id/selftest      # 终端下发「打开一次面板」
  → history: selftest-open-panel, panel-mounted(sessions=301), tick
```

即：入口按钮真的渲染在侧边栏底部、面板真的能打开并列出 301 个会话、
词条注册成功。期间踩到并修掉的两个生命周期缺陷记在这里，改代码时别退回去：

1. `window.setTimeout/setInterval` 必须挂在 `ctx.effect` 上——插件热重载时新旧实例
   会短暂并存，死实例的定时器若不清理，会让外部看到两组互相矛盾的上报。
2. 供自检调用的「打开面板」句柄要按引用归属（清理时只撤销自己设的那个），
   否则旧实例卸载时会顺手把新实例的句柄清空，自检就永远打不开面板。

### 正式安装路径的冒烟验证

正式安装（profile dependencies + bundles）要重启才生效，所以另起一个**隔离实例**
把同一条装配路径跑了一遍——独立 `DSH_HOME`、独立端口、最小 profile
（`dsh-base` + `dsh-web-app` + 本插件）：

```
verify-bundle-install.ps1 -PluginDir <本插件目录> -ProbePath /api/session-id/status
  → listening: true
  → hostProbe: HTTP 200，body 2018 字节（插件自检 JSON）
  → 页面侧：applied / slot-registered / entryMounted: true
```

工具与用法见知识库 `DSH工具集\插件bundle安装冒烟验证工具-verify-bundle-install.md`。

## 已知限制

- 需要声明了 `sidebar.footer.action` 席位的 Web 外壳（DSH 0.1.0-rc.8 及更新版本）。
- 只读查看器：展示与复制 ID，不打开、不管理会话。
- 会话非常多时面板一次性渲染全部行（本机 301 个会话渲染无感知卡顿）；搜索框是
  本地过滤，不缩小渲染量。

## 许可证

MIT。
