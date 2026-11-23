import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Lightbox, { type Zoom } from './components/Lightbox'
import { DocumentNode } from './components/ReferenceDocument'
import VisitorMap from './components/VisitorMap'
import type { ReferenceSite } from './reference-types'

const readRoute = () => {
  const path = location.pathname.replace(/\/$/, '') || '/'
  return path === '/demo' ? '/projects/vertebrae' : path
}
const VertebraeDemo = lazy(() => import('./demo/VertebraeDemo'))
export default function App() {
  const [site, setSite] = useState<ReferenceSite | null>(null)
  const [route, setRoute] = useState(readRoute)
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [zoom, setZoom] = useState<Zoom | null>(null)
  const closeZoom = useCallback(() => setZoom(null), [])
  const toggle = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (location.pathname.replace(/\/$/, '') === '/demo') {
      history.replaceState(history.state, '', '/projects/vertebrae/' + location.search + location.hash)
    }
  }, [route])
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    fetch(`/api/reference.${import.meta.env.VITE_CONTENT_VERSION}.json`, { signal: controller.signal, cache: 'no-cache' }).then(async response => {
      if (!response.ok) throw new Error('Could not load page')
      setSite(await response.json())
    }).catch(error => { if (error.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    const pop = () => {
      setRoute(readRoute()); setMenuOpen(false); setZoom(null)
    }
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
      if (anchor?.dataset.zoom !== undefined) {
        event.preventDefault()
        setZoom({ src: anchor.getAttribute('href')!, caption: anchor.dataset.caption ?? '', link: anchor.dataset.link, opener: anchor })
        return
      }
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href), target = url.pathname.replace(/\/$/, '') || '/'
      if (url.origin !== location.origin || !site?.pages[target]) return
      event.preventDefault()
      const same = target === route
      history.pushState({}, '', url.pathname + url.search + url.hash)
      setRoute(target); setMenuOpen(false); setZoom(null)
      if (same && url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView()
      else if (same) window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', pop); document.addEventListener('click', click)
    return () => { window.removeEventListener('popstate', pop); document.removeEventListener('click', click) }
  }, [site, route])
  useEffect(() => {
    if (!site) return
    const hash = location.hash.slice(1)
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(decodeURIComponent(hash))?.scrollIntoView()
      else window.scrollTo(0, 0)
    })
    return () => cancelAnimationFrame(frame)
  }, [route, site])
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const close = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); toggle.current?.focus() } }
    document.addEventListener('keydown', close)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', close) }
  }, [menuOpen])
  useEffect(() => {
    const media = matchMedia('(min-width: 721px)')
    const resize = () => { if (media.matches) setMenuOpen(false) }
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [])
  if (!site) return <div className="load-state" role={error ? 'alert' : 'status'}><h1>Hongkang Chu</h1><p>{error ? 'The page could not load.' : 'Loading…'}</p>{error && <button className="button" onClick={() => setAttempt(n => n + 1)}>Try again</button>}</div>
  if (route === '/projects/vertebrae') return <Suspense fallback={<div className="load-state" role="status">Loading Vertebrae Study…</div>}><VertebraeDemo /></Suspense>
  const current = site.pages[route] ? route : '/', home = current === '/' || current === '/about'
  const content = site.pages[current]
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    {menuOpen && <div className="nav-scrim" aria-hidden="true" onClick={() => setMenuOpen(false)} />}
    <header className="site-header"><div className="container site-header__inner">
      <a className="brand" href="/">{site.name}</a>
      <button ref={toggle} className="nav-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(open => !open)}><span>Menu</span><span className="nav-toggle__icon" aria-hidden="true" /></button>
      <nav id="site-navigation" className={`nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation"><ul>{site.navigation.map(item => {
        const active = current === item.path || home && item.path === '/about'
        return <li key={item.path}><a href={item.path} className={`nav__link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>{item.label}</a></li>
      })}</ul></nav>
    </div></header>
    <div className="container">
      <DocumentNode key={current} node={content}>{home && <VisitorMap />}</DocumentNode>
    </div>
    <footer className="site-footer"><div className="container">
      <DocumentNode node={site.profile} />
      <p className="site-footer__meta">© {new Date().getFullYear()} {site.name} · {site.institution}</p>
    </div></footer>
    {zoom && <Lightbox zoom={zoom} onClose={closeZoom} />}
  </>
}
