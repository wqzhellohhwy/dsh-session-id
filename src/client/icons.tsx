/**
 * 16px 描边图标族：与 DSH 自带图标同一风格（currentColor 描边、无填充）。
 * 这里不依赖 primitives 的图标集，避免图标名在版本间漂移。
 */
import * as React from 'react'

/** 图标公共属性。 */
const base: React.SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** 证件卡式「标识」图标：入口与面板标题共用。 */
export function SessionIdIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('rect', { x: 1.5, y: 3.5, width: 13, height: 9, rx: 1.5, key: 'r' }),
    React.createElement('path', { d: 'M4 6.5h2M4 9h2M7.5 6.5h4.5M7.5 9h4.5', key: 'p' }),
  )
}

/** 复制图标。 */
export function CopyIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('rect', { x: 5.5, y: 5.5, width: 9, height: 9, rx: 1.5, key: 'r' }),
    React.createElement('path', { d: 'M2.5 10.5v-7A1.5 1.5 0 0 1 4 2h5.5', key: 'p' }),
  )
}

/** 对勾图标（复制成功态）。 */
export function CheckIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement('svg', { ...base, ...props }, React.createElement('path', { d: 'M3 8.5 6.5 12l6.5-8' }))
}

/** 关闭图标。 */
export function CloseIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement('svg', { ...base, ...props }, React.createElement('path', { d: 'M4 4l8 8M12 4l-8 8' }))
}

/** 「打开 / 跳转」图标：一个走向外部的箭头。 */
export function JumpIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('path', { d: 'M6.5 3.5H3.5v9h9v-3', key: 'a' }),
    React.createElement('path', { d: 'M9.5 2.5h4v4M13.5 2.5 7.5 8.5', key: 'b' }),
  )
}

/** 「删除」图标：垃圾桶。 */
export function TrashIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('path', { d: 'M2.5 4.5h11', key: 'a' }),
    React.createElement('path', { d: 'M6 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5', key: 'b' }),
    React.createElement('path', { d: 'M3.8 4.5l.7 8a1 1 0 0 0 1 .9h5a1 1 0 0 0 1-.9l.7-8', key: 'c' }),
    React.createElement('path', { d: 'M6.8 7v4M9.2 7v4', key: 'd' }),
  )
}

/** 「归档」图标：带盖的盒子。 */
export function ArchiveIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('rect', { x: 2.5, y: 3, width: 11, height: 3, rx: 1, key: 'a' }),
    React.createElement('path', { d: 'M3.5 6.5v6a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-6', key: 'b' }),
    React.createElement('path', { d: 'M6.5 9h3', key: 'c' }),
  )
}

/** 「排序」图标：长短横线。 */
export function SortIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('path', { d: 'M3 4.5h10M3 8h6.5M3 11.5h3.5', key: 'a' }),
  )
}

/** 「筛选」图标：漏斗。 */
export function FilterIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement('svg', { ...base, ...props }, React.createElement('path', { d: 'M2.5 3.5h11l-4.2 5v4.2l-2.6-1.3V8.5z' }))
}

/** 「定位」图标：准星。 */
export function LocateIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('circle', { cx: 8, cy: 8, r: 4.2, key: 'a' }),
    React.createElement('path', { d: 'M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2', key: 'b' }),
  )
}

/** 「子代理」图标：一条主线分出一根支线。 */
export function SubagentIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('path', { d: 'M3.5 3v4.5a2 2 0 0 0 2 2h5', key: 'a' }),
    React.createElement('circle', { cx: 3.5, cy: 2.5, r: 1.2, key: 'b' }),
    React.createElement('circle', { cx: 12, cy: 9.5, r: 1.5, key: 'c' }),
  )
}

/** 「隐藏」图标：一只带斜杠的眼睛。 */
export function EyeOffIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return React.createElement(
    'svg',
    { ...base, ...props },
    React.createElement('path', { d: 'M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4z', key: 'a' }),
    React.createElement('circle', { cx: 8, cy: 8, r: 1.6, key: 'b' }),
    React.createElement('path', { d: 'M3 3l10 10', key: 'c' }),
  )
}
