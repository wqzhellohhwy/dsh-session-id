/**
 * 插件样式：一段纯 CSS 文本 + 一次性注入 <style>。
 *
 * 作用域靠 `[data-dsh-plugin="session-id"]` 前缀自守；颜色一律走 DSH 的 CSS 变量
 * （带 fallback），跟随主题自动适配。按钮按"语义色调"上色：
 * 复制=蓝、归档=橙、取消归档=绿、删除=红、定位=青。
 */

/** 插件根属性值（同时用于样式作用域与自检时的 DOM 选择器）。 */
export const SESSION_ID_PLUGIN_ATTR = 'session-id'

/** 面板里的部件标记，供外观主题与自动化定位使用。 */
export const SESSION_ID_PART = {
  entry: 'entry',
  panel: 'panel',
  toolbar: 'toolbar',
  search: 'search',
  searchScope: 'search-scope',
  sort: 'sort',
  filter: 'filter',
  autoscroll: 'autoscroll',
  locate: 'locate',
  list: 'list',
  row: 'row',
  check: 'check',
  copy: 'copy',
  path: 'path',
  jump: 'jump',
  parent: 'parent',
  subagent: 'subagent',
  archive: 'archive',
  hide: 'hide',
  remove: 'remove',
  trash: 'trash',
  hiddenArea: 'hidden-area',
  group: 'group',
  workspace: 'workspace',
  more: 'more',
  close: 'close',
  batch: 'batch',
} as const

/** 样式文本。 */
const CSS = `
[data-dsh-plugin="${SESSION_ID_PLUGIN_ATTR}"] {
  box-sizing: border-box;
  /* 语义色调（各自带主题变量 + 兜底值） */
  --sid-blue: var(--dsw-alias-brand-primary, #4d6bfe);
  --sid-orange: var(--dsw-alias-state-warning-primary, #d97706);
  --sid-green: var(--dsw-alias-state-success-primary, #16a34a);
  --sid-red: var(--dsw-alias-state-error-primary, #dc2626);
  --sid-cyan: var(--dsw-alias-state-business-primary, #0891b2);
  --sid-neutral: var(--dsw-alias-border-l2, rgba(127,127,127,.28));
  /* 压在实心品牌色上的文字：浅色主题=白、深色主题=近黑。禁写死 #fff（深色下 brand-primary 是近白，白字直接看不见）。 */
  --sid-on-brand: var(--dsw-alias-label-primary-foreground, #fff);
  /* 统一控件高度：顶部动作与行内动作各一套，保证"同排同高" */
  --sid-h-top: 30px;
  --sid-h-row: 30px;
}

/* ── 侧边栏底部入口 ───────────────────────────────────────────── */
.sid-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  transition: background-color .12s, color .12s, box-shadow .12s;
  font: inherit;
}
.sid-trigger[data-wide="wide"] {
  flex: auto;
  justify-content: flex-start;
  width: auto;
  min-width: 0;
  padding: 0 10px;
  border-radius: 8px;
}
.sid-trigger:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12));
  color: var(--dsw-alias-label-primary, #1a1a1a);
}
.sid-trigger:active:not(:disabled) { background: var(--dsw-alias-interactive-bg-active, rgba(127,127,127,.18)); }
.sid-trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--dsw-alias-bg-layer-2, transparent), 0 0 0 4px var(--sid-blue);
}
.sid-trigger-label {
  display: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  line-height: 20px;
}
.sid-trigger[data-wide="wide"] .sid-trigger-label { display: inline; }

/* ── 面板骨架 ─────────────────────────────────────────────────── */
/*
 * Windows 桌面版顶部有一条 40px 高、z-index 1100 的窗口标题栏层（原生 drag 区），
 * 我的浮层是 z-index 1000 —— 面板一旦顶到视口顶部，那条就会被它压住，表现为
 * 「按钮上半部分点不动」。所以 overlay 用 padding-top 把整块内容压到标题栏下方
 * （官方的 settings overlay 也是这么做的：给 overlay 加 padding-top）。
 */
.sid-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--dsh-windows-titlebar-height, 0px) 24px 24px;
}
.sid-mask {
  position: absolute;
  inset: 0;
  background: var(--dsw-alias-bg-mask-1, rgba(0,0,0,.35));
  backdrop-filter: var(--dsw-mask-blur, blur(2px));
}
/* 固定尺寸：内容多少都不变（切换隐藏区/回收站时面板不再缩成小框） */
.sid-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-sizing: border-box;
  /* 面板宽度：由设置里的档位写进 --sid-panel-width（0/缺省 = 自适应 92vw） */
  width: var(--sid-panel-width, 86vw);
  max-width: 100%;
  height: calc(100vh - var(--dsh-windows-titlebar-height, 0px) - 48px);
  min-height: 480px;
  padding: 14px 18px 14px;
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-2, #fff);
  color: var(--dsw-alias-label-primary, #1a1a1a);
  box-shadow: var(--dsw-shadow-lv3, 0 12px 40px rgba(0,0,0,.18));
  font-size: 14px;
  line-height: 22px;
}
.sid-header { display: flex; align-items: center; gap: 12px; }
.sid-heading { flex: 1; min-width: 0; }
/* 标题与计数同一行（省掉一整行） */
.sid-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
}
.sid-count-inline {
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
}
.sid-subtitle { margin-top: 2px; color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; line-height: 18px; }

/* ── 顶部动作按钮：隐藏区 / 回收站 / 设置 / 关闭 —— 同一小尺寸、同一命中区 ── */
.sid-head-actions { display: inline-flex; align-items: center; gap: 6px; flex: none; }
.sid-icon-btn,
.sid-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  flex: none;
  min-width: 64px;
  height: var(--sid-h-top);
  padding: 0 10px;
  border: 1px solid var(--sid-neutral);
  border-radius: 9px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  transition: background-color .12s, color .12s, border-color .12s;
}
.sid-icon-btn:hover,
.sid-close:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12));
  color: var(--dsw-alias-label-primary, #1a1a1a);
}
.sid-close:hover {
  border-color: var(--sid-red);
  color: var(--sid-red);
  background: color-mix(in srgb, var(--sid-red) 10%, transparent);
}
.sid-icon-btn:focus-visible,
.sid-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--dsw-alias-bg-layer-2, transparent), 0 0 0 4px var(--sid-blue);
}
.sid-icon-btn[data-on="true"] {
  color: var(--sid-blue);
  border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
.sid-icon-btn[data-tone="trash"]:hover {
  color: var(--sid-orange);
  border-color: var(--sid-orange);
  background: color-mix(in srgb, var(--sid-orange) 10%, transparent);
}
.sid-close-label { white-space: nowrap; }

/* ── 设置条：网格排版（标签列 + 控件组列），紧凑不散 ─────────────── */
.sid-settings {
  display: block;
  flex: none;
  padding: 10px 12px;
  border: 1px solid var(--sid-neutral);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.05));
  font-size: 13px;
}
.sid-settings-grid { display: grid; grid-template-columns: 72px 1fr; gap: 8px 10px; align-items: center; }
.sid-settings-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* 组内纵向堆两行（面板宽度：自适应一行、固定一行） */
.sid-settings-stack { flex-direction: column; align-items: flex-start; gap: 6px; }
.sid-settings-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* 设置里的开关收一号：一行能放下该项的全部开关 */
.sid-settings .sid-action { height: 26px; padding: 0 6px; gap: 4px; font-size: 12px; }
/* 预设小按钮：点一下就把值填进旁边的输入框（"可选"） */
.sid-chip {
  flex: none;
  height: 24px;
  padding: 0 9px;
  border: 1px solid var(--sid-neutral);
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 22px;
}
.sid-chip:hover { border-color: var(--sid-blue); color: var(--sid-blue); }
.sid-chip[data-on="true"] {
  border-color: var(--sid-blue);
  color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
.sid-settings-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sid-settings-label { color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; }
/* 设置里的数字输入：窄框（最多放 4 位数），旁边的 chip 给预设 */
.sid-num {
  flex: none;
  width: 58px;
  height: 26px;
  padding: 0 4px;
  border: 1px solid var(--sid-neutral);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
  text-align: center;
}
.sid-num:focus { outline: none; border-color: var(--sid-blue); }
.sid-num:disabled { opacity: .5; }
.sid-settings-hint { flex: none; color: var(--dsw-alias-label-tertiary, #8a8a8a); font-size: 11px; }
.sid-settings-row .sid-select { padding: 5px 8px; font-size: 12px; }

/* ── 批量操作条：常驻显示（不再等勾选才出现），单行不换行 ────────── */
.sid-batch {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 5px 10px;
  border: 1px solid var(--sid-neutral);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.05));
}
/* 条内按钮与工具栏同高同字号（两行视觉一致），并去掉图标腾出宽度 */
.sid-batch .sid-action { height: 30px; padding: 0 7px; gap: 0; font-size: 13px; }
.sid-batch[data-active="true"] {
  border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 8%, transparent);
}
.sid-batch-count { flex: none; color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; white-space: nowrap; }
/* 计数 / 全选提示：推到最右 */
.sid-batch-tail { margin-left: auto; }
.sid-batch[data-active="true"] .sid-batch-count { color: var(--sid-blue); font-weight: 500; }

/* ── 分组视图 ─────────────────────────────────────────────────── */
.sid-group { display: flex; flex-direction: column; gap: 6px; }
.sid-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  padding: 0 4px;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}
.sid-group-title[data-ungrouped="true"] { color: var(--sid-cyan); }
.sid-group-count { color: var(--dsw-alias-label-tertiary, #8a8a8a); font-weight: 400; }

/*
 * 工具栏：强制一行（搜索框是唯一可压缩项，宁可它变窄也不换行）。
 *
 * flex: none 必须写 —— 面板是固定高度的纵向 flex 容器，工具栏/批量条若可收缩，
 * 内容一多就会被按比例压扁（表现为按钮文字被裁掉一半）。只有列表面板该吸收收缩。
 */
.sid-toolbar { display: flex; align-items: center; gap: 6px; flex: none; flex-wrap: nowrap; overflow-x: auto; }
.sid-search {
  flex: 1 1 90px;
  min-width: 44px;
  height: var(--sid-h-top);
  padding: 0 10px;
  border: 1px solid var(--sid-neutral);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.sid-search:focus { outline: none; border-color: var(--sid-blue); }
/* 工具栏里的动作按钮（定位当前）也收一号，给搜索框腾地方 */
.sid-toolbar .sid-action { padding: 0 7px; }
.sid-select {
  flex: none;
  max-width: 150px;
  height: var(--sid-h-top);
  padding: 0 6px;
  border: 1px solid var(--sid-neutral);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: inherit;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.sid-select:focus { outline: none; border-color: var(--sid-blue); }
/*
 * 工具栏里的下拉统一固定宽度。
 *
 * 关键：光有 width 没用 —— select 作为 flex item 默认 min-width: auto，
 * 它等于「最长 option 的 min-content 宽度」，会把 width 反过来撑开（工作区名/路径
 * 一长就撑歪整行）。所以必须显式 min-width: 0 + max-width 一起锁死。
 *
 * 注意：本文件里的 CSS 是模板字符串，CSS 注释内绝不能再出现反引号
 * （会提前结束字符串，历史事故：整页 import failed）。scripts/check.mjs 已加 lint 拦它。
 */
.sid-toolbar .sid-select { width: 108px; min-width: 0; max-width: 108px; }
/* 搜索范围下拉：选项短（全部 / ID / 名称），再窄一点给搜索框腾地方 */
.sid-toolbar .sid-select-narrow { width: 84px; min-width: 0; max-width: 84px; }
.sid-count { flex: none; margin-left: auto; color: var(--dsw-alias-label-secondary, #6b6b6b); font-size: 12px; white-space: nowrap; }

/* ── 列表 ─────────────────────────────────────────────────────── */
.sid-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 列表是唯一吸收收缩的元素：面板高度固定，多出来的空间归列表并让它自己滚动 */
  flex: 1 1 auto;
  min-height: 80px;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}
.sid-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.06));
  transition: background-color .12s, border-color .12s;
  /* 长列表的关键：视口外的行跳过渲染与布局 */
  content-visibility: auto;
  contain-intrinsic-size: auto 76px;
}
/* 行本体（除文字区）可点跳转：空白处 cursor 是 pointer，只有真正有字的节点是 text */
.sid-row[data-clickable="true"] { cursor: pointer; }
.sid-row[data-clickable="true"]:hover { border-color: color-mix(in srgb, var(--sid-cyan) 45%, transparent); }
.sid-row[data-active="true"] {
  /* 当前会话：常驻蓝色左边框（列表里始终有一点颜色提示） */
  border-color: var(--sid-blue);
  box-shadow: inset 3px 0 0 0 var(--sid-blue);
}
.sid-row[data-selected="true"] {
  border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
/* 子代理行：左侧一条青线，提示它不是普通会话 */
.sid-row[data-subagent="true"] { border-left: 3px solid color-mix(in srgb, var(--sid-cyan) 55%, transparent); }

/*
 * 勾选列：整列撑满行高（align-self: stretch），点击一律吞掉不冒泡。
 * 上一版是 24px 的小方块，行比它高，勾选框上下那条仍属于行本体——
 * 想点勾选、点偏一点就跳到别的会话。现在整列都归勾选列，点空白既不跳转也不勾选。
 */
.sid-row-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  flex: none;
  width: 24px;
  padding: 0;
  cursor: default;
}
.sid-row-check input {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--sid-blue);
}

/* 文字区：按内容占宽，**不设上限**——左列一直铺到右边按钮为止（用户要求不留空白） */
.sid-row-info { display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto; min-width: 0; }
.sid-row-line { display: flex; align-items: center; gap: 6px; min-width: 0; }
.sid-row-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 500;
  cursor: text;
}
.sid-row-title[data-active="true"] { color: var(--sid-blue); }
/* 会话 ID：**永远单行**，超出用省略号（完整 ID 用行内「ID」键复制） */
.sid-row-id {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-wrap: normal;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-family: var(--dsw-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 12px;
  line-height: 18px;
  user-select: text;
  cursor: text;
}
/* 更新时间：独立一行，跟在会话 ID 下面 */
/*
 * 注意 align-self: flex-start —— 这两行是 .sid-row-info（纵向 flex）的直接子项，
 * 默认 stretch 会把它们撑满整列宽度：文字只占前一小段，右边那一大片仍属于这个 span
 * （于是显示 I 型光标、且点它被当作"文字区"）。改成按内容宽度收缩后，右侧空白才
 * 真正露出来，归行本体（手型光标、可点跳转）。
 *
 * ⚠️ 本文件里的 CSS 是一个模板字符串：**CSS 注释内绝不能再出现反引号**，
 * 否则会提前结束模板字符串，后面的 CSS 会被当成 JS 表达式求值（历史上因此
 * 出现过 "row is not defined" 这种整页 import 失败）。scripts/check.mjs 会拦。
 */
.sid-row-time {
  align-self: flex-start;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  font-size: 11px;
  line-height: 16px;
  opacity: .85;
  cursor: text;
}

.sid-badge {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
.sid-badge-current { background: var(--sid-blue); color: var(--sid-on-brand); }
.sid-badge-archived {
  background: color-mix(in srgb, var(--sid-orange) 14%, transparent);
  color: var(--sid-orange);
  border: 1px solid color-mix(in srgb, var(--sid-orange) 40%, transparent);
}
.sid-badge-hidden {
  background: color-mix(in srgb, var(--sid-neutral) 22%, transparent);
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  border: 1px solid color-mix(in srgb, var(--sid-neutral) 60%, transparent);
}
.sid-badge-subagent {
  background: color-mix(in srgb, var(--sid-cyan) 14%, transparent);
  color: var(--sid-cyan);
  border: 1px solid color-mix(in srgb, var(--sid-cyan) 45%, transparent);
}

.sid-row-actions { display: inline-flex; align-items: center; gap: 6px; flex: none; }

/* ── 行内动作按钮：小尺寸、同排同高；归档/取消归档等长 ──────────── */
.sid-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  flex: none;
  height: var(--sid-h-row);
  padding: 0 8px;
  border: 1px solid var(--sid-neutral);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
  transition: background-color .12s, color .12s, border-color .12s;
}
/* 归档 / 取消归档：各按自己的文字宽度，不强行等宽（2 字的「归档」就该比 4 字的窄） */
.sid-action:disabled { opacity: .55; cursor: not-allowed; }

.sid-action[data-tone="copy"]:hover {
  color: var(--sid-blue); border-color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}
.sid-action[data-tone="archive"]:hover {
  color: var(--sid-orange); border-color: var(--sid-orange);
  background: color-mix(in srgb, var(--sid-orange) 10%, transparent);
}
.sid-action[data-tone="unarchive"]:hover {
  color: var(--sid-green); border-color: var(--sid-green);
  background: color-mix(in srgb, var(--sid-green) 10%, transparent);
}
.sid-action[data-tone="danger"]:hover:not(:disabled),
.sid-action[data-tone="danger"]:focus-visible {
  color: var(--sid-red); border-color: var(--sid-red);
  background: color-mix(in srgb, var(--sid-red) 10%, transparent);
}
.sid-action[data-tone="locate"]:hover {
  color: var(--sid-cyan); border-color: var(--sid-cyan);
  background: color-mix(in srgb, var(--sid-cyan) 10%, transparent);
}
.sid-action[data-tone="neutral"]:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
/* 当标签用得（设置里的复选开关）：选中态上色 */
.sid-action[data-on="true"] {
  border-color: var(--sid-blue);
  color: var(--sid-blue);
  background: color-mix(in srgb, var(--sid-blue) 10%, transparent);
}

.sid-action[data-copied="true"] {
  border-color: var(--sid-green);
  color: var(--sid-green);
  background: color-mix(in srgb, var(--sid-green) 10%, transparent);
}
.sid-action[data-failed="true"] {
  border-color: var(--sid-red);
  color: var(--sid-red);
  background: color-mix(in srgb, var(--sid-red) 10%, transparent);
}
.sid-action[data-done="true"] {
  border-color: var(--sid-green);
  color: var(--sid-green);
  background: color-mix(in srgb, var(--sid-green) 10%, transparent);
}

.sid-confirm {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  padding: 2px 4px 2px 8px;
  border: 1px solid var(--sid-red);
  border-radius: 9px;
  background: color-mix(in srgb, var(--sid-red) 8%, transparent);
  font-size: 12px;
  line-height: 18px;
  color: var(--sid-red);
  white-space: nowrap;
}

.sid-empty { padding: 32px 0; color: var(--dsw-alias-label-secondary, #6b6b6b); text-align: center; }
.sid-more {
  align-self: center;
  margin: 8px 0 2px;
  padding: 8px 16px;
  border: 1px dashed var(--sid-neutral);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b6b6b);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}
.sid-more:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); color: var(--sid-blue); border-color: var(--sid-blue); }
.sid-error {
  padding: 6px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sid-red) 12%, transparent);
  color: var(--sid-red);
  font-size: 12px;
}
.sid-hint {
  padding: 5px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sid-cyan) 12%, transparent);
  color: var(--sid-cyan);
  font-size: 12px;
}
.sid-row-notice { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 回收站视图复用会话行的 .sid-row 结构，不另立样式。 */
`

/**
 * 注入样式。
 *
 * ⚠️ 必须是「**先删旧、再插新**」，不能"已存在就复用"：插件热重载时旧的
 * `<style>` 元素还留在 `<head>` 里，复用等于让新样式永远不生效（改了半天 CSS
 * 页面纹丝不动，就是这个原因）。卸载时只删自己插的那个。
 * @returns 卸载函数。
 */
export function installStyles(): () => void {
  for (const stale of Array.from(document.querySelectorAll(`style[data-plugin="${SESSION_ID_PLUGIN_ATTR}"]`))) {
    stale.remove()
  }
  const style = document.createElement('style')
  style.dataset.plugin = SESSION_ID_PLUGIN_ATTR
  style.dataset.rev = '1.8.1'
  style.textContent = CSS
  document.head.appendChild(style)
  return () => { style.remove() }
}

