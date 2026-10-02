import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { getSite } from './api'
import type { Lang, SiteData } from './types'
import HomePage from './components/HomePage'
import { SiteHeader } from './components/SiteHeader'
import { AboutPage, PortfolioPage, ProjectPage } from './components/ContentPages'
import { Avatar, SiteFooter, ui } from './components/SiteChrome'
import { useExperience } from './hooks/useExperience'
import { useReveal } from './hooks/useReveal'

const palettes = [
  ['#CFE1EF', '#0058C0'], ['#BDF1CD', '#16A062'], ['#FEF8BB', '#F6A200'],
  ['#FDCEA4', '#F06E1C'], ['#E8D6F4', '#7B1897'], ['#FFCABD', '#D30000'],
]
const languages: Lang[] = ['zh', 'en', 'ja', 'ko']
const readTheme = () => {
  try { const n = Number(sessionStorage.getItem('homeThemeIndex') ?? localStorage.getItem('homeThemeIndex') ?? 0); return Number.isFinite(n) ? Math.abs(Math.floor(n)) % 6 : 0 } catch { return 0 }
}

export default function App() {
  const [path, setPath] = useState(location.pathname)
  const [navigationId, setNavigationId] = useState(0)
  const [data, setData] = useState<SiteData | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [themeIndex, setThemeIndex] = useState(readTheme)
  const [chromeTheme, setChromeTheme] = useState(palettes[themeIndex])
  const [leaving, setLeaving] = useState(false)
  const pendingScroll = useRef<number | string>(location.hash || 0)
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const xp = useExperience()
  const parts = path.split('/').filter(Boolean)
  const lang = languages.includes(parts[0] as Lang) ? parts[0] as Lang : 'zh'
  const page = parts[1] === 'portfolio' ? 'portfolio' : parts[1] === 'aboutme' ? 'about' : parts[1] === 'projects' ? 'project' : 'home'
  const theme = page === 'home' ? palettes[themeIndex] : ['#f5ebd6', '#4a4a4a']

  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    getSite(controller.signal).then(setData).catch(e => { if (e.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [attempt])

  const navigate = useCallback((target: string) => {
    const url = new URL(target, location.origin)
    if (url.origin !== location.origin) { location.href = url.href; return }
    if (navigationTimer.current) { clearTimeout(navigationTimer.current); navigationTimer.current = null }
    setLeaving(false)
    if (url.href === location.href && !url.hash) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    history.replaceState({ ...history.state, scrollY: window.scrollY }, '', location.href)
    if (location.pathname.includes('/portfolio/') && url.pathname.includes('/projects/')) {
      try { sessionStorage.setItem('portfolioScroll', String(window.scrollY)) } catch { /* optional */ }
    }
    let restore: number | string = url.hash || 0
    if (location.pathname.includes('/projects/') && url.pathname.includes('/portfolio/') && !url.hash) {
      try { restore = Number(sessionStorage.getItem('portfolioScroll')) || 0 } catch { /* optional */ }
    }
    const apply = () => {
      history.pushState({ scrollY: typeof restore === 'number' ? restore : 0 }, '', url.pathname + url.search + url.hash)
      pendingScroll.current = restore
      setPath(url.pathname); setNavigationId(n => n + 1); setLeaving(false)
      navigationTimer.current = null
    }
    if (navigationTimer.current) clearTimeout(navigationTimer.current)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) apply()
    else { setLeaving(true); navigationTimer.current = setTimeout(apply, 220) }
  }, [path])

  useEffect(() => {
    history.scrollRestoration = 'manual'
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href)
      if (url.origin !== location.origin || !/^\/(zh|en|ja|ko)(\/|$)/.test(url.pathname)) return
      event.preventDefault(); navigate(url.pathname + url.search + url.hash)
    }
    const handlePop = (event: PopStateEvent) => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current)
      pendingScroll.current = event.state?.scrollY ?? 0
      setLeaving(false); setPath(location.pathname); setNavigationId(n => n + 1)
    }
    let scrollFrame = 0
    const rememberScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { history.replaceState({ ...history.state, scrollY: window.scrollY }, '', location.href); scrollFrame = 0 }) }
    document.addEventListener('click', handleClick)
    window.addEventListener('popstate', handlePop)
    window.addEventListener('scroll', rememberScroll, { passive: true })
    return () => { cancelAnimationFrame(scrollFrame); document.removeEventListener('click', handleClick); window.removeEventListener('popstate', handlePop); window.removeEventListener('scroll', rememberScroll) }
  }, [navigate])
  useEffect(() => () => { if (navigationTimer.current) clearTimeout(navigationTimer.current) }, [])

  useLayoutEffect(() => {
    if (!data) return
    const request = requestAnimationFrame(() => {
      const scroll = pendingScroll.current
      if (typeof scroll === 'string') document.getElementById(decodeURIComponent(scroll.slice(1)))?.scrollIntoView()
      else window.scrollTo(0, scroll)
    })
    return () => cancelAnimationFrame(request)
  }, [path, data, navigationId])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `MVChem - ${ui(lang, '作品集', 'Portfolio', 'ポートフォリオ', '포트폴리오')}`
    document.body.style.backgroundColor = theme[0]
    document.body.style.color = theme[1]
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme[0])
  }, [lang, page, themeIndex])
  useEffect(() => {
    if (!data) return
    let frame = 0
    const update = () => {
      const threshold = document.querySelector('header')?.getBoundingClientRect().height || 64
      const colored = [...document.querySelectorAll<HTMLElement>('main [data-theme-bg][data-theme-text]')]
      const current = [...colored].reverse().find(el => el.getBoundingClientRect().top <= threshold) ?? colored[0]
      setChromeTheme(current ? [current.dataset.themeBg!, current.dataset.themeText!] : theme)
      frame = 0
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [path, data, themeIndex])
  const advanceTheme = useCallback(() => setThemeIndex(value => (value + 1) % palettes.length), [])
  useEffect(() => {
    for (const storage of ['localStorage', 'sessionStorage'] as const) { try { window[storage].setItem('homeThemeIndex', String(themeIndex)) } catch { /* optional */ } }
    document.dispatchEvent(new CustomEvent('home-theme-change', { detail: { index: themeIndex, theme: { light: palettes[themeIndex][0], dark: palettes[themeIndex][1] } } }))
  }, [themeIndex])
  useReveal(`${path}:${!!data}`)

  const style = { '--paper': theme[0], '--ink': theme[1], '--theme-light': theme[0], '--theme-dark': theme[1], '--chrome-paper': chromeTheme[0], '--chrome-ink': chromeTheme[1] } as CSSProperties
  if (!data) return <div className="loading-screen" style={style}><Avatar /><h1>MVChem</h1><p role={error ? 'alert' : 'status'}>{error ? ui(lang, '页面暂时无法加载。', 'The page could not load.', 'ページを読み込めませんでした。', '페이지를 불러올 수 없습니다.') : ui(lang, '加载中…', 'Loading…', '読み込み中…', '불러오는 중…')}</p>{error && <button className="brutalist-tag" onClick={() => setAttempt(n => n + 1)}>{ui(lang, '重试', 'Try again', '再試行', '다시 시도')}</button>}</div>

  return <div className="site" style={style}>
    <a className="skip-link" href="#main">{ui(lang, '跳至正文', 'Skip to content', '本文へ', '본문으로')}</a>
    <SiteHeader lang={lang} page={page} xp={xp} onNavigate={navigate} avatar={<Avatar />} github={data.profile.github} />
    <div className={`route-view ${leaving ? 'route-leaving' : ''}`} key={path}>
      <main id="main">
        {page === 'home' && <HomePage data={data} lang={lang} onProgress={xp.onProgress} onThemeAdvance={advanceTheme} />}
        {page === 'portfolio' && <PortfolioPage data={data} lang={lang} />}
        {page === 'about' && <AboutPage data={data} lang={lang} />}
        {page === 'project' && <ProjectPage data={data} lang={lang} projectId={parts[2] || ''} />}
      </main>
      <SiteFooter data={data} lang={lang} />
    </div>
  </div>
}
