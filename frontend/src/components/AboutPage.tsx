import { Fragment, useState, type CSSProperties } from 'react'
import type { Lang, SiteData } from '../types'
import { ui } from './SiteChrome'
import './about-page.css'

type Props = { data: SiteData; lang: Lang }
type Interest = SiteData['aboutPage']['sections'][number]
const colors = [['#CFE1EF', '#0058C0'], ['#E8D6F4', '#7B1897'], ['#BDF1CD', '#16A062']]

/** Decorative SVG artwork from the public reference; attribution is in public/reference/NOTICE.txt. */
function InterestDrawing({ kind }: { kind: Interest['kind'] }) {
  const viewBox = { play: '0 0 415 700', read: '0 0 769 700', build: '0 0 521 700' }[kind]
  return <svg className="about-reference-art" viewBox={viewBox} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <use href={`/reference/about-${kind}.svg#art`} />
  </svg>
}

function InterestPicture({ kind, index = 0 }: { kind: Interest['kind']; index?: number }) {
  return <svg className={`about-picture picture-${kind}`} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="300" fill={colors[index % colors.length][0]} />
    <g stroke="currentColor" strokeWidth="5" strokeLinejoin="round" fill="none">
      {kind === 'play' ? <><path d="M0 236h400M48 236V71h304v165" opacity=".25" /><rect x="91" y="61" width="218" height="140" rx="8" fill="#fffdf8" /><path d="M91 91h218M116 77h1m15 0h1m15 0h1" /><rect x="123" y="115" width="39" height="19" rx="3" fill="currentColor" /><rect x="180" y="115" width="39" height="19" rx="3" /><rect x="237" y="115" width="39" height="19" rx="3" fill="currentColor" /><circle cx="203" cy="157" r="8" fill="currentColor" /><path d="M162 185h78" strokeWidth="9" strokeLinecap="round" /><path d="m158 238 22-21h40l23 21m-124 0h161" /><path d="m50 42 12 4m268 9 15-5m-8 124 15 7" /></> : kind === 'read' ? <><path d="m67 226 213-7 34 28-213 7-34-28Z" fill="#fffdf8" /><path d="M67 205v21m34 7v21m213-29v22" /><path d="m83 174 207 9 14 27-207-9-14-27Z" fill="#fffdf8" /><path d="m137 59 72 16 76-16v135l-76 18-72-18V59Z" fill="#fffdf8" /><path d="M209 75v137m-54-128 35 8m-35 12 35 8m-35 12 35 8m-35 12 35 8m38-59 39-9m-39 29 39-9m-39 29 39-9m-39 29 39-9" strokeWidth="3" /><path d="m79 84 11-11m212 23 17-3m-209 44-16 3" /></> : <><path d="M37 253h326" /><rect x="85" y="70" width="232" height="156" rx="8" fill="#fffdf8" /><path d="M85 102h232m-132 124-8 25m51-25 8 25" /><path d="m155 133-22 20 22 20m89-40 22 20-22 20m-31-47-24 57" strokeWidth="8" strokeLinecap="round" /><rect x="35" y="188" width="30" height="65" rx="5" fill="#fffdf8" /><path d="M43 188v-39m14 39 7-31m278 95v-35m-9 11h19" /></>}
    </g>
  </svg>
}

export function AboutPage({ data, lang }: Props) {
  const [journey, setJourney] = useState<'work' | 'ideas'>('work')
  const [favoriteSize, setFavoriteSize] = useState(240)
  const [librarySize, setLibrarySize] = useState(180)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeInterest, setActiveInterest] = useState<string | null>(null)
  const interests = data.aboutPage.sections
  const cards = journey === 'work'
    ? data.projects.map((project, index) => ({ id: project.id, title: project.title[lang], description: project.description[lang], tags: project.tags, href: `/${lang}/projects/${project.id}/`, kind: (project.kind === 'garden' ? 'read' : project.kind === 'orbit' ? 'build' : 'play') as Interest['kind'], index }))
    : interests.map((interest, index) => ({ id: interest.id, title: interest.title[lang], description: interest.description[lang], tags: interest.tags[lang], href: `#interest-${interest.id}`, kind: interest.kind, index }))
  const tags = [...new Set(cards.flatMap(card => card.tags))]
  const visible = cards.filter(card => !selectedTags.length || card.tags.some(tag => selectedTags.includes(tag)))
  const toggleJourney = () => { setJourney(value => value === 'work' ? 'ideas' : 'work'); setSelectedTags([]) }
  const toggleTag = (tag: string) => setSelectedTags(previous => previous.includes(tag) ? previous.filter(value => value !== tag) : [...previous, tag])
  const journeyLabel = ui(lang, '点击切换创作与灵感旅程', 'Switch between work and ideas', '制作とアイデアを切り替え', '작품과 아이디어 전환')
  const all = ui(lang, '全部', 'All', 'すべて', '전체')

  return <div className="about-page">
    <section className="about-introduction" data-theme-bg="#F6EBD8" data-theme-text="#494949">
      <h1 data-reveal="up" data-reveal-once>{data.aboutPage.greeting[lang]}</h1>
      <ul className="about-hobbies" data-reveal="up" data-reveal-once>{interests.map((interest, index) => {
        const style = { '--interest-light': colors[index % colors.length][0], '--interest-dark': colors[index % colors.length][1], gridRow: index + 1 } as CSSProperties
        const side = index % 2 ? 'side-right' : 'side-left'
        const selected = activeInterest === interest.id ? ' is-selected' : ''
        return <Fragment key={interest.id}>
          <li id={`interest-${interest.id}`} className={`about-hobby ${side}${selected}`} style={style} onMouseEnter={() => setActiveInterest(interest.id)} onMouseLeave={() => setActiveInterest(null)} onFocus={() => setActiveInterest(interest.id)} onBlur={() => setActiveInterest(null)} tabIndex={0}>
            <div className="about-hobby-media"><InterestDrawing kind={interest.kind} /></div>
            <div className="about-hobby-text"><h2>{interest.title[lang]}</h2><div className="about-hobby-notes">{interest.tags[lang].map(tag => <span key={tag}>{tag}</span>)}</div></div>
          </li>
          <li className={`about-photo-cell ${side}${selected}`} style={style} onMouseEnter={() => setActiveInterest(interest.id)} onMouseLeave={() => setActiveInterest(null)} aria-hidden="true"><figure className="about-photo"><InterestPicture kind={interest.kind} index={index} /></figure></li>
        </Fragment>
      })}</ul>
    </section>
    <section className="about-journey" id="creative-journey" data-theme-bg="#F6EBD8" data-theme-text="#494949" style={{ '--favorite-size': `${favoriteSize}px`, '--library-size': `${librarySize}px` } as CSSProperties}>
      <div className="about-journey-title" data-reveal="scale"><div className="about-title-sign"><i /><i /><i /><i /><h2><span>{ui(lang, '我的', 'My ', '私の', '나의 ')}</span><button type="button" className="about-journey-word" onClick={toggleJourney} aria-label={journeyLabel} title={journeyLabel}><span key={journey}>{journey === 'work' ? ui(lang, '创作', 'work', '制作', '창작') : ui(lang, '灵感', 'ideas', 'アイデア', '영감')}</span></button><span>{ui(lang, '旅程', ' journey', 'の旅', ' 여정')}</span></h2></div></div>
      <div className="about-journey-content">
        <div className="about-story-grid" data-reveal-group="110"><article className="about-story"><span className="about-story-pin" /><h3>{ui(lang, '个人档案', 'Personal notes', 'プロフィール', '개인 기록')}</h3>{data.aboutPage.intro[lang].map(paragraph => <p key={paragraph}>{paragraph}</p>)}</article><article className="about-story"><span className="about-story-pin" /><h3>{ui(lang, '从好奇心开始', 'Begin with curiosity', '好奇心から始める', '호기심에서 시작')}</h3>{interests.map(interest => <p key={interest.id}>{interest.description[lang]}</p>)}</article></div>
        <div className="about-collection-heading"><h3>{ui(lang, '一些小小的探索', 'A few explorations', '小さな探求', '작은 탐구들')}</h3><span className="about-heading-line" /><label className="about-card-size"><i className="fa-solid fa-compress" aria-hidden="true" /><input type="range" min="160" max="420" value={favoriteSize} onChange={event => setFavoriteSize(Number(event.target.value))} aria-label={ui(lang, '展示卡片大小', 'Featured card size', '展示カードのサイズ', '추천 카드 크기')} /><i className="fa-solid fa-expand" aria-hidden="true" /></label></div>
        <div className="about-favorites">{cards.map(card => <a href={card.href} key={card.id} className="about-favorite-card"><div className="about-favorite-image"><InterestPicture kind={card.kind} index={card.index} /></div><div><h4 title={card.title}>{card.title}</h4><p>{card.description}</p></div></a>)}</div>
        <div className="about-collection-heading about-library-heading"><h3>{journey === 'work' ? ui(lang, '作品库', 'Work library', '作品ライブラリ', '작품 목록') : ui(lang, '灵感库', 'Idea library', 'アイデアライブラリ', '아이디어 목록')} <span className="about-library-count">( {selectedTags.length ? `${visible.length} / ${cards.length}` : cards.length} )</span></h3><span className="about-heading-line" /><label className="about-card-size library-size"><i className="fa-solid fa-compress" aria-hidden="true" /><input type="range" min="120" max="320" value={librarySize} onChange={event => setLibrarySize(Number(event.target.value))} aria-label={ui(lang, '作品库卡片大小', 'Library card size', '一覧カードのサイズ', '목록 카드 크기')} /><i className="fa-solid fa-expand" aria-hidden="true" /></label></div>
        <div className="about-library-filters" aria-label={ui(lang, '按标签筛选', 'Filter by tag', 'タグで絞り込む', '태그 필터')}><button type="button" aria-pressed={!selectedTags.length} onClick={() => setSelectedTags([])}>{all}</button>{tags.map(tag => <button type="button" key={tag} aria-pressed={selectedTags.includes(tag)} onClick={() => toggleTag(tag)}>{tag}<span>{cards.filter(card => card.tags.includes(tag)).length}</span></button>)}</div>
        <div className="about-library" aria-live="polite">{visible.map(card => <a key={card.id} href={card.href} className="about-library-card"><div><InterestPicture kind={card.kind} index={card.index} /><h4 title={card.title}>{card.title}</h4><p>{card.tags.join(' · ')}</p></div></a>)}</div>
      </div>
    </section>
  </div>
}
