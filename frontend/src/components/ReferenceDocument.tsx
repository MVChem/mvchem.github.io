import { createElement, type CSSProperties, type ReactNode } from 'react'
import type { RichNode } from '../reference-types'

const names: Record<string, string> = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', datetime: 'dateTime', srcset: 'srcSet',
  crossorigin: 'crossOrigin', fetchpriority: 'fetchPriority', 'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule',
  'clip-rule': 'clipRule', 'stroke-miterlimit': 'strokeMiterlimit', 'stroke-dasharray': 'strokeDasharray',
}
function inlineStyle(value: string): CSSProperties {
  const properties: Record<string, string> = {}
  for (const declaration of value.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon < 0) continue
    const name = declaration.slice(0, colon).trim()
    properties[name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = declaration.slice(colon + 1).trim()
  }
  return properties as CSSProperties
}
/** Render validated page content (see backend/reference.py) as React elements. */
export function DocumentNode({ node, children }: { node: RichNode; children?: ReactNode }): ReactNode {
  if (node.kind === 'text') return node.text
  const props = Object.fromEntries(Object.entries(node.attrs).map(([key, value]) => [names[key] ?? key, key === 'style' ? inlineStyle(value) : key === 'download' && value === '' ? true : value]))
  return createElement(node.tag === 'clippath' ? 'clipPath' : node.tag, props, ...node.children.map((child, index) => <DocumentNode key={index} node={child} />), children)
}
