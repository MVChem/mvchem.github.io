import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { Lang } from '../types'
import type { ExperienceBadge, ExperienceState } from '../hooks/useExperience'
import './header.css'

type HeaderPage = 'home' | 'portfolio' | 'about' | 'project'
export interface HeaderSocial { label: string; href?: string; icon?: ReactNode }
export interface SiteHeaderProps {
  lang: Lang
  page: HeaderPage
  xp: ExperienceState
  onNavigate: (path: string) => void
  avatar: ReactNode
  github: string
  socials?: HeaderSocial[]
}

const languages = [
  { id: 'zh', label: '简体中文' }, { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' }, { id: 'ko', label: '한국어' },
] as const

const copy = {
  zh: { home: '首页', portfolio: '作品集', about: '关于我', exp: '经验值:', rate: '/秒', help: '每秒获得经验值，完成小游戏以获得更多经验值！', bonus: '经验加成: +', unit: ' 经验/秒', reached: (level: number) => `已达到第 ${level} 级`, stages: ['初级', '中级', '高级', '精英', '大师', '巅峰'], brick: '打砖块', missing: '待补充', menu: '切换菜单' },
  en: { home: 'Home', portfolio: 'Portfolio', about: 'About Me', exp: 'EXP:', rate: '/s', help: 'Gain EXP every second. Complete minigames to earn more EXP!', bonus: 'Bonus: +', unit: ' EXP/s', reached: (level: number) => `Reached Level ${level}`, stages: ['Junior', 'Intermediate', 'Senior', 'Elite', 'Master', 'Peak'], brick: 'Brick', missing: 'Not set yet', menu: 'Toggle Menu' },
  ja: { home: 'ホーム', portfolio: 'ポートフォリオ', about: '私について', exp: '経験値:', rate: '/秒', help: '毎秒経験値を獲得。ミニゲームをクリアしてさらに多くの経験値を獲得！', bonus: 'ボーナス: +', unit: ' 経験値/秒', reached: (level: number) => `レベル ${level} に到達`, stages: ['初級', '中級', '上級', 'エリート', 'マスター', '頂上'], brick: 'ブロック崩し', missing: '未設定', menu: 'メニューを切り替え' },
  ko: { home: '홈', portfolio: '포트폴리오', about: '내 소개', exp: 'EXP:', rate: '/초', help: '매초 경험치를 획득하고, 미니게임을 완료해 더 많은 경험치를 획득하세요!', bonus: '경험치 보너스: +', unit: ' EXP/초', reached: (level: number) => `레벨 ${level} 달성`, stages: ['초급', '중급', '고급', '엘리트', '마스터', '정점'], brick: '벽돌깨기', missing: '미설정', menu: '메뉴 전환' },
}

function SocialIcon({ label }: { label: string }) {
  const icon = { LinkedIn: 'linkedin-in', GitHub: 'github', YouTube: 'youtube', Bilibili: 'bilibili' }[label] ?? 'github'
  return <i className={`fa-brands fa-${icon}`} aria-hidden="true" />
}

function BadgeIcon({ game }: { game: ExperienceBadge['game'] }) {
  return <i className={`fa-solid ${game === 'pong' ? 'fa-table-tennis-paddle-ball' : 'fa-cubes-stacked'}`} aria-hidden="true" />
}

export function SiteHeader({ lang, page, xp, onNavigate, avatar, github, socials }: SiteHeaderProps) {
  const [languageOpen, setLanguageOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const languageMenu = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const mobileMenu = useRef<HTMLDivElement>(null)
  const t = copy[lang]
  const links = [
    { page: 'home', href: `/${lang}/`, text: t.home },
    { page: 'portfolio', href: `/${lang}/portfolio/`, text: t.portfolio },
    { page: 'about', href: `/${lang}/aboutme/`, text: t.about },
  ]
  const socialItems: HeaderSocial[] = socials ?? [
    { label: 'LinkedIn' }, { label: 'GitHub', href: github }, { label: 'YouTube' }, { label: 'Bilibili' },
  ]
  const expText = `${t.exp} ${xp.currentXp} / ${xp.nextLevelXp}`

  useEffect(() => {
    const clickOutside = (event: globalThis.MouseEvent) => {
      if (!languageMenu.current?.contains(event.target as Node)) setLanguageOpen(false)
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLanguageOpen(false)
        if (mobileOpen) { setMobileOpen(false); menuButton.current?.focus() }
      }
      if (event.key === 'Tab' && mobileOpen) {
        const focusable = [...(mobileMenu.current?.querySelectorAll<HTMLElement>('a[href], button') ?? []), menuButton.current!].filter(Boolean)
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('click', clickOutside)
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('click', clickOutside); document.removeEventListener('keydown', keydown) }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [mobileOpen])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const close = () => { if (desktop.matches) setMobileOpen(false) }
    desktop.addEventListener('change', close)
    return () => desktop.removeEventListener('change', close)
  }, [])

  const navigate = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    setLanguageOpen(false)
    setMobileOpen(false)
    onNavigate(path)
  }

  // Preserve the current page (including a project slug) when changing language.
  const languagePath = (nextLang: string) => {
    const current = window.location.pathname
    if (/^\/(zh|en|ja|ko)(\/|$)/.test(current)) return current.replace(/^\/(zh|en|ja|ko)(?=\/|$)/, `/${nextLang}`) + window.location.search + window.location.hash
    const suffix = page === 'portfolio' ? 'portfolio/' : page === 'about' ? 'aboutme/' : ''
    return `/${nextLang}/${suffix}`
  }

  const socialLinks = (mobile = false) => <div className={`reference-socials${mobile ? ' reference-socials-mobile' : ''}`}>
    {socialItems.map(social => social.href
      ? <a key={social.label} href={social.href} className="reference-social" aria-label={social.label} target="_blank" rel="noopener noreferrer">{social.icon ?? <SocialIcon label={social.label} />}</a>
      : <span key={social.label} className="reference-social reference-social-unset" title={`${social.label} · ${t.missing}`} role="img" aria-label={`${social.label} · ${t.missing}`}>{social.icon ?? <SocialIcon label={social.label} />}</span>)}
  </div>

  const progressBar = (mobile = false) => <div className={`reference-exp-track${mobile ? ' reference-exp-track-mobile' : ''}`} role="progressbar" aria-label={t.exp.replace(':', '')} aria-valuenow={xp.currentXp} aria-valuemin={0} aria-valuemax={xp.nextLevelXp} aria-valuetext={expText}>
    <span className="reference-exp-fill" style={{ width: `${Math.min(xp.currentXp / xp.nextLevelXp * 100, 100)}%` }} />
  </div>

  const badgeName = (badge: ExperienceBadge) => `${badge.game === 'pong' ? 'Pong' : t.brick} ${t.stages[badge.level - 1]}`
  const badgeItems = (mobile = false) => xp.badges.map(badge => <div className={`reference-badge-wrap${mobile ? ' reference-badge-wrap-mobile' : ' reference-tooltip-anchor'}`} key={badge.game} tabIndex={mobile ? undefined : 0}>
    <span className="reference-badge"><BadgeIcon game={badge.game} /><span>{badge.label}</span>{mobile && <span className="reference-badge-mobile-name">· {badgeName(badge)}</span>}</span>
    {!mobile && <div className="reference-tooltip reference-badge-tooltip" role="tooltip"><div className="reference-badge-title">{badgeName(badge)}</div><div className="reference-badge-bonus">{t.bonus}{badge.bonusRate}{t.unit}</div><div className="reference-badge-description">{t.reached(badge.level)}</div></div>}
  </div>)

  return <header className="site-header reference-header" data-lang={lang}>
    <div className="reference-brand-group">
      <div className="reference-avatar">{avatar}</div>
      <div className="reference-brand-meta">
        <div className="reference-brand-line">
          <a className="reference-nav-link reference-wordmark" href={`/${lang}/`} onClick={event => navigate(event, `/${lang}/`)}>MVChem</a>
          <span className="reference-brand-divider" />
          {socialLinks()}
        </div>
        <div className="reference-experience-row">
          <div className="reference-tooltip-anchor reference-player-level" tabIndex={0}><span>Lv {xp.level}</span><div className="reference-tooltip" role="tooltip">{t.help}</div></div>
          <div className="reference-tooltip-anchor reference-progress-wrap" tabIndex={0}>{progressBar()}<div className="reference-tooltip" role="tooltip">{expText}</div></div>
          <span className="reference-exp-rate">+{xp.rate}{t.rate}</span>
          {badgeItems()}
        </div>
      </div>
    </div>
    <nav className="reference-desktop-nav" aria-label={lang === 'zh' ? '主导航' : 'Main navigation'}>
      {links.map(link => <a className="reference-nav-link" key={link.page} href={link.href} aria-current={page === link.page ? 'page' : undefined} onClick={event => navigate(event, link.href)}>{link.text}</a>)}
      <div className="reference-language-menu" data-open={languageOpen} ref={languageMenu}>
        <button type="button" className="reference-nav-link reference-language-trigger" aria-expanded={languageOpen} aria-controls="reference-language-panel" aria-haspopup="true" aria-label="Language options" onClick={() => setLanguageOpen(open => !open)}><span className="reference-language-name">{languages.find(language => language.id === lang)?.label}</span><i className="fa-solid fa-chevron-down" aria-hidden="true" /></button>
        <div className="reference-language-panel" id="reference-language-panel"><div className="reference-language-options">{languages.map(language => <a key={language.id} href={languagePath(language.id)} lang={language.id} className="reference-language-name" onClick={event => navigate(event, languagePath(language.id))}>{language.label}</a>)}</div></div>
      </div>
    </nav>
    <button ref={menuButton} type="button" className="reference-mobile-trigger" aria-label={t.menu} aria-expanded={mobileOpen} aria-controls="reference-mobile-menu" onClick={() => setMobileOpen(open => !open)}><i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" /></button>
    <div className={`reference-mobile-menu${mobileOpen ? ' is-open' : ''}`} id="reference-mobile-menu" ref={mobileMenu} inert={!mobileOpen} aria-hidden={!mobileOpen}>
      <div className="reference-mobile-experience"><div className="reference-mobile-experience-line"><span className="reference-mobile-level">Lv {xp.level}</span>{progressBar(true)}<span className="reference-exp-rate">+{xp.rate}{t.rate}</span></div><div className="reference-mobile-exp-text">{expText}</div><div className="reference-mobile-badges">{badgeItems(true)}</div></div>
      <div className="reference-mobile-rule" />
      {links.map(link => <a className="reference-nav-link reference-mobile-nav-link" key={link.page} href={link.href} aria-current={page === link.page ? 'page' : undefined} onClick={event => navigate(event, link.href)}>{link.text}</a>)}
      <div className="reference-mobile-rule" />
      <div className="reference-mobile-languages"><span className="reference-mobile-language-label"><i className="fa-solid fa-globe" aria-hidden="true" />Language</span><div>{languages.map(language => <a href={languagePath(language.id)} className={`reference-language-name${lang === language.id ? ' is-current' : ''}`} key={language.id} lang={language.id} onClick={event => navigate(event, languagePath(language.id))}>{language.label}</a>)}</div></div>
      {socialLinks(true)}
    </div>
  </header>
}

export default SiteHeader
