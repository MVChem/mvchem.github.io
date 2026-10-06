import { createElement, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { ElementNode, RichNode } from '../reference-types'

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
export function DocumentNode({ node }: { node: RichNode }): ReactNode {
  if (node.kind === 'text') return node.text
  if (node.attrs.class === 'hero') return <IntroHero node={node} />
  if (node.attrs.class?.split(' ').includes('news-box')) return <NewsFeed node={node} />
  const props = Object.fromEntries(Object.entries(node.attrs).map(([key, value]) => [names[key] ?? key, key === 'style' ? inlineStyle(value) : key === 'download' && value === '' ? true : value]))
  return createElement(node.tag === 'clippath' ? 'clipPath' : node.tag, props, ...node.children.map((child, index) => <DocumentNode key={index} node={child} />))
}
function NewsFeed({ node }: { node: ElementNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [shadows, setShadows] = useState({ above: false, below: false })
  useLayoutEffect(() => {
    const region = box.current?.querySelector<HTMLElement>('.news-scroll')
    if (!region) return
    let mounted = true
    const update = () => { if (mounted) setShadows({ above: region.scrollTop > 1, below: region.scrollTop + region.clientHeight < region.scrollHeight - 1 }) }
    const resize = () => {
      if (!mounted) return
      const third = region.querySelectorAll<HTMLElement>('.news__item')[2]
      region.style.maxHeight = third ? `${third.offsetTop + third.offsetHeight + 1}px` : 'none'
      update()
    }
    resize(); document.fonts.ready.then(resize)
    region.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', resize)
    return () => { mounted = false; region.removeEventListener('scroll', update); window.removeEventListener('resize', resize) }
  }, [])
  return <div ref={box} className={`news-box${shadows.above ? ' has-above' : ''}${shadows.below ? ' has-below' : ''}`}>
    {node.children.map((child, index) => <DocumentNode key={index} node={child} />)}
  </div>
}
const labels: Record<string, string> = { name: 'UCAS · Chinese Academy of Sciences', eyes: 'Image & video forensics', people: 'Multimodal AI', health: 'MRI · MRSI reconstruction' }
interface Phrase { id: string; x: number; y: number; width: number; height: number; delay: number; right: boolean }
function IntroHero({ node }: { node: ElementNode }) {
  const hero = useRef<HTMLDivElement>(null)
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [height, setHeight] = useState(0)
  const [released, setReleased] = useState(false)
  const [settled, setSettled] = useState(false)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      if (!alive || !hero.current) return
      const root = hero.current.getBoundingClientRect()
      const marks = [...hero.current.querySelectorAll<HTMLElement>('[data-p]')].map(el => {
        const rect = el.getBoundingClientRect(), size = Number.parseFloat(getComputedStyle(el).fontSize)
        const title = !!el.closest('.hero__title')
        return { id: el.dataset.p!, x: rect.left - root.left, y: rect.top - root.top + (title ? size * .2 : 0), width: rect.width, height: rect.height - (title ? size * .32 : 0), delay: 0, right: false }
      }).sort((a, b) => a.y - b.y || a.x - b.x)
      const rows: { y: number; marks: Phrase[] }[] = []
      for (const mark of marks) {
        mark.right = mark.x + 6.9 * labels[mark.id].length > root.width - 4
        const row = rows.find(r => Math.abs(r.y - mark.y) < 6)
        if (row) row.marks.push(mark); else rows.push({ y: mark.y, marks: [mark] })
      }
      for (const row of rows) row.marks.sort((a, b) => a.x - b.x).forEach((mark, index) => {
        mark.delay = Math.round(1250 + (row.y + 21) / (Math.round(root.height) + 8) * .88 * 1900 + index * 110)
      })
      setHeight(Math.round(root.height)); setPhrases(marks)
    }
    measure(); document.fonts.ready.then(measure); window.addEventListener('resize', measure)
    return () => { alive = false; window.removeEventListener('resize', measure) }
  }, [])
  useEffect(() => {
    if (reduced) return
    const release = setTimeout(() => setReleased(true), 3300), settle = setTimeout(() => setSettled(true), 3950)
    return () => { clearTimeout(release); clearTimeout(settle) }
  }, [reduced])
  const isStatic = reduced || settled
  return <div className="hero" ref={hero}>
    {node.children.map((child, index) => <DocumentNode key={index} node={child} />)}
    <div className="scan-layer" aria-hidden="true">
      {height > 0 && <div className={`scan-line${isStatic ? ' is-static' : ''}`} style={{ '--h': `${height}px`, '--s0': '1250ms', '--sd': '1900ms' } as CSSProperties} />}
      {!isStatic && phrases.map(p => <div key={p.id} className={`scan-box${released ? ' is-released' : ''}`} style={{ left: p.x - 6, top: p.y - 2, width: p.width + 12, height: p.height + 4, '--t': `${p.delay}ms` } as CSSProperties}>
        {['tl', 'tr', 'bl', 'br'].map(corner => <i key={corner} className={`c ${corner}`} />)}
      </div>)}
      {phrases.map(p => <span key={p.id} className={`scan-label${p.right ? ' scan-label--right' : ''}${reduced || released ? ' is-settled' : ''}`} style={{ left: p.right ? p.x + p.width : p.x, top: p.y, '--t': `${p.delay + 90}ms` } as CSSProperties}>{labels[p.id]}</span>)}
    </div>
  </div>
}
