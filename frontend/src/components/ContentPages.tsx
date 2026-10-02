import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Code2, Search, Sparkles, X } from 'lucide-react'
import type { Lang, Project, SiteData } from '../types'
import './content-pages.css'
export { AboutPage } from './AboutPage'

const t = (lang: Lang, zh: string, en: string, ja: string, ko: string) => ({ zh, en, ja, ko })[lang]
const theme = (paper: string, ink: string, extra: Record<string, string> = {}) => ({ '--paper': paper, '--ink': ink, ...extra }) as CSSProperties
const portfolioPaper = '#f5ebd6'
const portfolioInk = '#494947'

export function ProjectArtwork({ project, large = false }: { project: Project; large?: boolean }) {
  return <div className={`cp-art cp-art-${project.kind} ${large ? 'cp-art-large' : ''}`} style={theme(project.color, project.ink)} aria-hidden="true">
    <span className="cp-art-index">{project.year} / {project.id === 'orbit' ? '01' : project.id === 'field-notes' ? '02' : '03'}</span>
    {project.kind === 'orbit' ? <div className="cp-orbit"><span /><span /><span /><i /><b><Sparkles /></b></div>
      : project.kind === 'garden' ? <div className="cp-notes"><div><span>FIELD<br />NOTES</span><i /><i /><i /></div><b>✳</b></div>
        : <div className="cp-play"><div className="cp-play-bar"><i /><i /><i /></div><div className="cp-play-shapes"><i /><i /><i /><i /><i /><i /></div><b /><span /></div>}
    <strong className="cp-art-title">{project.title.en}</strong>
    <span className="cp-art-footer">{project.kind === 'orbit' ? 'IDEAS IN MOTION' : project.kind === 'garden' ? 'A PLACE FOR IDEAS' : 'PRESS START'}</span>
  </div>
}

function ProjectCard({ project, lang }: { project: Project; lang: Lang }) {
  return <a className="cp-project-card" href={`/${lang}/projects/${project.id}/`}>
    <ProjectArtwork project={project} />
    <div className="cp-project-copy"><h3>{project.title[lang]}<ArrowUpRight size={25} /></h3><p>{project.description[lang]}</p><div className="cp-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
  </a>
}

function CyclingTitle({ data, lang }: { data: SiteData; lang: Lang }) {
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const categories = data.portfolio.categories
  const word = categories[index % categories.length].title[lang]
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setLength(word.length); return }
    const timer = setTimeout(() => {
      if (length < word.length) setLength(length + 1)
      else { setIndex(n => (n + 1) % categories.length); setLength(0) }
    }, length < word.length ? 95 : 2100)
    return () => clearTimeout(timer)
  }, [length, word, categories.length])
  return <div className="cp-role-line">{t(lang, '我在探索', 'Exploring', '探究していること', '탐구하는 것')} <span style={{ color: categories[index % categories.length].color }}>{word.slice(0, length)}<i /></span></div>
}

export function PortfolioPage({ data, lang }: { data: SiteData; lang: Lang }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [illustration, setIllustration] = useState('design')
  const projects = useMemo(() => data.projects.filter(project => {
    const text = `${project.title[lang]} ${project.subtitle[lang]} ${project.description[lang]} ${project.tags.join(' ')}`.toLocaleLowerCase()
    return (filter === 'all' || project.categoryIds.includes(filter)) && text.includes(query.trim().toLocaleLowerCase())
  }), [data, lang, query, filter])
  return <div className="cp-portfolio" style={theme(portfolioPaper, portfolioInk)} data-theme-bg={portfolioPaper} data-theme-text={portfolioInk}>
    <section className="cp-portfolio-intro cp-width">
      <h1>{t(lang, '作品集', 'Portfolio', '作品集', '포트폴리오')}</h1>
      <CyclingTitle data={data} lang={lang} />
      <div className="cp-slanted-intro"><div>{data.portfolio.intro[lang].map(line => <p key={line}>{line}</p>)}</div></div>
      <div className="cp-category-overview"><div className="cp-category-illustration" aria-hidden="true"><div className="cp-illustration-stage">{data.portfolio.categories.map(category => <img key={category.id} src={`/reference/portfolio-${category.id}.svg`} alt="" className={illustration === category.id ? 'is-active' : ''} />)}</div></div><div className="cp-category-menu">{data.portfolio.categories.map((category, index) => <a href={`#${category.id}`} key={category.id} onPointerEnter={() => setIllustration(category.id)} onFocus={() => setIllustration(category.id)} style={{ '--accent': category.color } as CSSProperties}>
        <div><header><strong>{index + 1}</strong><h2>{category.title[lang]}</h2><span>{category.projectIds.length} {t(lang, '个项目', 'projects', '作品', '개 프로젝트')} <ArrowRight size={19} /></span></header><p>{category.description[lang]}</p></div>
      </a>)}</div></div>
    </section>
    {data.portfolio.categories.map((category, index) => <section className="cp-category-section" id={category.id} key={category.id} style={theme(portfolioPaper, portfolioInk, { '--accent': category.color })} data-theme-bg={portfolioPaper} data-theme-text={portfolioInk}>
      <div className="cp-marquee" aria-hidden="true"><div>{Array.from({ length: 10 }, (_, i) => <span key={i}>{index + 1} · {category.title[lang]} <b>▸</b></span>)}</div></div>
      <div className="cp-width"><h2 className="cp-section-heading"><strong>{index + 1}</strong>{category.title[lang]}</h2><div className="cp-section-rule"><span>{category.title[lang]}</span><i /><b>{category.projectIds.length}</b></div><div className={`cp-selected-projects cp-selected-${category.projectIds.length}`}>{category.projectIds.map(id => data.projects.find(project => project.id === id)).filter((project): project is Project => !!project).map(project => <ProjectCard key={project.id} project={project} lang={lang} />)}</div></div>
    </section>)}
    <section className="cp-library cp-width" id="library" data-theme-bg={portfolioPaper} data-theme-text={portfolioInk} style={theme(portfolioPaper, portfolioInk)}>
      <h2 className="cp-section-heading"><strong>5</strong>{t(lang, '项目库', 'Project library', 'プロジェクト一覧', '프로젝트 모음')} <small>({data.projects.length})</small></h2>
      <div className="cp-library-controls"><label className="cp-search"><Search size={22} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t(lang, '搜索项目、标签…', 'Search projects, tags…', '作品やタグを検索…', '프로젝트, 태그 검색…')} aria-label={t(lang, '搜索项目', 'Search projects', '作品を検索', '프로젝트 검색')} />{query && <button onClick={() => setQuery('')} aria-label={t(lang, '清空搜索', 'Clear search', '検索をクリア', '검색 지우기')}><X size={20} /></button>}</label><select value={filter} onChange={event => setFilter(event.target.value)} aria-label={t(lang, '项目分类', 'Project category', 'カテゴリー', '프로젝트 분류')}><option value="all">{t(lang, '全部分类', 'All categories', 'すべて', '전체 분류')}</option>{data.portfolio.categories.map(category => <option value={category.id} key={category.id}>{category.title[lang]}</option>)}</select></div>
      <div className="cp-project-library">{projects.map(project => <ProjectCard key={project.id} project={project} lang={lang} />)}</div>
      {projects.length === 0 && <p className="cp-empty" role="status">{t(lang, '没有匹配的项目，换个关键词试试。', 'No matching projects. Try another keyword.', '一致する作品がありません。別のキーワードをお試しください。', '일치하는 프로젝트가 없습니다. 다른 검색어를 입력해 보세요.')}</p>}
    </section>
  </div>
}

export function ProjectPage({ data, lang, projectId }: { data: SiteData; lang: Lang; projectId: string }) {
  const project = data.projects.find(item => item.id === projectId)
  const [zoom, setZoom] = useState(false)
  const lightbox = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!zoom) return
    lightbox.current?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [zoom])
  if (!project) return <section className="cp-missing cp-width"><h1>{t(lang, '没有找到这个项目', 'Project not found', '作品が見つかりません', '프로젝트를 찾을 수 없습니다')}</h1><a href={`/${lang}/portfolio/`}><ArrowLeft />{t(lang, '返回作品集', 'Back to portfolio', '作品集へ戻る', '포트폴리오로 돌아가기')}</a></section>
  const paper = '#2d262c', ink = '#e3dcc9'
  const index = data.projects.indexOf(project)
  return <article className="cp-project-page" style={theme(paper, ink, { '--accent': project.ink })} data-theme-bg={paper} data-theme-text={ink}>
    <section className="cp-project-hero" data-theme-bg={paper} data-theme-text={ink} style={theme(paper, ink)}>
      <div className="cp-project-backdrop"><ProjectArtwork project={project} large /></div>
      <div className="cp-project-hero-content cp-width"><a className="cp-back-link" href={`/${lang}/portfolio/`}><ArrowLeft size={23} />{t(lang, '返回', 'Back', '戻る', '돌아가기')}</a><div className="cp-project-hero-columns"><div><div className="cp-project-badges"><span>#{String(index + 1).padStart(2, '0')}</span><span><Code2 size={20} /> {project.role[lang]}</span></div><h1>{project.title[lang]}</h1><h2>{project.subtitle[lang]}</h2><div className="cp-project-badges cp-project-tech">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div><p className="cp-project-description">{project.description[lang]}</p></div><button className="cp-project-cover" onClick={() => setZoom(true)} aria-label={t(lang, '放大项目封面', 'Enlarge project cover', 'カバーを拡大', '프로젝트 표지 확대')}><ProjectArtwork project={project} large /><span><Search size={18} />{t(lang, '查看封面', 'View cover', 'カバーを見る', '표지 보기')}</span></button></div></div>
    </section>
    <div className="cp-project-details cp-width"><nav className="cp-project-outline" aria-label={t(lang, '项目目录', 'Project contents', '目次', '프로젝트 목차')}>{project.details.map((detail, i) => <a href={`#detail-${i}`} key={detail.heading.en}>{detail.heading[lang]}<ArrowRight size={17} /></a>)}</nav><div className="cp-project-body">{project.details.map((detail, i) => <section id={`detail-${i}`} key={detail.heading.en}><h2>{detail.heading[lang]}</h2>{detail.paragraphs[lang].map(paragraph => <p key={paragraph}>{paragraph}</p>)}{i === 0 && <figure><ProjectArtwork project={project} large /><figcaption>{project.subtitle[lang]} · {project.role[lang]}</figcaption></figure>}</section>)}<a className="cp-back-link" href={`/${lang}/portfolio/`}><ArrowLeft size={21} />{t(lang, '返回作品集', 'Back to portfolio', '作品集へ戻る', '포트폴리오로 돌아가기')}</a></div></div>
    {zoom && <dialog ref={lightbox} className="cp-lightbox" aria-label={project.title[lang]} onClose={() => setZoom(false)} onClick={event => { if (event.target === event.currentTarget) setZoom(false) }}><button autoFocus onClick={() => setZoom(false)} aria-label={t(lang, '关闭', 'Close', '閉じる', '닫기')}><X size={30} /></button><div><ProjectArtwork project={project} large /></div></dialog>}
  </article>
}
