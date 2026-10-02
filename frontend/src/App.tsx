import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Github, Globe2, Menu, MousePointer2, Sparkles, Terminal, X } from 'lucide-react'
import { getSite } from './api'
import type { Lang, Project, SiteData } from './types'
import { BrickGame, PongGame } from './components/MiniGames'

const palettes = [
  ['#cfe1ef', '#0058c0'], ['#bdf1cd', '#168454'], ['#fff2b5', '#986400'],
  ['#ffdac1', '#b34016'], ['#e6dcf8', '#7040aa'], ['#f9d4d9', '#b62c4e'],
]
const readNumber = (key: string) => { try { const n = Number(localStorage.getItem(key)); return Number.isFinite(n) && n >= 0 ? n : 0 } catch { return 0 } }
const save = (key: string, value: number) => { try { localStorage.setItem(key, String(value)) } catch { /* Storage is optional. */ } }

function Mascot({ small = false }: { small?: boolean }) {
  return <svg className={`mascot ${small ? 'mascot-small' : ''}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M21 29 15 13 37 21M63 21 85 13 79 29" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M18 46C18 26 30 19 50 19s32 7 32 27v15c0 16-12 24-32 24S18 77 18 61Z" stroke="currentColor" strokeWidth="3" fill="var(--paper)" />
    <path d="M13 43 6 50v14l11 4m70-25 7 7v14l-11 4M35 85l-4 9m34-9 4 9M50 19v-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="8" r="4" fill="currentColor" />
    <rect x="25" y="36" width="50" height="31" rx="12" fill="currentColor" opacity=".13" />
    <path d="m31 49 6-5 6 5m14 0 6-5 6 5M42 61q8 8 16 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M28 58h5m34 0h5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".4" />
  </svg>
}

function ProjectArt({ kind }: { kind: Project['kind'] }) {
  if (kind === 'orbit') return <div className="project-art orbit-art" aria-hidden="true"><div className="orbit-grid" /><span className="art-caption">ORBIT / 001</span><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-ring ring-three" /><div className="orbit-core"><Sparkles size={38} strokeWidth={1.5} /></div><i className="orbit-dot dot-one" /><i className="orbit-dot dot-two" /><span className="art-foot">IDEAS IN MOTION ↗</span></div>
  if (kind === 'garden') return <div className="project-art garden-art" aria-hidden="true"><span className="art-caption">FIELD NOTES / 002</span><div className="note note-back"><span>make room<br />for ideas.</span></div><div className="note note-front"><span className="note-number">✳</span><strong>stay<br />curious.</strong><span className="note-line" /><span className="note-line short" /></div><span className="art-foot">A PLACE TO GROW ↗</span></div>
  return <div className="project-art play-art" aria-hidden="true"><span className="art-caption">PLAYGROUND / 003</span><div className="play-window"><div className="play-window-bar"><i /><i /><i /></div><div className="play-blocks"><span /><span /><span /><span /><span /><span /></div><i className="play-ball" /><i className="play-paddle" /><MousePointer2 className="play-cursor" size={45} fill="var(--art-ink)" /></div><span className="art-foot">PRESS START, HAVE FUN ↗</span></div>
}

function ProjectDialog({ project, lang, onClose }: { project: Project | null; lang: Lang; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (project) ref.current?.showModal(); else ref.current?.close() }, [project])
  return <dialog ref={ref} className="project-dialog" onClose={onClose} onClick={e => { if (e.target === ref.current) onClose() }} aria-labelledby="project-dialog-title">
    {project && <div style={{ '--art-paper': project.color, '--art-ink': project.ink } as CSSProperties}>
      <button className="dialog-close icon-button" onClick={onClose} aria-label={lang === 'zh' ? '关闭项目详情' : 'Close project'}><X /></button>
      <ProjectArt kind={project.kind} />
      <div className="dialog-copy"><span className="eyebrow">{lang === 'zh' ? '示例项目 · 概念展示' : 'DEMO PROJECT · CONCEPT'}</span><h2 id="project-dialog-title">{project.title[lang]}</h2><p>{project.description[lang]}</p><div className="tags">{project.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><button className="solid-button" onClick={onClose}><ArrowLeft size={18} />{lang === 'zh' ? '返回作品集' : 'Back to projects'}</button></div>
    </div>}
  </dialog>
}

export default function App() {
  const [lang, setLang] = useState<Lang>(location.pathname.startsWith('/en') ? 'en' : 'zh')
  const [data, setData] = useState<SiteData | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [xp, setXp] = useState(() => readNumber('mvchem-xp'))
  const [palette, setPalette] = useState(() => readNumber('mvchem-palette') % palettes.length)
  const [experience, setExperience] = useState(0)
  const [project, setProject] = useState<Project | null>(null)
  const [toast, setToast] = useState('')
  const [activeSection, setActiveSection] = useState('home')
  const languageMenu = useRef<HTMLDivElement>(null)
  const zh = lang === 'zh'
  const t = (cn: string, en: string) => zh ? cn : en

  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    getSite(controller.signal).then(setData).catch(e => { if (e.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') setXp(n => n + 1) }, 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => { save('mvchem-xp', xp) }, [xp])
  useEffect(() => { save('mvchem-palette', palette) }, [palette])
  useEffect(() => { document.documentElement.lang = zh ? 'zh-CN' : 'en'; document.title = t('MVChem · 个人实验场', 'MVChem · A personal playground') }, [lang])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer) }, [toast])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!languageMenu.current?.contains(e.target as Node)) setLanguageOpen(false) }
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); setLanguageOpen(false) } }
    document.addEventListener('click', close); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', escape) }
  }, [])
  useEffect(() => {
    if (!data) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id) })
    }, { rootMargin: '-15% 0px -55% 0px' })
    document.querySelectorAll('#home, #projects, #about').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [data])
  useEffect(() => {
    const pop = () => setLang(location.pathname.startsWith('/en') ? 'en' : 'zh')
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  const reward = useCallback((amount: number) => { setXp(n => n + amount); setPalette(n => (n + 1) % palettes.length); setToast(lang === 'zh' ? `+${amount} XP · 新配色已解锁！` : `+${amount} XP · A new color unlocked!`) }, [lang])
  const changeLanguage = (next: Lang) => { setLang(next); history.pushState(null, '', `/${next}/${location.hash}`); setLanguageOpen(false); setMenuOpen(false) }
  let level = 0; let remaining = xp; let threshold = 10
  while (remaining >= threshold && level < 100) { remaining -= threshold; level++; threshold = Math.floor(10 * 1.5 ** level) }
  const theme = { '--paper': palettes[palette][0], '--ink': palettes[palette][1] } as CSSProperties

  if (!data) return <div className="loading-screen" style={theme}><Mascot /><h1>MVChem</h1><p role={error ? 'alert' : 'status'}>{error ? t('内容暂时没能加载，请重试。', 'Could not load the page. Please try again.') : t('正在打开小小实验场…', 'Opening the playground…')}</p>{error && <button className="solid-button" onClick={() => setAttempt(n => n + 1)}>{t('重新加载', 'Try again')}</button>}</div>

  return <div className={`site ${zh ? 'lang-zh' : 'lang-en'}`} style={theme}>
    <a className="skip-link" href="#home">{t('跳转到正文', 'Skip to content')}</a>
    <header className="site-header">
      <div className="brand-group"><a href="#home" aria-label={t('MVChem 首页', 'MVChem home')} className="mascot-link"><Mascot /></a><div className="brand-meta"><div className="brand-line"><a href="#home" className="wordmark">MVChem</a><span className="brand-divider" /><a className="social-link" href={data.profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github fill="currentColor" size={29} /></a><a className="social-link" href="#projects" aria-label={t('查看作品', 'View projects')}><Code2 size={30} /></a><a className="social-link" href="#playground" aria-label={t('玩小游戏', 'Play games')}><Terminal size={29} /></a></div><div className="xp-row" title={t(`经验值 ${remaining} / ${threshold}，浏览和游戏都能获得经验`, `Experience ${remaining} / ${threshold}. Explore and play to earn XP.`)}><b>Lv {level}</b><div className="xp-track" role="progressbar" aria-label={t('等级经验值', 'Level experience')} aria-valuenow={remaining} aria-valuemin={0} aria-valuemax={threshold}><span style={{ width: `${remaining / threshold * 100}%` }} /></div><span>{t('+1/秒', '+1/sec')}</span></div></div></div>
      <nav className={menuOpen ? 'header-nav is-open' : 'header-nav'} aria-label={t('主导航', 'Main navigation')}>
        {[['home', t('首页', 'Home')], ['projects', t('作品集', 'Projects')], ['about', t('关于我', 'About')]].map(([id, label]) => <a key={id} href={`#${id}`} className={activeSection === id ? 'nav-active' : ''} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <div className="language-menu" ref={languageMenu}><button className="language-trigger" onClick={() => setLanguageOpen(!languageOpen)} aria-expanded={languageOpen} aria-controls="language-options"><Globe2 size={18} /><span>{t('简体中文', 'English')}</span><ChevronDown size={17} /></button>{languageOpen && <div className="language-options" id="language-options"><button onClick={() => changeLanguage('zh')}>简体中文{zh && <Check size={16} />}</button><button onClick={() => changeLanguage('en')}>English{!zh && <Check size={16} />}</button></div>}</div>
      </nav>
      <button className="mobile-menu icon-button" aria-label={menuOpen ? t('关闭导航', 'Close navigation') : t('打开导航', 'Open navigation')} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <main>
      <PongGame lang={lang} onReward={reward} />
      <section className="hero" id="home">
        <div className="hero-orb" /><div className="hero-stripe" /><div className="hero-square" />
        <div className="hero-identity"><h1>{data.profile.name}</h1><h2>{t('用好奇心', 'A curious mind.')}<br />{t('与代码创造', 'A little code.')}<br />{t('一点不一样', 'Something new.')}</h2><div className="tags hero-tags"><span className="tag">{t('探索 AI', 'AI explorer')}</span><span className="tag">{t('动手构建', 'Builder')}</span><span className="tag">{t('保持好奇', 'Stay curious')}</span></div><a className="hero-jump" href="#projects">{t('往下看看', 'Take a look around')}<ArrowDown size={21} /></a></div>
        <div className="hero-intro"><h2>{t('欢迎来到我的个人实验场！', 'Welcome to my little playground!')}</h2><p className="intro-lead">{data.profile.tagline[lang]}</p><p className="intro-secondary">{t('把脑海里的「如果」，变成屏幕上的「试试看」。', 'Turning “what if” into something you can try.')}</p><div className="intro-timeline">{data.profile.intro[lang].map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><div className="hero-stats"><div><strong>∞</strong><span>{t('好奇心', 'Curiosity')}</span></div><div><strong>03</strong><span>{t('示例项目', 'Demo projects')}</span></div><div><strong>02</strong><span>{t('可玩小游戏', 'Mini games')}</span></div></div><div className="status-sticker"><span className="status-dot" />{t('个人主页 · 持续生长中', 'Personal space · Always growing')}<ArrowUpRight size={18} /></div></div>
      </section>

      <section className="experience-section" aria-label={t('探索方向', 'Things I explore')}><div className="experience-deck">{data.experiences.map((item, index) => <article key={item.id} className={`experience-card ${experience === index ? 'is-active' : ''}`} style={{ '--card-paper': item.color, '--card-ink': item.ink } as CSSProperties}>
        <button className="experience-selector" onClick={() => setExperience(index)} aria-expanded={experience === index} aria-controls={`experience-${item.id}`}><span className="experience-number">0{index + 1}</span><span className="experience-mark" aria-hidden="true">{item.mark}</span><strong>{item.organization[lang]}</strong><span className="experience-role">{item.role[lang]}</span><ArrowUpRight className="experience-arrow" size={30} /></button>
        {experience === index && <div className="experience-detail" id={`experience-${item.id}`}><div className="experience-detail-top"><span>{item.role[lang]}</span><span>{item.period[lang]}</span></div><h3>{item.organization[lang]}</h3><ul>{item.description[lang].map(line => <li key={line}>{line}</li>)}</ul><div className="tags">{item.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div></div>}
      </article>)}</div></section>

      <section className="projects-section" id="projects"><div className="section-heading"><div><span className="eyebrow">SELECTED EXPLORATIONS / 01—03</span><h2>{t('一些小小的创造', 'A few things I made')}</h2></div><span className="section-note">{t('示例作品 · 等待真实故事', 'Demo projects · Real stories to come')}<ArrowDown size={20} /></span></div><div className="projects-grid">{data.projects.map(item => <article className="project-card" key={item.id} style={{ '--art-paper': item.color, '--art-ink': item.ink } as CSSProperties}><button className="project-art-button" onClick={() => setProject(item)} aria-label={`${t('查看', 'View')} ${item.title[lang]}`}><ProjectArt kind={item.kind} /><span className="project-open"><ArrowUpRight size={28} /></span></button><div className="project-copy"><div className="project-title-row"><h3>{item.title[lang]}</h3><span className="demo-label">DEMO</span></div><p className="project-subtitle">{item.subtitle[lang]}</p><p>{item.description[lang]}</p><button className="text-button" onClick={() => setProject(item)}>{t('了解更多', 'Explore project')}<ArrowRight size={21} /></button></div></article>)}</div></section>

      <section className="skills-section" id="playground"><div className="skills-copy"><span className="eyebrow">TOOLS, IDEAS & A LITTLE PLAY</span><h2>{t('工具箱', 'My toolbox')}<span className="heading-star">✳</span></h2><p className="skills-intro">{t('从一个念头开始，边做边学。', 'Start with an idea. Learn by making.')}</p>{data.skills.map(group => <div className="skill-group" key={group.label.en}><h3>{group.label[lang]}</h3><div className="skill-tags">{group.items.map((skill, i) => <span className={`skill-tag ${i % 3 === 0 ? 'filled' : ''}`} key={skill}>{skill}</span>)}</div></div>)}<p className="skill-footnote">{t('这里先展示工具与兴趣的示例，之后会换成我的真实经历。', 'These are sample tools and interests, ready for my own story.')}</p></div><div className="brick-column"><BrickGame lang={lang} onReward={reward} /><p className="game-caption"><Sparkles size={17} />{t('休息一下。通关，解锁整个网站的新配色。', 'Take a break. Clear a level to unlock a new color.')}</p></div></section>

      <section className="about-section" id="about"><div><span className="eyebrow">A LITTLE MORE ABOUT ME</span><h2>{t('保持好奇。', 'Stay curious.')}<br />{t('然后，动手去做。', 'Then, make it real.')}</h2><p>{data.about[lang]}</p><a className="solid-button" href={data.profile.github} target="_blank" rel="noreferrer"><Github size={21} />{t('在 GitHub 找到我', 'Find me on GitHub')}<ArrowUpRight size={20} /></a></div><div className="about-stamp" aria-hidden="true"><span>HELLO, WORLD.</span><Mascot /><span>LET’S MAKE SOMETHING.</span></div></section>
    </main>
    <footer className="site-footer"><a className="footer-brand" href="#home">MVChem<span>↗</span></a><nav aria-label={t('页脚导航', 'Footer navigation')}><a href="#home">{t('首页', 'Home')}</a><a href="#projects">{t('作品集', 'Projects')}</a><a href="#about">{t('关于我', 'About')}</a><a href={data.profile.github} target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={14} /></a></nav><div className="footer-bottom"><span>© {new Date().getFullYear()} MVChem. {t('用好奇心搭建。', 'Made with curiosity.')}</span><span>{t('UI 灵感来自', 'UI inspired by')} <a href="https://huxx.me/zh/" target="_blank" rel="noreferrer">huxx.me ↗</a></span><a href="#home">{t('回到顶部', 'Back to top')} ↑</a></div></footer>
    <ProjectDialog project={project} lang={lang} onClose={() => setProject(null)} />
    {toast && <div className="reward-toast" role="status"><Sparkles size={20} />{toast}</div>}
  </div>
}
