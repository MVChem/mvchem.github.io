export type Lang = 'zh' | 'en' | 'ja' | 'ko'
export type Localized = Record<Lang, string>
export type LocalizedParagraphs = Record<Lang, string[]>
export interface Experience {
  id: string; role: Localized; organization: Localized; subtitle: Localized; period: Localized;
  description: Record<Lang, string[]>; tags: string[]; color: string; ink: string; mark: string;
}
export interface Project {
  id: string; title: Localized; subtitle: Localized; description: Localized;
  tags: string[]; kind: 'orbit' | 'garden' | 'play'; color: string; ink: string;
  categoryIds: string[]; year: string; role: Localized;
  details: {heading: Localized; paragraphs: LocalizedParagraphs}[];
}
export interface SkillGroup {
  category: 'development' | 'design'; label: Localized; items: string[]; proficient: string[];
}
export interface SiteData {
  profile: {
    name: string; github: string; tagline: Localized; subheading: Localized;
    intro: LocalizedParagraphs; heroLines: LocalizedParagraphs; heroTags: LocalizedParagraphs;
    stats: {value: Localized; label: Localized; icon: 'projects' | 'games' | 'awards' | 'education'}[];
  };
  experiences: Experience[]; projects: Project[];
  skills: SkillGroup[];
  about: Localized;
  portfolio: {intro: LocalizedParagraphs; categories: {id: string; title: Localized; description: Localized; color: string; projectIds: string[]}[]};
  aboutPage: {greeting: Localized; intro: LocalizedParagraphs; sections: {id: string; title: Localized; tags: LocalizedParagraphs; description: Localized; kind: 'play' | 'read' | 'build'}[]};
}
