/**
 * 会话面板：会话列表（平铺 / 按工作区分组）+ 隐藏区 + 回收站 + 设置。
 *
 * 数据来源（全是只读订阅）：
 *   - `ctx.sessions.list`：会话行
 *   - `ctx.workspaces.list`：归档集合 `archivedSessionIds` + 工作区列表（分组用）
 *   - 隐藏集合：浏览器本地（localStorage），只影响显示
 *
 * 交互要点：
 *   - 每行：勾选框 + 标题/ID/更新时间 + 一行小按钮（ID / 名称 / 复制 / 归档 / 隐藏 / 删除）；
 *   - **点行的空白处**（文字区与按钮区之外）即跳转到该会话；
 *   - 批量操作条**常驻**在工具栏上方，勾选后按钮才有意义（未选时禁用）；
 *   - 首屏只渲染 60 行、按需 +200，配合 CSS `content-visibility`。
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { writeClipboard } from '@deepseek-ai/dsh-client-ui-primitives'
import { ArchiveIcon, CheckIcon, CloseIcon, CopyIcon, EyeOffIcon, LocateIcon, SubagentIcon, TrashIcon } from './icons.tsx'
import { SESSION_ID_PART, SESSION_ID_PLUGIN_ATTR } from './styles.ts'
import { report } from './report.ts'

/** 面板词条翻译函数。 */
export type Translate = (key: string, vars?: Record<string, unknown>) => string

/** 会话行（只用得到的字段）。 */
export interface SessionSummary {
  id: string
  displayTitle?: string | undefined
  updatedAt?: number | undefined
  blank?: boolean | undefined
  cwd?: string | undefined
  /** 子代理会话标记：`'subagent'` 或缺失（判定只能用这个，裸 uuid 有反例）。 */
  origin?: string | undefined
  /** 子代理的父会话 id。 */
  parentId?: string | undefined
  /** 会话被谁「留着」的计数；主视图打开的会话即 `retainedBy.mainView > 0`。 */
  retainedBy?: Record<string, number> | undefined
  /** 个别版本会把归档标记放在行上；没有则以 workspaces 的归档集合为准。 */
  archived?: boolean | undefined
}

/** ctx.sessions.list 的快照形态。 */
export interface SessionListState {
  ids?: readonly string[] | undefined
  byId: Record<string, SessionSummary | undefined>
  /** 旧版（0.1.x）快照里的「当前会话」；0.2.x 已移除，仅作兼容兜底。 */
  current?: string | undefined
}

/** 注入给组件的只读数据源。 */
export interface SessionListReadSource {
  getSnapshot(): SessionListState
  subscribe(listener: () => void): () => void
}

/** 归档集合的只读订阅源（元素引用稳定，内容变化才换新 Set）。 */
export interface ArchivedReadSource {
  getSnapshot(): ReadonlySet<string>
  subscribe(listener: () => void): () => void
}

/** 工作区条目（只用得到的字段）。 */
export interface WorkspaceGroup {
  workspaceId?: string | undefined
  id?: string | undefined
  title?: string | undefined
  path?: string | undefined
  sessionIds?: readonly string[] | undefined
}

/** 工作区只读源（分组用）。 */
export interface WorkspacesReadSource {
  getSnapshot(): { items?: readonly WorkspaceGroup[] | undefined }
  subscribe(listener: () => void): () => void
}

/** 隐藏集合（浏览器本地，只影响显示）。 */
export interface HiddenSource {
  getSnapshot(): ReadonlySet<string>
  subscribe(listener: () => void): () => void
  toggle(sessionId: string): void
  setMany(sessionIds: readonly string[], hidden: boolean): void
  clear(): void
}

/** 排序方式。 */
export type SortMode = 'updatedDesc' | 'updatedAsc' | 'title'

/** 面板视图：列表 / 隐藏区 / 回收站。 */
export type PanelView = 'list' | 'hidden' | 'trash'

/** 归档可见性档位（与官方侧栏同义）。 */
export type FilterChoice = 'all' | 'hideArchived' | 'onlyArchived'

/** 「默认显示」设置：三档 + 跟随上次。 */
export type DefaultFilterSetting = FilterChoice | 'last'

/** 删除方式。 */
export type DeleteMode = 'trash' | 'purge'

/** 子代理可见性档位。 */
export type SubagentFilter = 'all' | 'hide' | 'only'

/** 搜索范围：全字段 / 只搜会话 ID / 只搜名称。 */
export type SearchScope = 'all' | 'id' | 'name'

/** 面板设置（持久化由外层负责）。 */
export interface PanelSettings {
  defaultFilter: DefaultFilterSetting
  lastFilter: FilterChoice
  /** 搜索范围。 */
  searchScope: SearchScope
  /** 子代理可见性（与归档筛选正交）。 */
  subagentFilter: SubagentFilter
  /** 工作区筛选：`''` = 全部；`__ungrouped__` = 未分组；否则为工作区键。 */
  workspaceFilter: string
  deleteMode: DeleteMode
  deleteNoConfirm: boolean
  purgeNoConfirm: boolean
  closeOnOpen: boolean
  autoLocate: boolean
  /** 平铺还是按工作区分组。 */
  grouped: boolean
  /** 自适应宽度开关（与固定宽度互斥）。 */
  autoWidth: boolean
  /** 固定宽度（px）；`autoWidth=false` 时生效。 */
  panelWidth: number
  /** 自适应宽度 = 视口宽度的百分比；`autoWidth=true` 时生效。 */
  autoWidthPercent: number
}

/** 固定宽度预设档位（下拉里可选，也可以直接手输任意值）。 */
export const PANEL_WIDTH_PRESETS: readonly number[] = [700, 786, 860, 960, 1080, 1280, 1440]

/** 自适应百分比预设档位。 */
export const AUTO_WIDTH_PRESETS: readonly number[] = [60, 70, 80, 86, 92, 100]

/** 固定宽度默认值（px）。 */
export const DEFAULT_PANEL_WIDTH = 860

/** 自适应默认值（视口宽度的百分比）。 */
export const DEFAULT_AUTO_WIDTH_PERCENT = 80

/** 固定宽度的允许区间（px）。 */
export const PANEL_WIDTH_RANGE = { min: 560, max: 4000 } as const

/** 自适应百分比的允许区间。 */
export const AUTO_WIDTH_RANGE = { min: 40, max: 100 } as const

/** 把数字夹到区间内（输入框里手输了越界值也不会把面板搞坏）。 */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** 面板宽度的 CSS 值：自适应写 vw，固定写 px。 */
export function panelWidthCss(settings: Pick<PanelSettings, 'autoWidth' | 'panelWidth' | 'autoWidthPercent'>): string {
  return settings.autoWidth
    ? `${clamp(settings.autoWidthPercent, AUTO_WIDTH_RANGE.min, AUTO_WIDTH_RANGE.max)}vw`
    : `${clamp(settings.panelWidth, PANEL_WIDTH_RANGE.min, PANEL_WIDTH_RANGE.max)}px`
}

/** 未分组工作区的筛选键。 */
export const UNGROUPED_KEY = '__ungrouped__'

/** 默认设置。 */
export const DEFAULT_SETTINGS: PanelSettings = {
  defaultFilter: 'all',
  lastFilter: 'all',
  searchScope: 'all',
  subagentFilter: 'all',
  workspaceFilter: '',
  deleteMode: 'trash',
  deleteNoConfirm: false,
  purgeNoConfirm: false,
  closeOnOpen: true,
  autoLocate: true,
  grouped: false,
  autoWidth: false,
  panelWidth: DEFAULT_PANEL_WIDTH,
  autoWidthPercent: DEFAULT_AUTO_WIDTH_PERCENT,
}

/** 回收站条目。 */
export interface TrashItem {
  name: string
  sessionId?: string | undefined
  at?: number | undefined
  originalDir?: string | undefined
}

/** 动作结果。 */
export interface ActionResult {
  ok: boolean
  message?: string | undefined
}

/** 面板用到的全部动作（由外层注入；缺失的能力自动隐藏对应按钮）。 */
export interface PanelActions {
  /** 打开会话：可以是同步 `void`，也可以返回结果（归档会话要先解归档，失败要给原因）。 */
  open?: ((sessionId: string) => void | Promise<ActionResult>) | undefined
  remove?: ((sessionId: string, purge: boolean) => Promise<ActionResult>) | undefined
  archive?: ((sessionId: string) => Promise<ActionResult>) | undefined
  unarchive?: ((sessionId: string) => Promise<ActionResult>) | undefined
  listTrash?: (() => Promise<TrashItem[]>) | undefined
  purgeTrash?: ((names: string[] | 'all') => Promise<ActionResult>) | undefined
  restoreTrash?: ((name: string) => Promise<ActionResult>) | undefined
  /** 批量解析会话目录绝对路径（host 侧反查 sessions 目录）。 */
  paths?: PathResolver | undefined
}

/** 面板属性。 */
export interface SessionIdPanelProps {
  list: SessionListReadSource
  archived?: ArchivedReadSource | undefined
  workspaces?: WorkspacesReadSource | undefined
  hidden?: HiddenSource | undefined
  actions?: PanelActions | undefined
  settings: PanelSettings
  onSettingsChange: (patch: Partial<PanelSettings>) => void
  /** 本地已删除的会话 id（磁盘已删但宿主列表还没跟上时，先从面板压掉）。 */
  hiddenIds?: ReadonlySet<string> | undefined
  /** 打开时落到哪个视图（缺省列表）。 */
  initialView?: PanelView | undefined
  onClose: () => void
  t: Translate
}

/** 空归档集合（永远同一个引用，避免无谓重渲染）。 */
const EMPTY_IDS: ReadonlySet<string> = new Set<string>()

/** 空订阅（没有对应源时的占位）。 */
function noopSubscribe(): () => void {
  return () => { /* 无源可订阅 */ }
}

/** 首屏渲染行数（其余按需展开）。 */
const INITIAL_ROWS = 60
/** 每次「显示更多」追加的行数。 */
const ROW_PAGE = 200
/** 列表里最多渲染多少行。 */
const MAX_ROWS = 2000

/** 定位：首滚前要求 `scrollHeight` 连续多少帧不变（列表分次长个子结束）。 */
const LOCATE_WAIT_STILL = 6
/** 定位：`scrollTop` / `rowTop` 连续多少帧不变算停稳。 */
const LOCATE_SETTLE_FRAMES = 3
/** 定位：瞬时校正次数上限。 */
const LOCATE_MAX_FIXES = 5
/** 定位：单轮帧数上限（≈4 秒），超了如实报未到位。 */
const LOCATE_MAX_FRAMES = 240
/** 用户在列表上动一下就算介入定位（passive 监听）。 */
const LOCATE_CANCEL_EVENTS: readonly string[] = ['wheel', 'touchstart', 'pointerdown']

/** 几何快照（只取定位用得到的字段）。 */
export interface RectMetrics {
  top: number
  bottom: number
  left: number
  width: number
  height: number
}

/** 滚动容器（只取定位用得到的能力，便于单测传假对象）。 */
export interface ScrollBoxMetrics {
  scrollTop: number
  clientHeight: number
  getBoundingClientRect(): RectMetrics
  scrollTo?: ((options: { top: number, behavior?: ScrollBehavior }) => void) | undefined
}

/** 一次校正前的几何快照（探针同源测量用）。 */
export interface LocateTrace {
  scrollTop: number
  rowTop: number
  rowHeight: number
  boxTop: number
  boxHeight: number
}

/** 一轮定位的结局（探针同源测量用）。 */
export interface LocateOutcome {
  behavior: ScrollBehavior
  corrections: number
  reached: boolean
  frames: number
  settleScrollTop: number
  settleScrollHeight: number
  boxRect: { top: number, height: number }
  rowRect: { top: number, height: number }
  correctionsTrace: LocateTrace[]
}

/** 一轮定位里要跨函数传递的把手（旧轮靠引用不等自动作废）。 */
interface LocateRunHandle {
  raf: number
  detach: () => void
}

/** 最近一轮定位的结局（每轮收尾都写，成功失败都写）。 */
let lastOutcome: LocateOutcome | undefined

/**
 * 读最近一轮定位的结局。
 * @returns 结局；从未定位过时为 `undefined`。
 */
export function lastLocateOutcome(): LocateOutcome | undefined {
  return lastOutcome
}

/**
 * 首滚用的滚动行为：用户要求减少动态效果时瞬时，否则平滑。matchMedia 缺失/抛错一律瞬时。
 * @returns `ScrollBehavior`。
 */
export function locateScrollBehavior(): ScrollBehavior {
  try {
    if (typeof window.matchMedia !== 'function') return 'auto'
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches === true ? 'auto' : 'smooth'
  } catch {
    return 'auto'
  }
}

/**
 * 取元素几何快照。
 * @param node 任何能拿到 rect 的元素。
 * @returns 六字段快照。
 */
function rectOf(node: { getBoundingClientRect(): RectMetrics }): RectMetrics {
  const rect = node.getBoundingClientRect()
  return { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height }
}

/**
 * 目标行是否整行落在容器可视区内（±1px 容差）。
 * @param box 容器 rect。
 * @param row 行 rect。
 * @returns 两者行列比例有效且行完全在框内才为真。
 */
export function rowInsideBox(box: RectMetrics, row: RectMetrics): boolean {
  if (!(box.width > 0) || !(box.height > 0)) return false
  if (!(row.width > 0) || !(row.height > 0)) return false
  return row.top >= box.top - 1 && row.bottom <= box.bottom + 1
}

/**
 * 把目标行滚到容器正中：只 `Math.max(0, top)`，不按 `scrollHeight - clientHeight` 夹
 * （content-visibility 下那个高度是估算值，夹了会停在半路）。
 * @param box 容器。
 * @param row 行 rect。
 * @param behavior 滚动行为。
 * @returns 下发的目标 scrollTop。
 */
export function scrollRowIntoBox(box: ScrollBoxMetrics, row: RectMetrics, behavior: ScrollBehavior): number {
  const boxRect = box.getBoundingClientRect()
  const top = Math.max(0, box.scrollTop + (row.top - boxRect.top) - (box.clientHeight - row.height) / 2)
  if (typeof box.scrollTo === 'function') {
    try { box.scrollTo({ top, behavior }) } catch { box.scrollTop = top }
  } else {
    box.scrollTop = top
  }
  return top
}

/**
 * 目标行是否真的被画出来了（识破 content-visibility 跳过布局却报 rect 在框内的假绿）。
 * @param row 目标行元素。
 * @param rowRect 行 rect。
 * @returns 行中心点命中该行或其子元素为真；取不到点位时退回 `true`。
 */
function rowPainted(row: HTMLElement, rowRect: RectMetrics): boolean {
  try {
    if (typeof document.elementFromPoint !== 'function') return true
    const hit = document.elementFromPoint(rowRect.left + rowRect.width / 2, rowRect.top + rowRect.height / 2)
    if (hit === null || hit === undefined) return false
    return hit === row || row.contains(hit)
  } catch {
    return true
  }
}

/**
 * 动作是不是 thenable（面板动作允许同步 `void` 与异步结果两种形态）。
 * @param value 动作返回值。
 * @returns 是 Promise 形态才为真。
 */
function isThenable(value: void | ActionResult | Promise<ActionResult>): value is Promise<ActionResult> {
  return typeof (value as Promise<ActionResult> | null | undefined)?.then === 'function'
}

/**
 * 当前会话 id（主视图 retain 的那个）。
 * @param list 会话列表快照。
 * @returns 当前会话 id。
 */
export function currentSessionId(list: SessionListState): string | undefined {
  if (typeof list.current === 'string' && list.current !== '') return list.current
  for (const id of list.ids ?? []) {
    const row = list.byId[id]
    if (row !== undefined && (row.retainedBy?.mainView ?? 0) > 0) return id
  }
  return undefined
}

/** 相对时间标签。 */
function relativeTimeLabel(updatedAt: number, now: number, t: Translate): string {
  const diff = Math.max(0, now - updatedAt)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return String(t('panel.time.now'))
  if (diff < hour) return String(t('panel.time.minutes', { n: Math.floor(diff / minute) }))
  if (diff < day) return String(t('panel.time.hours', { n: Math.floor(diff / hour) }))
  return String(t('panel.time.days', { n: Math.floor(diff / day) }))
}

/** 按当前排序方式排出会话（空白会话始终沉底）。 */
function sortRows(rows: SessionSummary[], mode: SortMode): SessionSummary[] {
  const sorted = [...rows]
  sorted.sort((a, b) => {
    if ((a.blank === true) !== (b.blank === true)) return a.blank === true ? 1 : -1
    if (mode === 'title') {
      return (a.displayTitle ?? a.id).toLowerCase().localeCompare((b.displayTitle ?? b.id).toLowerCase())
    }
    const delta = (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    return mode === 'updatedAsc' ? -delta : delta
  })
  return sorted
}

/** 档位是否让某一行可见。 */
function filterAllows(filter: FilterChoice, archived: boolean): boolean {
  if (filter === 'hideArchived') return !archived
  if (filter === 'onlyArchived') return archived
  return true
}

/** 子代理档位是否让某一行可见。 */
function subagentAllows(filter: SubagentFilter, isSubagent: boolean): boolean {
  if (filter === 'hide') return !isSubagent
  if (filter === 'only') return isSubagent
  return true
}

/** 行是不是子代理会话（判定只能用 origin，裸 uuid 有 13 个反例）。 */
function isSubagentRow(row: SessionSummary): boolean {
  return row.origin === 'subagent'
}

/** 会话的显示名（没有标题就退回 id）。 */
function titleOf(row: SessionSummary): string {
  return row.displayTitle !== undefined && row.displayTitle !== '' ? row.displayTitle : row.id
}

/** 复制内容形态：ID / 名称 / 会话目录路径。 */
type CopyKind = 'id' | 'name' | 'path'

/** 会话目录路径解析器（host 侧反查，入参会话 id、返回 id→绝对路径的映射）。 */
export type PathResolver = (sessionIds: readonly string[]) => Promise<Record<string, string>>

/** 拼要写进剪贴板的文本（`path` 形态另走异步解析）。 */
function plainCopyText(rows: readonly SessionSummary[], kind: 'id' | 'name'): string {
  return rows.map((row) => (kind === 'id' ? row.id : titleOf(row))).join('\n')
}

/**
 * 复制到剪贴板。`path` 形态先向 host 要会话目录，拿不到就退回会话 id。
 * @param rows 选中/目标行。
 * @param kind 形态：id / 名称 / 会话目录。
 * @param pathsOf 会话目录解析器（`path` 形态用）。
 * @returns 是否写入成功。
 */
async function copyToClipboard(rows: readonly SessionSummary[], kind: CopyKind, pathsOf?: PathResolver): Promise<boolean> {
  if (rows.length === 0) return false
  let text: string
  if (kind === 'path') {
    let map: Record<string, string> = {}
    try {
      if (pathsOf !== undefined) map = await pathsOf(rows.map((row) => row.id))
    } catch { map = {} }
    text = rows.map((row) => map[row.id] ?? row.id).join('\n')
  } else {
    text = plainCopyText(rows, kind)
  }
  let ok = false
  try {
    ok = await writeClipboard(text)
  } catch {
    ok = false
  }
  report(ok ? `copied-${kind}` : `copy-${kind}-failed`, { count: rows.length })
  return ok
}

/**
 * 单行：勾选框 + 标题/ID/更新时间 + ID / 名称 / 复制 / 归档 / 隐藏 / 删除。
 *
 * 「点空白处跳转」的做法：`onClick` 挂在行上，**文字元素与按钮区各自 stopPropagation**。
 * 上一版把 stopPropagation 挂在整块信息区上，信息区 `flex:1` 铺满整行，于是"空白处"
 * 几乎不存在、点击永远不触发——所以这里只拦真正的文字节点。
 */
function SessionRow({ session, isCurrent, isArchived, isHidden, isSubagent, selected, actions, hidden, settings, canDelete, onToggleSelect, onClose, t }: {
  session: SessionSummary
  isCurrent: boolean
  isArchived: boolean
  isHidden: boolean
  isSubagent: boolean
  selected: boolean
  actions: PanelActions
  hidden?: HiddenSource | undefined
  settings: PanelSettings
  canDelete: boolean
  onToggleSelect: (sessionId: string) => void
  onClose: () => void
  t: Translate
}): React.ReactElement {
  const [copyStatus, setCopyStatus] = React.useState<CopyKind | 'failed' | undefined>(undefined)
  const [confirming, setConfirming] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'busy' | 'failed' | 'done' | 'archived' | 'unarchived'>('idle')
  /** 行内提示（打开失败的原因就显示在这里，面板不关）。 */
  const [notice, setNotice] = React.useState<string | undefined>(undefined)
  const title = titleOf(session)
  const updatedAt = session.updatedAt
  const timeLabel = updatedAt === undefined
    ? undefined
    : String(t('panel.updatedAt', { t: relativeTimeLabel(updatedAt, Date.now(), t) }))

  const stop = (event: React.MouseEvent): void => { event.stopPropagation() }

  const handleCopy = (kind: CopyKind): void => {
    void copyToClipboard([session], kind, actions.paths).then((ok) => {
      setCopyStatus(ok ? kind : 'failed')
      window.setTimeout(() => { setCopyStatus(undefined) }, 1200)
    })
  }

  const runDelete = (purge: boolean): void => {
    if (actions.remove === undefined || status === 'busy') return
    setStatus('busy')
    void actions.remove(session.id, purge).then((result) => {
      if (result.ok) {
        setStatus('done')
        setConfirming(false)
        report(purge ? 'deleted-purge' : 'deleted-trash', { sessionId: session.id })
      } else {
        setStatus('failed')
        report('delete-failed', { sessionId: session.id, message: result.message ?? '' })
      }
    }).catch(() => { setStatus('failed') })
  }

  const handleDeleteClick = (): void => {
    setStatus('idle')
    if (settings.deleteNoConfirm) runDelete(settings.deleteMode === 'purge')
    else setConfirming(true)
  }

  const handleArchiveToggle = (): void => {
    const action = isArchived ? actions.unarchive : actions.archive
    if (action === undefined || status === 'busy') return
    setStatus('busy')
    void action(session.id).then((result) => {
      if (result.ok) {
        setStatus(isArchived ? 'unarchived' : 'archived')
        report(isArchived ? 'unarchived' : 'archived', { sessionId: session.id })
        window.setTimeout(() => { setStatus('idle') }, 1500)
      } else {
        setStatus('failed')
        report('archive-failed', { sessionId: session.id, message: result.message ?? '' })
      }
    }).catch(() => { setStatus('failed') })
  }

  /** 点行内任意位置（勾选列与按钮区除外）→ 跳转到该会话（归档会话同样可点开）。 */
  const handleRowClick = (): void => {
    if (actions.open === undefined) return
    // 用户正在拖选文本时不跳转：这样「选 ID 去复制」仍然可用。
    try {
      const selection = window.getSelection()
      if (selection !== null && selection !== undefined && selection.toString() !== '') return
    } catch { /* 取不到选区就按点击处理 */ }
    setNotice(undefined)
    const result = actions.open(session.id)
    if (isThenable(result)) {
      // 归档会话要先解归档再打开：只有真的打开了才关面板，失败就留着面板并说明原因。
      void result.then((outcome) => {
        if (outcome?.ok === true) {
          report('jumped', { sessionId: session.id })
          if (settings.closeOnOpen) onClose()
          return
        }
        setNotice(String(t('panel.openFailed', { message: outcome?.message ?? '' })))
      }).catch((error: unknown) => {
        setNotice(String(t('panel.openFailed', { message: String((error as Error)?.message ?? error) })))
      })
      return
    }
    report('jumped', { sessionId: session.id })
    if (settings.closeOnOpen) onClose()
  }

  const copyTone = (kind: CopyKind): string | undefined => (copyStatus === kind ? 'true' : undefined)
  const clickable = actions.open !== undefined

  return (
    <div
      className="sid-row"
      data-dsh-part={SESSION_ID_PART.row}
      data-active={isCurrent ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      data-hidden={isHidden ? 'true' : undefined}
      data-subagent={isSubagent ? 'true' : undefined}
      data-clickable={clickable ? 'true' : 'false'}
      title={clickable ? String(t('panel.jumpHint')) : undefined}
      onClick={clickable ? handleRowClick : undefined}
    >
      <div className="sid-row-check" onClick={stop}>
        <input
          type="checkbox"
          data-dsh-part={SESSION_ID_PART.check}
          checked={selected}
          onChange={() => { onToggleSelect(session.id) }}
        />
      </div>

      <span className="sid-row-info">
        <span className="sid-row-line">
          <span className="sid-row-title" data-active={isCurrent ? 'true' : undefined} title={title}>{title}</span>
          {isCurrent ? <span className="sid-badge sid-badge-current">{t('panel.current')}</span> : null}
          {isSubagent
            ? (
              <span className="sid-badge sid-badge-subagent">
                <SubagentIcon width={11} height={11} />{t('panel.subagent')}
              </span>
            )
            : null}
          {isArchived
            ? (
              <span className="sid-badge sid-badge-archived">
                <ArchiveIcon width={11} height={11} />{t('panel.archived')}
              </span>
            )
            : null}
          {isHidden
            ? (
              <span className="sid-badge sid-badge-hidden">
                <EyeOffIcon width={11} height={11} />{t('panel.hide')}
              </span>
            )
            : null}
        </span>
        <span className="sid-row-line">
          <span className="sid-row-id" title={session.id}>{session.id}</span>
        </span>
        {timeLabel === undefined ? null : <span className="sid-row-time">{timeLabel}</span>}
      </span>

      {
        // 不再需要跳转热区：文字节点已不拦截点击，整行（勾选框与按钮区之外）都可点开。
      }

      <span className="sid-row-actions" onClick={stop}>
        {notice === undefined
          ? null
          : <span className="sid-hint sid-row-notice" title={notice}>{notice}</span>}
        <button
          type="button"
          className="sid-action"
          data-tone="copy"
          data-copied={copyTone('id')}
          title={String(t('panel.copyIdTitle'))}
          onClick={() => { handleCopy('id') }}
        >
          {copyStatus === 'id' ? <CheckIcon width={12} height={12} /> : <CopyIcon width={12} height={12} />}
          {t('panel.copyId')}
        </button>
        <button
          type="button"
          className="sid-action"
          data-tone="copy"
          data-copied={copyTone('name')}
          title={String(t('panel.copyNameTitle'))}
          onClick={() => { handleCopy('name') }}
        >
          {copyStatus === 'name' ? <CheckIcon width={12} height={12} /> : <CopyIcon width={12} height={12} />}
          {t('panel.copyName')}
        </button>
        <button
          type="button"
          className="sid-action"
          data-tone="copy"
          data-copied={copyTone('path')}
          data-dsh-part={SESSION_ID_PART.copy}
          title={String(t('panel.copyPathTitle'))}
          onClick={() => { handleCopy('path') }}
        >
          {copyStatus === 'path' ? <CheckIcon width={12} height={12} /> : <CopyIcon width={12} height={12} />}
          {t('panel.copyPath')}
        </button>

        {(isArchived ? actions.unarchive : actions.archive) !== undefined
          ? (
            <button
              type="button"
              className="sid-action"
              data-tone={isArchived ? 'unarchive' : 'archive'}
              data-dsh-part={SESSION_ID_PART.archive}
              data-done={status === 'archived' || status === 'unarchived' ? 'true' : undefined}
              title={String(isArchived ? t('panel.unarchiveTitle') : t('panel.archiveTitle'))}
              disabled={status === 'busy'}
              onClick={handleArchiveToggle}
            >
              <ArchiveIcon width={12} height={12} />
              {isArchived ? t('panel.unarchive') : t('panel.archive')}
            </button>
          )
          : null}

        {hidden !== undefined
          ? (
            <button
              type="button"
              className="sid-action"
              data-tone={isHidden ? 'unarchive' : 'neutral'}
              data-dsh-part={SESSION_ID_PART.hide}
              title={String(isHidden ? t('panel.unhideTitle') : t('panel.hideTitle'))}
              onClick={() => { hidden.toggle(session.id); report(isHidden ? 'unhidden' : 'hidden', { sessionId: session.id }) }}
            >
              <EyeOffIcon width={12} height={12} />
              {isHidden ? t('panel.unhide') : t('panel.hide')}
            </button>
          )
          : null}

        {canDelete && actions.remove !== undefined
          ? (confirming
            ? (
              <span className="sid-confirm">
                {t('panel.deleteConfirm')}
                <button type="button" className="sid-action" data-tone="danger" data-dsh-part={SESSION_ID_PART.remove} disabled={status === 'busy'} onClick={() => { runDelete(false) }}>
                  {t('panel.deleteTrash')}
                </button>
                <button type="button" className="sid-action" data-tone="danger" disabled={status === 'busy'} onClick={() => { runDelete(true) }}>
                  {t('panel.deletePurge')}
                </button>
                <button type="button" className="sid-action" data-tone="neutral" onClick={() => { setConfirming(false); setStatus('idle') }}>
                  {t('panel.deleteNo')}
                </button>
              </span>
            )
            : (
              <button
                type="button"
                className="sid-action"
                data-tone="danger"
                data-dsh-part={SESSION_ID_PART.remove}
                data-done={status === 'done' ? 'true' : undefined}
                data-failed={status === 'failed' ? 'true' : undefined}
                title={String(status === 'failed' ? t('panel.deleteFailed') : t('panel.deleteHint'))}
                disabled={status === 'busy' || status === 'done'}
                onClick={handleDeleteClick}
              >
                {status === 'done' ? <CheckIcon width={12} height={12} /> : <TrashIcon width={12} height={12} />}
                {status === 'done' ? t('panel.deleted') : t('panel.delete')}
              </button>
            ))
          : null}
      </span>
    </div>
  )
}

/**
 * 回收站单行：与普通会话行同一套结构（勾选列 + 文案区 + 右侧动作），
 * 可选动作只剩恢复 / 彻底删除。
 */
function TrashRow({ item, title, selected, busy, onToggleSelect, onRestore, onPurge, t }: {
  item: TrashItem
  title?: string | undefined
  selected: boolean
  busy: boolean
  onToggleSelect: (name: string) => void
  onRestore?: ((name: string) => void) | undefined
  onPurge?: ((name: string) => void) | undefined
  t: Translate
}): React.ReactElement {
  const stop = (event: React.MouseEvent): void => { event.stopPropagation() }
  const timeLabel = item.at === undefined ? undefined : new Date(item.at).toLocaleString()
  const idText = item.sessionId ?? item.name
  return (
    <div className="sid-row" data-dsh-part={SESSION_ID_PART.trash}>
      <div className="sid-row-check" onClick={stop}>
        <input
          type="checkbox"
          data-dsh-part={SESSION_ID_PART.check}
          checked={selected}
          onChange={() => { onToggleSelect(item.name) }}
        />
      </div>
      <span className="sid-row-info">
        {title === undefined || title === ''
          ? null
          : (
            <span className="sid-row-line">
              <span className="sid-row-title" title={title}>{title}</span>
            </span>
          )}
        <span className="sid-row-line">
          <span className="sid-row-id" title={idText}>{idText}</span>
          {timeLabel === undefined ? null : <span className="sid-badge sid-badge-hidden">{timeLabel}</span>}
        </span>
        {item.originalDir === undefined
          ? null
          : <span className="sid-row-time" title={item.originalDir}>{item.originalDir}</span>}
      </span>
      <span className="sid-row-actions" onClick={stop}>
        {onRestore === undefined
          ? null
          : (
            <button type="button" className="sid-action" data-tone="unarchive" disabled={busy} onClick={() => { onRestore(item.name) }}>
              {t('panel.trash.restore')}
            </button>
          )}
        {onPurge === undefined
          ? null
          : (
            <button type="button" className="sid-action" data-tone="danger" disabled={busy} onClick={() => { onPurge(item.name) }}>
              {t('panel.trash.purge')}
            </button>
          )}
      </span>
    </div>
  )
}

/**
 * 渲染面板主体。
 * @param props - 数据源、动作、设置、翻译与关闭回调。
 * @returns 居中弹层。
 */
export function SessionIdPanel({
  list,
  archived,
  workspaces,
  hidden,
  actions = {},
  settings,
  onSettingsChange,
  hiddenIds,
  initialView,
  onClose,
  t,
}: SessionIdPanelProps): React.ReactElement {
  const snapshot = React.useSyncExternalStore(list.subscribe, list.getSnapshot)
  const archivedSet = React.useSyncExternalStore(
    archived?.subscribe ?? noopSubscribe,
    archived?.getSnapshot ?? (() => EMPTY_IDS),
  )
  const hiddenSet = React.useSyncExternalStore(
    hidden?.subscribe ?? noopSubscribe,
    hidden?.getSnapshot ?? (() => EMPTY_IDS),
  )
  const workspaceItems = React.useSyncExternalStore(
    workspaces?.subscribe ?? noopSubscribe,
    workspaces?.getSnapshot ?? (() => ({ items: [] as readonly WorkspaceGroup[] })),
  ).items ?? []
  const current = React.useMemo(() => currentSessionId(snapshot), [snapshot])

  const [filter, setFilter] = React.useState<FilterChoice>(
    settings.defaultFilter === 'last' ? settings.lastFilter : settings.defaultFilter,
  )
  const [sortMode, setSortMode] = React.useState<SortMode>('updatedDesc')
  const [search, setSearch] = React.useState('')
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_ROWS)
  const [view, setView] = React.useState<PanelView>(initialView ?? 'list')
  const [showSettings, setShowSettings] = React.useState(false)
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(() => new Set<string>())
  const [batchBusy, setBatchBusy] = React.useState(false)
  const [batchConfirm, setBatchConfirm] = React.useState(false)
  const [note, setNote] = React.useState<string | undefined>(undefined)
  const [trashItems, setTrashItems] = React.useState<TrashItem[] | undefined>(undefined)
  const [trashError, setTrashError] = React.useState<string | undefined>(undefined)
  const [purgeAllConfirm, setPurgeAllConfirm] = React.useState(false)
  /** 回收站里被勾选的条目（存条目名，不是会话 id：同一条目录可能没有元数据）。 */
  const [trashSelected, setTrashSelected] = React.useState<ReadonlySet<string>>(() => new Set<string>())
  const [trashBusy, setTrashBusy] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const located = React.useRef(false)
  /** 自动定位只试一次（失败也不反复重试）。 */
  const autoLocateTried = React.useRef(false)
  /** 进行中的那一轮定位。 */
  const locateRunRef = React.useRef<LocateRunHandle | undefined>(undefined)

  /** 作废进行中的一轮定位（旧轮的所有 rAF 回调与监听一并清掉）。 */
  const cancelLocate = React.useCallback((): void => {
    const run = locateRunRef.current
    locateRunRef.current = undefined
    if (run === undefined) return
    window.cancelAnimationFrame(run.raf)
    run.detach()
  }, [])

  const isArchived = React.useCallback(
    (row: SessionSummary): boolean => row.archived === true || archivedSet.has(row.id),
    [archivedSet],
  )

  const allRows = React.useMemo(() => {
    const rows: SessionSummary[] = []
    for (const id of snapshot.ids ?? []) {
      if (hiddenIds?.has(id) === true) continue
      const row = snapshot.byId[id]
      if (row !== undefined) rows.push(row)
    }
    return sortRows(rows, sortMode)
  }, [snapshot, sortMode, hiddenIds])

  /** 某一行归属的工作区键（`''` = 未分组）。判定顺序：先看工作区的 sessionIds，再看 cwd 等于工作区路径。 */
  const workspaceKeyOf = React.useCallback((row: SessionSummary): string => {
    const bySessions = workspaceItems.find((workspace) => workspace.sessionIds?.includes(row.id) === true)
    const hit = bySessions ?? (row.cwd === undefined ? undefined : workspaceItems.find((workspace) => workspace.path === row.cwd))
    return hit === undefined ? '' : (hit.workspaceId ?? hit.id ?? hit.path ?? '')
  }, [workspaceItems])

  const query = search.trim().toLowerCase()
  const rows = React.useMemo(() => {
    return allRows.filter((row) => {
      if (view === 'hidden') return hiddenSet.has(row.id)
      if (hiddenSet.has(row.id)) return false
      if (!filterAllows(filter, isArchived(row))) return false
      if (!subagentAllows(settings.subagentFilter, isSubagentRow(row))) return false
      if (settings.workspaceFilter !== '') {
        const key = workspaceKeyOf(row)
        if (settings.workspaceFilter === UNGROUPED_KEY) {
          if (key !== '') return false
        } else if (key !== settings.workspaceFilter) return false
      }
      if (query === '') return true
      const title = (row.displayTitle ?? '').toLowerCase()
      const nameHit = title.includes(query)
      const idHit = row.id.toLowerCase().includes(query)
      if (settings.searchScope === 'id') return idHit
      if (settings.searchScope === 'name') return nameHit
      return nameHit || idHit
    })
  }, [allRows, filter, isArchived, query, view, hiddenSet, settings.subagentFilter, settings.workspaceFilter, settings.searchScope, workspaceKeyOf])

  /** 按工作区分组（找不到归属的进「未分组」）。分组视图渲染全量 rows，不受 `visibleCount` 限制。 */
  const grouped = React.useMemo(() => {
    if (!settings.grouped || view !== 'list') return undefined
    const buckets = new Map<string, { title: string, ungrouped: boolean, rows: SessionSummary[] }>()
    const idOf = (workspace: WorkspaceGroup): string => workspace.workspaceId ?? workspace.id ?? workspace.path ?? ''
    const byPath = new Map<string, WorkspaceGroup>()
    for (const workspace of workspaceItems) {
      if (typeof workspace.path === 'string') byPath.set(workspace.path, workspace)
    }
    for (const row of rows) {
      const bySessions = workspaceItems.find((workspace) => workspace.sessionIds?.includes(row.id) === true)
      const workspace = bySessions ?? (row.cwd === undefined ? undefined : byPath.get(row.cwd))
      const key = workspace === undefined ? '' : idOf(workspace)
      const title = workspace === undefined
        ? String(t('panel.ungrouped'))
        : (workspace.title ?? workspace.path ?? String(t('panel.groupUnknown')))
      const bucket = buckets.get(key) ?? { title, ungrouped: workspace === undefined, rows: [] }
      bucket.rows.push(row)
      buckets.set(key, bucket)
    }
    // 未分组排最后
    return [...buckets.values()].sort((a, b) => (a.ungrouped === b.ungrouped ? 0 : a.ungrouped ? 1 : -1))
  }, [settings.grouped, view, rows, workspaceItems, t])

  React.useEffect(() => { setVisibleCount(INITIAL_ROWS) }, [query, filter, sortMode, view])

  const shown = rows.slice(0, visibleCount)
  const remaining = rows.length - shown.length

  React.useEffect(() => {
    report('panel-mounted', { sessionCount: rows.length, visible: shown.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在挂载时上报一次
  }, [])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])

  /**
   * 起一轮定位：rAF 状态机，等列表长完个子 → 首滚（居中）→ 停稳 → 判到位 → 不达标瞬时校正。
   *
   * 为什么不能「setVisibleCount 之后 setTimeout 再 querySelector」：展开行数只是排期，
   * `index+1` 行在首屏 60 行之外时，这次 commit 要新建上千个 DOM 节点，行还没进 DOM
   * 定时器就到了，`querySelector('[data-active=true]')` 拿到 null ⇒ 静默失败，第二次点才中。
   * @param hint 用户手动点的（失败要提示；自动定位不弹提示）。
   * @param need 目标行需要的可见行数（= 下标 + 1）。
   */
  const startLocate = (hint: boolean, need: number): void => {
    const box = listRef.current
    if (box === null) return
    cancelLocate()
    const behavior = locateScrollBehavior()
    const trace: LocateTrace[] = []
    let frame = 0
    let waitStill = 0
    let prevHeight = -1
    let still = 0
    let corrections = 0
    let scrolled = false
    let scrollHeightAtScroll = -1
    let lastScrollTop = -1
    let lastRowTop = -1
    let target: number | undefined
    let row: HTMLElement | undefined

    const findRow = (): HTMLElement | undefined => {
      const node = box.querySelector(`[data-dsh-part="${SESSION_ID_PART.row}"][data-active="true"]`)
      return node === null ? undefined : node as HTMLElement
    }
    const onUserScroll = (): void => { cancelLocate() }
    const detach = (): void => {
      for (const type of LOCATE_CANCEL_EVENTS) box.removeEventListener(type, onUserScroll)
    }
    const handle: LocateRunHandle = { raf: 0, detach }
    const schedule = (): void => { handle.raf = window.requestAnimationFrame(step) }

    /** 收尾：写结局、解绑、必要时提示。旧轮一律不写（防旧轮覆盖新一轮）。 */
    const settle = (reached: boolean): void => {
      if (locateRunRef.current !== handle) return
      locateRunRef.current = undefined
      window.cancelAnimationFrame(handle.raf)
      detach()
      const boxRect = rectOf(box)
      const rowRect = row === undefined
        ? { top: 0, bottom: 0, left: 0, width: 0, height: 0 }
        : rectOf(row)
      lastOutcome = {
        behavior,
        corrections,
        reached,
        frames: frame,
        settleScrollTop: Math.round(box.scrollTop),
        settleScrollHeight: Math.round(box.scrollHeight),
        boxRect: { top: Math.round(boxRect.top), height: Math.round(boxRect.height) },
        rowRect: { top: Math.round(rowRect.top), height: Math.round(rowRect.height) },
        correctionsTrace: trace,
      }
      report(reached ? 'locate-reached' : 'locate-missed', { frames: frame, corrections })
      if (reached) {
        located.current = true
        setNote(undefined)
      } else if (hint) {
        setNote(String(t('panel.locateNotReached')))
      }
    }

    const step = (): void => {
      if (locateRunRef.current !== handle) return
      frame += 1
      if (frame > LOCATE_MAX_FRAMES) { settle(false); return }
      const scrollHeight = box.scrollHeight
      if (scrollHeight === prevHeight) waitStill += 1
      else { prevHeight = scrollHeight; waitStill = 0 }
      // ① 行数到位且列表连续多帧不长个子，才算能算 top（分次扩张会把目标行一直往下推）
      if (box.querySelectorAll('.sid-row').length < need || waitStill < LOCATE_WAIT_STILL) { schedule(); return }
      if (row === undefined || !row.isConnected) row = findRow()
      if (row === undefined) { schedule(); return }
      const rowRect = rectOf(row)
      // ② 高度又变了 ⇒ 目标被推下去：按新几何瞬时追随，本轮不判到位
      if (scrolled && scrollHeight !== scrollHeightAtScroll) {
        still = 0
        scrollHeightAtScroll = scrollHeight
        target = scrollRowIntoBox(box, rowRect, 'auto')
        schedule()
        return
      }
      // ③ 首滚：只有这一次用平滑（prefers-reduced-motion 时瞬时）
      if (!scrolled) {
        scrolled = true
        scrollHeightAtScroll = scrollHeight
        target = scrollRowIntoBox(box, rowRect, behavior)
        schedule()
        return
      }
      // ④ 三稳 3 帧：scrollTop 与目标行 rowTop（scrollHeight 由 ② 守住）
      const scrollTop = box.scrollTop
      const rowTop = Math.round(rowRect.top)
      if (scrollTop === lastScrollTop && rowTop === lastRowTop) still += 1
      else { lastScrollTop = scrollTop; lastRowTop = rowTop; still = 0 }
      if (still < LOCATE_SETTLE_FRAMES) { schedule(); return }
      // ⑤ 到位判据：整行在框内 且 真的画出来了
      const boxRect = rectOf(box)
      if (rowInsideBox(boxRect, rowRect) && rowPainted(row, rowRect)) { settle(true); return }
      // ⑥ 不达标：瞬时校正，上限 5 次；目标值不再变说明被滚到底夹住了，直接如实报失败
      if (corrections >= LOCATE_MAX_FIXES) { settle(false); return }
      corrections += 1
      trace.push({
        scrollTop: Math.round(scrollTop),
        rowTop,
        rowHeight: Math.round(rowRect.height),
        boxTop: Math.round(boxRect.top),
        boxHeight: Math.round(boxRect.height),
      })
      const next = scrollRowIntoBox(box, rowRect, 'auto')
      if (next === target) { settle(false); return }
      target = next
      still = 0
      schedule()
    }

    for (const type of LOCATE_CANCEL_EVENTS) box.addEventListener(type, onUserScroll, { passive: true })
    locateRunRef.current = handle
    schedule()
  }

  /**
   * 定位当前会话：太靠后先展开行数，再起一轮 rAF 状态机。
   * @param hint 用户手动点的（失败要提示）。
   */
  const locateCurrent = (hint: boolean): void => {
    if (current === undefined) {
      if (hint) setNote(String(t('panel.locateMissing')))
      return
    }
    const index = rows.findIndex((row) => row.id === current)
    if (index < 0) {
      if (hint) setNote(String(t('panel.locateMissing')))
      return
    }
    const need = index + 1
    // 分组视图渲染全量 rows，不受 MAX_ROWS 限制；平铺视图只能展开到上限，超了就说明白
    if (grouped === undefined && need > MAX_ROWS) {
      setNote(String(t('panel.locateBeyondLimit', { index: need, n: MAX_ROWS })))
      setVisibleCount((count) => (count >= MAX_ROWS ? count : MAX_ROWS))
      return
    }
    setNote(undefined)
    if (grouped === undefined && need > visibleCount) setVisibleCount(need)
    startLocate(hint, need)
  }

  React.useEffect(() => {
    if (view !== 'list' || !settings.autoLocate || located.current || autoLocateTried.current) return
    if (locateRunRef.current !== undefined) return
    if (current === undefined) return
    autoLocateTried.current = true
    locateCurrent(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 定位实现每次渲染重建，靠 ref 守卫「只试一次」
  }, [view, settings.autoLocate, shown.length, current])

  React.useEffect(() => () => { cancelLocate() }, [cancelLocate])

  const handleLocate = (): void => { locateCurrent(true) }

  const refreshTrash = React.useCallback((): void => {
    if (actions.listTrash === undefined) {
      setTrashItems([])
      return
    }
    setTrashError(undefined)
    void actions.listTrash().then((items) => { setTrashItems(items) })
      .catch((error: unknown) => { setTrashError(String((error as Error)?.message ?? error)) })
  }, [actions])

  React.useEffect(() => {
    if (view === 'trash') refreshTrash()
  }, [view, refreshTrash])

  const trashCount = trashItems?.length ?? 0
  const trashAllSelected = trashItems !== undefined && trashItems.length > 0 && trashItems.every((item) => trashSelected.has(item.name))

  const runPurgeTrash = (names: string[] | 'all'): void => {
    if (actions.purgeTrash === undefined) return
    setTrashBusy(true)
    void actions.purgeTrash(names).then((result) => {
      setTrashBusy(false)
      if (result.ok) {
        setPurgeAllConfirm(false)
        setTrashSelected(new Set<string>())
        refreshTrash()
      } else {
        setTrashError(result.message ?? String(t('panel.purgeFailed')))
      }
    }).catch((error: unknown) => {
      setTrashBusy(false)
      setTrashError(String((error as Error)?.message ?? error))
    })
  }

  const runRestoreTrash = (name: string): void => {
    if (actions.restoreTrash === undefined) return
    setTrashBusy(true)
    void actions.restoreTrash(name).then((result) => {
      setTrashBusy(false)
      if (result.ok) refreshTrash()
      else setTrashError(result.message ?? String(t('panel.restoreFailed')))
    }).catch((error: unknown) => {
      setTrashBusy(false)
      setTrashError(String((error as Error)?.message ?? error))
    })
  }

  const toggleTrashSelect = React.useCallback((name: string): void => {
    setTrashSelected((previous) => {
      const next = new Set(previous)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  // ── 多选与批量操作 ─────────────────────────────────────────────────────────

  const selectedRows = React.useMemo(
    () => rows.filter((row) => selected.has(row.id)),
    [rows, selected],
  )
  const selectedArchived = React.useMemo(
    () => selectedRows.filter((row) => isArchived(row)),
    [selectedRows, isArchived],
  )
  const selectedActiveCount = selectedRows.length - selectedArchived.length

  const toggleSelect = React.useCallback((sessionId: string): void => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }, [])

  const clearSelection = (): void => {
    setSelected(new Set<string>())
    setTrashSelected(new Set<string>())
    setBatchConfirm(false)
    setNote(undefined)
  }

  const runBatchCopy = (kind: CopyKind): void => {
    void copyToClipboard(selectedRows, kind, actions.paths).then((ok) => {
      setNote(ok
        ? String(t('panel.copiedSelected', { n: selectedRows.length }))
        : String(t('panel.copyFailed')))
    })
  }

  const runBatchHide = (hide: boolean): void => {
    if (hidden === undefined) return
    hidden.setMany(selectedRows.map((row) => row.id), hide)
    setNote(String(t('panel.batchDone', { n: selectedRows.length })))
    clearSelection()
  }

  const runBatchArchive = (mode: 'archive' | 'unarchive'): void => {
    const action = mode === 'archive' ? actions.archive : actions.unarchive
    if (action === undefined) return
    const targets = mode === 'archive' ? selectedRows.filter((row) => !isArchived(row)) : selectedArchived
    if (targets.length === 0) return
    setBatchBusy(true)
    void (async () => {
      let done = 0
      let failed = 0
      for (const row of targets) {
        try {
          const result = await action(row.id)
          if (result.ok) done += 1
          else failed += 1
        } catch { failed += 1 }
      }
      setNote(failed === 0
        ? String(t('panel.batchDone', { n: done }))
        : `${String(t('panel.batchDone', { n: done }))}，${String(t('panel.batchFailed', { n: failed }))}`)
      setBatchBusy(false)
      clearSelection()
    })()
  }

  const runBatchDelete = (purge: boolean): void => {
    if (actions.remove === undefined || selectedRows.length === 0) return
    setBatchBusy(true)
    void (async () => {
      let done = 0
      let failed = 0
      for (const row of selectedRows) {
        try {
          const result = await actions.remove?.(row.id, purge)
          if (result?.ok === true) done += 1
          else failed += 1
        } catch { failed += 1 }
      }
      setNote(failed === 0
        ? String(t('panel.batchDone', { n: done }))
        : `${String(t('panel.batchDone', { n: done }))}，${String(t('panel.batchFailed', { n: failed }))}`)
      setBatchBusy(false)
      setBatchConfirm(false)
      clearSelection()
    })()
  }

  const handleBatchDeleteClick = (): void => {
    if (settings.deleteNoConfirm) runBatchDelete(settings.deleteMode === 'purge')
    else setBatchConfirm(true)
  }

  const hiddenCount = React.useMemo(
    () => allRows.filter((row) => hiddenSet.has(row.id)).length,
    [allRows, hiddenSet],
  )

  /** 当前筛选结果是否已全选（只驱动「再点一次 = 全部取消」的行为，不改按钮文案）。 */
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  /** 渲染一行（供平铺与分组两处复用）。 */
  const renderRow = (row: SessionSummary): React.ReactElement => (
    <SessionRow
      key={row.id}
      session={row}
      isCurrent={row.id === current}
      isArchived={isArchived(row)}
      isHidden={hiddenSet.has(row.id)}
      isSubagent={isSubagentRow(row)}
      selected={selected.has(row.id)}
      actions={actions}
      hidden={hidden}
      settings={settings}
      canDelete={actions.remove !== undefined}
      onToggleSelect={toggleSelect}
      onClose={onClose}
      t={t}
    />
  )


  const batchDisabled = selectedRows.length === 0 || batchBusy

  return createPortal(
    <div className="sid-overlay" role="presentation" data-dsh-plugin={SESSION_ID_PLUGIN_ATTR}>
      <div className="sid-mask" aria-hidden="true" onPointerDown={onClose} onClick={onClose} />
      <div
        className="sid-panel"
        data-dsh-part={SESSION_ID_PART.panel}
        role="dialog"
        aria-modal="true"
        aria-label={String(t('panel.title'))}
        style={{ '--sid-panel-width': panelWidthCss(settings) } as React.CSSProperties}
      >
        <div className="sid-header">
          <div className="sid-heading">
            {
              // 计数与标题同一行（不再单独占一行）
            }
            <h2 className="sid-title">
              {t('panel.title')}
              <span className="sid-count-inline">
                {view === 'trash'
                  ? String(t('panel.trash.count', { n: trashCount }))
                  : view === 'hidden'
                    ? String(t('panel.trash.count', { n: hiddenCount }))
                    : String(t('panel.subtitle', { n: allRows.length }))}
                {view === 'list'
                  ? ` · ${String(t('panel.shown', { n: shown.length, total: rows.length }))}`
                  : ''}
              </span>
            </h2>
          </div>
          <div className="sid-head-actions">
            {hidden !== undefined
              ? (
                <button
                  type="button"
                  className="sid-icon-btn"
                  data-on={view === 'hidden' ? 'true' : 'false'}
                  data-dsh-part={SESSION_ID_PART.hiddenArea}
                  title={String(t('panel.unhideTitle'))}
                  onClick={() => { setView(view === 'hidden' ? 'list' : 'hidden'); setShowSettings(false); clearSelection() }}
                >
                  <EyeOffIcon width={13} height={13} />
                  {t('panel.hiddenArea')}{hiddenCount > 0 ? `（${hiddenCount}）` : ''}
                </button>
              )
              : null}
            {actions.listTrash !== undefined
              ? (
                <button
                  type="button"
                  className="sid-icon-btn"
                  data-tone="trash"
                  data-on={view === 'trash' ? 'true' : 'false'}
                  data-dsh-part={SESSION_ID_PART.trash}
                  title={String(t('panel.trashTitle'))}
                  onClick={() => {
                    if (view === 'trash') setView('list')
                    else { setView('trash'); setShowSettings(false) }
                    clearSelection()
                  }}
                >
                  <TrashIcon width={13} height={13} />
                  {t('panel.trash')}{trashCount > 0 ? `（${trashCount}）` : ''}
                </button>
              )
              : null}
            <button
              type="button"
              className="sid-icon-btn"
              data-on={showSettings ? 'true' : 'false'}
              title={String(t('panel.settingsTitle'))}
              onClick={() => { setShowSettings((value) => !value) }}
            >
              {t('panel.settings')}
            </button>
            <button
              type="button"
              className="sid-close"
              data-dsh-part={SESSION_ID_PART.close}
              aria-label={String(t('panel.close'))}
              title={String(t('panel.close'))}
              onPointerDown={onClose}
              onClick={onClose}
            >
              <CloseIcon width={13} height={13} />
              <span className="sid-close-label">{t('panel.close')}</span>
            </button>
          </div>
        </div>

        {showSettings
          ? (
            <div className="sid-settings">
              {
                // 网格排版：左列标签、右列控件组。控件组内部横排 + 可换行，
                // 比上一版「每项一行、各占一行又长短不齐」紧凑得多。
              }
              <div className="sid-settings-grid">
                <span className="sid-settings-label">{t('panel.setting.defaultFilter')}</span>
                <div className="sid-settings-group">
                  <select
                    className="sid-select"
                    value={settings.defaultFilter}
                    onChange={(event) => { onSettingsChange({ defaultFilter: event.target.value as DefaultFilterSetting }) }}
                  >
                    <option value="all">{t('panel.filter.all')}</option>
                    <option value="hideArchived">{t('panel.filter.active')}</option>
                    <option value="onlyArchived">{t('panel.filter.archived')}</option>
                    <option value="last">{t('panel.filter.followLast')}</option>
                  </select>
                  <label className="sid-action" data-tone="locate" data-on={settings.autoLocate ? 'true' : 'false'} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.autoLocate} style={{ margin: 0 }} onChange={(event) => { onSettingsChange({ autoLocate: event.target.checked }) }} />
                    {t('panel.autoscroll')}
                  </label>
                  <label className="sid-action" data-tone="neutral" data-on={settings.grouped ? 'true' : 'false'} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.grouped} style={{ margin: 0 }} onChange={(event) => { onSettingsChange({ grouped: event.target.checked }) }} />
                    {t('panel.groupByTitle')}
                  </label>
                  <label className="sid-action" data-tone="neutral" data-on={settings.closeOnOpen ? 'true' : 'false'} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.closeOnOpen} style={{ margin: 0 }} onChange={(event) => { onSettingsChange({ closeOnOpen: event.target.checked }) }} />
                    {t('panel.setting.closeOnOpen')}
                  </label>
                </div>

                <span className="sid-settings-label">{t('panel.setting.deleteMode')}</span>
                <div className="sid-settings-group">
                  <select
                    className="sid-select"
                    value={settings.deleteMode}
                    onChange={(event) => { onSettingsChange({ deleteMode: event.target.value as DeleteMode }) }}
                  >
                    <option value="trash">{t('panel.deleteMode.trash')}</option>
                    <option value="purge">{t('panel.deleteMode.purge')}</option>
                  </select>
                  <label className="sid-action" data-tone="danger" data-on={settings.deleteNoConfirm ? 'true' : 'false'} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.deleteNoConfirm} style={{ margin: 0 }} onChange={(event) => { onSettingsChange({ deleteNoConfirm: event.target.checked }) }} />
                    {t('panel.setting.deleteNoConfirm')}
                  </label>
                  <label className="sid-action" data-tone="danger" data-on={settings.purgeNoConfirm ? 'true' : 'false'} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.purgeNoConfirm} style={{ margin: 0 }} onChange={(event) => { onSettingsChange({ purgeNoConfirm: event.target.checked }) }} />
                    {t('panel.setting.purgeNoConfirm')}
                  </label>
                </div>

                <span className="sid-settings-label">{t('panel.setting.panelWidth')}</span>
                {
                  // 两种模式互斥（勾了自适应，固定那行禁用；反之亦然），各自独立成行：
                  //   第 1 行 = 自适应：开关 + 百分比输入 + 单位 + 预设 chip
                  //   第 2 行 = 固定宽：像素输入 + 单位 + 预设 chip
                  // 输入框都做成只放得下 4 位数的窄框（用户要求）。
                }
                <div className="sid-settings-group sid-settings-stack">
                  {
                    // 两行各是一个**模式按钮**：
                    //   第 1 行 = 自适应（点按钮或点 chip 或改输入框，都会切到自适应）
                    //   第 2 行 = 固定宽（同上）
                    // 所以点 70/80/90 或 700/860/1080 会连模式一起切换，不需要先切模式。
                  }
                  <div className="sid-settings-line">
                    <button
                      type="button"
                      className="sid-action"
                      data-tone="locate"
                      data-on={settings.autoWidth ? 'true' : 'false'}
                      title={String(t('panel.width.autoTitle'))}
                      onClick={() => { onSettingsChange({ autoWidth: true }) }}
                    >
                      {t('panel.width.auto')}
                    </button>
                    <input
                      type="number"
                      className="sid-num"
                      min={AUTO_WIDTH_RANGE.min}
                      max={AUTO_WIDTH_RANGE.max}
                      step={1}
                      value={settings.autoWidthPercent}
                      title={String(t('panel.width.autoTitle'))}
                      onChange={(event) => {
                        const next = Number(event.target.value)
                        onSettingsChange({
                          autoWidth: true,
                          autoWidthPercent: Number.isFinite(next) ? next : DEFAULT_AUTO_WIDTH_PERCENT,
                        })
                      }}
                    />
                    <span className="sid-settings-hint">{t('panel.width.autoHint')}</span>
                    {[70, 80, 90].map((preset) => (
                      <button
                        key={`auto-${preset}`}
                        type="button"
                        className="sid-chip"
                        data-on={settings.autoWidth && settings.autoWidthPercent === preset ? 'true' : 'false'}
                        onClick={() => { onSettingsChange({ autoWidth: true, autoWidthPercent: preset }) }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div className="sid-settings-line">
                    <button
                      type="button"
                      className="sid-action"
                      data-tone="locate"
                      data-on={settings.autoWidth ? 'false' : 'true'}
                      title={String(t('panel.width.fixedTitle'))}
                      onClick={() => { onSettingsChange({ autoWidth: false }) }}
                    >
                      {t('panel.width.fixed')}
                    </button>
                    <input
                      type="number"
                      className="sid-num"
                      min={PANEL_WIDTH_RANGE.min}
                      max={PANEL_WIDTH_RANGE.max}
                      step={1}
                      value={settings.panelWidth}
                      title={String(t('panel.width.fixedTitle'))}
                      onChange={(event) => {
                        const next = Number(event.target.value)
                        onSettingsChange({
                          autoWidth: false,
                          panelWidth: Number.isFinite(next) ? next : DEFAULT_PANEL_WIDTH,
                        })
                      }}
                    />
                    <span className="sid-settings-hint">{t('panel.width.fixedHint')}</span>
                    {[700, 860, 1080].map((preset) => (
                      <button
                        key={`fixed-${preset}`}
                        type="button"
                        className="sid-chip"
                        data-on={!settings.autoWidth && settings.panelWidth === preset ? 'true' : 'false'}
                        onClick={() => { onSettingsChange({ autoWidth: false, panelWidth: preset }) }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )
          : null}

        {view === 'trash'
          ? (
            <>
              {trashError === undefined ? null : <div className="sid-error">{trashError}</div>}
              {
                // 与隐藏区同一条选择栏：勾选 → 批量彻底删除；「清空回收站」钉在最右端
              }
              <div className="sid-batch" data-active={trashSelected.size > 0 ? 'true' : 'false'} data-dsh-part={SESSION_ID_PART.batch}>
                <button
                  type="button"
                  className="sid-action"
                  data-tone="neutral"
                  disabled={trashCount === 0}
                  onClick={() => { setTrashSelected(trashAllSelected ? new Set<string>() : new Set((trashItems ?? []).map((item) => item.name))) }}
                >
                  {t('panel.selectAll')}
                </button>
                <button
                  type="button"
                  className="sid-action"
                  data-tone="neutral"
                  disabled={trashSelected.size === 0}
                  onClick={() => { setTrashSelected(new Set<string>()); setPurgeAllConfirm(false) }}
                >
                  {t('panel.clearSelection')}
                </button>
                {actions.purgeTrash === undefined
                  ? null
                  : (
                    <button
                      type="button"
                      className="sid-action"
                      data-tone="danger"
                      disabled={trashSelected.size === 0 || trashBusy}
                      onClick={() => { runPurgeTrash([...trashSelected]) }}
                    >
                      {t('panel.deletePurge')}
                    </button>
                  )}
                <span className="sid-batch-count">
                  {trashSelected.size > 0 ? String(t('panel.selected', { n: trashSelected.size })) : ''}
                </span>
                {purgeAllConfirm
                  ? (
                    <button type="button" className="sid-action" data-tone="danger" disabled={trashBusy} onClick={() => { runPurgeTrash('all') }}>
                      {t('panel.deletePurge')}
                    </button>
                  )
                  : null}
                {actions.purgeTrash === undefined
                  ? null
                  : (
                    <button
                      type="button"
                      className="sid-action sid-batch-tail"
                      data-tone="danger"
                      title={String(t('panel.trash.purgeAllConfirm', { n: trashCount }))}
                      disabled={trashCount === 0 || trashBusy}
                      onClick={() => {
                        if (settings.purgeNoConfirm) runPurgeTrash('all')
                        else setPurgeAllConfirm(true)
                      }}
                    >
                      <TrashIcon width={12} height={12} />
                      {`${String(t('panel.trash.purgeAll'))}（${trashCount}）`}
                    </button>
                  )}
              </div>
              {trashItems !== undefined && trashItems.length === 0
                ? <div className="sid-empty">{t('panel.trash.empty')}</div>
                : (
                  <div className="sid-list">
                    {(trashItems ?? []).map((item) => (
                      <TrashRow
                        key={item.name}
                        item={item}
                        title={item.sessionId === undefined ? undefined : snapshot.byId[item.sessionId]?.displayTitle}
                        selected={trashSelected.has(item.name)}
                        busy={trashBusy}
                        onToggleSelect={toggleTrashSelect}
                        onRestore={actions.restoreTrash === undefined ? undefined : runRestoreTrash}
                        onPurge={actions.purgeTrash === undefined ? undefined : (name: string) => { runPurgeTrash([name]) }}
                        t={t}
                      />
                    ))}
                  </div>
                )}
            </>
          )
          : (
            <>
              {
                // 批量操作条常驻：勾选后按钮才可用
              }
              <div className="sid-batch" data-active={selectedRows.length > 0 ? 'true' : 'false'} data-dsh-part={SESSION_ID_PART.batch}>
                <button type="button" className="sid-action" data-tone="copy" disabled={batchDisabled} title={String(t('panel.copyIdTitle'))} onClick={() => { runBatchCopy('id') }}>
{t('panel.copyId')}
                </button>
                <button type="button" className="sid-action" data-tone="copy" disabled={batchDisabled} title={String(t('panel.copyNameTitle'))} onClick={() => { runBatchCopy('name') }}>
{t('panel.copyName')}
                </button>
                <button type="button" className="sid-action" data-tone="copy" disabled={batchDisabled} title={String(t('panel.copyPathTitle'))} onClick={() => { runBatchCopy('path') }}>
{t('panel.copyPath')}
                </button>
                {actions.archive !== undefined
                  ? (
                    <button type="button" className="sid-action" data-tone="archive" disabled={batchDisabled || selectedActiveCount === 0} onClick={() => { runBatchArchive('archive') }}>
{t('panel.batchArchive')}
                    </button>
                  )
                  : null}
                {actions.unarchive !== undefined
                  ? (
                    <button type="button" className="sid-action" data-tone="unarchive" disabled={batchDisabled || selectedArchived.length === 0} onClick={() => { runBatchArchive('unarchive') }}>
{t('panel.batchUnarchive')}
                    </button>
                  )
                  : null}
                {hidden !== undefined
                  ? (
                    <button
                      type="button"
                      className="sid-action"
                      data-tone="neutral"
                      disabled={batchDisabled}
                      onClick={() => {
                        // 隐藏区里点「隐藏」等于取消隐藏；列表里等于隐藏
                        runBatchHide(view !== 'hidden')
                      }}
                    >

                      {view === 'hidden' ? t('panel.unhide') : t('panel.hide')}
                    </button>
                  )
                  : null}
                {actions.remove !== undefined
                  ? (batchConfirm
                    ? (
                      <span className="sid-confirm">
                        {t('panel.deleteConfirm')}
                        <button type="button" className="sid-action" data-tone="danger" disabled={batchBusy} onClick={() => { runBatchDelete(false) }}>
                          {t('panel.deleteTrash')}
                        </button>
                        <button type="button" className="sid-action" data-tone="danger" disabled={batchBusy} onClick={() => { runBatchDelete(true) }}>
                          {t('panel.deletePurge')}
                        </button>
                        <button type="button" className="sid-action" data-tone="neutral" onClick={() => { setBatchConfirm(false) }}>
                          {t('panel.deleteNo')}
                        </button>
                      </span>
                    )
                    : (
                      <button type="button" className="sid-action" data-tone="danger" disabled={batchDisabled} onClick={handleBatchDeleteClick}>
{t('panel.batchDelete')}
                      </button>
                    ))
                  : null}
                {
                  // 文案始终是「全选」（不切成「全不选」），但**功能是切换**：
                  // 已全选时再点一次 = 全部取消选择；未全选时点 = 选中当前筛选结果的全部。
                }
                <button
                  type="button"
                  className="sid-action"
                  data-tone="neutral"
                  onClick={() => { setSelected(allSelected ? new Set<string>() : new Set(rows.map((row) => row.id))) }}
                >
                  {t('panel.selectAll')}
                </button>
                <button type="button" className="sid-action" data-tone="neutral" disabled={selectedRows.length === 0} onClick={clearSelection}>
                  {t('panel.clearSelection')}
                </button>
                {view === 'hidden' && hidden !== undefined
                  ? (
                    <button type="button" className="sid-action" data-tone="unarchive" disabled={hiddenCount === 0} onClick={() => { hidden.clear(); setNote(undefined) }}>
                      {t('panel.unhideAll')}
                    </button>
                  )
                  : null}
                {
                  // 右端只放一个短标签：有操作结果就显示结果，否则显示已选数量，
                  // 未选中时不显示任何文字（空着即可）。它与操作按钮同一行，不换行。
                }
                <span className="sid-batch-count sid-batch-tail">
                  {note !== undefined
                    ? note
                    : selectedRows.length > 0
                      ? String(t('panel.selected', { n: selectedRows.length }))
                      : ''}
                </span>
              </div>

              {view === 'list'
                ? (
                  <div className="sid-toolbar" data-dsh-part={SESSION_ID_PART.toolbar}>
                    <input
                      type="search"
                      className="sid-search"
                      data-dsh-part={SESSION_ID_PART.search}
                      placeholder={String(t('panel.search.placeholder'))}
                      aria-label={String(t('panel.search.aria'))}
                      value={search}
                      onChange={(event) => { setSearch(event.target.value) }}
                    />
                    {
                      // 搜索范围：全部（名称 + ID）/ 只搜 ID / 只搜名称
                    }
                    <select
                      className="sid-select sid-select-narrow"
                      data-dsh-part={SESSION_ID_PART.searchScope}
                      title={String(t('panel.searchScope.label'))}
                      value={settings.searchScope}
                      onChange={(event) => { onSettingsChange({ searchScope: event.target.value as SearchScope }) }}
                    >
                      <option value="all">{t('panel.searchScope.all')}</option>
                      <option value="id">{t('panel.searchScope.id')}</option>
                      <option value="name">{t('panel.searchScope.name')}</option>
                    </select>
                    <select
                      className="sid-select"
                      data-dsh-part={SESSION_ID_PART.sort}
                      title={String(t('panel.sort.label'))}
                      value={sortMode}
                      onChange={(event) => { setSortMode(event.target.value as SortMode) }}
                    >
                      <option value="updatedDesc">{t('panel.sort.updatedDesc')}</option>
                      <option value="updatedAsc">{t('panel.sort.updatedAsc')}</option>
                      <option value="title">{t('panel.sort.title')}</option>
                    </select>
                    <select
                      className="sid-select"
                      data-dsh-part={SESSION_ID_PART.filter}
                      title={String(t('panel.filter.label'))}
                      value={filter}
                      onChange={(event) => {
                        const next = event.target.value as FilterChoice
                        setFilter(next)
                        onSettingsChange({ lastFilter: next })
                      }}
                    >
                      <option value="all">{t('panel.filter.all')}</option>
                      <option value="hideArchived">{t('panel.filter.active')}</option>
                      <option value="onlyArchived">{t('panel.filter.archived')}</option>
                    </select>
                    <select
                      className="sid-select"
                      data-dsh-part={SESSION_ID_PART.subagent}
                      title={String(t('panel.subagentFilter.label'))}
                      value={settings.subagentFilter}
                      onChange={(event) => { onSettingsChange({ subagentFilter: event.target.value as SubagentFilter }) }}
                    >
                      <option value="all">{t('panel.subagentFilter.all')}</option>
                      <option value="hide">{t('panel.subagentFilter.hide')}</option>
                      <option value="only">{t('panel.subagentFilter.only')}</option>
                    </select>
                    {workspaces !== undefined
                      ? (
                        <select
                          className="sid-select"
                          data-dsh-part={SESSION_ID_PART.workspace}
                          title={String(t('panel.workspaceFilter.label'))}
                          value={settings.workspaceFilter}
                          onChange={(event) => { onSettingsChange({ workspaceFilter: event.target.value }) }}
                        >
                          <option value="">{t('panel.workspaceFilter.all')}</option>
                          <option value={UNGROUPED_KEY}>{t('panel.ungrouped')}</option>
                          {workspaceItems.map((workspace) => {
                            const key = workspace.workspaceId ?? workspace.id ?? workspace.path ?? ''
                            if (key === '') return null
                            return (
                              <option key={key} value={key}>
                                {workspace.title ?? workspace.path ?? String(t('panel.groupUnknown'))}
                              </option>
                            )
                          })}
                        </select>
                      )
                      : null}
                    <button
                      type="button"
                      className="sid-action"
                      data-tone="locate"
                      data-dsh-part={SESSION_ID_PART.locate}
                      title={String(t('panel.locate'))}
                      onClick={handleLocate}
                    >
                      <LocateIcon width={12} height={12} />
                      {t('panel.locate')}
                    </button>
                  </div>
                )
                : null}

              {rows.length === 0
                ? (
                  <div className="sid-empty">
                    {view === 'hidden'
                      ? t('panel.hiddenEmpty')
                      : query === '' ? t('panel.empty') : t('panel.noMatches')}
                  </div>
                )
                : (
                  <div className="sid-list" data-dsh-part={SESSION_ID_PART.list} ref={listRef}>
                    {grouped === undefined
                      ? shown.map((row) => renderRow(row))
                      : grouped.map((group) => (
                        <div className="sid-group" key={group.title}>
                          <div className="sid-group-title" data-ungrouped={group.ungrouped ? 'true' : 'false'}>
                            {group.title}
                            <span className="sid-group-count">· {group.rows.length}</span>
                          </div>
                          {group.rows.map((row) => renderRow(row))}
                        </div>
                      ))}
                    {grouped === undefined && remaining > 0 && shown.length < MAX_ROWS
                      ? (
                        <button
                          type="button"
                          className="sid-more"
                          data-dsh-part={SESSION_ID_PART.more}
                          onClick={() => { setVisibleCount((count) => count + ROW_PAGE) }}
                        >
                          {String(t('panel.more', { n: remaining }))}
                        </button>
                      )
                      : null}
                  </div>
                )}
            </>
          )}
      </div>
    </div>,
    document.body,
  )
}
