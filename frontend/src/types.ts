export type Lang = 'zh' | 'en'
export type Localized = Record<Lang, string>
export interface Experience {
  id: string; role: Localized; organization: Localized; period: Localized;
  description: Record<Lang, string[]>; tags: string[]; color: string; ink: string; mark: string;
}
export interface Project {
  id: string; title: Localized; subtitle: Localized; description: Localized;
  tags: string[]; kind: 'orbit' | 'garden' | 'play'; color: string; ink: string;
}
export interface SiteData {
  profile: { name: string; github: string; tagline: Localized; intro: Record<Lang, string[]> };
  experiences: Experience[]; projects: Project[];
  skills: { label: Localized; items: string[] }[];
  about: Localized;
}
