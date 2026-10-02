import type { CSSProperties, ReactNode } from 'react'
import type { Lang, SiteData } from '../types'
import icons from '../skill-icons.json'

export const ui = (lang: Lang, zh: string, en: string, ja: string, ko: string) => ({ zh, en, ja, ko })[lang]

const skillTranslations: Record<string, Record<Lang, string>> = {
  '游戏开发': { zh: '游戏开发', en: 'Game development', ja: 'ゲーム開発', ko: '게임 개발' },
  '机器学习': { zh: '机器学习', en: 'Machine learning', ja: '機械学習', ko: '머신 러닝' },
  '数据科学': { zh: '数据科学', en: 'Data science', ja: 'データサイエンス', ko: '데이터 과학' },
  '计算机图形学': { zh: '计算机图形学', en: 'Computer graphics', ja: 'コンピュータグラフィックス', ko: '컴퓨터 그래픽스' },
  '软件工程': { zh: '软件工程', en: 'Software engineering', ja: 'ソフトウェア工学', ko: '소프트웨어 공학' },
  'Web 开发': { zh: 'Web 开发', en: 'Web development', ja: 'Web 開発', ko: '웹 개발' },
  '信号处理': { zh: '信号处理', en: 'Signal processing', ja: '信号処理', ko: '신호 처리' },
  '计算机视觉': { zh: '计算机视觉', en: 'Computer vision', ja: 'コンピュータビジョン', ko: '컴퓨터 비전' },
  '移动端开发': { zh: '移动端开发', en: 'Mobile development', ja: 'モバイル開発', ko: '모바일 개발' },
  '数据库管理': { zh: '数据库管理', en: 'Database management', ja: 'データベース管理', ko: '데이터베이스 관리' },
  '战斗设计': { zh: '战斗设计', en: 'Combat design', ja: '戦闘デザイン', ko: '전투 디자인' },
  '系统设计': { zh: '系统设计', en: 'System design', ja: 'システムデザイン', ko: '시스템 디자인' },
  'UI/UX 设计': { zh: 'UI/UX 设计', en: 'UI/UX design', ja: 'UI/UX デザイン', ko: 'UI/UX 디자인' },
  '关卡设计': { zh: '关卡设计', en: 'Level design', ja: 'レベルデザイン', ko: '레벨 디자인' },
}

export const skillLabel = (name: string, lang: Lang): string => skillTranslations[name]?.[lang] ?? name

export function Avatar({ className = '' }: { className?: string }) {
  return <span className={`art-avatar ${className}`} aria-hidden="true" />
}

export function SkillIcon({ name }: { name: string }) {
  const icon = (icons as Record<string, { mask?: string; className?: string; size?: number }>)[name]
  if (!icon) return null
  return icon.mask ? <span className="skill-vector" style={{ width: icon.size || 20, height: icon.size || 20, maskImage: `url(${icon.mask})`, WebkitMaskImage: `url(${icon.mask})` } as CSSProperties} aria-hidden="true" /> : <i className={icon.className} aria-hidden="true" />
}

export function SocialLinks({ github }: { github: string }) {
  return <div className="social-links">
    <span className="social-placeholder" title="LinkedIn · 待补充" aria-label="LinkedIn · not configured"><i className="fa-brands fa-linkedin-in" aria-hidden="true" /></span>
    <a aria-label="GitHub" href={github} target="_blank" rel="noreferrer"><i className="fa-brands fa-github" aria-hidden="true" /></a>
    <span className="social-placeholder" title="YouTube · 待补充" aria-label="YouTube · not configured"><i className="fa-brands fa-youtube" aria-hidden="true" /></span>
    <span className="social-placeholder" title="Bilibili · 待补充" aria-label="Bilibili · not configured"><i className="fa-brands fa-bilibili" aria-hidden="true" /></span>
  </div>
}

export function SiteFooter({ data, lang }: { data: SiteData; lang: Lang }) {
  return <footer className="site-footer" id="page-footer">
    <div className="footer-layout" data-reveal-group="110">
      <div className="footer-intro"><Avatar /><div className="footer-about">
        <div><h3>{ui(lang, '关于我', 'About me', '私について', '소개')}</h3><p>{data.about[lang]}</p></div>
        <a className="footer-more" href={`/${lang}/aboutme/`}>{ui(lang, '了解更多', 'Learn more', 'もっと見る', '더 알아보기')}<i className="fa-solid fa-arrow-right" aria-hidden="true" /></a>
      </div></div>
      <div className="footer-navigation"><nav aria-label={ui(lang, '页脚导航', 'Footer navigation', 'フッターナビゲーション', '하단 탐색')}>
        <a href={`/${lang}/`}><i className="fa-solid fa-chevron-right" aria-hidden="true" /><span>{ui(lang, '首页', 'Home', 'ホーム', '홈')}</span></a>
        <a href={`/${lang}/portfolio/`}><i className="fa-solid fa-chevron-right" aria-hidden="true" /><span>{ui(lang, '作品集', 'Portfolio', 'ポートフォリオ', '포트폴리오')}</span></a>
        <a href={`/${lang}/aboutme/`}><i className="fa-solid fa-chevron-right" aria-hidden="true" /><span>{ui(lang, '关于我', 'About me', '私について', '소개')}</span></a>
      </nav><div className="footer-social"><SocialLinks github={data.profile.github} /></div></div>
    </div>
    <div className="footer-copyright" data-reveal="fade">© {new Date().getFullYear()} MVChem. {ui(lang, '保留所有权利。', 'All rights reserved.', '無断転載を禁じます。', '모든 권리 보유.')}</div>
  </footer>
}

export function Tag({ children }: { children: ReactNode }) { return <span className="brutalist-tag">{children}</span> }
