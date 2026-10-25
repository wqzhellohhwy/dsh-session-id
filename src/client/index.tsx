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
import {
  DEFAULT_SETTINGS,
  SessionIdPanel,
  type ActionResult,
  type ArchivedReadSource,
  type PanelActions,
  type PanelSettings,
  type PanelView,
  type SessionListReadSource,
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
const VERSION = '1.8.0'

/** 每次构建递增：页面上的上报带这个数字，便于判断「跑的是哪一版」。 */
const BUILD = 25

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
    openPanelFromHost = handle
    return () => {
      if (openPanelFromHost === handle) openPanelFromHost = undefined
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

  if (typeof uiWorkspace?.openSession === 'function') {
    actions.open = (sessionId: string): void => {
      try {
        uiWorkspace.openSession(sessionId)
      } catch (error) {
        report('jump-failed', { sessionId, error: String(error).slice(0, 160) })
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

  actions.remove = async (sessionId: string, purge: boolean): Promise<ActionResult> => {
    try {
      const { status, reply } = await postJson('/api/session-id/delete', { sessionId, purge })
      const ok = status === 200 && reply?.ok === true
      if (ok) {
        deletedIds.add(sessionId)
        // 只有彻底删除才清归档记录：移入回收站是可恢复的，归档状态要留着。
        if (purge) await forgetArchived(sessionId)
      }
      return { ok, message: ok ? reply?.mode : (reply?.error ?? `HTTP ${status}`) }
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
      let list: SessionListReadSource
      try {
        const sessions = ctx.get('sessions') as {
          list: { getSnapshot(): unknown, subscribe(listener: () => void): () => void }
        }
        list = {
          getSnapshot: () => sessions.list.getSnapshot() as ReturnType<SessionListReadSource['getSnapshot']>,
          subscribe: (listener) => sessions.list.subscribe(listener),
        }
      } catch (error) {
        report('sessions-failed', { error: String(error).slice(0, 200) })
        return undefined
      }

      const archived = archivedSourceOf(ctx.get?.('workspaces'))
      const workspaces = workspacesSourceOf(ctx.get?.('workspaces'))
      const hidden = createHiddenStore()
      const uiWorkspace = ctx.get?.('uiWorkspace')
      const actions = actionsOf(uiWorkspace, archived)

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
