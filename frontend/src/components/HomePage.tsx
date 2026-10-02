import { useState, type CSSProperties } from 'react'
import type { Lang, SiteData } from '../types'
import { Avatar, SkillIcon, Tag, ui, skillLabel } from './SiteChrome'
import { BrickGame, PongGame } from './MiniGames'

type Props = { data: SiteData; lang: Lang; onProgress: (game: 'pong' | 'brick', level: number) => void; onThemeAdvance: () => void }
const statIcons = { projects: 'diagram-project', games: 'gamepad', awards: 'trophy', education: 'graduation-cap' }
const marks = ['AI LAB', 'BUILD', 'PLAY', 'NOTES']

export default function HomePage({ data, lang, onProgress, onThemeAdvance }: Props) {
  const [activeExperience, setActiveExperience] = useState(0)
  const gameSkills = data.skills.flatMap(group => group.items.map(name => ({ name: skillLabel(name, lang), proficient: group.proficient.includes(name), icon: <SkillIcon name={name} /> })))
  return <>
    <PongGame lang={lang} onProgress={onProgress} onThemeAdvance={onThemeAdvance} />
    <section className="home-hero" id="hero-section">
      <div className="hero-orb" /><div className="hero-strip" /><div className="hero-square" />
      <div className="hero-content"><div className="hero-columns">
        <div className="hero-identity" data-reveal-group="90" data-reveal-once>
          <h1>{data.profile.name}</h1>
          <h2>{data.profile.heroLines[lang].map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</h2>
          <div className="hero-tags">{data.profile.heroTags[lang].map(tag => <Tag key={tag}>{tag}</Tag>)}</div>
        </div>
        <div className="hero-intro" data-reveal-group="80" data-reveal-once>
          <div className="intro-welcome">{ui(lang, '欢迎来到我的作品集网站！', 'Welcome to my portfolio!', 'ポートフォリオへようこそ！', '포트폴리오에 오신 것을 환영합니다!')}</div>
          <div className="intro-title">{data.profile.tagline[lang]}</div>
          <div className="intro-subtitle">{data.profile.subheading[lang]}</div>
          <ul className="intro-list">{data.profile.intro[lang].map((paragraph, i) => <li key={i}><p>{paragraph}</p></li>)}</ul>
        </div>
      </div><div className="hero-stats" data-reveal-group="60" data-reveal-once>{data.profile.stats.map(stat => <div key={stat.icon}>
        <i className={`fa-solid fa-${statIcons[stat.icon]}`} aria-hidden="true" /><div><strong>{stat.value[lang]}</strong><span>{stat.label[lang]}</span></div>
      </div>)}</div></div>
      <div className="hero-watermark" data-reveal="scale" data-reveal-once style={{ '--reveal-delay': '260ms' } as CSSProperties}><Avatar /></div>
    </section>
    <section className="home-experience" id="experience-section" aria-label={ui(lang, '经历', 'Experience', '経験', '경험')}>
      <div className="experience-deck" data-reveal-group="90">{data.experiences.map((item, i) => <article
        className={`experience-card ${activeExperience === i ? 'active' : ''}`} key={item.id} role="button" tabIndex={0}
        aria-expanded={activeExperience === i} aria-controls={`experience-${item.id}`} aria-label={item.organization[lang]}
        onClick={() => setActiveExperience(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveExperience(i) } }}>
        <div className="experience-collapsed" aria-hidden={activeExperience === i}><div className={`experience-logo logo-${i}`}>{marks[i]}</div><h3>{item.role[lang]}</h3></div>
        <div className="experience-expanded" id={`experience-${item.id}`} aria-hidden={activeExperience !== i}>
          <div className="experience-watermark" aria-hidden="true">{marks[i]}</div>
          <div className="experience-copy"><div className="experience-organization"><h3>{item.organization[lang]}</h3><p>{item.subtitle[lang]}</p></div>
          <div className="experience-role"><strong>{item.role[lang]}</strong><span>{item.period[lang]}</span></div>
          <ul>{item.description[lang].map(line => <li key={line}><span aria-hidden="true" /><span>{line}</span></li>)}</ul>
          <div className="experience-tags">{item.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</div></div>
        </div>
      </article>)}</div>
    </section>
    <section className="home-skills" id="skill-brick-section">
      <div className="skills-copy" data-reveal-group="80">{(['development', 'design'] as const).map(category => <div className="skill-category" key={category}>
        <h3>{category === 'development' ? ui(lang, '开发', 'Development', '開発', '개발') : ui(lang, '设计', 'Design', 'デザイン', '디자인')}</h3>
        <div className="skill-groups">{data.skills.filter(group => group.category === category).map(group => <div className="skill-group" key={group.label.en}><h4>{group.label[lang]}</h4><div className="skill-tags">{group.items.map(name => <span className={`skill-pill ${group.proficient.includes(name) ? 'proficient' : 'familiar'}`} key={name}><SkillIcon name={name} /><span>{skillLabel(name, lang)}</span></span>)}</div></div>)}</div>
      </div>)}<div className="skills-legend"><span><i className="legend-proficient" />{ui(lang, '熟练', 'Proficient', '熟練', '능숙')}</span><span><i className="legend-familiar" />{ui(lang, '有经验', 'Experienced', '経験あり', '경험 있음')}</span></div></div>
      <div className="brick-column" data-reveal="scale"><BrickGame lang={lang} onProgress={onProgress} onThemeAdvance={onThemeAdvance} skills={gameSkills} /></div>
    </section>
  </>
}
