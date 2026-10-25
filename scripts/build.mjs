// 构建 dsh-session-id 的两个半边：
//   lib/index.js  —— host 半边，ESM，DSH 按 package.json 的 main 加载。
//   lib/client.js —— client 半边，宿主页面用
//                    `window.__ModuleLoader__.load({ id, factory })` 装载的 CJS bundle。
//
// 与 @deepseek-ai/dsh-client-ui-primitives / react 这类「平台基座模块」有关的
// 一律走 external：它们由宿主的冻结模块表（PLATFORM_MODULES）提供，打进 bundle
// 反而会造成两份 React。
import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'

const ID = 'dsh-session-id'

const shared = {
  bundle: true,
  sourcemap: true,
  logLevel: 'info',
  external: ['@deepseek-ai/*', 'react', 'react-dom', 'react/jsx-runtime', 'node:*'],
}

await mkdir('lib', { recursive: true })

await build({
  ...shared,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  format: 'esm',
  platform: 'node',
  target: 'node22',
})

await build({
  ...shared,
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  format: 'cjs',
  platform: 'browser',
  target: 'chrome120',
  // 刻意用 classic runtime（React.createElement）：宿主交给插件的模块表里
  // `react` 是稳定的基座条目，classic 形态少一个 require，少一处可能漂移的契约。
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  banner: {
    js: `window.__ModuleLoader__.load({ id: "${ID}", factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: {
    js: 'return module.exports; } });',
  },
})

// 构建后必跑「产物求值检查」：语法合法但运行时炸的错误（CSS 模板里误写反引号 →
// ReferenceError → 整页 import failed）只有真求值一次才能抓到。失败即让构建失败。
const check = spawnSync(process.execPath, ['scripts/check.mjs', 'lib/client.js'], { stdio: 'inherit' })
if (check.status !== 0) {
  console.error('构建产物未通过求值检查，已中止。')
  process.exit(check.status ?? 1)
}
