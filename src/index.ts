/**
 * dsh-session-id —— host 半边。
 *
 * 三件事：
 *   ① **自检出口**：把页面里自己的状态暴露成回环 HTTP 路由（client 插件跑在渲染
 *      进程里，从终端看不见它，靠这条链路区分「没装上/没执行/席位没渲染」）。
 *   ② **删除会话**：官方没有删除会话的 API（只有归档），文件系统层面只能在这里做。
 *   ③ **回收站**：删除默认移入 `$DSH_HOME/sessions-trash/`，可列出 / 恢复 / 彻底删。
 *
 * 「彻底删除」清什么（对齐官方存储布局）：
 *   - 会话目录 `$DSH_HOME/sessions/<编码cwd>/<sessionId>/`
 *   - 投影缓存 `$DSH_HOME/storages/session_projcache/sessions/<id>.json`
 *     （官方 README 原文：投影缓存**无淘汰接口**，清理属"带外维护"——即由外部删文件）
 *   - 归档/pin 记录：由 **client 半边**调官方 `uiWorkspace.unarchiveSession` 清
 *     （workspace.json 是 domain store，直接改文件会被内存态覆盖，所以不走文件）
 *
 * 安全：所有路由只接受回环地址；只接受 session id 形状，路径一律由 id 反查得出
 * （不接受调用方给路径），删除前再校验前缀。
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

export const name = 'dsh-session-id'

/** 需要回环 HTTP 路由（client 用它上报状态、执行删除与回收站操作）。 */
export const inject = ['webServer']

/** 最多保留多少条上报（环形缓冲）。 */
const MAX_REPORTS = 24

/** 内存中的上报历史，最新在末尾。 */
const reports = []

/**
 * 合法会话 id。
 *
 * 两种形态都要认：
 *   - 普通会话 `session-<uuid>`；
 *   - **子代理会话是裸 uuid**（本机 32 个 origin=subagent 全是这个形态）。
 * 同时必须**拒绝任何非 uuid 字符**（路径分隔符、`..`）——目录一律由 id 反查得出，
 * 这里只是第一道闸。
 */
const SESSION_ID_RE = /^(?:session-)?[0-9a-fA-F][0-9a-fA-F-]{7,63}$/

/** 回收站条目里记录原路径的元数据文件名。 */
const TRASH_META = 'trash-meta.json'

/** 待下发给页面的自检指令（一次性）。 */
let pendingCommand = null

/** 自检指令序号。 */
let commandSeq = 0

/** 取走待下发指令（取即清空）。 */
function takeCommand() {
  const command = pendingCommand
  pendingCommand = null
  return command
}

/** DSH home 目录（与宿主进程一致）。 */
function dshHome() {
  const fromEnv = process.env.DSH_HOME
  return typeof fromEnv === 'string' && fromEnv !== '' ? fromEnv : join(homedir(), '.dsh')
}

/** `sessions/` 根。 */
function sessionsRoot() {
  return join(dshHome(), 'sessions')
}

/** 回收站根。 */
function trashRoot() {
  return join(dshHome(), 'sessions-trash')
}

/**
 * 把回收站条目名解析成绝对路径（**不做**命名格式白名单）。
 *
 * 历史条目不一定符合本插件当前的 `<时间戳>-<会话 id>` 命名：例如事故期的
 * `session-<uuid>.pre-turnfix-<时间戳>` 是手工放进去的真目录，用格式白名单会被永久拒删。
 * 这里只做路径安全校验：单段名、无上级引用、无控制字符、解析后必须落在回收站根之下。
 * @param name 条目名。
 * @returns 绝对路径；不安全时返回 `undefined`。
 */
function trashEntryPath(name) {
  if (typeof name !== 'string' || name === '' || name === '.' || name === '..') return undefined
  if (/[\\/]/.test(name)) return undefined
  if (/[\u0000-\u001f]/.test(name)) return undefined
  const root = trashRoot()
  const dir = join(root, name)
  if (!dir.startsWith(root.endsWith(sep) ? root : `${root}${sep}`)) return undefined
  return dir
}

/**
 * 从回收站条目名里解析会话 id（兼容 `<时间戳>-<id>` 与 `<id>.后缀` 两种历史形态）。
 * @param name 条目名。
 * @returns 会话 id；解析不出返回 `undefined`。
 */
function sessionIdFromTrashName(name) {
  const match = /(?:session-)?[0-9a-fA-F][0-9a-fA-F-]{7,63}/.exec(name)
  return match === null ? undefined : match[0]
}

/** 投影缓存目录（per-record 布局：每个会话一个 `<id>.json`）。 */
function projcacheSessionsDir() {
  return join(dshHome(), 'storages', 'session_projcache', 'sessions')
}

/** 端点标题缓存的有效期（含负缓存：读不到也记 60s，避免每次都去摸盘）。 */
const TITLE_TTL_MS = 60_000

/** 端点标题缓存：会话 id → `{ at, title }`（`title === undefined` 即负缓存）。 */
const titleCache = new Map()

/**
 * 把投影缓存里的 `record.rows.title.val` 洗成可读标题。
 *
 * 本机实测三种形态：
 *   ① 子代理的 title 是 `<system-reminder> You are teammate "p1-p`（被截断、无闭合引号）；
 *   ② 以 `<` 开头的标签块；
 *   ③ 正常的首行任务名（中文居多）。
 * @param raw 原始 title。
 * @returns 可读标题；洗不出内容时返回 undefined。
 */
function cleanProjectionTitle(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined
  let text = raw
  const teammate = /You are teammate "([^"\n]{1,60})/.exec(text)
  if (teammate !== null) {
    text = teammate[1].replace(/["',;:.!?]+$/, '')
  } else if (text.trimStart().startsWith('<')) {
    text = text.replace(/<[^>]*>[\s\S]*?<\/[^>]*>/g, ' ')
    // 整个值就是一个标签块时上面的替换会把内容一起吃掉，退一步只剥标签保留文字。
    if (text.trim() === '') text = raw.replace(/<[^>]*>/g, ' ')
  }
  const firstLine = text.split('\n')[0].replace(/\s+/g, ' ').trim()
  if (firstLine === '') return undefined
  return firstLine.slice(0, 40)
}

/**
 * 把子代理的注册名（`record.rows.subagent.val.identity.label` / `.val.label`）洗成可读标题。
 *
 * 这是子代理**真实注册名/任务名**（实测形如「核验员V11：P7.3文档一致性」「查插件代码事实」），
 * 比 `title.val` 里被截断的 teammate 串（`<system-reminder> You are teammate "v11-` → `v11-`）可读得多。
 * @param raw 原始 label。
 * @returns 压空白 + 剥控制字符 + 截 40 字后的标题；不是字符串或为空时返回 undefined。
 */
function cleanIdentityLabel(raw) {
  if (typeof raw !== 'string') return undefined
  const text = raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (text === '') return undefined
  return text.slice(0, 40)
}

/**
 * 读某个会话的投影缓存标题（60s 缓存 + 负缓存）。
 *
 * 取值优先级：`rows.subagent.val.identity.label` → `rows.subagent.val.label` → `rows.title.val` 清洗。
 * 前两者是子代理注册名，只有它们都没有时才退回 title 清洗（普通会话走的正是这条回退路径）。
 * @param sessionId 会话 id（调用方已过 SESSION_ID_RE）。
 * @returns 可读标题；没有缓存文件 / 读不出 / 洗不净时返回 undefined。
 */
function projectionTitleOf(sessionId) {
  const now = Date.now()
  const hit = titleCache.get(sessionId)
  if (hit !== undefined && now - hit.at < TITLE_TTL_MS) return hit.title
  const dir = projcacheSessionsDir()
  const bare = sessionId.replace(/^session-/, '')
  let title
  for (const name of [`${sessionId}.json`, `${bare}.json`]) {
    const file = join(dir, name)
    if (!existsSync(file)) continue
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'))
      const rows = parsed?.record?.rows
      title = cleanIdentityLabel(rows?.subagent?.val?.identity?.label)
        ?? cleanIdentityLabel(rows?.subagent?.val?.label)
        ?? cleanProjectionTitle(rows?.title?.val)
    } catch {
      title = undefined
    }
    break
  }
  if (titleCache.size > 4000) titleCache.clear()
  titleCache.set(sessionId, { at: now, title })
  return title
}

/**
 * 按 session id 在 `sessions/` 根下反查会话目录。
 *
 * 布局是 `sessions/<编码后的 cwd>/<sessionId>/`；这里不复刻编码规则，直接扫一级
 * 子目录找同名 id 目录（id 是 uuid，不会重名）。
 * @param sessionId 会话 id。
 * @returns 目录绝对路径；找不到返回 undefined。
 */
function findSessionDir(sessionId) {
  const root = sessionsRoot()
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return undefined
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const candidate = join(root, entry.name, sessionId)
    if (existsSync(candidate)) return candidate
  }
  return undefined
}

/**
 * 建一份「会话 id → 会话目录」索引：扫 `sessions/` 下两层目录，一次读完。
 *
 * 面板的「路径」按钮一次可能问上百个 id，逐个反查会把 `sessions/` 反复读多遍，
 * 所以这里整表扫一遍再配对。
 * @returns id 到目录绝对路径的 Map。
 */
function sessionDirIndex() {
  const index = new Map()
  const root = sessionsRoot()
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return index
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = join(root, entry.name)
    let children
    try {
      children = readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const child of children) {
      if (child.isDirectory()) index.set(child.name, join(dir, child.name))
    }
  }
  return index
}

/**
 * 删掉某个会话的投影缓存文件（**兜底路径**）。
 *
 * 文件名有两种形态（会话 id 带不带 `session-` 前缀），两个都试。
 * 官方域 API 可用时优先走 {@link purgeProjectionViaDomain}——直接删文件虽然立刻生效
 * （该 backend 无 fs.watch、per-record unit 无内存态），但 domain 层内存里还留着记录。
 * @param sessionId 会话 id。
 * @returns 删掉的文件数。
 */
function purgeProjectionFiles(sessionId) {
  const dir = projcacheSessionsDir()
  const bare = sessionId.replace(/^session-/, '')
  let removed = 0
  for (const name of [`${sessionId}.json`, `${bare}.json`]) {
    const file = join(dir, name)
    if (!existsSync(file)) continue
    try {
      rmSync(file, { force: true })
      removed += 1
    } catch { /* 删不掉就留着，不影响主流程 */ }
  }
  return removed
}

/**
 * 清掉某个会话的投影缓存。
 *
 * 两条路**都要走**：
 *   ① 官方域 API `storageDomain.get('session_projcache').table('sessions').delete(id)`：
 *      删文件 + 删本进程内存 + 广播变更——但它的实现里有一句
 *      `if (!this.records.has(key)) return false`，**只对「本进程加载过的记录」生效**；
 *   ② 直接删文件：兜住**别的进程刚写入、本进程内存里没有**的记录（实测就是这样：
 *      域 API 返回成功但文件还在）。
 * 顺序上先试①再②，既能清内存态，又能保证文件真的没了。
 * @param ctx host 上下文。
 * @param sessionId 会话 id。
 * @returns `{ viaDomain, filesRemoved }`。
 */
async function purgeProjection(ctx, sessionId) {
  const bare = sessionId.replace(/^session-/, '')
  let viaDomain = false
  try {
    const table = ctx?.get?.('storageDomain')?.get?.('session_projcache')?.table?.('sessions')
    if (typeof table?.delete === 'function') {
      viaDomain = true
      for (const key of [sessionId, bare]) {
        try {
          await table.delete(key)
        } catch { /* 键不存在等情形忽略 */ }
      }
    }
  } catch { /* 服务不可用 → 只走文件 */ }
  return { viaDomain, filesRemoved: purgeProjectionFiles(sessionId) }
}

/**
 * 删除前先让该会话的活动停下来（定时任务等 provider）。
 *
 * 官方 `archiveSession(id, {stopActivity:true})` 会走 `workspace/session-stop` 瀑布停
 * 各 provider 的活动；这里在**删目录之前**单独停一遍 schedule，避免"边跑边删"。
 * @param ctx host 上下文。
 * @param sessionId 会话 id。
 */
async function quiesceSession(ctx, sessionId) {
  try {
    await ctx?.get?.('schedule')?.stopSessionTasks?.(sessionId)
  } catch { /* 服务不可用或没有任务：忽略 */ }
}

/**
 * 彻底清理某个会话的**全部关联数据**（清目录之后调用）。
 *
 * 官方各服务都提供了对应的清理入口（都是幂等的），优先用它们；拿不到服务时退到删文件：
 *   - 投影缓存 `session_projcache`：`storageDomain.get('session_projcache').table('sessions').delete(id)`
 *   - 归档 / 置顶 / 工作区记账：`workspaceRegistry.unarchiveSession / unpinSession / entity.detachSession`
 *   - 定时任务残留行：逐条 `schedule.delete`
 *   - 第三方插件的 per-session 状态文件：按已知布局删（不存在就跳过）
 *
 * 注意：**不要**把 `storages/session_projcache/sessions/` 删空——官方有个 legacy 整体文件
 * `session_projcache.json`，该目录一旦一个记录不剩，下次启动会从它 bootstrap 重建旧记录。
 * 这里只删指定会话，不批量清空。
 * @param ctx host 上下文。
 * @param sessionId 会话 id。
 * @returns 清理明细（给调用方与自检看）。
 */
async function purgeRelatedData(ctx, sessionId) {
  const detail = {
    projectionViaDomain: false,
    projectionFiles: 0,
    unarchived: false,
    unpinned: false,
    detached: 0,
    scheduleRemoved: 0,
    pluginFiles: 0,
  }

  // ① 投影缓存
  const projection = await purgeProjection(ctx, sessionId)
  detail.projectionViaDomain = projection.viaDomain
  detail.projectionFiles = projection.filesRemoved

  // ② 归档 / 置顶 / 工作区记账
  try {
    const registry = ctx?.get?.('workspaceRegistry')
    if (registry !== undefined) {
      try {
        await registry.unarchiveSession?.(sessionId)
        detail.unarchived = true
      } catch { /* 幂等失败忽略 */ }
      try {
        await registry.unpinSession?.(sessionId)
        detail.unpinned = true
      } catch { /* 幂等失败忽略 */ }
      try {
        const entities = typeof registry.list === 'function' ? registry.list() : []
        for (const entity of entities ?? []) {
          const ids = Array.isArray(entity?.sessionIds) ? entity.sessionIds : []
          if (!ids.includes(sessionId)) continue
          await entity.detachSession?.(sessionId)
          detail.detached += 1
        }
      } catch { /* 记账摘除失败忽略 */ }
    }
  } catch { /* 服务不可用 */ }

  // ③ 定时任务里残留的引用行（活动行已在 quiesceSession 里停掉）
  try {
    const schedule = ctx?.get?.('schedule')
    if (schedule !== undefined) {
      const rows = typeof schedule.list === 'function' ? (schedule.list({ sessionId }) ?? []) : []
      for (const row of rows) {
        try {
          await schedule.delete?.({ id: row?.id, sessionId })
          detail.scheduleRemoved += 1
        } catch { /* 逐条删失败忽略 */ }
      }
    }
  } catch { /* 服务不可用 */ }

  // ④ 第三方插件的 per-session 状态文件（redteam-mode 用一会话一文件；不存在就跳过）
  try {
    const file = join(dshHome(), 'redteam-mode', 'state', 'sessions', `${sessionId}.json`)
    if (existsSync(file)) {
      rmSync(file, { force: true })
      detail.pluginFiles += 1
    }
  } catch { /* 忽略 */ }

  return detail
}

/** 读回收站条目的元数据。 */
function readTrashMeta(dir) {
  try {
    const parsed = JSON.parse(readFileSync(join(dir, TRASH_META), 'utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined
  } catch {
    return undefined
  }
}

/**
 * 列回收站条目。
 * @returns 条目数组（按名称倒序 = 新的在前）。
 */
function listTrashItems() {
  const root = trashRoot()
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return []
  }
  const items = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = join(root, entry.name)
    const meta = readTrashMeta(dir)
    const sessionId = typeof meta?.sessionId === 'string'
      ? meta.sessionId
      : sessionIdFromTrashName(entry.name)
    items.push({
      name: entry.name,
      sessionId,
      at: typeof meta?.at === 'number' ? meta.at : undefined,
      originalDir: typeof meta?.originalDir === 'string' ? meta.originalDir : undefined,
    })
  }
  items.sort((a, b) => (a.name < b.name ? 1 : -1))
  return items
}

/**
 * 删除一个会话目录。
 * @param ctx host 上下文。
 * @param sessionId 会话 id。
 * @param purge true = 彻底删除（含投影/归档/任务等关联数据）；false = 移入回收站。
 * @returns 结果对象。
 */
/**
 * 删除一个会话（尽最大努力清干净，不要求会话目录一定还在）。
 *
 * 三种现实情况都要能处理：
 *   ① 目录在 `sessions/` 下（正常）；
 *   ② 目录已被删过，只剩回收站条目（用户之前点过删除）——彻底删除要把回收站条目也收掉；
 *   ③ 目录和回收站都没有，只剩投影缓存之类的残留——彻底删除仍应能清残留。
 * @param ctx host 上下文。
 * @param sessionId 会话 id。
 * @param purge true = 彻底删除（含回收站条目、投影/归档/任务等关联数据）；false = 移入回收站。
 * @returns 结果对象。
 */
async function deleteSessionDir(ctx, sessionId, purge) {
  if (!SESSION_ID_RE.test(sessionId)) return { ok: false, error: 'invalid session id' }
  const dir = findSessionDir(sessionId)
  const inTrash = listTrashItems().filter((item) => item.sessionId === sessionId)

  if (dir === undefined && inTrash.length === 0 && purge !== true) {
    return {
      ok: false,
      error: 'session directory not found',
      sessionId,
      hint: '它可能已经被删过；用「彻底删除」清掉仍在的投影/记录残留',
    }
  }
  if (dir !== undefined && !dir.startsWith(sessionsRoot())) {
    return { ok: false, error: 'refusing to delete outside sessions root', dir }
  }

  // 先请活动停下来（定时任务等），再动目录：避免"边跑边删"。
  await quiesceSession(ctx, sessionId)

  if (purge === true) {
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true })
    // 回收站里的同名条目一并彻底删（"彻底删除"就是不留任何副本）
    const trashRemoved = []
    for (const item of inTrash) {
      try {
        rmSync(join(trashRoot(), item.name), { recursive: true, force: true })
        trashRemoved.push(item.name)
      } catch { /* 删不掉就留着，如实回报 */ }
    }
    // 连记录一起清（投影缓存 / 归档 / 置顶 / 定时任务 / 第三方 per-session 状态）
    const related = await purgeRelatedData(ctx, sessionId)
    return { ok: true, mode: 'purge', dir, trashRemoved, sessionId, related }
  }

  if (dir === undefined) {
    // 已经在回收站里了：只补一次投影清理（归档/置顶保持不动，恢复后状态才完整）
    const projection = await purgeProjection(ctx, sessionId)
    return { ok: true, mode: 'trash', alreadyInTrash: true, trashName: inTrash[0]?.name, sessionId, projection }
  }

  const trash = trashRoot()
  mkdirSync(trash, { recursive: true })
  const name = `${Date.now()}-${sessionId}`
  const target = join(trash, name)
  renameSync(dir, target)
  // 只清投影缓存（会话已不在列表里，缓存就是垃圾；恢复后官方会重算）。
  // **不动归档/置顶**：移入回收站是可恢复的，恢复后归档状态要完好。
  const projection = await purgeProjection(ctx, sessionId)
  try {
    writeFileSync(join(target, TRASH_META), `${JSON.stringify({ sessionId, originalDir: dir, at: Date.now() }, undefined, 2)}\n`, 'utf8')
  } catch { /* 元数据写不进去也能列出条目，恢复时改从日志头推导原路径 */ }
  return { ok: true, mode: 'trash', dir, to: target, name, sessionId, projection }
}

/**
 * 彻底删除回收站条目（含它们的关联数据）。
 * @param ctx host 上下文。
 * @param names 条目名数组；`undefined` 表示全部。
 * @returns 结果对象。
 */
async function purgeTrashItems(ctx, names) {
  const root = trashRoot()
  const wanted = Array.isArray(names) && names.length > 0 ? names : undefined
  const removed = []
  const failed = []
  let projectionRemoved = 0
  for (const item of listTrashItems()) {
    if (wanted !== undefined && !wanted.includes(item.name)) continue
    const dir = trashEntryPath(item.name)
    if (dir === undefined) { failed.push({ name: item.name, error: 'unsafe trash entry name' }); continue }
    try {
      rmSync(dir, { recursive: true, force: true })
      if (typeof item.sessionId === 'string' && SESSION_ID_RE.test(item.sessionId)) {
        // 目录已经不在原位了，但关联数据（投影 / 归档 / 置顶 / 定时任务）还得清
        const related = await purgeRelatedData(ctx, item.sessionId)
        projectionRemoved += related.projectionFiles
      }
      removed.push(item.name)
    } catch (error) {
      failed.push({ name: item.name, error: String(error?.message ?? error) })
    }
  }
  if (wanted !== undefined) {
    for (const name of wanted) {
      if (!removed.includes(name) && !failed.some((item) => item.name === name)) failed.push({ name, error: 'not found' })
    }
  }
  return { ok: failed.length === 0, removed, failed, projectionRemoved }
}

/**
 * 把 cwd 编码成会话目录名（复刻官方 `projectKey`）。
 *
 * 规则：`/ \ :` 一律折成一个 `-`（连续分隔符合并），其余非 `[A-Za-z0-9._-]` 的码元
 * 转成 `~XXXX`（大写十六进制），两端包 `--`，最多 251 字符。
 * @param cwd 工作目录。
 * @returns 目录名。
 */
function projectKey(cwd) {
  let readable = ''
  let separatorRun = false
  for (const ch of cwd) {
    if (ch === '/' || ch === '\\' || ch === ':') {
      if (!separatorRun) readable += '-'
      separatorRun = true
      continue
    }
    if (/^[A-Za-z0-9._-]$/.test(ch)) {
      readable += ch
      separatorRun = false
      continue
    }
    readable += `~${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`
    separatorRun = false
  }
  const trimmed = readable.replace(/^-+/, '') || 'root'
  return `--${trimmed.slice(0, 251)}--`
}

/**
 * 从会话日志的第一帧里读 cwd（用于回收站恢复时反推原目录）。
 *
 * 日志是多帧 zstd；Node 的 `zstdDecompressSync` 只解第一帧且不报错——正好是我们要的
 * 那一帧（会话头）。读不到就返回 undefined。
 * @param dir 会话目录。
 * @returns cwd；读不到返回 undefined。
 */
function readHeaderCwd(dir) {
  for (const name of ['session.v4.jsonl.zstd', 'session.jsonl.zstd']) {
    const file = join(dir, name)
    if (!existsSync(file)) continue
    try {
      const text = zstdDecompressSync(readFileSync(file)).toString('utf8')
      for (const line of text.split('\n')) {
        if (line.trim() === '') continue
        const parsed = JSON.parse(line)
        if (typeof parsed?.cwd === 'string' && parsed.cwd !== '') return parsed.cwd
        break
      }
    } catch { /* 换下一个候选文件 */ }
  }
  return undefined
}

/**
 * 把回收站条目移回原位置。
 * @param name 条目名。
 * @returns 结果对象。
 */
function restoreTrashItem(name) {
  const dir = trashEntryPath(name)
  if (dir === undefined) return { ok: false, error: 'invalid trash name' }
  const root = trashRoot()
  if (!existsSync(dir)) return { ok: false, error: 'trash item not found' }
  const meta = readTrashMeta(dir)
  let original = typeof meta?.originalDir === 'string' ? meta.originalDir : undefined
  let inferred = false
  if (original === undefined) {
    // 老条目（或元数据丢了）没有原路径：从会话日志头里读 cwd 反推目录名。
    const cwd = readHeaderCwd(dir)
    if (cwd !== undefined) {
      // 目录名优先用名字里解析出的会话 id：历史条目可能没有 `<时间戳>-` 前缀，直接截前缀会得到错名。
      const leaf = sessionIdFromTrashName(name) ?? name.replace(/^\d+-/, '')
      original = join(sessionsRoot(), projectKey(cwd), leaf)
      inferred = true
    }
  }
  if (original === undefined || !original.startsWith(sessionsRoot())) {
    return { ok: false, error: 'cannot determine original path (no metadata and no readable session header)', dir }
  }
  if (existsSync(original)) return { ok: false, error: 'original path already exists', dir: original }
  mkdirSync(join(original, '..'), { recursive: true })
  renameSync(dir, original)
  try {
    rmSync(join(original, TRASH_META), { force: true })
  } catch { /* 留着也无害 */ }
  return { ok: true, restored: original, name, inferred }
}

/** 请求是否来自回环地址。 */
function isLoopback(req) {
  const addr = req?.socket?.remoteAddress ?? ''
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1'
}

/** 统一 JSON 响应。 */
function sendJson(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

/** 读取请求体并解析 JSON（失败返回 undefined）。 */
async function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 64 * 1024) raw = raw.slice(0, 64 * 1024)
    })
    req.on('end', () => {
      try {
        resolve(raw === '' ? {} : JSON.parse(raw))
      } catch {
        resolve(undefined)
      }
    })
    req.on('error', () => resolve(undefined))
  })
}

/** 把最近一条上报压平成一个便于肉眼扫的摘要。 */
function summarize(report) {
  if (report === undefined) return null
  return {
    at: report.at,
    phase: report.phase,
    plugin: report.plugin,
    build: report.build,
    entryMounted: report.entryMounted,
    slotEntries: report.slotEntries,
    sessionCount: report.sessionCount,
    archivedCount: report.archivedCount,
    localeRegistered: report.localeRegistered,
    hasArchived: report.hasArchived,
    hasJump: report.hasJump,
    hasArchiveAction: report.hasArchiveAction,
    hasUiWorkspace: report.hasUiWorkspace,
    deletedLocally: report.deletedLocally,
    styleRev: report.styleRev,
    settings: report.settings,
    rowProbe: report.rowProbe,
    samples: report.samples,
    rowWidth: report.rowWidth,
    rows: report.rows,
    toolbar: report.toolbar,
    look: report.look,
    items: report.items,
    first: report.first,
    sessionId: report.sessionId,
    ok: report.ok,
    url: report.url,
    args: report.args,
    locate: report.locate,
    archiveJump: report.archiveJump,
    subagentProbe: report.subagentProbe,
    target: report.target,
    purge: report.purge,
    confirm: report.confirm,
    removeMessage: report.removeMessage,
    archivedBefore: report.archivedBefore,
    archivedAfter: report.archivedAfter,
    present: report.present,
    stillListed: report.stillListed,
    skipped: report.skipped,
    reason: report.reason,
    errorName: report.errorName,
    error: report.error,
    already: report.already,
    wasArchived: report.wasArchived,
    attempts: report.attempts,
    targetVisible: report.targetVisible,
    targetVisibleBeforeClick: report.targetVisibleBeforeClick,
    timelineLastVisible: report.timelineLastVisible,
    timelineExtended: report.timelineExtended,
    behaviorUsed: report.behaviorUsed,
  }
}

/**
 * 装载路由。
 * @param ctx - host 根上下文。
 */
export function apply(ctx) {
  const { webServer } = ctx

  ctx.effect(() => {
    const disposers = [
      // client 上报：页面里的插件每次状态变化 POST 一次
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/report',
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          const body = await readJsonBody(req)
          if (body === undefined) return sendJson(res, 400, { ok: false, error: 'invalid JSON' })
          reports.push({ at: Date.now(), ...body })
          while (reports.length > MAX_REPORTS) reports.shift()
          const command = takeCommand()
          sendJson(res, 200, command === null
            ? { ok: true, count: reports.length }
            : { ok: true, count: reports.length, commands: [command.command], args: command.args })
        },
      }),
      // 远程自检：给页面下发一条一次性指令（默认打开面板；探针指令可带 target/purge/confirm 参数）
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/selftest',
        handler: (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          let command = 'open-panel'
          const args: Record<string, unknown> = {}
          try {
            const url = new URL(String(req.url ?? ''), 'http://127.0.0.1')
            const asked = url.searchParams.get('command')
            if (asked === 'probe-row-hit' || asked === 'probe-trash' || asked === 'probe-locate'
              || asked === 'probe-subagent' || asked === 'probe-delete') command = asked
            const target = url.searchParams.get('target')
            if (typeof target === 'string' && SESSION_ID_RE.test(target)) args.target = target
            const purge = url.searchParams.get('purge')
            if (purge === '1' || purge === '0') args.purge = purge === '1'
            const confirm = url.searchParams.get('confirm')
            if (typeof confirm === 'string' && confirm !== '') args.confirm = confirm.slice(0, 16)
          } catch { /* 解析失败就用默认指令 */ }
          pendingCommand = { command, seq: ++commandSeq, at: Date.now(), args }
          sendJson(res, 200, {
            ok: true,
            queued: pendingCommand,
            note: '将在下一次页面心跳（≤30s；刷新页面则 ≤2s）时执行，随后上报对应阶段',
          })
        },
      }),
      // 批量取会话标题（T4：官方 list 快照给不出子代理可读名，标题在投影缓存里）
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/titles',
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method not allowed' })
          const body = await readJsonBody(req)
          if (body === undefined) return sendJson(res, 400, { ok: false, error: 'invalid JSON' })
          const asked = Array.isArray(body.sessionIds)
            ? body.sessionIds.filter((id) => typeof id === 'string' && SESSION_ID_RE.test(id))
            : []
          const wanted = asked.slice(0, 200)
          const titles = {}
          for (const id of wanted) {
            const title = projectionTitleOf(id)
            if (title !== undefined) titles[id] = title
          }
          sendJson(res, 200, { ok: true, asked: asked.length, served: wanted.length, titles })
        },
      }),
      // 批量解析会话目录绝对路径（面板「路径」按钮复制用；回收站里的条目给回收站目录）
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/paths',
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method not allowed' })
          const body = await readJsonBody(req)
          if (body === undefined) return sendJson(res, 400, { ok: false, error: 'invalid JSON' })
          const asked = Array.isArray(body.sessionIds)
            ? body.sessionIds.filter((id) => typeof id === 'string')
            : []
          const index = sessionDirIndex()
          const trashed = asked.length === 0 ? [] : listTrashItems()
          const paths = {}
          for (const id of asked) {
            if (!SESSION_ID_RE.test(id)) continue
            const dir = index.get(id)
            if (dir !== undefined) {
              paths[id] = dir
              continue
            }
            const inTrash = trashed.find((item) => item.sessionId === id)
            if (inTrash !== undefined) paths[id] = join(trashRoot(), inTrash.name)
          }
          sendJson(res, 200, { ok: true, root: sessionsRoot(), paths })
        },
      }),
      // 删除会话（purge=false 移入回收站，true 彻底删除含投影缓存）
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/delete',
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method not allowed' })
          const body = await readJsonBody(req)
          if (body === undefined) return sendJson(res, 400, { ok: false, error: 'invalid JSON' })
          const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
          let result
          try {
            result = await deleteSessionDir(ctx, sessionId, body.purge === true)
          } catch (error) {
            result = { ok: false, error: String(error?.message ?? error) }
          }
          reports.push({ at: Date.now(), phase: body.purge === true ? 'delete-purge' : 'delete-trash', sessionId, ok: result.ok === true })
          while (reports.length > MAX_REPORTS) reports.shift()
          sendJson(res, result.ok === true ? 200 : 400, result)
        },
      }),
      // 列回收站
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/trash',
        handler: (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          const items = listTrashItems()
          sendJson(res, 200, { ok: true, root: trashRoot(), count: items.length, items })
        },
      }),
      // 回收站彻底删除（names 指定若干条，all=true 清空）
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/trash/purge',
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method not allowed' })
          const body = await readJsonBody(req)
          if (body === undefined) return sendJson(res, 400, { ok: false, error: 'invalid JSON' })
          let result
          try {
            result = await purgeTrashItems(ctx, body.all === true ? undefined : body.names)
          } catch (error) {
            result = { ok: false, error: String(error?.message ?? error) }
          }
          reports.push({ at: Date.now(), phase: 'trash-purge', removed: result.removed?.length ?? 0, projectionRemoved: result.projectionRemoved ?? 0, ok: result.ok === true })
          while (reports.length > MAX_REPORTS) reports.shift()
          sendJson(res, result.ok === true ? 200 : 400, result)
        },
      }),
      // 回收站恢复
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/trash/restore',
        handler: async (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method not allowed' })
          const body = await readJsonBody(req)
          if (body === undefined) return sendJson(res, 400, { ok: false, error: 'invalid JSON' })
          let result
          try {
            result = restoreTrashItem(body.name)
          } catch (error) {
            result = { ok: false, error: String(error?.message ?? error) }
          }
          reports.push({ at: Date.now(), phase: 'trash-restore', name: body.name, ok: result.ok === true })
          while (reports.length > MAX_REPORTS) reports.shift()
          sendJson(res, result.ok === true ? 200 : 400, result)
        },
      }),
      // 全量状态查询
      webServer.register({
        kind: 'exact',
        path: '/api/session-id/status',
        handler: (req, res) => {
          if (!isLoopback(req)) return sendJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
          const latest = reports[reports.length - 1]
          let trash = -1
          try {
            trash = listTrashItems().length
          } catch { /* 读不到就报 -1 */ }
          sendJson(res, 200, {
            ok: true,
            hostPid: process.pid,
            plugin: name,
            reports: reports.length,
            pendingCommand,
            trashCount: trash,
            trashRoot: trashRoot(),
            latest: summarize(latest),
            history: reports.map(summarize),
          })
        },
      }),
    ]
    ctx.logger?.info?.('dsh-session-id: host face loaded (/api/session-id/{report,selftest,status,delete,paths,trash,titles})')
    return () => {
      for (const dispose of disposers) if (typeof dispose === 'function') dispose()
    }
  }, 'session-id: routes')
}
