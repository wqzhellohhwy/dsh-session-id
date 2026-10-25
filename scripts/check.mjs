/**
 * 产物求值检查（防回归闸）：把 lib/client.js 放进一个最小 DOM/模块系统里**真的求值一次**。
 *
 * 为什么必须做：`node --check` 只查语法。CSS 模板字符串里误写反引号这类事故，产出的
 * JS **语法完全合法**（`.sid-row-info` 会变成合法的减法表达式 `.sid - row - info`），
 * 只有运行时求值才炸成 `ReferenceError: row is not defined`，后果是
 * **整页 import failed、界面报废**（本插件踩过两次）。所以构建后必须跑这一步。
 *
 * 用法：node scripts/check.mjs [lib/client.js]
 * 退出码 0 = 顶层与 factory 均求值通过。
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const target = resolve(process.argv[2] ?? 'lib/client.js')

/** 能当函数调、能取任意属性、能无限链式下去的 stub（代替 react 等运行时依赖）。 */
function makeStub() {
  const callable = function () { return makeStub() }
  return new Proxy(callable, {
    get: (_t, key) => {
      if (key === 'then') return undefined // 避免被当成 thenable
      if (key === Symbol.toPrimitive) return () => ''
      if (key === 'toString') return () => ''
      return makeStub()
    },
    apply: () => makeStub(),
    construct: () => makeStub(),
  })
}

/** 最小元素 stub。 */
function makeElement() {
  return {
    style: {},
    dataset: {},
    className: '',
    textContent: '',
    childNodes: [],
    appendChild: (child) => child,
    removeChild: () => undefined,
    remove: () => undefined,
    setAttribute: () => undefined,
    getAttribute: () => null,
    hasAttribute: () => false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    querySelector: () => null,
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
    scrollIntoView: () => undefined,
    focus: () => undefined,
  }
}

let captured = null

const documentStub = {
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => makeElement(),
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  head: makeElement(),
  body: makeElement(),
  documentElement: makeElement(),
  getElementById: () => null,
}

const localStorageStub = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }

const windowStub = {
  __ModuleLoader__: {
    load: (definition) => { captured = definition && definition.factory ? definition.factory : null },
  },
  document: documentStub,
  localStorage: localStorageStub,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  setTimeout: () => 0,
  clearTimeout: () => undefined,
  setInterval: () => 0,
  clearInterval: () => undefined,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => undefined,
  getSelection: () => null,
  fetch: () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}) }),
  location: { href: 'dsh-app://app/', origin: 'dsh-app://app' },
}

const code = readFileSync(target, 'utf8')

/**
 * 源码 lint：`src/client/styles.ts` 的 CSS 模板字符串内部禁止出现反引号。
 *
 * 判据：模板起点是 `const CSS = \` 那一行，终点是**整行只有一个反引号**的那一行；
 * 两地之间的任何反引号都算违规（它就是"提前结束模板"的元凶）。这条规则抓的是
 * 已经踩过三次的事故：CSS 注释里写反引号 → 后面的 CSS 被当 JS 求值 → 整页 import 失败。
 * @returns 违规行清单（空 = 通过）。
 */
function lintStyleTemplate() {
  let source
  try {
    source = readFileSync('src/client/styles.ts', 'utf8')
  } catch {
    return [] // 不在插件根目录跑就跳过
  }
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex((line) => line.includes('const CSS = `'))
  if (start < 0) return ['找不到 CSS 模板起点（const CSS = `）']
  const end = lines.findIndex((line, index) => index > start && line.trim() === '`')
  if (end < 0) return ['找不到 CSS 模板终点（可能已被内部反引号截断）']
  const offenders = []
  for (let i = start + 1; i < end; i += 1) {
    if (lines[i].includes('`')) offenders.push(`第 ${i + 1} 行：${lines[i].trim().slice(0, 90)}`)
  }
  return offenders
}

const lintProblems = lintStyleTemplate()
if (lintProblems.length > 0) {
  console.error('✗ styles.ts 的 CSS 模板内出现反引号（会提前结束字符串、导致整页 import 失败）：')
  for (const problem of lintProblems) console.error(`   ${problem}`)
  process.exit(1)
}

try {
  // 模块顶层求值 —— CSS 模板字符串被反引号截断之类的错误在这里就会炸。
  const run = new Function(
    'window',
    'document',
    'localStorage',
    'navigator',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'getSelection',
    'fetch',
    'location',
    code,
  )
  run(
    windowStub,
    documentStub,
    localStorageStub,
    { userAgent: 'check' },
    windowStub.setTimeout,
    windowStub.clearTimeout,
    windowStub.setInterval,
    windowStub.clearInterval,
    windowStub.requestAnimationFrame,
    windowStub.cancelAnimationFrame,
    windowStub.getSelection,
    windowStub.fetch,
    windowStub.location,
  )
} catch (error) {
  console.error(`✗ ${target} 模块顶层求值失败：${error && error.message ? error.message : error}`)
  process.exit(1)
}

if (captured === null) {
  console.error(`✗ ${target} 没有走到 window.__ModuleLoader__.load({ factory })`)
  process.exit(1)
}

try {
  // factory 求值（等价于浏览器里的 import）：require 一律返回可链式 stub。
  captured(() => makeStub())
} catch (error) {
  console.error(`✗ ${target} factory 求值失败：${error && error.message ? error.message : error}`)
  process.exit(1)
}

console.log(`✓ ${target} 顶层与 factory 求值均通过`)
