/**
 * dsh-session-id —— client 半边（插件主体）。
 *
 * 干这些事：
 *   ① 往官方侧边栏底部的 `sidebar.footer.action` 列表席位里注册入口；
 *   ② 注册本插件的双语词条命名空间；
 *   ③ 组装面板需要的数据与动作：会话只读视图、归档集合、跳转、归档/取消归档、
 *      删除、回收站（列出/恢复/彻底删除）；
 *   ④ 面板设置的读写（localStorage 持久化）。
 *
 * 服务依赖只用 cordis 的 `inject` 声明必需的三个（slots/locale/sessions）；
 * `workspaces` 与 `uiWorkspace` 是**可选**获取——没有它们时归档筛选、跳转、
 * 归档动作、回收站按钮自动隐藏，而不是让整个插件 pending。
 */
import * as React from 'react'
import * as panelModule from './panel.tsx'
import {
  currentSessionId,
  DEFAULT_SETTINGS,
  SessionIdPanel,
  type ActionResult,
  type ArchivedReadSource,
  type PanelActions,
  type PanelSettings,
  type PanelView,
  type SessionListReadSource,
  type SessionListState,
  type SessionSummary,
  type TrashItem,
  type WorkspacesReadSource,
} from './panel.tsx'
import { SessionIdIcon } from './icons.tsx'
import { en, SESSION_ID_NS, zh } from './locales.ts'
import { installStyles, SESSION_ID_PART, SESSION_ID_PLUGIN_ATTR } from './styles.ts'
import { report } from './report.ts'

/** 插件标识（与 package.json 同名）。 */
export const name = 'dsh-session-id'

/** 必需的客户端服务：席位注册、词条、会话列表只读视图。 */
export const inject = ['slots', 'locale', 'sessions']

/** 席位在列表槽里的唯一 id（列表槽要求每个占位者带 id）。 */
const ENTRY_ID = 'session-id'

/** 自检用的版本标记。 */
const VERSION = '1.8.1'

/** 每次构建递增：页面上的上报带这个数字，便于判断「跑的是哪一版」。 */
const BUILD = 28

/** 从 DOM 读当前生效的样式版本（用于确认热重载后样式真的换了）。 */
function styleRev(): string {
  try {
    return document.querySelector(`style[data-plugin="${SESSION_ID_PLUGIN_ATTR}"]`)?.getAttribute('data-rev') ?? '(none)'
  } catch {
    return '(err)'
  }
}

/**
 * 量一遍批量选择条：每个按钮的文字、宽度、距左距离（验证「清空回收站」确实钉在最右端）。
 * @returns 批量条宽度、右端按钮文字与每个按钮的位置。
 */
function batchPeek(): Record<string, unknown> {
  try {
    const batch = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.batch}"]`) as HTMLElement | null
    if (batch === null) return { missing: true }
    const box = batch.getBoundingClientRect()
    const buttons = (Array.from(batch.querySelectorAll('button')) as HTMLElement[]).map((node) => {
      const rect = node.getBoundingClientRect()
      return {
        text: (node.textContent ?? '').trim().slice(0, 16),
        w: Math.round(rect.width),
        right: Math.round(box.right - rect.right),
        disabled: node.disabled,
      }
    })
    return {
      width: Math.round(box.width),
      count: buttons.length,
      buttons,
      tailText: buttons.length === 0 ? '' : buttons[buttons.length - 1].text,
    }
  } catch (error) {
    return { error: String((error as Error)?.message ?? error) }
  }
}

/**
 * 外观自检：读「当前」徽章的实际前景/背景色、勾选列是否撑满行高、当前主题是否深色。
 *
 * 用途：浅色/深色各探一次，从终端确认配色是「随主题」而不是写死的白字——
 * 深色主题下 brand-primary 是近白色，写死 color:#fff 会白底白字（肉眼才看得出，日志看不出来）。
 * @returns 可安全 JSON 化的外观快照。
 */
function probeLook(): Record<string, unknown> {
  try {
    const panel = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.panel}"]`)
    const badge = document.querySelector('.sid-badge-current')
    const rows = Array.from(document.querySelectorAll('.sid-list .sid-row')) as HTMLElement[]
    const row = rows.find((node) => node.getBoundingClientRect().height > 40) ?? rows[0]
    const check = row?.querySelector('.sid-row-check') ?? null
    const paintOf = (node: Element | null): Record<string, string> | undefined => (node === null
      ? undefined
      : {
        color: getComputedStyle(node).color,
        background: getComputedStyle(node).backgroundColor,
      })
    return {
      dark: document.body.hasAttribute('data-ds-dark-theme'),
      panelMounted: panel !== null && panel !== undefined,
      badge: paintOf(badge),
      rows: rows.slice(0, 3).map((node) => ({
        h: Math.round(node.getBoundingClientRect().height),
        w: Math.round(node.getBoundingClientRect().width),
        kids: node.childElementCount,
      })),
      check: row === undefined || check === null
        ? undefined
        : {
          checkHeight: Math.round(check.getBoundingClientRect().height),
          rowHeight: Math.round(row.getBoundingClientRect().height),
          alignSelf: getComputedStyle(check).alignSelf,
          display: getComputedStyle(check).display,
        },
      tokens: panel === null || panel === undefined
        ? undefined
        : {
          blue: getComputedStyle(panel).getPropertyValue('--sid-blue').trim(),
          onBrand: getComputedStyle(panel).getPropertyValue('--sid-on-brand').trim(),
        },
      archivedClickable: document.querySelectorAll('.sid-row[data-clickable="true"] .sid-badge-archived').length,
      batch: batchPeek(),
    }
  } catch (error) {
    return { error: String((error as Error)?.message ?? error) }
  }
}

/**
 * 回收站视图探针：读列表里行的结构（勾选列、右侧动作按钮、文本），以及批量条排布。
 * @returns 可安全 JSON 化的结构快照。
 */
function probeTrash(): Record<string, unknown> {
  try {
    const items = Array.from(document.querySelectorAll('.sid-list .sid-row')) as HTMLElement[]
    const first = items[0]
    return {
      items: items.length,
      first: first === undefined
        ? undefined
        : {
          h: Math.round(first.getBoundingClientRect().height),
          kids: first.childElementCount,
          hasCheck: first.querySelector('.sid-row-check') !== null,
          actions: (Array.from(first.querySelectorAll('.sid-row-actions button')) as HTMLElement[])
            .map((node) => (node.textContent ?? '').trim()),
          text: (first.textContent ?? '').trim().slice(0, 80),
        },
      look: probeLook(),
    }
  } catch (error) {
    return { error: String((error as Error)?.message ?? error) }
  }
}

/**
 * 行内命中探针（防回归）：在某一行的几个坐标上采样 `elementFromPoint`，
 * 回报命中的元素类名与光标类型。
 *
 * 用途：从终端就能验证「行右侧的空白确实可点（cursor: pointer）」，不必靠肉眼；
 * 面板没打开时返回 `{ rows: 0 }`。
 * @returns 可安全 JSON 化的探针结果。
 */
function probeRowHit(): Record<string, unknown> {
  try {
    const rows = Array.from(document.querySelectorAll(`[data-dsh-part="${SESSION_ID_PART.row}"]`)) as HTMLElement[]
    if (rows.length === 0) return { rows: 0, note: '面板未打开或没有渲染出行' }
    const row = rows.length > 1 ? (rows[1] as HTMLElement) : (rows[0] as HTMLElement)
    const rect = row.getBoundingClientRect()
    const samples: Record<string, unknown>[] = []
    for (const fy of [0.25, 0.5, 0.75]) {
      for (const fx of [0.02, 0.5, 0.72, 0.85, 0.93]) {
        const node = document.elementFromPoint(rect.left + rect.width * fx, rect.top + rect.height * fy) as HTMLElement | null
        samples.push({
          at: `${fx}/${fy}`,
          cls: typeof node?.className === 'string' ? node.className : '',
          part: node?.getAttribute?.('data-dsh-part') ?? '',
          cursor: node === null ? '' : getComputedStyle(node).cursor,
        })
      }
    }
    return { rows: rows.length, rowWidth: Math.round(rect.width), samples, toolbar: measureToolbar(), look: probeLook() }
  } catch (error) {
    return { error: String((error as Error)?.message ?? error) }
  }
}

/**
 * 量一遍工具栏里每个下拉/控件的实际宽度（防"某个下拉把整行撑歪"这类回归）。
 * @returns 每个控件标签与宽度、以及工具栏自身宽度与是否换行。
 */
function measureToolbar(): Record<string, unknown> {
  try {
    const toolbar = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.toolbar}"]`)
    if (toolbar === null || toolbar === undefined) return { missing: true }
    const box = toolbar.getBoundingClientRect()
    const items: Record<string, unknown>[] = []
    for (const node of Array.from(toolbar.children) as HTMLElement[]) {
      const rect = node.getBoundingClientRect()
      items.push({
        tag: node.tagName.toLowerCase(),
        cls: typeof node.className === 'string' ? node.className : '',
        w: Math.round(rect.width),
        text: (node.textContent ?? '').trim().slice(0, 12),
      })
    }
    const heights = new Set(items.map((item) => Math.round((item as { w: number }).w)))
    // 批量条与工具栏的"同高同字号"是用户明确要求的外观约束，直接量出来，别靠肉眼。
    const batch = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.batch}"]`) as HTMLElement | null
    const batchButton = batch === null ? null : (batch.querySelector('.sid-action') as HTMLElement | null)
    const anySelect = toolbar.querySelector('select')
    const firstAction = toolbar.querySelector('.sid-action')
    const fontOf = (node: Element | null): string => (node === null ? '' : getComputedStyle(node).fontSize)
    // 行内动作按钮宽度：用于确认「归档」按 2 字宽度、不比 4 字的「取消归档」宽。
    const rowActions = document.querySelector(`[data-dsh-part="${SESSION_ID_PART.row}"] .sid-row-actions`)
    const rowButtons = rowActions === null
      ? []
      : Array.from(rowActions.querySelectorAll('.sid-action')).map((node) => ({
        text: (node.textContent ?? '').trim(),
        w: Math.round(node.getBoundingClientRect().width),
      }))
    return {
      toolbarWidth: Math.round(box.width),
      toolbarHeight: Math.round(box.height),
      items,
      selectWidths: items.filter((item) => item.tag === 'select').map((item) => item.w),
      itemCount: heights.size,
      rowButtons,
      heights: {
        toolbar: Math.round(box.height),
        toolbarSelect: anySelect === null ? 0 : Math.round(anySelect.getBoundingClientRect().height),
        toolbarAction: firstAction === null ? 0 : Math.round(firstAction.getBoundingClientRect().height),
        batch: batch === null ? 0 : Math.round(batch.getBoundingClientRect().height),
        batchAction: batchButton === null ? 0 : Math.round(batchButton.getBoundingClientRect().height),
      },
      fonts: {
        toolbarSelect: fontOf(anySelect),
        toolbarAction: fontOf(firstAction),
        batchAction: fontOf(batchButton),
      },
    }
  } catch (error) {
    return { error: String((error as Error)?.message ?? error) }
  }
}

/** 等一段时间（T1/T5 的竞态复查与探针采样用）。 */
function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => { window.setTimeout(resolve, ms) })
}

/** 面板里某个部件（探针只认 `data-dsh-part`，不看 panel 内部实现）。 */
function partOf<T extends Element = HTMLElement>(part: string): T | null {
  try {
    return document.querySelector(`[data-dsh-part="${part}"]`) as T | null
  } catch {
    return null
  }
}

/** 面板列表容器。 */
function locateListNode(): HTMLElement | null {
  return partOf<HTMLElement>(SESSION_ID_PART.list)
}

/** 列表里当前渲染出的会话行。 */
function locateRows(node: HTMLElement): HTMLElement[] {
  try {
    return Array.from(node.querySelectorAll(`[data-dsh-part="${SESSION_ID_PART.row}"]`)) as HTMLElement[]
  } catch {
    return []
  }
}

/** 行上显示的会话 id（`.sid-row-id` 的文本）。 */
function locateRowId(row: Element): string {
  return (row.querySelector('.sid-row-id')?.textContent ?? '').trim()
}

/** 行上显示的标题（`.sid-row-title` 的文本）。 */
function locateRowTitle(row: Element): string {
  return (row.querySelector('.sid-row-title')?.textContent ?? '').trim()
}

/** 行是否完整落在列表可视区内（`rowInsideBox` 未导出时的兜底量法）。 */
function locateRowVisible(box: Element, row: Element): boolean {
  const list = box.getBoundingClientRect()
  const rect = row.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && rect.top >= list.top - 1 && rect.bottom <= list.bottom + 1
}

/** 元素几何快照（面板 `rowInsideBox` 要的形态）。 */
function rectMetricsOf(node: Element): { top: number, bottom: number, left: number, width: number, height: number } {
  const rect = node.getBoundingClientRect()
  return { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height }
}

/** 同一行是否可见：优先用面板导出的同源量法，没导出/抛错就本地量。 */
function rowVisibleOf(box: Element, row: Element): boolean {
  try {
    const fn = (panelModule as Record<string, unknown>).rowInsideBox
    if (typeof fn === 'function') {
      const value = (fn as (a: unknown, b: unknown) => unknown)(rectMetricsOf(box), rectMetricsOf(row))
      if (typeof value === 'boolean') return value
    }
  } catch { /* 面板实现未就位 → 用本地量法 */ }
  return locateRowVisible(box, row)
}

/** 行的中心与列表中心的偏移（0 = 正中）。 */
function centerOffsetOf(box: Element, row: Element): number {
  try {
    const list = box.getBoundingClientRect()
    const rect = row.getBoundingClientRect()
    return Math.round((rect.top + rect.height / 2) - (list.top + list.height / 2))
  } catch {
    return 0
  }
}

/** 系统是否要求减少动画。 */
function prefersReducedMotion(): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches === true
  } catch {
    return false
  }
}

/** 面板的定位滚动 behavior（`locateScrollBehavior` 未导出时按 reduced-motion 推）。 */
function locateBehaviorExpected(): 'auto' | 'smooth' {
  try {
    const fn = (panelModule as Record<string, unknown>).locateScrollBehavior
    if (typeof fn === 'function') {
      const value = (fn as () => unknown)()
      if (value === 'auto' || value === 'smooth') return value
    }
  } catch { /* 面板实现未就位 → 本地推 */ }
  return prefersReducedMotion() ? 'auto' : 'smooth'
}

/** 面板最近一次定位的实测结果（`lastLocateOutcome` 未导出时返回 undefined）。 */
function locateOutcomeOf(): Record<string, unknown> | undefined {
  try {
    const fn = (panelModule as Record<string, unknown>).lastLocateOutcome
    if (typeof fn !== 'function') return undefined
    const value = (fn as () => unknown)()
    return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}

/** 定位跑了几帧（用于判「+2500ms 时还在动」）。 */
function frameCountOf(outcome: Record<string, unknown> | undefined): number {
  const frames = outcome?.frames
  return typeof frames === 'number' ? frames : -1
}

/** 列表当前 scrollTop（列表不在时为 -1）。 */
function listScrollTop(): number {
  const box = locateListNode()
  return box === null ? -1 : Math.round(box.scrollTop)
}

/** 用原生 setter 改 `<select>` 的值并派发真实 change（React 受控组件才会认）。 */
function setSelectValue(select: HTMLSelectElement | null, value: string): void {
  if (select === null) return
  try {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
    if (typeof setter === 'function') setter.call(select, value)
    else select.value = value
    select.dispatchEvent(new Event('change', { bubbles: true }))
  } catch { /* 设置失败就当没动过 */ }
}

/** 用原生 setter 改 `<input>` 的值并派发真实 input（React 受控组件才会认）。 */
function setInputValue(input: HTMLInputElement | null, value: string): void {
  if (input === null) return
  try {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    if (typeof setter === 'function') setter.call(input, value)
    else input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  } catch { /* 同上 */ }
}

/** 面板批量条尾部的提示文字（定位失败等提示落在那里）。 */
function panelNoteText(): string {
  try {
    const batch = partOf(SESSION_ID_PART.batch)
    return (batch?.querySelector('.sid-batch-count')?.textContent ?? '').trim()
  } catch {
    return ''
  }
}

/** 设置持久化键。 */
const SETTINGS_KEY = 'dsh-session-id.settings.v1'
/** 隐藏集合持久化键。 */
const HIDDEN_KEY = 'dsh-session-id.hidden.v1'

/**
 * 本次页面会话内「已被删除」的会话 id。
 *
 * 删的是磁盘目录（官方没有删除会话的 API），宿主列表状态未必立刻消失；
 * 这里本地压一层，保证删完就从面板里消失。只活在内存里，刷新页面即重置。
 */
const deletedIds = new Set<string>()

/** 隐藏集合的读接口（供面板订阅）。 */
export interface HiddenStore {
  getSnapshot(): ReadonlySet<string>
  subscribe(listener: () => void): () => void
  toggle(sessionId: string): void
  setMany(sessionIds: readonly string[], hidden: boolean): void
  clear(): void
}

/**
 * 建隐藏集合 store：**localStorage 持久化** + 订阅通知。
 *
 * 隐藏只是"不显示"（不动归档、不动磁盘），所以状态放浏览器本地即可；
 * `getSnapshot` 在内容不变时返回同一引用，满足 `useSyncExternalStore` 的要求。
 * @returns 隐藏集合 store。
 */
function createHiddenStore(): HiddenStore {
  const read = (): ReadonlySet<string> => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_KEY)
      if (raw === null || raw === '') return new Set<string>()
      const parsed = JSON.parse(raw)
      return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [])
    } catch {
      return new Set<string>()
    }
  }
  let cache: ReadonlySet<string> = read()
  const listeners = new Set<() => void>()
  const commit = (next: Set<string>): void => {
    cache = next
    try {
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]))
    } catch { /* 存不下就只在本次页面生效 */ }
    for (const listener of listeners) listener()
  }
  return {
    getSnapshot: () => cache,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    toggle: (sessionId) => {
      const next = new Set(cache)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      commit(next)
    },
    setMany: (sessionIds, hidden) => {
      const next = new Set(cache)
      for (const id of sessionIds) {
        if (hidden) next.add(id)
        else next.delete(id)
      }
      commit(next)
    },
    clear: () => { commit(new Set<string>()) },
  }
}

/** 读取持久化的面板设置（容错：坏数据回退默认值）。 */
function loadSettings(): PanelSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (raw === null || raw === '') return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<PanelSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** 保存面板设置（失败静默：隐私模式等场景不该影响功能）。 */
function saveSettings(settings: PanelSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch { /* 存不下就算了 */ }
}

/**
 * 把**持久化**的面板设置改回探针进入时的值。
 *
 * 探针点行时面板可能被 `closeOnOpen` 关掉，那时 DOM 已经没了、`setSelectValue` 无处可还，
 * 只能直接改 localStorage（与面板 `onSettingsChange → saveSettings` 是同一个键）。
 * @param expected 要恢复的字段（未给的字段不动）。
 * @returns 恢复后读回的三个筛选字段。
 */
function restorePersistedSettings(
  expected: Partial<Pick<PanelSettings, 'lastFilter' | 'subagentFilter' | 'workspaceFilter'>>,
): { lastFilter?: PanelSettings['lastFilter'], subagentFilter?: PanelSettings['subagentFilter'], workspaceFilter?: string } {
  try {
    const current = loadSettings()
    const next = { ...current }
    let dirty = false
    if (expected.lastFilter !== undefined && current.lastFilter !== expected.lastFilter) {
      next.lastFilter = expected.lastFilter
      dirty = true
    }
    if (expected.subagentFilter !== undefined && current.subagentFilter !== expected.subagentFilter) {
      next.subagentFilter = expected.subagentFilter
      dirty = true
    }
    if (expected.workspaceFilter !== undefined && current.workspaceFilter !== expected.workspaceFilter) {
      next.workspaceFilter = expected.workspaceFilter
      dirty = true
    }
    if (dirty) saveSettings(next)
    const after = loadSettings()
    return {
      lastFilter: after.lastFilter,
      subagentFilter: after.subagentFilter,
      workspaceFilter: after.workspaceFilter,
    }
  } catch {
    return {}
  }
}

/** 统一的 JSON 请求助手。 */
async function postJson(path: string, body: unknown): Promise<{ status: number, reply?: any }> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const reply = await response.json().catch(() => undefined)
  return { status: response.status, reply }
}

/** 入口组件的属性（由席位注入 wide 与注入器的返回值）。 */
interface SessionIdEntryProps {
  wide?: boolean | undefined
  list: SessionListReadSource
  archived?: ArchivedReadSource | undefined
  workspaces?: WorkspacesReadSource | undefined
  hidden?: HiddenStore | undefined
  actions?: PanelActions | undefined
  t: (key: string, vars?: Record<string, unknown>) => string
}

/**
 * 已挂载入口的「打开面板」句柄。
 *
 * 终端侧的自检指令（GET /api/session-id/selftest）靠它把面板真的打开一次，
 * 从而让「面板能渲染、能列出会话」也成为可被外部观察的事实。
 * 可选参数指定落到的视图，供「回收站视图」这类只在特定视图存在的结构做自检。
 */
let openPanelFromHost: ((view?: PanelView) => void) | undefined

/**
 * 已挂载入口的「按磁盘重读设置」句柄。
 *
 * 探针改过筛选并把面板关掉（`closeOnOpen`）时，entry 的内存 `settings` 还停在探针设的值；
 * 只把 localStorage 改回去不够——用户之后任意一次 `patchSettings` 都会用 `{...previous}`
 * 把旧值写回，把探针的还原冲掉。所以探针末尾调这个钩子把内存 state 拉回磁盘值。
 */
let syncSettingsFromStorage: (() => void) | undefined

/** 侧边栏底部入口：一个触发按钮 + 打开时的面板。 */
function SessionIdEntry({ wide, list, archived, workspaces, hidden, actions, t }: SessionIdEntryProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const [openView, setOpenView] = React.useState<PanelView>('list')
  /**
   * 面板的「第几次打开」。key 变化 = 重新挂载，`initialView` 才会重新生效；
   * 否则面板已开着时切视图（自检指令就是这种情况）不会生效。
   */
  const [openSeq, setOpenSeq] = React.useState(0)
  const [settings, setSettings] = React.useState<PanelSettings>(() => loadSettings())

  const patchSettings = React.useCallback((patch: Partial<PanelSettings>): void => {
    setSettings((previous) => {
      const next = { ...previous, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  React.useEffect(() => {
    // 句柄按引用归属：插件热重载时新旧实例会短暂并存，旧实例的清理只能撤销
    // 自己设的那个句柄，否则会顺手把新实例的句柄清空（终端自检就永远打不开面板）。
    const handle = (view?: PanelView): void => {
      setOpenView(view ?? 'list')
      setOpenSeq((seq) => seq + 1)
      setOpen(true)
    }
    const sync = (): void => { setSettings(loadSettings()) }
    openPanelFromHost = handle
    syncSettingsFromStorage = sync
    return () => {
      if (openPanelFromHost === handle) openPanelFromHost = undefined
      if (syncSettingsFromStorage === sync) syncSettingsFromStorage = undefined
    }
  }, [])

  const handleOpen = (): void => {
    setOpenView('list')
    setOpen(true)
    report('panel-opened')
  }

  return (
    <React.Fragment>
      <button
        type="button"
        className="sid-trigger"
        data-dsh-plugin={SESSION_ID_PLUGIN_ATTR}
        data-dsh-part={SESSION_ID_PART.entry}
        data-wide={wide === true ? 'wide' : 'rail'}
        aria-label={String(t('entry.label'))}
        title={String(t('entry.label'))}
        onClick={handleOpen}
      >
        <SessionIdIcon />
        <span className="sid-trigger-label">{t('entry.label')}</span>
      </button>
      {open
        ? (
          <SessionIdPanel
            key={openSeq}
            list={list}
            archived={archived}
            workspaces={workspaces}
            hidden={hidden}
            actions={actions}
            initialView={openView}
            settings={settings}
            onSettingsChange={patchSettings}
            hiddenIds={deletedIds}
            t={t}
            onClose={() => { setOpen(false) }}
          />
        )
        : null}
    </React.Fragment>
  )
}

/** 当前页面里入口是否真的渲染出来了。 */
function entryMounted(): boolean {
  try {
    return document.querySelector(`[data-dsh-plugin="${SESSION_ID_PLUGIN_ATTR}"][data-dsh-part="${SESSION_ID_PART.entry}"]`) !== null
  } catch {
    return false
  }
}

/**
 * 路径的最后一段（官方常把会话的 cwd 目录名当成 `displayTitle`）。
 * @param path 目录路径。
 * @returns 最后一段；读不出返回空串。
 */
function basenameOf(path: string | undefined): string {
  if (typeof path !== 'string' || path === '') return ''
  const parts = path.split(/[\\/]+/).filter((part) => part !== '')
  return parts.length === 0 ? '' : parts[parts.length - 1]
}

/**
 * 从会话快照里建一张 `子会话 id → 可读名` 的表。
 *
 * 来源：`snapshot.projectionsBySession[parentId].values.subagentCatalog[]`（元素含 `id` 与 `label`）；
 * 父目录没有时退回子会话自身的 descriptor：`projectionsBySession[childId].values.subagent.label`。
 * @param raw 官方 sessions 快照。
 * @returns id→label 表（拿不到就是空表）。
 */
function subagentLabelsOf(raw: any): Map<string, string> {
  const labels = new Map<string, string>()
  const projections = raw?.projectionsBySession
  if (projections === null || typeof projections !== 'object') return labels
  for (const key of Object.keys(projections as Record<string, unknown>)) {
    const values = (projections as any)[key]?.values
    const catalog = values?.subagentCatalog
    if (Array.isArray(catalog)) {
      for (const entry of catalog) {
        const label = typeof entry?.label === 'string' ? entry.label.trim() : ''
        if (typeof entry?.id === 'string' && label !== '' && !labels.has(entry.id)) labels.set(entry.id, label)
      }
    }
    const own = typeof values?.subagent?.label === 'string' ? values.subagent.label.trim() : ''
    if (own !== '' && !labels.has(key)) labels.set(key, own)
  }
  return labels
}

/** 端点标题（host 从投影缓存读出的 `id → 标题`）。 */
const endpointTitles = new Map<string, string>()

/** 端点标题的请求账本：id → 发起时间（失败也算，60s 内不重复要）。 */
const titleAskedAt = new Map<string, number>()

/** 正在飞行中的 id（同批/跨批去重）。 */
const titleInFlight = new Set<string>()

/** 待发批次（同一 tick 内多次读快照只发一次请求）。 */
const titleQueue = new Set<string>()

/** 队列的 flush 定时器（0 = 没排）。 */
let titleFlushTimer = 0

/** 标题版本号：合并到新标题就 +1，驱动包装源通知订阅者。 */
let titleVersion = 0

/** 包装源自建的订阅者（在官方 subscribe 之外再挂一层，标题变化也能触发重渲染）。 */
const titleListeners = new Set<() => void>()

/** 端点标题的请求有效期（与服务端 TTL 对齐）。 */
const TITLE_ASK_TTL = 60_000

/** 单批上限（与 host 路由的 200 上限留足余量）。 */
const TITLE_BATCH = 60

/** 通知自建监听者（标题变化）。 */
function notifyTitles(): void {
  for (const listener of [...titleListeners]) {
    try { listener() } catch { /* 单个监听者出错不影响别人 */ }
  }
}

/** 把队列里的 id 分批发给 host（每批 ≤60，失败静默）。 */
async function flushTitleQueue(): Promise<void> {
  titleFlushTimer = 0
  const batch: string[] = []
  for (const id of titleQueue) {
    if (batch.length >= TITLE_BATCH) break
    titleQueue.delete(id)
    batch.push(id)
  }
  if (batch.length === 0) return
  const now = Date.now()
  for (const id of batch) {
    titleInFlight.add(id)
    titleAskedAt.set(id, now)
  }
  try {
    const { status, reply } = await postJson('/api/session-id/titles', { sessionIds: batch })
    const titles = status === 200 && reply?.ok === true ? reply.titles : undefined
    if (titles !== null && typeof titles === 'object') {
      let changed = false
      for (const id of batch) {
        const title = (titles as Record<string, unknown>)[id]
        if (typeof title === 'string' && title !== '' && endpointTitles.get(id) !== title) {
          endpointTitles.set(id, title)
          changed = true
        }
      }
      if (changed) {
        titleVersion += 1
        notifyTitles()
      }
    }
  } catch { /* 失败静默：标题只是锦上添花 */ }
  for (const id of batch) titleInFlight.delete(id)
  if (titleQueue.size > 0) scheduleTitleFlush()
}

/** 排一次 flush（同一 tick 内合并）。 */
function scheduleTitleFlush(): void {
  if (titleFlushTimer !== 0) return
  titleFlushTimer = window.setTimeout(() => { void flushTitleQueue() }, 0)
}

/** 把「还该问」的 id 排进队列（已在飞 / 60s 内问过的不再问）。 */
function requestTitles(ids: readonly string[]): void {
  const now = Date.now()
  for (const id of ids) {
    if (titleInFlight.has(id)) continue
    const askedAt = titleAskedAt.get(id)
    if (askedAt !== undefined && now - askedAt < TITLE_ASK_TTL) continue
    titleQueue.add(id)
  }
  if (titleQueue.size > 0) scheduleTitleFlush()
}

/**
 * 给子代理行补可读名：`subagentCatalog label` > 端点标题（identity.label / title 清洗）> 原值。
 *
 * **无条件覆盖**官方 `displayTitle`：实测官方给子代理的值全是垃圾串（`<system-reminder> You are
 * teammate "veri` / cwd 目录名 / 裸 uuid 三种，40 行样本里只有 2 行可读），没有一种是用户想看的，
 * 所以「官方已有值就保留」这条门槛必须去掉。只对 `origin === 'subagent'` 的行生效，普通会话一行不动。
 * @param raw 官方 sessions 快照。
 * @returns 补过标题的快照（无需改动时返回原对象）。
 */
function fillSubagentTitles(raw: any): SessionListState {
  const state = raw as SessionListState
  const byId = state?.byId
  if (byId === null || typeof byId !== 'object') return state
  const ids: readonly string[] = Array.isArray(state?.ids) ? state.ids : Object.keys(byId)
  let labels: Map<string, string> | undefined
  let filled: Record<string, SessionSummary | undefined> | undefined
  const need: string[] = []
  for (const id of ids) {
    const row = byId[id]
    if (row === undefined || row === null) continue
    if (row.origin !== 'subagent') continue
    if (labels === undefined) labels = subagentLabelsOf(raw)
    const label = labels.get(id)
    if (typeof label === 'string' && label !== '') {
      filled = filled ?? { ...byId }
      filled[id] = { ...row, displayTitle: label }
      continue
    }
    const remote = endpointTitles.get(id)
    if (typeof remote === 'string' && remote !== '') {
      filled = filled ?? { ...byId }
      filled[id] = { ...row, displayTitle: remote }
      continue
    }
    // 还没有标题来源：先保留官方值，同时排一次端点请求（去重与 60s 负缓存都在 requestTitles 里）
    need.push(id)
  }
  if (need.length > 0) requestTitles(need)
  if (filled === undefined) return state
  return { ...state, byId: filled }
}

/**
 * 包装官方会话列表只读源：只做「子代理行补标题」这一层，其余原样透传。
 *
 * `useSyncExternalStore` 要求内容没变就返回**同一引用**，否则无限重渲染。缓存键取三个：
 * 原始快照引用、`projectionsBySession` 引用、标题版本号；三者都没变就直接返回上次结果。
 * @param source 官方只读源。
 * @returns 包装后的只读源。
 */
function decorateListSource(source: SessionListReadSource): SessionListReadSource {
  let cacheRaw: unknown
  let cacheProjections: unknown
  let cacheVersion = -1
  let cache: SessionListState | undefined
  return {
    getSnapshot: (): SessionListState => {
      const raw = source.getSnapshot() as any
      const projections = raw?.projectionsBySession
      if (cache !== undefined && raw === cacheRaw && projections === cacheProjections && titleVersion === cacheVersion) return cache
      cacheRaw = raw
      cacheProjections = projections
      cacheVersion = titleVersion
      cache = fillSubagentTitles(raw)
      return cache
    },
    subscribe: (listener) => {
      const unsubscribe = source.subscribe(listener)
      titleListeners.add(listener)
      return () => {
        titleListeners.delete(listener)
        unsubscribe()
      }
    },
  }
}

/**
 * 把 `ctx.workspaces` 的归档集合包成引用稳定的只读源。
 *
 * `useSyncExternalStore` 要求「没变化就返回同一个引用」，而每次读快照都会新建数组，
 * 所以这里按内容做一次缓存：内容变了才换新的 Set。
 * @param workspaces workspaces 服务（可能不存在）。
 * @returns 归档只读源；服务不可用时返回 undefined。
 */
function archivedSourceOf(workspaces: any): ArchivedReadSource | undefined {
  if (workspaces === undefined || workspaces?.list?.getSnapshot === undefined) return undefined
  let cache: ReadonlySet<string> = new Set<string>()
  let key = ''
  return {
    getSnapshot: () => {
      let ids: readonly string[] = []
      try {
        const snapshot = workspaces.list.getSnapshot()
        ids = Array.isArray(snapshot?.archivedSessionIds) ? snapshot.archivedSessionIds : []
      } catch {
        ids = []
      }
      const nextKey = ids.join(',')
      if (nextKey !== key) {
        key = nextKey
        cache = new Set(ids)
      }
      return cache
    },
    subscribe: (listener) => workspaces.list.subscribe(listener),
  }
}

/**
 * 把 `ctx.workspaces` 的快照透传成只读源（用于按工作区分组）。
 *
 * 官方 `createSnapshotStore` 在内容未变时返回同一引用，直接透传即可满足
 * `useSyncExternalStore` 的"引用稳定"要求。
 * @param workspaces workspaces 服务（可能不存在）。
 * @returns 只读源；服务不可用时返回 undefined。
 */
function workspacesSourceOf(workspaces: any): WorkspacesReadSource | undefined {
  if (workspaces === undefined || workspaces?.list?.getSnapshot === undefined) return undefined
  return {
    getSnapshot: () => workspaces.list.getSnapshot() as ReturnType<WorkspacesReadSource['getSnapshot']>,
    subscribe: (listener) => workspaces.list.subscribe(listener),
  }
}

/** 删除后自动归档失败时那条提示的 DOM id（同一时刻只留一条）。 */
const ARCHIVE_TOAST_ID = 'sid-archive-toast'

/**
 * 在页面底部挂一条 8 秒自动消失的提示条。
 *
 * 为什么不走面板：删除成功后 `closeOnOpen`/用户操作都可能把面板关掉，提示必须不依赖面板存活。
 * 文案按页面语言内联二选一（词条文件归另一个执行者，这里不掺和，避免改同一个文件）。
 * @param message 失败原因（调用方已截断）。
 */
function showArchiveToast(message: string): void {
  try {
    const previous = document.getElementById(ARCHIVE_TOAST_ID)
    if (previous !== null) previous.remove()
    const detail = String(message ?? '').trim().slice(0, 120)
    const zhText = detail === '' ? '已删除，但自动归档失败' : `已删除，但自动归档失败：${detail}`
    const enText = detail === '' ? 'Deleted, but auto-archive failed' : `Deleted, but auto-archive failed: ${detail}`
    const lang = String(document.documentElement?.lang ?? '').toLowerCase()
    const text = lang.startsWith('en') ? enText : (lang.startsWith('zh') ? zhText : `${zhText} / ${enText}`)
    const node = document.createElement('div')
    node.id = ARCHIVE_TOAST_ID
    node.setAttribute('role', 'status')
    node.textContent = text
    node.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;'
      + 'max-width:70vw;padding:8px 14px;border-radius:8px;background:#b3261e;color:#fff;font-size:13px;'
      + 'line-height:1.4;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none'
    document.body.appendChild(node)
    window.setTimeout(() => {
      try { node.remove() } catch { /* 已经没了 */ }
    }, 8000)
  } catch { /* 提示失败不影响删除结果 */ }
}

/**
 * 组装面板动作（按可用能力裁剪）。
 * @param uiWorkspace UI 工作区服务（可能缺失）。
 * @param archived 归档集合只读源（用于清理悬空归档 id）。
 * @returns 动作表。
 */
function actionsOf(uiWorkspace: any, archived?: ArchivedReadSource): PanelActions {
  const actions: PanelActions = {}

  /** 会话彻底消失后，把归档集合里的悬空 id 清掉（官方 API 幂等）。 */
  const forgetArchived = async (sessionId: string): Promise<void> => {
    try {
      if (archived?.getSnapshot().has(sessionId) === true) await uiWorkspace?.unarchiveSession?.(sessionId)
    } catch { /* 清悬空失败不影响删除结果 */ }
  }

  /** 该 id 现在是否在归档集合里（读不到就当不在）。 */
  const archivedPresent = (sessionId: string): boolean => {
    try {
      return archived?.getSnapshot().has(sessionId) === true
    } catch {
      return false
    }
  }

  const openSession = typeof uiWorkspace?.openSession === 'function' ? uiWorkspace.openSession.bind(uiWorkspace) : undefined
  const unarchiveSession = typeof uiWorkspace?.unarchiveSession === 'function'
    ? uiWorkspace.unarchiveSession.bind(uiWorkspace)
    : undefined

  /** 跳转失败：只报一次事件，把原因作为 `ActionResult.message` 交回面板。 */
  const jumpFailed = (sessionId: string, message: string): ActionResult => {
    const text = String(message).slice(0, 160)
    void report('jump-failed', { sessionId, error: text })
    return { ok: false, message: text }
  }

  if (openSession !== undefined) {
    actions.open = async (sessionId: string): Promise<ActionResult> => {
      // 官方 openSession 不检查归档，但快照一变官方 clearArchivedCurrent 就把「主视图=归档会话」
      // 清掉 ⇒ 只 open 表现为打不开/空白。所以归档行必须先解除归档再打开，两步都不能省。
      if (archivedPresent(sessionId)) {
        if (unarchiveSession === undefined) return jumpFailed(sessionId, 'unarchive API 不可用')
        try {
          await unarchiveSession(sessionId)
        } catch (error) {
          return jumpFailed(sessionId, String((error as Error)?.message ?? error))
        }
        await sleep(40)
        // 竞态复查：unarchive 在飞行中若撞上别的归档请求，官方会丢弃这次结果
        // （api-workspace-controller/lib/client.js:150-152 的 requestSeq），本地归档集合仍含该 id，
        // 此时再 open 必被官方 clearArchivedCurrent 踢回空白 —— 所以仍含就不开，如实报失败。
        if (archivedPresent(sessionId)) return jumpFailed(sessionId, 'unarchive 未生效：归档集合仍含该 id（归档请求竞态）')
      }
      try {
        openSession(sessionId)
        return { ok: true }
      } catch (error) {
        return jumpFailed(sessionId, String((error as Error)?.message ?? error))
      }
    }
  }

  if (typeof uiWorkspace?.archiveSession === 'function') {
    // stopActivity: true —— 官方默认会拒绝归档「有活动」的会话，这里显式要求先停活动，
    // 否则用户点归档大概率吃一个 "active session" 错误。
    actions.archive = async (sessionId: string): Promise<ActionResult> => {
      try {
        await uiWorkspace.archiveSession(sessionId, { stopActivity: true })
        return { ok: true }
      } catch (error) {
        return { ok: false, message: String((error as Error)?.message ?? error) }
      }
    }
  }

  if (typeof uiWorkspace?.unarchiveSession === 'function') {
    actions.unarchive = async (sessionId: string): Promise<ActionResult> => {
      try {
        await uiWorkspace.unarchiveSession(sessionId)
        return { ok: true }
      } catch (error) {
        return { ok: false, message: String((error as Error)?.message ?? error) }
      }
    }
  }

  /**
   * 确保某个 id 处于归档态（幂等，且**不早返回**）。
   *
   * 删除流程可能把归档态弄掉（宿主彻底删除时先 unarchive，随后官方推送会无条件覆盖本地集合），
   * 所以即使读起来「已经在归档里」也照样调一次 `archiveSession`：官方对已归档 id 是 no-op，
   * 但宿主的写序因此变成「删除内 unarchive → 之后 archive」，晚到的旧推送冲不掉它。
   * 最终是否成功一律以**读回**归档集合为准；无异常却读回 false 时隔 300ms 复读一次（挡推送竞态）。
   * @param sessionId 目标会话 id。
   * @returns 是否已装上 + 调之前是否本来就在归档里 + 错误名/消息（空串 = 没异常）。
   */
  const ensureArchived = async (sessionId: string): Promise<{ ok: boolean, already: boolean, errorName: string, message: string }> => {
    const already = archivedPresent(sessionId)
    let errorName = ''
    let message = ''
    if (typeof uiWorkspace?.archiveSession === 'function') {
      try {
        await uiWorkspace.archiveSession(sessionId, { stopActivity: true })
      } catch (error) {
        errorName = String((error as Error)?.name ?? '') || 'Error'
        message = String((error as Error)?.message ?? error)
      }
    } else {
      errorName = 'ArchiveUnavailable'
      message = 'archive API 不可用'
    }
    let installed = archivedPresent(sessionId)
    if (!installed && errorName === '') {
      await sleep(300)
      installed = archivedPresent(sessionId)
    }
    return { ok: installed, already, errorName, message }
  }

  actions.remove = async (sessionId: string, purge: boolean): Promise<ActionResult> => {
    try {
      const { status, reply } = await postJson('/api/session-id/delete', { sessionId, purge })
      const ok = status === 200 && reply?.ok === true
      if (!ok) return { ok, message: reply?.error ?? `HTTP ${status}` }
      deletedIds.add(sessionId)
      // 删除后自动归档（用户要求：删完不要在注册表里留着当活条目）。
      // 这一步失败不改写删除结果——删除已经成功，只是归档没跟上，所以单独报事件 + 挂提示条。
      await sleep(60)
      const ensured = await ensureArchived(sessionId)
      if (ensured.ok) {
        void report('post-delete-archived', { sessionId, purge, already: ensured.already, present: true })
      } else {
        void report('post-delete-archive-failed', {
          sessionId,
          purge,
          already: ensured.already,
          present: false,
          errorName: ensured.errorName,
          error: ensured.message.slice(0, 160),
        })
        showArchiveToast(ensured.message)
      }
      return { ok: true, message: reply?.mode }
    } catch (error) {
      return { ok: false, message: String((error as Error)?.message ?? error) }
    }
  }

  actions.paths = async (sessionIds: readonly string[]): Promise<Record<string, string>> => {
    const { status, reply } = await postJson('/api/session-id/paths', { sessionIds })
    if (status !== 200 || reply?.ok !== true) throw new Error(reply?.error ?? `HTTP ${status}`)
    return (reply.paths ?? {}) as Record<string, string>
  }

  actions.listTrash = async (): Promise<TrashItem[]> => {
    const response = await fetch('/api/session-id/trash')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const reply = await response.json() as { ok?: boolean, items?: TrashItem[] }
    return Array.isArray(reply?.items) ? reply.items : []
  }

  actions.purgeTrash = async (names: string[] | 'all'): Promise<ActionResult> => {
    try {
      const { status, reply } = await postJson('/api/session-id/trash/purge', names === 'all' ? { all: true } : { names })
      const ok = status === 200 && reply?.ok === true
      // 回收站里被彻底删掉的那些会话：归档集合里的 id 也要清（否则是悬空项）。
      if (Array.isArray(reply?.removed)) {
        for (const name of reply.removed as string[]) {
          const match = /session-[0-9a-fA-F-]{8,64}/.exec(name)
          if (match !== null) await forgetArchived(match[0])
        }
      }
      return { ok, message: ok ? undefined : (reply?.error ?? `HTTP ${status}`) }
    } catch (error) {
      return { ok: false, message: String((error as Error)?.message ?? error) }
    }
  }

  actions.restoreTrash = async (name: string): Promise<ActionResult> => {
    try {
      const { status, reply } = await postJson('/api/session-id/trash/restore', { name })
      const ok = status === 200 && reply?.ok === true
      return { ok, message: ok ? undefined : (reply?.error ?? `HTTP ${status}`) }
    } catch (error) {
      return { ok: false, message: String((error as Error)?.message ?? error) }
    }
  }

  return actions
}

/**
 * 探针要用的运行时句柄（装配时填；面板没挂上时字段为 undefined）。
 *
 * `list` 是包装后的源（面板实际消费的那个），`rawList` 是官方原样的源
 * （探针要报「包装前的 displayTitle」，否则分不清是官方给的还是我们补的）。
 */
interface ProbeContext {
  list?: SessionListReadSource | undefined
  rawList?: SessionListReadSource | undefined
  archived?: ArchivedReadSource | undefined
  actions?: PanelActions | undefined
  hidden?: HiddenStore | undefined
}

/** 当前页面的探针句柄（只有一个入口实例；热重载时后装的覆盖前者）。 */
const probeCtx: ProbeContext = {}

/** 当前会话 id（主视图 retain 的那个）。 */
function currentIdOf(): string | undefined {
  try {
    const snapshot = probeCtx.rawList?.getSnapshot() as SessionListState | undefined
    return snapshot === undefined ? undefined : currentSessionId(snapshot)
  } catch {
    return undefined
  }
}

/** 归档集合的当前内容（读不到就是空数组）。 */
function archivedIdsNow(): readonly string[] {
  try {
    const set = probeCtx.archived?.getSnapshot()
    return set === undefined ? [] : [...set]
  } catch {
    return []
  }
}

/** 列表里某一行（按行上显示的会话 id 找）。 */
function domRowOf(node: HTMLElement, sessionId: string | undefined): HTMLElement | undefined {
  if (sessionId === undefined) return undefined
  return locateRows(node).find((row) => locateRowId(row) === sessionId)
}

/**
 * 按面板的排序规则算「当前会话在 rows 里的下标」。
 *
 * 用于确认目标确实排在首屏 60 行之外（否则「一次点到位」没有判别力）。
 * 与 panel `sortRows` 同序：空白沉底；`updatedAsc` = updatedAt 升序；`title` = 标题升序。
 * @param mode 排序方式。
 * @returns 下标（-1 = 找不到）与该排序下的总行数。
 */
function locateIndexOfCurrentId(mode: 'updatedAsc' | 'title'): { index: number, total: number } {
  let rows: SessionSummary[] = []
  try {
    const snapshot = probeCtx.list?.getSnapshot() as SessionListState | undefined
    const ids: readonly string[] = Array.isArray(snapshot?.ids) ? snapshot.ids : []
    const hidden = probeCtx.hidden?.getSnapshot()
    for (const id of ids) {
      if (deletedIds.has(id)) continue
      if (hidden?.has(id) === true) continue
      const row = snapshot?.byId?.[id]
      if (row !== undefined) rows.push(row)
    }
  } catch {
    rows = []
  }
  rows = [...rows].sort((a, b) => {
    if ((a.blank === true) !== (b.blank === true)) return a.blank === true ? 1 : -1
    if (mode === 'title') return (a.displayTitle ?? a.id).toLowerCase().localeCompare((b.displayTitle ?? b.id).toLowerCase())
    return (a.updatedAt ?? 0) - (b.updatedAt ?? 0)
  })
  const currentId = currentIdOf()
  return { index: currentId === undefined ? -1 : rows.findIndex((row) => row.id === currentId), total: rows.length }
}

/**
 * 定位探针（T2/T3 量测）：先把筛选/排序摆成「目标排在首屏之外」，**点一次**「定位当前」，
 * 按 +400/800/1500/2500ms 采样终态，测完才把用户设置还原。
 *
 * 判据：`attempts == 1`（只点一次）、`targetVisibleBeforeClick == false`、
 * `timelineLastVisible == true`、`locateOutcome.corrections == 0`。
 * @returns `{ locate, archiveJump }`（后者是本探针顺带量的 T1）。
 */
async function probeLocate(): Promise<Record<string, unknown>> {
  const node0 = locateListNode()
  if (node0 === null) return { locate: { skipped: true, reason: 'list 容器未渲染（面板未打开或不在 list 视图）' } }
  const locateButton = partOf<HTMLElement>(SESSION_ID_PART.locate)
  if (locateButton === null) return { locate: { skipped: true, reason: '工具栏没有「定位当前」按钮' } }
  const filterSelect = partOf<HTMLSelectElement>(SESSION_ID_PART.filter)
  const subagentSelect = partOf<HTMLSelectElement>(SESSION_ID_PART.subagent)
  const sortSelect = partOf<HTMLSelectElement>(SESSION_ID_PART.sort)
  const searchInput = partOf<HTMLInputElement>(SESSION_ID_PART.search)
  const workspaceSelect = partOf<HTMLSelectElement>(SESSION_ID_PART.workspace)
  const filterBefore = filterSelect?.value ?? ''
  const subagentBefore = subagentSelect?.value ?? ''
  const sortBefore = sortSelect?.value ?? ''
  const searchBefore = searchInput?.value ?? ''
  const workspaceBefore = workspaceSelect?.value ?? ''
  const touchedControls: string[] = []

  // ① 筛选归一：目标被筛掉就量不出定位（全部 = 所有行都在）
  if (filterSelect !== null && filterSelect.value !== 'all') {
    setSelectValue(filterSelect, 'all')
    touchedControls.push('filter=all')
  }
  if (subagentSelect !== null && subagentSelect.value !== 'all') {
    setSelectValue(subagentSelect, 'all')
    touchedControls.push('subagent=all')
  }
  if (searchInput !== null && searchInput.value !== '') {
    setInputValue(searchInput, '')
    touchedControls.push('search=')
  }
  if (workspaceSelect !== null && workspaceSelect.value !== '') {
    setSelectValue(workspaceSelect, '')
    touchedControls.push('workspace=')
  }
  await sleep(200)

  // ② 切排序把目标推到首屏 60 行之外（updatedAsc 一次不够再试 title）
  const indexTries: number[] = []
  let sortUsed = sortBefore
  let targetIndex = -1
  let totalRows = 0
  for (const mode of ['updatedAsc', 'title'] as const) {
    if (sortSelect !== null) {
      setSelectValue(sortSelect, mode)
      touchedControls.push(`sort=${mode}`)
    }
    sortUsed = mode
    await sleep(240)
    let measured = locateIndexOfCurrentId(mode)
    indexTries.push(measured.index)
    if (measured.index < 0) {
      await sleep(220)
      measured = locateIndexOfCurrentId(mode)
      indexTries.push(measured.index)
    }
    targetIndex = measured.index
    totalRows = measured.total
    if (targetIndex > 60) break
  }

  const groupedMode = loadSettings().grouped === true
  const currentId = currentIdOf()
  if (currentId === undefined) {
    return {
      locate: {
        skipped: true,
        reason: '没有当前会话（没有任何行被 mainView 持有）',
        filterBefore, subagentBefore, sortBefore, sortUsed, indexTries, targetIndex, totalRows, groupedMode, touchedControls,
      },
    }
  }

  // ③ 量「点击前」
  const node = locateListNode()
  if (node === null) return { locate: { skipped: true, reason: 'list 容器在切换筛选后消失' } }
  try { node.scrollTop = 0 } catch { /* 容器不可滚也不影响后面采样 */ }
  await sleep(60)
  const beforeRows = locateRows(node)
  const beforeActive = node.querySelector('[data-active="true"]') as HTMLElement | null
  const before = {
    scrollTop: Math.round(node.scrollTop),
    scrollHeight: Math.round(node.scrollHeight),
    clientHeight: Math.round(node.clientHeight),
    rows: beforeRows.length,
    activeRendered: beforeActive !== null,
    activeVisible: beforeActive === null ? false : rowVisibleOf(node, beforeActive),
  }
  const targetBefore = domRowOf(node, currentId)
  const targetVisibleBeforeClick = targetBefore === undefined ? false : rowVisibleOf(node, targetBefore)

  // ④ rAF 采样滚动轨迹（判平滑 vs 瞬移），然后**点一次**定位
  const scrollSamples: number[] = []
  let sampling = true
  const sampleStep = (): void => {
    if (!sampling) return
    try { scrollSamples.push(Math.round(node.scrollTop)) } catch { /* 容器没了 */ }
    if (scrollSamples.length >= 40) {
      sampling = false
      return
    }
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(sampleStep)
    else window.setTimeout(sampleStep, 16)
  }
  if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(sampleStep)
  else window.setTimeout(sampleStep, 16)

  const startedAt = Date.now()
  locateButton.click()

  // ⑤ timeline：+400/800/1500/2500ms 各采一次
  const snapshotNow = (): Record<string, unknown> => {
    const box = locateListNode()
    const at = Date.now() - startedAt
    if (box === null) return { at, targetVisible: false, scrollTop: 0, scrollHeight: 0, renderedRows: 0 }
    const row = domRowOf(box, currentId)
    return {
      at,
      targetVisible: row === undefined ? false : rowVisibleOf(box, row),
      centerOffset: row === undefined ? undefined : centerOffsetOf(box, row),
      scrollTop: Math.round(box.scrollTop),
      scrollHeight: Math.round(box.scrollHeight),
      renderedRows: locateRows(box).length,
      targetId: row === undefined ? undefined : locateRowId(row),
    }
  }
  const timeline: Record<string, unknown>[] = []
  for (const at of [400, 800, 1500, 2500]) {
    const wait = at - (Date.now() - startedAt)
    if (wait > 0) await sleep(wait)
    timeline.push(snapshotNow())
  }
  sampling = false

  // ⑥ 终态复核：+2500ms 时还在动就再采两次（各 +600ms），免得慢机取到中途值
  let timelineExtended = false
  let previousFrames = frameCountOf(locateOutcomeOf())
  let previousTop = listScrollTop()
  for (let round = 0; round < 2; round += 1) {
    const outcome = locateOutcomeOf()
    const frames = frameCountOf(outcome)
    // 三种「还在跑」的证据取并集：scrollTop 还在变 / 面板记的帧数在涨 / 面板自己说没到位。
    const running = listScrollTop() !== previousTop
      || (frames >= 0 && frames !== previousFrames)
      || (outcome !== undefined && outcome.reached !== true)
    if (!running) break
    await sleep(600)
    timeline.push(snapshotNow())
    timelineExtended = true
    previousFrames = frames
    previousTop = listScrollTop()
  }

  // ⑦ 终态与判据
  const endBox = locateListNode()
  const endRow = endBox === null ? undefined : domRowOf(endBox, currentId)
  const targetVisible = endBox === null || endRow === undefined ? false : rowVisibleOf(endBox, endRow)
  const after = {
    scrollTop: endBox === null ? 0 : Math.round(endBox.scrollTop),
    targetVisible,
    targetId: endRow === undefined ? undefined : locateRowId(endRow),
    centerOffset: endBox === null || endRow === undefined ? undefined : centerOffsetOf(endBox, endRow),
  }
  const distinctScrollTops = new Set(scrollSamples).size
  // `behaviorUsed` 优先取面板自己记的实测值（`lastLocateOutcome().behavior`，那是定位真下发给
  // scrollTo 的 behavior）；拿不到才退回 rAF 轨迹推断。`smoothConfirmed` 因此比的是实测量。
  const locateOutcome = locateOutcomeOf()
  const scrollSampledSmooth = distinctScrollTops >= 3
  const outcomeBehavior = locateOutcome?.behavior
  const behaviorUsed = outcomeBehavior === 'auto' || outcomeBehavior === 'smooth'
    ? outcomeBehavior
    : (scrollSampledSmooth ? 'smooth' : 'auto')
  const behaviorExpected = locateBehaviorExpected()
  const visibleFlags = timeline.map((sample) => sample.targetVisible === true)
  const measuredAt = Date.now()
  const measuredBeforeRestore = true

  // ⑧ 测完才还原用户设置（此前一律不动）
  if (filterSelect !== null && filterSelect.value !== filterBefore) setSelectValue(filterSelect, filterBefore)
  if (subagentSelect !== null && subagentSelect.value !== subagentBefore) setSelectValue(subagentSelect, subagentBefore)
  if (searchInput !== null && searchInput.value !== searchBefore) setInputValue(searchInput, searchBefore)
  if (workspaceSelect !== null && workspaceSelect.value !== workspaceBefore) setSelectValue(workspaceSelect, workspaceBefore)
  if (sortSelect !== null && sortSelect.value !== sortBefore) setSelectValue(sortSelect, sortBefore)
  await sleep(120)
  const restoredAt = Date.now()
  const filterAfterRestore = partOf<HTMLSelectElement>(SESSION_ID_PART.filter)?.value ?? ''
  const sortAfterRestore = partOf<HTMLSelectElement>(SESSION_ID_PART.sort)?.value ?? ''
  const subagentAfterRestore = partOf<HTMLSelectElement>(SESSION_ID_PART.subagent)?.value ?? ''
  const restored = filterAfterRestore === filterBefore && sortAfterRestore === sortBefore && subagentAfterRestore === subagentBefore

  // ⑨ 归档跳转放在还原之后**但自带筛选归一**：用户设置可能是「隐藏归档」，还原后归档行会被筛掉
  // ⇒ archiveJump 自己先把 filter 切 all、量完再还原它动过的那一个控件（见 probeArchiveJump）。
  // 不把它挪到还原之前：点行可能触发 closeOnOpen 关掉面板，那时再想按 DOM 还原就没处可还。
  const archiveJump = await probeArchiveJump()
  // ⑩ 兜底：面板可能已被点行关掉，DOM 还原不了 ⇒ 直接把持久化设置改回进入时的值。
  restorePersistedSettings({ lastFilter: filterBefore, subagentFilter: subagentBefore, workspaceFilter: workspaceBefore })
  // 再让 entry 按磁盘重读一次内存 state：否则「面板已卸载 + 内存里还是探针设的 all」会让用户
  // 之后任意一次设置变更用 {...previous} 把 all 写回去，把上面的还原冲掉。
  let settingsSynced = false
  try {
    if (typeof syncSettingsFromStorage === 'function') {
      syncSettingsFromStorage()
      settingsSynced = true
    }
  } catch {
    settingsSynced = false
  }
  const settingsAfter = loadSettings()
  const settingsRestored = (filterBefore === '' || settingsAfter.lastFilter === filterBefore)
    && (subagentBefore === '' || settingsAfter.subagentFilter === subagentBefore)
    && settingsAfter.workspaceFilter === workspaceBefore

  const locate = {
    filterBefore,
    subagentBefore,
    sortBefore,
    sortUsed,
    indexTries,
    targetIndex,
    totalRows,
    groupedMode,
    currentId,
    before,
    after,
    timeline,
    timelineLastVisible: visibleFlags.length > 0 ? visibleFlags[visibleFlags.length - 1] : false,
    timelineAnyVisible: visibleFlags.some((flag) => flag === true),
    timelineVisibleAt: timeline.filter((sample) => sample.targetVisible === true).map((sample) => sample.at),
    timelineExtended,
    attempts: 1,
    targetVisible,
    targetVisibleBeforeClick,
    behaviorUsed,
    behaviorExpected,
    smoothConfirmed: behaviorUsed === behaviorExpected,
    locateOutcome,
    behaviorSource: behaviorUsed === outcomeBehavior ? 'locateOutcome' : 'scrollSamples',
    scrollSampledSmooth,
    reducedMotion: prefersReducedMotion(),
    distinctScrollTops,
    scrollSamples: scrollSamples.slice(0, 40),
    note: panelNoteText(),
    measuredBeforeRestore,
    measuredAt,
    restoredAt,
    restored,
    filterAfterRestore,
    filterAfterArchiveJump: partOf<HTMLSelectElement>(SESSION_ID_PART.filter)?.value ?? '',
    settingsAfter: {
      lastFilter: settingsAfter.lastFilter,
      subagentFilter: settingsAfter.subagentFilter,
      workspaceFilter: settingsAfter.workspaceFilter,
    },
    settingsRestored,
    settingsSynced,
    touchedControls,
  }
  return { locate, archiveJump }
}

/**
 * 归档跳转探针（T1 量测）：先保证归档行在列表里，点第一个归档行，量主视图是否真的切到它、
 * 以及该 id 是否已离开归档集合，最后把它动过的那一个控件/持久化值还原。
 *
 * 为什么要自己切筛选：用户设置可能是「隐藏归档」（`defaultFilter/lastFilter = hideArchived`），
 * 那时列表里根本没有归档行，探针会永远 skipped ⇒ T1 判据拿不到。所以进来先 `filter → all`。
 * 为什么不在「还原用户设置」之前跑（另一种修法）：点行可能触发 `closeOnOpen` 把面板关掉，
 * 那之后按 DOM 还原就没处可还；放在还原之后 + 自带归一，两条路都稳。
 * @returns 可安全 JSON 化的量测结果（含 `archiveJumpFilterRestored`）。
 */
async function probeArchiveJump(): Promise<Record<string, unknown>> {
  const filterSelect = partOf<HTMLSelectElement>(SESSION_ID_PART.filter)
  const filterBefore = filterSelect?.value ?? ''
  const filterChanged = filterSelect !== null && filterSelect.value !== 'all'
  if (filterChanged) {
    setSelectValue(filterSelect, 'all')
    await sleep(200)
  }
  const measured = await measureArchiveJump()
  let domRestored = true
  if (filterChanged && filterSelect !== null) {
    setSelectValue(filterSelect, filterBefore)
    await sleep(120)
    const domAfter = partOf<HTMLSelectElement>(SESSION_ID_PART.filter)?.value
    // 面板已关（点行触发 closeOnOpen）时 DOM 没了，这一步算「无需再还」
    domRestored = domAfter === undefined || domAfter === null ? true : domAfter === filterBefore
  }
  // 面板可能已经被关掉：再把持久化值改回进入时的 filter
  const persisted = filterBefore === '' ? undefined : restorePersistedSettings({ lastFilter: filterBefore })
  const archiveJumpFilterRestored = domRestored && (persisted === undefined || persisted.lastFilter === filterBefore)
  return {
    ...measured,
    archiveJumpFilterBefore: filterBefore,
    archiveJumpFilterChanged: filterChanged,
    archiveJumpFilterRestored,
  }
}

/**
 * `probeArchiveJump` 的量测本体（只读列表 + 点一次归档行）。
 *
 * 判据：`ok = at800 === rowId && mainBefore !== rowId && rowArchivedAtClick === true && archiveResolved === true`
 * —— 少了任一项都会假绿：主视图本来就停在该行、或 unarchive 静默失败但 open 先成功了。
 * @returns 可安全 JSON 化的量测结果。
 */
async function measureArchiveJump(): Promise<Record<string, unknown>> {
  const node = locateListNode()
  if (node === null) return { skipped: true, reason: 'list 容器未渲染（面板已关闭或不在 list 视图）' }
  const rows = locateRows(node)
  const archiveRow = rows.find((row) => row.querySelector('.sid-badge-archived') !== null)
  if (archiveRow === undefined) return { skipped: true, reason: '当前列表没有归档行', rows: rows.length }
  const rowId = locateRowId(archiveRow)
  if (rowId === '') return { skipped: true, reason: '归档行读不到会话 id' }
  const mainBefore = currentIdOf()
  const rowArchivedAtClick = archivedIdsNow().includes(rowId)
  archiveRow.click()
  await sleep(300)
  const at300 = currentIdOf()
  let at800 = at300
  if (at300 !== rowId) {
    await sleep(500)
    at800 = currentIdOf()
  }
  const stillArchivedAfter = archivedIdsNow().includes(rowId)
  const archiveResolved = stillArchivedAfter === false
  const ok = at800 === rowId && mainBefore !== rowId && rowArchivedAtClick === true && archiveResolved === true
  return { rowId, mainBefore, rowArchivedAtClick, at300, at800, stillArchivedAfter, archiveResolved, ok, attempts: 1 }
}

/**
 * 子代理标题探针（T4 量测）：把子代理筛选切「全部」，按 parentId 分组报每行的
 * 「官方标题 / 目录条目 / 端点标题 / 面板实际显示的标题」四路对照。
 *
 * 判据：≥2 个 parentId、`titleFromEndpoint` 非空、`panelTitleIsCwdBasename === false`。
 * @returns 可安全 JSON 化的量测结果。
 */
async function probeSubagent(): Promise<Record<string, unknown>> {
  const subagentSelect = partOf<HTMLSelectElement>(SESSION_ID_PART.subagent)
  const subagentFilterBefore = subagentSelect?.value ?? ''
  if (subagentSelect !== null && subagentSelect.value !== 'all') setSelectValue(subagentSelect, 'all')
  await sleep(240)

  let decorated: any
  let raw: any
  try { decorated = probeCtx.list?.getSnapshot() } catch { decorated = undefined }
  try { raw = probeCtx.rawList?.getSnapshot() } catch { raw = undefined }
  const ids: readonly string[] = Array.isArray(decorated?.ids) ? decorated.ids : Object.keys(decorated?.byId ?? {})
  const rows: any[] = []
  for (const id of ids) {
    if (deletedIds.has(id)) continue
    const row = decorated?.byId?.[id]
    if (row !== undefined) rows.push(row)
  }
  const subagentRows = rows.filter((row) => row?.origin === 'subagent')
  const restoreSubagentFilter = (): void => {
    if (subagentSelect !== null && subagentFilterBefore !== '' && subagentSelect.value !== subagentFilterBefore) {
      setSelectValue(subagentSelect, subagentFilterBefore)
    }
  }
  if (subagentRows.length === 0) {
    restoreSubagentFilter()
    return { skipped: true, reason: '快照里没有子代理行（origin=subagent）', totalRows: rows.length, subagentRows: 0, subagentFilterBefore }
  }

  const projections = raw?.projectionsBySession ?? {}
  const catalogByChild = new Map<string, { owner: string, entry: any }>()
  const catalogParents: Record<string, unknown>[] = []
  for (const key of Object.keys(projections)) {
    const values = projections[key]?.values
    const catalog = values?.subagentCatalog
    const length = Array.isArray(catalog) ? catalog.length : -1
    if (catalogParents.length < 5) {
      catalogParents.push({
        parentId: key,
        valueKeys: values !== null && typeof values === 'object' ? Object.keys(values).slice(0, 20) : [],
        catalogLength: length,
      })
    }
    if (!Array.isArray(catalog)) continue
    for (const entry of catalog) {
      if (typeof entry?.id === 'string' && !catalogByChild.has(entry.id)) catalogByChild.set(entry.id, { owner: key, entry })
    }
  }

  const byParent = new Map<string, any[]>()
  for (const row of subagentRows) {
    const parentId = typeof row?.parentId === 'string' ? row.parentId : ''
    const bucket = byParent.get(parentId) ?? []
    bucket.push(row)
    byParent.set(parentId, bucket)
  }
  const grouped = [...byParent.entries()].map(([parentId, list]) => ({ parentId, count: list.length, rows: list.slice(0, 3) }))
  const sampled = grouped.flatMap((group) => group.rows).slice(0, 8)

  let endpointTitles: Record<string, string> = {}
  if (sampled.length > 0) {
    try {
      const { status, reply } = await postJson('/api/session-id/titles', { sessionIds: sampled.map((row) => row.id) })
      if (status === 200 && reply?.ok === true && reply?.titles !== null && typeof reply?.titles === 'object') {
        endpointTitles = reply.titles as Record<string, string>
      }
    } catch { endpointTitles = {} }
  }

  const domNode = locateListNode()
  const domRows = domNode === null ? [] : locateRows(domNode)
  const sampleById = new Map<string, Record<string, unknown>>()
  for (const row of sampled) {
    const id = String(row.id)
    const rawRow = raw?.byId?.[id]
    const hit = catalogByChild.get(id)
    const panelTitle = (() => {
      const domRow = domRows.find((node) => locateRowId(node) === id)
      return domRow === undefined ? '' : locateRowTitle(domRow)
    })()
    const cwd = typeof rawRow?.cwd === 'string' ? rawRow.cwd : (typeof row.cwd === 'string' ? row.cwd : '')
    const base = basenameOf(cwd)
    const projectionValues = rawRow?.projectionValues
    const ownLabel = (() => {
      const values = projections?.[id]?.values
      const label = typeof values?.subagent?.label === 'string' ? values.subagent.label : ''
      if (label !== '') return label
      const identity = values?.subagent?.identity
      return typeof identity?.label === 'string' ? identity.label : ''
    })()
    const rawTitle = typeof rawRow?.displayTitle === 'string' ? rawRow.displayTitle : ''
    sampleById.set(id, {
      id,
      origin: row.origin,
      parentId: typeof row?.parentId === 'string' ? row.parentId : '',
      catalogOwner: hit?.owner ?? '',
      catalogEntry: hit === undefined ? '' : JSON.stringify(hit.entry).slice(0, 400),
      byIdEntry: {
        present: rawRow !== undefined,
        inIds: Array.isArray(raw?.ids) ? raw.ids.includes(id) : false,
        keys: rawRow === undefined ? [] : Object.keys(rawRow).slice(0, 24),
        hasProjectionValues: rawRow?.projectionValues !== undefined,
      },
      displayTitle: rawTitle,
      cwd,
      displayTitleIsCwdBasename: base !== '' && rawTitle === base,
      titleFromEndpoint: typeof endpointTitles[id] === 'string' ? endpointTitles[id] : '',
      panelTitle,
      panelTitleIsCwdBasename: base !== '' && panelTitle === base,
      subagentLabel: ownLabel,
      title: typeof rawRow?.title === 'string' ? rawRow.title : '',
      projectionTitle: typeof projectionValues?.title?.val === 'string'
        ? projectionValues.title.val
        : (typeof projectionValues?.title === 'string' ? projectionValues.title : ''),
      projectionValuesKeys: projectionValues !== null && typeof projectionValues === 'object'
        ? Object.keys(projectionValues).slice(0, 24)
        : [],
      displayTitleIsBareId: rawTitle === id,
      panelTitleIsBareId: panelTitle === id,
    })
  }

  const groups = grouped.map((group) => ({
    parentId: group.parentId,
    count: group.count,
    samples: group.rows.map((row) => sampleById.get(String(row.id))).filter((sample) => sample !== undefined),
  }))

  restoreSubagentFilter()
  await sleep(120)
  const filterRestored = (partOf<HTMLSelectElement>(SESSION_ID_PART.subagent)?.value ?? '') === subagentFilterBefore
  return {
    totalRows: rows.length,
    subagentRows: subagentRows.length,
    parentGroups: byParent.size,
    sampledFrom: 'subagent',
    panelRenderedRows: domRows.length,
    endpointTitles,
    catalogParents: { count: Object.keys(projections).length, sample: catalogParents },
    currentId: currentIdOf(),
    groups,
    rows: rows.length,
    subagentFilterBefore,
    filterRestored,
  }
}

/**
 * 删除探针（T5 端到端量测）：真删一次（只走「移入回收站」），量删除后该 id 是否处于归档态。
 *
 * 两道安全闸：`purge=1` 一律拒绝（彻底删除会毁数据）；`confirm` 必须等于 `yes`（防误删真实会话）。
 * @param args host 下发的参数 `{ target, purge, confirm }`。
 * @returns 可安全 JSON 化的量测结果。
 */
async function probeDelete(args: Record<string, unknown> | undefined): Promise<Record<string, unknown>> {
  const target = typeof args?.target === 'string' ? args.target : ''
  const purge = args?.purge === true
  const confirm = typeof args?.confirm === 'string' ? args.confirm : ''
  if (target === '') return { skipped: true, reason: '缺少 target 参数（?command=probe-delete&target=<sessionId>）', confirm }
  if (purge) return { skipped: true, reason: '拒绝 purge=1：本探针只验证「移入回收站」路径，彻底删除会毁掉数据', target, purge, confirm }
  if (confirm !== 'yes') return { skipped: true, reason: '缺少 confirm=yes（防误删；只允许对自建会话跑）', target, purge, confirm }
  if (probeCtx.actions?.remove === undefined) return { skipped: true, reason: '删除动作不可用（actions.remove 未挂载）', target, purge, confirm }
  const archivedBefore = archivedIdsNow().includes(target)
  const result = await probeCtx.actions.remove(target, false)
  await sleep(400)
  const ids = archivedIdsNow()
  const present = ids.includes(target)
  let stillListed = false
  try {
    const snapshot = probeCtx.list?.getSnapshot() as SessionListState | undefined
    stillListed = Array.isArray(snapshot?.ids) ? snapshot.ids.includes(target) : false
  } catch {
    stillListed = false
  }
  return {
    target,
    purge: false,
    confirm,
    ok: result?.ok === true,
    removeMessage: result?.message ?? '',
    archivedBefore,
    archivedAfter: present,
    archivedCount: ids.length,
    present,
    stillListed,
  }
}

/**
 * 装载插件。
 * @param ctx - client 根上下文。
 */
export function apply(ctx: any): void {
  let localeRegistered = false
  let slotRegistered = false
  let slotDeclared = false
  let disposed = false

  ctx.effect(installStyles, `${name}: styles`)

  try {
    ctx.effect(
      () => ctx.locale.register(SESSION_ID_NS, { zh, en }),
      `${name}: dictionaries`,
    )
    localeRegistered = true
  } catch (error) {
    report('locale-failed', { error: String(error).slice(0, 200) })
  }

  try {
    // 席位由 ui-sidebar 声明；本插件只做注入，声明到位后回调才执行。
    ctx.slots.inject('sidebar.footer.action', () => {
      slotDeclared = true
      let rawList: SessionListReadSource
      try {
        const sessions = ctx.get('sessions') as {
          list: { getSnapshot(): unknown, subscribe(listener: () => void): () => void }
        }
        rawList = {
          getSnapshot: () => sessions.list.getSnapshot() as ReturnType<SessionListReadSource['getSnapshot']>,
          subscribe: (listener) => sessions.list.subscribe(listener),
        }
      } catch (error) {
        report('sessions-failed', { error: String(error).slice(0, 200) })
        return undefined
      }

      // T4：面板消费的是「包装后」的源（子代理行的官方标题常常是 cwd 目录名/裸 id/空）。
      const list: SessionListReadSource = decorateListSource(rawList)
      const archived = archivedSourceOf(ctx.get?.('workspaces'))
      const workspaces = workspacesSourceOf(ctx.get?.('workspaces'))
      const hidden = createHiddenStore()
      const uiWorkspace = ctx.get?.('uiWorkspace')
      const actions = actionsOf(uiWorkspace, archived)

      probeCtx.list = list
      probeCtx.rawList = rawList
      probeCtx.archived = archived
      probeCtx.actions = actions
      probeCtx.hidden = hidden

      try {
        // 注：`register({` 与 `name:` 必须保持这种紧邻书写——注入器的注入前骨架预检
        // 用 `register\(\{[\s\S]*?name:\s*'<slot>'` 认这个形状，中间插换行会被误判为坏骨架。
        const dispose = ctx.slots.register({
          name: 'sidebar.footer.action',
          id: ENTRY_ID,
          locale: SESSION_ID_NS,
          inject: () => ({ list, archived, workspaces, hidden, actions }),
        }, SessionIdEntry)
        slotRegistered = true
        report('slot-registered', {
          entryId: ENTRY_ID,
          hasArchived: archived !== undefined,
          hasJump: actions.open !== undefined,
          hasArchiveAction: actions.archive !== undefined,
        })
        return dispose
      } catch (error) {
        report('slot-failed', { error: String(error).slice(0, 200) })
        return undefined
      }
    })
  } catch (error) {
    report('slot-inject-failed', { error: String(error).slice(0, 200) })
  }

  /** 把当前页面里的插件状态报给 host（供外部查询），并执行 host 下发的自检指令。 */
  const selfCheck = async (phase: string): Promise<void> => {
    // 已被卸载的实例不再上报：热重载期间新旧实例会并存一小会儿，死实例的定时器
    // 若不自己闭嘴，会让外部看到两组互相矛盾的状态。
    if (disposed) return
    let sessionCount = -1
    let archivedCount = -1
    try {
      const snapshot = ctx.get('sessions')?.list?.getSnapshot()
      sessionCount = Array.isArray(snapshot?.ids) ? snapshot.ids.length : -1
    } catch { /* 服务正在卸载 */ }
    try {
      const snapshot = ctx.get('workspaces')?.list?.getSnapshot()
      archivedCount = Array.isArray(snapshot?.archivedSessionIds) ? snapshot.archivedSessionIds.length : -1
    } catch { /* 服务不可用 */ }
    let slotEntries = -1
    try {
      slotEntries = (ctx.slots.entries('sidebar.footer.action') ?? []).length
    } catch { /* 席位尚未声明 */ }
    const reply = await report(phase, {
      plugin: `${name}@${VERSION}`,
      build: BUILD,
      localeRegistered,
      slotRegistered,
      slotDeclared,
      slotEntries,
      sessionCount,
      archivedCount,
      hasWorkspaces: ctx.get?.('workspaces') !== undefined,
      hasUiWorkspace: typeof ctx.get?.('uiWorkspace')?.openSession === 'function',
      hasArchiveAction: typeof ctx.get?.('uiWorkspace')?.archiveSession === 'function',
      deletedLocally: deletedIds.size,
      settings: loadSettings(),
      styleRev: styleRev(),
      entryMounted: entryMounted(),
    })
    if (reply?.commands?.includes('probe-row-hit') === true) {
      // 探针要看到行，所以指令**自带**"先把面板打开"这一步（host 的待下发指令是单槽，
      // 连着发 open-panel + probe 会让前一条被顶掉，这里不依赖调用方的两条指令）。
      if (openPanelFromHost !== undefined) {
        report('selftest-open-panel')
        openPanelFromHost('list')
      }
      window.setTimeout(() => { report('row-hit-probe', probeRowHit()) }, 500)
    }
    if (reply?.commands?.includes('probe-trash') === true) {
      if (openPanelFromHost !== undefined) {
        report('selftest-open-trash')
        openPanelFromHost('trash')
      }
      window.setTimeout(() => { report('trash-probe', probeTrash()) }, 700)
    }
    // host 把探针参数（target/purge/confirm）随指令一起回带；页面拿不到就按缺参处理。
    const probeArgs = (reply as { args?: Record<string, unknown> } | undefined)?.args
    if (reply?.commands?.includes('probe-locate') === true) {
      if (openPanelFromHost !== undefined) {
        report('selftest-open-panel')
        openPanelFromHost('list')
      }
      window.setTimeout(() => {
        void probeLocate().then((result) => { void report('locate-probe', result) })
          .catch((error: unknown) => { void report('locate-probe-failed', { error: String(error).slice(0, 160) }) })
      }, 600)
    }
    if (reply?.commands?.includes('probe-subagent') === true) {
      if (openPanelFromHost !== undefined) {
        report('selftest-open-panel')
        openPanelFromHost('list')
      }
      window.setTimeout(() => {
        void probeSubagent().then((result) => { void report('subagent-probe', { subagentProbe: result }) })
          .catch((error: unknown) => { void report('subagent-probe-failed', { error: String(error).slice(0, 160) }) })
      }, 600)
    }
    if (reply?.commands?.includes('probe-delete') === true) {
      window.setTimeout(() => {
        void probeDelete(probeArgs).then((result) => { void report('delete-probe', result) })
          .catch((error: unknown) => { void report('delete-probe-failed', { error: String(error).slice(0, 160) }) })
      }, 300)
    }
    if (reply?.commands?.includes('open-panel') === true && openPanelFromHost !== undefined) {
      report('selftest-open-panel')
      openPanelFromHost('list')
    }
  }

  report('applied')
  // 装载后密集自检三次，之后退到低频心跳：外部任何时候 curl 一次 status 都能拿到
  // 当前页面的实况，终端挂上的自检指令也在这条心跳上被取走。所有定时器都挂在
  // ctx.effect 上，卸载时随之清理。
  ctx.effect(() => {
    const timers = [
      window.setTimeout(() => { void selfCheck('check-2s') }, 2000),
      window.setTimeout(() => { void selfCheck('check-8s') }, 8000),
      window.setTimeout(() => { void selfCheck('check-20s') }, 20000),
      window.setInterval(() => { void selfCheck('tick') }, 30000),
    ]
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer)
        window.clearInterval(timer)
      }
    }
  }, `${name}: self-check timers`)

  ctx.effect(() => () => { disposed = true }, `${name}: dispose flag`)
}

