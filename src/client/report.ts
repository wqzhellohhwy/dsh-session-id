/**
 * 页面 → host 的自检上报。
 *
 * client 插件跑在渲染进程里，装没装上、跑没跑起来、入口渲染没渲染出来，
 * 在终端侧全靠这一条链路区分。上报体只带计数与布尔值，不带会话内容。
 * 上报失败一律静默吞掉——自检绝不影响插件的正常功能。
 *
 * host 的响应里可能带一条待执行指令（`commands`），用于从终端驱动页面自检
 * （例如「打开一次面板」）。
 */

/** host 半边注册的上报路由。 */
const REPORT_PATH = '/api/session-id/report'

/** host 响应形态。 */
export interface ReportReply {
  ok?: boolean
  commands?: readonly string[]
}

/**
 * 发一条上报，并把 host 的响应（可能含自检指令）交回调用方。
 * @param phase - 阶段标记（applied / tick / panel-opened / panel-mounted …）。
 * @param extra - 附加的结构化字段（务必只放计数、布尔、短字符串）。
 * @returns host 的响应；任何失败都返回 undefined。
 */
export async function report(phase: string, extra: Record<string, unknown> = {}): Promise<ReportReply | undefined> {
  try {
    const body = JSON.stringify({
      phase,
      at: Date.now(),
      url: typeof location === 'undefined' ? '' : location.href,
      ...extra,
    })
    const response = await fetch(REPORT_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    })
    if (!response.ok) return undefined
    return await response.json() as ReportReply
  } catch {
    return undefined
  }
}
